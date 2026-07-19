#!/usr/bin/env python3

from __future__ import annotations

import argparse
import csv
import json
import statistics
from collections import defaultdict
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[1]


def read_json(path: Path) -> Any:
    return json.loads(path.read_text(encoding="utf-8"))


def write_json(path: Path, payload: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


def write_csv(path: Path, rows: list[dict[str, Any]], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        for row in rows:
            writer.writerow({key: row.get(key, "") for key in fieldnames})


def load_jsonl(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    rows: list[dict[str, Any]] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line:
            rows.append(json.loads(line))
    return rows


def score_valid(payload: Any) -> bool:
    if not isinstance(payload, dict):
        return False
    score = payload.get("score")
    if not isinstance(score, int) or isinstance(score, bool) or not (0 <= score <= 100):
        return False
    if not isinstance(payload.get("reason"), str) or not payload["reason"].strip():
        return False
    evidence = payload.get("evidence")
    if not isinstance(evidence, list) or not evidence:
        return False
    for item in evidence:
        if isinstance(item, str) and item.strip():
            continue
        if isinstance(item, dict) and item:
            continue
        return False
    return True


def build_trial_dir_index(jobs_root: Path, scoring_task_ids: set[str]) -> dict[str, Path]:
    if not jobs_root.exists() or not scoring_task_ids:
        return {}
    indexed: dict[str, Path] = {}

    def keep_latest(scoring_task_id: str, trial_dir: Path) -> None:
        current = indexed.get(scoring_task_id)
        if current is None or trial_dir.stat().st_mtime > current.stat().st_mtime:
            indexed[scoring_task_id] = trial_dir

    for path in jobs_root.glob("*/*"):
        if not path.is_dir() or path.name not in scoring_task_ids:
            continue
        keep_latest(path.name, path)

    missing = scoring_task_ids - set(indexed)
    if missing:
        for result_path in jobs_root.glob("*/*/result.json"):
            try:
                result = read_json(result_path)
            except Exception:
                continue
            task_name = result.get("task_name")
            if task_name in missing:
                keep_latest(task_name, result_path.parent)
                missing.discard(task_name)
                if not missing:
                    break

    missing = scoring_task_ids - set(indexed)
    if missing:
        for path in jobs_root.rglob("*"):
            if not missing:
                break
            if not path.is_dir() or path.name not in missing:
                continue
            keep_latest(path.name, path)
            missing.discard(path.name)
    return indexed


def parse_score_for_item(item: dict[str, Any], trial_dir_index: dict[str, Path]) -> dict[str, Any]:
    scoring_task_id = item["scoring_task_id"]
    trial_dir = trial_dir_index.get(scoring_task_id)
    row: dict[str, Any] = {
        "scoring_task_id": scoring_task_id,
        "judge_key": item.get("judge_key", ""),
        "dimension": item.get("dimension_key", "") or item.get("dimension", "") or item.get("dimension_id", ""),
        "source_trial_dir": item.get("source_trial_dir", ""),
        "source_final_plan_path": item.get("source_final_plan_path", "") or item.get("source_final_json_path", ""),
        "scoring_trial_dir": str(trial_dir) if trial_dir else "",
        "parse_status": "missing_scoring_trial_dir",
        "score_valid": False,
        "score": "",
        "reason": "",
        "evidence": "",
        "exception_type": "",
        "started_at": "",
        "finished_at": "",
        "duration_seconds": "",
        "reward": "",
    }
    if trial_dir is None:
        return row

    result_path = trial_dir / "result.json"
    if result_path.exists():
        try:
            result = read_json(result_path)
            row["started_at"] = result.get("started_at", "")
            row["finished_at"] = result.get("finished_at", "")
            row["duration_seconds"] = result.get("duration_seconds", "")
            row["reward"] = result.get("reward", "")
            exc = result.get("exception") or {}
            if isinstance(exc, dict):
                row["exception_type"] = exc.get("type", "") or exc.get("name", "")
        except Exception as exc:
            row["parse_status"] = f"result_parse_error:{type(exc).__name__}"

    score_path = trial_dir / "artifacts" / "score.json"
    if not score_path.exists():
        score_path = trial_dir / "logs" / "artifacts" / "score.json"
    if not score_path.exists():
        score_path = trial_dir / "score.json"
    if not score_path.exists():
        row["parse_status"] = "missing_score_json"
        return row

    try:
        payload = read_json(score_path)
    except Exception as exc:
        row["parse_status"] = f"score_json_parse_error:{type(exc).__name__}"
        return row

    row["score_valid"] = score_valid(payload)
    row["parse_status"] = "ok" if row["score_valid"] else "invalid_score_schema"
    row["score"] = payload.get("score", "")
    row["reason"] = payload.get("reason", "")
    evidence = payload.get("evidence", "")
    row["evidence"] = json.dumps(evidence, ensure_ascii=False) if isinstance(evidence, list) else evidence
    return row


def source_slot_key(source_trial_dir: str, dimension: str) -> tuple[str, str]:
    return source_trial_dir, dimension


def build_dimension_rows(per_judge_rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    grouped: dict[tuple[str, str], list[dict[str, Any]]] = defaultdict(list)
    for row in per_judge_rows:
        grouped[source_slot_key(row["source_trial_dir"], row["dimension"])].append(row)

    rows: list[dict[str, Any]] = []
    for (source_trial_dir, dimension), items in sorted(grouped.items()):
        scores = [
            int(item["score"])
            for item in items
            if item.get("score_valid") is True and str(item.get("score", "")).isdigit()
        ]
        score_delta = ""
        if len(scores) >= 2:
            score_delta = max(scores) - min(scores)
        rows.append(
            {
                "source_trial_dir": source_trial_dir,
                "dimension": dimension,
                "mean_score": round(statistics.mean(scores), 3) if scores else "",
                "score_delta": score_delta,
                "large_disagreement": bool(score_delta != "" and int(score_delta) >= 20),
                "valid_judge_count": len(scores),
                "judge_scores_json": json.dumps(
                    {
                        item["judge_key"]: item.get("score", "")
                        for item in items
                        if item.get("score_valid") is True
                    },
                    ensure_ascii=False,
                    sort_keys=True,
                ),
            }
        )
    return rows


def build_trial_rows(per_dimension_rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    grouped: dict[str, list[dict[str, Any]]] = defaultdict(list)
    for row in per_dimension_rows:
        grouped[row["source_trial_dir"]].append(row)
    out: list[dict[str, Any]] = []
    for source_trial_dir, items in sorted(grouped.items()):
        by_dim = {item["dimension"]: item for item in items}
        r1 = by_dim.get("R1") or by_dim.get("physical_implementability") or by_dim.get("R1_physical_system_executability") or {}
        r2 = by_dim.get("R2") or by_dim.get("workflow_completeness") or by_dim.get("R2_problem_coverage_workflow_completeness") or {}
        r3 = by_dim.get("R3") or by_dim.get("design_rationality") or by_dim.get("R3_visible_scientific_design_reasonableness") or {}
        dimension_scores = [
            float(item["mean_score"])
            for item in items
            if item.get("mean_score") not in ("", None)
        ]
        out.append(
            {
                "source_trial_dir": source_trial_dir,
                "physical_implementability": r1.get("mean_score", ""),
                "workflow_completeness": r2.get("mean_score", ""),
                "design_rationality": r3.get("mean_score", ""),
                "overall_mean": round(statistics.mean(dimension_scores), 3) if dimension_scores else "",
                "scored_dimension_count": len(dimension_scores),
                "large_disagreement_count": sum(1 for item in items if item.get("large_disagreement")),
            }
        )
    return out


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Aggregate AIREADY LLM-judge scoring results.")
    parser.add_argument("--scoring-manifest", type=Path, required=True)
    parser.add_argument("--jobs-root", type=Path, default=Path("jobs"))
    parser.add_argument("--out-dir", type=Path, required=True)
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    manifest_path = args_path(args.scoring_manifest)
    jobs_root = args_path(args.jobs_root)
    out_dir = args_path(args.out_dir)

    manifest = read_json(manifest_path)
    prepared_items_path = Path(manifest["out_root"]) / "prepared_items.jsonl"
    prepared_items = load_jsonl(prepared_items_path)
    trial_dir_index = build_trial_dir_index(
        jobs_root,
        {str(item["scoring_task_id"]) for item in prepared_items},
    )

    per_judge_rows = [parse_score_for_item(item, trial_dir_index) for item in prepared_items]
    per_dimension_rows = build_dimension_rows(per_judge_rows)
    per_trial_rows = build_trial_rows(per_dimension_rows)
    disagreement_rows = [row for row in per_dimension_rows if row.get("large_disagreement")]

    per_judge_fields = [
        "scoring_task_id",
        "judge_key",
        "dimension",
        "source_trial_dir",
        "source_final_plan_path",
        "scoring_trial_dir",
        "parse_status",
        "score_valid",
        "score",
        "reason",
        "evidence",
        "exception_type",
        "started_at",
        "finished_at",
        "duration_seconds",
        "reward",
    ]
    per_dimension_fields = [
        "source_trial_dir",
        "dimension",
        "mean_score",
        "score_delta",
        "large_disagreement",
        "valid_judge_count",
        "judge_scores_json",
    ]
    per_trial_fields = [
        "source_trial_dir",
        "physical_implementability",
        "workflow_completeness",
        "design_rationality",
        "overall_mean",
        "scored_dimension_count",
        "large_disagreement_count",
    ]

    write_csv(out_dir / "per_judge_scores.csv", per_judge_rows, per_judge_fields)
    write_csv(out_dir / "per_trial_dimension_scores.csv", per_dimension_rows, per_dimension_fields)
    write_csv(out_dir / "per_trial_overall_scores.csv", per_trial_rows, per_trial_fields)
    write_csv(out_dir / "disagreement_cases.csv", disagreement_rows, per_dimension_fields)
    summary = {
        "manifest": str(manifest_path),
        "prepared_scoring_trials": len(prepared_items),
        "per_judge_rows": len(per_judge_rows),
        "valid_score_rows": sum(1 for row in per_judge_rows if row.get("score_valid") is True),
        "per_trial_dimension_rows": len(per_dimension_rows),
        "per_trial_rows": len(per_trial_rows),
        "large_disagreement_rows": len(disagreement_rows),
    }
    write_json(out_dir / "summary.json", summary)
    print(json.dumps({"out_dir": str(out_dir), **summary}, ensure_ascii=False))
    return 0


def args_path(path: Path) -> Path:
    return path if path.is_absolute() else ROOT / path


if __name__ == "__main__":
    raise SystemExit(main())
