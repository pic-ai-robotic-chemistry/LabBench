#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import os
import shlex
import subprocess
import uuid
from pathlib import Path
from typing import Any


ROOT_DIR = Path(__file__).resolve().parent.parent
REPORTS_DIR = ROOT_DIR / "runtime-state" / "reports"


HARNESS_SMOKE_COMMANDS = {
    "claude-code": "command -v node >/dev/null && node --version >/dev/null && command -v claude >/dev/null && claude --version >/dev/null",
    "codex": "command -v node >/dev/null && node --version >/dev/null && command -v codex >/dev/null && codex --version >/dev/null",
    "gemini-cli": "command -v node >/dev/null && node --version >/dev/null && command -v gemini >/dev/null && gemini --version >/dev/null",
    "hermes": "command -v python3 >/dev/null && command -v hermes >/dev/null && hermes version >/dev/null",
    "kilo-code": "command -v node >/dev/null && node --version >/dev/null && command -v kilo >/dev/null && kilo --version >/dev/null",
    "openclaw": "command -v node >/dev/null && node --version >/dev/null && command -v openclaw >/dev/null && openclaw --version >/dev/null",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Validate a built harness/task/final image before publish or experiment."
    )
    parser.add_argument("--image", required=True)
    parser.add_argument("--kind", choices=["harness", "final"], required=True)
    parser.add_argument("--harness", required=True)
    parser.add_argument("--task-id")
    parser.add_argument("--task-dir", type=Path)
    parser.add_argument("--report-out", type=Path)
    parser.add_argument("--platform", default="linux/amd64")
    parser.add_argument(
        "--require-reference-solution",
        action="store_true",
        help="Fail validation if the reference solution/verifier smoke is unavailable or fails.",
    )
    parser.add_argument(
        "--check-timeout-sec",
        type=int,
        default=int(os.environ.get("IMAGE_VALIDATION_CHECK_TIMEOUT_SEC", "180")),
        help="Timeout per docker run check. Use 0 to disable the timeout.",
    )
    return parser.parse_args()


def run_shell_in_image(
    image: str,
    command: str,
    *,
    platform: str,
    timeout_sec: int,
) -> subprocess.CompletedProcess[str] | dict[str, Any]:
    container_name = f"validate-built-image-{uuid.uuid4().hex[:16]}"
    cmd = [
        "docker",
        "run",
        "--rm",
        "--name",
        container_name,
        "--label",
        "skillsomething.validate_built_image=1",
        "--platform",
        platform,
        "--entrypoint",
        "/bin/bash",
        image,
        "-lc",
        command,
    ]
    try:
        return subprocess.run(
            cmd,
            text=True,
            capture_output=True,
            check=False,
            timeout=timeout_sec if timeout_sec > 0 else None,
        )
    except subprocess.TimeoutExpired as exc:
        subprocess.run(
            ["docker", "rm", "-f", container_name],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=False,
        )
        return {
            "timeout": True,
            "returncode": 124,
            "stdout": exc.stdout or "",
            "stderr": (exc.stderr or "") + f"\nTimed out after {timeout_sec}s",
            "args": cmd,
        }


def truncate(text: str, limit: int = 4000) -> str:
    if len(text) <= limit:
        return text
    return text[:limit] + "\n...[truncated]..."


def harness_checks(harness: str) -> list[dict[str, Any]]:
    command = HARNESS_SMOKE_COMMANDS.get(harness, "true")
    return [
        {
            "name": "harness-cli-smoke",
            "command": command,
            "required": True,
        }
    ]


def _solution_paths(task_dir: Path) -> tuple[Path | None, Path | None]:
    solve_sh = task_dir / "solution" / "solve.sh"
    tests_sh = task_dir / "tests" / "test.sh"
    return solve_sh if solve_sh.exists() else None, tests_sh if tests_sh.exists() else None


