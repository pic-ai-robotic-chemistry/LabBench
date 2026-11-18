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
logger = setup_logger('select_template_list')


def select_cloud_list(app_label: str, app_token: str, params: dict, size: int) -> dict:
    script_name = 'select_template_list.py'
    result_data = {}

    try:
        headers = {
            "apptoken": app_token,
            "appLabel": app_label
        }

        params_copy = params.copy()
        params_copy["size"] = size
        params_copy["sort"] = "createTime"

        url = f"{CONFIG['aichem_cloud_gateway']}/proxy/hwcloud/manager/localPlan/getCloudModelTemplateList"
        
        # 记录请求信息
        log_api_request(logger, script_name, url, method="GET", params=params_copy, headers=headers)
        
        start_time = time.time()
        response = requests.get(url, params=params_copy, headers=headers, timeout=CONFIG["request_timeout"])
        elapsed_time = time.time() - start_time

        # 记录响应信息
        try:
            response_data = response.json()
        except:
            response_data = None
        log_api_response(logger, script_name, response.status_code, response_data, elapsed_time)

        if response.status_code != 200:
            logger.warning(f"HTTP状态码异常: {response.status_code}")
            result_data["data"] = f"查找目标实验室:{app_label}的ai模板列表信息失败,接口访问错误，请及时反馈至运维人员，协调解决此问题"
            return result_data

        api_response = response.json()

        if api_response.get("code") == 401:
            logger.warning("登录信息已过期")
            result_data["data"] = "登录信息已过期，请重新登录"
            return result_data

        if api_response.get("code") != 200:
            logger.warning(f"业务接口请求异常: {api_response.get('message')}")
            result_data["data"] = f"业务接口请求异常，异常信息：{api_response.get('message')}"
            return result_data

        field_configs = {
            "id": {"name": "id"},
            "name": {"name": "模板名称"},
            "createUserName": {"name": "创建人"},
            "createTime": {"name": "创建时间"},
            "enable": {
                "name": "状态",
                "converter": lambda v: "启用" if v == 1 else "禁用" if isinstance(v, int) else v
            }
        }

        add_data = {"数据来源": "AI模型生成"}
        data_list = api_response.get("data", [])
        adapted_data = adapter_data(data_list, field_configs, add_data)

        result_data["data"] = adapted_data
        result_data["total"] = api_response.get("total", 0)
        logger.info(f"AI模板查询成功 - 获取{len(adapted_data)}条数据，总计{result_data['total']}条")
        return result_data

    except Exception as e:
        log_error(logger, script_name, e, "请求AI模板列表失败")
        result_data["data"] = f"请求失败: {str(e)}"
        return result_data


def select_local_list(app_label: str, app_token: str, params: dict, size: int) -> dict:
    script_name = 'select_template_list.py'
    result_data = {}

    try:
        headers = {
            "apptoken": app_token,
            "appLabel": app_label
        }

        params_copy = params.copy()
        params_copy["size"] = size
        params_copy["sort"] = "sort"

        url = f"{CONFIG['aichem_cloud_gateway']}/proxy/hwcloud/manager/template/list"
        
        # 记录请求信息
        log_api_request(logger, script_name, url, method="GET", params=params_copy, headers=headers)
        
        start_time = time.time()
        response = requests.get(url, params=params_copy, headers=headers, timeout=CONFIG["request_timeout"])
        elapsed_time = time.time() - start_time

        # 记录响应信息
        try:
            response_data = response.json()
        except:
            response_data = None
        log_api_response(logger, script_name, response.status_code, response_data, elapsed_time)

        if response.status_code != 200:
            logger.warning(f"HTTP状态码异常: {response.status_code}")
            result_data["data"] = f"查找目标实验室:{app_label}的本地模板列表信息失败,接口访问错误，请及时反馈至运维人员，协调解决此问题"
            return result_data

        api_response = response.json()

        if api_response.get("code") == 401:
            logger.warning("登录信息已过期")
            result_data["data"] = "登录信息已过期，请重新登录"
            return result_data

        if api_response.get("code") != 200:
            logger.warning(f"业务接口请求异常: {api_response.get('message')}")
            result_data["data"] = f"业务接口请求异常，异常信息：{api_response.get('message')}"
            return result_data

        field_configs = {
            "id": {"name": "id"},
            "name": {"name": "模板名称"},
            "createUserName": {"name": "创建人"},
            "createTime": {"name": "创建时间"},
            "enable": {
                "name": "状态",
                "converter": lambda v: "启用" if v == 1 else "禁用" if isinstance(v, int) else v
            }
        }

        add_data = {"数据来源": "人工创建"}
        data_list = api_response.get("data", [])
        adapted_data = adapter_data(data_list, field_configs, add_data)

        result_data["data"] = adapted_data
        result_data["total"] = api_response.get("total", 0)
        logger.info(f"本地模板查询成功 - 获取{len(adapted_data)}条数据，总计{result_data['total']}条")
        return result_data

    except Exception as e:
        log_error(logger, script_name, e, "查询人工生成模板列表接口请求失败")
        result_data["data"] = f"查询人工生成模板列表接口请求失败: {str(e)}"
        return result_data


