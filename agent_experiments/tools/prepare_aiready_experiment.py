#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import os
import re
import shutil
from pathlib import Path
from typing import Any
from xml.etree import ElementTree as ET
from zipfile import ZipFile


OUTPUT_JSON_NAME = "experiment_plan.json"
INSTRUCTION_STYLES = ("full", "pure-english-description")
OUTPUT_CONTRACT_MODES = ("plan",)

BENCHMARK_VERSION = "v15"
BENCHMARK_SOURCE_DOCX = Path("Benchmark_V15.docx")
BENCHMARK_SOURCE_LABEL = str(BENCHMARK_SOURCE_DOCX)
MODEL_INTENSITY = "high"

TASK_MODULE_DIRECTIONS = {
    "A": "OER electrocatalysis",
    "B": "HER electrocatalysis",
    "C": "UOR electrocatalysis",
    "D": "EOR electrocatalysis",
    "E": "aqueous battery electrode materials",
    "F": "photocatalysis",
    "G": "selective hydrogenation catalysis",
}


def load_tasks_from_docx(path: Path) -> dict[str, dict[str, str]]:
    candidate_paths = [path]
    if not path.is_absolute():
        candidate_paths.append(Path(__file__).resolve().parents[1] / path)
    source_path = next((candidate for candidate in candidate_paths if candidate.exists()), None)
    if source_path is None:
        raise FileNotFoundError(f"AIREADY {BENCHMARK_VERSION.upper()} benchmark docx not found: {path}")

    namespace = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
    with ZipFile(source_path) as docx:
        root = ET.fromstring(docx.read("word/document.xml"))

    paragraphs: list[str] = []
    for paragraph in root.findall(".//w:p", namespace):
        text = "".join(
            node.text or "" for node in paragraph.findall(".//w:t", namespace)
        ).strip()
        if text:
            paragraphs.append(text)

    task_title_pattern = re.compile(r"^([A-G]\d{2})(?:\s*[:：]\s*|\s+|(?=[^\s:：\-–—]))(.+)$")
    start_index = next(
        (
            index
            for index, text in enumerate(paragraphs)
            if task_title_pattern.match(text)
        ),
        None,
    )
    if start_index is None:
        raise ValueError(f"No task title like A01 found in {source_path}")

    end_index = next(
        (
            index
            for index, text in enumerate(paragraphs[start_index:], start=start_index)
            if text.startswith("四、")
        ),
        len(paragraphs),
    )

    tasks: dict[str, dict[str, str]] = {}
    index = start_index
    while index < end_index:
        title_match = task_title_pattern.match(paragraphs[index])
        if not title_match:
            raise ValueError(f"Unexpected task title paragraph in {source_path}: {paragraphs[index]!r}")
        task_id, title = title_match.groups()
        title = title.rstrip(":：").strip()
        if index + 1 >= end_index:
            raise ValueError(f"Missing task description after {task_id} in {source_path}")
        description = paragraphs[index + 1]
        module = task_id[0]
        tasks[task_id] = {
            "module": module,
            "title": title,
            "description": description,
            "direction": TASK_MODULE_DIRECTIONS.get(module, "chemistry"),
        }
        index += 2

    return tasks


TASKS: dict[str, dict[str, str]] | None = None
DEFAULT_TASK_IDS = tuple(load_tasks_from_docx(BENCHMARK_SOURCE_DOCX).keys())

SKILL_VARIANTS = {
    "lab-design-main-skills": Path("aiready/lab-design-main/skills"),
    "lab-design-main-5-13-skills": Path("aiready/lab-design-main-5-13/skills"),
    "aiready-skills-2026-05-23": Path("aiready/aiready-skills-2026-05-23"),
    "aiready-skill-7.6": Path("aiready/aiready_skill_7.6"),
}
DEFAULT_SKILL_VARIANTS = ("aiready-skill-7.6",)

HARNESSES = (
    "openclaw",
    "codex",
    "claude-code",
    "gemini-cli",
    "hermes",
    "kilo-code",
)

MODEL_ENV_KEYS = {
    "model_a": "MODEL_A",
}

DIRECT_API_KEY_ENV_MATRIX: dict[tuple[str, str], str] = {}

HUMAN_MODEL_LABELS = {
    "model_a": "model-a",
}

HARNESS_ENV_PREFIXES = {
    "claude-code": "CLAUDE_CODE",
    "codex": "CODEX",
    "gemini-cli": "GEMINI_CLI",
    "hermes": "HERMES",
    "kilo-code": "KILO_CODE",
    "openclaw": "OPENCLAW",
}

HARNESS_HUMAN_LABELS = {
    "claude-code": "claude-code",
    "codex": "codex",
    "gemini-cli": "gemini-cli",
    "hermes": "hermes",
    "kilo-code": "kilo-code",
    "openclaw": "openclaw",
}

V13_NA_CONFIGS: set[tuple[str, str]] = set()
V14_NA_CONFIGS: set[tuple[str, str]] = set()
V15_NA_CONFIGS: set[tuple[str, str]] = set()

