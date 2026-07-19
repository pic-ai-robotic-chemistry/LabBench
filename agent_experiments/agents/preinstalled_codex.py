from __future__ import annotations

import json
import os
import shlex
from pathlib import PurePosixPath

from harbor.agents.installed.codex import Codex
from harbor.agents.installed.base import NonZeroAgentExitCodeError
from harbor.models.trial.paths import EnvironmentPaths

from agents.runtime_config_support import (
    append_log_line,
    build_aichem_token_config_patch_command,
    copy_dir_if_exists,
    copy_file_if_exists,
    mounted_runtime_config_dir,
)
from agents.experiment_plan_export import build_export_command_nonfatal
from tools.output_contract import (
    MissingRequiredOutputError,
    PLAN_ARTIFACT_PATH,
    PLAN_OUTPUT_PATH,
    build_output_check_command,
    build_valid_output_guard_command,
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
        return (
            "- the exact output file(s) requested by the original task\n"
            "- If filenames are ambiguous, inspect only `/tests`, `/test.sh`, or the task instruction, then write the best-effort final artifacts."
        )
    lines = [f"- `{path}`" for path in paths]
    return "\n".join(lines)


class PreinstalledCodex(Codex):
    """Codex agent that assumes the CLI is already present in the container."""

    _EXEC_RESULT_FILENAME = "exec-result.json"
    _OUTPUT_CONTRACT_FILENAME = "output-contract.json"
    _DEFAULT_PRIMARY_SOFT_TIMEOUT_SEC = 1800

    def _resolve_provider_runtime(self, model_name: str) -> dict[str, str | None]:
        normalized = (model_name or "").strip()
        if not normalized:
            raise ValueError("Codex model name is required.")
        base_url = self._get_env("OPENAI_BASE_URL")
        if not base_url:
            raise ValueError("OPENAI_BASE_URL is required for the Codex harness.")

        return {
            "provider_id": self._get_env("CODEX_MODEL_PROVIDER_ID") or "openai-compatible",
            "provider_name": self._get_env("CODEX_MODEL_PROVIDER_NAME") or "OpenAI-compatible",
            "model": normalized,
            "env_key": "OPENAI_API_KEY",
            "api_key_env": "OPENAI_API_KEY",
            "base_url": base_url,
            "wire_api": "responses",
            "web_search_mode": "disabled",
            "extra_config": {},
        }

    async def install(self, environment) -> None:
        return None

    @staticmethod
    def _runtime_home() -> PurePosixPath:
        return PurePosixPath("/tmp/codex-runtime-home")

    @classmethod
    def _runtime_config_path(cls) -> PurePosixPath:
        return cls._runtime_home() / "config.toml"

    @classmethod
    def _runtime_auth_path(cls) -> PurePosixPath:
        return cls._runtime_home() / "auth.json"

    @staticmethod
    def _looks_like_placeholder_auth(path: PurePosixPath) -> str:
        path_q = shlex.quote(str(path))
        return (
            f"if [ -f {path_q} ] && grep -q 'replace-me' {path_q}; then "
            f"rm -f {path_q}; "
            "fi"
        )

    @staticmethod
    def _append_mcp_command_to_config(config_path: PurePosixPath) -> str:
        config_q = shlex.quote(str(config_path))
        return (
            f"if [ -f {config_q} ]; then "
            f"printf '\\n' >> {config_q}; "
            "fi"
        )

    @staticmethod
    def _should_pass_extra_env(key: str) -> bool:
        prefixes = (
            "AICHEM_",
            "AIREADY_",
            "CODEX_",
            "FORMAL_",
            "OPENAI_",
            "WORKFLOW_",
        )
        return key in {
            "ALL_PROXY",
            "AUTH_SERVICE_URL",
            "HTTP_PROXY",
            "HTTPS_PROXY",
            "NO_PROXY",
            "OUTPUT_CONTRACT_MODE",
        } or key.startswith(prefixes)

    def _apply_extra_env(self, env: dict[str, str]) -> None:
        for key, value in self._extra_env.items():
            if value and self._should_pass_extra_env(key) and not env.get(key):
                env[key] = value

    @classmethod
    def _extract_required_output_paths(cls, instruction: str) -> list[str]:
        return extract_required_output_paths(instruction)

    @classmethod
    def _augment_instruction_for_completion(
        cls,
        instruction: str,
        *,
        output_contract_mode: str | None = None,
    ) -> str:
        required_output_paths = cls._extract_required_output_paths(instruction)
        include_plan_guidance = plan_output_contract_enabled(
            instruction,
            output_contract_mode,
        )
        guidance_lines = [
            "Execution contract for this Codex harness run:",
            "0. Before inspecting long skill/reference files, identify the exact deliverable files requested by this task.",
            "1. Do not stop after planning, exploration, or explanation. The task is only complete after the required output files are actually written to disk.",
            "2. If the task specifies an exact output path, write the final artifact exactly there rather than only describing the solution.",
            "3. If `/tests`, `/test.sh`, or verifier files exist, inspect the relevant local test or verifier before finishing so you confirm filenames, function signatures, and output schema.",
            "4. Before you finish, run a focused local sanity check and verify that every required output file exists and is non-empty.",
            "5. Your final response inside the agent should summarize what you wrote and what you verified, not replace the required file creation.",
        ]
        if include_plan_guidance:
            guidance_lines.extend(
                [
                    "6. This task explicitly uses the JSON-plan contract: write the final plan to `/workspace/experiment_plan.json` and copy it to `/logs/artifacts/final_plan.json`.",
                    "6a. Every workflow step must include `step_number`, workstation `id`, `workstation`, and `operation`; the workstation `id` must be an integer from the selected workstation skill.",
                ]
            )
        guidance_lines.extend(
            [
                "7. Use an actual shell command, Python script, or heredoc to write the files. Do not rely on prose, markdown fences, or a final message as the output artifact.",
                "8. Avoid dumping very large skill/reference files with unrestricted `cat`. Prefer `rg`, `find`, targeted `sed -n`, or short excerpts so the run keeps enough budget to write the required artifact.",
                "9. Once all required output files exist and pass a focused local check, stop and give a concise final response. Do not keep optimizing, searching, or reading large/binary files after the deliverables are present.",
            ]
        )
        if required_output_paths:
            guidance_lines.append(
                "Detected required output path(s): "
                + ", ".join(f"`{path}`" for path in required_output_paths)
                + "."
            )
            guidance_lines.append(
                "Before finishing, explicitly verify these path(s) with a shell command such as `ls -l`, `head`, or another direct file check."
            )
        return instruction.rstrip() + "\n\n" + "\n".join(guidance_lines) + "\n"

    def _build_register_mcp_servers_command(self) -> str | None:
        """Append MCP config instead of overwriting the mounted config.toml."""
        if not self.mcp_servers:
            return None
        lines: list[str] = []
        for server in self.mcp_servers:
            lines.append(f"[mcp_servers.{server.name}]")
            if server.transport == "stdio":
                cmd_parts = [server.command] + server.args if server.command else []
                lines.append(f'command = "{shlex.join(cmd_parts)}"')
            else:
                lines.append(f'url = "{server.url}"')
            lines.append("")

        escaped_config = shlex.quote("\n".join(lines))
        return (
            f"mkdir -p {shlex.quote(str(self._runtime_home()))} && "
            f"printf '%s\\n' {escaped_config} >> "
            f"{shlex.quote(str(self._runtime_config_path()))}"
        )

    @classmethod
    def _build_export_runtime_artifacts_command(cls) -> str:
        runtime_home = cls._runtime_home()
        agent_dir = EnvironmentPaths.agent_dir
        runtime_home_q = shlex.quote(str(runtime_home))
        agent_dir_q = shlex.quote(str(agent_dir))
        sessions_target_q = shlex.quote(str(agent_dir / "sessions"))
        return " && ".join(
            [
                f"mkdir -p {agent_dir_q} {sessions_target_q}",
                (
                    f"if [ -d {runtime_home_q}/sessions ]; then "
                    f"cp -R {runtime_home_q}/sessions/. {sessions_target_q}/; "
                    "fi"
                ),
                (
                    f"for pattern in installation_id '*.sqlite' '*.sqlite-shm' '*.sqlite-wal' config.toml; do "
                    f"find {runtime_home_q} -maxdepth 1 -type f -name \"$pattern\" "
                    f"-exec cp {{}} {agent_dir_q}/ \\; 2>/dev/null || true; "
                    "done"
                ),
            ]
        )

    @classmethod
    def _build_runtime_config_command(cls) -> str:
        runtime_source = mounted_runtime_config_dir("codex")
        runtime_home = cls._runtime_home()
        runtime_tmp = runtime_home / "tmp"
        runtime_config = cls._runtime_config_path()
        runtime_auth = cls._runtime_auth_path()
        config_log = EnvironmentPaths.agent_dir / "setup" / "runtime-config.log"

        return " && ".join(
            [
                f"mkdir -p {shlex.quote(str(runtime_home))} {shlex.quote(str(runtime_tmp))}",
                copy_file_if_exists(runtime_source / "config.toml", runtime_config),
                copy_file_if_exists(runtime_source / "auth.json", runtime_auth),
                cls._looks_like_placeholder_auth(runtime_auth),
                copy_dir_if_exists(runtime_source / "skills", runtime_home / "skills"),
                append_log_line(
                    config_log,
                    "runtime config bootstrap finished for codex",
                ),
            ]
        )

    def _build_snapshot_runtime_state_command(self) -> str:
        runtime_home = self._runtime_home()
        runtime_config = self._runtime_config_path()
        runtime_auth = self._runtime_auth_path()
        agent_dir = EnvironmentPaths.agent_dir
        setup_dir = agent_dir / "setup"
        config_copy = agent_dir / "config.toml"
        auth_mode_file = setup_dir / "auth-mode.txt"
        cli_version_file = setup_dir / "cli-version.txt"
        runtime_state_file = setup_dir / "runtime-provider.json"
        config_log = setup_dir / "runtime-config.log"

        payload = {
            "requested_model_name": self.model_name,
            "harbor_model_provider": self._parsed_model_provider,
            "harbor_model_name": self._parsed_model_name,
            "runtime_home": str(runtime_home),
            "runtime_config_path": str(runtime_config),
            "runtime_auth_path": str(runtime_auth),
        }

        python_script = f"""python3 - <<'PY'
import json
import os
from pathlib import Path

config_path = Path({json.dumps(str(runtime_config))})
auth_path = Path({json.dumps(str(runtime_auth))})
runtime_state_path = Path({json.dumps(str(runtime_state_file))})
payload = json.loads({json.dumps(json.dumps(payload, ensure_ascii=True))})

def parse_minimal_codex_config(path: Path) -> dict:
    payload = {{
        "model_provider": None,
        "model": None,
        "providers": {{}},
    }}
    current_section: tuple[str, ...] = ()
    for raw_line in path.read_text(encoding="utf-8", errors="replace").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if "#" in line:
            line = line.split("#", 1)[0].rstrip()
        if not line:
            continue
        if line.startswith("[") and line.endswith("]"):
            section = line[1:-1].strip()
            current_section = tuple(part.strip() for part in section.split(".") if part.strip())
            continue
        if "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip()
        if value.startswith('"') and value.endswith('"'):
            value = value[1:-1]
        if not current_section:
            if key in {{"model_provider", "model"}}:
                payload[key] = value
            continue
        if len(current_section) == 2 and current_section[0] == "model_providers":
            provider_id = current_section[1]
            payload["providers"].setdefault(provider_id, {{}})[key] = value
    return payload

config_model_provider = None
config_model = None
config_provider = {{}}

if config_path.exists():
    config = parse_minimal_codex_config(config_path)
    config_model_provider = config.get("model_provider")
    config_model = config.get("model")
    providers = config.get("providers") or {{}}
    selected = providers.get(config_model_provider) if isinstance(providers, dict) else None
    if isinstance(selected, dict):
        config_provider = {{
            "name": selected.get("name"),
            "base_url": selected.get("base_url"),
            "env_key": selected.get("env_key"),
            "wire_api": selected.get("wire_api"),
        }}

payload.update(
    {{
        "config_exists": config_path.exists(),
        "auth_json_exists": auth_path.exists(),
        "openai_api_key_present": bool(os.environ.get("OPENAI_API_KEY")),
        "openai_base_url": os.environ.get("OPENAI_BASE_URL"),
        "formal_key_label": os.environ.get("FORMAL_KEY_LABEL"),
        "formal_key_provider": os.environ.get("FORMAL_KEY_PROVIDER"),
        "codex_home": os.environ.get("CODEX_HOME"),
        "tmpdir": os.environ.get("TMPDIR"),
        "config_model_provider": config_model_provider,
        "config_model": config_model,
        "config_provider": config_provider,
    }}
)

runtime_state_path.parent.mkdir(parents=True, exist_ok=True)
runtime_state_path.write_text(
    json.dumps(payload, indent=2, sort_keys=True),
    encoding="utf-8",
)
PY"""

        return "\n".join(
            [
                "set -euo pipefail",
                f"mkdir -p {shlex.quote(str(agent_dir))} {shlex.quote(str(setup_dir))}",
                (
                    f"if [ -f {shlex.quote(str(runtime_config))} ]; then "
                    f"cp {shlex.quote(str(runtime_config))} {shlex.quote(str(config_copy))}; "
                    "fi"
                ),
                (
                    "if command -v codex >/dev/null 2>&1; then "
                    f"codex --version > {shlex.quote(str(cli_version_file))} 2>/dev/null || true; "
                    "fi"
                ),
                (
                    f"if [ -f {shlex.quote(str(runtime_auth))} ]; then "
                    f"printf '%s\\n' 'auth-json' > {shlex.quote(str(auth_mode_file))}; "
                    "elif [ -n \"${OPENAI_API_KEY:-}\" ]; then "
                    f"printf '%s\\n' 'openai-api-key-env' > {shlex.quote(str(auth_mode_file))}; "
                    "else "
                    f"printf '%s\\n' 'none' > {shlex.quote(str(auth_mode_file))}; "
                    "fi"
                ),
                python_script,
                append_log_line(
                    config_log,
                    "runtime config snapshot exported for codex",
                ),
            ]
        )

    def _build_selected_provider_config_command(self) -> str:
        runtime_config = self._runtime_config_path()
        provider_runtime = self._resolve_provider_runtime(self.model_name or "")
        provider_id = provider_runtime["provider_id"]
        provider_name = provider_runtime["provider_name"]
        model = provider_runtime["model"]
        base_url = provider_runtime["base_url"]
        env_key = provider_runtime["env_key"]
        wire_api = provider_runtime["wire_api"]
        web_search_mode = provider_runtime.get("web_search_mode")
        extra_config = provider_runtime.get("extra_config")

        config_text = "\n".join(
            [line for line in [
                f'model_provider = "{provider_id}"',
                f'model = "{model}"',
                f'web_search = "{web_search_mode}"' if web_search_mode else None,
                *[
                    (
                        f'{key} = "{value}"'
                        if isinstance(value, str)
                        else f'{key} = {str(value).lower() if isinstance(value, bool) else value}'
                    )
                    for key, value in (
                        extra_config.items()
                        if isinstance(extra_config, dict)
                        else []
                    )
                ],
                "",
                f"[model_providers.{provider_id}]",
                f'name = "{provider_name}"',
                f'base_url = "{base_url}"',
                f'env_key = "{env_key}"',
                f'wire_api = "{wire_api}"',
                "",
            ] if line is not None]
        )
        return (
            f"mkdir -p {shlex.quote(str(runtime_config.parent))} && "
            f"printf '%s\\n' {shlex.quote(config_text)} > {shlex.quote(str(runtime_config))}"
        )

    def _build_export_plan_command(self) -> str:
        return build_export_command_nonfatal(
            agent_kind="codex",
            source_log=EnvironmentPaths.agent_dir / self._OUTPUT_FILENAME,
            output_path=PurePosixPath(PLAN_OUTPUT_PATH),
            artifact_path=PurePosixPath(PLAN_ARTIFACT_PATH),
            summary_path=EnvironmentPaths.agent_dir / "plan-export.json",
        )

    @staticmethod
    def _build_output_check_command(
        *,
        required_output_paths: list[str],
        expects_plan_artifact: bool,
    ) -> str:
        return build_output_check_command(
            required_output_paths=required_output_paths,
            expects_plan_output=expects_plan_artifact,
            plan_output_path=PurePosixPath(PLAN_OUTPUT_PATH),
            plan_artifact_path=PurePosixPath(PLAN_ARTIFACT_PATH),
        )

    def _build_output_contract_debug_command(
        self,
        *,
        status: str,
        reason: str,
        required_output_paths: list[str] | None = None,
        expects_plan_artifact: bool | None = None,
    ) -> str:
        payload = {
            "status": status,
            "reason": reason,
            "output_path": PLAN_OUTPUT_PATH,
            "artifact_path": PLAN_ARTIFACT_PATH,
            "required_output_paths": required_output_paths or [],
            "expects_plan_artifact": bool(expects_plan_artifact),
            "output_contract_mode": normalize_output_contract_mode(
                self._get_env("OUTPUT_CONTRACT_MODE")
            ),
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
            f"path = Path({json.dumps(str(EnvironmentPaths.agent_dir / self._OUTPUT_CONTRACT_FILENAME))})\n"
            "path.parent.mkdir(parents=True, exist_ok=True)\n"
            "path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + '\\n', encoding='utf-8')\n"
            "PY"
        )

    @staticmethod
    def _build_compact_context_command(*, include_plan_skill_context: bool = False) -> str:
        return (
            "python3 - <<'PY'\n"
            "from pathlib import Path\n"
            f"include_plan_skill_context = {repr(bool(include_plan_skill_context))}\n"
            "out = Path('/logs/agent/compact-task-context.txt')\n"
            "parts = []\n"
            "for candidate in [Path('/root/instruction.md'), Path('/workspace/instruction.md'), Path('/task/instruction.md')]:\n"
            "    if candidate.exists():\n"
            "        text = candidate.read_text(encoding='utf-8', errors='replace')\n"
            "        parts.append('## instruction from ' + str(candidate) + '\\n' + text[:12000])\n"
            "for candidate in [Path('/logs/artifacts/reference_prompt.json'), Path('/root/metadata.json'), Path('/workspace/metadata.json')]:\n"
            "    if candidate.exists():\n"
            "        text = candidate.read_text(encoding='utf-8', errors='replace')\n"
            "        parts.append('## context from ' + str(candidate) + '\\n' + text[:8000])\n"
            "skill_root = Path('/opt/skill-layer/skills/chemistry-experiment-workstation')\n"
            "if include_plan_skill_context and skill_root.exists():\n"
            "    for rel in [\n"
            "        'SKILL.md',\n"
            "        'references/schemas/experiment-plan-json.md',\n"
            "        'references/workflow.md',\n"
            "    ]:\n"
            "        p = skill_root / rel\n"
            "        if p.exists():\n"
            "            text = p.read_text(encoding='utf-8', errors='replace')\n"
            "            parts.append('## skill excerpt ' + rel + '\\n' + text[:6000])\n"
            "out.parent.mkdir(parents=True, exist_ok=True)\n"
            "out.write_text('\\n\\n'.join(parts), encoding='utf-8')\n"
            "PY"
        )

    def _recovery_instruction(
        self,
        original_instruction: str,
        *,
        required_output_paths: list[str],
        expects_plan_artifact: bool,
    ) -> str:
        compact = original_instruction[:10000]
        if expects_plan_artifact:
            return (
                "The previous attempt ended without creating `/workspace/experiment_plan.json`. "
                "This is a repair turn. Do not read large files and do not continue broad exploration. "
                "Use the task context below plus any already-known skill facts to immediately write a valid JSON plan.\n\n"
                "Hard requirements:\n"
                "- Write `/workspace/experiment_plan.json` as valid JSON.\n"
                "- The top-level JSON object must contain a non-empty `steps` list.\n"
                "- Every step must include `step_number`, workstation `id`, `workstation`, and `operation`.\n"
                "- Copy the same JSON to `/logs/artifacts/final_plan.json`.\n"
                "- Run a direct file check before finishing.\n"
                "- If some workstation details are uncertain, still produce the best valid executable draft instead of leaving the file missing.\n\n"
                "Original task context, truncated if necessary:\n"
                f"{compact}\n\n"
                "A compact local context file may exist at `/logs/agent/compact-task-context.txt`; read only that file if you need a reminder."
            )

        required_text = _format_required_output_guidance(required_output_paths)
        return (
            "The previous attempt finished without the required task output artifact(s). "
            "This is a repair turn. Do not read large files and do not continue broad exploration. "
            "Use the task context below plus any already-known facts to immediately create only the missing final output file(s).\n\n"
            "Hard requirements:\n"
            f"{required_text}\n"
            "- Write each final artifact exactly at the requested path, not only in a message.\n"
            "- Before doing more reasoning, run `ls -l` on the required paths and identify exactly which ones are missing or empty.\n"
            "- If most files already exist, preserve them and create only the missing/empty file(s) unless a focused local test proves a specific file is invalid.\n"
            "- If the best full solution is uncertain, still write a schema-valid best-effort artifact so the verifier can score it.\n"
            "- Run a direct file existence and non-empty check before finishing.\n"
            "- Stop immediately after all required artifacts exist and the focused check completes; do not continue optimizing or exploring.\n\n"
            "Original task context, truncated if necessary:\n"
            f"{compact}\n\n"
            "A compact local context file may exist at `/logs/agent/compact-task-context.txt`; read only that file if you need a reminder."
        )

    def _build_agent_command(
        self,
        *,
        model: str,
        instruction: str,
        cli_flags_arg: str,
        output_filename: str | None,
        append: bool = False,
    ) -> str:
        tee_mode = "-a " if append else ""
        command = (
            "if [ -s ~/.nvm/nvm.sh ]; then . ~/.nvm/nvm.sh; fi; "
            "codex exec "
            "--dangerously-bypass-approvals-and-sandbox "
            "--skip-git-repo-check "
            f"--model {shlex.quote(model)} "
            "--json "
            "--enable unified_exec "
            f"{cli_flags_arg}"
            "-- "
            f"{shlex.quote(instruction)} "
            "2>&1 </dev/null"
        )
        if not output_filename:
            return command
        return (
            command
            + f" | tee {tee_mode}{EnvironmentPaths.agent_dir / output_filename}"
        )

    def _build_guarded_agent_command(
        self,
        *,
        raw_command: str,
        required_output_paths: list[str],
        expects_plan_artifact: bool,
    ) -> str:
        return build_valid_output_guard_command(
            raw_command=raw_command,
            output_log=EnvironmentPaths.agent_dir / self._OUTPUT_FILENAME,
            contract_path=EnvironmentPaths.agent_dir / self._OUTPUT_CONTRACT_FILENAME,
            required_output_paths=required_output_paths,
            expects_plan_output=expects_plan_artifact,
            output_contract_mode=self._get_env("OUTPUT_CONTRACT_MODE"),
            agent_kind="codex",
            grace_env_var="CODEX_VALID_OUTPUT_GRACE_SEC",
            poll_env_var="CODEX_VALID_OUTPUT_POLL_SEC",
            plan_output_path=PurePosixPath(PLAN_OUTPUT_PATH),
            plan_artifact_path=PurePosixPath(PLAN_ARTIFACT_PATH),
            max_runtime_sec=self._primary_soft_timeout_sec(),
        )

    def _primary_soft_timeout_sec(self) -> int | None:
        raw = self._get_env("CODEX_PRIMARY_SOFT_TIMEOUT_SEC")
        if raw is None:
            raw = self._get_env("AIREADY_CODEX_PRIMARY_SOFT_TIMEOUT_SEC")
        if raw is None:
            raw = str(self._DEFAULT_PRIMARY_SOFT_TIMEOUT_SEC)
        try:
            value = int(float(raw))
        except (TypeError, ValueError):
            return self._DEFAULT_PRIMARY_SOFT_TIMEOUT_SEC
        return value if value > 0 else None

    @staticmethod
    def _build_runtime_preflight_command() -> str:
        return (
            "command -v python3 >/dev/null 2>&1 && "
            "command -v node >/dev/null 2>&1 && "
            "command -v codex >/dev/null 2>&1 && "
            "codex --version >/dev/null 2>&1"
        )

    def _write_exec_result_debug(
        self,
        *,
        return_code: int,
        stdout: str | None,
        stderr: str | None,
    ) -> None:
        payload = {
            "status": "nonzero_exit_suppressed",
            "return_code": return_code,
            "stdout": self._truncate_output(stdout, max_len=4000),
            "stderr": self._truncate_output(stderr, max_len=4000),
            "output_log": self._OUTPUT_FILENAME,
        }
        (self.logs_dir / self._EXEC_RESULT_FILENAME).write_text(
            json.dumps(payload, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )

    async def _run_primary_guarded_command(
        self,
        environment,
        *,
        guarded_agent_command: str,
        env: dict[str, str],
    ):
        return await environment.exec(command=guarded_agent_command, env=env)

    async def run(self, instruction: str, environment, context) -> None:
        instruction = self.render_instruction(instruction)
        output_contract_mode = normalize_output_contract_mode(
            self._get_env("OUTPUT_CONTRACT_MODE")
        )
        contract_enabled = output_contract_enabled(output_contract_mode)
        required_output_paths = self._extract_required_output_paths(instruction)
        expects_plan_artifact = plan_output_contract_enabled(
            instruction,
            output_contract_mode,
        )
        if not agent_prompt_augmentation_disabled(self):
            instruction = self._augment_instruction_for_completion(
                instruction,
                output_contract_mode=output_contract_mode,
            )
        escaped_instruction = shlex.quote(instruction)

        if not self.model_name:
            raise ValueError("Model name is required")

        cli_flags = self.build_cli_flags()
        cli_flags_arg = (cli_flags + " ") if cli_flags else ""

        runtime_home = self._runtime_home()
        runtime_tmp = runtime_home / "tmp"
        runtime_config = self._runtime_config_path()
        runtime_auth = self._runtime_auth_path()

        env: dict[str, str] = {
            "CODEX_HOME": str(runtime_home),
            "TMPDIR": str(runtime_tmp),
            "PATH": "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin",
        }

        if formal_key_label := self._get_env("FORMAL_KEY_LABEL"):
            env["FORMAL_KEY_LABEL"] = formal_key_label
        if formal_key_provider := self._get_env("FORMAL_KEY_PROVIDER"):
            env["FORMAL_KEY_PROVIDER"] = formal_key_provider
        env["OUTPUT_CONTRACT_MODE"] = output_contract_mode

        provider_runtime = self._resolve_provider_runtime(self.model_name)
        api_key_env = provider_runtime["api_key_env"]
        selected_api_key = self._get_env(api_key_env)

        if selected_api_key:
            env["OPENAI_API_KEY"] = selected_api_key
            if api_key_env != "OPENAI_API_KEY":
                env[api_key_env] = selected_api_key

        openai_base_url = provider_runtime["base_url"] or self._get_env("OPENAI_BASE_URL")
        if openai_base_url:
            env["OPENAI_BASE_URL"] = openai_base_url

        rust_log = self._get_env("CODEX_RUST_LOG") or self._get_env("RUST_LOG")
        if rust_log:
            env["RUST_LOG"] = rust_log
        self._apply_extra_env(env)

        setup_parts = [self._build_runtime_config_command(), self._build_selected_provider_config_command()]

        if self.mcp_servers:
            setup_parts.append(self._append_mcp_command_to_config(runtime_config))
            setup_parts.append(self._build_register_mcp_servers_command() or "true")

        skills_command = self._build_register_skills_command()
        if skills_command:
            setup_parts.append(skills_command)

        setup_parts.append(build_aichem_token_config_patch_command())

        setup_parts.append(self._build_snapshot_runtime_state_command())
        setup_parts.append(self._build_runtime_preflight_command())

        await self.exec_as_agent(
            environment,
            command="\n".join(part for part in setup_parts if part),
            env=env,
        )

        model = self.model_name

        agent_command = self._build_agent_command(
            model=model,
            instruction=instruction,
            cli_flags_arg=cli_flags_arg,
            output_filename=None,
        )
        guarded_agent_command = self._build_guarded_agent_command(
            raw_command=agent_command,
            required_output_paths=required_output_paths,
            expects_plan_artifact=expects_plan_artifact,
        )

        merged_env = dict(env)
        if self._extra_env:
            merged_env.update(self._extra_env)

        agent_result = None
        try:
            self.logger.debug(
                f"Running command: {agent_command}",
                extra={
                    "user": "None",
                    "env": merged_env,
                },
            )
            agent_result = await self._run_primary_guarded_command(
                environment,
                guarded_agent_command=guarded_agent_command,
                env=merged_env,
            )
            if agent_result is not None and agent_result.return_code != 0:
                self.logger.debug(
                    "Command failed",
                    extra={
                        "return_code": agent_result.return_code,
                        "stdout": self._truncate_output(agent_result.stdout),
                        "stderr": self._truncate_output(agent_result.stderr),
                    },
                )
                self._write_exec_result_debug(
                    return_code=agent_result.return_code,
                    stdout=agent_result.stdout,
                    stderr=agent_result.stderr,
                )
            else:
                self.logger.debug(
                    "Command outputs captured",
                    extra={
                        "stdout": self._truncate_output(agent_result.stdout),
                        "stderr": self._truncate_output(agent_result.stderr),
                    },
                )
        finally:
            try:
                if expects_plan_artifact:
                    await self.exec_as_agent(
                        environment,
                        command=self._build_export_plan_command(),
                    )
            except Exception:
                pass

            output_valid = False
            if contract_enabled:
                try:
                    output_check = await environment.exec(
                        command=self._build_output_check_command(
                            required_output_paths=required_output_paths,
                            expects_plan_artifact=expects_plan_artifact,
                        ),
                    )
                    output_valid = output_check.return_code == 0
                except Exception:
                    output_valid = False

            if (
                contract_enabled
                and not output_valid
                and not agent_prompt_augmentation_disabled(self)
            ):
                try:
                    await self.exec_as_agent(
                        environment,
                        command=self._build_output_contract_debug_command(
                            status="recovery_started",
                            reason="missing_or_invalid_required_output_after_primary_turn",
                            required_output_paths=required_output_paths,
                            expects_plan_artifact=expects_plan_artifact,
                        ),
                    )
                except Exception:
                    pass

                try:
                    await self.exec_as_agent(
                        environment,
                        command=self._build_compact_context_command(
                            include_plan_skill_context=expects_plan_artifact
                        ),
                    )
                except Exception:
                    pass

                recovery_command = self._build_agent_command(
                    model=model,
                    instruction=self._recovery_instruction(
                        instruction,
                        required_output_paths=required_output_paths,
                        expects_plan_artifact=expects_plan_artifact,
                    ),
                    cli_flags_arg=cli_flags_arg,
                    output_filename=self._OUTPUT_FILENAME,
                    append=True,
                )
                try:
                    recovery_result = await environment.exec(
                        command=f"set -o pipefail; {recovery_command}",
                        env=merged_env,
                    )
                    if recovery_result.return_code != 0:
                        self.logger.debug(
                            "Recovery command failed",
                            extra={
                                "return_code": recovery_result.return_code,
                                "stdout": self._truncate_output(recovery_result.stdout),
                                "stderr": self._truncate_output(recovery_result.stderr),
                            },
                        )
                except Exception as exc:
                    self.logger.debug(f"Recovery command raised: {exc}")

                try:
                    if expects_plan_artifact:
                        await self.exec_as_agent(
                            environment,
                            command=self._build_export_plan_command(),
                        )
                except Exception:
                    pass

                try:
                    output_check = await environment.exec(
                        command=self._build_output_check_command(
                            required_output_paths=required_output_paths,
                            expects_plan_artifact=expects_plan_artifact,
                        ),
                    )
                    output_valid = output_check.return_code == 0
                except Exception:
                    output_valid = False

                try:
                    await self.exec_as_agent(
                        environment,
                        command=self._build_output_contract_debug_command(
                            status="ok" if output_valid else "failed",
                            reason=(
                                "valid_required_output_available"
                                if output_valid
                                else "missing_or_invalid_required_output_after_recovery"
                            ),
                            required_output_paths=required_output_paths,
                            expects_plan_artifact=expects_plan_artifact,
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
                await self.exec_as_agent(
                    environment,
                    command=(
                        f"rm -rf {shlex.quote(str(runtime_home))} "
                        f"{shlex.quote(str(runtime_auth))}"
                    ),
                )
            except Exception:
                pass

            try:
                self.populate_context_post_run(context)
            except Exception:
                pass

        if agent_result is not None and agent_result.return_code != 0:
            if contract_enabled:
                try:
                    output_check = await environment.exec(
                        command=self._build_output_check_command(
                            required_output_paths=required_output_paths,
                            expects_plan_artifact=expects_plan_artifact,
                        ),
                    )
                    if output_check.return_code == 0:
                        return
                except Exception:
                    pass
            raise NonZeroAgentExitCodeError(
                f"Codex exited with code {agent_result.return_code} and did not "
                "produce the required output artifact(s)"
            )
        if agent_result is not None and contract_enabled:
            try:
                output_check = await environment.exec(
                    command=self._build_output_check_command(
                        required_output_paths=required_output_paths,
                        expects_plan_artifact=expects_plan_artifact,
                    ),
                )
            except Exception as exc:
                self.logger.debug(
                    "Codex output-contract check failed after a zero-exit agent run; "
                    "leaving the trial to the verifier so it remains analyzable",
                    extra={"error": str(exc)},
                )
                return
            if output_check.return_code != 0:
                self.logger.debug(
                    "Codex completed without required output artifact(s); "
                    "leaving the trial to the verifier so it remains analyzable"
                )
