---
name: workflow-generator
description: Generate workstation workflow from structured experiment steps. Parses experiment data and creates workflow templates.
---

# Workflow Generator

Generate workstation workflow from structured experiment steps via the workstation data parsing service.

## Prerequisites

### Token Configuration
This skill requires an **AICHEM_APP_TOKEN** environment variable for authentication.

The token should be in the format: `Bearer xxxxxx`

The token is retrieved from the `AICHEM_APP_TOKEN` environment variable; if it is not provided, this service cannot be used.

## Usage

```bash
python3 skills/workflow-generator/scripts/generate.py '<JSON>'
```

## Request Parameters

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| experiment_steps | Object | yes | - | Experiment steps object containing steps array |
| experiment_steps.steps | Array | yes | - | Array of experiment step objects |
| experiment_steps.steps[].step_number | int | yes | - | Step number |
| experiment_steps.steps[].workstation | str | yes | - | Workstation name (e.g., "物料站", "液体进样站") |
| experiment_steps.steps[].operation | str | yes | - | Operation type (e.g., "物料拿取", "加液") |
| experiment_steps.steps[].parameters | Object | no | {} | Operation parameters (varies by workstation) |
| experiment_steps.unknown_steps | Array | no | null | Steps that cannot be parsed |
| plan_name | str | yes | - | Experiment plan name |
| token | str | no | env.AICHEM_APP_TOKEN | Authentication token (overrides env variable) |

## Examples

```bash
# Basic workflow generation
python3 scripts/generate.py '{
    "experiment_steps": {
      "steps": [
        {
      "step_number": 1,
      "workstation": "303物料站",
      "id":1427568512205824,
      "operation": "物料拿取",
      "parameters": {
        "容器类型": "进样瓶",
        "容器数量": 2,
        "容器编号": [1, 2]
      }
    }
      ],
      "unknown_steps": null
    },
    "plan_name": "test_plan"
  }'
```

## Response Format

### Success Response
```json
{
  "code": 200,
  "message": "工作流生成成功，请根据template_id前往平台查看",
  "data": {
    "template_id": "template_id"
  }
}
```

### Error Response
```json
{
  "code": 500,
  "message": "工作站指令解析失败: 错误详情",
  "data": null
}
```

## Notes

1. All container numbers must be positive integers
2. Parameter units must match the field names
3. The service endpoint is: `http://<WORKFLOW_SERVICE_URL>/parse_workstation`. You can configure this by setting the `WORKFLOW_SERVICE_URL` environment variable.

## Current Status

Fully functional.
