from __future__ import annotations

import json
import re
import shlex
from pathlib import PurePosixPath
from typing import Any

from harbor.agents.installed.base import BaseInstalledAgent, NonZeroAgentExitCodeError
from harbor.environments.base import BaseEnvironment
from harbor.models.agent.context import AgentContext
from harbor.models.trajectories import Agent, FinalMetrics, Metrics, Step, Trajectory
from harbor.models.trial.paths import EnvironmentPaths

from agents.experiment_plan_export import build_export_command_nonfatal
from agents.runtime_config_support import build_aichem_token_config_patch_command
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
        return "- the exact output file(s) requested by the original task"
    return "\n".join(f"- `{path}`" for path in paths)


class PreinstalledGeminiCli(BaseInstalledAgent):
    """Gemini CLI agent that assumes the CLI is already present in the container."""

    SUPPORTS_ATIF = True
    _OUTPUT_FILENAME = "gemini-cli.txt"
    _OUTPUT_CONTRACT_FILENAME = "output-contract.json"
    _PLAN_OUTPUT_PATH = PurePosixPath(PLAN_OUTPUT_PATH)
    _PLAN_ARTIFACT_PATH = PurePosixPath(PLAN_ARTIFACT_PATH)
    _RUNTIME_HOME = PurePosixPath("/tmp/gemini-runtime-home")
    _RUNTIME_PATH = "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
    _LOOPBACK_NO_PROXY = ("127.0.0.1", "localhost", "::1")

    @staticmethod
    def name() -> str:
        return "gemini-cli"

    async def install(self, environment: BaseEnvironment) -> None:
        return None

    def get_version_command(self) -> str | None:
        return "gemini --version"

    def parse_version(self, stdout: str) -> str:
        return stdout.strip().splitlines()[-1].strip()

    @staticmethod
    def _runtime_preflight_command() -> str:
        return (
            f"export PATH={shlex.quote(PreinstalledGeminiCli._RUNTIME_PATH)}:$PATH; "
            "command -v node >/dev/null 2>&1 && "
            "command -v gemini >/dev/null 2>&1 && "
            "gemini --version >/dev/null 2>&1"
        )

    def _api_key(self) -> str:
        return (
            self._get_env("GEMINI_API_KEY")
            or self._get_env("GOOGLE_API_KEY")
            or ""
        ).strip()

    def _base_url(self) -> str:
        return (
            self._get_env("GOOGLE_GEMINI_BASE_URL")
            or self._get_env("GEMINI_BASE_URL")
            or ""
        ).strip().rstrip("/")

    def _proxy_mode(self) -> str:
        return (
            self._get_env("GEMINI_PROXY_MODE")
            or ""
        ).strip().lower()

    @staticmethod
    def _should_pass_extra_env(key: str) -> bool:
        prefixes = (
            "AICHEM_",
            "AIREADY_",
            "FORMAL_",
            "GEMINI_",
            "GOOGLE_",
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
        no_proxy = self._merge_no_proxy(env.get("NO_PROXY", ""), env.get("no_proxy", ""))
        env["NO_PROXY"] = no_proxy
        env["no_proxy"] = no_proxy

    @classmethod
    def _merge_no_proxy(cls, *values: str) -> str:
        merged: list[str] = []
        seen: set[str] = set()
        for value in (*values, ",".join(cls._LOOPBACK_NO_PROXY)):
            for item in str(value or "").split(","):
                normalized = item.strip()
                if normalized and normalized not in seen:
                    merged.append(normalized)
                    seen.add(normalized)
        return ",".join(merged)

    def _provider_model(self) -> str:
        return (self.model_name or self._get_env("GEMINI_MODEL") or "gemini-3.5-flash").strip()

    def _build_runtime_config_command(self) -> str:
        runtime_home = shlex.quote(str(self._RUNTIME_HOME))
        settings = {
            "security": {"auth": {"selectedType": "gemini-api-key"}},
            "telemetry": {"enabled": False},
            "skills": {"enabled": True},
            "experimental": {"skills": True},
            "context": {"includeDirectories": ["/workspace", "/logs"]},
            "model": {"disableLoopDetection": True},
        }
        settings_json = json.dumps(settings, indent=2, ensure_ascii=False)
        model_name = json.dumps(self._provider_model(), ensure_ascii=True)
        base_url = json.dumps(self._base_url(), ensure_ascii=True)
        proxy_mode = json.dumps(self._proxy_mode(), ensure_ascii=True)
        return (
            f"rm -rf {runtime_home} && "
            f"mkdir -p {runtime_home}/skills {runtime_home}/tmp /logs/agent/setup && "
            "python3 - <<'PY'\n"
            "import json, os\n"
            "from pathlib import Path\n"
            "key = os.environ.get('GEMINI_API_KEY') or os.environ.get('GOOGLE_API_KEY') or ''\n"
            "if not key.strip():\n"
            "    raise SystemExit('Gemini CLI run is missing GEMINI_API_KEY or GOOGLE_API_KEY')\n"
            f"runtime_home = Path({json.dumps(str(self._RUNTIME_HOME))})\n"
            f"settings = json.loads({settings_json!r})\n"
            f"model_name = {model_name}\n"
            f"base_url = {base_url}\n"
            f"proxy_mode = {proxy_mode}\n"
            "runtime_home.mkdir(parents=True, exist_ok=True)\n"
            "(runtime_home / 'settings.json').write_text(json.dumps(settings, indent=2, ensure_ascii=False) + '\\n', encoding='utf-8')\n"
            "payload = {'provider': 'gemini-compatible', 'base_url': base_url, 'proxy_mode': proxy_mode, 'model': model_name, 'key_present': True}\n"
            "Path('/logs/agent/setup/runtime-provider.json').write_text(json.dumps(payload, indent=2, ensure_ascii=False) + '\\n', encoding='utf-8')\n"
            "PY"
        )

    def _build_register_skills_command(self) -> str | None:
        if not self.skills_dir:
            return None
        runtime_home = shlex.quote(str(self._RUNTIME_HOME))
        skills_dir = shlex.quote(str(self.skills_dir))
        return (
            f"mkdir -p {runtime_home}/skills {runtime_home}/.gemini/skills && "
            f"if [ -d {skills_dir} ]; then "
            f"cp -a {skills_dir}/. {runtime_home}/skills/; "
            f"cp -a {skills_dir}/. {runtime_home}/.gemini/skills/; "
            "fi && "
            "python3 - <<'PY'\n"
            "import json\n"
            "from pathlib import Path\n"
            f"runtime_home = Path({json.dumps(str(self._RUNTIME_HOME))})\n"
            "roots = [runtime_home / 'skills', runtime_home / '.gemini' / 'skills']\n"
            "payload = {}\n"
            "for root in roots:\n"
            "    payload[str(root)] = sorted(str(path.relative_to(root)) for path in root.rglob('SKILL.md')) if root.exists() else []\n"
            "Path('/logs/agent/setup/skills.json').write_text(json.dumps({'skill_roots': payload}, indent=2, ensure_ascii=False) + '\\n', encoding='utf-8')\n"
            "PY"
        )

    @staticmethod
    def _augment_instruction_for_completion(
        instruction: str,
        *,
        output_contract_mode: str | None = None,
    ) -> str:
        required_output_paths = extract_required_output_paths(instruction)
        required_text = _format_required_output_guidance(required_output_paths)
        guidance_lines = [
            "Gemini CLI non-interactive execution contract:",
            "0. Obey the original task exactly; this contract only clarifies harness deliverables.",
            "1. Complete the task by writing the requested output files, not by prose only.",
            "2. If `/tests`, `/test.sh`, or verifier files exist, inspect the relevant verifier before finishing.",
        ]
        if plan_output_contract_enabled(instruction, output_contract_mode):
            guidance_lines.extend(
                [
                    "3. This task uses the JSON-plan contract: write `/workspace/experiment_plan.json` and copy it to `/logs/artifacts/final_plan.json`.",
                    "3a. Every workflow step must include `step_number`, workstation `id`, `workstation`, and `operation`; `id` must be an integer from the selected workstation skill.",
                ]
            )
        guidance_lines.extend(
            [
                "4. Use shell/Python/heredoc file writes; do not rely on markdown fences as the artifact.",
                "5. Avoid dumping huge skill files; use targeted reads and searches.",
                "6. Detected required output path(s):",
                required_text,
                "7. Stop after the required files exist and pass a focused local check.",
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
    def _build_export_plan_command(cls) -> str:
        return build_export_command_nonfatal(
            agent_kind="gemini-cli",
            source_log=EnvironmentPaths.agent_dir / cls._OUTPUT_FILENAME,
            output_path=cls._PLAN_OUTPUT_PATH,
            artifact_path=cls._PLAN_ARTIFACT_PATH,
            summary_path=EnvironmentPaths.agent_dir / "plan-export.json",
        )

    def _build_agent_command(self, instruction: str) -> str:
        return (
            f"export PATH={shlex.quote(self._RUNTIME_PATH)}:$PATH; "
            f"export HOME={shlex.quote(str(self._RUNTIME_HOME))}; "
            f"export GEMINI_CLI_HOME={shlex.quote(str(self._RUNTIME_HOME))}; "
            f"export TMPDIR={shlex.quote(str(self._RUNTIME_HOME / 'tmp'))}; "
            "case \"${GOOGLE_GEMINI_BASE_URL:-}\" in "
            "*127.0.0.1*|*localhost*) "
            "unset HTTP_PROXY HTTPS_PROXY ALL_PROXY http_proxy https_proxy all_proxy; "
            "export NO_PROXY=127.0.0.1,localhost,::1; "
            "export no_proxy=127.0.0.1,localhost,::1; "
            ";; "
            "esac; "
            "gemini --yolo "
            "--include-directories=/workspace,/logs "
            f"--prompt={shlex.quote(instruction)} "
            "--output-format=json --raw-output --accept-raw-output-risk "
            "2>&1 </dev/null"
        )

    @staticmethod
    def _build_output_contract_debug_command(
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
            "output_path": str(PreinstalledGeminiCli._PLAN_OUTPUT_PATH),
            "artifact_path": str(PreinstalledGeminiCli._PLAN_ARTIFACT_PATH),
            "required_output_paths": required_output_paths,
            "expects_plan_artifact": expects_plan_artifact,
            "output_contract_mode": normalize_output_contract_mode(output_contract_mode),
            "diagnostic_note": "Harness-side output-contract diagnostic only; SkillsBench scoring must use verifier/* outputs.",
        }
        return (
            "python3 - <<'PY'\n"
            "import json\n"
            "from pathlib import Path\n"
            f"payload = json.loads({json.dumps(payload, ensure_ascii=True)!r})\n"
            f"path = Path('/logs/agent/{PreinstalledGeminiCli._OUTPUT_CONTRACT_FILENAME}')\n"
            "path.parent.mkdir(parents=True, exist_ok=True)\n"
            "path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + '\\n', encoding='utf-8')\n"
            "PY"
        )

    def _primary_soft_timeout_sec(self) -> int | None:
        raw = (
            self._get_env("GEMINI_CLI_PRIMARY_SOFT_TIMEOUT_SEC")
            or self._get_env("AIREADY_GEMINI_CLI_PRIMARY_SOFT_TIMEOUT_SEC")
            or "1800"
        )
        try:
            value = int(float(raw))
        except (TypeError, ValueError):
            return 1800
        return value if value > 0 else None

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

    @classmethod
    def _iter_json_objects(cls, text: str) -> list[object]:
        decoder = json.JSONDecoder()
        values: list[object] = []
        index = 0
        while index < len(text):
            match = re.search(r"[\{\[]", text[index:])
            if not match:
                break
            start = index + match.start()
            try:
                value, offset = decoder.raw_decode(text[start:])
            except json.JSONDecodeError:
                index = start + 1
                continue
            values.append(value)
            index = start + max(offset, 1)
        return values

    @classmethod
    def _extract_usage_from_text(cls, text: str) -> dict[str, Any]:
        usage = {
            "input_tokens": 0,
            "output_tokens": 0,
            "cache_tokens": 0,
            "models": {},
        }
        for payload in cls._iter_json_objects(text):
            if not isinstance(payload, dict):
                continue
            stats = payload.get("stats")
            if not isinstance(stats, dict):
                continue
            models = stats.get("models")
            if not isinstance(models, dict):
                continue
            for model_name, model_stats in models.items():
                if not isinstance(model_stats, dict):
                    continue
                tokens = model_stats.get("tokens")
                if not isinstance(tokens, dict):
                    continue
                input_tokens = cls._coerce_int(tokens.get("input")) or cls._coerce_int(tokens.get("prompt")) or 0
                output_tokens = (
                    (cls._coerce_int(tokens.get("candidates")) or 0)
                    + (cls._coerce_int(tokens.get("output")) or 0)
                    + (cls._coerce_int(tokens.get("thoughts")) or 0)
                    + (cls._coerce_int(tokens.get("tool")) or 0)
                )
                cache_tokens = cls._coerce_int(tokens.get("cached")) or 0
                usage["input_tokens"] += input_tokens
                usage["output_tokens"] += output_tokens
                usage["cache_tokens"] += cache_tokens
                usage["models"][str(model_name)] = tokens
        return {key: value for key, value in usage.items() if value not in (0, {}, None)}

    def populate_context_post_run(self, context: AgentContext) -> None:
        output_path = self.logs_dir / self._OUTPUT_FILENAME
        if not output_path.exists():
            return
        raw_text = output_path.read_text(encoding="utf-8", errors="replace")
        usage = self._extract_usage_from_text(raw_text)
        if usage:
            context.n_input_tokens = usage.get("input_tokens")
            context.n_cache_tokens = usage.get("cache_tokens")
            context.n_output_tokens = usage.get("output_tokens")
        metrics = Metrics(
            prompt_tokens=context.n_input_tokens,
            completion_tokens=context.n_output_tokens,
            cached_tokens=context.n_cache_tokens,
            extra={"usage_source": "gemini-cli-json-output", **usage} if usage else None,
        )
        trajectory = Trajectory(
            schema_version="ATIF-v1.0",
            session_id="gemini-cli-session",
            agent=Agent(
                name="gemini-cli",
                version=self.version() or "unknown",
                model_name=self.model_name,
                extra={"raw_output_file": self._OUTPUT_FILENAME},
            ),
            steps=[
                Step(
                    step_id=1,
                    timestamp=None,
                    source="agent",
                    message=raw_text[-20000:] if raw_text else "",
                    model_name=self.model_name,
                    metrics=metrics if usage else None,
                )
            ],
            final_metrics=FinalMetrics(
                total_steps=1,
                total_prompt_tokens=context.n_input_tokens,
                total_completion_tokens=context.n_output_tokens,
                total_cached_tokens=context.n_cache_tokens,
                extra={"usage_source": "gemini-cli-json-output", **usage} if usage else None,
            ),
        )
        (self.logs_dir / "trajectory.json").write_text(
            json.dumps(trajectory.to_json_dict(), indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )
        if usage:
            metadata = dict(context.metadata or {})
            metadata["native_usage"] = usage
            context.metadata = metadata

    async def run(self, instruction: str, environment, context) -> None:
        instruction = self.render_instruction(instruction)
        output_contract_mode = normalize_output_contract_mode(self._get_env("OUTPUT_CONTRACT_MODE"))
        contract_enabled = output_contract_enabled(output_contract_mode)
        required_output_paths = extract_required_output_paths(instruction)
        expects_plan_artifact = plan_output_contract_enabled(instruction, output_contract_mode)
        if not agent_prompt_augmentation_disabled(self):
            instruction = self._augment_instruction_for_completion(
                instruction,
                output_contract_mode=output_contract_mode,
            )

        env = {
            "PATH": self._RUNTIME_PATH,
            "HOME": str(self._RUNTIME_HOME),
            "TMPDIR": str(self._RUNTIME_HOME / "tmp"),
            "GEMINI_CLI_HOME": str(self._RUNTIME_HOME),
            "GEMINI_CLI_TRUST_WORKSPACE": "true",
            "GEMINI_API_KEY": self._api_key(),
            "GOOGLE_API_KEY": self._api_key(),
            "GOOGLE_GEMINI_BASE_URL": self._base_url(),
            "GEMINI_MODEL": self._provider_model(),
            "OUTPUT_CONTRACT_MODE": output_contract_mode,
        }
        for key in ("FORMAL_KEY_LABEL", "FORMAL_KEY_PROVIDER", "FORMAL_MODEL_LABEL"):
            value = self._get_env(key)
            if value:
                env[key] = value
        self._apply_extra_env(env)

        setup_parts = [self._build_runtime_config_command()]
        skills_command = self._build_register_skills_command()
        if skills_command:
            setup_parts.append(skills_command)
        setup_parts.append(build_aichem_token_config_patch_command())
        setup_parts.append(self._runtime_preflight_command())
        await self.exec_as_agent(
            environment,
            command="\n".join(setup_parts),
            env=env,
        )

        raw_command = self._build_agent_command(instruction)
        guarded_command = build_valid_output_guard_command(
            raw_command=raw_command,
            output_log=EnvironmentPaths.agent_dir / self._OUTPUT_FILENAME,
            contract_path=EnvironmentPaths.agent_dir / self._OUTPUT_CONTRACT_FILENAME,
            required_output_paths=required_output_paths,
            expects_plan_output=expects_plan_artifact,
            output_contract_mode=output_contract_mode,
            agent_kind="gemini-cli",
            grace_env_var="GEMINI_CLI_VALID_OUTPUT_GRACE_SEC",
            poll_env_var="GEMINI_CLI_VALID_OUTPUT_POLL_SEC",
            plan_output_path=self._PLAN_OUTPUT_PATH,
            plan_artifact_path=self._PLAN_ARTIFACT_PATH,
            max_runtime_sec=self._primary_soft_timeout_sec(),
        )

        agent_error: Exception | None = None
        try:
            result = await environment.exec(command=guarded_command, env=env, cwd="/workspace")
            if result.return_code != 0:
                agent_error = NonZeroAgentExitCodeError(f"Gemini CLI exited with code {result.return_code}")
        finally:
            try:
                await self.exec_as_agent(
                    environment,
                    command=(
                        "set +e; "
                        "src=$(find \"$GEMINI_CLI_HOME\" /root/.gemini -type f "
                        "\\( -name 'session-*.jsonl' -o -name 'session-*.json' \\) "
                        "-printf '%T@ %p\\n' 2>/dev/null | sort -nr | head -n1 | awk '{print $2}'); "
                        "if [ -n \"$src\" ]; then cp \"$src\" \"/logs/agent/gemini-cli.trajectory.${src##*.}\"; fi"
                    ),
                    env=env,
                )
            except Exception:
                pass

            try:
                if expects_plan_artifact:
                    await self.exec_as_agent(environment, command=self._build_export_plan_command())
            except Exception:
                pass

            output_valid = False
            if contract_enabled:
                try:
                    output_check = await environment.exec(
                        command=self._build_required_output_check_command(
                            required_output_paths=required_output_paths,
                            expects_plan_artifact=expects_plan_artifact,
                        )
                    )
                    output_valid = output_check.return_code == 0
                except Exception:
                    output_valid = False

                try:
                    await self.exec_as_agent(
                        environment,
                        command=self._build_output_contract_debug_command(
                            status="ok" if output_valid else "failed",
                            reason="valid_required_output_available" if output_valid else "missing_or_invalid_required_output_after_agent",
                            required_output_paths=required_output_paths,
                            expects_plan_artifact=expects_plan_artifact,
                            output_contract_mode=output_contract_mode,
                        ),
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
                    output_check = await environment.exec(
                        command=self._build_required_output_check_command(
                            required_output_paths=required_output_paths,
                            expects_plan_artifact=expects_plan_artifact,
                        )
                    )
                    if output_check.return_code == 0:
                        return
                except Exception:
                    pass
            raise agent_error
