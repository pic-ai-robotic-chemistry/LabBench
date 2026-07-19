#!/usr/bin/env python3

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import re
import shutil
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from xml.etree import ElementTree as ET
from zipfile import ZipFile


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_RUBRIC_PATH = ROOT / "scoring" / "aiready_scoring_rubric_en.md"
SCORE_OUTPUT_PATH = "/workspace/score.json"
SCORE_ARTIFACT_PATH = "/logs/artifacts/score.json"

DIMENSIONS = {
    "physical_implementability": {
        "title": "Physical Implementability",
        "heading": "## Physical Implementability",
    },
    "workflow_completeness": {
        "title": "Experimental Workflow Completeness",
        "heading": "## Experimental Workflow Completeness",
    },
    "design_rationality": {
        "title": "Experimental Design Rationality",
        "heading": "## Experimental Design Rationality",
    },
}

JUDGES = {
    "judge_a": {
        "harness": "codex",
        "model_key": "judge_a",
        "model_name": "${AIREADY_SCORING_JUDGE_A_MODEL_NAME}",
        "agent_import_path": "agents.aiready_codex:AireadyCodex",
        "agent_name": "codex-scoring-runtime",
        "agent_kwargs": {"reasoning_effort": "high", "reasoning_summary": "none"},
        "timeout_sec": 900,
        "env": {
            "FORMAL_KEY_LABEL": "aiready-scoring-judge-a",
            "FORMAL_KEY_PROVIDER": "openai-compatible",
            "FORMAL_MODEL_LABEL": "judge-a",
            "AIREADY_BENCHMARK": "v15-scoring",
            "AIREADY_REASONING_INTENSITY": "high",
            "OUTPUT_CONTRACT_MODE": "off",
            "AIREADY_DISABLE_AGENT_PROMPT_AUGMENTATION": "1",
            "OPENAI_API_KEY": "${AIREADY_SCORING_JUDGE_A_API_KEY}",
            "OPENAI_BASE_URL": "${AIREADY_SCORING_JUDGE_A_BASE_URL}",
        },
        "mounts": [
            {
                "type": "bind",
                "source": str((ROOT / "runtime-configs" / "codex").resolve()),
                "target": "/runtime-configs/codex",
                "read_only": True,
                "bind": {"create_host_path": False},
            }
        ],
    },
}


@dataclass(frozen=True)
class TrialRecord:
    row_index: int
    config_key: str
    harness: str
    model_key: str
    benchmark_task: str
    latest_selection_rank: str
    trial_name: str
    source_label: str
    trial_dir: Path
    result_path: str

    @property
    def scoring_trial_id(self) -> str:
        digest = hashlib.sha1(str(self.trial_dir).encode("utf-8")).hexdigest()[:10]
        safe = re.sub(r"[^A-Za-z0-9_.-]+", "_", f"{self.benchmark_task}__{self.config_key}__r{self.latest_selection_rank}__{self.trial_name}")
        return f"{safe}__{digest}"


