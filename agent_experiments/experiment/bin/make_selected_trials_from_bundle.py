#!/usr/bin/env python3
from __future__ import annotations

import argparse
import csv
import datetime as dt
import json
from pathlib import Path
from typing import Any


OUTPUT_FIELDS = [
    "config_key",
    "harness",
    "model_key",
    "benchmark_task",
    "latest_selection_rank",
    "trial_name",
    "job_name",
    "source_label",
    "source_rank",
    "location",
    "trial_dir",
    "result_path",
    "started_at",
    "finished_at",
    "duration_seconds",
    "exception_type",
    "reward",
    "final_plan_exists",
    "experiment_plan_exists",
    "final_json_valid",
    "top_steps_count",
    "dispatch_task_id",
    "dispatch_template_id",
    "input_tokens",
    "output_tokens",
    "cached_tokens",
    "observed_total_tokens",
    "api_call_count",
    "final_keys",
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Convert build_aiready_analysis_bundle.py trial-summary.csv into the "
            "selected_trials.csv shape consumed by stat_aiready_trials.py."
        )
    )
    parser.add_argument("--bundle-dir", type=Path, required=True)
    parser.add_argument("--out", type=Path, required=True)
    return parser.parse_args()


def read_json(path: Path) -> Any | None:
    if not path.is_file():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8", errors="replace"))
    except Exception:
        return None


def parse_time(value: Any) -> dt.datetime | None:
    if not value:
        return None
    text = str(value).strip()
    if not text:
        return None
    if text.endswith("Z"):
        text = text[:-1] + "+00:00"
    try:
        return dt.datetime.fromisoformat(text)
    except ValueError:
        return None


def duration_seconds(started_at: Any, finished_at: Any, explicit_value: Any) -> str:
    if explicit_value not in (None, ""):
        return str(explicit_value)
    start = parse_time(started_at)
    finish = parse_time(finished_at)
    if not start or not finish:
        return ""
    return f"{max(0.0, (finish - start).total_seconds()):.3f}"


def bool_text(value: Any) -> str:
    if isinstance(value, bool):
        return "True" if value else "False"
    return str(value or "")


def choose_trial_dir(row: dict[str, str], bundle_dir: Path) -> Path:
    source = Path(row.get("source_trial_dir") or "")
    if source.is_dir():
        return source
    bundled = Path(row.get("bundled_trial_dir") or "")
    if bundled.is_dir():
        return bundled
    candidate = bundle_dir / row.get("bundled_trial_dir", "")
    if candidate.is_dir():
        return candidate
    return source if str(source) else bundled


def main() -> int:
    args = parse_args()
    bundle_dir = args.bundle_dir.resolve()
    summary_path = bundle_dir / "trial-summary.csv"
    if not summary_path.is_file():
        manifest_path = bundle_dir / "manifest.json"
        if not manifest_path.is_file():
            raise FileNotFoundError(f"Missing bundle trial summary: {summary_path}")
        payload = read_json(manifest_path) or {}
        if payload.get("trials") not in (None, []):
            raise FileNotFoundError(f"Missing bundle trial summary: {summary_path}")
        args.out.parent.mkdir(parents=True, exist_ok=True)
        with args.out.open("w", newline="", encoding="utf-8") as f:
            csv.DictWriter(f, fieldnames=OUTPUT_FIELDS).writeheader()
        print(args.out.resolve())
        return 0

    rows: list[dict[str, str]] = []
    with summary_path.open(newline="", encoding="utf-8-sig") as f:
        for index, row in enumerate(csv.DictReader(f), start=1):
            trial_dir = choose_trial_dir(row, bundle_dir)
            result_path = trial_dir / "result.json"
            result = read_json(result_path) or {}
            verifier = result.get("verifier_result") if isinstance(result, dict) else {}
            rewards = verifier.get("rewards") if isinstance(verifier, dict) else {}
            exception_info = result.get("exception_info") if isinstance(result, dict) else {}

            harness = row.get("harness") or ""
            model_key = row.get("model_name") or ""
            task_id = row.get("task_id") or result.get("task_name") or ""
            final_payload = read_json(trial_dir / "artifacts" / "final_plan.json")
            final_keys = ""
            top_steps_count = ""
            final_json_valid = "False"
            if isinstance(final_payload, dict):
                final_json_valid = "True"
                final_keys = "|".join(sorted(str(key) for key in final_payload))
                steps = final_payload.get("steps")
                if isinstance(steps, list):
                    top_steps_count = str(len(steps))
            reward_value = row.get("reward")
            if reward_value in (None, ""):
                reward_value = rewards.get("reward")

            rows.append(
                {
                    "config_key": f"{harness}__{model_key}" if harness or model_key else "",
                    "harness": harness,
                    "model_key": model_key,
                    "benchmark_task": str(task_id),
                    "latest_selection_rank": str(index),
                    "trial_name": row.get("trial_name") or trial_dir.name,
                    "job_name": row.get("job_name") or "",
                    "source_label": bundle_dir.name,
                    "source_rank": "0",
                    "location": "bundle",
                    "trial_dir": trial_dir.as_posix(),
                    "result_path": result_path.as_posix(),
                    "started_at": str(result.get("started_at") or ""),
                    "finished_at": str(result.get("finished_at") or ""),
                    "duration_seconds": duration_seconds(
                        result.get("started_at"),
                        result.get("finished_at"),
                        result.get("duration_seconds"),
                    ),
                    "exception_type": (
                        row.get("exception_type")
                        or (exception_info.get("exception_type") if isinstance(exception_info, dict) else "")
                        or ""
                    ),
                    "reward": "" if reward_value is None else str(reward_value),
                    "final_plan_exists": bool_text(row.get("final_plan_exists")),
                    "experiment_plan_exists": bool_text(row.get("experiment_plan_exists")),
                    "final_json_valid": final_json_valid,
                    "top_steps_count": top_steps_count,
                    "dispatch_task_id": row.get("aichem_task_id") or "",
                    "dispatch_template_id": row.get("aichem_template_id") or "",
                    "input_tokens": "",
                    "output_tokens": "",
                    "cached_tokens": "",
                    "observed_total_tokens": "",
                    "api_call_count": "",
                    "final_keys": final_keys,
                }
            )

    args.out.parent.mkdir(parents=True, exist_ok=True)
    with args.out.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=OUTPUT_FIELDS)
        writer.writeheader()
        writer.writerows(rows)
    print(args.out.resolve())
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
