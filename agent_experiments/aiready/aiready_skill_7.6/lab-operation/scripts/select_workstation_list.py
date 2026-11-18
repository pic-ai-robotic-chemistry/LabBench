#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import requests
import json
import argparse
import time
from typing import Optional
from config import CONFIG
from utils import adapter_data
from logger_config import setup_logger, log_api_request, log_api_response, log_function_call, log_error

# 初始化日志记录器
logger = setup_logger('select_workstation_list')

WORKSTATION_STATUS_MAP = {
    100: "未激活",
    200: "空闲",
    300: "错误",
    400: "离线",
    500: "忙碌",
    600: "充电中"
}


def select_workstation_list(
    workstation_name: Optional[str] = None,
    workstation_type_name: Optional[str] = None,
    model_name: Optional[str] = None,
    status: Optional[int] = None,
    app_label: str = None,
    size: int = 10
) -> dict:
    script_name = 'select_workstation_list.py'
    
    # 记录函数调用
    log_function_call(logger, script_name, 'select_workstation_list',
                     workstation_name=workstation_name,
                     workstation_type_name=workstation_type_name,
                     model_name=model_name, status=status,
                     app_label=app_label, size=size)

    params = {
        "workstationName": workstation_name,
        "workstationTypeName": workstation_type_name,
        "modelName": model_name,
        "status": status,
        "size": size
    }

    params = {k: v for k, v in params.items() if v is not None}

    headers = {
        "apptoken": CONFIG["app_token"],
        "appLabel": app_label
    }

    try:
        url = f"{CONFIG['aichem_cloud_gateway']}/proxy/hwcloud/worker/workstation/list"
        
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
                "message": f"查找目标实验室:{app_label}的工作站实例列表信息失败,接口访问错误，请及时反馈至运维人员，协调解决此问题"
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

        field_configs = {
            "id": {"name": "id"},
            "workstationName": {"name": "实例名称"},
            "workstationCode": {"name": "类型编码"},
            "workstationTypeName": {"name": "实例类型名称"},
            "workstationTypeCode": {"name": "实例类型编码"},
            "modelName": {"name": "实例型号名称"},
            "modelCode": {"name": "实例型号编码"},
            "createTime": {"name": "创建时间"},
            "status": {
                "name": "状态",
                "converter": lambda v: WORKSTATION_STATUS_MAP.get(v, v) if v is not None else ""
            }
        }

        data_list = api_response.get("data", [])
        total = api_response.get("total", 0)

        if total == 0:
            logger.info(f"查询成功 - 暂无数据")
            return {
                "success": True,
                "message": "暂无数据",
                "data": [],
                "total": 0
            }

        adapted_data = adapter_data(data_list, field_configs)
        logger.info(f"查询成功 - 获取{len(adapted_data)}条数据，总计{total}条")

        if size > total:
            return {
                "success": True,
                "data": adapted_data,
                "total": total
            }
        else:
            return {
                "success": True,
                "data": adapted_data,
                "total": total,
                "message": f"当前展示{len(adapted_data)}条数据，共{total}条数据。如未找到所需内容，请增加查询条件以缩小搜索范围。"
            }

    except requests.exceptions.RequestException as e:
        log_error(logger, script_name, e, "查看工作站列表接口失败")
        return {
            "success": False,
            "message": f"查看工作站列表接口失败: {str(e)}"
        }
    except json.JSONDecodeError as e:
        log_error(logger, script_name, e, "JSON解析异常")
        return {
            "success": False,
            "message": f"响应解析异常: {str(e)}"
        }
    except Exception as e:
        log_error(logger, script_name, e, "查看工作站列表接口失败")
        return {
            "success": False,
            "message": f"查看工作站列表接口失败: {str(e)}"
        }


def main():
    parser = argparse.ArgumentParser(description='查询工作站实例列表')
    parser.add_argument('--app-label', type=str, required=True, help='目标实验室标签')
    parser.add_argument('--workstation-name', type=str, help='工作站实例名称')
    parser.add_argument('--workstation-type-name', type=str, help='工作站类型名称')
    parser.add_argument('--model-name', type=str, help='工作站型号名称')
    parser.add_argument('--status', type=int, help='工作站实例状态(100:未激活,200:空闲,300:错误,400:离线,500:忙碌,600:充电中)')
    parser.add_argument('--size', type=int, default=10, help='每页查询条数，默认10条')
    args = parser.parse_args()

    result = select_workstation_list(
        workstation_name=args.workstation_name,
        workstation_type_name=args.workstation_type_name,
        model_name=args.model_name,
        status=args.status,
        app_label=args.app_label,
        size=args.size
    )

    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
