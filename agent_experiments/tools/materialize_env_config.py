#!/usr/bin/env python3

from __future__ import annotations

import argparse
import os
import re
from pathlib import Path
from typing import Any

import yaml


ENV_PATTERN = re.compile(r"\$\{([A-Za-z_][A-Za-z0-9_]*)\}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Expand ${ENV_VAR} placeholders in a Harbor YAML config.")
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--allow-missing", action="store_true")
    return parser.parse_args()


def expand_string(raw: str, *, allow_missing: bool) -> str:
    missing: list[str] = []

    def repl(match: re.Match[str]) -> str:
        key = match.group(1)
        if key in os.environ:
            return os.environ[key]
        missing.append(key)
        return match.group(0)

    expanded = ENV_PATTERN.sub(repl, raw)
    if missing and not allow_missing:
        names = ", ".join(sorted(set(missing)))
        raise KeyError(f"Missing environment variables for config expansion: {names}")
    return expanded


def expand_value(value: Any, *, allow_missing: bool) -> Any:
    if isinstance(value, str):
        return expand_string(value, allow_missing=allow_missing)
    if isinstance(value, list):
        return [expand_value(item, allow_missing=allow_missing) for item in value]
    if isinstance(value, dict):
        return {key: expand_value(item, allow_missing=allow_missing) for key, item in value.items()}
    return value


def main() -> int:
    args = parse_args()
    payload = yaml.safe_load(args.input.read_text(encoding="utf-8")) or {}
    expanded = expand_value(payload, allow_missing=args.allow_missing)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        yaml.safe_dump(expanded, sort_keys=False, allow_unicode=True),
        encoding="utf-8",
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