MODELS = {
    "model_a": {
        "model_name": "${AIREADY_MODEL_A_NAME}",
        "provider": "openai-compatible",
        "provider_label": "config-model",
        "base_url_env": "AIREADY_MODEL_A_BASE_URL",
        "anthropic_base_url_env": "AIREADY_MODEL_A_ANTHROPIC_BASE_URL",
        "gemini_base_url_env": "AIREADY_MODEL_A_GEMINI_BASE_URL",
    },
}

CODEX_SUPPORTED_MODELS = set(MODELS)


FAITHFUL_ENGLISH_TITLES = {
    "A01": "Preparation and Baseline Evaluation of a NiFe LDH Oxygen Evolution Catalyst",
    "B01": "Preparation and Baseline Evaluation of a NiMo-Based HER Catalyst",
    "F01": (
        "Preparation and Baseline Evaluation of a Metal-Oxide-Based Photocatalytic "
        "Hydrogen-Evolution Half-Reaction Material"
    ),
}

FAITHFUL_ENGLISH_DESCRIPTIONS = {
    (
        "A01",
        "为了获得 NiFe 层状双氢氧化物（NiFe LDH）在碱性析氧反应中的基础电化学性能测试，请设计一套从催化剂制备到 OER 测试的完整实验方案。实验应能够支持后续对该催化剂活性表现的初步判断，并覆盖材料制备、必要后处理、结构表征、电极制备和电化学工作站测试等关键环节，并将实验下发至303实验室。",
    ): (
        "To obtain baseline electrochemical performance data for NiFe layered double hydroxide "
        "(NiFe LDH) in the alkaline oxygen evolution reaction (OER), design a complete "
        "experimental plan from catalyst preparation through OER testing. The experiment "
        "should support a preliminary judgment of this catalyst's activity and cover key "
        "steps including material preparation, necessary post-treatment, structural "
        "characterization, electrode preparation, and electrochemical workstation testing, "
        "and actually dispatch the experiment to the 303 laboratory."
    ),
    (
        "B01",
        "为了获得 NiMo 基无机催化剂在碱性析氢反应中的基础电化学表现，请设计一套完整实验方案。实验应覆盖催化剂制备、必要后处理、结构表征、电极制备和基于电化学工作站的 HER 测试，使结果能够用于初步判断该催化剂对HER的催化作用，并将实验下发至303实验室。",
    ): (
        "To obtain baseline electrochemical performance data for a NiMo-based inorganic "
        "catalyst in the alkaline hydrogen evolution reaction (HER), design a complete "
        "experimental plan. The experiment should cover catalyst preparation, necessary "
        "post-treatment, structural characterization, electrode preparation, and HER "
        "testing on an electrochemical workstation, so that the results can support a "
        "preliminary judgment of this catalyst's catalytic effect for HER, and actually "
        "dispatch the experiment to the 303 laboratory."
    ),
    (
        "F01",
        "为了获得金属氧化物基半导体光催化材料在空气气氛下水还原产氢半反应中的基础光催化表现，请设计一套完整实验方案。实验方案应围绕材料制备、必要热处理、助催化剂负载、氧化半反应选择、氢气检测展开，并将实验下发至303实验室。",
    ): (
        "To obtain baseline photocatalytic performance data for a metal-oxide-based "
        "semiconductor photocatalytic material in the water-reduction hydrogen-evolution "
        "half-reaction under an air atmosphere, design a complete experimental plan. The "
        "plan should cover material preparation, necessary heat treatment, cocatalyst "
        "loading, selection of the oxidation half-reaction, and hydrogen detection, and "
        "actually dispatch the experiment to the 303 laboratory."
    ),
}


def unsupported_config_reason(harness: str, model_key: str) -> str | None:
    if model_key not in MODELS:
        return f"unknown model key: {model_key}"
    if harness not in HARNESSES:
        return f"unsupported public harness: {harness}"
    return None


def model_name_for_harness(harness: str, model_entry: dict[str, Any]) -> str:
    return (model_entry.get("model_name_by_harness") or {}).get(
        harness,
        model_entry["model_name"],
    )


def api_key_env_for(harness: str, model_key: str) -> str:
    direct_key = DIRECT_API_KEY_ENV_MATRIX.get((harness, model_key))
    if direct_key:
        return direct_key
    return (
        f"AIREADY_{HARNESS_ENV_PREFIXES[harness]}_"
        f"{MODEL_ENV_KEYS[model_key]}_API_KEY"
    )


def formal_key_label_for(harness: str, model_key: str) -> str:
    return (
        f"aiready-{HARNESS_HUMAN_LABELS[harness]}-"
        f"{HUMAN_MODEL_LABELS[model_key]}"
    )


