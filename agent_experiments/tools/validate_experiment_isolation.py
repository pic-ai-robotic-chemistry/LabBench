#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import yaml


ROOT = Path(__file__).resolve().parent.parent
AIREADY_REQUIRED_WRAPPERS = {
    "claude-code": "agents.aiready_claude_code:AireadyClaudeCode",
    "codex": "agents.aiready_codex:AireadyCodex",
    "gemini-cli": "agents.aiready_gemini_cli:AireadyGeminiCli",
    "hermes": "agents.aiready_hermes:AireadyHermes",
    "kilo-code": "agents.aiready_kilo_code:AireadyKiloCode",
    "openclaw": "agents.aiready_openclaw:AireadyOpenClaw",
}
SMOKE_AGENT_NAMES = {"oracle", "nop"}


@dataclass(frozen=True)
class Finding:
    scope: str
    path: Path
    message: str
    detail: str | None = None

    def to_json(self) -> dict[str, Any]:
        try:
            display_path = str(self.path.relative_to(ROOT))
        except ValueError:
            display_path = str(self.path)
        return {
            "scope": self.scope,
            "path": display_path,
            "message": self.message,
            "detail": self.detail,
        }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Validate AIREADY experiment configs for standalone local runs."
    )
    parser.add_argument("--scope", choices=("aiready", "all"), default="aiready")
    parser.add_argument("--aiready-config-root", type=Path, action="append", default=[])
    parser.add_argument("--aiready-config", type=Path, action="append", default=[])
    parser.add_argument(
        "--report-out",
        type=Path,
        default=Path("runtime-state/reports/experiment-isolation-aiready.json"),
    )
    return parser.parse_args()


def iter_yaml_files(paths: list[Path], roots: list[Path]) -> list[Path]:
    files: set[Path] = set()
    for path in paths:
        files.add(path)
    for root in roots:
        if root.is_file():
            files.add(root)
        elif root.exists():
            files.update(root.rglob("*.yaml"))
            files.update(root.rglob("*.yml"))
    return sorted(files)


def load_yaml(path: Path) -> dict[str, Any]:
    payload = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    return payload if isinstance(payload, dict) else {}


def infer_harness(path: Path, agent: dict[str, Any]) -> str | None:
    import_path = str(agent.get("import_path") or "").lower()
    name = str(agent.get("name") or "").lower()
    path_parts = {part.lower() for part in path.parts}
    if "aiready_claude_code" in import_path or "claude-code" in name or "claude-code" in path_parts:
        return "claude-code"
    if "aiready_codex" in import_path or "codex" in name or "codex" in path_parts:
        return "codex"
    if "aiready_gemini_cli" in import_path or "gemini-cli" in name or "gemini-cli" in path_parts:
        return "gemini-cli"
    if "aiready_hermes" in import_path or "hermes" in name or "hermes" in path_parts:
        return "hermes"
    if "aiready_kilo_code" in import_path or "kilo-code" in name or "kilo-code" in path_parts:
        return "kilo-code"
    if "aiready_openclaw" in import_path or "openclaw" in name or "openclaw" in path_parts:
        return "openclaw"
    return None


