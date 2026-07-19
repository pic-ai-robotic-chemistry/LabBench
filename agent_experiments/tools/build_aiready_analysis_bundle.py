#!/usr/bin/env python3

from __future__ import annotations

import argparse
import csv
import json
import shutil
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any


JOB_LEVEL_FILES = ("config.json", "job.log", "result.json")
TRIAL_FILE_GLOBS = (
    "config.json",
    "docker-compose-mounts.json",
    "docker-compose-prebuilt-local.json",
    "result.json",
    "trial.log",
    "exception.txt",
    "agent/claude-code.txt",
    "agent/codex.txt",
    "agent/gemini-cli.txt",
    "agent/gemini-cli.trajectory.json",
    "agent/gemini-cli.trajectory.jsonl",
    "agent/hermes.txt",
    "agent/hermes-session.jsonl",
    "agent/kilo-code.txt",
    "agent/openclaw.txt",
    "agent/plan-export.json",
    "agent/trajectory.json",
    "agent/exec-result.json",
    "agent/aichem-submission.log",
    "agent/config.toml",
    "agent/setup/auth-mode.txt",
    "agent/setup/cli-version.txt",
    "agent/setup/runtime-config.log",
    "agent/setup/runtime-provider.json",
    "agent/sessions/**/*.jsonl",
    "agent/setup/skills.json",
    "agent/setup/kilo-runtime/**/*.json",
    "agent/setup/kilo-runtime/**/*.txt",
    "agent/native/openclaw/**/*.json",
    "agent/native/openclaw/**/*.jsonl",
    "agent/native/openclaw/**/*.txt",
    "artifacts/experiment_plan.json",
    "artifacts/final_plan.json",
    "artifacts/aichem_submission.json",
    "artifacts/reference_prompt.json",
    "debug/harness/openclaw/runtime.json",
    "debug/harness/openclaw/session_index.json",
    "debug/harness/openclaw/cli-version.txt",
    "debug/harness/openclaw/model-selection.txt",
    "verifier/reward.txt",
    "verifier/test_output.log",
    "verifier/test-stdout.txt",
)


@dataclass
class TrialRow:
    job_name: str
    trial_name: str
    task_name: str | None
    task_id: str | None
    harness: str | None
    model_name: str | None
    skill_variant: str | None
    reward: float | None
    has_exception: bool
    exception_type: str | None
    final_plan_exists: bool
    experiment_plan_exists: bool
    aichem_submission_exists: bool
    aichem_status: str | None
    aichem_e2e_pass: bool | None
    aichem_template_id: str | None
    aichem_task_id: str | None
    aichem_task_name: str | None
    aichem_direct_task_detected: bool | None
    aichem_start_mode: str | None
    aichem_failure_stage: str | None
    plan_export_status: str | None
    session_count: int
    source_trial_dir: str
    bundled_trial_dir: str


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Collect aiready experiment results.")
    parser.add_argument("--manifest", type=Path, default=Path("aiready/generated-v6/manifest.json"))
    parser.add_argument(
        "--out-dir",
        type=Path,
        default=Path("analysis/aiready_results_latest"),
    )
    parser.add_argument("job_dirs", nargs="*")
    return parser.parse_args()


def reset_dir(path: Path) -> None:
    if path.exists():
        shutil.rmtree(path)
    path.mkdir(parents=True, exist_ok=True)


def load_json(path: Path) -> Any | None:
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return None


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def copy_file(src: Path, src_root: Path, dest_root: Path) -> str:
    rel = src.relative_to(src_root)
    dest = dest_root / rel
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dest)
    return rel.as_posix()


def collect_trial_files(trial_dir: Path, dest_root: Path) -> list[str]:
    copied: list[str] = []
    seen: set[Path] = set()
    for pattern in TRIAL_FILE_GLOBS:
        for path in sorted(trial_dir.glob(pattern)):
            if not path.is_file() or path in seen:
                continue
            copied.append(copy_file(path, trial_dir, dest_root))
            seen.add(path)
    return copied


def exception_type(path: Path) -> str | None:
    if not path.exists():
        return None
    text = path.read_text(encoding="utf-8", errors="replace")
    for line in text.splitlines():
        stripped = line.strip()
        if stripped:
            return stripped.split(":", 1)[0]
    return "exception"


def infer_skill_variant(job_name: str) -> str | None:
    for variant in (
        "aiready-skill-7.6",
        "aiready_skill_7.6",
        "aiready-skills-2026-05-23",
        "aiready-skills-5-15",
        "lab-design-main-5-13-skills",
        "lab-design-main-skills",
    ):
        if job_name.endswith(variant) or variant in job_name:
            return variant
    return None