def agent_env_for(harness: str, model_key: str, output_contract_mode: str = "plan") -> dict[str, str]:
    model_entry = {**MODELS[model_key], "_model_key": model_key}
    api_key_ref = f"${{{api_key_env_for(harness, model_key)}}}"
    provider = model_entry["provider"]
    env = {
        "FORMAL_KEY_LABEL": formal_key_label_for(harness, model_key),
        "FORMAL_KEY_PROVIDER": model_entry["provider_label"],
        "FORMAL_MODEL_LABEL": HUMAN_MODEL_LABELS[model_key],
        "AIREADY_BENCHMARK": BENCHMARK_VERSION,
        "AIREADY_REASONING_INTENSITY": MODEL_INTENSITY,
        "OUTPUT_CONTRACT_MODE": "aiready",
        "AUTH_SERVICE_URL": "${AUTH_SERVICE_URL}",
        "AICHEM_CLOUD_GATEWAY": "${AICHEM_CLOUD_GATEWAY}",
        "AICHEM_APP_TOKEN": "${AICHEM_APP_TOKEN}",
        "WORKFLOW_TOKEN": "${AICHEM_APP_TOKEN}",
        "WORKFLOW_SERVICE_URL": "${WORKFLOW_SERVICE_URL}",
        "AICHEM_TARGET_APP_LABEL": "${AICHEM_TARGET_APP_LABEL}",
        "AICHEM_TIMEOUT_SEC": "${AICHEM_TIMEOUT_SEC}",
    }

    if provider != "openai-compatible":
        raise ValueError(f"Unsupported public model provider: {provider}")

    base_url_ref = f"${{{model_entry['base_url_env']}}}"
    if harness == "claude-code":
        env["FORMAL_KEY_PROVIDER"] = "anthropic-compatible"
        env["ANTHROPIC_API_KEY"] = api_key_ref
        env["ANTHROPIC_AUTH_TOKEN"] = api_key_ref
        env["ANTHROPIC_BASE_URL"] = f"${{{model_entry['anthropic_base_url_env']}}}"
    elif harness == "gemini-cli":
        env["FORMAL_KEY_PROVIDER"] = "gemini-compatible"
        env["GEMINI_API_KEY"] = api_key_ref
        env["GOOGLE_API_KEY"] = api_key_ref
        env["GOOGLE_GEMINI_BASE_URL"] = f"${{{model_entry['gemini_base_url_env']}}}"
    elif harness == "hermes":
        env["OPENAI_API_KEY"] = api_key_ref
        env["OPENAI_BASE_URL"] = base_url_ref
        env["HERMES_PROVIDER"] = "openai"
    elif harness in {"codex", "kilo-code", "openclaw"}:
        env["OPENAI_API_KEY"] = api_key_ref
        env["OPENAI_BASE_URL"] = base_url_ref
    else:
        raise ValueError(f"Unsupported harness: {harness}")
    return env


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Prepare the aiready chemistry benchmark experiment."
    )
    parser.add_argument("--out-root", type=Path, default=Path("aiready/generated-v15"))
    parser.add_argument("--benchmark-version", default=BENCHMARK_VERSION)
    parser.add_argument("--source-docx", type=Path, default=BENCHMARK_SOURCE_DOCX)
    parser.add_argument("--task-ids", nargs="+", default=list(DEFAULT_TASK_IDS))
    parser.add_argument("--harnesses", nargs="+", choices=HARNESSES, default=list(HARNESSES))
    parser.add_argument("--models", nargs="+", choices=list(MODELS), default=list(MODELS))
    parser.add_argument(
        "--skill-variants",
        nargs="+",
        default=list(DEFAULT_SKILL_VARIANTS),
        help=(
            "Skill variant names to include. Built-in names are supported by default; "
            "additional names can be supplied with --extra-skill-variant NAME=PATH."
        ),
    )
    parser.add_argument(
        "--extra-skill-variant",
        action="append",
        default=[],
        metavar="NAME=PATH",
        help="Register an additional skill variant pointing at a local skills directory.",
    )
    parser.add_argument(
        "--registry-prefix",
        default="aiready-local/aiready",
        help="Docker repository prefix written into prebuilt task.toml files.",
    )
    parser.add_argument("--image-tag", default="dev")
    parser.add_argument("--jobs-dir", type=Path, default=Path("jobs"))
    parser.add_argument("--job-name-prefix", default="aiready-v6")
    parser.add_argument(
        "--instruction-style",
        choices=INSTRUCTION_STYLES,
        default="full",
        help=(
            "Model-facing instruction style. Use 'pure-english-description' for strict "
            "benchmark runs where the model prompt must contain only the faithful English "
            "task text without harness/output-contract guidance."
        ),
    )
    parser.add_argument(
        "--output-contract-mode",
        choices=OUTPUT_CONTRACT_MODES,
        default="plan",
        help=(
            "Require agents to write the final executable JSON plan to "
            "/workspace/experiment_plan.json and export a readable copy to "
            "/logs/artifacts/final_plan.json."
        ),
    )
    parser.add_argument("--n-attempts", type=int, default=1)
    parser.add_argument("--n-concurrent-trials", type=int, default=2)
    parser.add_argument("--agent-timeout-sec", type=int, default=1800)
    parser.add_argument("--environment-cpus", type=int, default=2)
    parser.add_argument("--environment-memory-mb", type=int, default=12288)
    parser.add_argument("--environment-storage-mb", type=int, default=20480)
    return parser.parse_args()


def reset_dir(path: Path) -> None:
    if path.exists():
        shutil.rmtree(path)
    path.mkdir(parents=True, exist_ok=True)


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def write_json(path: Path, payload: Any) -> None:
    write_text(path, json.dumps(payload, indent=2, ensure_ascii=False) + "\n")