def read_csv_rows(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8-sig") as handle:
        return list(csv.DictReader(handle))


def load_selected_trials(path: Path, *, limit: int | None = None) -> list[TrialRecord]:
    records: list[TrialRecord] = []
    for index, row in enumerate(read_csv_rows(path), start=1):
        trial_dir = Path(row.get("trial_dir") or "")
        records.append(
            TrialRecord(
                row_index=index,
                config_key=row.get("config_key") or row.get("\ufeffconfig_key") or "",
                harness=row.get("harness") or "",
                model_key=row.get("model_key") or "",
                benchmark_task=row.get("benchmark_task") or "",
                latest_selection_rank=row.get("latest_selection_rank") or "",
                trial_name=row.get("trial_name") or "",
                source_label=row.get("source_label") or "",
                trial_dir=trial_dir,
                result_path=row.get("result_path") or "",
            )
        )
        if limit is not None and len(records) >= limit:
            break
    return records


def load_tasks_from_docx(path: Path) -> dict[str, dict[str, str]]:
    source_path = path if path.is_absolute() else ROOT / path
    if not source_path.exists():
        raise FileNotFoundError(f"Benchmark docx not found: {path}")

    namespace = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
    with ZipFile(source_path) as docx:
        root = ET.fromstring(docx.read("word/document.xml"))

    paragraphs: list[str] = []
    for paragraph in root.findall(".//w:p", namespace):
        text = "".join(node.text or "" for node in paragraph.findall(".//w:t", namespace)).strip()
        if text:
            paragraphs.append(text)

    task_title_pattern = re.compile(r"^([A-G]\d{2})(?:\s*[:：]\s*|\s+|(?=[^\s:：\\-–—]))(.+)$")
    tasks: dict[str, dict[str, str]] = {}
    for index, paragraph in enumerate(paragraphs[:-1]):
        match = task_title_pattern.match(paragraph)
        if not match:
            continue
        task_id, title = match.groups()
        description = paragraphs[index + 1].strip()
        if len(description) < 80:
            continue
        if not re.match(r"^(To|After)\b", description):
            continue
        tasks[task_id] = {
            "task_id": task_id,
            "title": title.rstrip(":：").strip(),
            "description": description,
        }
    if not tasks:
        raise ValueError(f"No benchmark task descriptions found in {source_path}")
    return tasks


def extract_section(markdown: str, heading: str) -> str:
    start = markdown.find(heading)
    if start < 0:
        raise ValueError(f"Missing rubric heading: {heading}")
    next_start = markdown.find("\n## ", start + len(heading))
    if next_start < 0:
        return markdown[start:].strip()
    return markdown[start:next_start].strip()


def rubric_for_dimension(rubric_text: str, dimension: str) -> str:
    dimension_text = extract_section(rubric_text, DIMENSIONS[dimension]["heading"])
    scale_text = extract_section(rubric_text, "## 0-100 Scoring Scale")
    return dimension_text + "\n\n" + scale_text


def resolve_final_plan(trial_dir: Path) -> Path | None:
    candidates = [
        trial_dir / "artifacts" / "final_plan.json",
        trial_dir / "logs" / "artifacts" / "final_plan.json",
        trial_dir / "final_plan.json",
    ]
    return next((candidate for candidate in candidates if candidate.exists()), None)


def compact_json_text(path: Path, *, max_chars: int = 120_000) -> tuple[str, bool]:
    raw = path.read_text(encoding="utf-8", errors="replace")
    truncated = len(raw) > max_chars
    if truncated:
        raw = raw[:max_chars] + "\n/* TRUNCATED_BY_SCORING_PREP */\n"
    try:
        payload = json.loads(raw) if not truncated else None
    except json.JSONDecodeError:
        return raw, truncated
    return json.dumps(payload, ensure_ascii=False, indent=2), truncated


def build_prompt(
    *,
    task: dict[str, str],
    dimension: str,
    dimension_rubric: str,
    final_plan_text: str,
) -> str:
    return f"""You are an expert evaluator of automated laboratory experimental plans.

Your task is not to design, execute, submit, or modify an experiment.
Your only task is to score the provided experimental plan for one specified evaluation dimension.

Score only the specified dimension. Do not score other dimensions.

Purpose:
Evaluate how well final_plan.json satisfies the benchmark task under the specified evaluation dimension.

Benchmark task:
Task ID: {task["task_id"]}
Title: {task["title"]}
Description: {task["description"]}

Evaluation dimension:
{dimension_rubric}

Skill reference:
The mounted skill files are read-only reference material. They may help you understand how a JSON experimental plan could be converted into an executable 303 laboratory workflow. Do not call tools, do not submit anything to the laboratory, do not modify the plan, and do not reward format compliance alone.

Final experimental plan, from final_plan.json:
```json
{final_plan_text}
```

Write the scoring result to {SCORE_OUTPUT_PATH}.
Also copy the same JSON to {SCORE_ARTIFACT_PATH}.

Return JSON only in the output file, exactly in this shape:
{{
  "score": <integer from 0 to 100>,
  "reason": "<concise reason for the score, focused only on this dimension>",
  "evidence": [
    "<specific evidence from the task text or final_plan.json>"
  ]
}}

Do not include markdown fences in the JSON file.
"""


def task_toml(*, timeout_sec: int, docker_image: str | None, cpus: int, memory_mb: int, storage_mb: int) -> str:
    docker_line = f'docker_image = "{docker_image}"\n' if docker_image else ""
    return f"""version = "1.0"

[metadata]
author_name = "Codex"
author_email = "codex@example.com"
difficulty = "medium"
category = "chemistry-scoring"
tags = ["chemistry", "aiready", "scoring", "json", "llm-judge"]

[verifier]
timeout_sec = 120.0

[agent]
timeout_sec = {float(timeout_sec)}

[environment]
build_timeout_sec = 300.0
cpus = {cpus}
memory_mb = {memory_mb}
storage_mb = {storage_mb}
env = {{}}
{docker_line}skills_dir = "/opt/skill-layer/skills"
"""


def environment_dockerfile() -> str:
    return """FROM ubuntu:24.04
ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y --no-install-recommends \\
    bash \\
    ca-certificates \\
    jq \\
    python3 \\
    ripgrep \\
    && rm -rf /var/lib/apt/lists/*

WORKDIR /root

COPY skills /opt/task-original-skills

RUN mkdir -p /workspace /logs/artifacts /logs/agent /logs/verifier \\
    && chmod -R 777 /workspace /logs
"""


def test_outputs_py() -> str:
    return f"""import json
from pathlib import Path

OUTPUT_PATH = Path({SCORE_OUTPUT_PATH!r})
ARTIFACT_PATH = Path({SCORE_ARTIFACT_PATH!r})


def load_score(path: Path) -> dict:
    if not path.exists():
        raise AssertionError(f"Missing score file: {{path}}")
    raw = path.read_text(encoding="utf-8").strip()
    if not raw:
        raise AssertionError(f"Score file is empty: {{path}}")
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise AssertionError(f"Score file is not valid JSON: {{exc}}") from exc
    if not isinstance(payload, dict):
        raise AssertionError("Score JSON top level must be an object")
    score = payload.get("score")
    if not isinstance(score, int) or isinstance(score, bool) or score < 0 or score > 100:
        raise AssertionError("score must be an integer from 0 to 100")
    reason = payload.get("reason")
    if not isinstance(reason, str) or not reason.strip():
        raise AssertionError("reason must be a non-empty string")
    evidence = payload.get("evidence")
    if not isinstance(evidence, list) or not evidence:
        raise AssertionError("evidence must be a non-empty list")
    if not all(isinstance(item, str) and item.strip() for item in evidence):
        raise AssertionError("each evidence item must be a non-empty string")
    allowed = {{"score", "reason", "evidence"}}
    extra = set(payload) - allowed
    if extra:
        raise AssertionError(f"Score JSON contains unsupported keys: {{sorted(extra)}}")
    return payload


def main() -> None:
    score = load_score(OUTPUT_PATH)
    ARTIFACT_PATH.parent.mkdir(parents=True, exist_ok=True)
    ARTIFACT_PATH.write_text(json.dumps(score, ensure_ascii=False, indent=2) + "\\n", encoding="utf-8")


if __name__ == "__main__":
    main()
"""


def test_sh() -> str:
    return """#!/bin/bash
set -euo pipefail

mkdir -p /logs/verifier /logs/artifacts

if [ -f /workspace/score.json ]; then
  cp /workspace/score.json /logs/artifacts/score.json 2>/dev/null || true
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


def solution_script() -> str:
    return f"""#!/bin/bash
set -euo pipefail

mkdir -p /workspace /logs/artifacts
cat <<'EOF' > {SCORE_OUTPUT_PATH}
{{
  "score": 0,
  "reason": "Reference solution only validates scoring task wiring.",
  "evidence": [
    "Reference solution placeholder."
  ]
}}
EOF
cp {SCORE_OUTPUT_PATH} {SCORE_ARTIFACT_PATH}
"""


def write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def write_json(path: Path, payload: Any) -> None:
    write_text(path, json.dumps(payload, ensure_ascii=False, indent=2) + "\n")


def reset_dir(path: Path) -> None:
    if path.exists():
        shutil.rmtree(path)
    path.mkdir(parents=True, exist_ok=True)


def build_task_tree(
    *,
    task_dir: Path,
    instruction: str,
    metadata: dict[str, Any],
    final_plan_path: Path,
    timeout_sec: int,
    cpus: int,
    memory_mb: int,
    storage_mb: int,
    docker_image: str | None = None,
) -> None:
    env_dir = task_dir / "environment"
    tests_dir = task_dir / "tests"
    solution_dir = task_dir / "solution"
    input_dir = task_dir / "input"
    env_dir.mkdir(parents=True, exist_ok=True)
    tests_dir.mkdir(parents=True, exist_ok=True)
    solution_dir.mkdir(parents=True, exist_ok=True)
    input_dir.mkdir(parents=True, exist_ok=True)

    write_text(task_dir / "instruction.md", instruction)
    write_text(task_dir / "task.toml", task_toml(timeout_sec=timeout_sec, docker_image=docker_image, cpus=cpus, memory_mb=memory_mb, storage_mb=storage_mb))
    write_text(env_dir / "Dockerfile", environment_dockerfile() if docker_image is None else "# Prebuilt-image task tree. Harbor should use [environment].docker_image from task.toml.\n")
    shutil.copy2(final_plan_path, input_dir / "final_plan.json")
    write_json(input_dir / "input_manifest.json", metadata)
    write_json(task_dir / "metadata.json", metadata)
    write_text(solution_dir / "solve.sh", solution_script())
    write_text(tests_dir / "test.sh", test_sh())
    write_text(tests_dir / "test_outputs.py", test_outputs_py())


def render_config(
    *,
    job_name: str,
    jobs_dir: Path,
    dataset_path: Path,
    judge_key: str,
    skills_dir: Path,
    n_concurrent_trials: int,
    timeout_sec: int,
) -> str:
    judge = JUDGES[judge_key]
    mounts = list(judge.get("mounts") or [])
    mounts.append(
        {
            "type": "bind",
            "source": str(skills_dir.resolve()),
            "target": "/opt/skill-layer/skills",
            "read_only": True,
            "bind": {"create_host_path": False},
        }
    )
    mounts_text = "null" if not mounts else json.dumps(mounts, ensure_ascii=False)
    return f"""job_name: {job_name}
jobs_dir: {jobs_dir.resolve()}
n_attempts: 1
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
artifacts:
- {SCORE_OUTPUT_PATH}
- {SCORE_ARTIFACT_PATH}
agents:
- name: {judge["agent_name"]}
  import_path: {judge["agent_import_path"]}
  model_name: {judge["model_name"]}
  override_timeout_sec: {timeout_sec}
  override_setup_timeout_sec: null
  max_timeout_sec: {timeout_sec}
  kwargs: {json.dumps(judge["agent_kwargs"], ensure_ascii=False)}
  env: {json.dumps(judge["env"], ensure_ascii=False)}
datasets:
- task_names: null
  exclude_task_names: null
  path: {dataset_path.resolve()}
"""


def sanitize_image_component(value: str) -> str:
    normalized = re.sub(r"[^a-zA-Z0-9_.-]+", "-", value.strip().lower())
    normalized = normalized.strip("-._")
    return normalized or "item"


def default_generic_image(registry_prefix: str, judge_key: str, image_tag: str) -> str:
    return f"{registry_prefix}/scoring-judge-{judge_key}:{image_tag}"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Prepare independent AIREADY LLM-judge scoring tasks.")
    parser.add_argument("--selected-trials", type=Path, required=True)
    parser.add_argument("--source-docx", type=Path, required=True)
    parser.add_argument("--skills-dir", type=Path, required=True)
    parser.add_argument("--rubric", type=Path, default=DEFAULT_RUBRIC_PATH)
    parser.add_argument("--out-root", type=Path, default=Path("scoring/generated-v15-judge"))
    parser.add_argument("--jobs-dir", type=Path, default=Path("jobs"))
    parser.add_argument("--job-name-prefix", default="aiready-v15-judge")
    parser.add_argument("--registry-prefix", default="aiready-local/aiready")
    parser.add_argument("--image-tag", default="judge")
    parser.add_argument(
        "--generic-image",
        default="",
        help=(
            "Optional shared scoring image to use for every prepared task and judge. "
            "Example: harbor.pic-aichem.online/aiready/scoring-judge:latest. "
            "When omitted, the script uses one generic image per judge: "
            "<registry-prefix>/scoring-judge-<judge-key>:<image-tag>."
        ),
    )
    parser.add_argument("--dimensions", nargs="+", choices=sorted(DIMENSIONS), default=list(DIMENSIONS))
    parser.add_argument("--judges", nargs="+", choices=sorted(JUDGES), default=list(JUDGES))
    parser.add_argument("--n-concurrent-trials", type=int, default=5)
    parser.add_argument("--agent-timeout-sec", type=int, default=900)
    parser.add_argument("--environment-cpus", type=int, default=2)
    parser.add_argument("--environment-memory-mb", type=int, default=8192)
    parser.add_argument("--environment-storage-mb", type=int, default=12288)
    parser.add_argument("--dry-run-limit", type=int, default=None, help="Only prepare the first N selected trials for prompt inspection.")
    parser.add_argument("--skip-missing-final-plan", action="store_true", help="Skip rows whose final_plan.json artifact is unavailable.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    selected_trials_path = args.selected_trials if args.selected_trials.is_absolute() else ROOT / args.selected_trials
    source_docx = args.source_docx if args.source_docx.is_absolute() else ROOT / args.source_docx
    skills_dir = args.skills_dir if args.skills_dir.is_absolute() else ROOT / args.skills_dir
    rubric_path = args.rubric if args.rubric.is_absolute() else ROOT / args.rubric
    out_root = args.out_root if args.out_root.is_absolute() else ROOT / args.out_root
    jobs_dir = args.jobs_dir if args.jobs_dir.is_absolute() else ROOT / args.jobs_dir

    if not skills_dir.exists():
        raise FileNotFoundError(f"Skill directory not found: {skills_dir}")

    tasks = load_tasks_from_docx(source_docx)
    rubric_text = rubric_path.read_text(encoding="utf-8")
    records = load_selected_trials(selected_trials_path, limit=args.dry_run_limit)

    reset_dir(out_root)
    tasks_root = out_root / "tasks"
    prebuilt_root = out_root / "prebuilt-tasks"
    configs_root = out_root / "configs"

    prepared_items: list[dict[str, Any]] = []
    skipped_items: list[dict[str, Any]] = []

    for record in records:
        final_plan = resolve_final_plan(record.trial_dir)
        if final_plan is None:
            item = {
                "trial_row_index": record.row_index,
                "trial_dir": str(record.trial_dir),
                "benchmark_task": record.benchmark_task,
                "trial_name": record.trial_name,
                "reason": "missing_final_plan_json",
            }
            skipped_items.append(item)
            if args.skip_missing_final_plan:
                continue
            final_plan_text = "{}"
            final_plan_for_copy = None
        else:
            final_plan_text, truncated = compact_json_text(final_plan)
            final_plan_for_copy = final_plan

        task = tasks.get(record.benchmark_task)
        if not task:
            skipped_items.append(
                {
                    "trial_row_index": record.row_index,
                    "trial_dir": str(record.trial_dir),
                    "benchmark_task": record.benchmark_task,
                    "trial_name": record.trial_name,
                    "reason": "task_text_not_found",
                }
            )
            continue

        for dimension in args.dimensions:
            dimension_rubric = rubric_for_dimension(rubric_text, dimension)
            instruction = build_prompt(
                task=task,
                dimension=dimension,
                dimension_rubric=dimension_rubric,
                final_plan_text=final_plan_text,
            )
            for judge_key in args.judges:
                scoring_task_id = f"{record.scoring_trial_id}__{dimension}__{judge_key}"
                task_dir = tasks_root / judge_key / scoring_task_id
                metadata = {
                    "schema_version": "aiready_scoring_input_v1",
                    "scoring_task_id": scoring_task_id,
                    "judge_key": judge_key,
                    "judge": JUDGES[judge_key],
                    "dimension": dimension,
                    "dimension_title": DIMENSIONS[dimension]["title"],
                    "source_trial": {
                        "row_index": record.row_index,
                        "config_key": record.config_key,
                        "harness": record.harness,
                        "model_key": record.model_key,
                        "benchmark_task": record.benchmark_task,
                        "latest_selection_rank": record.latest_selection_rank,
                        "trial_name": record.trial_name,
                        "source_label": record.source_label,
                        "trial_dir": str(record.trial_dir),
                        "result_path": record.result_path,
                        "final_plan_path": str(final_plan) if final_plan else "",
                    },
                    "benchmark_task": task,
                    "score_output_path": SCORE_OUTPUT_PATH,
                    "score_artifact_path": SCORE_ARTIFACT_PATH,
                    "rubric_path": str(rubric_path),
                    "skills_dir": str(skills_dir),
                }
                if final_plan is not None:
                    metadata["final_plan_truncated_in_prompt"] = truncated
                build_task_tree(
                    task_dir=task_dir,
                    instruction=instruction,
                    metadata=metadata,
                    final_plan_path=final_plan_for_copy or rubric_path,
                    timeout_sec=args.agent_timeout_sec,
                    cpus=args.environment_cpus,
                    memory_mb=args.environment_memory_mb,
                    storage_mb=args.environment_storage_mb,
                )
                prepared_items.append(
                    {
                        "scoring_task_id": scoring_task_id,
                        "judge_key": judge_key,
                        "dimension": dimension,
                        "task_dir": str(task_dir),
                        "source_trial_dir": str(record.trial_dir),
                        "source_final_plan_path": str(final_plan) if final_plan else "",
                    }
                )

    config_paths: list[str] = []
    for judge_key in args.judges:
        source_dataset = tasks_root / judge_key
        dataset_path = prebuilt_root / judge_key
        dataset_path.mkdir(parents=True, exist_ok=True)
        if source_dataset.exists():
            for task_dir in sorted(source_dataset.iterdir()):
                if not task_dir.is_dir():
                    continue
                dst = dataset_path / task_dir.name
                shutil.copytree(task_dir, dst)
                docker_image = args.generic_image.strip() or default_generic_image(
                    args.registry_prefix,
                    judge_key,
                    args.image_tag,
                )
                write_text(
                    dst / "task.toml",
                    task_toml(
                        timeout_sec=args.agent_timeout_sec,
                        docker_image=docker_image,
                        cpus=args.environment_cpus,
                        memory_mb=args.environment_memory_mb,
                        storage_mb=args.environment_storage_mb,
                    ),
                )
                write_text(dst / "environment" / "Dockerfile", "# Prebuilt-image task tree. Harbor should use [environment].docker_image from task.toml.\n")

        config_dir = configs_root / judge_key
        config_dir.mkdir(parents=True, exist_ok=True)
        config_path = config_dir / "scoring.yaml"
        write_text(
            config_path,
            render_config(
                job_name=f"{args.job_name_prefix}-{judge_key}",
                jobs_dir=jobs_dir,
                dataset_path=dataset_path,
                judge_key=judge_key,
                skills_dir=skills_dir,
                n_concurrent_trials=args.n_concurrent_trials,
                timeout_sec=args.agent_timeout_sec,
            ),
        )
        config_paths.append(str(config_path))

    manifest = {
        "schema_version": "aiready_scoring_manifest_v1",
        "selected_trials": str(selected_trials_path),
        "source_docx": str(source_docx),
        "rubric": str(rubric_path),
        "skills_dir": str(skills_dir),
        "out_root": str(out_root),
        "jobs_dir": str(jobs_dir.resolve()),
        "dimensions": args.dimensions,
        "judges": {key: JUDGES[key] for key in args.judges},
        "tasks_root": str(tasks_root),
        "prebuilt_root": str(prebuilt_root),
        "configs_root": str(configs_root),
        "config_paths": config_paths,
        "generic_image": args.generic_image.strip(),
        "default_generic_images": {
            judge_key: default_generic_image(args.registry_prefix, judge_key, args.image_tag)
            for judge_key in args.judges
        },
        "prepared_items": prepared_items,
        "skipped_items": skipped_items,
        "expected_scoring_trials": len(prepared_items),
        "dry_run_limit": args.dry_run_limit,
        "score_output_path": SCORE_OUTPUT_PATH,
        "score_artifact_path": SCORE_ARTIFACT_PATH,
    }
    write_json(out_root / "manifest.json", manifest)
    write_text(out_root / "prepared_items.jsonl", "\n".join(json.dumps(item, ensure_ascii=False) for item in prepared_items) + ("\n" if prepared_items else ""))
    write_text(out_root / "skipped_items.jsonl", "\n".join(json.dumps(item, ensure_ascii=False) for item in skipped_items) + ("\n" if skipped_items else ""))
    print(json.dumps({"out_root": str(out_root), "manifest": str(out_root / "manifest.json"), "prepared": len(prepared_items), "skipped": len(skipped_items)}, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
