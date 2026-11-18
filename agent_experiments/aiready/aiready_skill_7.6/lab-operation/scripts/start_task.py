#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import requests
import json
import argparse
from config import CONFIG
from logger_config import setup_logger, log_function_call, log_error

# 初始化日志记录器
logger = setup_logger('start_task')


def start_task(task_id: str, app_label: str) -> dict:
    script_name = 'start_task.py'
    
    # 记录函数调用
    log_function_call(logger, script_name, 'start_task', task_id=task_id, app_label=app_label)
    
    if not task_id:
        logger.warning("任务id为空")
        return {
            "success": False,
            "message": "任务id不能为空"
        }

    # ===== 模拟执行模式 - 不实际调用API =====
    # 注意：以下代码已注释掉原始API调用逻辑，当前为模拟执行模式
    # 如需恢复真实执行，请取消注释以下代码并注释掉模拟执行部分
    
    # headers = {
    #     "apptoken": CONFIG["app_token"],
    #     "appLabel": app_label
    # }
    #
    # try:
    #     url = f"{CONFIG['aichem_cloud_gateway']}/proxy/hwcloud/manager/task/info/make/start?id={task_id}"
    #     response = requests.post(url, headers=headers, timeout=CONFIG["request_timeout"])
    #
    #     if response.status_code != 200:
    #         return {
    #             "success": False,
    #             "message": f"请求失败，HTTP 状态码：{response.status_code}"
    #         }
    #
    #     api_response = response.json()
    #
    #     if api_response.get("code") == 401:
    #         return {
    #             "success": False,
    #             "message": "登录信息已过期，请重新登录"
    #         }
    #
    #     if api_response.get("code") != 200:
    #         return {
    #             "success": False,
    #             "message": f"业务接口请求异常，异常信息：{api_response.get('message')}"
    #         }
    #
    #     if api_response.get("data") is None:
    #         return {
    #             "success": False,
    #             "message": "业务接口返回数据为空"
    #         }
    #
    #     return {
    #         "success": True,
    #         "message": f"实验任务已启动,实验任务ID: {task_id}",
    #         "task_id": task_id
    #     }
    #
    # except requests.exceptions.RequestException as e:
    #     return {
    #         "success": False,
    #         "message": f"启动任务接口请求异常: {str(e)}"
    #     }
    # except json.JSONDecodeError as e:
    #     return {
    #         "success": False,
    #         "message": f"响应解析异常: {str(e)}"
    #     }
    # except Exception as e:
    #     return {
    #         "success": False,
    #         "message": f"启动任务接口请求异常: {str(e)}"
    #     }

    # 模拟执行模式 - 不实际调用API
    logger.info(f"[模拟模式] 准备启动实验任务 (任务ID: {task_id}, 实验室标签: {app_label})")
    logger.info("[模拟模式] 验证任务参数...")
    logger.info("[模拟模式] 检查实验室状态...")
    logger.info("[模拟模式] 模拟启动任务流程...")
    
    # 模拟返回成功结果
    logger.info(f"[模拟模式] 任务启动成功 - task_id: {task_id}")
    return {
        "success": True,
        "message": f"[模拟] 实验任务已启动,实验任务ID: {task_id}",
        "task_id": task_id,
        "mode": "simulation"
    }


def main():
    parser = argparse.ArgumentParser(description='启动实验任务')
    parser.add_argument('--task-id', type=str, required=True, help='实验任务id')
    parser.add_argument('--app-label', type=str, required=True, help='目标实验室标签')
    args = parser.parse_args()

    result = start_task(args.task_id, args.app_label)

    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
