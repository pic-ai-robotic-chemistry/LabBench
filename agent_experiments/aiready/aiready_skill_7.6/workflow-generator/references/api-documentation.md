# 工作站数据解析服务接口文档

## 接口信息

- **接口路径**: `POST /parse_workstation`
- **接口功能**: 接收结构化的实验步骤，生成工作站指令并上传，返回模板ID
- **服务地址**: `http://<WORKFLOW_SERVICE_URL>/parse_workstation`

## 请求格式

### Content-Type
```
application/json
```

### 请求体结构

```json
{
  "experiment_steps": {
    "steps": [
      {
      "step_number": 1,
      "workstation": "303物料站",
      "id":1427568512205824,
      "operation": "物料拿取",
      "parameters": {
        "容器类型": "进样瓶",
        "容器数量": 2,
        "容器编号": [1, 2]
      }
    }
    ],
    "unknown_steps": null
  },
  "plan_name": "test_plan",
  "token": "Bearer xxxxxx"
}
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| experiment_steps | Object | 是 | 实验步骤对象 |
| experiment_steps.steps | Array | 是 | 实验步骤列表 |
| experiment_steps.steps[].step_number | Integer | 是 | 步骤编号 |
| experiment_steps.steps[].workstation | String | 是 | 工作站名称 |
| experiment_steps.steps[].operation | String | 是 | 操作内容 |
| experiment_steps.steps[].parameters | Object | 否 | 操作参数（根据不同工作站而定） |
| experiment_steps.unknown_steps | Array | 否 | 无法解析的步骤 |
| plan_name | String | 是 | 实验方案名称 |
| token | String | 否 | 认证令牌，可选，如不提供则使用默认token |

## 响应格式

### 成功响应 (code: 200)

```json
{
  "code": 200,
  "message": "工作流生成成功，请根据template_id前往平台查看",
  "data": {
    "template_id": "template_id"
  }
}
```

### 错误响应 (code: 500)

```json
{
  "code": 500,
  "message": "工作站指令解析失败: 错误详情",
  "data": null
}
```

## 工作站类型

### 303物料站
- **操作**: 物料拿取
- **参数**:
  - 容器类型: 字符串 (如 "进样瓶")
  - 容器编号: 整数数组
  - 容器数量: 整数

## 注意事项

1. 所有容器编号必须为正整数
2. 参数中的单位必须与字段名保持一致
3. 步骤编号应该是连续的正整数
4. 不同工作站的参数格式可能不同，请参考具体工作站的文档

## 错误码说明

| 错误码 | 说明 |
|--------|------|
| 200 | 成功 |
| 400 | 请求参数错误 |
| 500 | 服务器内部错误 |
