#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import datetime as dt
import json
import math
import os
import re
import statistics
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from collections import defaultdict
from pathlib import Path
from typing import Any


REPO = Path(__file__).resolve().parents[1]
DEFAULT_INPUT = REPO / "analysis" / "ag_latest_trials_20260604" / "selected_trials.csv"
DEFAULT_OUT_DIR = REPO / "analysis" / "ag_latest_trials_20260604" / "verified_stats"
DEFAULT_ENV = REPO / ".env"

TEXT_ID_PATTERNS = [
    re.compile(
        r"(?i)\b(?:aichem[_-]?)?task[_-]?id\b[\"'\s:=：,-]{1,24}"
        r"([A-Za-z0-9][A-Za-z0-9_.:/-]{1,120})"
    ),
    re.compile(
        r"(?i)\btaskId\b[\"'\s:=：,-]{1,24}"
        r"([A-Za-z0-9][A-Za-z0-9_.:/-]{1,120})"
    ),
    re.compile(
        r"(?:实验任务ID|任务ID|任务id|任务编号)[：:\s,，-]{0,24}"
        r"([A-Za-z0-9][A-Za-z0-9_.:/-]{1,120})"
    ),
]

ID_KEY_RE = re.compile(r"(?i)(?:^|[_-])(?:aichem[_-]?)?task[_-]?id$|^taskId$")
BAD_ID_RE = re.compile(r"^(?:[A-G]\d{2}|303Lab|Laboratory|lab|task|id|none|null|true|false)$", re.I)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Summarize AIREADY trial time/token/success metrics. Success is "
            "computed by extracting reported task IDs and verifying each ID via "
            "the verify_endpoint from .env; each trial counts at most one success, "
            "using the last verified-existing ID in that trial."
        )
    )
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT, help="selected_trials.csv path")
    parser.add_argument("--out-dir", type=Path, default=DEFAULT_OUT_DIR, help="output directory")
    parser.add_argument("--env-file", type=Path, default=DEFAULT_ENV, help=".env file with verify_endpoint")
    parser.add_argument("--verify-endpoint", default=None, help="override verify endpoint")
    parser.add_argument("--verify-param", default="taskId", help="query parameter name when endpoint has no placeholder")
    parser.add_argument("--verify-method", choices=["GET", "POST"], default="GET")
    parser.add_argument("--timeout", type=float, default=20.0, help="verification request timeout seconds")
    parser.add_argument("--sleep", type=float, default=0.0, help="sleep between uncached verify requests")
    parser.add_argument("--limit", type=int, default=None, help="debug limit for input rows")
    parser.add_argument("--cache", type=Path, default=None, help="verification cache JSON path")
    parser.add_argument("--refresh-cache", action="store_true", help="ignore cached verification results")
    parser.add_argument("--no-verify", action="store_true", help="extract IDs and summarize tokens/time without endpoint checks")
    parser.add_argument(
        "--require-data",
        action="store_true",
        help="treat JSON responses with data/result/task fields missing or empty as non-existing",
    )
    parser.add_argument(
        "--header",
        action="append",
        default=[],
        help="extra verification header KEY=VALUE; values may reference ${ENV_VAR}",
    )
    return parser.parse_args()


def load_env(path: Path) -> dict[str, str]:
    env: dict[str, str] = {}
    if not path.exists():
        return env
    for raw_line in path.read_text(encoding="utf-8", errors="replace").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip()
        if (value.startswith('"') and value.endswith('"')) or (value.startswith("'") and value.endswith("'")):
            value = value[1:-1]
        env[key] = os.path.expandvars(value)
    return env


def coerce_float(value: Any) -> float | None:
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    try:
        number = float(text)
    except ValueError:
        return None
    if math.isnan(number) or math.isinf(number):
        return None
    return number


def coerce_int(value: Any) -> int | None:
    number = coerce_float(value)
    if number is None:
        return None
    return int(number)


def read_json(path: Path) -> Any | None:
    try:
        return json.loads(path.read_text(encoding="utf-8", errors="replace"))
    except Exception:
        return None


