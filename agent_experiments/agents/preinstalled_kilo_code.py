from __future__ import annotations

import json
import shlex
from pathlib import PurePosixPath

from harbor.agents.installed.base import BaseInstalledAgent, CliFlag, NonZeroAgentExitCodeError
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


class PreinstalledKiloCode(BaseInstalledAgent):
    """Kilo Code agent that assumes the CLI is already present in the container."""

    SUPPORTS_ATIF = True
    _OUTPUT_FILENAME = "kilo-code.txt"
    _OUTPUT_CONTRACT_FILENAME = "output-contract.json"
    _PLAN_OUTPUT_PATH = PurePosixPath(PLAN_OUTPUT_PATH)
    _PLAN_ARTIFACT_PATH = PurePosixPath(PLAN_ARTIFACT_PATH)
    _RUNTIME_HOME = PurePosixPath("/tmp/kilo-runtime-home")
    _RUNTIME_PATH = "/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin"
    _TRANSIENT_RETRY_MARKER = PurePosixPath("/logs/agent/kilo-transient-retry.json")

    CLI_FLAGS = [
        CliFlag(
            "thinking",
            cli="--variant",
            type="enum",
            choices=["low", "medium", "high"],
            default="high",
            env_fallback="KILO_THINKING_LEVEL",
        )
    ]

    @staticmethod
    def name() -> str:
        return "kilo-code"

    async def install(self, environment: BaseEnvironment) -> None:
        return None

    def get_version_command(self) -> str | None:
        return "kilo --version"

    def parse_version(self, stdout: str) -> str:
        return stdout.strip().splitlines()[-1].strip()

    def _provider_family(self) -> str:
        return (self._get_env("KILO_PROVIDER_ID") or "openai-compatible").strip()

    @staticmethod
    def _runtime_preflight_command() -> str:
        return (
            f"export PATH={shlex.quote(PreinstalledKiloCode._RUNTIME_PATH)}:$PATH; "
            "command -v node >/dev/null 2>&1 && "
            "command -v kilo >/dev/null 2>&1 && "
            "kilo --version >/dev/null 2>&1"
        )

    def _api_key(self) -> str:
        return (
            self._get_env("OPENAI_API_KEY")
            or ""
        ).strip()

    def _base_url(self) -> str:
        return (
            self._get_env("OPENAI_BASE_URL")
            or ""
        ).strip().rstrip("/")

    def _provider_model(self) -> str:
        normalized = (self.model_name or "").strip()
        family = self._provider_family()
        if not normalized:
            return f"{family}/default-model"
        if normalized.startswith(f"{family}/"):
            return normalized
        return f"{family}/{normalized}"

    def _build_runtime_config_command(self) -> str:
        runtime_home = shlex.quote(str(self._RUNTIME_HOME))
        provider_family = self._provider_family()
        base_url = json.dumps(self._base_url())
        model_name = json.dumps(self.model_name or "default-model")
        provider_family_json = json.dumps(provider_family)
        api_key_env_json = json.dumps("OPENAI_API_KEY")
        provider_label_json = json.dumps("OpenAI-compatible")
        provider_doc_json = json.dumps("")
        return (
            f"rm -rf {runtime_home} && "
            f"mkdir -p {runtime_home}/.config/kilo {runtime_home}/.cache/kilo {runtime_home}/tmp /logs/agent/setup && "
            "python3 - <<'PY'\n"
            "import json, os, sys\n"
            "from pathlib import Path\n"
            f"api_key_env = {api_key_env_json}\n"
            "key = os.environ.get(api_key_env) or ''\n"
            "if not key.strip():\n"
            "    raise SystemExit(f'Kilo Code run is missing {api_key_env}/OPENAI_API_KEY')\n"
            f"base_url = {base_url}\n"
            "if not base_url:\n"
            "    raise SystemExit('Kilo Code run is missing OPENAI_BASE_URL')\n"
            f"provider_family = {provider_family_json}\n"
            f"provider_label = {provider_label_json}\n"
            f"provider_doc = {provider_doc_json}\n"
            f"model_name = {model_name}\n"
            "config = {\n"
            "    'provider': {\n"
            "        provider_family: {\n"
            "            'npm': '@ai-sdk/openai-compatible',\n"
            "            'name': provider_label,\n"
            "            'options': {'baseURL': base_url, 'apiKey': '{env:' + api_key_env + '}'},\n"
            "            'models': {model_name: {'name': model_name, 'limit': {'context': 200000, 'output': 65536}}},\n"
            "        }\n"
            "    },\n"
            "}\n"
            "config_text = json.dumps(config, indent=2, ensure_ascii=False) + '\\n'\n"
            f"Path({json.dumps(str(self._RUNTIME_HOME / '.config/kilo/kilo.json'))}).write_text(config_text, encoding='utf-8')\n"
            f"Path({json.dumps(str(self._RUNTIME_HOME / '.config/kilo/opencode.json'))}).write_text(config_text, encoding='utf-8')\n"
            "model_catalog = {\n"
            "    provider_family: {\n"
            "        'id': provider_family,\n"
            "        'env': [api_key_env],\n"
            "        'npm': '@ai-sdk/openai-compatible',\n"
            "        'api': base_url,\n"
            "        'name': provider_label,\n"
            "        'doc': provider_doc,\n"
            "        'models': {\n"
            "            model_name: {\n"
            "                'id': model_name,\n"
            "                'name': model_name,\n"
            "                'tool_call': True,\n"
            "                'structured_output': True,\n"
            "                'temperature': True,\n"
            "                'limit': {'context': 200000, 'output': 65536},\n"
            "            }\n"
            "        },\n"
            "    }\n"
            "}\n"
            f"Path({json.dumps(str(self._RUNTIME_HOME / '.cache/kilo/models.json'))}).write_text(json.dumps(model_catalog, ensure_ascii=False, separators=(',', ':')) + '\\n', encoding='utf-8')\n"
            "payload = {'provider': provider_family, 'base_url': base_url, 'model': model_name, 'key_env': api_key_env, 'key_present': True}\n"
            "Path('/logs/agent/setup/runtime-provider.json').write_text(json.dumps(payload, indent=2) + '\\n', encoding='utf-8')\n"
            "PY"
        )

    def _build_register_skills_command(self) -> str | None:
        if not self.skills_dir:
            return None
        runtime_home = shlex.quote(str(self._RUNTIME_HOME))
        skills_dir = shlex.quote(str(self.skills_dir))
        return (
            f"mkdir -p {runtime_home}/skills {runtime_home}/.kilo/skills {runtime_home}/.opencode/skill && "
            f"if [ -d {skills_dir} ]; then "
            f"cp -a {skills_dir}/. {runtime_home}/skills/; "
            f"cp -a {skills_dir}/. {runtime_home}/.kilo/skills/; "
            f"cp -a {skills_dir}/. {runtime_home}/.opencode/skill/; "
            "fi && "
            "python3 - <<'PY'\n"
            "import json\n"
            "from pathlib import Path\n"
            f"runtime_home = Path({json.dumps(str(self._RUNTIME_HOME))})\n"
            "roots = [runtime_home / 'skills', runtime_home / '.kilo' / 'skills', runtime_home / '.opencode' / 'skill']\n"
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
            "Kilo Code non-interactive execution contract:",
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
            agent_kind="kilo-code",
            source_log=EnvironmentPaths.agent_dir / cls._OUTPUT_FILENAME,
            output_path=cls._PLAN_OUTPUT_PATH,
            artifact_path=cls._PLAN_ARTIFACT_PATH,
            summary_path=EnvironmentPaths.agent_dir / "plan-export.json",
        )

    @classmethod
    def _build_collect_runtime_logs_command(cls) -> str:
        runtime_home = str(cls._RUNTIME_HOME)
        return (
            "python3 - <<'PY'\n"
            "import shutil\n"
            "from pathlib import Path\n"
            f"runtime_home = Path({json.dumps(runtime_home)})\n"
            "dest = Path('/logs/agent/setup/kilo-runtime')\n"
            "dest.mkdir(parents=True, exist_ok=True)\n"
            "for relative in [\n"
            "    '.local/share/kilo/log',\n"
            "    '.local/state/kilo/locks',\n"
            "    '.cache/kilo',\n"
            "    '.config/kilo/kilo.json',\n"
            "    '.config/kilo/opencode.json',\n"
            "]:\n"
            "    source = runtime_home / relative\n"
            "    target = dest / relative\n"
            "    try:\n"
            "        if source.is_dir():\n"
            "            shutil.copytree(source, target, dirs_exist_ok=True)\n"
            "        elif source.is_file():\n"
            "            target.parent.mkdir(parents=True, exist_ok=True)\n"
            "            shutil.copy2(source, target)\n"
            "    except Exception:\n"
            "        pass\n"
            "PY"
        )

    @classmethod
    def _build_transient_failure_probe_command(cls) -> str:
        runtime_home = str(cls._RUNTIME_HOME)
        output_file = str(EnvironmentPaths.agent_dir / cls._OUTPUT_FILENAME)
        return (
            "python3 - <<'PY'\n"
            "import json\n"
            "from pathlib import Path\n"
            f"runtime_home = Path({json.dumps(runtime_home)})\n"
            f"output_file = Path({json.dumps(output_file)})\n"
            f"marker = Path({json.dumps(str(cls._TRANSIENT_RETRY_MARKER))})\n"
            "text = output_file.read_text(encoding='utf-8', errors='replace') if output_file.exists() else ''\n"
            "models_json = runtime_home / '.cache/kilo/models.json'\n"
            "reasons = []\n"
            "if 'JSON Parse error: Unexpected EOF' in text:\n"
            "    reasons.append('kilo_json_parse_unexpected_eof')\n"
            "if models_json.exists() and models_json.stat().st_size == 0:\n"
            "    reasons.append('empty_kilo_models_cache')\n"
            "stripped = text.strip()\n"
            "if len(stripped) < 500 and '> code' in stripped and not any(token in stripped for token in ('Todos', '→', '←', '$ ', 'Experiment successfully', '/workspace/experiment_plan.json')):\n"
            "    reasons.append('kilo_started_then_no_model_output')\n"
            "marker.parent.mkdir(parents=True, exist_ok=True)\n"
            "if reasons:\n"
            "    marker.write_text(json.dumps({'retry': True, 'reasons': reasons}, indent=2) + '\\n', encoding='utf-8')\n"
            "    raise SystemExit(0)\n"
            "marker.write_text(json.dumps({'retry': False, 'reasons': []}, indent=2) + '\\n', encoding='utf-8')\n"
            "raise SystemExit(1)\n"
            "PY"
        )

    @classmethod
    def _build_prepare_transient_retry_command(cls) -> str:
        runtime_home = str(cls._RUNTIME_HOME)
        output_file = str(EnvironmentPaths.agent_dir / cls._OUTPUT_FILENAME)
        contract_file = str(EnvironmentPaths.agent_dir / cls._OUTPUT_CONTRACT_FILENAME)
        return (
            "python3 - <<'PY'\n"
            "import shutil\n"
            "from pathlib import Path\n"
            f"runtime_home = Path({json.dumps(runtime_home)})\n"
            f"output_file = Path({json.dumps(output_file)})\n"
            f"contract_file = Path({json.dumps(contract_file)})\n"
            "agent_dir = Path('/logs/agent')\n"
            "artifacts_dir = Path('/logs/artifacts')\n"
            "agent_dir.mkdir(parents=True, exist_ok=True)\n"
            "for source, target in [\n"
            "    (output_file, agent_dir / 'kilo-code.attempt1.txt'),\n"
            "    (contract_file, agent_dir / 'output-contract.attempt1.json'),\n"
            "]:\n"
            "    try:\n"
            "        if source.exists():\n"
            "            shutil.copy2(source, target)\n"
            "    except Exception:\n"
            "        pass\n"
            "runtime_snapshot = agent_dir / 'setup' / 'kilo-runtime-attempt1'\n"
            "for relative in ['.local/share/kilo/log', '.local/state/kilo/locks', '.cache/kilo']:\n"
            "    source = runtime_home / relative\n"
            "    target = runtime_snapshot / relative\n"
            "    try:\n"
            "        if source.is_dir():\n"
            "            shutil.copytree(source, target, dirs_exist_ok=True)\n"
            "        elif source.is_file():\n"
            "            target.parent.mkdir(parents=True, exist_ok=True)\n"
            "            shutil.copy2(source, target)\n"
            "    except Exception:\n"
            "        pass\n"
            "for path in [\n"
            "    runtime_home / '.cache/kilo/models.json',\n"
            "    runtime_home / '.local/state/kilo/locks',\n"
            "    runtime_home / '.local/share/kilo/storage/session_diff',\n"
            "    output_file,\n"
            "    contract_file,\n"
            "    Path('/workspace/experiment_plan.json'),\n"
            "    artifacts_dir / 'final_plan.json',\n"
            "]:\n"
            "    try:\n"
            "        if path.is_dir():\n"
            "            shutil.rmtree(path)\n"
            "        elif path.exists():\n"
            "            path.unlink()\n"
            "    except Exception:\n"
            "        pass\n"
            "PY"
        )

    def _build_agent_command(self, instruction: str) -> str:
        flags = self.build_cli_flags()
        flags = f"{flags} " if flags else ""
        return (
            f"export PATH={shlex.quote(self._RUNTIME_PATH)}:$PATH; "
            f"export HOME={shlex.quote(str(self._RUNTIME_HOME))}; "
            f"export XDG_CONFIG_HOME={shlex.quote(str(self._RUNTIME_HOME / '.config'))}; "
            f"export TMPDIR={shlex.quote(str(self._RUNTIME_HOME / 'tmp'))}; "
            "kilo run --auto "
            f"--model {shlex.quote(self._provider_model())} "
            f"{flags}"
            "--dir /root -- "
            f"{shlex.quote(instruction)} 2>&1 </dev/null"
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
            "output_path": str(PreinstalledKiloCode._PLAN_OUTPUT_PATH),
            "artifact_path": str(PreinstalledKiloCode._PLAN_ARTIFACT_PATH),
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
            f"path = Path('/logs/agent/{PreinstalledKiloCode._OUTPUT_CONTRACT_FILENAME}')\n"
            "path.parent.mkdir(parents=True, exist_ok=True)\n"
            "path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + '\\n', encoding='utf-8')\n"
            "PY"
        )

    def _primary_soft_timeout_sec(self) -> int | None:
        raw = self._get_env("KILO_PRIMARY_SOFT_TIMEOUT_SEC") or self._get_env("AIREADY_KILO_PRIMARY_SOFT_TIMEOUT_SEC") or "1800"
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
    def _extract_usage_from_text(cls, text: str) -> dict[str, int]:
        totals = {
            "input_tokens": 0,
            "output_tokens": 0,
            "cache_tokens": 0,
        }
        for line in text.splitlines():
            stripped = line.strip()
            if not stripped.startswith("{"):
                continue
            try:
                payload = json.loads(stripped)
            except json.JSONDecodeError:
                continue
            stack = [payload]
            while stack:
                current = stack.pop()
                if isinstance(current, dict):
                    usage = current.get("usage")
                    if isinstance(usage, dict):
                        for source, target in (
                            ("inputTokens", "input_tokens"),
                            ("prompt_tokens", "input_tokens"),
                            ("input_tokens", "input_tokens"),
                            ("outputTokens", "output_tokens"),
                            ("completion_tokens", "output_tokens"),
                            ("output_tokens", "output_tokens"),
                            ("cached_tokens", "cache_tokens"),
                            ("cacheReadInputTokens", "cache_tokens"),
                        ):
                            value = cls._coerce_int(usage.get(source))
                            if value is not None:
                                totals[target] += value
                    stack.extend(current.values())
                elif isinstance(current, list):
                    stack.extend(current)
        return {key: value for key, value in totals.items() if value > 0}

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
            extra={"usage_source": "kilo-json-output", **usage} if usage else None,
        )
        trajectory = Trajectory(
            schema_version="ATIF-v1.0",
            session_id="kilo-code-session",
            agent=Agent(
                name="kilo-code",
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
                extra={"usage_source": "kilo-json-output", **usage} if usage else None,
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
            "XDG_CONFIG_HOME": str(self._RUNTIME_HOME / ".config"),
            "TMPDIR": str(self._RUNTIME_HOME / "tmp"),
            "NODE_OPTIONS": "--use-openssl-ca",
            "NODE_EXTRA_CA_CERTS": "/etc/ssl/certs/ca-certificates.crt",
            "SSL_CERT_FILE": "/etc/ssl/certs/ca-certificates.crt",
            "REQUESTS_CA_BUNDLE": "/etc/ssl/certs/ca-certificates.crt",
            "CURL_CA_BUNDLE": "/etc/ssl/certs/ca-certificates.crt",
            "OUTPUT_CONTRACT_MODE": output_contract_mode,
            "OPENAI_API_KEY": self._api_key(),
            "OPENAI_BASE_URL": self._base_url(),
        }
        for key in ("FORMAL_KEY_LABEL", "FORMAL_KEY_PROVIDER", "FORMAL_MODEL_LABEL"):
            value = self._get_env(key)
            if value:
                env[key] = value
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

        setup_commands = [self._build_runtime_config_command()]
        skills_command = self._build_register_skills_command()
        if skills_command:
            setup_commands.append(skills_command)
        setup_commands.append(build_aichem_token_config_patch_command())
        setup_commands.append(self._runtime_preflight_command())

        await self.exec_as_agent(
            environment,
            command="\n".join(setup_commands),
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
            agent_kind="kilo-code",
            grace_env_var="KILO_VALID_OUTPUT_GRACE_SEC",
            poll_env_var="KILO_VALID_OUTPUT_POLL_SEC",
            plan_output_path=self._PLAN_OUTPUT_PATH,
            plan_artifact_path=self._PLAN_ARTIFACT_PATH,
            max_runtime_sec=self._primary_soft_timeout_sec(),
        )

        agent_error: Exception | None = None
        try:
            result = await environment.exec(command=guarded_command, env=env)
            if result.return_code != 0:
                retry_transient = False
                try:
                    probe = await environment.exec(command=self._build_transient_failure_probe_command())
                    retry_transient = probe.return_code == 0
                except Exception:
                    retry_transient = False
                if retry_transient:
                    try:
                        await self.exec_as_agent(
                            environment,
                            command=self._build_prepare_transient_retry_command(),
                        )
                    except Exception:
                        pass
                    try:
                        await self.exec_as_agent(
                            environment,
                            command="\n".join(
                                [
                                    command
                                    for command in [
                                        self._build_runtime_config_command(),
                                        self._build_register_skills_command(),
                                        build_aichem_token_config_patch_command(),
                                        self._runtime_preflight_command(),
                                    ]
                                    if command
                                ]
                            ),
                            env=env,
                        )
                    except Exception:
                        pass
                    result = await environment.exec(command=guarded_command, env=env)
            if result.return_code != 0:
                agent_error = NonZeroAgentExitCodeError(f"Kilo Code exited with code {result.return_code}")
        finally:
            try:
                await self.exec_as_agent(environment, command=self._build_collect_runtime_logs_command())
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
