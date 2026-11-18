import sys
import json
import requests
import os


def generate_workflow(url, request_body: dict):
    """
    Generate workflow by calling the workstation data parsing service.
    
    Args:
        url: The API endpoint URL
        request_body: Request body containing experiment steps and plan name
        
    Returns:
        dict: Response data from the service
        
    Raises:
        Exception: If the API returns an error
    """
    headers = {
        "Content-Type": "application/json"
    }
    
    # Send POST request with JSON data
    response = requests.post(url, json=request_body, headers=headers)
    response.raise_for_status()
    
    result = response.json()
    
    # Check if the response contains an error
    if result.get("code") != 200:
        raise Exception(result.get("message", "Unknown error occurred"))
    
    return result


def validate_experiment_steps(steps):
    """
    Validate the structure of experiment steps.
    
    Args:
        steps: List of experiment step objects
        
    Returns:
        bool: True if valid, raises exception otherwise
    """
    if not isinstance(steps, list):
        raise ValueError("experiment_steps.steps must be an array")
    
    for step in steps:
        if "step_number" not in step:
            raise ValueError("Each step must have a step_number")
        if "workstation" not in step:
            raise ValueError("Each step must have a workstation")
        if "operation" not in step:
            raise ValueError("Each step must have an operation")
        
        # Validate step_number is a positive integer
        if not isinstance(step["step_number"], int) or step["step_number"] <= 0:
            raise ValueError(f"step_number must be a positive integer, got: {step['step_number']}")
    
    return True


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python generate.py '<JSON>'")
        print("\nExample:")
        print('python generate.py \'{"experiment_steps": {"steps": [{"step_number": 1, "workstation": "物料站", "id":1427568512205824, "operation": "物料拿取", "parameters": {"容器类型": "进样瓶", "容器编号": [1, 2]}}], "unknown_steps": null}, "plan_name": "test_plan"}\'')
        sys.exit(1)
    
    query = sys.argv[1]
    parse_data = {}
    
    try:
        parse_data = json.loads(query)
        print(f"Successfully parsed request body")
    except json.JSONDecodeError as e:
        print(f"JSON parse error: {e}")
        sys.exit(1)
    
    # Validate required fields
    if "experiment_steps" not in parse_data:
        print("Error: experiment_steps must be present in request body.")
        sys.exit(1)
    
    if "steps" not in parse_data["experiment_steps"]:
        print("Error: experiment_steps.steps must be present in request body.")
        sys.exit(1)
    
    if "plan_name" not in parse_data:
        print("Error: plan_name must be present in request body.")
        sys.exit(1)
    
    # Validate experiment steps structure
    try:
        validate_experiment_steps(parse_data["experiment_steps"]["steps"])
    except ValueError as e:
        print(f"Validation error: {e}")
        sys.exit(1)
    
    # Get token from environment variable or request body
    token = os.environ.get("AICHEM_APP_TOKEN", "")
    
    # Build request body
    request_body = {
        "experiment_steps": parse_data["experiment_steps"],
        "plan_name": parse_data["plan_name"]
    }
    if token:
        request_body["token"] = token
    
    # API endpoint host:port from environment variable (without scheme), defaulting to original value if not set
    host_port = os.environ.get("WORKFLOW_SERVICE_URL", "192.168.90.243:8009")
    api_url = f"http://{host_port.rstrip('/')}/parse_workstation"
    
    try:
        result = generate_workflow(api_url, request_body)
        print(json.dumps(result, indent=2, ensure_ascii=False))
        
        # Print template_id for easy access
        if result.get("code") == 200 and result.get("data") and "template_id" in result["data"]:
            print(f"\n✓ Workflow generated successfully!")
            print(f"Template ID: {result['data']['template_id']}")
            print(f"Please use this ID to view the workflow on the platform.")
    except requests.exceptions.RequestException as e:
        print(f"Network error: {str(e)}")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {str(e)}")
        sys.exit(1)
