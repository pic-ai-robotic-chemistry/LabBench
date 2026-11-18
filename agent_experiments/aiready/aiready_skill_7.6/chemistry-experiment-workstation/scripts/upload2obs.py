# -*- coding: utf-8 -*-
"""
文件上传脚本 - 上传文件到OBS审核接口
"""

import requests
import os


def upload_file_for_audit(file_path, filename=None):
    """
    上传文件到审核接口
    返回：上传成功后的文件名
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"文件不存在: {file_path}")

    url = 'http://124.71.201.245:9090/validation/plan_check/upload'

    if filename is None:
        filename = os.path.basename(file_path)

    with open(file_path, 'rb') as f:
        files = {'file': (filename, f)}
        response = requests.post(url, files=files)

    # 👇 在这里解析响应，直接返回文件名
    result = response.json()
    if result.get('code') == 200 and result.get('success'):
        file_url_new = result.get('data')
        file_name = os.path.basename(file_url_new)
        print(f"响应内容: {result}")
        print(f"上传成功！文件地址: {file_url_new}")

        return file_url_new  # 直接返回url
    else:
        raise Exception(f"上传失败：{result.get('msg')}")
        print(f"上传失败: {result.get('msg')}")


if __name__ == '__main__':
    import sys

    if len(sys.argv) < 2:
        print("出错：缺少文件路径参数")
        print("示例: python upload2obs_audit.py D:/temp/file.json [custom_filename.json]")
        sys.exit(1)

    file_path = sys.argv[1]
    filename = sys.argv[2] if len(sys.argv) > 2 else None

    try:
        # 现在直接返回 file_name
        file_ulr_new = upload_file_for_audit(file_path, filename)


    except FileNotFoundError as e:
        print(f"错误: {e}")
    except requests.exceptions.RequestException as e:
        print(f"请求异常: {e}")
    except Exception as e:
        print(f"上传失败: {e}")