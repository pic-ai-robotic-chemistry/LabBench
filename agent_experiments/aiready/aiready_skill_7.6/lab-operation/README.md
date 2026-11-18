# 智能科学家实验室操作 - 技术文档

智能科学家系统（原机器化学家）实验室自动化工具包，用于执行实验任务管理、模板查询、工作站管理、实验室鉴权等操作。

## 前置条件

- Python 3.8+
- 已安装依赖：`pip install requests`
- 所有脚本需在 `scripts/` 目录下执行，或使用完整路径调用

## 环境配置

所有脚本共享 `scripts/config.py` 中的配置，部署时需根据实际环境修改：

```python
CONFIG = {
    "aichem_cloud_gateway": "http://10.88.0.119:9090",   # 云网关地址（内网）
    "app_token": "YOUR_APP_TOKEN",                    # 应用令牌
    "user_id": "",                                         # 用户ID（下发任务时使用，可为空）
    "user_name": "",                                       # 用户名（下发任务时使用，可为空）
    "request_timeout": 30,                                 # HTTP 请求超时时间（秒）
}
```

| 配置项 | 说明 | 是否必填 |
|--------|------|----------|
| `aichem_cloud_gateway` | 云网关地址，默认为内网地址 | 是 |
| `app_token` | 应用鉴权令牌 | 是 |
| `user_id` | 用户ID，用于下发任务时标识操作人 | 否（为空则不发送） |
| `user_name` | 用户名，用于下发任务时标识操作人 | 否（为空则不发送） |
| `request_timeout` | HTTP 请求超时时间（秒） | 否（默认 30） |

---

## 模块 1：实验室鉴权

### 1.1 获取当前实验室标签

```bash
python scripts/get_current_lab_label.py
```

**返回字段**：

| 字段 | 类型 | 说明 |
|------|------|------|
| success | bool | 操作是否成功 |
| message | string | 操作结果信息 |
| app_label | string | 当前实验室标签 |

### 1.2 验证实验室一致性

```bash
python scripts/check_lab_consistency.py --app-label 303Lab
```

**参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| --app-label | string | 是 | 目标实验室标签，如 `303Lab`、`centerLab` 等 |

**返回字段**：

| 字段 | 类型 | 说明 |
|------|------|------|
| success | bool | 验证是否通过 |
| message | string | 验证结果信息 |

---

## 模块 2：实验任务管理

### 2.1 下发实验任务

根据实验方案模板下发任务到实验室。

```bash
# 基本用法
python scripts/generate_task.py \
  --template-id template_123 \
  --template-source-label 303Lab \
  --app-label 303Lab

# 从总控向边缘实验室下发任务
python scripts/generate_task.py \
  --template-id tpl_456 \
  --template-source-label centerLab \
  --app-label 303Lab
```

**参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| --template-id | string | 是 | 实验方案模板ID，可通过 `select_template_list.py` 查询获取 |
| --template-source-label | string | 是 | 模板来源实验室标签 |
| --app-label | string | 是 | 目标实验室标签 |

**返回字段**：

| 字段 | 类型 | 说明 |
|------|------|------|
| success | bool | 操作是否成功 |
| message | string | 操作结果信息 |
| task_id | string | 生成的实验任务ID |
| task_name | string | 生成的实验任务名称 |
| app_label | string | 目标实验室标签 |

### 2.2 启动实验任务

根据任务ID启动已下发的实验任务。

```bash
python scripts/start_task.py --task-id task_123 --app-label 303Lab
```

**参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| --task-id | string | 是 | 实验任务ID |
| --app-label | string | 是 | 目标实验室标签 |

**返回字段**：

| 字段 | 类型 | 说明 |
|------|------|------|
| success | bool | 操作是否成功 |
| message | string | 操作结果信息 |
| task_id | string | 启动的任务ID |

### 2.3 查询实验任务列表

查询目标实验室的实验任务列表，支持多种过滤条件。

```bash
# 查询所有任务
python scripts/select_task_list.py --app-label 303Lab

# 查询进行中的任务
python scripts/select_task_list.py --app-label 303Lab --status 200

# 查询特定用户创建的任务
python scripts/select_task_list.py --app-label 303Lab --create-user-name "张三"

# 查询时间范围内的任务
python scripts/select_task_list.py --app-label 303Lab \
  --start-date "2024-01-01 00:00:00" \
  --end-date "2024-12-31 23:59:59"

# 组合查询
python scripts/select_task_list.py --app-label 303Lab \
  --status 200 --task-name "测试" --size 50
```

