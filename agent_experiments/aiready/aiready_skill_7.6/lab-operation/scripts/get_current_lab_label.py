#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import requests
import json
import time
from config import CONFIG
from logger_config import setup_logger, log_api_request, log_api_response, log_function_call, log_error

# 初始化日志记录器
logger = setup_logger('get_current_lab_label')


def get_current_lab_label() -> dict:
    script_name = 'get_current_lab_label.py'
    
    # 记录函数调用
    log_function_call(logger, script_name, 'get_current_lab_label')
    
    headers = {
        "apptoken": CONFIG["app_token"]
    }

    try:
        url = f"{CONFIG['aichem_cloud_gateway']}/auth/parseAppToken"
        
        # 记录请求信息
        log_api_request(logger, script_name, url, method="GET", headers=headers)
        
        start_time = time.time()
        response = requests.get(url, headers=headers, timeout=CONFIG["request_timeout"])
        elapsed_time = time.time() - start_time

        # 记录响应信息
        try:
            response_data = response.json()
        except:
            response_data = None
        log_api_response(logger, script_name, response.status_code, response_data, elapsed_time)

        if response.status_code != 200:
            logger.warning(f"HTTP状态码异常: {response.status_code}")
            return {
                "success": False,
                "message": "tool内部错误，无法获取实验室标签"
            }

        api_response = response.json()

        if api_response.get("code") == 200:
            data = api_response.get("data", {})
            app_label = data.get("appLabel", "")
            logger.info(f"获取实验室标签成功 - app_label: {app_label}")
            return {
                "success": True,
                "message": f"当前实验室标签为：{app_label}",
                "app_label": app_label
            }
        else:
            logger.warning(f"API返回code异常: {api_response.get('code')}")
            return {
                "success": False,
                "message": "tool内部错误，无法获取实验室标签"
            }

    except requests.exceptions.RequestException as e:
        log_error(logger, script_name, e, "请求异常")
        return {
            "success": False,
            "message": f"通过云服务解析apptoken异常: {str(e)}"
        }
    except json.JSONDecodeError as e:
        log_error(logger, script_name, e, "JSON解析异常")
        return {
            "success": False,
            "message": f"响应解析异常: {str(e)}"
        }
    except Exception as e:
        log_error(logger, script_name, e, "未知异常")
        return {
            "success": False,
            "message": f"通过云服务解析apptoken异常: {str(e)}"
        }


def main():
    result = get_current_lab_label()
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