def validate_config(path: Path) -> list[Finding]:
    findings: list[Finding] = []
    if not path.exists():
        return [Finding("aiready-config", path, "config file does not exist")]

    try:
        payload = load_yaml(path)
    except Exception as exc:
        return [Finding("aiready-config", path, "failed to parse YAML", str(exc))]

    job_name = payload.get("job_name")
    jobs_dir = payload.get("jobs_dir")
    if not isinstance(job_name, str) or not job_name:
        findings.append(Finding("aiready-config", path, "missing non-empty job_name"))
    if not isinstance(jobs_dir, str) or not jobs_dir:
        findings.append(Finding("aiready-config", path, "missing non-empty jobs_dir"))

    environment = payload.get("environment") or {}
    if not isinstance(environment, dict):
        findings.append(Finding("aiready-config", path, "environment is not a mapping"))
    else:
        expected_environment = "environments.prebuilt_local_docker:PrebuiltLocalDockerEnvironment"
        actual_environment = str(environment.get("import_path") or "")
        if actual_environment != expected_environment:
            findings.append(
                Finding(
                    "aiready-config",
                    path,
                    "unexpected environment import_path",
                    f"expected {expected_environment}, got {actual_environment}",
                )
            )

    agents = payload.get("agents") or []
    envs: list[dict[str, Any]] = []
    if not isinstance(agents, list) or not agents:
        findings.append(Finding("aiready-config", path, "config does not contain any agents"))
    else:
        for agent in agents:
            if not isinstance(agent, dict):
                findings.append(Finding("aiready-config", path, "agent entry is not a mapping"))
                continue
            harness = infer_harness(path, agent)
            import_path = str(agent.get("import_path") or "")
            if harness is None and str(agent.get("name") or "").lower() in SMOKE_AGENT_NAMES:
                continue
            if harness is None:
                findings.append(
                    Finding(
                        "aiready-config",
                        path,
                        "unable to infer harness for agent entry",
                        import_path or str(agent.get("name") or ""),
                    )
                )
                continue
            expected = AIREADY_REQUIRED_WRAPPERS[harness]
            if import_path != expected:
                findings.append(
                    Finding(
                        "aiready-config",
                        path,
                        f"wrong AIREADY wrapper for {harness}",
                        f"expected {expected}, got {import_path}",
                    )
                )
            env = agent.get("env") or {}
            if not isinstance(env, dict):
                findings.append(Finding("aiready-config", path, "agent env is not a mapping"))
                continue
            envs.append(env)
            output_contract_mode = str(env.get("OUTPUT_CONTRACT_MODE") or "").strip().lower()
            benchmark = str(env.get("AIREADY_BENCHMARK") or "").strip().lower()
            is_scoring_config = benchmark.endswith("-scoring")
            if output_contract_mode == "off" and not is_scoring_config:
                findings.append(
                    Finding(
                        "aiready-config",
                        path,
                        "AIREADY JSON plan output contract is disabled",
                        str(env),
                    )
                )

    datasets = payload.get("datasets") or []
    if not isinstance(datasets, list) or not datasets:
        findings.append(Finding("aiready-config", path, "config does not contain any datasets"))
    else:
        for dataset in datasets:
            if not isinstance(dataset, dict):
                findings.append(Finding("aiready-config", path, "dataset entry is not a mapping"))
                continue
            dataset_path = Path(str(dataset.get("path") or ""))
            if not dataset_path.exists():
                findings.append(
                    Finding("aiready-config", path, "dataset path does not exist", str(dataset_path))
                )

    artifacts = payload.get("artifacts") or []
    is_scoring_config = any(
        str(env.get("AIREADY_BENCHMARK") or "").strip().lower().endswith("-scoring")
        for env in envs
    )
    if is_scoring_config:
        if "/workspace/score.json" not in artifacts:
            findings.append(
                Finding(
                    "aiready-config",
                    path,
                    "score artifact is not requested",
                    str(artifacts),
                )
            )
        if "/logs/artifacts/score.json" not in artifacts:
            findings.append(
                Finding(
                    "aiready-config",
                    path,
                    "score artifact copy is not requested",
                    str(artifacts),
                )
            )
    else:
        if "/workspace/experiment_plan.json" not in artifacts:
            findings.append(
                Finding(
                    "aiready-config",
                    path,
                    "experiment_plan artifact is not requested",
                    str(artifacts),
                )
            )
        if "/logs/artifacts/final_plan.json" not in artifacts:
            findings.append(
                Finding(
                    "aiready-config",
                    path,
                    "final_plan artifact is not requested",
                    str(artifacts),
                )
            )
    return findings


def render_markdown(findings: list[Finding]) -> str:
    lines = ["# AIREADY Isolation Validation", "", f"- findings: {len(findings)}", ""]
    if not findings:
        lines.append("- no isolation findings detected in current AIREADY configs")
        return "\n".join(lines) + "\n"
    for item in findings:
        payload = item.to_json()
        lines.append(f"- [{item.scope}] {payload['path']}: {item.message}")
        if item.detail:
            lines.append(f"  detail: {item.detail}")
    return "\n".join(lines) + "\n"


def main() -> int:
    args = parse_args()
    config_files = iter_yaml_files(args.aiready_config, args.aiready_config_root)
    findings: list[Finding] = []

    if not config_files:
        findings.append(Finding("aiready-config", ROOT, "no AIREADY config files were provided"))
    for config_file in config_files:
        findings.extend(validate_config(config_file))

    payload = {
        "scope": args.scope,
        "ok": not findings,
        "n_findings": len(findings),
        "checked_configs": [str(path) for path in config_files],
        "findings": [finding.to_json() for finding in findings],
        "markdown": render_markdown(findings),
    }
    args.report_out.parent.mkdir(parents=True, exist_ok=True)
    args.report_out.write_text(
        json.dumps(payload, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )

    if findings:
        print(payload["markdown"])
        return 1
    print(f"[ok] AIREADY isolation validated: {args.report_out}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
