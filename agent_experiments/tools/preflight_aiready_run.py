#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import os
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any

try:
    import yaml
except ModuleNotFoundError:
    venv_python = Path(__file__).resolve().parent.parent / ".venv" / "bin" / "python"
    if venv_python.exists() and Path(sys.executable).resolve() != venv_python.resolve():
        os.execv(str(venv_python), [str(venv_python), *sys.argv])
    raise


PLACEHOLDER_VALUES = {
    "",
    "replace-with-experiment-api-key",
    "replace-with-experiment-model-id",
    "replace-with-judge-api-key",
    "replace-with-judge-model-id",
    "https://replace-with-compatible-experiment-endpoint/v1",
    "https://replace-with-compatible-judge-endpoint/v1",
    "replace-with-harbor-username",
    "replace-with-harbor-password",
    "replace-with-registry-host",
    "replace-with-registry-username",
    "replace-with-registry-password",
    "replace-with-aichem-auth-service-url",
    "replace-with-aichem-cloud-gateway",
    "Bearer replace-with-aichem-app-token",
    "replace-with-workflow-host-port",
    "replace-with-task-verify-endpoint",
    "Bearer replace-with-verify-token",
    "replace-me",
}
ENV_REF_PATTERN = re.compile(r"\$\{([A-Za-z_][A-Za-z0-9_]*)\}")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Preflight AIREADY Harbor configs before model runs.")
    parser.add_argument("--config", type=Path, action="append", required=True)
    parser.add_argument("--report-out", type=Path, required=True)
    parser.add_argument("--skip-api-key-check", action="store_true")
    parser.add_argument("--skip-aichem-check", action="store_true")
    return parser.parse_args()


def is_placeholder(value: str | None) -> bool:
    return value is None or value.strip() in PLACEHOLDER_VALUES


def walk_values(value: Any) -> list[str]:
    if isinstance(value, str):
        return [value]
    if isinstance(value, list):
        out: list[str] = []
        for item in value:
            out.extend(walk_values(item))
        return out
    if isinstance(value, dict):
        out: list[str] = []
        for item in value.values():
            out.extend(walk_values(item))
        return out
    return []


def collect_referenced_env_vars(config_path: Path) -> set[str]:
    payload = yaml.safe_load(config_path.read_text(encoding="utf-8")) or {}
    referenced: set[str] = set()
    for value in walk_values(payload):
        referenced.update(ENV_REF_PATTERN.findall(value))
    return referenced


def should_require_env_var(name: str) -> bool:
    if name.startswith("AIREADY_") and name.endswith("_API_KEY"):
        return True
    if name.startswith("AIREADY_") and name.endswith("_MODEL_NAME"):
        return True
    return name.endswith("_BASE_URL") or name in {"OPENAI_BASE_URL"}


def collect_image_refs(config_path: Path) -> list[str]:
    payload = yaml.safe_load(config_path.read_text(encoding="utf-8")) or {}
    images: list[str] = []
    for dataset in payload.get("datasets") or []:
        dataset_path = Path(str(dataset.get("path") or ""))
        if not dataset_path.exists():
            continue
        for task_toml in dataset_path.glob("*/task.toml"):
            for line in task_toml.read_text(encoding="utf-8", errors="replace").splitlines():
                stripped = line.strip()
                if stripped.startswith("docker_image") and "=" in stripped:
                    image = stripped.split("=", 1)[1].strip().strip('"')
                    if image:
                        images.append(image)
    return sorted(set(images))


def normalize_url(raw: str) -> str:
    value = raw.strip().rstrip("/")
    if value and not value.startswith(("http://", "https://")):
        value = "http://" + value
    return value


