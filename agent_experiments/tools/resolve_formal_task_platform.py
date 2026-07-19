#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import os
import re
from pathlib import Path


BUGSWARM_FROM_RE = re.compile(
    r"^\s*FROM\s+bugswarm/cached-images:[^\s]+",
    re.IGNORECASE | re.MULTILINE,
)
EXPLICIT_AMD64_FROM_RE = re.compile(
    r"^\s*FROM\s+(?:--platform\s*=\s*)?linux/amd64\b|^\s*FROM\s+--platform=linux/amd64\b",
    re.IGNORECASE | re.MULTILINE,
)
AMD64_ONLY_BASE_RE = re.compile(
    r"^\s*FROM\s+(?:--platform=\S+\s+)?(?:gcr\.io/oss-fuzz-base/|jasonish/suricata:)",
    re.IGNORECASE | re.MULTILINE,
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Resolve the Docker platform for one formal task image build. "
            "Most tasks can use the caller default platform, but task layers "
            "that use amd64-only BugSwarm cached images must be built as "
            "linux/amd64 so copied harness and task binaries are usable."
        )
    )
    parser.add_argument("--task-id", required=True)
    parser.add_argument("--images-root", type=Path, default=Path("images"))
    parser.add_argument("--default-platform", default="linux/arm64")
    parser.add_argument(
        "--overrides-json",
        type=Path,
        default=None,
        help="Optional JSON mapping task id to explicit Docker platform.",
    )
    return parser.parse_args()


def load_overrides(path: Path | None) -> dict[str, str]:
    if path is None:
        env_path = os.environ.get("FORMAL_TASK_PLATFORM_OVERRIDES_JSON")
        path = Path(env_path) if env_path else None
    if path is None or not path.exists():
        return {}
    payload = json.loads(path.read_text(encoding="utf-8"))
    return {str(key): str(value) for key, value in payload.items() if value}


def task_dockerfile(images_root: Path, task_id: str) -> Path | None:
    candidates = [
        images_root / "task" / task_id / "Dockerfile",
        images_root / "task" / task_id.lower() / "Dockerfile",
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    return None


def resolve_platform(
    *,
    task_id: str,
    images_root: Path,
    default_platform: str,
    overrides: dict[str, str],
) -> str:
    for key in (task_id, task_id.lower()):
        if key in overrides:
            return overrides[key]

    dockerfile = task_dockerfile(images_root, task_id)
    if dockerfile is None:
        return default_platform

    text = dockerfile.read_text(encoding="utf-8", errors="replace")
    if (
        EXPLICIT_AMD64_FROM_RE.search(text)
        or BUGSWARM_FROM_RE.search(text)
        or AMD64_ONLY_BASE_RE.search(text)
    ):
        return "linux/amd64"

    return default_platform


def main() -> int:
    args = parse_args()
    overrides = load_overrides(args.overrides_json)
    print(
        resolve_platform(
            task_id=args.task_id,
            images_root=args.images_root,
            default_platform=args.default_platform,
            overrides=overrides,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