def copy_skills(src: Path, dst: Path) -> None:
    if not src.exists():
        raise FileNotFoundError(f"Skill directory not found: {src}")
    ignore = shutil.ignore_patterns(".DS_Store", "__pycache__", "*.pyc")
    shutil.copytree(src, dst, ignore=ignore)


def parse_extra_skill_variants(items: list[str]) -> dict[str, Path]:
    variants: dict[str, Path] = {}
    for item in items:
        if "=" not in item:
            raise ValueError(f"Invalid --extra-skill-variant value, expected NAME=PATH: {item}")
        name, raw_path = item.split("=", 1)
        name = name.strip()
        raw_path = raw_path.strip()
        if not name or not raw_path:
            raise ValueError(f"Invalid --extra-skill-variant value, expected NAME=PATH: {item}")
        variants[name] = Path(raw_path)
    return variants


ACTUAL_303_DISPATCH_SUFFIX = "actually dispatch the experiment to the 303 laboratory."
ACTUAL_303_DISPATCH_SENTENCE = (
    "Actually dispatch the experiment to the 303 laboratory and return the ID of the experimental task."
)


def normalize_actual_303_dispatch(description: str) -> str:
    normalized = description.rstrip()
    if normalized.endswith(ACTUAL_303_DISPATCH_SUFFIX):
        return normalized
    standalone_dispatch_patterns = (
        r"(?:^|(?<=[.!?])\s*)dispatch\s+the\s+experiment\s+to\s+laboratory\s+303\s+and\s+return\s+the\s+id\s+of\s+the\s+experimental\s+task\.\s*$",
        r"(?:^|(?<=[.!?])\s*)dispatch\s+the\s+experiment\s+to\s+the\s+303\s+laboratory\s+and\s+return\s+the\s+id\s+of\s+the\s+experimental\s+task\.\s*$",
    )
    for pattern in standalone_dispatch_patterns:
        updated = re.sub(
            pattern,
            lambda match: (" " if match.group(0).startswith(" ") else "") + ACTUAL_303_DISPATCH_SENTENCE,
            normalized,
            flags=re.IGNORECASE,
        )
        if updated != normalized:
            return updated
    legacy_suffix = "dispatch the experiment to the 303 laboratory."
    if normalized.lower().endswith(legacy_suffix):
        return normalized[: -len(legacy_suffix)] + ACTUAL_303_DISPATCH_SUFFIX
    if normalized.endswith("."):
        return f"{normalized} {ACTUAL_303_DISPATCH_SUFFIX}"
    return f"{normalized}, and {ACTUAL_303_DISPATCH_SUFFIX}"


def faithful_english_description_for(task_id: str, task: dict[str, str]) -> str | None:
    description = FAITHFUL_ENGLISH_DESCRIPTIONS.get((task_id, task["description"]))
    if description is not None:
        return normalize_actual_303_dispatch(description)
    raw = task.get("description", "").strip()
    if not raw:
        return None
    if re.search(r"[\u4e00-\u9fff]", raw):
        return None
    if BENCHMARK_VERSION.lower() in {"v13", "v14", "v15"}:
        return raw.rstrip() + "\n"
    return normalize_actual_303_dispatch(raw).rstrip() + "\n"


def instruction_for(
    task_id: str,
    task: dict[str, str],
    *,
    instruction_style: str = "full",
) -> str:
    is_english_source = not re.search(r"[\u4e00-\u9fff]", task.get("description", ""))
    english_title = task.get("title", "").strip() if is_english_source else FAITHFUL_ENGLISH_TITLES.get(task_id)
    english_description = faithful_english_description_for(task_id, task)
    if not english_title:
        english_title = task.get("title", "").strip()
    if not english_title or not english_description:
        raise ValueError(
            f"Missing faithful English title/description for {task_id}; "
            "refusing to generate an English-only model instruction from the Chinese source text."
        )

    if instruction_style == "pure-english-description":
        return english_description.rstrip() + "\n"
    if instruction_style != "full":
        raise ValueError(f"Unsupported instruction style: {instruction_style}")

    return "\n".join(
        [
            english_title,
            "",
            english_description,
            "",
            f"Write the final executable JSON plan to `/workspace/{OUTPUT_JSON_NAME}`.",
            "Copy the same JSON to `/logs/artifacts/final_plan.json`.",
        ]
    ).rstrip() + "\n"


def task_toml(
    *,
    timeout_sec: int,
    difficulty: str,
    docker_image: str | None = None,
    environment_cpus: int,
    environment_memory_mb: int,
    environment_storage_mb: int,
) -> str:
    docker_line = f'docker_image = "{docker_image}"\n' if docker_image else ""
    return f"""version = "1.0"

[metadata]
author_name = "Codex"
author_email = "codex@example.com"
difficulty = "{difficulty}"
category = "chemistry"
tags = ["chemistry", "single-turn", "json", "skills", "aiready"]

[verifier]
timeout_sec = 300.0

[agent]
timeout_sec = {float(timeout_sec)}

[environment]
build_timeout_sec = 300.0
cpus = {environment_cpus}
memory_mb = {environment_memory_mb}
storage_mb = {environment_storage_mb}
env = {{}}
{docker_line}skills_dir = "/opt/skill-layer/skills"
"""


