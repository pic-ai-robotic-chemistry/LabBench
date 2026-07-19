from __future__ import annotations

import json
import os
import shlex
from pathlib import Path, PurePosixPath

from harbor.agents.installed.base import BaseInstalledAgent, CliFlag, with_prompt_template
from harbor.environments.base import BaseEnvironment
from harbor.models.agent.context import AgentContext
from harbor.models.task.config import MCPServerConfig
from harbor.models.trajectories import Agent, FinalMetrics, Metrics, Step, Trajectory
from harbor.models.trial.paths import EnvironmentPaths

from agents.experiment_plan_export import build_export_command_nonfatal
from tools.output_contract import (
    MissingRequiredOutputError,
    PLAN_ARTIFACT_PATH,
    PLAN_OUTPUT_PATH,
    build_valid_output_guard_command,
    build_output_check_command,
    extract_required_output_paths,
    normalize_output_contract_mode,
    output_contract_enabled,
    plan_output_contract_enabled,
)


def agent_prompt_augmentation_disabled(agent) -> bool:
    for key in (
        "AIREADY_DISABLE_AGENT_PROMPT_AUGMENTATION",
        "DISABLE_AGENT_PROMPT_AUGMENTATION",
    ):
        value = agent._get_env(key)
        normalized = str(value or "").strip().lower()
        if normalized in {"1", "true", "yes", "on"}:
            return True
        if normalized in {"0", "false", "no", "off"}:
            return False
    return normalize_output_contract_mode(agent._get_env("OUTPUT_CONTRACT_MODE")) == "aiready"


def _format_required_output_guidance(paths: list[str]) -> str:
    if not paths:
        return "- the exact output file(s) requested by the original task"
    return "\n".join(f"- `{path}`" for path in paths)


