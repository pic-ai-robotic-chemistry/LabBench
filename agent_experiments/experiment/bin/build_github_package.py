#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import shutil
import zipfile
from pathlib import Path
from typing import Iterable


ROOT = Path(__file__).resolve().parents[2]

TOP_LEVEL_FILES = [
    "README.md",
    "pyproject.toml",
    ".env.example",
    "Benchmark_V15.docx",
]

DIRECTORY_ALLOWLIST = [
    "environments",
    "experiment",
    "images/base",
    "images/harness/claude-code",
    "images/harness/codex",
    "images/harness/gemini-cli",
    "images/harness/hermes",
    "images/harness/kilo-code",
    "images/harness/openclaw",
    "scoring/images",
    "scoring/score_rule_en",
]

AGENT_FILES = [
    "agents/aiready_claude_code.py",
    "agents/aiready_codex.py",
    "agents/aiready_gemini_cli.py",
    "agents/aiready_hermes.py",
    "agents/aiready_kilo_code.py",
    "agents/aiready_openclaw.py",
    "agents/experiment_plan_export.py",
    "agents/preinstalled_claude_code.py",
    "agents/preinstalled_codex.py",
    "agents/preinstalled_gemini_cli.py",
    "agents/preinstalled_hermes.py",
    "agents/preinstalled_kilo_code.py",
    "agents/preinstalled_openclaw.py",
    "agents/runtime_config_support.py",
]

TOOL_FILES = [
    "tools/aggregate_aiready_scoring.py",
    "tools/build_aiready_analysis_bundle.py",
    "tools/build_aiready_scoring_images.sh",
    "tools/build_harness_images.sh",
    "tools/build_image_matrix.sh",
    "tools/build_layered_final_image.sh",
    "tools/docker_runtime_cleanup.py",
    "tools/formal_env.sh",
    "tools/materialize_env_config.py",
    "tools/output_contract.py",
    "tools/preflight_aiready_run.py",
    "tools/prepare_aiready_experiment.py",
    "tools/prepare_aiready_image_layers.py",
    "tools/prepare_image_layers.py",
    "tools/prepare_aiready_scoring.py",
    "tools/push_local_image_to_harbor_via_crane.sh",
    "tools/render_formal_monitor.py",
    "tools/resolve_formal_task_platform.py",
    "tools/run_formal_matrix_with_progress.sh",
    "tools/run_formal_with_cleanup.sh",
    "tools/run_with_timeout.py",
    "tools/runtime_progress.py",
    "tools/stat_aiready_trials.py",
    "tools/task_inventory.py",
    "tools/validate_built_image.py",
    "tools/validate_experiment_isolation.py",
]

SCORING_FILES = [
    "scoring/README.md",
    "scoring/aiready_scoring_rubric_en.md",
]

RUNTIME_CONFIG_FILES = [
    "runtime-configs/README.md",
    "runtime-configs/claude-code/.claude.json",
    "runtime-configs/claude-code/settings.json",
    "runtime-configs/codex/auth.json",
    "runtime-configs/codex/config.toml",
]

EXCLUDED_NAMES = {
    ".DS_Store",
    ".idea",
    "__pycache__",
    ".pytest_cache",
    ".mypy_cache",
    ".ruff_cache",
    ".git",
    ".venv",
}

EXCLUDED_SUFFIXES = {
    ".pyc",
    ".pyo",
    ".zip",
}

EXCLUDED_DIR_PREFIXES = (
    "jobs",
    "analysis",
    "runtime-state",
    "remote-results",
    "worker-aiready",
    "runs",
    "dist",
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build a GitHub-ready AIREADY workflow source package.")
    parser.add_argument("--out-dir", type=Path, default=Path("dist/aiready-experiment-workflow"))
    parser.add_argument("--zip", action="store_true", help="Also write <out-dir>.zip")
    return parser.parse_args()


def should_skip(path: Path) -> bool:
    parts = path.parts
    if any(part in EXCLUDED_NAMES for part in parts):
        return True
    if path.suffix in EXCLUDED_SUFFIXES:
        return True
    if any(str(path).startswith(prefix + os.sep) or str(path) == prefix for prefix in EXCLUDED_DIR_PREFIXES):
        return True
    if "generated-" in str(path):
        return True
    return False


def copy_file(src_rel: str, out_dir: Path, copied: list[str]) -> None:
    src = ROOT / src_rel
    if not src.is_file():
        raise FileNotFoundError(f"Required package file missing: {src_rel}")
    dst = out_dir / src_rel
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dst)
    copied.append(src_rel)


def copy_tree(src_rel: str, out_dir: Path, copied: list[str]) -> None:
    src = ROOT / src_rel
    if not src.is_dir():
        raise FileNotFoundError(f"Required package directory missing: {src_rel}")
    for item in sorted(src.rglob("*")):
        rel = item.relative_to(ROOT)
        rel_text = rel.as_posix()
        if should_skip(rel):
            continue
        if item.is_dir():
            continue
        dst = out_dir / rel
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(item, dst)
        copied.append(rel_text)


def write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def package_files(out_dir: Path) -> Iterable[Path]:
    for path in sorted(out_dir.rglob("*")):
        if path.is_file():
            yield path


def write_package_gitignore(out_dir: Path) -> None:
    write_text(
        out_dir / ".gitignore",
        "\n".join(
            [
                ".env",
                ".venv/",
                "__pycache__/",
                "*.py[cod]",
                ".DS_Store",
                "runs/",
                "dist/",
                "jobs/",
                "analysis/",
                "runtime-state/",
                "",
            ]
        ),
    )


def write_runtime_manifest(out_dir: Path) -> None:
    manifest = {
        "schema_version": "1.0",
        "root": "runtime-configs",
        "harnesses": {
            "claude-code": {
                "mount_source": "runtime-configs/claude-code",
                "container_target": "/runtime-configs/claude-code",
                "read_only": True,
                "recommended_files": [".claude.json", "settings.json"],
            },
            "codex": {
                "mount_source": "runtime-configs/codex",
                "container_target": "/runtime-configs/codex",
                "read_only": True,
                "recommended_files": ["config.toml", "auth.json"],
            }
        },
    }
    write_text(out_dir / "runtime-configs" / "manifest.json", json.dumps(manifest, indent=2) + "\n")


def make_zip(out_dir: Path) -> Path:
    zip_path = out_dir.with_suffix(".zip")
    if zip_path.exists():
        zip_path.unlink()
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as zf:
        for path in package_files(out_dir):
            zf.write(path, path.relative_to(out_dir.parent))
    return zip_path


def main() -> int:
    args = parse_args()
    out_dir = args.out_dir if args.out_dir.is_absolute() else ROOT / args.out_dir
    if out_dir.exists():
        shutil.rmtree(out_dir)
    out_dir.mkdir(parents=True)

    copied: list[str] = []
    for rel in TOP_LEVEL_FILES:
        copy_file(rel, out_dir, copied)
    for rel in SCORING_FILES:
        copy_file(rel, out_dir, copied)
    for rel in RUNTIME_CONFIG_FILES:
        copy_file(rel, out_dir, copied)
    for rel in AGENT_FILES:
        copy_file(rel, out_dir, copied)
    for rel in TOOL_FILES:
        copy_file(rel, out_dir, copied)
    for rel in DIRECTORY_ALLOWLIST:
        copy_tree(rel, out_dir, copied)

    write_runtime_manifest(out_dir)
    write_package_gitignore(out_dir)

    result = {"out_dir": str(out_dir), "file_count": len(list(package_files(out_dir)))}
    if args.zip:
        result["zip"] = str(make_zip(out_dir))
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