def environment_dockerfile() -> str:
    return """FROM ubuntu:24.04
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \\
    bash \\
    ca-certificates \\
    curl \\
    jq \\
    python3 \\
    python3-pip \\
    python3-openpyxl \\
    python3-requests \\
    python3-venv \\
    ripgrep \\
    && python3 -m pip install --break-system-packages --no-cache-dir \\
        anthropic \\
        openpyxl \\
        requests \\
    && rm -rf /root/.cache/pip /var/lib/apt/lists/*

WORKDIR /root

COPY skills /opt/task-original-skills

RUN mkdir -p /workspace /logs/artifacts /logs/agent /logs/verifier \\
    && chmod -R 777 /workspace /logs
"""


def solution_script(
    task_id: str,
    task: dict[str, str],
    skill_variant: str,
    output_contract_mode: str = "plan",
) -> str:
    reference_prompt = {
        "task_id": task_id,
        "title": task["title"],
        "description": task["description"],
        "skill_variant": skill_variant,
        "execution_instruction": (
            "Please use the skill in chemistry-experiment-workstation to design the "
            "experiment and generate executable JSON according to the requirements above."
        ),
    }
    reference_prompt.update(
        {
            "required_output_file": f"/workspace/{OUTPUT_JSON_NAME}",
            "artifact_copy": "/logs/artifacts/final_plan.json",
        }
    )
    return (
        "#!/bin/bash\n"
        "set -euo pipefail\n\n"
        "mkdir -p /workspace /logs/artifacts\n"
        "cat <<'EOF' > /logs/artifacts/reference_prompt.json\n"
        + json.dumps(reference_prompt, indent=2, ensure_ascii=False)
        + "\nEOF\n"
        "cat <<'EOF' > /workspace/experiment_plan.json\n"
        + json.dumps(
            {
                "task_id": task_id,
                "skill_variant": skill_variant,
                "steps": [
                    {
                        "step_number": 1,
                        "workstation": "reference_solution",
                        "operation": "placeholder_valid_plan",
                        "parameters": {
                            "note": "Reference solution only validates task wiring.",
                        },
                    }
                ],
            },
            indent=2,
            ensure_ascii=False,
        )
        + "\nEOF\n"
        "cp /workspace/experiment_plan.json /logs/artifacts/final_plan.json\n"
    )


def test_sh(output_contract_mode: str = "plan") -> str:
    return """#!/bin/bash
set -euo pipefail

mkdir -p /logs/verifier /logs/artifacts

if [ -f /workspace/experiment_plan.json ]; then
  cp /workspace/experiment_plan.json /logs/artifacts/final_plan.json 2>/dev/null || true
fi

TEST_OUTPUTS_PY="/tests/test_outputs.py"
if [ ! -f "${TEST_OUTPUTS_PY}" ] && [ -f "/opt/task/tests/test_outputs.py" ]; then
  TEST_OUTPUTS_PY="/opt/task/tests/test_outputs.py"
fi

set +e
python3 "${TEST_OUTPUTS_PY}" > /logs/verifier/test_output.log 2>&1
status=$?
set -e

cat /logs/verifier/test_output.log

if [ $status -eq 0 ]; then
  echo 1 > /logs/verifier/reward.txt
else
  echo 0 > /logs/verifier/reward.txt
fi

exit 0
"""


def test_outputs_py(output_contract_mode: str = "plan") -> str:
    return """import json
from pathlib import Path


OUTPUT_PATH = Path("/workspace/experiment_plan.json")
ARTIFACT_PATH = Path("/logs/artifacts/final_plan.json")


def main() -> None:
    if not OUTPUT_PATH.exists():
        raise AssertionError(f"Missing output file: {OUTPUT_PATH}")

    raw = OUTPUT_PATH.read_text(encoding="utf-8").strip()
    if not raw:
        raise AssertionError("Output JSON file is empty")

    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise AssertionError(f"Output is not valid JSON: {exc}") from exc

    if not isinstance(payload, dict):
        raise AssertionError("Top-level JSON must be an object")

    status = str(payload.get("status") or "").strip().lower()
    if status in {"draft", "placeholder", "todo", "incomplete", "partial"}:
        raise AssertionError("Output JSON still looks like a draft/placeholder plan")

    unknown_steps = payload.get("unknown_steps")
    if unknown_steps not in (None, [], {}, ""):
        raise AssertionError("Output JSON still contains unresolved unknown_steps")

    steps = payload.get("steps")
    if not isinstance(steps, list) or not steps:
        raise AssertionError("JSON must contain a non-empty 'steps' list")

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
    for index, step in enumerate(steps, start=1):
        if not isinstance(step, dict):
            raise AssertionError(f"Step {index} is not an object")
        for required_key in ("step_number", "id", "workstation", "operation"):
            if required_key not in step:
                raise AssertionError(f"Step {index} missing key: {required_key}")
            if required_key == "id":
                try:
                    int(step.get(required_key))
                except Exception as exc:
                    raise AssertionError(f"Step {index} has invalid workstation id") from exc
            if required_key in ("workstation", "operation"):
                text = str(step.get(required_key) or "").strip()
                if not text:
                    raise AssertionError(f"Step {index} has empty {required_key}")
                lower = text.lower()
                if any(term in lower for term in placeholder_terms):
                    raise AssertionError(f"Step {index} still contains placeholder {required_key}: {text}")

    if not ARTIFACT_PATH.exists():
        raise AssertionError("Artifact copy was not exported to /logs/artifacts/final_plan.json")


if __name__ == "__main__":
    main()
"""


