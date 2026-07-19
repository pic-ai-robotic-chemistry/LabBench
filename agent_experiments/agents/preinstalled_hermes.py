from __future__ import annotations

import json
import os
import shlex
import yaml
from pathlib import Path, PurePosixPath

from harbor.agents.installed.base import NonZeroAgentExitCodeError
from harbor.agents.installed.hermes import Hermes
from harbor.models.agent.context import AgentContext
from harbor.models.trial.paths import EnvironmentPaths

from agents.experiment_plan_export import build_export_command_nonfatal
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


class PreinstalledHermes(Hermes):
    """Hermes agent that assumes the CLI is already present in the container."""

    _PLAN_OUTPUT_PATH = PurePosixPath(PLAN_OUTPUT_PATH)
    _PLAN_ARTIFACT_PATH = PurePosixPath(PLAN_ARTIFACT_PATH)
    _OUTPUT_CONTRACT_FILENAME = "output-contract.json"

    async def install(self, environment) -> None:
        return None

    @staticmethod
    def _runtime_preflight_command() -> str:
        return (
            'export PATH="$HOME/.local/bin:$PATH"; '
            "command -v python3 >/dev/null 2>&1 && "
            "command -v hermes >/dev/null 2>&1 && "
            "hermes version >/dev/null 2>&1"
        )

    @staticmethod
    def _augment_instruction_for_completion(
        instruction: str,
        *,
        output_contract_mode: str | None = None,
    ) -> str:
        required_output_paths = extract_required_output_paths(instruction)
        required_text = "\n".join(f"- `{path}`" for path in required_output_paths)
        if not required_text:
            required_text = "- the exact output file(s) requested by the original task"

        guidance_lines = [
            "Hermes non-interactive execution contract:",
            "0. Before inspecting long skill/reference files, identify the exact deliverable files requested by this task.",
            "1. Complete the task by writing the requested output files. Do not stop at planning or a prose-only answer.",
            "2. If the task specifies an exact output path, write the final artifact exactly there.",
            "3. If `/tests`, `/test.sh`, or verifier files exist, inspect the relevant local test or verifier before finishing.",
        ]
        if plan_output_contract_enabled(instruction, output_contract_mode):
            guidance_lines.extend(
                [
                    "4. This task explicitly uses the JSON-plan contract: write the final plan to `/workspace/experiment_plan.json` and copy it to `/logs/artifacts/final_plan.json`.",
                    "4a. Every workflow step must include `step_number`, workstation `id`, `workstation`, and `operation`; the workstation `id` must be an integer from the selected workstation skill.",
                ]
            )
        guidance_lines.extend(
            [
                "5. Use an actual shell command, Python script, or heredoc to write files. Do not rely on markdown fences or a final message as the artifact.",
                "6. Avoid dumping very large skill/reference files. Prefer `rg`, `find`, targeted excerpts, and short schema reads.",
                "7. Detected required output path(s):",
                required_text,
                "8. Once all required output files exist and pass a focused local check, stop and give a concise final response.",
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
            agent_kind="hermes",
            source_log=EnvironmentPaths.agent_dir / "hermes.txt",
            output_path=cls._PLAN_OUTPUT_PATH,
            artifact_path=cls._PLAN_ARTIFACT_PATH,
            summary_path=EnvironmentPaths.agent_dir / "plan-export.json",
        )

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

    @staticmethod
    def _coerce_float(value: object) -> float | None:
        if isinstance(value, bool):
            return None
        if isinstance(value, int | float):
            return float(value)
        if isinstance(value, str):
            try:
                return float(value)
            except ValueError:
                return None
        return None

    @classmethod
    def _read_native_session_usage(cls, session_path: Path) -> dict[str, object]:
        if not session_path.exists():
            return {}

        totals = {
            "input_tokens": 0,
            "output_tokens": 0,
            "cache_read_tokens": 0,
            "cache_write_tokens": 0,
            "reasoning_tokens": 0,
        }
        api_call_count = 0
        session_records = 0
        actual_cost_usd: float | None = None
        estimated_cost_usd: float | None = None
        cost_status: str | None = None

        for line in session_path.read_text(encoding="utf-8", errors="ignore").splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                payload = json.loads(line)
            except json.JSONDecodeError:
                continue
            if not isinstance(payload, dict):
                continue

            saw_usage = False
            for key in totals:
                value = cls._coerce_int(payload.get(key))
                if value is None:
                    continue
                totals[key] += value
                saw_usage = True

            call_count = cls._coerce_int(payload.get("api_call_count"))
            if call_count is not None:
                api_call_count += call_count
                saw_usage = True

            if saw_usage:
                session_records += 1

            if actual_cost_usd is None:
                actual_cost_usd = cls._coerce_float(payload.get("actual_cost_usd"))
            if estimated_cost_usd is None:
                estimated_cost_usd = cls._coerce_float(payload.get("estimated_cost_usd"))
            if cost_status is None and isinstance(payload.get("cost_status"), str):
                cost_status = str(payload["cost_status"])

        observed_total = sum(totals.values())
        if observed_total <= 0:
            return {}

        return {
            **totals,
            "observed_total_tokens": observed_total,
            "api_call_count": api_call_count,
            "session_records": session_records,
            "actual_cost_usd": actual_cost_usd,
            "estimated_cost_usd": estimated_cost_usd,
            "cost_status": cost_status,
            "usage_source": "hermes-session",
        }

    def populate_context_post_run(self, context: AgentContext) -> None:
        try:
            super().populate_context_post_run(context)
        except Exception as exc:
            self.logger.debug(f"Error converting hermes session to ATIF: {exc}")

        usage = self._read_native_session_usage(self.logs_dir / "hermes-session.jsonl")
        if not usage:
            return

        input_tokens = int(usage["input_tokens"])
        output_tokens = int(usage["output_tokens"])
        cache_read_tokens = int(usage["cache_read_tokens"])
        cache_write_tokens = int(usage["cache_write_tokens"])

        context.n_input_tokens = input_tokens + cache_read_tokens + cache_write_tokens
        context.n_cache_tokens = cache_read_tokens
        context.n_output_tokens = output_tokens

        actual_cost_usd = usage.get("actual_cost_usd")
        if isinstance(actual_cost_usd, float) and actual_cost_usd > 0:
            context.cost_usd = actual_cost_usd

        metadata = dict(context.metadata or {})
        metadata["native_usage"] = usage
        context.metadata = metadata

    @staticmethod
    def _build_config_yaml(
        model: str,
        *,
        provider: str | None = None,
        base_url: str | None = None,
        api_mode: str | None = None,
        key_env: str | None = None,
        providers: dict[str, dict[str, object]] | None = None,
    ) -> str:
        config_model: str | dict[str, object]
        if provider:
            config_model = {
                "default": model,
                "provider": provider,
                "context_length": 200000,
            }
            if base_url:
                config_model["base_url"] = base_url
            if api_mode:
                config_model["api_mode"] = api_mode
            if key_env:
                config_model["key_env"] = key_env
        else:
            config_model = model

        config_yaml = Hermes._build_config_yaml(model)
        if provider:
            payload = yaml.safe_load(config_yaml) or {}
            payload["model"] = config_model
            if providers:
                payload["providers"] = providers
            config_yaml = yaml.dump(payload, default_flow_style=False, sort_keys=False)
        toolsets_lines = ["toolsets:"]
        toolsets = ["hermes-cli"]
        return config_yaml.replace(
            "toolsets:\n- hermes-cli\n",
            "\n".join(toolsets_lines + [f"- {toolset}" for toolset in toolsets]) + "\n",
        )

    def _resolve_hermes_runtime(self) -> tuple[
        dict[str, str],
        str,
        str | None,
        dict[str, object],
    ]:
        if not self.model_name:
            raise ValueError("Model name must be set for Hermes runs")

        if "/" in self.model_name:
            provider, model = self.model_name.split("/", 1)
        else:
            provider = (self._get_env("HERMES_PROVIDER") or "openai").strip()
            model = self.model_name.strip()

        provider = provider.strip().lower()
        if provider == "openai-compatible":
            provider = "openai"
        if provider == "anthropic-compatible":
            provider = "anthropic"

        env: dict[str, str] = {
            "HERMES_HOME": "/tmp/hermes",
            "TERMINAL_ENV": "local",
        }
        hermes_provider_flag: str | None = None
        config_kwargs: dict[str, object] = {}

        def assign_key(source_key: str, target_key: str | None = None) -> str | None:
            source_value = self._get_env(source_key)
            if not source_value:
                return None
            env[target_key or source_key] = source_value
            self._extra_env[source_key] = source_value

        if provider == "anthropic":
            if not assign_key("ANTHROPIC_API_KEY"):
                raise ValueError("No API key found. Set ANTHROPIC_API_KEY for Hermes Anthropic-compatible runs.")
            if base_url := self._get_env("ANTHROPIC_BASE_URL"):
                env["ANTHROPIC_BASE_URL"] = base_url.strip().rstrip("/")
            hermes_provider_flag = "anthropic"
            cli_model = model
        elif provider == "openai":
            if not assign_key("OPENAI_API_KEY"):
                raise ValueError("No API key found. Set OPENAI_API_KEY for Hermes OpenAI-compatible runs.")
            openai_base_url = (self._get_env("OPENAI_BASE_URL") or "").strip().rstrip("/")
            if openai_base_url:
                env["OPENAI_BASE_URL"] = openai_base_url
                hermes_provider_flag = "openai-compatible"
                config_kwargs = {
                    "provider": "openai-compatible",
                    "base_url": openai_base_url,
                    "api_mode": "chat_completions",
                    "key_env": "OPENAI_API_KEY",
                    "providers": {
                        "openai-compatible": {
                            "name": "openai-compatible",
                            "base_url": openai_base_url,
                            "key_env": "OPENAI_API_KEY",
                            "transport": "chat_completions",
                            "models": {
                                model: {
                                    "context_length": 200000,
                                }
                            },
                        }
                    },
                }
            else:
                hermes_provider_flag = "openai"
            cli_model = model
        else:
            raise ValueError(
                "Unsupported Hermes provider. Use a model name prefixed with "
                "`openai/` or `anthropic/`, or set HERMES_PROVIDER to `openai` "
                "or `anthropic` for a bare model name."
            )

        env["HARBOR_INSTRUCTION"] = ""
        return env, cli_model, hermes_provider_flag, config_kwargs

    def _build_hermes_agent_command(
        self,
        *,
        instruction: str,
        cli_model: str,
        hermes_provider_flag: str | None,
        required_output_paths: list[str],
        expects_plan_artifact: bool,
        output_contract_mode: str,
    ) -> str:
        cli_parts = [
            'export PATH="$HOME/.local/bin:$PATH"',
            "hermes --yolo chat",
            '-q "$HARBOR_INSTRUCTION"',
            "-Q",
            f"--model {shlex.quote(cli_model)}",
        ]
        if hermes_provider_flag:
            cli_parts.append(f"--provider {shlex.quote(hermes_provider_flag)}")
        toolsets_flag = self._resolved_flags.get("toolsets")
        if toolsets_flag:
            cli_parts.append(f"--toolsets {shlex.quote(str(toolsets_flag))}")

        raw_command = f"{cli_parts[0]} && {' '.join(cli_parts[1:])} 2>&1 | stdbuf -oL cat"
        return build_valid_output_guard_command(
            raw_command=raw_command,
            output_log=EnvironmentPaths.agent_dir / "hermes.txt",
            contract_path=EnvironmentPaths.agent_dir / self._OUTPUT_CONTRACT_FILENAME,
            required_output_paths=required_output_paths,
            expects_plan_output=expects_plan_artifact,
            output_contract_mode=output_contract_mode,
            agent_kind="hermes",
            grace_env_var="HERMES_VALID_OUTPUT_GRACE_SEC",
            poll_env_var="HERMES_VALID_OUTPUT_POLL_SEC",
            plan_output_path=self._PLAN_OUTPUT_PATH,
            plan_artifact_path=self._PLAN_ARTIFACT_PATH,
            max_runtime_sec=self._primary_soft_timeout_sec(),
        )

    def _primary_soft_timeout_sec(self) -> int | None:
        raw = self._get_env("HERMES_PRIMARY_SOFT_TIMEOUT_SEC")
        if raw is None:
            raw = self._get_env("AIREADY_HERMES_PRIMARY_SOFT_TIMEOUT_SEC")
        if raw is None:
            return 1800
        try:
            value = int(float(raw))
        except (TypeError, ValueError):
            return 1800
        return value if value > 0 else None

    async def run(self, instruction: str, environment, context) -> None:
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

        await self.exec_as_agent(
            environment,
            command=self._runtime_preflight_command(),
        )

        agent_error: Exception | None = None
        try:
            env, cli_model, hermes_provider_flag, config_kwargs = self._resolve_hermes_runtime()
            env["HARBOR_INSTRUCTION"] = instruction
            config_yaml = self._build_config_yaml(cli_model, **config_kwargs)

            await self.exec_as_agent(
                environment,
                command=(
                    "mkdir -p /tmp/hermes && "
                    f"cat > /tmp/hermes/config.yaml << 'EOF'\n{config_yaml}EOF"
                ),
                env=env,
                timeout_sec=10,
            )

            mcp_command = self._build_register_mcp_servers_command()
            if mcp_command:
                await self.exec_as_agent(
                    environment,
                    command=mcp_command,
                    env=env,
                    timeout_sec=10,
                )

            skills_command = self._build_register_skills_command()
            if skills_command:
                await self.exec_as_agent(
                    environment,
                    command=skills_command,
                    env=env,
                    timeout_sec=10,
                )

            await self.exec_as_agent(
                environment,
                command=self._build_hermes_agent_command(
                    instruction=instruction,
                    cli_model=cli_model,
                    hermes_provider_flag=hermes_provider_flag,
                    required_output_paths=required_output_paths,
                    expects_plan_artifact=expects_plan_artifact,
                    output_contract_mode=output_contract_mode,
                ),
                env=env,
            )
        except Exception as exc:
            agent_error = exc
        finally:
            try:
                await self.exec_as_agent(
                    environment,
                    command=(
                        'export PATH="$HOME/.local/bin:$PATH" && '
                        "hermes sessions export /logs/agent/hermes-session.jsonl "
                        "--source cli 2>/dev/null || true"
                    ),
                    env={"HERMES_HOME": "/tmp/hermes"},
                    timeout_sec=30,
                )
            except Exception:
                pass

            try:
                await self.exec_as_agent(
                    environment,
                    command=(
                        "mkdir -p /logs/agent/hermes-internal && "
                        "cp -a /tmp/hermes/logs/. /logs/agent/hermes-internal/ "
                        "2>/dev/null || true"
                    ),
                    env={"HERMES_HOME": "/tmp/hermes"},
                    timeout_sec=10,
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

            output_valid = False
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
                    return
                except Exception:
                    pass
            if isinstance(agent_error, NonZeroAgentExitCodeError):
                raise agent_error
            raise agent_error
