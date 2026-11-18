---
name: lab-operation
description: 智能科学家系统（原机器化学家）实验室自动化操作技能。适用于：获取实验室信息、验证操作权限、管理实验任务（查询/下发/启动）、查询实验模板、查询工作站信息及类型、获取任务执行结果。当用户需要操作智能科学家/机器化学家系统执行实验时使用本技能。
---

# 智能科学家实验室操作

智能科学家系统（原机器化学家）实验室自动化操作技能。适用于：获取实验室信息、验证操作权限、管理实验任务（查询/下发/启动）、查询实验模板、查询工作站信息及类型、获取任务执行结果。当用户需要操作智能科学家/机器化学家系统执行实验时使用本技能。

## 触发关键词

- 实验室操作、智能科学家、机器化学家、实验任务
- 下发任务、启动实验、查询任务
- 实验模板、工作站、实验室权限
- 303实验室、中心实验室、总控实验室、边缘实验室
- 任务结果、实验结果、执行结果、查看结果

---

## 核心概念

### 实验室类型与权限

| 类型 | 标签 | 权限 |
|------|------|------|
| **总控实验室** | `centerLab` | 可向边缘实验室下发任务，可存/查模板，**不能**自己执行实验 |
| **边缘实验室** | `303Lab`等 | 可自己下发并执行任务，可接收总控下发的任务，**不能**操作其他实验室 |

> **重要**：标签仅用于系统调用，对用户输出使用"显示名称"（如"303实验室"）。

### 实验模板

实验模板是智能科学家系统中的实验流程定义，串联多个工作站步骤（如：拿物料 → 加液 → 搅拌 → 清洗 → 纯化 → 置物）。

- **模板来源**：人工创建 或 AI生成（由其他 Skill 负责生成）
- **参数状态**：可能已填写具体参数，也可能只是大致流程
- **标识**：每个模板有唯一的 `template_id`

### 实验任务

实验任务是基于模板下发到边缘实验室的可执行实例。

- **下发方式**：
  - 边缘实验室自己下发到本实验室
  - 总控实验室下发到边缘实验室
- **标识**：每个任务有唯一的 `task_id`

---

## 标准工作流程

1. **获取当前实验室**：`get_current_lab_label.py`
2. **验证权限**（目标≠当前时）：`check_lab_consistency.py --app-label <target>`
3. **执行操作**：
   - 查询模板 → `select_template_list.py`
   - 下发任务 → `generate_task.py`
   - 启动任务 → `start_task.py`
   - 查询任务 → `select_task_list.py`
   - 查询工作站 → `select_workstation_list.py`
   - 查询工作站类型 → `select_workstation_type_list.py`
   - 获取任务结果 → `get_task_result.py`

> **约束**：目标≠当前实验室时必须先验证权限；对用户输出使用实验室名称而非标签。

---

## 脚本调用

### 实验室鉴权

```bash
# 获取当前实验室标签
python scripts/get_current_lab_label.py

# 验证实验室一致性
python scripts/check_lab_consistency.py --app-label 303Lab
```

### 实验任务管理

```bash
# 下发实验任务
python scripts/generate_task.py --template-id <id> --template-source-label <lab> --app-label <lab>

# 启动实验任务
python scripts/start_task.py --task-id <id> --app-label <lab>

# 查询任务列表
python scripts/select_task_list.py --app-label <lab> [--status <code>] [--task-name <name>]
```

### 实验模板查询

```bash
python scripts/select_template_list.py --app-label <lab> [--source-type <type>] [--enable <1|0>]
```

### 工作站管理

```bash
# 查询工作站实例
python scripts/select_workstation_list.py --app-label <lab> [--status <code>]

# 查询工作站类型
python scripts/select_workstation_type_list.py --app-label <lab> [--name <type>]
```

### 任务结果查询

```bash
# 获取任务执行结果
python scripts/get_task_result.py --task-id <task_id> --app-label <lab>
```

详细参数说明、状态码、错误处理等请参考 [README.md](README.md)
