import os

CONFIG = {
    "aichem_cloud_gateway": os.environ.get("AICHEM_CLOUD_GATEWAY", ""),
    "app_token": os.environ.get("AICHEM_APP_TOKEN", ""),
    "user_id": "science_claw",
    "user_name": "scienceClaw",
    "request_timeout": 30,
}
