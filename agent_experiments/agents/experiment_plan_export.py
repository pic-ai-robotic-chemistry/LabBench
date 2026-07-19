from __future__ import annotations

import json
from pathlib import PurePosixPath


def build_export_command(
    *,
    agent_kind: str,
    source_log: PurePosixPath,
    output_path: PurePosixPath,
    artifact_path: PurePosixPath,
    summary_path: PurePosixPath,
) -> str:
    config = {
        "agent_kind": agent_kind,
        "source_log": str(source_log),
        "output_path": str(output_path),
        "artifact_path": str(artifact_path),
        "summary_path": str(summary_path),
    }
    config_json = json.dumps(config, ensure_ascii=True)
    script_body = r'''
import ast
import copy
import json
import re
from json import JSONDecoder
from pathlib import Path

CONFIG = json.loads(__CONFIG_JSON__)
SOURCE_LOG = Path(CONFIG["source_log"])
OUTPUT_PATH = Path(CONFIG["output_path"])
ARTIFACT_PATH = Path(CONFIG["artifact_path"])
SUMMARY_PATH = Path(CONFIG["summary_path"])
AGENT_KIND = CONFIG["agent_kind"]

MAX_TEXT_CHARS = 3_000_000
MAX_FILE_BYTES = 1_500_000
MAX_PARSE_CANDIDATES = 2000
PLACEHOLDER_TERMS = (
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
SECRET_KEY_RE = re.compile(
    r"(token|authorization|api[_-]?key|apikey|secret|password|credential|bearer)",
    re.IGNORECASE,
)
BEARER_RE = re.compile(r"Bearer\s+[A-Za-z0-9._~+/=-]+")
KEY_RE = re.compile(r"\b(?:sk|ak)-[A-Za-z0-9][A-Za-z0-9._~/-]{8,}\b")


def scrub(value):
    if isinstance(value, dict):
        cleaned = {}
        for key, item in value.items():
            if SECRET_KEY_RE.search(str(key)):
                continue
            cleaned[key] = scrub(item)
        return cleaned
    if isinstance(value, list):
        return [scrub(item) for item in value]
    if isinstance(value, str):
        return KEY_RE.sub("<redacted>", BEARER_RE.sub("Bearer <redacted>", value))
    return value


def normalize_int(value, *, field: str, step_index: int) -> int:
    try:
        normalized = int(value)
    except Exception as exc:
        raise ValueError(f"step {step_index} {field} is not an integer") from exc
    if normalized <= 0:
        raise ValueError(f"step {step_index} {field} is not positive")
    return normalized


def extract_step_fields(raw_step: dict, index: int) -> dict:
    step = scrub(copy.deepcopy(raw_step))
    if "step_number" not in step:
        step["step_number"] = index
    step["step_number"] = normalize_int(step.get("step_number"), field="step_number", step_index=index)
    if step.get("id") in (None, ""):
        raise ValueError(f"step {index} missing id")
    step["id"] = normalize_int(step.get("id"), field="id", step_index=index)
    for key in ("workstation", "operation"):
        text = str(step.get(key) or "").strip()
        if not text:
            raise ValueError(f"step {index} missing {key}")
        if any(term in text.lower() for term in PLACEHOLDER_TERMS):
            raise ValueError(f"step {index} contains placeholder {key}: {text[:120]}")
        step[key] = text
    if not isinstance(step.get("parameters"), dict):
        step["parameters"] = {}
    return step


def plan_parts(payload: dict):
    experiment_steps = payload.get("experiment_steps")
    if isinstance(experiment_steps, dict) and isinstance(experiment_steps.get("steps"), list):
        return experiment_steps["steps"], experiment_steps.get("unknown_steps")
    if isinstance(payload.get("steps"), list):
        return payload["steps"], payload.get("unknown_steps")
    return None, None


def normalize_plan(payload: object):
    if not isinstance(payload, dict):
        return None
    raw_steps, unknown_steps = plan_parts(payload)
    if not isinstance(raw_steps, list) or not raw_steps:
        return None
    if unknown_steps not in (None, [], {}, ""):
        return None
    try:
        steps = [extract_step_fields(raw_step, index) for index, raw_step in enumerate(raw_steps, start=1)]
    except Exception:
        return None
    normalized = scrub(copy.deepcopy(payload))
    normalized["steps"] = steps
    normalized["unknown_steps"] = []
    experiment_steps = normalized.get("experiment_steps")
    if isinstance(experiment_steps, dict):
        experiment_steps["steps"] = steps
        experiment_steps["unknown_steps"] = []
    return normalized


def extract_plan_from_value(value: object):
    if isinstance(value, dict):
        normalized = normalize_plan(value)
        if normalized is not None:
            return normalized
        for item in reversed(list(value.values())):
            nested = extract_plan_from_value(item)
            if nested is not None:
                return nested
    elif isinstance(value, list):
        for item in reversed(value):
            nested = extract_plan_from_value(item)
            if nested is not None:
                return nested
    return None


def iter_json_values(text: str):
    decoder = JSONDecoder()
    index = 0
    emitted = 0
    while index < len(text) and emitted < MAX_PARSE_CANDIDATES:
        brace_index = min(
            [candidate for candidate in (text.find("{", index), text.find("[", index)) if candidate != -1],
            default=-1,
        )
        if brace_index == -1:
            break
        try:
            value, offset = decoder.raw_decode(text[brace_index:])
        except json.JSONDecodeError:
            index = brace_index + 1
            continue
        yield value
        emitted += 1
        index = brace_index + max(offset, 1)


def balanced_candidate(text: str, start: int) -> str | None:
    opening = text[start]
    closing_for = {"{": "}", "[": "]"}
    if opening not in closing_for:
        return None
    stack = [closing_for[opening]]
    quote = None
    escaped = False
    for index in range(start + 1, min(len(text), start + MAX_FILE_BYTES)):
        char = text[index]
        if quote is not None:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == quote:
                quote = None
            continue
        if char in ("'", '"'):
            quote = char
            continue
        if char in "{[":
            stack.append(closing_for[char])
            continue
        if stack and char == stack[-1]:
            stack.pop()
            if not stack:
                return text[start : index + 1]
    return None


def iter_python_literal_values(text: str):
    emitted = 0
    for match in re.finditer(r"[\{\[]", text):
        if emitted >= MAX_PARSE_CANDIDATES:
            break
        candidate = balanced_candidate(text, match.start())
        if not candidate:
            continue
        try:
            value = ast.literal_eval(candidate)
        except Exception:
            continue
        yield value
        emitted += 1


def iter_structured_values(text: str):
    yield from iter_json_values(text)
    yield from iter_python_literal_values(text)


def iter_fenced_blocks(text: str):
    for match in re.finditer(r"```(?:json|JSON)?\s*(.*?)```", text, re.IGNORECASE | re.DOTALL):
        block = match.group(1).strip()
        if block:
            yield block


def iter_heredoc_blocks(text: str):
    pattern = re.compile(
        r"<<-?\s*['\"]?([A-Za-z_][A-Za-z0-9_.-]*)['\"]?\s*\n(.*?)\n\1\b",
        re.DOTALL,
    )
    for match in pattern.finditer(text):
        block = match.group(2).strip()
        if block:
            yield block


def extract_plan_from_text(text: str):
    if not text:
        return None
    if len(text) > MAX_TEXT_CHARS:
        text = text[-MAX_TEXT_CHARS:]
    segments = list(iter_fenced_blocks(text))
    segments.extend(iter_heredoc_blocks(text))
    segments.append(text)
    for segment in reversed(segments):
        values = list(iter_structured_values(segment))
        for payload in reversed(values):
            plan = extract_plan_from_value(payload)
            if plan is not None:
                return plan
    return None


def collect_strings(value, candidates: list[str], *, depth: int = 0) -> None:
    if depth > 10:
        return
    if isinstance(value, str):
        stripped = value.strip()
        if stripped and any(
            marker in stripped
            for marker in (
                "experiment_steps",
                '"steps"',
                "'steps'",
                "workstation",
                "operation",
                "cat >",
                "cat <<",
                "```",
            )
        ):
            candidates.append(stripped)
        return
    if isinstance(value, dict):
        for item in value.values():
            collect_strings(item, candidates, depth=depth + 1)
    elif isinstance(value, list):
        for item in value:
            collect_strings(item, candidates, depth=depth + 1)


def collect_log_candidates(raw_text: str) -> list[str]:
    candidates: list[str] = []
    for line in raw_text.splitlines():
        stripped = line.strip()
        if not stripped or stripped[0] not in "{[":
            continue
        try:
            event = json.loads(stripped)
        except json.JSONDecodeError:
            continue
        collect_strings(event, candidates)
    for payload in iter_json_values(raw_text):
        collect_strings(payload, candidates)
    return candidates


def safe_candidate_file(path: Path) -> bool:
    blocked_parts = {
        ".cache",
        ".config",
        ".npm",
        ".openclaw",
        ".venv",
        "__pycache__",
        "node_modules",
        "site-packages",
    }
    if any(part in blocked_parts for part in path.parts):
        return False
    if path.suffix.lower() not in {".json", ".jsonl", ".txt", ".log"}:
        return False
    try:
        return path.is_file() and 0 < path.stat().st_size <= MAX_FILE_BYTES
    except OSError:
        return False


def iter_candidate_files():
    seen = set()
    explicit = [OUTPUT_PATH, ARTIFACT_PATH]
    roots = [
        Path("/workspace"),
        Path("/logs/artifacts"),
        Path("/logs/agent"),
        Path("/root"),
        Path("/tmp"),
    ]
    for path in explicit:
        if path not in seen and safe_candidate_file(path):
            seen.add(path)
            yield path
    for root in roots:
        if not root.exists():
            continue
        for path in root.rglob("*"):
            if path in seen or not safe_candidate_file(path):
                continue
            seen.add(path)
            yield path


def load_existing_output():
    if not OUTPUT_PATH.exists():
        return None
    try:
        payload = json.loads(OUTPUT_PATH.read_text(encoding="utf-8"))
    except Exception:
        return None
    return normalize_plan(payload)


def write_payload(payload: dict, source: str) -> None:
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    ARTIFACT_PATH.parent.mkdir(parents=True, exist_ok=True)
    rendered = json.dumps(payload, indent=2, ensure_ascii=False) + "\n"
    OUTPUT_PATH.write_text(rendered, encoding="utf-8")
    ARTIFACT_PATH.write_text(rendered, encoding="utf-8")
    SUMMARY_PATH.parent.mkdir(parents=True, exist_ok=True)
    SUMMARY_PATH.write_text(
        json.dumps(
            {
                "status": "exported",
                "source": source,
                "output_path": str(OUTPUT_PATH),
                "artifact_path": str(ARTIFACT_PATH),
                "step_count": len(payload.get("steps") or []),
                "agent_kind": AGENT_KIND,
            },
            indent=2,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )


def write_failure(reason: str, *, checked_files: list[str] | None = None) -> None:
    SUMMARY_PATH.parent.mkdir(parents=True, exist_ok=True)
    SUMMARY_PATH.write_text(
        json.dumps(
            {
                "status": "not_found",
                "reason": reason,
                "source_log": str(SOURCE_LOG),
                "checked_files": checked_files or [],
                "agent_kind": AGENT_KIND,
            },
            indent=2,
            ensure_ascii=False,
        )
        + "\n",
        encoding="utf-8",
    )


payload = load_existing_output()
if payload is not None:
    write_payload(payload, "existing_output")
    raise SystemExit(0)

checked_files = []
for candidate_file in iter_candidate_files():
    checked_files.append(str(candidate_file))
    try:
        text = candidate_file.read_text(encoding="utf-8", errors="replace")
    except OSError:
        continue
    plan = extract_plan_from_text(text)
    if plan is not None:
        write_payload(plan, f"file:{candidate_file}")
        raise SystemExit(0)

if not SOURCE_LOG.exists():
    write_failure("missing_source_log", checked_files=checked_files)
    raise SystemExit(0)

raw_text = SOURCE_LOG.read_text(encoding="utf-8", errors="replace")
candidates = collect_log_candidates(raw_text)
candidates.append(raw_text)

for candidate in reversed(candidates):
    plan = extract_plan_from_text(candidate)
    if plan is not None:
        write_payload(plan, "log_extract")
        raise SystemExit(0)

write_failure("no_valid_plan_json_found", checked_files=checked_files)
'''
    return "python3 - <<'PY'\n" + script_body.replace("__CONFIG_JSON__", repr(config_json)).strip() + "\nPY"


def build_export_command_nonfatal(
    *,
    agent_kind: str,
    source_log: PurePosixPath,
    output_path: PurePosixPath,
    artifact_path: PurePosixPath,
    summary_path: PurePosixPath,
) -> str:
    command = build_export_command(
        agent_kind=agent_kind,
        source_log=source_log,
        output_path=output_path,
        artifact_path=artifact_path,
        summary_path=summary_path,
    )
    return f"{command}\ntrue"