def clean_task_id(value: Any) -> str | None:
    if value is None or isinstance(value, (dict, list, tuple, set)):
        return None
    text = str(value).strip().strip("\"'`“”‘’[]{}(),，。;；")
    if not text:
        return None
    parts = text.split()
    if not parts:
        return None
    text = parts[0].strip().strip("\"'`“”‘’[]{}(),，。;；")
    if not text or len(text) < 2 or len(text) > 128:
        return None
    if BAD_ID_RE.match(text):
        return None
    if text.startswith("${") or text.startswith("<"):
        return None
    if "/" in text and not re.fullmatch(r"[A-Za-z0-9_.:-]+", text):
        return None
    return text


def add_occurrence(occurrences: list[dict[str, str]], task_id: Any, source: str) -> None:
    cleaned = clean_task_id(task_id)
    if cleaned:
        occurrences.append({"task_id": cleaned, "source": source})


def walk_structured_ids(payload: Any, source: str, occurrences: list[dict[str, str]], path: str = "") -> None:
    if isinstance(payload, dict):
        for key, value in payload.items():
            next_path = f"{path}.{key}" if path else str(key)
            if ID_KEY_RE.search(str(key)):
                add_occurrence(occurrences, value, f"{source}:{next_path}")
            walk_structured_ids(value, source, occurrences, next_path)
    elif isinstance(payload, list):
        for index, value in enumerate(payload):
            walk_structured_ids(value, source, occurrences, f"{path}[{index}]")


def extract_text_ids(text: str, source: str, occurrences: list[dict[str, str]]) -> None:
    for pattern in TEXT_ID_PATTERNS:
        for match in pattern.finditer(text):
            add_occurrence(occurrences, match.group(1), f"{source}:text@{match.start()}")


def candidate_files(trial_dir: Path, result_path: Path) -> list[Path]:
    files = [
        result_path,
        trial_dir / "result.json",
        trial_dir / "artifacts" / "aichem_submission.json",
        trial_dir / "artifacts" / "final_plan.json",
        trial_dir / "artifacts" / "experiment_plan.json",
        trial_dir / "agent" / "plan-export.json",
        trial_dir / "trial.log",
        trial_dir / "exception.txt",
        trial_dir / "agent" / "aichem-submission.log",
        trial_dir / "agent" / "claude-code.txt",
        trial_dir / "agent" / "codex.txt",
        trial_dir / "agent" / "gemini-cli.txt",
        trial_dir / "agent" / "hermes.txt",
        trial_dir / "agent" / "kilo-code.txt",
        trial_dir / "agent" / "openclaw.txt",
        trial_dir / "verifier" / "test_output.log",
        trial_dir / "verifier" / "test-stdout.txt",
    ]
    seen: set[Path] = set()
    existing: list[Path] = []
    for path in files:
        if path in seen or not path.exists() or not path.is_file():
            continue
        seen.add(path)
        existing.append(path)
    return existing


def extract_reported_task_ids(row: dict[str, str]) -> list[dict[str, str]]:
    occurrences: list[dict[str, str]] = []
    add_occurrence(occurrences, row.get("dispatch_task_id"), "selected_trials.csv:dispatch_task_id")

    trial_dir_text = row.get("trial_dir") or ""
    result_path_text = row.get("result_path") or ""
    trial_dir = Path(trial_dir_text) if trial_dir_text else Path()
    result_path = Path(result_path_text) if result_path_text else Path()

    if trial_dir.exists():
        for path in candidate_files(trial_dir, result_path):
            rel_source = path.name
            try:
                rel_source = path.relative_to(trial_dir).as_posix()
            except Exception:
                pass
            if path.suffix.lower() == ".json":
                payload = read_json(path)
                if payload is not None:
                    walk_structured_ids(payload, rel_source, occurrences)
                    extract_text_ids(json.dumps(payload, ensure_ascii=False), rel_source, occurrences)
                    continue
            if path.stat().st_size <= 2_000_000:
                extract_text_ids(path.read_text(encoding="utf-8", errors="replace"), rel_source, occurrences)

    return occurrences


