from __future__ import annotations

import asyncio
import json
import os
import re
import shlex
import tarfile
import tempfile
import time
import urllib.parse
from pathlib import Path

from harbor.environments.base import ExecResult
from harbor.environments.docker.docker import (
    DockerEnvironment,
    _sanitize_docker_compose_project_name,
)


_ENV_KEY_RE = re.compile(r"^[A-Za-z_][A-Za-z0-9_]*$")

_FALSE_VALUES = {"0", "false", "no", "off", "disabled", "disable"}
_PROXY_KEYS = ("HTTP_PROXY", "HTTPS_PROXY", "ALL_PROXY")
_NO_PROXY_DEFAULT = (
    "localhost,127.0.0.1,::1,host.docker.internal,"
    "http.docker.internal,"
    "10.0.0.0/8,172.16.0.0/12,192.168.0.0/16,*.local"
)


class PrebuiltLocalDockerEnvironment(DockerEnvironment):
    """Docker environment for local prebuilt images.

    Two behaviors differ from Harbor's stock DockerEnvironment:

    1. Prebuilt images can use a configurable pull policy so the same runtime
       can support both local-only images and Harbor-backed images.
    2. Trial cleanup does not remove images, which prevents Harbor from deleting
       shared prebuilt task/final images between attempts.
    """

    @staticmethod
    def _prebuilt_pull_policy() -> str:
        raw = (os.environ.get("PREBUILT_IMAGE_PULL_POLICY") or "never").strip().lower()
        if raw in {"always", "never", "missing", "if_not_present"}:
            return raw
        return "never"

    @staticmethod
    def _env_enabled(name: str, *, default: bool = True) -> bool:
        raw = os.environ.get(name)
        if raw is None or raw == "":
            return default
        return raw.strip().lower() not in _FALSE_VALUES

    @staticmethod
    def _first_env(*names: str) -> str:
        for name in names:
            value = os.environ.get(name)
            if value and value.strip():
                return value.strip()
        return ""

    @classmethod
    def _container_proxy_host(cls) -> str:
        return cls._first_env("AIREADY_CONTAINER_PROXY_HOST") or "http.docker.internal"

    @classmethod
    def _rewrite_loopback_proxy_url(cls, raw: str) -> str:
        if not raw or not cls._env_enabled("AIREADY_CONTAINER_PROXY_REWRITE_LOOPBACK"):
            return raw
        try:
            parsed = urllib.parse.urlsplit(raw)
        except ValueError:
            return raw
        if parsed.hostname not in {"localhost", "127.0.0.1", "::1"}:
            return raw

        username = urllib.parse.quote(parsed.username or "", safe="")
        password = urllib.parse.quote(parsed.password or "", safe="")
        userinfo = ""
        if username:
            userinfo = username
            if password:
                userinfo += f":{password}"
            userinfo += "@"
        port = f":{parsed.port}" if parsed.port else ""
        netloc = f"{userinfo}{cls._container_proxy_host()}{port}"
        return urllib.parse.urlunsplit(
            (parsed.scheme, netloc, parsed.path, parsed.query, parsed.fragment)
        )

    @classmethod
    def _docker_desktop_proxy(cls) -> str:
        if not cls._env_enabled("AIREADY_CONTAINER_PROXY_DOCKER_DESKTOP_FALLBACK"):
            return ""
        return "http://http.docker.internal:3128"

    @staticmethod
    def _merge_no_proxy(*values: str) -> str:
        merged: list[str] = []
        seen: set[str] = set()
        for value in values:
            for item in value.split(","):
                normalized = item.strip()
                if normalized and normalized not in seen:
                    merged.append(normalized)
                    seen.add(normalized)
        return ",".join(merged)

    @classmethod
    def _container_proxy_env(cls) -> dict[str, str]:
        if not cls._env_enabled("AIREADY_CONTAINER_PROXY_ENABLED"):
            return {}

        generic_proxy = cls._first_env("AIREADY_CONTAINER_PROXY") or cls._docker_desktop_proxy()
        proxy_env: dict[str, str] = {}
        for key in _PROXY_KEYS:
            explicit = cls._first_env(f"AIREADY_CONTAINER_{key}")
            fallback = cls._first_env(key, key.lower())
            value = explicit or generic_proxy or fallback
            if value:
                proxy_env[key] = cls._rewrite_loopback_proxy_url(value)

        no_proxy = cls._first_env("AIREADY_CONTAINER_NO_PROXY", "NO_PROXY", "no_proxy")
        if proxy_env:
            proxy_env["NO_PROXY"] = cls._merge_no_proxy(no_proxy, _NO_PROXY_DEFAULT)

        lower_proxy_env = {key.lower(): value for key, value in proxy_env.items()}
        proxy_env.update(lower_proxy_env)
        return proxy_env

    @classmethod
    def _compose_proxy_environment(cls) -> dict[str, str]:
        return {
            key: f"${{AIREADY_EFFECTIVE_{key}}}"
            for key in cls._container_proxy_env()
        }

    @classmethod
    def _compose_proxy_process_env(cls) -> dict[str, str]:
        return {
            f"AIREADY_EFFECTIVE_{key}": value
            for key, value in cls._container_proxy_env().items()
        }

    def _write_local_prebuilt_compose_file(self) -> Path:
        service = {
            "image": self.task_env_config.docker_image,
            "pull_policy": self._prebuilt_pull_policy(),
            "command": ["sh", "-c", "sleep infinity"],
        }
        proxy_environment = self._compose_proxy_environment()
        if proxy_environment:
            service["environment"] = proxy_environment

        compose = {
            "services": {
                "main": service,
            }
        }
        path = self.trial_paths.trial_dir / "docker-compose-prebuilt-local.json"
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(compose, indent=2), encoding="utf-8")
        return path

    @staticmethod
    def _runtime_overlay_enabled() -> bool:
        return PrebuiltLocalDockerEnvironment._env_enabled(
            "AIREADY_RUNTIME_CODE_OVERLAY_ENABLED",
            default=True,
        )

    @staticmethod
    def _safe_tar_filter(info: tarfile.TarInfo) -> tarfile.TarInfo | None:
        parts = Path(info.name).parts
        if "__pycache__" in parts or ".git" in parts:
            return None
        if info.name.endswith((".pyc", ".pyo")):
            return None
        return info

    @classmethod
    def _runtime_overlay_sources(cls) -> list[Path]:
        root = Path(__file__).resolve().parents[1]
        return [
            root / "agents",
            root / "environments",
            root / "tools" / "output_contract.py",
        ]

    async def _copy_runtime_overlay_into_container(self, container_id: str) -> None:
        if not self._runtime_overlay_enabled():
            return
        if getattr(self, "_aiready_runtime_overlay_container_id", None) == container_id:
            return
        sources = [source for source in self._runtime_overlay_sources() if source.exists()]
        if not sources:
            return
        with tempfile.NamedTemporaryFile(prefix="aiready-runtime-overlay-", suffix=".tar") as handle:
            with tarfile.open(fileobj=handle, mode="w") as archive:
                for source in sources:
                    archive.add(
                        source,
                        arcname=source.name,
                        filter=self._safe_tar_filter,
                    )
            handle.flush()
            process = await asyncio.create_subprocess_exec(
                "docker",
                "cp",
                handle.name,
                f"{container_id}:/tmp/aiready-runtime-overlay.tar",
                stdin=asyncio.subprocess.DEVNULL,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.STDOUT,
            )
            stdout_bytes, _ = await process.communicate()
            if process.returncode:
                stdout = stdout_bytes.decode(errors="replace") if stdout_bytes else ""
                raise RuntimeError(f"Failed to copy runtime overlay into container: {stdout}")
        process = await asyncio.create_subprocess_exec(
            "docker",
            "exec",
            container_id,
            "bash",
            "-lc",
            "tar -xf /tmp/aiready-runtime-overlay.tar -C /root && rm -f /tmp/aiready-runtime-overlay.tar",
            stdin=asyncio.subprocess.DEVNULL,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
        )
        stdout_bytes, _ = await process.communicate()
        if process.returncode:
            stdout = stdout_bytes.decode(errors="replace") if stdout_bytes else ""
            raise RuntimeError(f"Failed to unpack runtime overlay: {stdout}")
        self._aiready_runtime_overlay_container_id = container_id

    def _compose_command(self, command: list[str]) -> list[str]:
        full_command = [
            "docker",
            "compose",
            "--project-name",
            _sanitize_docker_compose_project_name(self.session_id),
            "--project-directory",
            str(self.environment_dir.resolve().absolute()),
        ]
        for path in self._docker_compose_paths:
            full_command.extend(["-f", str(path.resolve().absolute())])
        full_command.extend(command)
        return full_command

    async def _run_docker_compose_command(
        self, command: list[str], check: bool = True, timeout_sec: int | None = None
    ) -> ExecResult:
        full_command = self._compose_command(command)

        env = self._env_vars.to_env_dict(include_os_env=True)
        if self._compose_task_env:
            env.update(self._compose_task_env)
        if self._persistent_env:
            env.update(self._persistent_env)
        env.update(self._compose_proxy_process_env())
        if self._windows_container_name:
            env["HARBOR_CONTAINER_NAME"] = self._windows_container_name

        process = await asyncio.create_subprocess_exec(
            *full_command,
            env=env,
            stdin=asyncio.subprocess.DEVNULL,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
        )

        try:
            if timeout_sec:
                stdout_bytes, stderr_bytes = await asyncio.wait_for(
                    process.communicate(), timeout=timeout_sec
                )
            else:
                stdout_bytes, stderr_bytes = await process.communicate()
        except asyncio.TimeoutError:
            process.terminate()
            try:
                stdout_bytes, stderr_bytes = await asyncio.wait_for(
                    process.communicate(), timeout=5
                )
            except asyncio.TimeoutError:
                process.kill()
                stdout_bytes, stderr_bytes = await process.communicate()
            raise RuntimeError(f"Command timed out after {timeout_sec} seconds")

        stdout = stdout_bytes.decode(errors="replace") if stdout_bytes else None
        stderr = stderr_bytes.decode(errors="replace") if stderr_bytes else None
        result = ExecResult(stdout=stdout, stderr=stderr, return_code=process.returncode or 0)

        if check and result.return_code != 0:
            raise RuntimeError(
                f"Docker compose command failed for environment {self.environment_name}. "
                f"Command: {' '.join(full_command)}. "
                f"Return code: {result.return_code}. "
                f"Stdout: {result.stdout}. "
                f"Stderr: {result.stderr}. "
            )

        return result

    async def start(self, force_build: bool):
        if self._mounts_json:
            self._mounts_compose_path = self._write_mounts_compose_file()

        self._use_prebuilt = not force_build and self.task_env_config.docker_image
        self._validate_daemon_mode()

        if not self._use_prebuilt:
            await super().start(force_build=force_build)
            return

        image_to_check = self.task_env_config.docker_image
        if image_to_check:
            await self._validate_image_os(image_to_check)

        try:
            await self._run_docker_compose_command(["down", "--remove-orphans"])
        except RuntimeError:
            pass

        start_timeout = int(os.environ.get("AIREADY_DOCKER_COMPOSE_UP_TIMEOUT_SEC") or "600")
        await self._run_docker_compose_command(["up", "--detach"], timeout_sec=start_timeout)
        await self._run_docker_compose_command(["start"], check=False, timeout_sec=120)
        await self._wait_for_main_container_running()

        if not self._is_windows_container:
            await self.exec(
                f"chmod 777 {self._env_paths.agent_dir} {self._env_paths.verifier_dir}"
            )

    async def _resolve_main_container_id(self) -> str:
        result = await self._run_docker_compose_command(
            ["ps", "-q", "main"],
            check=True,
            timeout_sec=30,
        )
        container_id = (result.stdout or "").strip().splitlines()[0] if result.stdout else ""
        if not container_id:
            raise RuntimeError(f"Could not resolve main container for {self.environment_name}")
        return container_id

    async def _wait_for_main_container_running(self) -> None:
        deadline = time.monotonic() + int(os.environ.get("AIREADY_DOCKER_START_WAIT_SEC") or "180")
        container_id = await self._resolve_main_container_id()
        last_output = ""
        while time.monotonic() < deadline:
            process = await asyncio.create_subprocess_exec(
                "docker",
                "inspect",
                "--format",
                "{{.State.Running}} {{.State.Status}} {{.State.Error}}",
                container_id,
                env=os.environ.copy(),
                stdin=asyncio.subprocess.DEVNULL,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.STDOUT,
            )
            stdout_bytes, _ = await process.communicate()
            last_output = stdout_bytes.decode(errors="replace").strip() if stdout_bytes else ""
            if process.returncode == 0 and last_output.split(" ", 1)[0] == "true":
                return
            await self._run_docker_compose_command(["start"], check=False, timeout_sec=30)
            await asyncio.sleep(1)
        raise RuntimeError(
            f"Timed out waiting for main container to run for {self.environment_name}: "
            f"{last_output}"
        )

    async def _main_container_id(self) -> str:
        container_id = await self._resolve_main_container_id()
        await self._copy_runtime_overlay_into_container(container_id)
        return container_id

    @staticmethod
    def _export_script(env: dict[str, str] | None) -> str:
        if not env:
            return ""

        lines: list[str] = []
        for key, value in env.items():
            if not _ENV_KEY_RE.match(str(key)):
                raise ValueError(f"Invalid environment variable name for docker exec: {key!r}")
            if "\x00" in str(value):
                raise ValueError(f"Environment variable {key!r} contains a NUL byte")
            lines.append(f"export {key}={shlex.quote(str(value))}")
        return "\n".join(lines) + "\n"

    async def exec(
        self,
        command: str,
        cwd: str | None = None,
        env: dict[str, str] | None = None,
        timeout_sec: int | None = None,
        user: str | int | None = None,
    ) -> ExecResult:
        """Execute inside the prebuilt container without leaking env values in argv.

        Harbor's stock DockerEnvironment uses:

            docker compose exec -e KEY=value ...

        That is functional, but the full command line is visible to local
        process-list tools while a trial is running. Formal runs often pass
        short-lived per-trial credentials, so keep those values off argv by
        sending env exports and the command body to ``docker exec`` over stdin.
        """

        user = self._resolve_user(user)
        proxy_env = self._container_proxy_env()
        merged_env = self._merge_env(env)
        if proxy_env:
            merged_env = {**proxy_env, **(merged_env or {})}
        container_id = await self._main_container_id()

        docker_command = ["docker", "exec", "-i"]
        effective_cwd = cwd or self.task_env_config.workdir
        if effective_cwd:
            docker_command.extend(["-w", effective_cwd])
        if user is not None:
            docker_command.extend(["-u", str(user)])
        docker_command.extend([container_id, "bash", "-s"])

        script = self._export_script(merged_env) + command
        if not script.endswith("\n"):
            script += "\n"

        process = await asyncio.create_subprocess_exec(
            *docker_command,
            env=os.environ.copy(),
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.STDOUT,
        )

        try:
            if timeout_sec:
                stdout_bytes, stderr_bytes = await asyncio.wait_for(
                    process.communicate(script.encode("utf-8")), timeout=timeout_sec
                )
            else:
                stdout_bytes, stderr_bytes = await process.communicate(script.encode("utf-8"))
        except asyncio.TimeoutError:
            process.terminate()
            try:
                stdout_bytes, stderr_bytes = await asyncio.wait_for(
                    process.communicate(), timeout=5
                )
            except asyncio.TimeoutError:
                process.kill()
                stdout_bytes, stderr_bytes = await process.communicate()
            raise RuntimeError(f"Command timed out after {timeout_sec} seconds")

        stdout = stdout_bytes.decode(errors="replace") if stdout_bytes else None
        stderr = stderr_bytes.decode(errors="replace") if stderr_bytes else None
        return ExecResult(stdout=stdout, stderr=stderr, return_code=process.returncode or 0)

    @property
    def _docker_compose_paths(self) -> list[Path]:
        if not self._use_prebuilt:
            return super()._docker_compose_paths

        local_prebuilt_path = self._write_local_prebuilt_compose_file()
        paths = [self._DOCKER_COMPOSE_BASE_PATH, local_prebuilt_path]

        if self._environment_docker_compose_path.exists():
            paths.append(self._environment_docker_compose_path)

        if self._mounts_compose_path:
            paths.append(self._mounts_compose_path)

        if not self.task_env_config.allow_internet:
            paths.append(self._DOCKER_COMPOSE_NO_NETWORK_PATH)

        return paths

    async def stop(self, delete: bool):
        await self.prepare_logs_for_host()

        if self._keep_containers:
            try:
                await self._run_docker_compose_command(["stop"])
            except Exception as exc:
                self.logger.warning(f"Docker compose stop failed: {exc}")
            return

        try:
            await self._run_docker_compose_command(["down", "--volumes", "--remove-orphans"])
        except Exception as exc:
            self.logger.warning(f"Docker compose down failed: {exc}")