def select_template_list(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    create_user_name: Optional[str] = None,
    enable: Optional[int] = None,
    source_type: Optional[int] = None,
    name: Optional[str] = None,
    template_id: Optional[str] = None,
    app_label: str = None,
    size: int = 10
) -> dict:
    script_name = 'select_template_list.py'
    
    # 记录函数调用
    log_function_call(logger, script_name, 'select_template_list',
                     start_date=start_date, end_date=end_date,
                     create_user_name=create_user_name, enable=enable,
                     source_type=source_type, name=name,
                     template_id=template_id, app_label=app_label, size=size)

    params = {
        "startDate": start_date,
        "endDate": end_date,
        "createUserName": create_user_name,
        "enable": enable,
        "name": name,
        "id": template_id,
        "permissionStatus": "1"
    }

    params = {k: v for k, v in params.items() if v is not None}

    app_token = CONFIG["app_token"]

    try:
        if source_type is None or source_type == 0:
            cloud_result = select_cloud_list(app_label, app_token, params, size)
            cloud_data = cloud_result.get("data")

            if not isinstance(cloud_data, list):
                return {
                    "success": False,
                    "message": cloud_data
                }

            cloud_total = cloud_result.get("total", 0)

            if size > cloud_total:
                local_result = select_local_list(app_label, app_token, params, size - cloud_total)
                local_data = local_result.get("data")

                if not isinstance(local_data, list):
                    return {
                        "success": False,
                        "message": local_data
                    }

                cloud_data.extend(local_data)
                local_total = local_result.get("total", 0)
                total = cloud_total + local_total

                if total == 0:
                    return {
                        "success": True,
                        "message": "暂无数据",
                        "data": [],
                        "total": 0
                    }

                if size > total:
                    return {
                        "success": True,
                        "data": cloud_data,
                        "total": total
                    }
                else:
                    return {
                        "success": True,
                        "data": cloud_data,
                        "total": total,
                        "message": f"当前展示{len(cloud_data)}条数据，共{total}条数据。如未找到所需内容，请增加查询条件以缩小搜索范围。"
                    }
            else:
                return {
                    "success": True,
                    "data": cloud_data,
                    "total": cloud_total,
                    "message": f"当前展示{len(cloud_data)}条数据，共{cloud_total}条数据。如未找到所需内容，请增加查询条件以缩小搜索范围。"
                }

        elif source_type == 1:
            local_result = select_local_list(app_label, app_token, params, size)
            local_data = local_result.get("data")

            if not isinstance(local_data, list):
                return {
                    "success": False,
                    "message": local_data
                }

            local_total = local_result.get("total", 0)

            if local_total == 0:
                return {
                    "success": True,
                    "message": "暂无数据",
                    "data": [],
                    "total": 0
                }

            if size > local_total:
                return {
                    "success": True,
                    "data": local_data,
                    "total": local_total
                }
            else:
                return {
                    "success": True,
                    "data": local_data,
                    "total": local_total,
                    "message": f"当前展示{len(local_data)}条数据，共{local_total}条数据。如未找到所需内容，请增加查询条件以缩小搜索范围。"
                }

        elif source_type == 2:
            cloud_result = select_cloud_list(app_label, app_token, params, size)
            cloud_data = cloud_result.get("data")

            if not isinstance(cloud_data, list):
                return {
                    "success": False,
                    "message": cloud_data
                }

            cloud_total = cloud_result.get("total", 0)

            if cloud_total == 0:
                return {
                    "success": True,
                    "message": "暂无数据",
                    "data": [],
                    "total": 0
                }

            if size > cloud_total:
                return {
                    "success": True,
                    "data": cloud_data,
                    "total": cloud_total
                }
            else:
                return {
                    "success": True,
                    "data": cloud_data,
                    "total": cloud_total,
                    "message": f"当前展示{len(cloud_data)}条数据，共{cloud_total}条数据。如未找到所需内容，请增加查询条件以缩小搜索范围。"
                }

        else:
            return {
                "success": False,
                "message": "查询条件任务来源错误，请正确传入任务来源"
            }

    except json.JSONDecodeError as e:
        log_error(logger, script_name, e, "JSON解析异常")
        return {
            "success": False,
            "message": f"查询模板列表请求失败: {str(e)}"
        }
    except Exception as e:
        log_error(logger, script_name, e, "请求失败")
        return {
            "success": False,
            "message": f"请求失败: {str(e)}"
        }


def main():
    parser = argparse.ArgumentParser(description='查询实验模板列表')
    parser.add_argument('--app-label', type=str, required=True, help='目标实验室标签')
    parser.add_argument('--start-date', type=str, help='实验开始时间（格式：yyyy-MM-dd HH:mm:ss）')
    parser.add_argument('--end-date', type=str, help='实验结束时间（格式：yyyy-MM-dd HH:mm:ss）')
    parser.add_argument('--create-user-name', type=str, help='实验创建者')
    parser.add_argument('--enable', type=int, help='模板状态(1:启用，0:禁用)')
    parser.add_argument('--source-type', type=int, help='任务来源(0:全部, 1:人工创建, 2:AI生成)')
    parser.add_argument('--name', type=str, help='模板名称')
    parser.add_argument('--template-id', type=str, help='实验模板id')
    parser.add_argument('--size', type=int, default=10, help='每页查询条数，默认10条')
    args = parser.parse_args()

    result = select_template_list(
        start_date=args.start_date,
        end_date=args.end_date,
        create_user_name=args.create_user_name,
        enable=args.enable,
        source_type=args.source_type,
        name=args.name,
        template_id=args.template_id,
        app_label=args.app_label,
        size=args.size
    )

    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