def final_checks(
    harness: str,
    task_dir: Path | None,
    *,
    require_reference_solution: bool,
) -> list[dict[str, Any]]:
    checks = harness_checks(harness)
    checks.append(
        {
            "name": "task-payload-layout",
            "command": (
                "test -f /opt/task/instruction.md "
                "&& test -f /opt/task/task.toml "
                "&& test -d /opt/task/environment "
                "&& test -d /opt/task/tests "
                "&& echo payload-ok"
            ),
            "required": True,
        }
    )
    checks.append(
        {
            "name": "python-runtime-import",
            "command": (
                "if command -v python3 >/dev/null 2>&1; then "
                "python3 - <<'PY'\n"
                "import importlib\n"
                "from pathlib import Path\n"
                "print(Path('/opt/task/task.toml').exists())\n"
                "for module in ('requests', 'openpyxl', 'anthropic'):\n"
                "    importlib.import_module(module)\n"
                "PY\n"
                "else true; fi"
            ),
            "required": True,
        }
    )

    if task_dir is not None and require_reference_solution:
        solve_sh, tests_sh = _solution_paths(task_dir)
        if solve_sh is not None and tests_sh is not None:
            checks.append(
                {
                    "name": "reference-solution-smoke",
                    "command": (
                        "set -e; "
                        "rm -rf /root/workspace /output /logs/verifier; "
                        "mkdir -p /root/workspace /output /logs/verifier; "
                        "rm -rf /solution /tests /environment; "
                        "cp -R /opt/task/solution /solution; "
                        "cp -R /opt/task/tests /tests; "
                        "cp -R /opt/task/environment /environment; "
                        "chmod +x /solution/solve.sh /tests/test.sh; "
                        "bash /solution/solve.sh >/tmp/reference-solve.log 2>&1; "
                        "bash /tests/test.sh >/tmp/reference-test.log 2>&1; "
                        "test -f /logs/verifier/reward.txt; "
                        "cat /logs/verifier/reward.txt"
                    ),
                    "required": require_reference_solution,
                }
            )
        else:
            checks.append(
                {
                    "name": "reference-solution-smoke",
                    "command": "echo 'missing /opt/task/solution/solve.sh or /opt/task/tests/test.sh' >&2; exit 1",
                    "required": True,
                }
            )

    return checks


def choose_checks(args: argparse.Namespace) -> list[dict[str, Any]]:
    if args.kind == "harness":
        return harness_checks(args.harness)
    return final_checks(
        args.harness,
        args.task_dir,
        require_reference_solution=args.require_reference_solution,
    )


def validate(args: argparse.Namespace) -> dict[str, Any]:
    checks = choose_checks(args)
    results: list[dict[str, Any]] = []
    for check in checks:
        proc = run_shell_in_image(
            args.image,
            check["command"],
            platform=args.platform,
            timeout_sec=args.check_timeout_sec,
        )
        if isinstance(proc, dict):
            return_code = int(proc["returncode"])
            stdout = str(proc["stdout"])
            stderr = str(proc["stderr"])
            timed_out = bool(proc.get("timeout"))
        else:
            return_code = proc.returncode
            stdout = proc.stdout or ""
            stderr = proc.stderr or ""
            timed_out = False
        results.append(
            {
                "name": check["name"],
                "ok": return_code == 0,
                "required": bool(check.get("required", True)),
                "return_code": return_code,
                "timed_out": timed_out,
                "stdout": truncate(stdout),
                "stderr": truncate(stderr),
                "command": check["command"],
            }
        )

    return {
        "image": args.image,
        "kind": args.kind,
        "harness": args.harness,
        "task_id": args.task_id,
        "task_dir": str(args.task_dir.resolve()) if args.task_dir else None,
        "checks": results,
        "ok": all(item["ok"] for item in results if item.get("required", True)),
    }


def main() -> int:
    args = parse_args()
    report = validate(args)

    report_out = args.report_out
    if report_out is None:
        REPORTS_DIR.mkdir(parents=True, exist_ok=True)
        suffix = args.task_id or args.harness
        report_out = REPORTS_DIR / f"image-validation-{args.kind}-{suffix}.json"
    else:
        report_out.parent.mkdir(parents=True, exist_ok=True)

    report_out.write_text(
        json.dumps(report, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )
    print(report_out.resolve())
    return 0 if report["ok"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
