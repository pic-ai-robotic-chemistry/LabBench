#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path


ROOT_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT_DIR / "tools"))

from prepare_image_layers import build_skill_context, build_task_context  # noqa: E402
from task_inventory import sanitize_image_component  # noqa: E402


SKILL_VARIANTS = ("aiready-skill-7.6",)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Prepare four-layer image contexts for the aiready benchmark."
    )
    parser.add_argument("--prepared-root", type=Path, default=Path("aiready/generated-v6"))
    parser.add_argument("--images-root", type=Path, default=None)
    parser.add_argument(
        "--task-source-variant",
        default=None,
        help="Variant used as the skill-free task-layer source after skills are stripped.",
    )
    return parser.parse_args()


def reset_dir(path: Path) -> None:
    if path.exists():
        shutil.rmtree(path)
    path.mkdir(parents=True, exist_ok=True)


def write_json(path: Path, payload: object) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def main() -> int:
    args = parse_args()
    prepared_root = args.prepared_root
    manifest_path = prepared_root / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    task_ids = list(manifest["selected_task_ids"])
    images_root = args.images_root or Path(manifest["images_root"])

    task_out_root = images_root / "task"
    skill_out_root = images_root / "skill"
    reset_dir(task_out_root)
    reset_dir(skill_out_root)

    skill_variants = list(manifest.get("skill_variants") or SKILL_VARIANTS)
    task_source_variant = args.task_source_variant or skill_variants[0]
    if task_source_variant not in skill_variants:
        raise KeyError(
            f"Task source variant {task_source_variant!r} is not in manifest skill variants: "
            f"{', '.join(skill_variants)}"
        )

    generated = {
        "task_layers": [],
        "skill_layers": [],
        "selected_task_ids": task_ids,
        "skill_variants": skill_variants,
        "prepared_root": str(prepared_root),
    }

    task_source_root = prepared_root / "tasks" / task_source_variant
    for task_id in task_ids:
        src_task_dir = task_source_root / task_id
        if not src_task_dir.exists():
            raise FileNotFoundError(f"Missing task source: {src_task_dir}")
        task_root = build_task_context(src_task_dir, task_out_root)
        generated["task_layers"].append(str(task_root))

        for skill_variant in skill_variants:
            variant_task_dir = prepared_root / "tasks" / skill_variant / task_id
            if not variant_task_dir.exists():
                raise FileNotFoundError(f"Missing skill variant task: {variant_task_dir}")
            skill_root = build_skill_context(
                sanitize_image_component(task_id),
                skill_variant,
                variant_task_dir,
                skill_out_root,
            )
            generated["skill_layers"].append(str(skill_root))

    write_json(images_root / "layer-index.json", generated)
    print(images_root.resolve())
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