def summarize_trial(job_name: str, trial_dir: Path, bundle_trial_dir: Path) -> TrialRow:
    collect_trial_files(trial_dir, bundle_trial_dir)
    config = load_json(trial_dir / "config.json") or {}
    result = load_json(trial_dir / "result.json") or {}
    plan_export = load_json(trial_dir / "agent" / "plan-export.json") or {}
    aichem_submission = load_json(trial_dir / "artifacts" / "aichem_submission.json") or {}
    task_config = config.get("task") if isinstance(config, dict) else {}
    agent_config = config.get("agent") if isinstance(config, dict) else {}
    metadata = load_json(trial_dir / "artifacts" / "reference_prompt.json") or {}
    reward = None
    if isinstance(result, dict):
        reward = (((result.get("verifier_result") or {}).get("rewards") or {}).get("reward"))
    sessions_dir = trial_dir / "agent" / "sessions"
    openclaw_native = trial_dir / "agent" / "native" / "openclaw"
    session_count = 0
    if sessions_dir.exists():
        session_count += len(list(sessions_dir.rglob("*.jsonl")))
    if openclaw_native.exists():
        session_count += len(list(openclaw_native.rglob("*.jsonl")))
    for file_name in ("gemini-cli.trajectory.jsonl", "gemini-cli.trajectory.json", "hermes-session.jsonl"):
        if (trial_dir / "agent" / file_name).exists():
            session_count += 1

    task_name = result.get("task_name") if isinstance(result, dict) else None
    task_id = metadata.get("task_id") if isinstance(metadata, dict) else None
    if not task_id and isinstance(task_name, str):
        task_id = task_name.split("__", 1)[0]

    return TrialRow(
        job_name=job_name,
        trial_name=trial_dir.name,
        task_name=task_name,
        task_id=task_id,
        harness=agent_config.get("name") if isinstance(agent_config, dict) else None,
        model_name=agent_config.get("model_name") if isinstance(agent_config, dict) else None,
        skill_variant=infer_skill_variant(job_name),
        reward=reward,
        has_exception=(trial_dir / "exception.txt").exists(),
        exception_type=exception_type(trial_dir / "exception.txt"),
        final_plan_exists=(trial_dir / "artifacts" / "final_plan.json").exists(),
        experiment_plan_exists=(trial_dir / "artifacts" / "experiment_plan.json").exists(),
        aichem_submission_exists=(trial_dir / "artifacts" / "aichem_submission.json").exists(),
        aichem_status=aichem_submission.get("status") if isinstance(aichem_submission, dict) else None,
        aichem_e2e_pass=aichem_submission.get("e2e_pass") if isinstance(aichem_submission, dict) else None,
        aichem_template_id=(
            str(aichem_submission.get("template_id"))
            if isinstance(aichem_submission, dict) and aichem_submission.get("template_id") is not None
            else None
        ),
        aichem_task_id=(
            str(aichem_submission.get("aichem_task_id"))
            if isinstance(aichem_submission, dict) and aichem_submission.get("aichem_task_id") is not None
            else None
        ),
        aichem_task_name=(
            str(aichem_submission.get("task_name"))
            if isinstance(aichem_submission, dict) and aichem_submission.get("task_name") is not None
            else None
        ),
        aichem_direct_task_detected=(
            bool(aichem_submission.get("direct_task_detected"))
            if isinstance(aichem_submission, dict) and "direct_task_detected" in aichem_submission
            else None
        ),
        aichem_start_mode=(
            str(aichem_submission.get("start_mode"))
            if isinstance(aichem_submission, dict) and aichem_submission.get("start_mode") is not None
            else None
        ),
        aichem_failure_stage=(
            str(aichem_submission.get("failure_stage"))
            if isinstance(aichem_submission, dict) and aichem_submission.get("failure_stage") is not None
            else None
        ),
        plan_export_status=plan_export.get("status") if isinstance(plan_export, dict) else None,
        session_count=session_count,
        source_trial_dir=str(trial_dir.resolve()),
        bundled_trial_dir=str(bundle_trial_dir.resolve()),
    )


def discover_job_dirs(manifest_path: Path) -> list[Path]:
    manifest = load_json(manifest_path) or {}
    jobs_dir = Path(manifest.get("jobs_dir", "jobs"))
    config_paths = manifest.get("config_paths") or []
    names: list[str] = []
    for config_path in config_paths:
        text = Path(config_path).read_text(encoding="utf-8")
        for line in text.splitlines():
            if line.startswith("job_name:"):
                names.append(line.split(":", 1)[1].strip())
                break
    return [jobs_dir / name for name in names if (jobs_dir / name).exists()]


def write_csv(path: Path, rows: list[TrialRow]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(asdict(rows[0]).keys()) if rows else [])
        if rows:
            writer.writeheader()
            for row in rows:
                writer.writerow(asdict(row))