def artifacts_yaml(output_contract_mode: str = "plan") -> str:
    return "\n".join(
        [
            "artifacts:",
            f"- /workspace/{OUTPUT_JSON_NAME}",
            "- /logs/artifacts/final_plan.json",
        ]
    )


def render_config(
    *,
    job_name: str,
    jobs_dir: Path,
    n_attempts: int,
    n_concurrent_trials: int,
    dataset_path: Path,
    harness: str,
    model_key: str,
    agent_timeout_sec: int,
    instruction_style: str,
    output_contract_mode: str,
) -> str:
    harness_specs: dict[str, dict[str, object]] = {
        "claude-code": {
            "import_path": "agents.aiready_claude_code:AireadyClaudeCode",
            "name": "claude-code-runtime",
            "kwargs": {},
            "runtime_config": "claude-code",
        },
        "codex": {
            "import_path": "agents.aiready_codex:AireadyCodex",
            "name": "codex-runtime",
            "kwargs": {"reasoning_effort": "high", "reasoning_summary": "none"},
            "runtime_config": "codex",
        },
        "gemini-cli": {
            "import_path": "agents.aiready_gemini_cli:AireadyGeminiCli",
            "name": "gemini-cli-runtime",
            "kwargs": {},
        },
        "hermes": {
            "import_path": "agents.aiready_hermes:AireadyHermes",
            "name": "hermes-runtime",
            "kwargs": {},
        },
        "kilo-code": {
            "import_path": "agents.aiready_kilo_code:AireadyKiloCode",
            "name": "kilo-code-runtime",
            "kwargs": {"thinking": "high"},
        },
        "openclaw": {
            "import_path": "agents.aiready_openclaw:AireadyOpenClaw",
            "name": "openclaw-runtime",
            "kwargs": {"thinking": "high"},
        },
    }
    if harness not in harness_specs:
        raise ValueError(f"Unsupported harness: {harness}")

    spec = harness_specs[harness]
    agent_import_path = str(spec["import_path"])
    agent_name = str(spec["name"])
    agent_kwargs = dict(spec.get("kwargs") or {})
    runtime_config = spec.get("runtime_config")
    mounts_json: list[dict[str, object]] | None = None
    if runtime_config:
        mounts_json = [
            {
                "type": "bind",
                "source": str((Path("runtime-configs") / str(runtime_config)).resolve()),
                "target": f"/runtime-configs/{runtime_config}",
                "read_only": True,
                "bind": {"create_host_path": False},
            }
        ]

    model_entry = {**MODELS[model_key], "_model_key": model_key}
    model_name = model_name_for_harness(harness, model_entry)
    agent_env = agent_env_for(harness, model_key, output_contract_mode=output_contract_mode)
    if harness == "openclaw":
        agent_env["AIREADY_REQUESTED_REASONING_INTENSITY"] = MODEL_INTENSITY
        agent_env["AIREADY_REASONING_INTENSITY"] = "high"
        agent_env["AIREADY_OPENCLAW_PRIMARY_SOFT_TIMEOUT_SEC"] = "${AIREADY_OPENCLAW_PRIMARY_SOFT_TIMEOUT_SEC:-1800}"
    elif harness == "codex":
        agent_env["AIREADY_CODEX_PRIMARY_SOFT_TIMEOUT_SEC"] = "${AIREADY_CODEX_PRIMARY_SOFT_TIMEOUT_SEC:-1800}"
    elif harness == "claude-code":
        agent_env["AIREADY_CLAUDE_CODE_PRIMARY_SOFT_TIMEOUT_SEC"] = "${AIREADY_CLAUDE_CODE_PRIMARY_SOFT_TIMEOUT_SEC:-1800}"
    elif harness == "gemini-cli":
        agent_env["AIREADY_GEMINI_CLI_PRIMARY_SOFT_TIMEOUT_SEC"] = "${AIREADY_GEMINI_CLI_PRIMARY_SOFT_TIMEOUT_SEC:-1800}"
    elif harness == "hermes":
        agent_env["AIREADY_HERMES_PRIMARY_SOFT_TIMEOUT_SEC"] = "${AIREADY_HERMES_PRIMARY_SOFT_TIMEOUT_SEC:-1800}"
    elif harness == "kilo-code":
        agent_env["AIREADY_KILO_PRIMARY_SOFT_TIMEOUT_SEC"] = "${AIREADY_KILO_PRIMARY_SOFT_TIMEOUT_SEC:-1800}"
    mounts_text = "null" if not mounts_json else json.dumps(mounts_json, ensure_ascii=False)

    return f"""job_name: {job_name}
jobs_dir: {jobs_dir.resolve()}
n_attempts: {n_attempts}
timeout_multiplier: 1.0
debug: false
orchestrator:
  type: local
  n_concurrent_trials: {n_concurrent_trials}
  quiet: false
  retry:
    max_retries: 1
    include_exceptions: null
    exclude_exceptions:
    - VerifierTimeoutError
    - BadRequestError
    - RateLimitError
    - AgentTimeoutError
    wait_multiplier: 1.0
    min_wait_sec: 1.0
    max_wait_sec: 60.0
  kwargs: {{}}
environment:
  type: null
  import_path: environments.prebuilt_local_docker:PrebuiltLocalDockerEnvironment
  force_build: false
  delete: true
  override_cpus: null
  override_memory_mb: null
  override_storage_mb: null
  override_gpus: null
  mounts_json: {mounts_text}
  kwargs: {{}}
verifier:
  override_timeout_sec: null
  max_timeout_sec: null
  disable: false
metrics: []
{artifacts_yaml(output_contract_mode)}
agents:
- name: {agent_name}
  import_path: {agent_import_path}
  model_name: {model_name}
  override_timeout_sec: {agent_timeout_sec}
  override_setup_timeout_sec: null
  max_timeout_sec: {agent_timeout_sec}
  kwargs: {json.dumps(agent_kwargs, ensure_ascii=False)}
  env: {json.dumps(agent_env, ensure_ascii=False)}
datasets:
- task_names: null
  exclude_task_names: null
  path: {dataset_path.resolve()}
"""