def request_json(url: str, *, headers: dict[str, str], timeout: float) -> dict[str, Any]:
    request = urllib.request.Request(url, headers=headers, method="GET")
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            text = response.read().decode("utf-8", errors="replace")
            return {
                "ok": 200 <= int(response.status) < 300,
                "status_code": int(response.status),
                "body": json.loads(text),
            }
    except urllib.error.HTTPError as exc:
        text = exc.read().decode("utf-8", errors="replace")
        try:
            body: Any = json.loads(text)
        except json.JSONDecodeError:
            body = text[:1000]
        return {"ok": False, "status_code": int(exc.code), "body": body}


def check_aichem_lab_permission() -> dict[str, Any] | None:
    token = os.environ.get("AICHEM_APP_TOKEN") or os.environ.get("WORKFLOW_TOKEN")
    gateway_raw = os.environ.get("AICHEM_CLOUD_GATEWAY") or os.environ.get("AUTH_SERVICE_URL")
    target_label = (os.environ.get("AICHEM_TARGET_APP_LABEL") or "303Lab").strip()
    if is_placeholder(token) or is_placeholder(gateway_raw) or is_placeholder(target_label):
        return None
    gateway = normalize_url(str(gateway_raw))
    timeout = float(os.environ.get("AICHEM_TIMEOUT_SEC") or "60")
    try:
        response = request_json(
            gateway + "/auth/parseAppToken",
            headers={"apptoken": str(token)},
            timeout=timeout,
        )
    except Exception as exc:
        return {
            "scope": "aichem",
            "message": "failed to validate AICHEM lab permission",
            "detail": str(exc),
        }
    body = response.get("body")
    if not response.get("ok") or not isinstance(body, dict) or body.get("code") != 200:
        return {
            "scope": "aichem",
            "message": "failed to parse AICHEM token lab label",
            "detail": {"status_code": response.get("status_code"), "body": body},
        }
    data = body.get("data")
    if not isinstance(data, dict):
        return {
            "scope": "aichem",
            "message": "AICHEM token parse response did not include lab metadata",
            "detail": {"status_code": response.get("status_code")},
        }
    current_label = str(data.get("appLabel") or "").strip()
    is_center = bool(data.get("isCenter"))
    if target_label and current_label != target_label and not is_center:
        return {
            "scope": "aichem",
            "message": "AICHEM target lab is not permitted by current token",
            "detail": {
                "current_app_label": current_label,
                "target_app_label": target_label,
                "is_center": is_center,
                "hint": "Set AICHEM_TARGET_APP_LABEL to a permitted lab or provide a center/target-lab token.",
            },
        }
    return None


def main() -> int:
    args = parse_args()
    findings: list[dict[str, Any]] = []
    checked_images: set[str] = set()

    if not args.skip_api_key_check:
        referenced_vars: set[str] = set()
        for config_path in args.config:
            if config_path.exists():
                referenced_vars.update(collect_referenced_env_vars(config_path))
        for key in sorted(name for name in referenced_vars if should_require_env_var(name)):
            if is_placeholder(os.environ.get(key)):
                findings.append(
                    {
                        "scope": "env",
                        "message": "missing or placeholder required environment variable",
                        "detail": key,
                    }
                )

    for config_path in args.config:
        if not config_path.exists():
            findings.append(
                {"scope": "config", "message": "config file missing", "detail": str(config_path)}
            )
            continue
        for image in collect_image_refs(config_path):
            checked_images.add(image)
            # Do not shell out here; this preflight stays fast and deterministic.
            if "${" in image:
                findings.append(
                    {
                        "scope": "image",
                        "message": "unexpanded variable in docker image reference",
                        "detail": image,
                    }
                )

    if not args.skip_aichem_check:
        finding = check_aichem_lab_permission()
        if finding is not None:
            findings.append(finding)

    payload = {
        "ok": not findings,
        "n_findings": len(findings),
        "checked_configs": [str(path) for path in args.config],
        "checked_images": sorted(checked_images),
        "findings": findings,
    }
    args.report_out.parent.mkdir(parents=True, exist_ok=True)
    args.report_out.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    if findings:
        print(json.dumps(payload, indent=2, ensure_ascii=False))
        return 1
    print(f"[ok] AIREADY preflight passed: {args.report_out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
