#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import os
from datetime import datetime, timezone
from pathlib import Path
import subprocess
import sys
from typing import Any


STATE_ROOT = Path("runtime-state")
ROOT_DIR = Path(__file__).resolve().parent.parent


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def state_path(scope: str) -> Path:
    return STATE_ROOT / f"{scope}.json"


def history_path(scope: str, run_id: str) -> Path:
    return STATE_ROOT / "history" / f"{scope}-{run_id}.json"


def ensure_parent(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def load_state(scope: str) -> dict[str, Any]:
    path = state_path(scope)
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        backup_path = path.with_name(f"{path.name}.corrupt-{datetime.now().strftime('%Y%m%d-%H%M%S')}")
        try:
            path.replace(backup_path)
        except OSError:
            pass
        return {}


def resolve_config_metadata(config_path_raw: str | None) -> dict[str, str]:
    if not config_path_raw:
        return {}

    config_path = Path(config_path_raw)
    if not config_path.exists():
        return {}

    try:
        import yaml

        payload = yaml.safe_load(config_path.read_text(encoding="utf-8")) or {}
    except Exception:
        return {}

    metadata: dict[str, str] = {}
    job_name = payload.get("job_name")
    jobs_dir = payload.get("jobs_dir")
    if isinstance(job_name, str) and job_name:
        metadata["job_name"] = job_name
    if isinstance(job_name, str) and job_name and isinstance(jobs_dir, str) and jobs_dir:
        metadata["job_dir"] = str(Path(jobs_dir) / job_name)
    return metadata


def write_state(scope: str, payload: dict[str, Any]) -> None:
    path = state_path(scope)
    ensure_parent(path)
    state_text = json.dumps(payload, indent=2, ensure_ascii=False) + "\n"
    tmp_path = path.with_name(f".{path.name}.{os.getpid()}.tmp")
    tmp_path.write_text(state_text, encoding="utf-8")
    os.replace(tmp_path, path)

    run_id = payload.get("run_id")
    if run_id:
        hpath = history_path(scope, str(run_id))
        ensure_parent(hpath)
        tmp_hpath = hpath.with_name(f".{hpath.name}.{os.getpid()}.tmp")
        tmp_hpath.write_text(state_text, encoding="utf-8")
        os.replace(tmp_hpath, hpath)


def refresh_monitor(scope: str) -> None:
    if scope not in {"formal", "publish", "prebuild-full"}:
        return

    monitor_script = ROOT_DIR / "tools" / (
        "render_prebuild_monitor.py" if scope == "prebuild-full" else "render_formal_monitor.py"
    )
    if not monitor_script.exists():
        return

    try:
        subprocess.run(
            [sys.executable, str(monitor_script)],
            cwd=str(ROOT_DIR),
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=False,
        )
    except Exception:
        # Monitor refresh should never block the actual experiment flow.
        pass


def merge_value(payload: dict[str, Any], key: str, value: Any) -> None:
    if value is not None:
        payload[key] = value


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Manage runtime progress state for local experiment scripts.")
    subparsers = parser.add_subparsers(dest="command", required=True)

    for name in ("start", "update", "finish"):
        sub = subparsers.add_parser(name)
        sub.add_argument("--scope", required=True)
        sub.add_argument("--run-id")
        sub.add_argument("--status")
        sub.add_argument("--phase")
        sub.add_argument("--message")
        sub.add_argument("--current-item")
        sub.add_argument("--completed-steps", type=int)
        sub.add_argument("--total-steps", type=int)
        sub.add_argument("--log-path")
        sub.add_argument("--config-path")
        sub.add_argument("--job-name")
        sub.add_argument("--job-dir")
        sub.add_argument("--metadata-json")

    show = subparsers.add_parser("show")
    show.add_argument("--scope", default="all")
    show.add_argument("--format", choices=["text", "json"], default="text")

    return parser.parse_args()


def update_state(args: argparse.Namespace) -> int:
    payload = load_state(args.scope)
    previous_config_path = payload.get("config_path")
    is_new = not payload or (
        args.run_id is not None and payload.get("run_id") not in {None, args.run_id}
    )
    now = utc_now()

    if is_new:
        payload = {
            "scope": args.scope,
            "run_id": args.run_id or f"{args.scope}-{datetime.now().strftime('%Y%m%d-%H%M%S')}",
            "status": args.status or ("success" if args.command == "finish" else "running"),
            "started_at": now,
        }
    elif args.command == "finish" and "finished_at" not in payload:
        payload["finished_at"] = now

    merge_value(payload, "run_id", args.run_id)
    merge_value(payload, "status", args.status)
    merge_value(payload, "phase", args.phase)
    merge_value(payload, "message", args.message)
    merge_value(payload, "current_item", args.current_item)
    merge_value(payload, "completed_steps", args.completed_steps)
    merge_value(payload, "total_steps", args.total_steps)
    merge_value(payload, "log_path", args.log_path)
    merge_value(payload, "config_path", args.config_path)

    config_metadata = resolve_config_metadata(args.config_path)
    if args.config_path and args.config_path != previous_config_path:
        payload.pop("job_name", None)
        payload.pop("job_dir", None)
    merge_value(payload, "job_name", args.job_name or config_metadata.get("job_name"))
    merge_value(payload, "job_dir", args.job_dir or config_metadata.get("job_dir"))

    if args.metadata_json:
        payload["metadata"] = json.loads(args.metadata_json)

    payload["updated_at"] = now
    if args.command == "finish":
        payload.setdefault("finished_at", now)
        payload["finished_at"] = now
        payload["status"] = args.status or payload.get("status") or "success"
    else:
        payload.setdefault("status", "running")

    write_state(args.scope, payload)
    refresh_monitor(args.scope)
    return 0


def _trial_dirs(job_dir: Path) -> list[Path]:
    if not job_dir.exists():
        return []
    return sorted(
        path
        for path in job_dir.iterdir()
        if path.is_dir() and (path / "config.json").exists()
    )


def _load_json(path: Path) -> dict[str, Any] | None:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return None


def derive_formal_progress(state: dict[str, Any]) -> dict[str, Any]:
    config_path_raw = state.get("config_path")
    if not config_path_raw:
        return {}

    config_path = Path(config_path_raw)
    if not config_path.exists():
        return {}

    try:
        import yaml
        config = yaml.safe_load(config_path.read_text(encoding="utf-8")) or {}
    except Exception:
        return {}

    datasets = config.get("datasets") or []
    n_attempts = int(config.get("n_attempts") or 1)
    task_count = 0
    for dataset in datasets:
        dataset_path = Path(dataset["path"])
        task_count += len([path for path in dataset_path.iterdir() if path.is_dir()]) if dataset_path.exists() else 0

    job_name = state.get("job_name") or config.get("job_name")
    jobs_dir_raw = config.get("jobs_dir")
    job_dir = Path(state["job_dir"]) if state.get("job_dir") else None
    if job_dir is None and job_name and jobs_dir_raw:
        job_dir = Path(jobs_dir_raw) / job_name

    trial_dirs = _trial_dirs(job_dir) if job_dir else []
    finished_trials = sum(1 for trial_dir in trial_dirs if (trial_dir / "result.json").exists())
    error_trials = sum(1 for trial_dir in trial_dirs if (trial_dir / "exception.txt").exists())
    expected_trials = task_count * n_attempts

    top_result = _load_json(job_dir / "result.json") if job_dir else None
    top_stats = ((top_result or {}).get("stats") or {}) if isinstance(top_result, dict) else {}

    progress = {
        "task_count": task_count,
        "n_attempts": n_attempts,
        "expected_trials": expected_trials,
        "started_trials": len(trial_dirs),
        "finished_trials": finished_trials,
        "error_trials": error_trials,
        "job_name": job_name,
        "job_dir": str(job_dir) if job_dir else None,
    }

    if isinstance(top_stats, dict):
        progress["job_stats"] = {
            "n_trials": top_stats.get("n_trials"),
            "n_errors": top_stats.get("n_errors"),
        }

    return progress


def render_text(scope: str, state: dict[str, Any]) -> str:
    if not state:
        return f"[{scope}] no active state file"

    lines = [
        f"[{scope}] status={state.get('status', 'unknown')}",
        f"run_id={state.get('run_id', '-')}",
    ]

    if state.get("phase"):
        lines.append(f"phase={state['phase']}")
    if state.get("message"):
        lines.append(f"message={state['message']}")
    if state.get("current_item"):
        lines.append(f"current_item={state['current_item']}")

    completed = state.get("completed_steps")
    total = state.get("total_steps")
    if completed is not None or total is not None:
        lines.append(f"steps={completed if completed is not None else '-'} / {total if total is not None else '-'}")

    if state.get("scope") == "formal":
        derived = derive_formal_progress(state)
        if derived:
            lines.append(
                "trial_progress="
                f"{derived.get('finished_trials', 0)} finished / "
                f"{derived.get('started_trials', 0)} started / "
                f"{derived.get('expected_trials', 0)} expected"
            )
            lines.append(
                "trial_errors="
                f"{derived.get('error_trials', 0)}"
            )
            if derived.get("job_name"):
                lines.append(f"job_name={derived['job_name']}")
            if derived.get("job_dir"):
                lines.append(f"job_dir={derived['job_dir']}")

    if state.get("config_path"):
        lines.append(f"config={state['config_path']}")
    if state.get("log_path"):
        lines.append(f"log={state['log_path']}")
    if state.get("updated_at"):
        lines.append(f"updated_at={state['updated_at']}")
    return "\n".join(lines)


def show_state(args: argparse.Namespace) -> int:
    scopes = ["publish", "formal"] if args.scope == "all" else [args.scope]
    payload: dict[str, Any] = {}
    text_blocks: list[str] = []

    for scope in scopes:
        state = load_state(scope)
        if scope == "formal" and state:
            derived = derive_formal_progress(state)
            if derived:
                state = dict(state)
                state["derived_progress"] = derived
        payload[scope] = state
        text_blocks.append(render_text(scope, state))

    if args.format == "json":
        print(json.dumps(payload, indent=2, ensure_ascii=False))
    else:
        print("\n\n".join(text_blocks))
    return 0


def main() -> int:
    args = parse_args()
    if args.command in {"start", "update", "finish"}:
        return update_state(args)
    if args.command == "show":
        return show_state(args)
    raise ValueError(f"Unsupported command: {args.command}")


if __name__ == "__main__":
    raise SystemExit(main())
