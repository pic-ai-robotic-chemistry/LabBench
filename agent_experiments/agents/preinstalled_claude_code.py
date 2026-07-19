from __future__ import annotations

import json
import os
import shlex
from pathlib import PurePosixPath

from harbor.agents.installed.base import NonZeroAgentExitCodeError
from harbor.agents.installed.claude_code import ClaudeCode

from agents.experiment_plan_export import build_export_command_nonfatal
from agents.runtime_config_support import (
    append_log_line,
    build_aichem_token_config_patch_command,
    copy_dir_if_exists,
    copy_file_if_exists,
    mounted_runtime_config_dir,
)
from tools.output_contract import (
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
    return "\n".join(f"- `{path}`" for path in paths)


class PreinstalledClaudeCode(ClaudeCode):
    """Claude Code agent that assumes the CLI is already present in the container."""

    _RUNTIME_PATH = "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
    _PLAN_OUTPUT_PATH = PurePosixPath(PLAN_OUTPUT_PATH)
    _PLAN_ARTIFACT_PATH = PurePosixPath(PLAN_ARTIFACT_PATH)
    _OUTPUT_CONTRACT_FILENAME = "output-contract.json"

    @staticmethod
    def _normalize_anthropic_base_url(base_url: str | None) -> str | None:
        normalized = (base_url or "").strip()
        if not normalized:
            return None
        if normalized.endswith("/api/v1"):
            return normalized.removesuffix("/v1")
        return normalized

    async def install(self, environment) -> None:
        return None

    @staticmethod
    def _runtime_config_dir() -> PurePosixPath:
        return PurePosixPath("/tmp/claude-runtime-config")

    def _build_export_runtime_artifacts_command(self) -> str:
        runtime_dir = self._runtime_config_dir()
        sessions_dir = PurePosixPath("/logs/agent/sessions")

        return " && ".join(
            [
                f"mkdir -p {shlex.quote(str(sessions_dir))}",
                (
                    f"if [ -f {shlex.quote(str(runtime_dir / '.claude.json'))} ]; then "
                    f"cp {shlex.quote(str(runtime_dir / '.claude.json'))} "
                    f"{shlex.quote(str(sessions_dir / '.claude.json'))}; "
                    "fi"
                ),
                (
                    f"if [ -d {shlex.quote(str(runtime_dir / 'projects'))} ]; then "
                    f"mkdir -p {shlex.quote(str(sessions_dir / 'projects'))} && "
                    f"cp -R {shlex.quote(str(runtime_dir / 'projects'))}/. "
                    f"{shlex.quote(str(sessions_dir / 'projects'))}/; "
                    "fi"
                ),
                (
                    f"for name in debug shell-snapshots statsig todos skills; do "
                    f"if [ -d {shlex.quote(str(runtime_dir))}/$name ]; then "
                    f"mkdir -p {shlex.quote(str(sessions_dir))}/$name && "
                    f"cp -R {shlex.quote(str(runtime_dir))}/$name/. "
                    f"{shlex.quote(str(sessions_dir))}/$name/; "
                    "fi; "
                    "done"
                ),
            ]
        )

    def _build_runtime_config_command(self) -> str:
        runtime_source = mounted_runtime_config_dir("claude-code")
        runtime_dir = self._runtime_config_dir()
        config_log = "/logs/agent/setup/runtime-config.log"

        return " && ".join(
            [
                f"mkdir -p {shlex.quote(str(runtime_dir))}",
                copy_file_if_exists(
                    runtime_source / ".claude.json",
                    runtime_dir / ".claude.json",
                ),
                copy_file_if_exists(
                    runtime_source / "settings.json",
                    runtime_dir / "settings.json",
                ),
                copy_dir_if_exists(runtime_source / "skills", runtime_dir / "skills"),
                copy_dir_if_exists(runtime_source / "memory", runtime_dir / "memory"),
                append_log_line(
                    config_log,
                    "runtime config bootstrap finished for claude-code",
                ),
            ]
        )

    def _build_register_mcp_servers_command(self) -> str | None:
        """Write MCP config into the temporary Claude runtime config directory."""
        if not self.mcp_servers:
            return None

        servers: dict[str, dict[str, object]] = {}
        for server in self.mcp_servers:
            if server.transport == "stdio":
                servers[server.name] = {
                    "type": "stdio",
                    "command": server.command,
                    "args": server.args,
                }
            else:
                transport = (
                    "http"
                    if server.transport == "streamable-http"
                    else server.transport
                )
                servers[server.name] = {"type": transport, "url": server.url}

        claude_json = json.dumps({"mcpServers": servers}, indent=2)
        escaped = shlex.quote(claude_json)
        return (
            f"mkdir -p {shlex.quote(str(self._runtime_config_dir()))} && "
            f"echo {escaped} > "
            f"{shlex.quote(str(self._runtime_config_dir() / '.claude.json'))}"
        )

    def _build_runtime_snapshot_command(self) -> str:
        runtime_dir = self._runtime_config_dir()
        return f"""(
python3 - <<'PY'
import json
import os
from pathlib import Path

runtime_dir = Path({json.dumps(str(runtime_dir))})
setup_dir = Path("/logs/agent/setup")
setup_dir.mkdir(parents=True, exist_ok=True)
skills_dir = runtime_dir / "skills"

payload = {{
    "runtime_dir": str(runtime_dir),
    "claude_config_dir": os.environ.get("CLAUDE_CONFIG_DIR"),
    "anthropic_model": os.environ.get("ANTHROPIC_MODEL"),
    "anthropic_base_url": os.environ.get("ANTHROPIC_BASE_URL"),
    "anthropic_api_key_present": bool(os.environ.get("ANTHROPIC_API_KEY")),
    "anthropic_auth_token_present": bool(os.environ.get("ANTHROPIC_AUTH_TOKEN")),
    "formal_key_label": os.environ.get("FORMAL_KEY_LABEL"),
    "formal_key_provider": os.environ.get("FORMAL_KEY_PROVIDER"),
    "runtime_skill_names": sorted(
        path.name for path in skills_dir.iterdir() if path.is_dir()
    ) if skills_dir.exists() else [],
}}

(setup_dir / "runtime-provider.json").write_text(
    json.dumps(payload, indent=2, sort_keys=True),
    encoding="utf-8",
)
(setup_dir / "auth-mode.txt").write_text(
    "anthropic-api-key-env\\n"
    if os.environ.get("ANTHROPIC_API_KEY")
    else ("anthropic-auth-token-env\\n" if os.environ.get("ANTHROPIC_AUTH_TOKEN") else "none\\n"),
    encoding="utf-8",
)
PY
)"""

    def _use_bare_mode(self) -> bool:
        raw = self._get_env("AIREADY_CLAUDE_CODE_BARE_MODE")
        if raw is None:
            raw = self._get_env("CLAUDE_CODE_BARE_MODE")
        if raw is None:
            return False
        return raw.strip().lower() in {"1", "true", "yes", "on"}

    def _tools_flag(self) -> str:
        raw = self._get_env("AIREADY_CLAUDE_CODE_TOOLS")
        if raw is None:
            raw = self._get_env("CLAUDE_CODE_TOOLS")
        tools = (raw or "Bash,Edit,Read,Skill").strip()
        return f"--tools {shlex.quote(tools)} " if tools else ""

    @staticmethod
    def _build_node_env_compat_command() -> str:
        runtime_path = shlex.quote(PreinstalledClaudeCode._RUNTIME_PATH)
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
            "echo 'node runtime unavailable for claude-code harness' >&2; "
            "return 127; "
            "fi; "
            "}; ensure_node_runtime"
        )

    @staticmethod
    def _build_runtime_preflight_command() -> str:
        return (
            f"export PATH={shlex.quote(PreinstalledClaudeCode._RUNTIME_PATH)}:$PATH; "
            "command -v python3 >/dev/null 2>&1 && "
            "command -v node >/dev/null 2>&1 && "
            "/usr/bin/env node --version >/dev/null 2>&1 && "
            "command -v claude >/dev/null 2>&1 && "
            "claude --version >/dev/null 2>&1"
        )

    def _is_bedrock_mode(self) -> bool:
        if (self._get_env("CLAUDE_CODE_USE_BEDROCK") or "").strip() == "1":
            return True
        if (self._get_env("AWS_BEARER_TOKEN_BEDROCK") or "").strip():
            return True
        return False

    @staticmethod
    def _augment_instruction_for_completion(
        instruction: str,
        *,
        output_contract_mode: str | None = None,
    ) -> str:
        required_output_paths = extract_required_output_paths(instruction)
        required_text = _format_required_output_guidance(required_output_paths)
        guidance_lines = [
            "Claude Code non-interactive execution contract:",
            "0. Obey the original task exactly; this contract only clarifies how to complete it in the harness.",
            "1. Before inspecting long skill/reference files, identify the exact deliverable files requested by this task.",
            "2. Do not stop after planning, exploration, or explanation. The task is only complete after the required output files are actually written to disk.",
            "3. If the task specifies an exact output path, write the final artifact exactly there rather than only describing the solution.",
            "4. If `/tests`, `/test.sh`, or verifier files exist, inspect the relevant local test or verifier before finishing so you confirm filenames and output schema.",
        ]
        if plan_output_contract_enabled(instruction, output_contract_mode):
            guidance_lines.extend(
                [
                    "5. This task explicitly uses the JSON-plan contract: write the final plan to `/workspace/experiment_plan.json` and copy it to `/logs/artifacts/final_plan.json`.",
                    "5a. Every workflow step must include `step_number`, workstation `id`, `workstation`, and `operation`; the workstation `id` must be an integer from the selected workstation skill.",
                ]
            )
        guidance_lines.extend(
            [
                "6. Use an actual shell command, Python script, or heredoc to write the files. Do not rely on prose, markdown fences, or a final message as the output artifact.",
                "7. Avoid dumping very large skill/reference files. Prefer `rg`, `find`, targeted excerpts, and short schema reads so the run keeps enough budget to write and verify the artifact.",
                "8. Detected required output path(s):",
                required_text,
                "9. Before finishing, explicitly verify these path(s) with a shell command such as `ls -l`, `python3 -m json.tool`, or another direct file check.",
                "10. Once all required output files exist and pass a focused local check, stop and give a concise final response. Do not keep optimizing, searching, or reading large/binary files after the deliverables are present.",
            ]
        )
        return instruction.rstrip() + "\n\n" + "\n".join(guidance_lines) + "\n"

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
        required_output_paths: list[str],
        expects_plan_artifact: bool,
        output_contract_mode: str | None = None,
    ) -> str:
        payload = {
            "status": status,
            "reason": reason,
            "output_path": str(cls._PLAN_OUTPUT_PATH),
            "artifact_path": str(cls._PLAN_ARTIFACT_PATH),
            "required_output_paths": required_output_paths,
            "expects_plan_artifact": expects_plan_artifact,
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
            f"path = Path('/logs/agent/{cls._OUTPUT_CONTRACT_FILENAME}')\n"
            "path.parent.mkdir(parents=True, exist_ok=True)\n"
            "path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + '\\n', encoding='utf-8')\n"
            "PY"
        )

    @classmethod
    def _build_export_plan_command(cls) -> str:
        return build_export_command_nonfatal(
            agent_kind="claude-code",
            source_log=PurePosixPath("/logs/agent/claude-code.txt"),
            output_path=cls._PLAN_OUTPUT_PATH,
            artifact_path=cls._PLAN_ARTIFACT_PATH,
            summary_path=PurePosixPath("/logs/agent/plan-export.json"),
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
                "The previous Claude Code attempt ended without creating `/workspace/experiment_plan.json`. "
                "This is a repair turn for a non-interactive harness artifact failure, not a change to the task. "
                "Do not read large files and do not continue broad exploration. Immediately write a valid JSON plan using the task context below plus any already-known skill facts.\n\n"
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
            "The previous Claude Code attempt finished without the required task output artifact(s). "
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

    def _build_agent_raw_command(self, *, instruction: str, extra_flags: str) -> str:
        mode_flag = "--bare " if self._use_bare_mode() else self._tools_flag()
        return (
            f"export PATH={shlex.quote(self._RUNTIME_PATH)}:$PATH; "
            f"claude {mode_flag}--verbose --output-format=stream-json "
            f"--permission-mode=bypassPermissions "
            f"{extra_flags}"
            f"--print -- {shlex.quote(instruction)} 2>&1 </dev/null"
        )

    def _build_guarded_agent_command(
        self,
        *,
        raw_command: str,
        required_output_paths: list[str],
        expects_plan_artifact: bool,
        output_contract_mode: str,
    ) -> str:
        return build_valid_output_guard_command(
            raw_command=raw_command,
            output_log=PurePosixPath("/logs/agent/claude-code.txt"),
            contract_path=PurePosixPath(f"/logs/agent/{self._OUTPUT_CONTRACT_FILENAME}"),
            required_output_paths=required_output_paths,
            expects_plan_output=expects_plan_artifact,
            output_contract_mode=output_contract_mode,
            agent_kind="claude-code",
            grace_env_var="CLAUDE_CODE_VALID_OUTPUT_GRACE_SEC",
            poll_env_var="CLAUDE_CODE_VALID_OUTPUT_POLL_SEC",
            plan_output_path=self._PLAN_OUTPUT_PATH,
            plan_artifact_path=self._PLAN_ARTIFACT_PATH,
            max_runtime_sec=self._primary_soft_timeout_sec(),
        )

    def _primary_soft_timeout_sec(self) -> int | None:
        raw = self._get_env("CLAUDE_CODE_PRIMARY_SOFT_TIMEOUT_SEC")
        if raw is None:
            raw = self._get_env("AIREADY_CLAUDE_CODE_PRIMARY_SOFT_TIMEOUT_SEC")
        if raw is None:
            return 1800
        try:
            value = int(float(raw))
        except (TypeError, ValueError):
            return 1800
        return value if value > 0 else None

    async def run(self, instruction: str, environment, context) -> None:
        instruction = self.render_instruction(instruction)
        output_contract_mode = normalize_output_contract_mode(
            self._get_env("OUTPUT_CONTRACT_MODE")
        )
        contract_enabled = output_contract_enabled(output_contract_mode)
        required_output_paths = extract_required_output_paths(instruction)
        expects_plan_artifact = plan_output_contract_enabled(
            instruction,
            output_contract_mode,
        )
        if not agent_prompt_augmentation_disabled(self):
            instruction = self._augment_instruction_for_completion(
                instruction,
                output_contract_mode=output_contract_mode,
            )

        use_bedrock = self._is_bedrock_mode()

        env = {
            "ANTHROPIC_BASE_URL": self._normalize_anthropic_base_url(
                self._get_env("ANTHROPIC_BASE_URL")
            ),
            "ANTHROPIC_API_KEY": (
                self._get_env("ANTHROPIC_API_KEY")
                or self._get_env("ANTHROPIC_AUTH_TOKEN")
            ),
            "ANTHROPIC_AUTH_TOKEN": (
                self._get_env("ANTHROPIC_AUTH_TOKEN")
                or self._get_env("ANTHROPIC_API_KEY")
            ),
            "CLAUDE_CODE_OAUTH_TOKEN": self._get_env("CLAUDE_CODE_OAUTH_TOKEN") or "",
            "CLAUDE_CODE_MAX_OUTPUT_TOKENS": self._get_env(
                "CLAUDE_CODE_MAX_OUTPUT_TOKENS"
            ),
            "FORCE_AUTO_BACKGROUND_TASKS": "1",
            "ENABLE_BACKGROUND_TASKS": "1",
        }
        for key in (
            "AUTH_SERVICE_URL",
            "AICHEM_CLOUD_GATEWAY",
            "AICHEM_APP_TOKEN",
            "WORKFLOW_TOKEN",
            "WORKFLOW_SERVICE_URL",
            "AICHEM_TARGET_APP_LABEL",
            "AICHEM_TIMEOUT_SEC",
        ):
            value = self._get_env(key)
            if value:
                env[key] = value

        if use_bedrock:
            env["CLAUDE_CODE_USE_BEDROCK"] = "1"

            bedrock_token = self._get_env("AWS_BEARER_TOKEN_BEDROCK") or ""
            if bedrock_token:
                env["AWS_BEARER_TOKEN_BEDROCK"] = bedrock_token

            for aws_var in (
                "AWS_ACCESS_KEY_ID",
                "AWS_SECRET_ACCESS_KEY",
                "AWS_SESSION_TOKEN",
                "AWS_PROFILE",
            ):
                val = self._get_env(aws_var) or ""
                if val:
                    env[aws_var] = val

            env["AWS_REGION"] = self._get_env("AWS_REGION") or "us-east-1"

            small_model_region = self._get_env("ANTHROPIC_SMALL_FAST_MODEL_AWS_REGION") or ""
            if small_model_region:
                env["ANTHROPIC_SMALL_FAST_MODEL_AWS_REGION"] = small_model_region

            if (self._get_env("DISABLE_PROMPT_CACHING") or "").strip() == "1":
                env["DISABLE_PROMPT_CACHING"] = "1"

        env = {
            k: v
            for k, v in env.items()
            if v is not None and v != ""
        }

        if self.model_name:
            if use_bedrock:
                if "/" in self.model_name:
                    env["ANTHROPIC_MODEL"] = self.model_name.split("/", 1)[-1]
                else:
                    env["ANTHROPIC_MODEL"] = self.model_name
            elif "ANTHROPIC_BASE_URL" in env:
                env["ANTHROPIC_MODEL"] = self.model_name
            else:
                env["ANTHROPIC_MODEL"] = self.model_name.split("/")[-1]
        elif self._get_env("ANTHROPIC_MODEL"):
            env["ANTHROPIC_MODEL"] = self._get_env("ANTHROPIC_MODEL") or ""

        if "ANTHROPIC_BASE_URL" in env and "ANTHROPIC_MODEL" in env:
            env["ANTHROPIC_DEFAULT_SONNET_MODEL"] = env["ANTHROPIC_MODEL"]
            env["ANTHROPIC_DEFAULT_OPUS_MODEL"] = env["ANTHROPIC_MODEL"]
            env["ANTHROPIC_DEFAULT_HAIKU_MODEL"] = env["ANTHROPIC_MODEL"]
            env["CLAUDE_CODE_SUBAGENT_MODEL"] = env["ANTHROPIC_MODEL"]

        if (self._get_env("CLAUDE_CODE_DISABLE_ADAPTIVE_THINKING") or "").strip() == "1":
            env["CLAUDE_CODE_DISABLE_ADAPTIVE_THINKING"] = "1"

        env["CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC"] = "1"
        env["IS_SANDBOX"] = "1"
        env["PATH"] = self._RUNTIME_PATH
        env["OUTPUT_CONTRACT_MODE"] = output_contract_mode
        env.setdefault("NODE_OPTIONS", "--max-old-space-size=2048")
        env.update(self._resolved_env_vars)

        session_dir = "/logs/agent/sessions"
        runtime_dir = self._runtime_config_dir()
        env["CLAUDE_CONFIG_DIR"] = str(runtime_dir)

        setup_parts = [
            self._build_runtime_config_command(),
            (
                f"mkdir -p {shlex.quote(session_dir)}/debug "
                f"{shlex.quote(session_dir)}/projects/-app "
                f"{shlex.quote(session_dir)}/shell-snapshots "
                f"{shlex.quote(session_dir)}/statsig "
                f"{shlex.quote(session_dir)}/todos "
                f"{shlex.quote(session_dir)}/skills "
                f"{shlex.quote(str(runtime_dir))}/debug "
                f"{shlex.quote(str(runtime_dir))}/projects/-app "
                f"{shlex.quote(str(runtime_dir))}/shell-snapshots "
                f"{shlex.quote(str(runtime_dir))}/statsig "
                f"{shlex.quote(str(runtime_dir))}/todos "
                f"{shlex.quote(str(runtime_dir))}/skills"
            ),
            (
                "if [ -d ~/.claude/skills ]; then "
                f"cp -r ~/.claude/skills/. {shlex.quote(str(runtime_dir))}/skills/ 2>/dev/null || true; "
                "fi"
            ),
            (
                f"if [ -d {shlex.quote(str(runtime_dir / 'memory'))} ]; then "
                f"mkdir -p {shlex.quote(str(runtime_dir / 'projects/-app/memory'))} && "
                f"cp -r {shlex.quote(str(runtime_dir / 'memory'))}/. "
                f"{shlex.quote(str(runtime_dir / 'projects/-app/memory'))}/ 2>/dev/null || true; "
                "fi"
            ),
            self._build_node_env_compat_command(),
        ]

        skills_command = self._build_register_skills_command()
        if skills_command:
            setup_parts.append(skills_command)

        setup_parts.append(build_aichem_token_config_patch_command())

        memory_command = self._build_register_memory_command()
        if memory_command:
            setup_parts.append(memory_command)

        mcp_command = self._build_register_mcp_servers_command()
        if mcp_command:
            setup_parts.append(mcp_command)

        setup_parts.append(self._build_runtime_snapshot_command())
        setup_parts.append(self._build_runtime_preflight_command())

        cli_flags = self.build_cli_flags()
        extra_flags = (cli_flags + " ") if cli_flags else ""

        await self.exec_as_agent(
            environment,
            command=" && ".join(part for part in setup_parts if part),
            env=env,
        )

        agent_error: Exception | None = None
        try:
            raw_command = self._build_agent_raw_command(
                instruction=instruction,
                extra_flags=extra_flags,
            )
            result = await environment.exec(
                command=self._build_guarded_agent_command(
                    raw_command=raw_command,
                    required_output_paths=required_output_paths,
                    expects_plan_artifact=expects_plan_artifact,
                    output_contract_mode=output_contract_mode,
                ),
                env=env,
            )
            if result.return_code != 0:
                agent_error = NonZeroAgentExitCodeError(
                    f"Claude Code exited with code {result.return_code}"
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
                        command=self._build_required_output_check_command(
                            required_output_paths=required_output_paths,
                            expects_plan_artifact=expects_plan_artifact,
                        ),
                    )
                    output_valid = output_check.return_code == 0
                except Exception:
                    output_valid = False

                if not output_valid and not agent_prompt_augmentation_disabled(self):
                    try:
                        await self.exec_as_agent(
                            environment,
                            command=self._build_output_contract_debug_command(
                                status="recovery_started",
                                reason="missing_or_invalid_required_output_after_primary_turn",
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
                            command=self._build_compact_context_command(
                                include_plan_skill_context=expects_plan_artifact
                            ),
                        )
                    except Exception:
                        pass

                    recovery_command = self._build_agent_raw_command(
                        instruction=self._recovery_instruction(
                            instruction,
                            required_output_paths=required_output_paths,
                            expects_plan_artifact=expects_plan_artifact,
                        ),
                        extra_flags=extra_flags,
                    )
                    try:
                        await environment.exec(
                            command=(
                                "set -o pipefail; "
                                f"{recovery_command} | tee -a /logs/agent/claude-code.txt"
                            ),
                            env=env,
                        )
                    except Exception:
                        pass

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
                            command=self._build_required_output_check_command(
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
                                else "missing_or_invalid_required_output_after_agent"
                            ),
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

        try:
            await self.exec_as_agent(
                environment,
                command=f"rm -rf {shlex.quote(str(runtime_dir))}",
            )
        except Exception:
            pass

        if agent_error is not None:
            if contract_enabled:
                try:
                    output_check = await environment.exec(
                        command=self._build_required_output_check_command(
                            required_output_paths=required_output_paths,
                            expects_plan_artifact=expects_plan_artifact,
                        ),
                    )
                    if output_check.return_code == 0:
                        return
                except Exception:
                    pass
            raise agent_error
