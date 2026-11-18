#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import requests
import urllib.parse
import json
import argparse
import time
from config import CONFIG
from logger_config import setup_logger, log_api_request, log_api_response, log_function_call, log_error

# 初始化日志记录器
logger = setup_logger('generate_task')


def generate_task(template_id: str, template_source_label: str, app_label: str) -> dict:
    script_name = 'generate_task.py'
    
    # 记录函数调用
    log_function_call(logger, script_name, 'generate_task', 
                     template_id=template_id, 
                     template_source_label=template_source_label, 
                     app_label=app_label)
    
    params = {
        "templateId": template_id,
        "executionMode": "0"
    }

    headers = {
        "apptoken": CONFIG["app_token"],
        "appLabel": app_label,
        "templateSourceLabel": template_source_label,
        "Content-Type": "application/json;charset=UTF-8"
    }

    if CONFIG["user_id"]:
        headers["userId"] = CONFIG["user_id"]
    if CONFIG["user_name"]:
        headers["userName"] = urllib.parse.quote(CONFIG["user_name"])

    try:
        url = f"{CONFIG['aichem_cloud_gateway']}/proxy/aichem/v2/autoCreateTask"
        
        # 记录请求信息
        log_api_request(logger, script_name, url, method="GET", params=params, headers=headers)
        
        start_time = time.time()
        response = requests.get(url, params=params, headers=headers, timeout=CONFIG["request_timeout"])
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
                "message": f"下发目标实验室:{app_label}的任务失败,接口访问错误，请及时反馈至运维人员"
            }

        api_response = response.json()

        if api_response.get("code") == 401:
            logger.warning("登录信息已过期")
            return {
                "success": False,
                "message": "登录信息已过期，请重新登录"
            }

        if api_response.get("code") != 200:
            logger.warning(f"业务接口请求异常: {api_response.get('message')}")
            return {
                "success": False,
                "message": f"业务接口请求异常，异常信息：{api_response.get('message')}"
            }

        if api_response.get("data") is None:
            logger.warning("业务接口返回数据为空")
            return {
                "success": False,
                "message": "业务接口返回数据为空"
            }

        task_info = api_response["data"]
        task_id = task_info.get('taskId')
        task_name = task_info.get('taskName')
        
        logger.info(f"任务下发成功 - task_id: {task_id}, task_name: {task_name}, app_label: {app_label}")
        
        return {
            "success": True,
            "message": f"实验任务已成功下发到实验室。实验任务ID: {task_id}, 任务名称: {task_name}, 目标实验室: {app_label}",
            "task_id": task_id,
            "task_name": task_name,
            "app_label": app_label
        }

    except requests.exceptions.RequestException as e:
        log_error(logger, script_name, e, "请求机器化学家接口异常")
        return {
            "success": False,
            "message": f"请求机器化学家接口异常: {str(e)}"
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
            "message": f"未知异常: {str(e)}"
        }


def main():
    parser = argparse.ArgumentParser(description='下发实验任务')
    parser.add_argument('--template-id', type=str, required=True, help='实验方案模板id')
    parser.add_argument('--template-source-label', type=str, required=True, help='模板来源实验室标签')
    parser.add_argument('--app-label', type=str, required=True, help='目标实验室标签')
    args = parser.parse_args()

    result = generate_task(args.template_id, args.template_source_label, args.app_label)

    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