def unique_preserve_order(values: list[str]) -> list[str]:
    seen: set[str] = set()
    out: list[str] = []
    for value in values:
        if value in seen:
            continue
        seen.add(value)
        out.append(value)
    return out


def expand_env_value(value: str, env: dict[str, str]) -> str:
    merged = os.environ.copy()
    merged.update(env)
    return re.sub(r"\$\{([^}]+)\}", lambda m: merged.get(m.group(1), m.group(0)), value)


def build_headers(env: dict[str, str], extra_headers: list[str]) -> dict[str, str]:
    headers = {"Accept": "application/json"}
    authorization = env.get("Authorization") or env.get("AUTHORIZATION")
    app_token = env.get("AICHEM_APP_TOKEN") or env.get("APP_TOKEN")
    app_label = env.get("AICHEM_TARGET_APP_LABEL") or env.get("APP_LABEL") or env.get("AICHEM_APP_LABEL")
    if authorization:
        headers["Authorization"] = authorization
    if app_token:
        headers["apptoken"] = app_token
    if app_label:
        headers["appLabel"] = app_label
    for item in extra_headers:
        if "=" not in item:
            raise ValueError(f"Invalid --header {item!r}; expected KEY=VALUE")
        key, value = item.split("=", 1)
        headers[key.strip()] = expand_env_value(value.strip(), env)
    return headers


def endpoint_for_task(endpoint: str, task_id: str, param_name: str) -> str:
    encoded = urllib.parse.quote(task_id, safe="")
    if "{task_id}" in endpoint or "{id}" in endpoint:
        return endpoint.replace("{task_id}", encoded).replace("{id}", encoded)
    parts = urllib.parse.urlsplit(endpoint)
    query = urllib.parse.parse_qsl(parts.query, keep_blank_values=True)
    replaced = False
    updated_query: list[tuple[str, str]] = []
    for key, value in query:
        if key in {param_name, "id", "taskId", "task_id"}:
            updated_query.append((key, task_id))
            replaced = True
        else:
            updated_query.append((key, value))
    if not replaced:
        updated_query.append((param_name, task_id))
    return urllib.parse.urlunsplit(
        (parts.scheme, parts.netloc, parts.path, urllib.parse.urlencode(updated_query), parts.fragment)
    )


def infer_exists_from_response(status: int, body: bytes, require_data: bool) -> tuple[bool, str]:
    text = body.decode("utf-8", errors="replace")
    if status < 200 or status >= 300:
        return False, f"http_{status}"
    payload: Any | None = None
    if text.strip():
        try:
            payload = json.loads(text)
        except Exception:
            payload = None
    lowered = text.lower()
    if any(token in lowered for token in ("not found", "notfound", "does not exist", "不存在", "未找到", "无此任务")):
        return False, "explicit_not_found"
    if isinstance(payload, dict):
        for key in ("exists", "exist", "found"):
            if isinstance(payload.get(key), bool):
                return bool(payload[key]), f"{key}_{str(payload[key]).lower()}"
        success = payload.get("success")
        if isinstance(success, bool) and not success:
            return False, "success_false"
        code = payload.get("code") or payload.get("statusCode") or payload.get("status")
        if code is not None:
            code_text = str(code)
            if code_text in {"401", "403", "404"}:
                return False, f"code_{code_text}"
            if code_text not in {"0", "200", "OK", "ok", "success", "SUCCESS"}:
                return False, f"code_{code_text}"
        data_keys = [key for key in ("data", "result", "task", "taskInfo", "task_info") if key in payload]
        if data_keys:
            for key in data_keys:
                value = payload.get(key)
                if value not in (None, "", [], {}):
                    return True, f"{key}_present"
            return False if require_data else True, "empty_data_fields"
        if require_data:
            return False, "no_data_field"
        return True, "json_2xx_no_failure"
    if isinstance(payload, list):
        return bool(payload), "json_list_nonempty" if payload else "json_list_empty"
    if require_data and not text.strip():
        return False, "empty_body"
    return True, "http_2xx"


