#!/usr/bin/env python3

from __future__ import annotations

from dataclasses import asdict, dataclass
from pathlib import Path
import json
import re


REQUIRED_TASK_PATHS = (
    "instruction.md",
    "task.toml",
    "environment",
    "environment/Dockerfile",
    "solution",
    "tests",
    "environment/skills",
)


@dataclass(frozen=True)
class TaskInspection:
    task_id: str
    image_task_id: str
    root: str
    complete: bool
    missing: list[str]

    def to_json_dict(self) -> dict[str, object]:
        return asdict(self)


def sanitize_image_component(value: str) -> str:
    slug = value.strip().lower()
    slug = re.sub(r"[^a-z0-9._-]+", "-", slug)
    slug = re.sub(r"-{2,}", "-", slug)
    slug = slug.strip("._-")
    if not slug:
        raise ValueError(f"Cannot derive OCI-safe image component from: {value!r}")
    return slug


def iter_task_dirs(root: Path) -> list[Path]:
    if not root.exists():
        return []
    return sorted(path for path in root.iterdir() if path.is_dir())


def inspect_task_dir(
    task_dir: Path,
    required_paths: tuple[str, ...] = REQUIRED_TASK_PATHS,
) -> TaskInspection:
    missing: list[str] = []
    for rel_path in required_paths:
        path = task_dir / rel_path
        if not path.exists():
            missing.append(rel_path)

    return TaskInspection(
        task_id=task_dir.name,
        image_task_id=sanitize_image_component(task_dir.name),
        root=str(task_dir),
        complete=not missing,
        missing=missing,
    )


def inspect_task_root(
    root: Path,
    required_paths: tuple[str, ...] = REQUIRED_TASK_PATHS,
) -> list[TaskInspection]:
    return [inspect_task_dir(task_dir, required_paths=required_paths) for task_dir in iter_task_dirs(root)]


def write_json(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
