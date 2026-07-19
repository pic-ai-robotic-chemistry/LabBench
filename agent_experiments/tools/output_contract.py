from __future__ import annotations

import json
import os
import re
import shlex
from pathlib import PurePosixPath


PLAN_OUTPUT_PATH = "/workspace/experiment_plan.json"
PLAN_ARTIFACT_PATH = "/logs/artifacts/final_plan.json"

_PLAN_OUTPUT_CONTRACT_MODES = {
    "plan",
    "json-plan",
    "aiready",
    "chem",
    "chemsomething",
}
_SKILLSBENCH_OUTPUT_CONTRACT_MODES = {
    "skillsbench",
    "skillbench",
    "formal-skillsbench",
}
_DISABLED_OUTPUT_CONTRACT_MODES = {
    "off",
    "none",
    "disabled",
    "false",
    "0",
}

_BACKTICK_PATH_RE = re.compile(r"`([^`\n]+)`")
_RAW_ABS_PATH_RE = re.compile(r"(?<![A-Za-z0-9_])(/(?:[A-Za-z0-9._<>{}\-]+/?)+)")
_RELATIVE_OUTPUT_RE = re.compile(
    r"(?<![A-Za-z0-9_./-])([A-Za-z0-9_.{}<>-]+\.(?:json|csv|py|txt|ya?ml|npz|zip|md|pdf|png|jpg|jpeg|xlsx|docx|diff|patch))"
)
_OUTPUT_LINE_MARKERS = (
    "write",
    "output",
    "save",
    "create",
    "generate",
    "export",
    "copy",
    "fill",
    "visualization",
)
_OUTPUT_SCAN_START_MARKERS = (
    "write",
    "output",
    "save",
    "create",
    "generate",
    "export",
    "copy",
    "file named",
    "called ",
)
_OUTPUT_CONTEXT_MARKERS = (
    "you need to give me",
    "need to give me",
    "give me",
    "write your solution to",
    "write your script at",
    "write your answer to",
    "write the answer to",
    "write your response to",
    "save your solution to",
    "save the result to",
    "create a file",
    "create `",
    "create ",
    "finally, create",
    "finally create",
    "fill in only",
    "fill out",
    "export to",
    "output to",
    "file named",
    "called ",
)
_NON_OUTPUT_LINE_MARKERS = (
    "example output",
    "example of",
    "for example",
    "using input",
    "input ",
    "input:",
    "source:",
    "datasource",
    "http://",
    "https://",
)
_OUTPUT_EXTENSIONS = (
    ".json",
    ".csv",
    ".py",
    ".txt",
    ".yaml",
    ".yml",
    ".npz",
    ".zip",
    ".md",
    ".pdf",
    ".png",
    ".jpg",
    ".jpeg",
    ".xlsx",
    ".docx",
    ".diff",
    ".patch",
)
_MISSING_OUTPUT_PATTERNS = (
    "output file not found",
    "solution file not found",
    "answer file not found",
    "no patch_*.diff file found",
    "file not found at /root/",
    "missing /root/",
    "missing /app/",
    "missing /home/",
    "not found in expected locations",
    "missing required output",
    "required output artifact",
    "no valid output",
)
_GENERIC_MISSING_PATTERNS = (
    "does not exist",
    "not found",
)
_GENERIC_MISSING_OUTPUT_CONTEXT = (
    "output",
    "solution",
    "answer",
    "artifact",
    "required",
    "deliverable",
    "result file",
    "/root/",
    "/workspace/",
    "/logs/artifacts/",
    "experiment_plan.json",
)


class MissingRequiredOutputError(RuntimeError):
    pass


def extract_required_output_paths(instruction: str) -> list[str]:
    paths: list[str] = []
    pending_output_context = False
    for raw_line in instruction.splitlines():
        line = raw_line.strip()
        if not line:
            continue
        lower = line.lower()

        is_output_context = _is_output_context_line(lower)
        should_scan_line = is_output_context or (pending_output_context and "/" in line)
        if not should_scan_line:
            continue

        start = 0
        if not (pending_output_context and "/" in line):
            marker_positions = [
                lower.find(marker)
                for marker in _OUTPUT_SCAN_START_MARKERS
                if lower.find(marker) >= 0
            ]
            if marker_positions:
                start = min(marker_positions)

        found = False
        for match in _BACKTICK_PATH_RE.finditer(line):
            if match.start() < start:
                continue
            candidate = _clean_path(match.group(1))
            if _is_required_output_candidate(candidate) and candidate not in paths:
                paths.append(candidate)
                found = True
        if found:
            pending_output_context = _line_opens_output_context(lower)
            continue
        for match in _RAW_ABS_PATH_RE.finditer(line):
            if match.start() < start:
                continue
            candidate = _clean_path(match.group(1))
            if _is_required_output_candidate(candidate) and candidate not in paths:
                paths.append(candidate)
                found = True
        for match in _RELATIVE_OUTPUT_RE.finditer(line):
            if match.start() < start:
                continue
            candidate = _clean_path(match.group(1))
            if _is_required_output_candidate(candidate) and candidate not in paths:
                paths.append(candidate)
                found = True
        pending_output_context = _line_opens_output_context(lower) and not found
    return paths