def build_task_tree(
    *,
    out_root: Path,
    task_id: str,
    task: dict[str, str],
    skill_variant: str,
    skills_dir: Path,
    timeout_sec: int,
    environment_cpus: int,
    environment_memory_mb: int,
    environment_storage_mb: int,
    instruction_style: str,
    output_contract_mode: str,
) -> Path:
    task_dir = out_root / task_id
    env_dir = task_dir / "environment"
    tests_dir = task_dir / "tests"
    solution_dir = task_dir / "solution"
    env_dir.mkdir(parents=True, exist_ok=True)
    tests_dir.mkdir(parents=True, exist_ok=True)
    solution_dir.mkdir(parents=True, exist_ok=True)

    write_text(
        task_dir / "instruction.md",
        instruction_for(task_id, task, instruction_style=instruction_style),
    )
    write_text(
        task_dir / "task.toml",
        task_toml(
            timeout_sec=timeout_sec,
            difficulty="medium",
            environment_cpus=environment_cpus,
            environment_memory_mb=environment_memory_mb,
            environment_storage_mb=environment_storage_mb,
        ),
    )
    write_text(env_dir / "Dockerfile", environment_dockerfile())
    copy_skills(skills_dir, env_dir / "skills")
    write_text(
        solution_dir / "solve.sh",
        solution_script(
            task_id,
            task,
            skill_variant,
            output_contract_mode=output_contract_mode,
        ),
    )
    write_text(tests_dir / "test.sh", test_sh(output_contract_mode))
    write_text(tests_dir / "test_outputs.py", test_outputs_py(output_contract_mode))
    write_json(
        task_dir / "metadata.json",
        {
            "task_id": task_id,
            "module": task["module"],
            "title": task["title"],
            "description": task["description"],
            "direction": task.get("direction"),
            "skill_variant": skill_variant,
            "source": BENCHMARK_SOURCE_LABEL,
            "language": "zh" if re.search(r"[\u4e00-\u9fff]", task["description"]) else "en",
        },
    )
    return task_dir


def copy_prebuilt_task(
    *,
    src_task_dir: Path,
    dst_task_dir: Path,
    registry_prefix: str,
    harness: str,
    skill_variant: str,
    image_tag: str,
    timeout_sec: int,
    environment_cpus: int,
    environment_memory_mb: int,
    environment_storage_mb: int,
) -> None:
    shutil.copytree(src_task_dir, dst_task_dir)
    image = f"{registry_prefix}/final-{src_task_dir.name.lower()}-{harness}-{skill_variant}:{image_tag}"
    write_text(
        dst_task_dir / "task.toml",
        task_toml(
            timeout_sec=timeout_sec,
            difficulty="medium",
            docker_image=image,
            environment_cpus=environment_cpus,
            environment_memory_mb=environment_memory_mb,
            environment_storage_mb=environment_storage_mb,
        ),
    )
    write_text(
        dst_task_dir / "environment" / "Dockerfile",
        "# Prebuilt-image task tree. Harbor should use [environment].docker_image from task.toml.\n",
    )


