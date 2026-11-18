"""Shared response adapter used by the lab-operation query scripts."""
from logger_config import setup_logger, log_function_call

logger = setup_logger("utils")


def adapter_data(data_list, field_configs, add_data=None):
    log_function_call(
        logger, "utils.py", "adapter_data",
        data_list_size=len(data_list) if isinstance(data_list, list) else 0,
        field_configs_count=len(field_configs) if isinstance(field_configs, dict) else 0,
        add_data=add_data,
    )
    if not isinstance(data_list, list) or not data_list:
        return []
    result = []
    for item in data_list:
        if not isinstance(item, dict):
            continue
        new_item = {}
        for source_field, config in field_configs.items():
            value = item.get(source_field)
            converter = config.get("converter")
            if converter and value is not None:
                value = converter(value)
            new_item[config.get("name", source_field)] = value
        if add_data:
            new_item.update(add_data)
        result.append(new_item)
    logger.info("数据转换完成 - 输入%s条，输出%s条", len(data_list), len(result))
    return result