def expects_plan_output(instruction: str) -> bool:
    return PLAN_OUTPUT_PATH in instruction


def normalize_output_contract_mode(mode: str | None) -> str:
    normalized = (mode or "auto").strip().lower().replace("_", "-")
    if not normalized:
        return "auto"
    if normalized in _SKILLSBENCH_OUTPUT_CONTRACT_MODES:
        return "skillsbench"
    if normalized in _DISABLED_OUTPUT_CONTRACT_MODES:
        return "off"
    if normalized in _PLAN_OUTPUT_CONTRACT_MODES:
        return normalized
    return normalized


def output_contract_enabled(mode: str | None) -> bool:
    return normalize_output_contract_mode(mode) != "off"


def plan_output_contract_enabled(instruction: str, mode: str | None = None) -> bool:
    normalized = normalize_output_contract_mode(mode)
    if normalized in {"off", "skillsbench"}:
        return False
    if normalized in _PLAN_OUTPUT_CONTRACT_MODES:
        return True
    return expects_plan_output(instruction)


def find_missing_output_evidence(text: str) -> str | None:
    for line in text.splitlines():
        line_norm = re.sub(r"\s+", " ", line).strip()
        if not line_norm:
            continue
        lower = line_norm.lower()
        if _is_source_context_line(lower):
            continue
        if any(pattern in lower for pattern in _MISSING_OUTPUT_PATTERNS):
            return line_norm[:600]
        if any(pattern in lower for pattern in _GENERIC_MISSING_PATTERNS) and any(
            marker in lower for marker in _GENERIC_MISSING_OUTPUT_CONTEXT
        ):
            return line_norm[:600]
    return None


def _is_source_context_line(lower_line: str) -> bool:
    stripped = lower_line.strip()
    if stripped.startswith(('"trace":', '"stack":', '"longrepr":')):
        return True
    if "\\n" in stripped and (
        "def test_" in stripped
        or "assert " in stripped
        or "traceback" in stripped
    ):
        return True
    if "required content" in stripped and "not found" in stripped:
        return True
    if "not found in pdf text" in stripped:
        return True
    return stripped.startswith(
        (
            "assert ",
            "raise ",
            "if ",
            "elif ",
            "return ",
            "with ",
            "for ",
        )
    )