def verify_task_id(
    task_id: str,
    endpoint: str,
    param_name: str,
    method: str,
    headers: dict[str, str],
    timeout: float,
    require_data: bool,
) -> dict[str, Any]:
    url = endpoint_for_task(endpoint, task_id, param_name)
    data = None
    request_headers = dict(headers)
    if method == "POST":
        data = json.dumps({"taskId": task_id, "task_id": task_id}, ensure_ascii=False).encode("utf-8")
        request_headers.setdefault("Content-Type", "application/json")
    request = urllib.request.Request(url, data=data, method=method, headers=request_headers)
    started = time.time()
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            body = response.read(1_000_000)
            exists, reason = infer_exists_from_response(response.status, body, require_data)
            return {
                "task_id": task_id,
                "exists": exists,
                "status_code": response.status,
                "reason": reason,
                "elapsed_seconds": time.time() - started,
                "checked_at": dt.datetime.now(dt.timezone.utc).isoformat(),
            }
    except urllib.error.HTTPError as exc:
        body = exc.read(200_000)
        exists, reason = infer_exists_from_response(exc.code, body, require_data)
        return {
            "task_id": task_id,
            "exists": exists,
            "status_code": exc.code,
            "reason": reason,
            "elapsed_seconds": time.time() - started,
            "checked_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        }
    except Exception as exc:
        return {
            "task_id": task_id,
            "exists": False,
            "status_code": None,
            "reason": f"request_error:{type(exc).__name__}",
            "elapsed_seconds": time.time() - started,
            "checked_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        }


def percentile(values: list[float], pct: float) -> float | None:
    if not values:
        return None
    sorted_values = sorted(values)
    if len(sorted_values) == 1:
        return sorted_values[0]
    position = (len(sorted_values) - 1) * pct
    lower = math.floor(position)
    upper = math.ceil(position)
    if lower == upper:
        return sorted_values[int(position)]
    return sorted_values[lower] * (upper - position) + sorted_values[upper] * (position - lower)


def fmt(value: Any) -> Any:
    if value is None:
        return ""
    if isinstance(value, float):
        return f"{value:.6f}".rstrip("0").rstrip(".")
    return value


def aggregate(rows: list[dict[str, Any]], group_fields: list[str]) -> list[dict[str, Any]]:
    buckets: dict[tuple[str, ...], list[dict[str, Any]]] = defaultdict(list)
    for row in rows:
        key = tuple(str(row.get(field) or "") for field in group_fields)
        buckets[key].append(row)
    out: list[dict[str, Any]] = []
    for key, items in sorted(buckets.items()):
        durations = [float(row["duration_seconds"]) for row in items if row.get("duration_seconds") not in (None, "")]
        total_tokens = [float(row["total_tokens_for_stats"]) for row in items if row.get("total_tokens_for_stats") not in (None, "")]
        input_tokens = [int(row["input_tokens"]) for row in items if row.get("input_tokens") not in (None, "")]
        output_tokens = [int(row["output_tokens"]) for row in items if row.get("output_tokens") not in (None, "")]
        cached_tokens = [int(row["cached_tokens"]) for row in items if row.get("cached_tokens") not in (None, "")]
        successes = [row for row in items if row.get("verified_success") is True]
        reported = [row for row in items if int(row.get("reported_task_id_count") or 0) > 0]
        rec = {field: key[index] for index, field in enumerate(group_fields)}
        rec.update(
            {
                "trial_count": len(items),
                "success_count": len(successes),
                "success_rate": len(successes) / len(items) if items else None,
                "reported_task_id_trial_count": len(reported),
                "verified_unique_task_id_count": len({row.get("verified_success_task_id") for row in successes if row.get("verified_success_task_id")}),
                "duration_count": len(durations),
                "duration_total_seconds": sum(durations) if durations else None,
                "duration_avg_seconds": statistics.mean(durations) if durations else None,
                "duration_median_seconds": statistics.median(durations) if durations else None,
                "duration_p95_seconds": percentile(durations, 0.95),
                "token_count": len(total_tokens),
                "input_tokens_total": sum(input_tokens) if input_tokens else None,
                "output_tokens_total": sum(output_tokens) if output_tokens else None,
                "cached_tokens_total": sum(cached_tokens) if cached_tokens else None,
                "total_tokens_total": sum(total_tokens) if total_tokens else None,
                "total_tokens_avg": statistics.mean(total_tokens) if total_tokens else None,
                "total_tokens_median": statistics.median(total_tokens) if total_tokens else None,
                "total_tokens_p95": percentile(total_tokens, 0.95),
            }
        )
        out.append(rec)
    return out


def write_csv(path: Path, rows: list[dict[str, Any]], fields: list[str] | None = None) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if fields is None:
        ordered: list[str] = []
        for row in rows:
            for key in row:
                if key not in ordered:
                    ordered.append(key)
        fields = ordered
    with path.open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(handle, fields)
        writer.writeheader()
        for row in rows:
            writer.writerow({field: fmt(row.get(field)) for field in fields})


def load_rows(path: Path, limit: int | None) -> list[dict[str, str]]:
    with path.open(encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        rows = list(reader)
    return rows[:limit] if limit else rows


def main() -> int:
    args = parse_args()
    env = load_env(args.env_file)
    endpoint = args.verify_endpoint or env.get("verify_endpoint") or env.get("VERIFY_ENDPOINT")
    if endpoint:
        endpoint = expand_env_value(endpoint, env)
    if not args.no_verify and not endpoint:
        print("verify_endpoint is missing; provide --verify-endpoint or set verify_endpoint in .env", file=sys.stderr)
        return 2

    args.out_dir.mkdir(parents=True, exist_ok=True)
    cache_path = args.cache or args.out_dir / "verify_cache.json"
    cache: dict[str, Any] = {}
    if cache_path.exists() and not args.refresh_cache:
        try:
            cache = json.loads(cache_path.read_text(encoding="utf-8"))
        except Exception:
            cache = {}

    headers = build_headers(env, args.header)
    selected_rows = load_rows(args.input, args.limit)
    trial_rows: list[dict[str, Any]] = []
    verify_results: dict[str, Any] = dict(cache)

    for index, row in enumerate(selected_rows, start=1):
        occurrences = extract_reported_task_ids(row)
        candidate_ids = [item["task_id"] for item in occurrences]
        unique_ids = unique_preserve_order(candidate_ids)
        if not args.no_verify and endpoint:
            for task_id in unique_ids:
                if task_id not in verify_results or args.refresh_cache:
                    verify_results[task_id] = verify_task_id(
                        task_id=task_id,
                        endpoint=endpoint,
                        param_name=args.verify_param,
                        method=args.verify_method,
                        headers=headers,
                        timeout=args.timeout,
                        require_data=args.require_data,
                    )
                    if args.sleep > 0:
                        time.sleep(args.sleep)
        last_existing = ""
        checked_statuses: list[str] = []
        for item in occurrences:
            task_id = item["task_id"]
            result = verify_results.get(task_id) or {}
            exists = bool(result.get("exists")) if not args.no_verify else False
            reason = result.get("reason") or ("not_verified" if args.no_verify else "")
            checked_statuses.append(f"{task_id}:{'yes' if exists else 'no'}:{reason}")
            if exists:
                last_existing = task_id

        input_tokens = coerce_int(row.get("input_tokens"))
        output_tokens = coerce_int(row.get("output_tokens"))
        cached_tokens = coerce_int(row.get("cached_tokens"))
        observed_total_tokens = coerce_int(row.get("observed_total_tokens"))
        total_tokens = observed_total_tokens
        if total_tokens is None:
            token_parts = [value for value in (input_tokens, output_tokens) if value is not None]
            total_tokens = sum(token_parts) if token_parts else None

        trial_rows.append(
            {
                "row_index": index,
                "config_key": row.get("config_key", ""),
                "harness": row.get("harness", ""),
                "model_key": row.get("model_key", ""),
                "benchmark_task": row.get("benchmark_task", ""),
                "trial_name": row.get("trial_name", ""),
                "source_label": row.get("source_label", ""),
                "latest_selection_rank": row.get("latest_selection_rank", ""),
                "exception_type": row.get("exception_type", ""),
                "reward": row.get("reward", ""),
                "started_at": row.get("started_at", ""),
                "finished_at": row.get("finished_at", ""),
                "duration_seconds": coerce_float(row.get("duration_seconds")),
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "cached_tokens": cached_tokens,
                "observed_total_tokens": observed_total_tokens,
                "total_tokens_for_stats": total_tokens,
                "api_call_count": row.get("api_call_count", ""),
                "reported_task_id_count": len(unique_ids),
                "reported_task_ids_in_order": "|".join(candidate_ids),
                "reported_unique_task_ids": "|".join(unique_ids),
                "verified_success": bool(last_existing),
                "verified_success_task_id": last_existing,
                "verify_checked_ids": "|".join(checked_statuses),
                "trial_dir": row.get("trial_dir", ""),
                "result_path": row.get("result_path", ""),
            }
        )

    cache_path.write_text(json.dumps(verify_results, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    trial_fields = [
        "row_index",
        "config_key",
        "harness",
        "model_key",
        "benchmark_task",
        "trial_name",
        "source_label",
        "latest_selection_rank",
        "exception_type",
        "reward",
        "started_at",
        "finished_at",
        "duration_seconds",
        "input_tokens",
        "output_tokens",
        "cached_tokens",
        "observed_total_tokens",
        "total_tokens_for_stats",
        "api_call_count",
        "reported_task_id_count",
        "reported_task_ids_in_order",
        "reported_unique_task_ids",
        "verified_success",
        "verified_success_task_id",
        "verify_checked_ids",
        "trial_dir",
        "result_path",
    ]
    write_csv(args.out_dir / "trial_stats.csv", trial_rows, trial_fields)

    aggregate_specs = {
        "summary_overall.csv": [],
        "summary_by_task.csv": ["benchmark_task"],
        "summary_by_harness.csv": ["harness"],
        "summary_by_model.csv": ["model_key"],
        "summary_by_config.csv": ["config_key"],
        "summary_by_harness_model.csv": ["harness", "model_key"],
        "summary_by_config_task.csv": ["config_key", "benchmark_task"],
    }
    aggregate_paths: dict[str, str] = {}
    for filename, fields in aggregate_specs.items():
        rows = aggregate(trial_rows, fields)
        path = args.out_dir / filename
        write_csv(path, rows)
        aggregate_paths[filename] = str(path)

    overall = aggregate(trial_rows, [])[0] if trial_rows else {}
    summary = {
        "generated_at": dt.datetime.now(dt.timezone.utc).isoformat(),
        "input": str(args.input),
        "out_dir": str(args.out_dir),
        "verify_enabled": not args.no_verify,
        "verify_endpoint_configured": bool(endpoint),
        "verify_authorization_header_configured": bool(headers.get("Authorization")),
        "verify_method": args.verify_method,
        "verify_param": args.verify_param,
        "require_data": args.require_data,
        "trial_count": len(trial_rows),
        "reported_unique_task_ids": len({task_id for row in trial_rows for task_id in str(row["reported_unique_task_ids"]).split("|") if task_id}),
        "verified_existing_unique_task_ids": len({row["verified_success_task_id"] for row in trial_rows if row["verified_success_task_id"]}),
        "overall": overall,
        "outputs": {"trial_stats.csv": str(args.out_dir / "trial_stats.csv"), **aggregate_paths, "verify_cache.json": str(cache_path)},
        "success_rule": "For each trial, extract reported task IDs, verify every ID through verify_endpoint, and count at most one success: the last ID in that trial whose endpoint verification says it exists.",
    }
    (args.out_dir / "summary.json").write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
