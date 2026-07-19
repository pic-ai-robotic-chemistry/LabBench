#!/usr/bin/env python3

from __future__ import annotations

import json
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parent.parent
RUNTIME_STATE = ROOT / "runtime-state"
MONITOR_DIR = RUNTIME_STATE / "monitor"
SUMMARY_MD = MONITOR_DIR / "aiready-progress.md"
SUMMARY_JSON = MONITOR_DIR / "aiready-progress.json"
SCOPES = ("aiready-formal", "publish")


def load_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return {}
    return payload if isinstance(payload, dict) else {}


def latest_states() -> dict[str, dict[str, Any]]:
    return {scope: load_json(RUNTIME_STATE / f"{scope}.json") for scope in SCOPES}


def job_summary(job_dir_raw: str | None) -> dict[str, Any]:
    if not job_dir_raw:
        return {}
    job_dir = Path(job_dir_raw)
    result_path = job_dir / "result.json"
    payload = load_json(result_path)
    stats = payload.get("stats") if isinstance(payload.get("stats"), dict) else {}
    return {
        "job_dir": str(job_dir),
        "result_exists": result_path.exists(),
        "finished_at": payload.get("finished_at"),
        "n_total_trials": payload.get("n_total_trials"),
        "n_completed_trials": stats.get("n_completed_trials"),
        "n_errored_trials": stats.get("n_errored_trials"),
    }


def render_markdown(payload: dict[str, Any]) -> str:
    lines = ["# AIREADY Progress", ""]
    for scope in SCOPES:
        state = payload["states"].get(scope) or {}
        lines.append(f"## {scope}")
        if not state:
            lines.append("- no state recorded")
            lines.append("")
            continue
        for key in ("status", "phase", "message", "run_id", "current_item", "config_path", "job_name", "log_path"):
            value = state.get(key)
            if value:
                lines.append(f"- {key}: `{value}`")
        summary = payload["job_summaries"].get(scope) or {}
        if summary:
            lines.append(f"- job_dir: `{summary.get('job_dir')}`")
            lines.append(f"- result_exists: `{summary.get('result_exists')}`")
            if summary.get("finished_at"):
                lines.append(f"- finished_at: `{summary.get('finished_at')}`")
            if summary.get("n_total_trials") is not None:
                lines.append(f"- trials: `{summary.get('n_completed_trials')}/{summary.get('n_total_trials')}` completed, `{summary.get('n_errored_trials')}` errored")
        lines.append("")
    return "\n".join(lines)


def main() -> int:
    states = latest_states()
    payload = {
        "states": states,
        "job_summaries": {
            scope: job_summary((state or {}).get("job_dir")) for scope, state in states.items()
        },
    }
    MONITOR_DIR.mkdir(parents=True, exist_ok=True)
    SUMMARY_JSON.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    SUMMARY_MD.write_text(render_markdown(payload), encoding="utf-8")
    print(SUMMARY_MD)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