def build_output_check_command(
    *,
    required_output_paths: list[str],
    expects_plan_output: bool,
    plan_output_path: PurePosixPath | None = None,
    plan_artifact_path: PurePosixPath | None = None,
    allow_noop_when_empty: bool = True,
) -> str:
    config = {
        "required_output_paths": required_output_paths,
        "expects_plan_output": expects_plan_output,
        "plan_output_path": str(plan_output_path or PLAN_OUTPUT_PATH),
        "plan_artifact_path": str(plan_artifact_path or PLAN_ARTIFACT_PATH),
        "allow_noop_when_empty": allow_noop_when_empty,
    }
    config_json = json.dumps(config, ensure_ascii=True)
    return f"""python3 - <<'PY'
import glob
import json
import os
import re
from pathlib import Path

CONFIG = json.loads({config_json!r})
required_output_paths = list(CONFIG["required_output_paths"])
expects_plan_output = bool(CONFIG["expects_plan_output"])
plan_output_path = Path(CONFIG["plan_output_path"])
plan_artifact_path = Path(CONFIG["plan_artifact_path"])
allow_noop_when_empty = bool(CONFIG["allow_noop_when_empty"])


def path_to_glob(path: str) -> str:
    pattern = re.sub(r"<[^>]+>", "*", path)
    pattern = re.sub(r"\\{{[^}}]+\\}}", "*", pattern)
    return pattern


def validate_nonempty_file(path: Path) -> bool:
    return path.exists() and path.is_file() and path.stat().st_size > 0


def validate_plan_output() -> bool:
    if not validate_nonempty_file(plan_output_path):
        return False
    try:
        payload = json.loads(plan_output_path.read_text(encoding="utf-8"))
    except Exception:
        return False
    if not isinstance(payload, dict):
        return False
    status = str(payload.get("status") or "").strip().lower()
    if status in {{"draft", "placeholder", "todo", "incomplete", "partial"}}:
        return False
    unknown_steps = payload.get("unknown_steps")
    if unknown_steps not in (None, [], {{}}, ""):
        return False
    steps = payload.get("steps")
    if not isinstance(steps, list) or not steps:
        return False
    placeholder_terms = (
        "placeholder",
        "placeholder_valid_plan",
        "draft_placeholder",
        "reference_solution",
        "todo",
        "tbd",
        "unknown",
        "待定",
        "未定",
        "占位",
    )
    for step in steps:
        if not isinstance(step, dict):
            return False
        for key in ("step_number", "id", "workstation", "operation"):
            if key not in step:
                return False
            value = step.get(key)
            if key == "id":
                try:
                    int(value)
                except Exception:
                    return False
            if key in ("workstation", "operation"):
                text = str(value or "").strip()
                if not text:
                    return False
                lower = text.lower()
                if any(term in lower for term in placeholder_terms):
                    return False
    plan_artifact_path.parent.mkdir(parents=True, exist_ok=True)
    plan_artifact_path.write_text(
        json.dumps(payload, indent=2, ensure_ascii=False) + "\\n",
        encoding="utf-8",
    )
    return True


def validate_path_spec(path: str) -> bool:
    candidate_paths = [Path(path)]
    if not Path(path).is_absolute():
        candidate_paths.extend([
            Path("/root") / path,
            Path("/workspace") / path,
            Path.cwd() / path,
        ])
    if any(token in path for token in ("<", ">", "{", "}", "*")):
        patterns = [path_to_glob(str(candidate)) for candidate in candidate_paths]
        matches = []
        for pattern in patterns:
            matches.extend(
                Path(item)
                for item in glob.glob(pattern, recursive=True)
                if Path(item).is_file()
            )
        return any(validate_nonempty_file(match) for match in matches)
    return any(validate_nonempty_file(candidate) for candidate in candidate_paths)


checked_any = False

if expects_plan_output:
    checked_any = True
    if not validate_plan_output():
        raise SystemExit(1)

remaining_paths = [path for path in required_output_paths if path != str(plan_output_path)]
for path in remaining_paths:
    checked_any = True
    if not validate_path_spec(path):
        raise SystemExit(1)

if not checked_any and not allow_noop_when_empty:
    raise SystemExit(1)

raise SystemExit(0)
PY"""


