#!/usr/bin/env python3

from __future__ import annotations

import os
import signal
import subprocess
import sys
import time


def _positive_float_from_env(name: str) -> float | None:
    raw = os.environ.get(name, "").strip()
    if not raw:
        return None
    try:
        value = float(raw)
    except ValueError:
        return None
    return value if value > 0 else None


def _latest_mtime(path: str) -> float | None:
    if not path:
        return None
    if not os.path.exists(path):
        return None
    latest = os.path.getmtime(path)
    if os.path.isfile(path):
        return latest
    for root, _dirs, files in os.walk(path):
        try:
            latest = max(latest, os.path.getmtime(root))
        except OSError:
            pass
        for name in files:
            candidate = os.path.join(root, name)
            try:
                latest = max(latest, os.path.getmtime(candidate))
            except OSError:
                continue
    return latest


def _terminate_process_group(process: subprocess.Popen[object]) -> None:
    try:
        os.killpg(process.pid, signal.SIGTERM)
    except ProcessLookupError:
        pass
    try:
        process.wait(timeout=10)
    except subprocess.TimeoutExpired:
        try:
            os.killpg(process.pid, signal.SIGKILL)
        except ProcessLookupError:
            pass
        process.wait()


def main() -> int:
    if len(sys.argv) < 3:
        print("Usage: run_with_timeout.py <timeout_sec> <command> [args...]", file=sys.stderr)
        return 2

    timeout_sec = float(sys.argv[1])
    cmd = sys.argv[2:]

    idle_path = os.environ.get("RUN_WITH_TIMEOUT_IDLE_PATH", "").strip()
    idle_sec = _positive_float_from_env("RUN_WITH_TIMEOUT_IDLE_SEC")
    check_sec = _positive_float_from_env("RUN_WITH_TIMEOUT_IDLE_CHECK_SEC") or 30.0

    start = time.monotonic()
    last_observed_progress = start
    last_check = 0.0
    initial_mtime = _latest_mtime(idle_path) if idle_path and idle_sec else None
    last_mtime = initial_mtime

    process = subprocess.Popen(cmd, preexec_fn=os.setsid)
    while True:
        return_code = process.poll()
        if return_code is not None:
            return return_code

        now = time.monotonic()
        if now - start >= timeout_sec:
            print(
                f"[timeout] command exceeded wall timeout {timeout_sec:.0f}s",
                file=sys.stderr,
                flush=True,
            )
            _terminate_process_group(process)
            return 124

        if idle_path and idle_sec and now - last_check >= check_sec:
            last_check = now
            current_mtime = _latest_mtime(idle_path)
            if current_mtime is not None and (
                last_mtime is None or current_mtime > last_mtime
            ):
                last_mtime = current_mtime
                last_observed_progress = now

            if now - last_observed_progress >= idle_sec:
                print(
                    "[timeout] command exceeded no-progress timeout "
                    f"{idle_sec:.0f}s while watching {idle_path}",
                    file=sys.stderr,
                    flush=True,
                )
                _terminate_process_group(process)
                return 125

        time.sleep(min(1.0, check_sec))


if __name__ == "__main__":
    raise SystemExit(main())
