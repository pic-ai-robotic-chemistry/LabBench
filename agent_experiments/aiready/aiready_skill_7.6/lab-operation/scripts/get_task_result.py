#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import requests
import json
import argparse
import time
from config import CONFIG
from logger_config import setup_logger, log_api_request, log_api_response, log_function_call, log_error

# 初始化日志记录器
logger = setup_logger('get_task_result')


def get_file_url_prefix(app_label: str) -> str:
    """
    通过 appLabel 从认证服务获取文件 URL 前缀
    """
    try:
        url = f"{CONFIG['aichem_cloud_gateway']}/auth/appKey/getIpByAppLabel"
        token = CONFIG["app_token"]
        resp = requests.get(
            url,
            params={"appLabel": app_label},
            headers={"apptoken": token},
            timeout=CONFIG["request_timeout"]
        )
        data = resp.json()
        if data.get("code") == 200 and data.get("data"):
            return data["data"].rstrip("/")
    except Exception as e:
        logger.warning(f"获取文件URL前缀失败: {e}")
    return ""


def get_task_result(task_id: str, app_label: str) -> dict:
    """
    获取实验任务执行完成后的结果数据

    Args:
        task_id: 实验任务ID
        app_label: 实验室标签（用于获取文件URL前缀）

    Returns:
        dict: 包含任务结果的字典
    """
    script_name = 'get_task_result.py'

    # 记录函数调用
    log_function_call(logger, script_name, 'get_task_result', task_id=task_id, app_label=app_label)

    if not task_id:
        logger.warning("任务id为空")
        return {
            "success": False,
            "message": "任务id不能为空"
        }

    # 复用统一网关和 token
    token = CONFIG["app_token"]
    headers = {
        "apptoken": token,
        "appLabel": app_label,
    }

    try:
        url = f"{CONFIG['aichem_cloud_gateway']}/proxy/hwcloud/worker/expr-result/instance/data"
        params = {"taskId": task_id}

        # 记录请求信息
        log_api_request(logger, script_name, url, method="GET", params=params, headers=headers)

        start_time = time.time()
        response = requests.get(url, params=params, headers=headers, timeout=CONFIG["request_timeout"])
        elapsed_time = time.time() - start_time

        # 记录响应信息
        try:
            response_data = response.json()
        except Exception:
            response_data = None
        log_api_response(logger, script_name, response.status_code, response_data, elapsed_time)

        if response.status_code != 200:
            logger.warning(f"HTTP状态码异常: {response.status_code}")
            return {
                "success": False,
                "message": f"请求失败，HTTP 状态码：{response.status_code}"
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

        raw_data = api_response.get("data")
        if raw_data is None:
            logger.info("任务结果数据为空")
            return {
                "success": True,
                "message": "暂无结果数据",
                "data": None
            }

        task_results = raw_data.get("taskResults", [])

        # 获取文件 URL 前缀
        file_url_prefix = get_file_url_prefix(app_label)
        logger.info(f"文件URL前缀: {file_url_prefix}")

        # 整理结果：按工作站聚合文件列表
        workstations = []
        total_file_count = 0
        for item in task_results:
            files = []
            for r in item.get("result", []):
                raw_url = r.get("url") or ""
                full_url = f"{file_url_prefix}{raw_url}" if file_url_prefix and raw_url else raw_url
                files.append({"url": full_url})
            total_file_count += len(files)
            workstations.append({
                "workstationName": item.get("workstationName"),
                "workstationTypeName": item.get("workstationTypeName"),
                "files": files
            })

        workstation_count = len(workstations)
        logger.info(f"获取任务结果成功 - task_id: {task_id}, 共 {workstation_count} 个工作站，{total_file_count} 个结果文件")

        return {
            "success": True,
            "message": f"获取任务结果成功，共 {workstation_count} 个工作站，{total_file_count} 个结果文件",
            "workstations": workstations
        }

    except requests.exceptions.RequestException as e:
        log_error(logger, script_name, e, "获取任务结果失败")
        return {
            "success": False,
            "message": f"获取任务结果接口请求异常: {str(e)}"
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
            "message": f"获取任务结果异常: {str(e)}"
        }


def main():
    parser = argparse.ArgumentParser(description='获取实验任务执行结果')
    parser.add_argument('--task-id', type=str, required=True, help='实验任务ID')
    parser.add_argument('--app-label', type=str, required=True, help='实验室标签')
    args = parser.parse_args()

    result = get_task_result(args.task_id, args.app_label)
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