def build_valid_output_guard_command(
    *,
    raw_command: str,
    output_log: PurePosixPath | str,
    contract_path: PurePosixPath | str,
    required_output_paths: list[str],
    expects_plan_output: bool,
    output_contract_mode: str | None,
    agent_kind: str,
    grace_env_var: str,
    poll_env_var: str,
    default_grace_sec: int = 30,
    default_poll_sec: int = 5,
    plan_output_path: PurePosixPath | str = PLAN_OUTPUT_PATH,
    plan_artifact_path: PurePosixPath | str = PLAN_ARTIFACT_PATH,
    max_runtime_sec: int | None = None,
) -> str:
    grace_sec = os.environ.get(
        grace_env_var,
        os.environ.get("AIREADY_VALID_OUTPUT_GRACE_SEC", str(default_grace_sec)),
    )
    poll_sec = os.environ.get(
        poll_env_var,
        os.environ.get("AIREADY_VALID_OUTPUT_POLL_SEC", str(default_poll_sec)),
    )
    payload = {
        "raw_command": raw_command,
        "output_log": str(output_log),
        "contract_path": str(contract_path),
        "grace_sec": grace_sec,
        "poll_sec": poll_sec,
        "output_path": str(plan_output_path),
        "artifact_path": str(plan_artifact_path),
        "required_output_paths": required_output_paths,
        "expects_plan_output": expects_plan_output,
        "output_contract_mode": normalize_output_contract_mode(output_contract_mode),
        "agent_kind": agent_kind,
        "max_runtime_sec": max_runtime_sec,
    }
    payload_json = json.dumps(payload, ensure_ascii=True)
    return f"""python3 - <<'PY'
import glob
import json
import os
import re
import select
import signal
import subprocess
import time
from pathlib import Path

CONFIG = json.loads({payload_json!r})
output_log = Path(CONFIG["output_log"])
contract_path = Path(CONFIG["contract_path"])
output_path = Path(CONFIG["output_path"])
artifact_path = Path(CONFIG["artifact_path"])
required_output_paths = list(CONFIG.get("required_output_paths") or [])
expects_plan_output = bool(CONFIG.get("expects_plan_output"))
output_contract_mode = str(CONFIG.get("output_contract_mode") or "auto")
agent_kind = str(CONFIG.get("agent_kind") or "agent")
output_log.parent.mkdir(parents=True, exist_ok=True)
contract_path.parent.mkdir(parents=True, exist_ok=True)
contract_disabled = output_contract_mode == "off"
grace_sec = max(0, int(CONFIG["grace_sec"]))
poll_sec = max(1, int(CONFIG["poll_sec"]))
max_runtime_raw = CONFIG.get("max_runtime_sec")
try:
    max_runtime_sec = int(max_runtime_raw) if max_runtime_raw not in (None, "") else None
except (TypeError, ValueError):
    max_runtime_sec = None
if max_runtime_sec is not None and max_runtime_sec <= 0:
    max_runtime_sec = None


def validate_nonempty_file(path: Path) -> bool:
    return path.exists() and path.is_file() and path.stat().st_size > 0


def path_to_glob(path: str) -> str:
    pattern = re.sub(r"<[^>]+>", "*", path)
    pattern = re.sub(r"\\{{[^}}]+\\}}", "*", pattern)
    return pattern


def validate_path_spec(path: str) -> bool:
    candidates = [Path(path)]
    if not Path(path).is_absolute():
        candidates.extend([Path("/root") / path, Path("/workspace") / path, Path.cwd() / path])
    if any(token in path for token in ("<", ">", "{{", "}}", "*")):
        matches = []
        for candidate in candidates:
            matches.extend(
                Path(item)
                for item in glob.glob(path_to_glob(str(candidate)), recursive=True)
                if Path(item).is_file()
            )
        return any(validate_nonempty_file(match) for match in matches)
    return any(validate_nonempty_file(candidate) for candidate in candidates)


def valid_plan_output() -> bool:
    if not validate_nonempty_file(output_path):
        return False
    try:
        payload = json.loads(output_path.read_text(encoding="utf-8"))
    except Exception:
        return False
    if not isinstance(payload, dict):
        return False
    status = str(payload.get("status") or "").strip().lower()
    if status in {{"draft", "placeholder", "todo", "incomplete", "partial"}}:
        return False
    unknown_steps = payload.get("unknown_steps")
    if unknown_steps not in (None, [], {{}}, ""):
        return False
    steps = payload.get("steps")
    if not isinstance(steps, list) or not steps:
        return False
    placeholder_terms = (
        "placeholder",
        "placeholder_valid_plan",
        "draft_placeholder",
        "reference_solution",
        "todo",
        "tbd",
        "unknown",
        "待定",
        "未定",
        "占位",
    )
    for step in steps:
        if not isinstance(step, dict):
            return False
        for key in ("step_number", "id", "workstation", "operation"):
            if key not in step:
                return False
            value = step.get(key)
            if key == "id":
                try:
                    int(value)
                except Exception:
                    return False
            if key in ("workstation", "operation"):
                text = str(value or "").strip()
                if not text:
                    return False
                lower = text.lower()
                if any(term in lower for term in placeholder_terms):
                    return False
    artifact_path.parent.mkdir(parents=True, exist_ok=True)
    artifact_path.write_text(
        json.dumps(payload, indent=2, ensure_ascii=False) + "\\n",
        encoding="utf-8",
    )
    return True


def valid_output() -> bool:
    if contract_disabled:
        return False
    checked_any = False
    if expects_plan_output:
        checked_any = True
        if not valid_plan_output():
            return False
    for path in required_output_paths:
        if path == str(output_path):
            continue
        checked_any = True
        if not validate_path_spec(path):
            return False
    if not checked_any:
        return False
    return True


def write_contract(status: str, reason: str, **extra: object) -> None:
    payload = {{
        "status": status,
        "reason": reason,
        "grace_sec": grace_sec,
        "output_contract_mode": output_contract_mode,
        "agent_kind": agent_kind,
        "diagnostic_note": "Harness-side output-contract diagnostic only; SkillsBench scoring must use verifier/* outputs.",
    }}
    payload.update(extra)
    contract_path.write_text(
        json.dumps(payload, indent=2, ensure_ascii=False) + "\\n",
        encoding="utf-8",
    )


proc = subprocess.Popen(
    CONFIG["raw_command"],
    shell=True,
    stdin=subprocess.DEVNULL,
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT,
    text=False,
    bufsize=0,
    preexec_fn=os.setsid,
)
stdout_fd = proc.stdout.fileno() if proc.stdout is not None else None
if stdout_fd is not None:
    os.set_blocking(stdout_fd, False)
valid_since = None
last_check = 0.0
started_at = time.monotonic()
with output_log.open("w", encoding="utf-8") as log:
    while True:
        chunk_text = ""
        if stdout_fd is not None:
            ready, _, _ = select.select([stdout_fd], [], [], 1.0)
            if ready:
                try:
                    chunk = os.read(stdout_fd, 65536)
                except BlockingIOError:
                    chunk = b""
                if chunk:
                    chunk_text = chunk.decode("utf-8", errors="replace")
        else:
            time.sleep(1)
        if chunk_text:
            print(chunk_text, end="", flush=True)
            log.write(chunk_text)
            log.flush()
        now = time.monotonic()
        if (
            max_runtime_sec is not None
            and valid_since is None
            and now - started_at >= max_runtime_sec
            and proc.poll() is None
        ):
            write_contract(
                "primary_soft_timeout",
                f"{{agent_kind}}_agent_primary_soft_timeout",
                max_runtime_sec=max_runtime_sec,
            )
            os.killpg(proc.pid, signal.SIGTERM)
            try:
                proc.wait(timeout=20)
            except subprocess.TimeoutExpired:
                os.killpg(proc.pid, signal.SIGKILL)
                proc.wait(timeout=20)
            if contract_disabled:
                raise SystemExit(0)
            raise SystemExit(124)
        if now - last_check >= poll_sec:
            last_check = now
            if valid_output():
                if valid_since is None:
                    valid_since = now
                    write_contract("valid_output_observed", "agent_still_running")
                elif now - valid_since >= grace_sec and proc.poll() is None:
                    write_contract(
                        "terminated_after_valid_output",
                        f"{{agent_kind}}_agent_exceeded_valid_output_grace",
                    )
                    os.killpg(proc.pid, signal.SIGTERM)
                    try:
                        proc.wait(timeout=20)
                    except subprocess.TimeoutExpired:
                        os.killpg(proc.pid, signal.SIGKILL)
                        proc.wait(timeout=20)
                    raise SystemExit(0)
        if proc.poll() is not None:
            if stdout_fd is not None:
                while True:
                    try:
                        chunk = os.read(stdout_fd, 65536)
                    except BlockingIOError:
                        break
                    if not chunk:
                        break
                    chunk_text = chunk.decode("utf-8", errors="replace")
                    print(chunk_text, end="", flush=True)
                    log.write(chunk_text)
            break

if contract_disabled:
    write_contract("agent_exited", "output_contract_disabled", return_code=proc.returncode)
    raise SystemExit(proc.returncode or 0)
if valid_output():
    write_contract("ok", "valid_output_available", return_code=proc.returncode)
    raise SystemExit(0)
write_contract("agent_exited", "no_valid_output", return_code=proc.returncode)
raise SystemExit(proc.returncode or 1)
PY"""


