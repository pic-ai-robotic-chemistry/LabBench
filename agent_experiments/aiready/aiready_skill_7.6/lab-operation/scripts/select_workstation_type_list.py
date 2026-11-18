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
logger = setup_logger('select_workstation_type_list')

CATEGORY_MAP = {
    "Performance Test": "测试类",
    "Characterization": "表征类",
    "Sample Rack": "样品架类",
    "Synthesis": "合成类",
    "ai_calculation": "智能计算",
    "iteration-experiment": "迭代实验",
    "auto-calculation": "自动计算"
}


def select_workstation_type_list(
    name: Optional[str] = None,
    definer: Optional[int] = None,
    update_time_start: Optional[str] = None,
    update_time_end: Optional[str] = None,
    app_label: str = None,
    size: int = 10
) -> dict:
    script_name = 'select_workstation_type_list.py'
    
    # 记录函数调用
    log_function_call(logger, script_name, 'select_workstation_type_list',
                     name=name, definer=definer,
                     update_time_start=update_time_start,
                     update_time_end=update_time_end,
                     app_label=app_label, size=size)

    params = {
        "name": name,
        "definer": definer,
        "updateTimeStart": update_time_start,
        "updateTimeEnd": update_time_end,
        "size": size
    }

    params = {k: v for k, v in params.items() if v is not None}

    headers = {
        "apptoken": CONFIG["app_token"],
        "appLabel": app_label
    }

    try:
        url = f"{CONFIG['aichem_cloud_gateway']}/proxy/hwcloud/worker/workstation/type/page"
        
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
                "message": f"查找目标实验室:{app_label}的工作站类型列表信息失败,接口访问错误，请及时反馈至运维人员，协调解决此问题"
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
            "name": {"name": "类型名称"},
            "code": {"name": "类型编码"},
            "createTime": {"name": "创建时间"},
            "category": {
                "name": "类型分组",
                "converter": lambda v: CATEGORY_MAP.get(v, v) if v is not None else ""
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
        log_error(logger, script_name, e, "查看工作站类型接口失败")
        return {
            "success": False,
            "message": f"查看工作站类型接口失败: {str(e)}"
        }
    except json.JSONDecodeError as e:
        log_error(logger, script_name, e, "JSON解析异常")
        return {
            "success": False,
            "message": f"响应解析异常: {str(e)}"
        }
    except Exception as e:
        log_error(logger, script_name, e, "查看工作站类型接口失败")
        return {
            "success": False,
            "message": f"查看工作站类型接口失败: {str(e)}"
        }


def main():
    parser = argparse.ArgumentParser(description='查询工作站类型列表')
    parser.add_argument('--app-label', type=str, required=True, help='目标实验室标签')
    parser.add_argument('--name', type=str, help='类型名称')
    parser.add_argument('--definer', type=int, help='数据来源（0：平台，1：自定义）')
    parser.add_argument('--update-time-start', type=str, help='更新时间起始时间查询条件')
    parser.add_argument('--update-time-end', type=str, help='更新时间结束时间查询条件')
    parser.add_argument('--size', type=int, default=10, help='每页查询条数，默认10条')
    args = parser.parse_args()

    result = select_workstation_type_list(
        name=args.name,
        definer=args.definer,
        update_time_start=args.update_time_start,
        update_time_end=args.update_time_end,
        app_label=args.app_label,
        size=args.size
    )

    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