**参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| --app-label | string | 是 | 目标实验室标签 |
| --start-date | string | 否 | 实验开始时间，格式：`yyyy-MM-dd HH:mm:ss` |
| --end-date | string | 否 | 实验结束时间，格式：`yyyy-MM-dd HH:mm:ss` |
| --create-user-name | string | 否 | 实验创建者名称，支持模糊匹配 |
| --status | int | 否 | 实验状态，见下表 |
| --task-name | string | 否 | 任务名称，支持模糊匹配 |
| --template-name | string | 否 | 模板名称，支持模糊匹配 |
| --task-id | string | 否 | 实验任务ID |
| --size | int | 否 | 每页查询条数，默认 10 |

**任务状态码**：

| 状态码 | 说明 |
|--------|------|
| 0 | 未开始 |
| 99 | 排队中 |
| 100 | 待执行 |
| 200 | 进行中 |
| 230 | 已挂起 |
| 260 | 错误 |
| 300 | 已完成 |
| 360 | 已过期 |
| 370 | 已取消 |
| 400 | 已终止 |

### 2.4 获取任务执行结果

查询已完成的实验任务的执行结果，返回各工作站生成的结果文件URL。

```bash
python scripts/get_task_result.py --task-id task_123 --app-label 303Lab
```

**参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| --task-id | string | 是 | 实验任务ID |
| --app-label | string | 是 | 目标实验室标签，用于获取文件服务前缀 |

**返回字段**：

| 字段 | 类型 | 说明 |
|------|------|------|
| success | bool | 操作是否成功 |
| message | string | 结果描述（含工作站数量和文件数量） |
| workstations[] | array | 各工作站结果列表 |
| workstations[].workstationName | string | 工作站名称 |
| workstations[].workstationTypeName | string | 工作站类型 |
| workstations[].files[] | array | 该工作站的结果文件列表 |
| workstations[].files[].url | string | 完整可访问的文件URL（已拼接文件服务前缀） |

---

## 模块 3：实验模板查询

```bash
# 查询所有模板
python scripts/select_template_list.py --app-label 303Lab

# 查询AI生成的模板
python scripts/select_template_list.py --app-label 303Lab --source-type 2

# 查询人工创建的模板
python scripts/select_template_list.py --app-label 303Lab --source-type 1

# 查询启用状态的模板
python scripts/select_template_list.py --app-label 303Lab --enable 1

# 按名称模糊查询
python scripts/select_template_list.py --app-label 303Lab --name "合成"

# 组合查询
python scripts/select_template_list.py --app-label 303Lab \
  --source-type 2 --enable 1 --size 50
```

**参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| --app-label | string | 是 | 目标实验室标签 |
| --start-date | string | 否 | 创建开始时间，格式：`yyyy-MM-dd HH:mm:ss` |
| --end-date | string | 否 | 创建结束时间，格式：`yyyy-MM-dd HH:mm:ss` |
| --create-user-name | string | 否 | 模板创建者名称 |
| --enable | int | 否 | 模板状态：`1`=启用，`0`=禁用 |
| --source-type | int | 否 | 模板来源，见下表 |
| --name | string | 否 | 模板名称，支持模糊匹配 |
| --template-id | string | 否 | 实验模板ID |
| --size | int | 否 | 每页查询条数，默认 10 |

**模板来源**：

| 值 | 说明 |
|-----|------|
| 0 | 全部（默认） |
| 1 | 仅人工创建的模板 |
| 2 | 仅AI生成的模板 |

---

## 模块 4：工作站管理

### 4.1 查询工作站实例列表

```bash
# 查询所有工作站
python scripts/select_workstation_list.py --app-label 303Lab

# 查询空闲状态的工作站
python scripts/select_workstation_list.py --app-label 303Lab --status 200

# 按工作站类型查询
python scripts/select_workstation_list.py --app-label 303Lab \
  --workstation-type-name "离心机"

# 组合查询
python scripts/select_workstation_list.py --app-label 303Lab \
  --status 200 --workstation-type-name "离心机" --size 20
```

**参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| --app-label | string | 是 | 目标实验室标签 |
| --workstation-name | string | 否 | 工作站实例名称，支持模糊匹配 |
| --workstation-type-name | string | 否 | 工作站类型名称 |
| --model-name | string | 否 | 工作站型号名称 |
| --status | int | 否 | 工作站状态，见下表 |
| --size | int | 否 | 每页查询条数，默认 10 |

**工作站状态码**：

| 状态码 | 说明 |
|--------|------|
| 100 | 未激活 |
| 200 | 空闲 |
| 300 | 错误 |
| 400 | 离线 |
| 500 | 忙碌 |
| 600 | 充电中 |

### 4.2 查询工作站类型列表