def _clean_path(path: str) -> str:
    return path.strip().strip("\"'").rstrip(".,);:")


def _line_opens_output_context(lower_line: str) -> bool:
    return lower_line.endswith(":") and _is_output_context_line(lower_line)


def _is_output_context_line(lower_line: str) -> bool:
    has_strong_output_marker = any(
        marker in lower_line for marker in _OUTPUT_SCAN_START_MARKERS
    )
    if any(marker in lower_line for marker in _NON_OUTPUT_LINE_MARKERS):
        # "example output using input ..." is not an instruction to write that
        # example/input path. Keep explicit write/save/output directives on the
        # same line, e.g. "input template is X; write final output to Y".
        if not has_strong_output_marker and not any(
            marker in lower_line
            for marker in ("write your script", "write your solution", "write your answer")
        ):
            return False
    if any(marker in lower_line for marker in _OUTPUT_CONTEXT_MARKERS):
        return True
    return any(marker in lower_line for marker in _OUTPUT_LINE_MARKERS)


def _is_required_output_candidate(path: str) -> bool:
    if not path:
        return False
    lower = path.lower()
    if lower.startswith(("http://", "https://")):
        return False
    if lower.startswith("/next-gen.") or lower.startswith("/www."):
        return False
    if lower.endswith("/"):
        return False
    if "/" not in path and not any(lower.endswith(ext) for ext in _OUTPUT_EXTENSIONS):
        return False
    if not any(lower.endswith(ext) for ext in _OUTPUT_EXTENSIONS):
        return False
    return True