def main() -> int:
    args = parse_args()
    global BENCHMARK_VERSION, BENCHMARK_SOURCE_DOCX, BENCHMARK_SOURCE_LABEL, TASKS
    skill_variants_by_name = {**SKILL_VARIANTS, **parse_extra_skill_variants(args.extra_skill_variant)}
    BENCHMARK_VERSION = args.benchmark_version
    BENCHMARK_SOURCE_DOCX = args.source_docx
    BENCHMARK_SOURCE_LABEL = str(args.source_docx)
    TASKS = load_tasks_from_docx(args.source_docx)
    selected_task_ids = list(args.task_ids)
    selected_harnesses = list(args.harnesses)
    selected_models = list(args.models)
    selected_skill_variants = list(args.skill_variants)
    unknown = [task_id for task_id in selected_task_ids if task_id not in TASKS]
    if unknown:
        raise KeyError(f"Unknown aiready task id(s): {unknown}")
    unknown_skill_variants = [
        skill_variant
        for skill_variant in selected_skill_variants
        if skill_variant not in skill_variants_by_name
    ]
    if unknown_skill_variants:
        known = ", ".join(sorted(skill_variants_by_name))
        raise KeyError(
            f"Unknown skill variant(s): {unknown_skill_variants}. "
            f"Known variants: {known}"
        )

    reset_dir(args.out_root)
    tasks_root = args.out_root / "tasks"
    prebuilt_root = args.out_root / "prebuilt-tasks"
    configs_root = args.out_root / "configs"
    images_root = args.out_root / "images"

    generated_tasks: list[dict[str, str]] = []
    for skill_variant in selected_skill_variants:
        skills_dir = skill_variants_by_name[skill_variant]
        variant_root = tasks_root / skill_variant
        for task_id in selected_task_ids:
            task_dir = build_task_tree(
                out_root=variant_root,
                task_id=task_id,
                task=TASKS[task_id],
                skill_variant=skill_variant,
                skills_dir=skills_dir,
                timeout_sec=args.agent_timeout_sec,
                environment_cpus=args.environment_cpus,
                environment_memory_mb=args.environment_memory_mb,
                environment_storage_mb=args.environment_storage_mb,
                instruction_style=args.instruction_style,
                output_contract_mode=args.output_contract_mode,
            )
            generated_tasks.append(
                {
                    "task_id": task_id,
                    "skill_variant": skill_variant,
                    "task_dir": str(task_dir),
                    "skills_dir": str(skills_dir),
                }
            )

    for harness in selected_harnesses:
        for skill_variant in selected_skill_variants:
            dataset_root = prebuilt_root / harness / skill_variant
            dataset_root.mkdir(parents=True, exist_ok=True)
            for task_id in selected_task_ids:
                copy_prebuilt_task(
                    src_task_dir=tasks_root / skill_variant / task_id,
                    dst_task_dir=dataset_root / task_id,
                    registry_prefix=args.registry_prefix,
                    harness=harness,
                    skill_variant=skill_variant,
                    image_tag=args.image_tag,
                    timeout_sec=args.agent_timeout_sec,
                    environment_cpus=args.environment_cpus,
                    environment_memory_mb=args.environment_memory_mb,
                    environment_storage_mb=args.environment_storage_mb,
                )

    config_paths: list[str] = []
    skipped_configs: list[dict[str, str]] = []
    for harness in selected_harnesses:
        for model_key in selected_models:
            if reason := unsupported_config_reason(harness, model_key):
                for skill_variant in selected_skill_variants:
                    skipped_configs.append(
                        {
                            "harness": harness,
                            "model_key": model_key,
                            "skill_variant": skill_variant,
                            "reason": reason,
                        }
                    )
                continue
            for skill_variant in selected_skill_variants:
                dataset_path = prebuilt_root / harness / skill_variant
                config_dir = configs_root / harness / model_key
                config_dir.mkdir(parents=True, exist_ok=True)
                job_name = f"{args.job_name_prefix}-{harness}-{model_key}-{skill_variant}"
                config_path = config_dir / f"{skill_variant}.yaml"
                write_text(
                    config_path,
                    render_config(
                        job_name=job_name,
                        jobs_dir=args.jobs_dir,
                        n_attempts=args.n_attempts,
                        n_concurrent_trials=args.n_concurrent_trials,
                        dataset_path=dataset_path,
                        harness=harness,
                        model_key=model_key,
                        agent_timeout_sec=args.agent_timeout_sec,
                        instruction_style=args.instruction_style,
                        output_contract_mode=args.output_contract_mode,
                    ),
                )
                config_paths.append(str(config_path))

    write_json(
        args.out_root / "manifest.json",
        {
            "schema_version": "1.0",
            "benchmark": f"aiready-{BENCHMARK_VERSION}",
            "benchmark_version": BENCHMARK_VERSION,
            "source_docx": BENCHMARK_SOURCE_LABEL,
            "reasoning_intensity": MODEL_INTENSITY,
            "instruction_style": args.instruction_style,
            "output_contract_mode": args.output_contract_mode,
            "selected_task_ids": selected_task_ids,
            "skill_variants": selected_skill_variants,
            "harnesses": selected_harnesses,
            "models": {model_key: MODELS[model_key] for model_key in selected_models},
            "registry_prefix": args.registry_prefix,
            "image_tag": args.image_tag,
            "jobs_dir": str(args.jobs_dir.resolve()),
            "tasks_root": str(tasks_root),
            "prebuilt_root": str(prebuilt_root),
            "configs_root": str(configs_root),
            "images_root": str(images_root),
            "generated_tasks": generated_tasks,
            "config_paths": config_paths,
            "skipped_configs": skipped_configs,
            "expected_trials": len(selected_task_ids) * len(config_paths) * args.n_attempts,
        },
    )
    print(args.out_root.resolve())
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
