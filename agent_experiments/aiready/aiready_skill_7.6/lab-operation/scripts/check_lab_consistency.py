#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import requests
import json
import argparse
import time
from config import CONFIG
from logger_config import setup_logger, log_api_request, log_api_response, log_function_call, log_error

# 初始化日志记录器
logger = setup_logger('check_lab_consistency')


def check_lab_consistency(app_label: str) -> dict:
    script_name = 'check_lab_consistency.py'
    
    # 记录函数调用
    log_function_call(logger, script_name, 'check_lab_consistency', app_label=app_label)
    
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
                "message": f"tool内部错误，无法向{app_label}实验室进行操作"
            }

        api_response = response.json()

        if api_response.get("code") == 200:
            data = api_response.get("data", {})
            app_token_app_label = data.get("appLabel", "")
            is_center = data.get("isCenter", False)
            
            logger.info(f"Token解析成功 - appLabel: {app_token_app_label}, isCenter: {is_center}")

            if not app_label or app_token_app_label == app_label:
                logger.info(f"验证成功 - 目标实验室: {app_label}")
                return {
                    "success": True,
                    "message": f"验证成功，可以向{app_label}实验室进行操作"
                }

            if is_center and app_token_app_label != app_label:
                logger.info(f"中心实验室验证成功 - Token实验室: {app_token_app_label}, 目标实验室: {app_label}")
                return {
                    "success": True,
                    "message": f"验证成功，可以向{app_label}实验室进行操作"
                }

            if app_label and not is_center and app_token_app_label != app_label:
                logger.warning(f"实验室不匹配 - Token实验室: {app_token_app_label}, 目标实验室: {app_label}")
                return {
                    "success": False,
                    "message": f"当前实验室是{app_token_app_label}，无法向{app_label}实验室进行操作"
                }

            logger.warning(f"验证失败 - 未知情况")
            return {
                "success": False,
                "message": f"目标实验室标签和实验室令牌不匹配，无法向{app_label}实验室进行操作"
            }
        else:
            logger.warning(f"API返回code异常: {api_response.get('code')}")
            return {
                "success": False,
                "message": f"tool内部错误，无法向{app_label}实验室进行操作"
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
    parser = argparse.ArgumentParser(description='验证实验室一致性工具')
    parser.add_argument('--app-label', type=str, required=True, help='目标实验室标签')
    args = parser.parse_args()

    result = check_lab_consistency(args.app_label)
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
