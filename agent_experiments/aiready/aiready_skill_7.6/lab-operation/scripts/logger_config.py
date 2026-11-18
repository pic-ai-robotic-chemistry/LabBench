#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
日志配置模块
提供统一的日志记录功能，所有日志文件保存到 /home/ubuntu/logs/skill-lab-operation/
"""

import logging
import os
from datetime import datetime
from logging.handlers import RotatingFileHandler


# 日志目录配置
LOG_DIR = "/tmp/logs/skill-lab-operation"

# 确保日志目录存在
try:
    os.makedirs(LOG_DIR, exist_ok=True)
except (PermissionError, OSError):
    LOG_DIR = None


def setup_logger(name: str, log_file: str = None, level: int = logging.INFO) -> logging.Logger:
    """
    创建并配置一个日志记录器
    
    Args:
        name: 日志记录器名称（通常为模块名或脚本名）
        log_file: 日志文件名（可选，如果不提供则使用 name.log）
        level: 日志级别
    
    Returns:
        配置好的 logging.Logger 实例
    """
    if log_file is None:
        log_file = f"{name}.log"
    
    # 创建 logger
    logger = logging.getLogger(name)
    logger.setLevel(level)
    
    # 避免重复添加 handler
    if logger.handlers:
        return logger
    
    # 创建格式化器
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # 文件处理器
    if LOG_DIR is not None:
        log_path = os.path.join(LOG_DIR, log_file)
        try:
            file_handler = RotatingFileHandler(
                log_path,
                maxBytes=10*1024*1024,  # 10MB
                backupCount=5,
                encoding='utf-8'
            )
            file_handler.setLevel(level)
            file_handler.setFormatter(formatter)
            logger.addHandler(file_handler)
        except (PermissionError, OSError) as e:
            print(f"[日志错误] 无法创建日志文件 {log_path}: {e}")
    else:
        print("[日志错误] 日志目录不可用")
    
    return logger


def log_api_request(logger: logging.Logger, script_name: str, api_url: str, method: str = "GET", 
                   params: dict = None, headers: dict = None):
    """
    记录 API 请求的详细信息
    
    Args:
        logger: 日志记录器
        script_name: 脚本名称
        api_url: 请求的 URL
        method: 请求方法（GET/POST）
        params: 请求参数
        headers: 请求头
    """
    logger.info(f"脚本 [{script_name}] 发起 API 请求")
    logger.info(f"  - 请求方法: {method}")
    logger.info(f"  - 请求URL: {api_url}")
    if params:
        # 过滤敏感信息
        safe_params = {k: v for k, v in params.items() if k.lower() not in ['token', 'password', 'secret']}
        logger.info(f"  - 请求参数: {safe_params}")
    if headers:
        # 过滤敏感信息
        safe_headers = {k: '***' if k.lower() in ['apptoken', 'token', 'authorization'] else v 
                       for k, v in headers.items()}
        logger.info(f"  - 请求头: {safe_headers}")


def log_api_response(logger: logging.Logger, script_name: str, status_code: int, 
                    response_data: dict = None, elapsed_time: float = None):
    """
    记录 API 响应的详细信息
    
    Args:
        logger: 日志记录器
        script_name: 脚本名称
        status_code: HTTP 状态码
        response_data: 响应数据
        elapsed_time: 请求耗时（秒）
    """
    logger.info(f"脚本 [{script_name}] 收到 API 响应")
    logger.info(f"  - 状态码: {status_code}")
    if elapsed_time is not None:
        logger.info(f"  - 耗时: {elapsed_time:.2f}秒")
    if response_data:
        # 只记录关键信息，避免日志过大
        if isinstance(response_data, dict):
            logger.info(f"  - 响应code: {response_data.get('code', 'N/A')}")
            logger.info(f"  - 响应message: {response_data.get('message', 'N/A')}")


def log_function_call(logger: logging.Logger, script_name: str, function_name: str, 
                     **kwargs):
    """
    记录函数调用的详细信息
    
    Args:
        logger: 日志记录器
        script_name: 脚本名称
        function_name: 函数名称
        **kwargs: 函数参数
    """
    # 过滤敏感信息
    safe_kwargs = {}
    for key, value in kwargs.items():
        if key.lower() in ['token', 'password', 'secret', 'app_token']:
            safe_kwargs[key] = '***'
        else:
            safe_kwargs[key] = value
    
    logger.info(f"脚本 [{script_name}] 调用函数: {function_name}")
    logger.info(f"  - 参数: {safe_kwargs}")


def log_error(logger: logging.Logger, script_name: str, error: Exception, 
             context: str = ""):
    """
    记录错误信息
    
    Args:
        logger: 日志记录器
        script_name: 脚本名称
        error: 异常对象
        context: 错误上下文信息
    """
    logger.error(f"脚本 [{script_name}] 发生错误")
    if context:
        logger.error(f"  - 上下文: {context}")
    logger.error(f"  - 错误类型: {type(error).__name__}")
    logger.error(f"  - 错误信息: {str(error)}")