```bash
# 查询所有工作站类型
python scripts/select_workstation_type_list.py --app-label 303Lab

# 按类型名称查询
python scripts/select_workstation_type_list.py --app-label 303Lab --name "离心机"

# 查询平台预定义的类型
python scripts/select_workstation_type_list.py --app-label 303Lab --definer 0

# 查询自定义的类型
python scripts/select_workstation_type_list.py --app-label 303Lab --definer 1
```

**参数**：

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| --app-label | string | 是 | 目标实验室标签 |
| --name | string | 否 | 类型名称，支持模糊匹配 |
| --definer | int | 否 | 数据来源：`0`=平台预定义，`1`=自定义 |
| --update-time-start | string | 否 | 更新时间起始 |
| --update-time-end | string | 否 | 更新时间结束 |
| --size | int | 否 | 每页查询条数，默认 10 |

**类型分组**：

| 英文编码 | 中文名称 |
|----------|----------|
| Performance Test | 测试类 |
| Characterization | 表征类 |
| Sample Rack | 样品架类 |
| Synthesis | 合成类 |
| ai_calculation | 智能计算 |
| iteration-experiment | 迭代实验 |
| auto-calculation | 自动计算 |

---

## 完整调用示例

### 示例 1：下发并启动实验任务

```bash
# Step 1: 获取当前实验室
python scripts/get_current_lab_label.py

# Step 2: 验证权限
python scripts/check_lab_consistency.py --app-label 303Lab

# Step 3: 查询可用模板
python scripts/select_template_list.py --app-label 303Lab --enable 1

# Step 4: 下发任务（使用查询到的模板ID）
python scripts/generate_task.py \
  --template-id tpl_xxx \
  --template-source-label 303Lab \
  --app-label 303Lab

# Step 5: 启动任务（使用返回的task_id）
python scripts/start_task.py --task-id task_xxx --app-label 303Lab

# Step 6: 查询任务状态
python scripts/select_task_list.py --app-label 303Lab --task-id task_xxx

# Step 7: 获取任务执行结果（任务完成后）
python scripts/get_task_result.py --task-id task_xxx --app-label 303Lab
```

### 示例 2：查询实验室资源状态

```bash
# 查询所有空闲工作站
python scripts/select_workstation_list.py --app-label 303Lab --status 200

# 查询所有合成类工作站类型
python scripts/select_workstation_type_list.py --app-label 303Lab --name "合成"

# 查询最近完成的实验任务
python scripts/select_task_list.py --app-label 303Lab --status 300 --size 10
```

---

## 错误处理

| 错误 | 原因 | 处理 |
|------|------|------|
| `success: false` | 操作失败 | 查看 `message` 字段获取详细错误信息 |
| 权限验证失败 | 当前实验室无法操作目标实验室 | 确认 `app_label` 是否正确 |
| 模板不存在 | 模板ID错误或已删除 | 使用 `select_template_list.py` 重新查询 |
| 任务状态不允许启动 | 任务不在"待执行"状态 | 使用 `select_task_list.py` 查询任务当前状态 |

---

## 注意事项

- 所有脚本都依赖 `requests` 库，请确保已安装
- 实验室标签格式通常为 `303Lab`、`centerLab` 等驼峰命名
- 时间参数格式统一为 `yyyy-MM-dd HH:mm:ss`
- 模糊匹配参数支持部分字符串匹配
- 查询结果默认返回 10 条记录，可通过 `--size` 调整

---

## 文件清单

| 文件 | 说明 |
|------|------|
| [scripts/config.py](scripts/config.py) | 公共配置（网关地址、令牌、超时等） |
| [scripts/utils.py](scripts/utils.py) | 公共工具函数（数据适配） |
| [scripts/get_current_lab_label.py](scripts/get_current_lab_label.py) | 获取当前实验室标签 |
| [scripts/check_lab_consistency.py](scripts/check_lab_consistency.py) | 验证实验室一致性 |
| [scripts/generate_task.py](scripts/generate_task.py) | 下发实验任务 |
| [scripts/start_task.py](scripts/start_task.py) | 启动实验任务 |
| [scripts/select_task_list.py](scripts/select_task_list.py) | 查询实验任务列表 |
| [scripts/get_task_result.py](scripts/get_task_result.py) | 获取任务执行结果 |
| [scripts/select_template_list.py](scripts/select_template_list.py) | 查询实验模板列表 |
| [scripts/select_workstation_list.py](scripts/select_workstation_list.py) | 查询工作站实例列表 |
| [scripts/select_workstation_type_list.py](scripts/select_workstation_type_list.py) | 查询工作站类型列表 |