def build_summary(rows: list[TrialRow]) -> dict[str, Any]:
    by_job: dict[str, dict[str, Any]] = {}
    for row in rows:
        bucket = by_job.setdefault(
            row.job_name,
            {
                "trials": 0,
                "reward_1": 0,
                "reward_0": 0,
                "exceptions": 0,
                "final_plan": 0,
                "experiment_plan": 0,
                "aichem_submission": 0,
                "aichem_e2e_pass": 0,
                "aichem_direct_task_detected": 0,
                "sessions": 0,
                "tasks": set(),
            },
        )
        bucket["trials"] += 1
        if row.reward == 1:
            bucket["reward_1"] += 1
        elif row.reward == 0:
            bucket["reward_0"] += 1
        if row.has_exception:
            bucket["exceptions"] += 1
        if row.final_plan_exists:
            bucket["final_plan"] += 1
        if row.experiment_plan_exists:
            bucket["experiment_plan"] += 1
        if row.aichem_submission_exists:
            bucket["aichem_submission"] += 1
        if row.aichem_e2e_pass is True:
            bucket["aichem_e2e_pass"] += 1
        if row.aichem_direct_task_detected is True:
            bucket["aichem_direct_task_detected"] += 1
        bucket["sessions"] += row.session_count
        if row.task_id:
            bucket["tasks"].add(row.task_id)

    normalized_jobs = []
    for job_name, payload in sorted(by_job.items()):
        tasks = sorted(payload.pop("tasks"))
        normalized_jobs.append({"job_name": job_name, **payload, "tasks": tasks})
    return {
        "n_trials": len(rows),
        "n_jobs": len(by_job),
        "jobs": normalized_jobs,
    }


def build_lead_summary(summary: dict[str, Any], out_dir: Path) -> str:
    lines = [
        "# AIREADY Experiment Results Summary",
        "",
        f"Bundle directory: `{out_dir}`",
        "",
        "## Overview",
        "",
        f"- Trials collected: {summary['n_trials']}",
        f"- Jobs collected: {summary['n_jobs']}",
        "- Each trial keeps the result/config/log files, final JSON plan, AICHEM dispatch evidence, verifier logs, and native harness transcripts or session indexes when available.",
        "",
        "## Grouped Results",
        "",
        "| job | trials | reward=1 | reward=0 | exceptions | final_plan | direct_dispatch_pass | direct_task_detected | transcripts/sessions | tasks |",
        "| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |",
    ]
    for job in summary["jobs"]:
        lines.append(
            "| {job_name} | {trials} | {reward_1} | {reward_0} | {exceptions} | {final_plan} | {aichem_e2e_pass} | {aichem_direct_task_detected} | {sessions} | {tasks} |".format(
                job_name=job["job_name"],
                trials=job["trials"],
                reward_1=job["reward_1"],
                reward_0=job["reward_0"],
                exceptions=job["exceptions"],
                final_plan=job["final_plan"],
                aichem_e2e_pass=job["aichem_e2e_pass"],
                aichem_direct_task_detected=job["aichem_direct_task_detected"],
                sessions=job["sessions"],
                tasks=", ".join(job["tasks"]),
            )
        )
    lines.extend(
        [
            "",
            "## Files",
            "",
            "- `manifest.json`: Machine-readable manifest and grouped statistics.",
            "- `trial-summary.csv`: Structured per-trial index for review and filtering.",
            "- `jobs/`: Copied job/trial artifacts, including logs, trajectories, transcripts, and final JSON files.",
        ]
    )
    return "\n".join(lines) + "\n"


def main() -> int:
    args = parse_args()
    out_dir = args.out_dir.resolve()
    reset_dir(out_dir)

    if args.job_dirs:
        job_dirs = [Path(item) for item in args.job_dirs]
    else:
        job_dirs = discover_job_dirs(args.manifest)

    rows: list[TrialRow] = []
    copied_jobs: list[str] = []
    missing_jobs: list[str] = []
    for job_dir in job_dirs:
        job_dir = job_dir.resolve()
        if not job_dir.exists():
            missing_jobs.append(str(job_dir))
            continue
        copied_jobs.append(str(job_dir))
        bundle_job_dir = out_dir / "jobs" / job_dir.name
        bundle_job_dir.mkdir(parents=True, exist_ok=True)
        for rel in JOB_LEVEL_FILES:
            src = job_dir / rel
            if src.is_file():
                copy_file(src, job_dir, bundle_job_dir)
        for trial_dir in sorted(path for path in job_dir.iterdir() if path.is_dir() and "__" in path.name):
            rows.append(summarize_trial(job_dir.name, trial_dir, bundle_job_dir / trial_dir.name))

    summary = build_summary(rows)
    manifest = {
        "bundle_dir": str(out_dir),
        "source_manifest": str(args.manifest.resolve()),
        "copied_job_dirs": copied_jobs,
        "missing_job_dirs": missing_jobs,
        "summary": summary,
        "trials": [asdict(row) for row in rows],
    }
    write_json(out_dir / "manifest.json", manifest)
    if rows:
        write_csv(out_dir / "trial-summary.csv", rows)
    (out_dir / "lead-summary.md").write_text(
        build_lead_summary(summary, out_dir),
        encoding="utf-8",
    )
    print(out_dir)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