class PreinstalledOpenClaw(BaseInstalledAgent):
    """OpenClaw agent that assumes the CLI already exists in the image."""

    SUPPORTS_ATIF = True
    _OUTPUT_FILENAME = "openclaw.txt"
    _PLAN_OUTPUT_PATH = PurePosixPath(PLAN_OUTPUT_PATH)
    _PLAN_ARTIFACT_PATH = PurePosixPath(PLAN_ARTIFACT_PATH)
    _STATE_DIR = PurePosixPath("$HOME/.openclaw")
    _RUNTIME_PATH = "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
    _OUTPUT_CONTRACT_FILENAME = "output-contract.json"
    _DEFAULT_PRIMARY_SOFT_TIMEOUT_SEC = 1800
    _DEFAULT_MAX_OUTPUT_TOKENS = 128000

    CLI_FLAGS = [
        CliFlag(
            "thinking",
            cli="--thinking",
            type="enum",
            choices=["off", "minimal", "low", "medium", "high"],
            default="medium",
            env_fallback="OPENCLAW_THINKING_LEVEL",
        )
    ]

    @staticmethod
    def name() -> str:
        return "openclaw"

    async def install(self, environment: BaseEnvironment) -> None:
        return None

    def get_version_command(self) -> str | None:
        return "openclaw --version"

    def parse_version(self, stdout: str) -> str:
        return stdout.strip().splitlines()[-1].strip()

    def _build_register_skills_command(self) -> str | None:
        if not self.skills_dir:
            return None
        return (
            "mkdir -p $HOME/.openclaw/skills && "
            f"cp -r {shlex.quote(self.skills_dir)}/* $HOME/.openclaw/skills/ 2>/dev/null || true"
        )

    def _build_register_mcp_servers_command(self) -> str | None:
        if not self.mcp_servers:
            return None

        config = {
            "mcpServers": {server.name: self._serialize_mcp_server(server) for server in self.mcp_servers}
        }
        escaped = shlex.quote(json.dumps(config, indent=2))
        return 'mkdir -p "$HOME/.openclaw" && ' f'echo {escaped} > "$HOME/.openclaw/mcp.json"'

    @staticmethod
    def _serialize_mcp_server(server: MCPServerConfig) -> dict[str, object]:
        if server.transport == "stdio":
            payload: dict[str, object] = {"transport": "stdio", "command": server.command}
            if server.args:
                payload["args"] = server.args
            return payload
        transport = "http" if server.transport == "streamable-http" else server.transport
        return {"transport": transport, "url": server.url}

    def _resolved_thinking_level(self) -> str:
        raw = self._flag_kwargs.get("thinking") or self._get_env("OPENCLAW_THINKING_LEVEL")
        if raw is None:
            return "medium"
        normalized = str(raw).strip().lower()
        if normalized in {"off", "minimal", "low", "medium", "high"}:
            return normalized
        return "medium"

    @staticmethod
    def _effective_thinking_level(
        requested_level: str,
        model_runtime: dict[str, object],
    ) -> str:
        return requested_level

    def _primary_soft_timeout_sec(self) -> int | None:
        raw = self._get_env("OPENCLAW_PRIMARY_SOFT_TIMEOUT_SEC")
        if raw is None:
            raw = self._get_env("AIREADY_OPENCLAW_PRIMARY_SOFT_TIMEOUT_SEC")
        if raw is None:
            raw = str(self._DEFAULT_PRIMARY_SOFT_TIMEOUT_SEC)
        try:
            value = int(float(raw))
        except (TypeError, ValueError):
            return self._DEFAULT_PRIMARY_SOFT_TIMEOUT_SEC
        return value if value > 0 else None

    def _default_max_output_tokens(self) -> int | None:
        raw = self._get_env("OPENCLAW_MAX_OUTPUT_TOKENS")
        if raw is None:
            raw = self._get_env("AIREADY_OPENCLAW_MAX_OUTPUT_TOKENS")
        if raw is None:
            raw = str(self._DEFAULT_MAX_OUTPUT_TOKENS)
        try:
            value = int(float(raw))
        except (TypeError, ValueError):
            return self._DEFAULT_MAX_OUTPUT_TOKENS
        return value if value > 0 else None

    @staticmethod
    def _augment_instruction_for_tool_contract(
        instruction: str,
        *,
        output_contract_mode: str | None = None,
    ) -> str:
        required_output_paths = extract_required_output_paths(instruction)
        required_text = _format_required_output_guidance(required_output_paths)
        guidance_lines = [
            "OpenClaw non-interactive execution contract:",
            "0. Before inspecting long skill/reference files, identify the exact deliverable files requested by this task.",
            "1. Complete the task by writing the requested output files. Do not stop at analysis, planning, or a prose-only answer.",
            "2. The task workspace is `/root`. Read inputs from `/root` unless the prompt gives a different absolute path. Write every final output file to `/root` or to the exact absolute path requested by the prompt. Do not write final files only under `/root/.openclaw/workspace`.",
            "3. When using the read tool, always pass an explicit absolute file path. Never call read without a path.",
            "4. When running Python or Node code, write a script file under `/root` first and run it directly, for example `python3 /root/solve.py`. Avoid compound shell invocations such as `cd /root && python3 solve.py`, pipelines, or chained commands because this harness may reject them during non-interactive preflight.",
            "5. Before the final answer, verify every expected output file exists and is non-empty by reading or listing its absolute path under `/root`.",
        ]
        if plan_output_contract_enabled(instruction, output_contract_mode):
            guidance_lines.extend(
                [
                    "6. This task explicitly uses the JSON-plan contract: write the final plan to `/workspace/experiment_plan.json` and copy it to `/logs/artifacts/final_plan.json`.",
                    "6a. Every workflow step must include `step_number`, workstation `id`, `workstation`, and `operation`; the workstation `id` must be an integer from the selected workstation skill.",
                ]
            )
        guidance_lines.extend(
            [
                "7. Use an actual shell command, Python script, or heredoc to write the files. Do not rely on prose, markdown fences, or a final message as the output artifact.",
                "8. Avoid dumping very large skill/reference files. Prefer `rg`, `find`, targeted excerpts, and short schema reads so the run keeps enough budget to write and verify the artifact.",
                "9. Detected required output path(s):",
                required_text,
                "10. Once all required output files exist and pass a focused local check, stop and give a concise final response. Do not keep optimizing, searching, or reading large/binary files after the deliverables are present.",
            ]
        )
        guidance = "\n".join(guidance_lines)
        return guidance.rstrip() + "\n\n" + instruction

    @staticmethod
    def _build_runtime_preflight_command() -> str:
        return (
            f"export PATH={shlex.quote(PreinstalledOpenClaw._RUNTIME_PATH)}:$PATH; "
            "set -x; "
            "pwd; "
            "command -v python3; "
            "command -v node; "
            "/usr/bin/env node --version; "
            "command -v openclaw; "
            "openclaw --version"
        )

    @staticmethod
    def _build_node_env_compat_command() -> str:
        runtime_path = shlex.quote(PreinstalledOpenClaw._RUNTIME_PATH)
        return (
            f"export PATH={runtime_path}:$PATH; "
            "ensure_node_runtime() { "
            "if /usr/bin/env node --version >/dev/null 2>&1; then return 0; fi; "
            "for node_bin in /usr/local/bin/node /usr/bin/node "
            "/root/.nvm/versions/node/*/bin/node /home/*/.nvm/versions/node/*/bin/node; do "
            "[ -x \"$node_bin\" ] || continue; "
            "if \"$node_bin\" --version >/dev/null 2>&1; then "
            "export PATH=\"$(dirname \"$node_bin\"):$PATH\"; "
            "ln -sf \"$node_bin\" /usr/bin/node 2>/dev/null || true; "
            "break; "
            "fi; "
            "done; "
            "if /usr/bin/env node --version >/dev/null 2>&1; then return 0; fi; "
            "if [ -e /usr/local/bin/node ] && ! /usr/local/bin/node --version >/dev/null 2>&1; then "
            "mv /usr/local/bin/node /usr/local/bin/node.broken 2>/dev/null || rm -f /usr/local/bin/node 2>/dev/null || true; "
            "fi; "
            "if command -v apt-get >/dev/null 2>&1; then "
            "apt-get update >/dev/null 2>&1 && apt-get install -y --no-install-recommends nodejs npm >/dev/null 2>&1 || true; "
            "fi; "
            "if ! /usr/bin/env node --version >/dev/null 2>&1; then "
            "echo 'node runtime unavailable for openclaw harness' >&2; "
            "return 127; "
            "fi; "
            "}; ensure_node_runtime"
        )

    @staticmethod
    def _build_patch_exec_preflight_command() -> str:
        script = r'''
from pathlib import Path

needle = 'if (hasInterpreterInvocation && hasComplexSyntax && (hasInterpreterSegmentScriptHint || hasInterpreterPipelineScriptHint || hasProcessSubstitution && isDirectInterpreterCommand)) throw new Error("exec preflight: complex interpreter invocation detected; refusing to run without script preflight validation. Use a direct `python <file>.py` or `node <file>.js` command.");'
replacement = 'if (hasInterpreterInvocation && hasComplexSyntax && (hasInterpreterSegmentScriptHint || hasInterpreterPipelineScriptHint || hasProcessSubstitution && isDirectInterpreterCommand)) return;'

dist_root = Path("/usr/local/lib/node_modules/openclaw/dist")
patched = []
if dist_root.exists():
    for path in dist_root.glob("*.js"):
        try:
            text = path.read_text(encoding="utf-8")
        except OSError:
            continue
        if needle not in text:
            continue
        path.write_text(text.replace(needle, replacement), encoding="utf-8")
        patched.append(path.name)

print("openclaw exec preflight patch applied:", ",".join(patched) if patched else "none")
'''
        return "python3 -c " + shlex.quote(script)

    def _resolve_model_runtime(self, model_name: str) -> dict[str, object]:
        normalized = (model_name or "").strip()
        if not normalized:
            raise ValueError("OpenClaw model name is required.")
        base_url = self._get_env("OPENAI_BASE_URL")
        if not base_url:
            raise ValueError("OPENAI_BASE_URL is required for the OpenClaw harness.")
        default_max_output_tokens = self._default_max_output_tokens()
        provider_id = self._get_env("OPENCLAW_PROVIDER_ID") or "openai-compatible"
        model_descriptor: dict[str, object] = {
            "id": normalized,
            "name": normalized,
            "api": "openai-completions",
            "reasoning": True,
            "input": ["text"],
            "compat": {"supportsUsageInStreaming": True},
        }
        if default_max_output_tokens:
            model_descriptor["maxTokens"] = default_max_output_tokens

        return {
            "provider_id": provider_id,
            "provider_model": normalized,
            "base_url": base_url,
            "api": "openai-completions",
            "api_key_env": "OPENAI_API_KEY",
            "model_descriptor": model_descriptor,
        }

    def _build_provider_env(self, model_runtime: dict[str, object]) -> dict[str, str]:
        api_key_env = str(model_runtime["api_key_env"])
        selected_key = self._get_env(api_key_env)
        if not selected_key:
            raise ValueError(f"No API key found. Set {api_key_env}.")
        return {"OPENAI_API_KEY": selected_key}

    @staticmethod
    def _build_register_provider_command(
        *,
        provider_id: str,
        base_url: str,
        api: str,
        api_key_env: str,
        model_descriptor: dict[str, object],
        provider_options: dict[str, object] | None = None,
        effective_model: str | None = None,
    ) -> str:
        provider_value = {
            "baseUrl": base_url,
            "api": api,
            "models": [model_descriptor],
            "apiKey": {
                "source": "env",
                "provider": "default",
                "id": api_key_env,
            },
        }
        if provider_options:
            provider_value.update(provider_options)
        operations = [
            {
                "path": f"models.providers.{provider_id}",
                "value": provider_value,
            }
        ]
        escaped = shlex.quote(json.dumps(operations, ensure_ascii=False))
        return f"openclaw config set --batch-json {escaped} >/dev/null 2>&1 || true"

    @staticmethod
    def _build_runtime_workspace_command() -> str:
        operations = [
            {"path": "agents.defaults.workspace", "value": "/root"},
            {"path": "agents.defaults.skipBootstrap", "value": True},
            {"path": "tools.exec.host", "value": "gateway"},
            {"path": "tools.exec.security", "value": "full"},
            {"path": "tools.exec.ask", "value": "off"},
            {"path": "tools.exec.strictInlineEval", "value": False},
        ]
        escaped = shlex.quote(json.dumps(operations, ensure_ascii=False))
        return (
            f"openclaw config set --batch-json {escaped} >/dev/null 2>&1 || true"
        )

    @classmethod
    def _build_output_check_command(cls) -> str:
        raise NotImplementedError

    @classmethod
    def _build_required_output_check_command(
        cls,
        *,
        required_output_paths: list[str],
        expects_plan_artifact: bool,
    ) -> str:
        return build_output_check_command(
            required_output_paths=required_output_paths,
            expects_plan_output=expects_plan_artifact,
            plan_output_path=cls._PLAN_OUTPUT_PATH,
            plan_artifact_path=cls._PLAN_ARTIFACT_PATH,
        )

    @classmethod
    def _build_output_contract_debug_command(
        cls,
        *,
        status: str,
        reason: str,
        required_output_paths: list[str] | None = None,
        expects_plan_artifact: bool | None = None,
        output_contract_mode: str | None = None,
    ) -> str:
        payload = {
            "status": status,
            "reason": reason,
            "output_path": str(cls._PLAN_OUTPUT_PATH),
            "artifact_path": str(cls._PLAN_ARTIFACT_PATH),
            "required_output_paths": required_output_paths or [],
            "expects_plan_artifact": bool(expects_plan_artifact),
            "output_contract_mode": normalize_output_contract_mode(output_contract_mode),
            "diagnostic_note": (
                "Harness-side output-contract diagnostic only; SkillsBench scoring "
                "must use verifier/* outputs."
            ),
        }
        return (
            "python3 - <<'PY'\n"
            "import json\n"
            "from pathlib import Path\n"
            f"payload = json.loads({json.dumps(payload, ensure_ascii=True)!r})\n"
            f"path = Path({json.dumps(str(EnvironmentPaths.agent_dir / cls._OUTPUT_CONTRACT_FILENAME))})\n"
            "path.parent.mkdir(parents=True, exist_ok=True)\n"
            "path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + '\\n', encoding='utf-8')\n"
            "PY"
        )

    @classmethod
    def _build_openclaw_agent_command(
        cls,
        *,
        thinking_level: str,
        escaped_instruction: str,
        required_output_paths: list[str],
        expects_plan_artifact: bool,
        output_contract_mode: str,
        max_runtime_sec: int | None,
    ) -> str:
        raw_command = (
            f"openclaw agent --local --json --thinking {shlex.quote(thinking_level)} "
            f"--to skillbench-run --message {escaped_instruction}"
        )
        return build_valid_output_guard_command(
            raw_command=raw_command,
            output_log=EnvironmentPaths.agent_dir / cls._OUTPUT_FILENAME,
            contract_path=EnvironmentPaths.agent_dir / cls._OUTPUT_CONTRACT_FILENAME,
            required_output_paths=required_output_paths,
            expects_plan_output=expects_plan_artifact,
            output_contract_mode=output_contract_mode,
            agent_kind="openclaw",
            grace_env_var="OPENCLAW_VALID_OUTPUT_GRACE_SEC",
            poll_env_var="OPENCLAW_VALID_OUTPUT_POLL_SEC",
            default_grace_sec=300,
            default_poll_sec=10,
            plan_output_path=cls._PLAN_OUTPUT_PATH,
            plan_artifact_path=cls._PLAN_ARTIFACT_PATH,
            max_runtime_sec=max_runtime_sec,
        )

    @classmethod
    def _build_export_runtime_artifacts_command(cls) -> str:
        agent_dir = EnvironmentPaths.agent_dir
        native_dir = agent_dir / "native" / "openclaw"
        native_home = native_dir / "home"
        native_home_q = shlex.quote(str(native_home))
        native_agents_q = shlex.quote(str(native_home / "agents"))
        native_cli_version_q = shlex.quote(str(native_dir / "cli-version.txt"))

        return " && ".join(
            [
                f"export PATH={shlex.quote(cls._RUNTIME_PATH)}:$PATH",
                f"mkdir -p {native_home_q} {native_agents_q}",
                (
                    'if [ -d "$HOME/.openclaw/agents" ]; then '
                    f'cp -R "$HOME/.openclaw/agents/." {native_agents_q}/; '
                    "fi"
                ),
                (
                    "if command -v openclaw >/dev/null 2>&1; then "
                    f"openclaw --version > {native_cli_version_q} 2>/dev/null || true; "
                    "fi"
                ),
            ]
        )

    @staticmethod
    def _load_json(path: Path) -> dict[str, object] | None:
        if not path.exists():
            return None
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return None
        return payload if isinstance(payload, dict) else None

    @staticmethod
    def _iter_json_values(raw_text: str) -> list[dict[str, object]]:
        decoder = json.JSONDecoder()
        values: list[dict[str, object]] = []
        index = 0
        length = len(raw_text)

        while index < length:
            brace_index = raw_text.find("{", index)
            if brace_index < 0:
                break
            try:
                value, offset = decoder.raw_decode(raw_text[brace_index:])
            except json.JSONDecodeError:
                index = brace_index + 1
                continue
            if isinstance(value, dict):
                values.append(value)
            index = brace_index + offset

        return values

    @staticmethod
    def _coerce_int(value: object) -> int | None:
        if isinstance(value, bool):
            return None
        if isinstance(value, int | float):
            return int(value)
        if isinstance(value, str):
            try:
                return int(float(value))
            except ValueError:
                return None
        return None

    def _read_native_session_usage(self) -> dict[str, object]:
        native_root = self.logs_dir / "native" / "openclaw" / "home" / "agents"
        if not native_root.exists():
            return {}

        totals = {
            "input_tokens": 0,
            "output_tokens": 0,
            "cache_read_tokens": 0,
            "cache_write_tokens": 0,
            "reasoning_tokens": 0,
        }
        usage_messages = 0
        session_files = 0

        for session_path in sorted(native_root.glob("*/sessions/*.jsonl")):
            session_files += 1
            for line in session_path.read_text(encoding="utf-8", errors="ignore").splitlines():
                try:
                    payload = json.loads(line)
                except json.JSONDecodeError:
                    continue
                if not isinstance(payload, dict):
                    continue

                message = payload.get("message")
                usage = message.get("usage") if isinstance(message, dict) else None
                if not isinstance(usage, dict):
                    continue

                usage_messages += 1
                mapping = {
                    "input": "input_tokens",
                    "output": "output_tokens",
                    "cacheRead": "cache_read_tokens",
                    "cacheWrite": "cache_write_tokens",
                    "reasoning": "reasoning_tokens",
                }
                for source_key, target_key in mapping.items():
                    value = self._coerce_int(usage.get(source_key))
                    if value is not None:
                        totals[target_key] += value

        observed_total = sum(totals.values())
        if observed_total <= 0:
            return {}

        return {
            **totals,
            "observed_total_tokens": observed_total,
            "session_files": session_files,
            "usage_messages": usage_messages,
            "usage_source": "openclaw-session",
        }

    def _write_runtime_debug_artifacts(self) -> None:
        trial_dir = self.logs_dir.parent
        native_root = self.logs_dir / "native" / "openclaw" / "home" / "agents"
        debug_dir = trial_dir / "debug" / "harness" / "openclaw"
        debug_dir.mkdir(parents=True, exist_ok=True)

        files: list[dict[str, object]] = []
        session_ids: set[str] = set()
        agent_ids: set[str] = set()

        if native_root.exists():
            for sessions_dir in sorted(native_root.glob("*/sessions")):
                if not sessions_dir.is_dir():
                    continue
                agent_id = sessions_dir.parent.name
                agent_ids.add(agent_id)

                store_path = sessions_dir / "sessions.json"
                store = self._load_json(store_path) or {}
                indexed_paths: set[Path] = set()

                for session_key, value in sorted(store.items()):
                    if not isinstance(value, dict):
                        continue

                    session_id = value.get("sessionId")
                    if isinstance(session_id, str) and session_id.strip():
                        session_id = session_id.strip()
                        session_ids.add(session_id)
                    else:
                        session_id = None

                    session_file = value.get("sessionFile")
                    transcript_path: Path | None = None
                    if isinstance(session_file, str) and session_file.strip():
                        transcript_path = sessions_dir / session_file.strip()
                    elif session_id:
                        transcript_path = sessions_dir / f"{session_id}.jsonl"

                    transcript_rel = None
                    transcript_exists = False
                    transcript_size = None
                    if transcript_path is not None:
                        indexed_paths.add(transcript_path.resolve())
                        transcript_exists = transcript_path.is_file()
                        if transcript_exists:
                            transcript_rel = str(transcript_path.relative_to(trial_dir))
                        else:
                            transcript_rel = str(transcript_path)
                        if transcript_exists:
                            transcript_size = transcript_path.stat().st_size

                    files.append(
                        {
                            "agent_id": agent_id,
                            "session_key": session_key,
                            "session_id": session_id,
                            "session_file": session_file,
                            "store_path": str(store_path.relative_to(trial_dir))
                            if store_path.exists()
                            else str(store_path),
                            "transcript_path": transcript_rel,
                            "transcript_exists": transcript_exists,
                            "size_bytes": transcript_size,
                        }
                    )

                for transcript_path in sorted(sessions_dir.glob("*.jsonl")):
                    transcript_resolved = transcript_path.resolve()
                    if transcript_resolved in indexed_paths:
                        continue
                    session_id = transcript_path.stem
                    session_ids.add(session_id)
                    files.append(
                        {
                            "agent_id": agent_id,
                            "session_key": None,
                            "session_id": session_id,
                            "session_file": transcript_path.name,
                            "store_path": str(store_path.relative_to(trial_dir))
                            if store_path.exists()
                            else str(store_path),
                            "transcript_path": str(transcript_path.relative_to(trial_dir)),
                            "transcript_exists": True,
                            "size_bytes": transcript_path.stat().st_size,
                        }
                    )

        session_index = {
            "files": files,
        }
        runtime_payload = {
            "harness": "openclaw",
            "model_name": self.model_name,
            "thinking_level": self._resolved_thinking_level(),
            "cli_version": self.version() or "unknown",
            "formal_key_label": os.environ.get("FORMAL_KEY_LABEL"),
            "formal_key_provider": os.environ.get("FORMAL_KEY_PROVIDER"),
            "raw_output_file": str((self.logs_dir / self._OUTPUT_FILENAME).relative_to(trial_dir)),
            "native_agents_root": str(native_root.relative_to(trial_dir)),
            "exported_agent_ids": sorted(agent_ids),
            "session_ids": sorted(session_ids),
            "session_file_count": sum(1 for item in files if item.get("transcript_exists")),
            "session_index_path": str((debug_dir / "session_index.json").relative_to(trial_dir)),
        }

        (debug_dir / "runtime.json").write_text(
            json.dumps(runtime_payload, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )

    def _output_contract_mode(self) -> str:
        return normalize_output_contract_mode(self._get_env("OUTPUT_CONTRACT_MODE"))
        (debug_dir / "session_index.json").write_text(
            json.dumps(session_index, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
        (debug_dir / "cli-version.txt").write_text(
            (self.version() or "unknown") + "\n",
            encoding="utf-8",
        )
        (debug_dir / "model-selection.txt").write_text(
            (self.model_name or "unknown") + "\n",
            encoding="utf-8",
        )
        (debug_dir / "onboarding.log").write_text(
            (
                f"exported openclaw native session artifacts: {runtime_payload['session_file_count']} transcript file(s), "
                f"{len(agent_ids)} agent dir(s)\n"
            ),
            encoding="utf-8",
        )

    @with_prompt_template
    async def run(
        self, instruction: str, environment: BaseEnvironment, context: AgentContext
    ) -> None:
        output_contract_mode = self._output_contract_mode()
        contract_enabled = output_contract_enabled(output_contract_mode)
        required_output_paths = extract_required_output_paths(instruction)
        expects_plan_artifact = plan_output_contract_enabled(
            instruction,
            output_contract_mode,
        )
        if not agent_prompt_augmentation_disabled(self):
            instruction = self._augment_instruction_for_tool_contract(
                instruction,
                output_contract_mode=output_contract_mode,
            )
        escaped_instruction = shlex.quote(instruction)

        env: dict[str, str] = {}
        env["PATH"] = self._RUNTIME_PATH

        model_runtime = self._resolve_model_runtime(self.model_name or "")
        provider_id = str(model_runtime["provider_id"])
        provider_model = str(model_runtime["provider_model"])
        effective_model = f"{provider_id}/{provider_model}" if provider_model else ""

        if effective_model:
            env["OPENCLAW_MODEL"] = effective_model
        if formal_key_label := self._get_env("FORMAL_KEY_LABEL"):
            env["FORMAL_KEY_LABEL"] = formal_key_label
        if formal_key_provider := self._get_env("FORMAL_KEY_PROVIDER"):
            env["FORMAL_KEY_PROVIDER"] = formal_key_provider
        env["OUTPUT_CONTRACT_MODE"] = output_contract_mode
        requested_thinking_level = self._resolved_thinking_level()
        thinking_level = self._effective_thinking_level(requested_thinking_level, model_runtime)
        env["OPENCLAW_REQUESTED_THINKING_LEVEL"] = requested_thinking_level
        env["OPENCLAW_EFFECTIVE_THINKING_LEVEL"] = thinking_level

        env.update(self._build_provider_env(model_runtime))

        setup_commands: list[str] = ['mkdir -p "$HOME/.openclaw"']
        skills_command = self._build_register_skills_command()
        if skills_command:
            setup_commands.append(skills_command)
        mcp_command = self._build_register_mcp_servers_command()
        if mcp_command:
            setup_commands.append(mcp_command)
        setup_commands.append(self._build_node_env_compat_command())
        setup_commands.append(self._build_patch_exec_preflight_command())
        setup_commands.append(self._build_runtime_workspace_command())
        setup_commands.append(
            self._build_register_provider_command(
                provider_id=provider_id,
                base_url=str(model_runtime["base_url"]),
                api=str(model_runtime["api"]),
                api_key_env=str(model_runtime["api_key_env"]),
                model_descriptor=dict(model_runtime["model_descriptor"]),
                provider_options=dict(model_runtime.get("provider_options") or {}),
                effective_model=effective_model,
            )
        )
        if effective_model:
            setup_commands.append(
                f"openclaw models set {shlex.quote(effective_model)} >/dev/null 2>&1 || true"
            )
        setup_commands.append(self._build_runtime_preflight_command())

        await self.exec_as_agent(
            environment,
            command=f"export PATH={shlex.quote(self._RUNTIME_PATH)}:$PATH; " + " && ".join(setup_commands),
            env=env,
        )

        agent_error: Exception | None = None
        output_valid = False
        try:
            await self.exec_as_agent(
                environment,
                command=(
                    f"export PATH={shlex.quote(self._RUNTIME_PATH)}:$PATH; "
                    "cd /root && "
                    + self._build_openclaw_agent_command(
                        thinking_level=thinking_level,
                        escaped_instruction=escaped_instruction,
                        required_output_paths=required_output_paths,
                        expects_plan_artifact=expects_plan_artifact,
                        output_contract_mode=output_contract_mode,
                        max_runtime_sec=self._primary_soft_timeout_sec(),
                    )
                ),
                env=env,
                cwd="/root",
            )
        except Exception as exc:
            agent_error = exc
        finally:
            try:
                if expects_plan_artifact:
                    await self.exec_as_agent(
                        environment,
                        command=build_export_command_nonfatal(
                            agent_kind="openclaw",
                            source_log=EnvironmentPaths.agent_dir / self._OUTPUT_FILENAME,
                            output_path=self._PLAN_OUTPUT_PATH,
                            artifact_path=self._PLAN_ARTIFACT_PATH,
                            summary_path=EnvironmentPaths.agent_dir / "plan-export.json",
                        ),
                    )
            except Exception:
                pass

            if contract_enabled:
                try:
                    await self.exec_as_agent(
                        environment,
                        command=self._build_required_output_check_command(
                            required_output_paths=required_output_paths,
                            expects_plan_artifact=expects_plan_artifact,
                        ),
                    )
                    output_valid = True
                except Exception:
                    output_valid = False
                    try:
                        await self.exec_as_agent(
                            environment,
                            command=self._build_output_contract_debug_command(
                                status="failed",
                                reason="missing_or_invalid_required_output_after_agent",
                                required_output_paths=required_output_paths,
                                expects_plan_artifact=expects_plan_artifact,
                                output_contract_mode=output_contract_mode,
                            ),
                        )
                    except Exception:
                        pass

            try:
                await self.exec_as_agent(
                    environment,
                    command=self._build_export_runtime_artifacts_command(),
                )
            except Exception:
                pass

            try:
                self.populate_context_post_run(context)
            except Exception:
                pass

        if agent_error is not None:
            if contract_enabled:
                try:
                    await self.exec_as_agent(
                        environment,
                        command=self._build_required_output_check_command(
                            required_output_paths=required_output_paths,
                            expects_plan_artifact=expects_plan_artifact,
                        ),
                    )
                except Exception:
                    raise agent_error
            else:
                raise agent_error
        else:
            if contract_enabled:
                try:
                    await self.exec_as_agent(
                        environment,
                        command=self._build_required_output_check_command(
                            required_output_paths=required_output_paths,
                            expects_plan_artifact=expects_plan_artifact,
                        ),
                    )
                except Exception as exc:
                    self.logger.debug(
                        "OpenClaw output-contract check failed after a zero-error agent run; "
                        "leaving the trial to the verifier so it remains analyzable",
                        extra={"error": str(exc)},
                    )

    def populate_context_post_run(self, context: AgentContext) -> None:
        output_path = self.logs_dir / self._OUTPUT_FILENAME
        if not output_path.exists():
            return

        self._write_runtime_debug_artifacts()

        raw_text = output_path.read_text(encoding="utf-8", errors="replace")
        payloads = self._iter_json_values(raw_text)
        payload = payloads[-1] if payloads else None

        if not payload:
            return

        message = ""
        for key in ("message", "output", "text", "reply"):
            value = payload.get(key)
            if isinstance(value, str) and value.strip():
                message = value.strip()
                break

        native_usage = self._read_native_session_usage()
        input_tokens = int(native_usage.get("input_tokens") or 0)
        output_tokens = int(native_usage.get("output_tokens") or 0)
        cache_read_tokens = int(native_usage.get("cache_read_tokens") or 0)
        cache_write_tokens = int(native_usage.get("cache_write_tokens") or 0)
        prompt_tokens = input_tokens + cache_read_tokens + cache_write_tokens
        metrics = (
            Metrics(
                prompt_tokens=prompt_tokens,
                completion_tokens=output_tokens,
                cached_tokens=cache_read_tokens,
                extra=native_usage,
            )
            if native_usage
            else None
        )
        final_metrics = FinalMetrics(
            total_steps=1,
            total_prompt_tokens=prompt_tokens if native_usage else None,
            total_completion_tokens=output_tokens if native_usage else None,
            total_cached_tokens=cache_read_tokens if native_usage else None,
            extra=native_usage or None,
        )

        trajectory = Trajectory(
            schema_version="ATIF-v1.0",
            session_id=str(payload.get("session_id") or payload.get("sessionId") or "openclaw-session"),
            agent=Agent(
                name="openclaw",
                version=self.version() or "unknown",
                model_name=self.model_name,
                extra={"raw_output_file": self._OUTPUT_FILENAME},
            ),
            steps=[
                Step(
                    step_id=1,
                    timestamp=None,
                    source="agent",
                    message=message or json.dumps(payload, ensure_ascii=False),
                    model_name=self.model_name,
                    metrics=metrics,
                    extra={"raw_payload": payload},
                )
            ],
            final_metrics=final_metrics,
        )

        (self.logs_dir / "trajectory.json").write_text(
            json.dumps(trajectory.to_json_dict(), indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )

        if native_usage:
            context.n_input_tokens = prompt_tokens
            context.n_cache_tokens = cache_read_tokens
            context.n_output_tokens = output_tokens
            metadata = dict(context.metadata or {})
            metadata["native_usage"] = native_usage
            context.metadata = metadata
