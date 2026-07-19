#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import shutil
import subprocess
import sys
from collections.abc import Iterable


DEFAULT_NETWORKS = {"bridge", "host", "none"}
REMOVABLE_CONTAINER_STATES = ("created", "exited", "dead")
FALSE_VALUES = {"0", "false", "no", "off", "disabled", "disable"}
DOCKER_PATH_PREFIX = "/usr/local/bin:/opt/homebrew/bin:/Applications/Docker.app/Contents/Resources/bin"


def ensure_docker_path() -> None:
    parts = os.environ.get("PATH", "").split(":")
    prefix_parts = DOCKER_PATH_PREFIX.split(":")
    merged = prefix_parts + [part for part in parts if part and part not in prefix_parts]
    os.environ["PATH"] = ":".join(merged)


def env_enabled(name: str, *, default: bool = True) -> bool:
    raw = os.environ.get(name)
    if raw is None or raw == "":
        return default
    return raw.strip().lower() not in FALSE_VALUES


def run(command: list[str]) -> subprocess.CompletedProcess[str]:
    if command and command[0] == "docker":
        docker_path = shutil.which("docker")
        if docker_path:
            command = [docker_path, *command[1:]]
    return subprocess.run(command, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)


def docker_available() -> bool:
    result = run(["docker", "version", "--format", "{{.Server.Version}}"])
    return result.returncode == 0


def list_lines(command: list[str]) -> list[str]:
    result = run(command)
    if result.returncode != 0:
        return []
    return [line.strip() for line in result.stdout.splitlines() if line.strip()]


def inspect_one(kind: str, name: str) -> dict:
    result = run(["docker", kind, "inspect", name])
    if result.returncode != 0:
        return {}
    try:
        payload = json.loads(result.stdout)
    except json.JSONDecodeError:
        return {}
    if not payload:
        return {}
    return payload[0] if isinstance(payload, list) else payload


def cleanup_compose_containers() -> tuple[int, list[str]]:
    container_ids: set[str] = set()
    for state in REMOVABLE_CONTAINER_STATES:
        container_ids.update(
            list_lines(
                [
                    "docker",
                    "ps",
                    "-aq",
                    "--filter",
                    "label=com.docker.compose.project",
                    "--filter",
                    f"status={state}",
                ]
            )
        )

    removed: list[str] = []
    for container_id in sorted(container_ids):
        result = run(["docker", "rm", container_id])
        if result.returncode != 0:
            result = run(["docker", "rm", "-f", container_id])
        if result.returncode == 0:
            removed.append(container_id)
    return len(removed), removed


def cleanup_matching_containers(
    *,
    image_contains: Iterable[str],
    remove_running: bool,
) -> tuple[int, list[str]]:
    needles = [item for item in image_contains if item]
    if not needles:
        return 0, []

    result = run(
        [
            "docker",
            "ps",
            "-a",
            "--format",
            "{{json .}}",
        ]
    )
    if result.returncode != 0:
        return 0, []

    container_ids: set[str] = set()
    for line in result.stdout.splitlines():
        if not line.strip():
            continue
        try:
            row = json.loads(line)
        except json.JSONDecodeError:
            continue
        image = str(row.get("Image") or "")
        state = str(row.get("State") or "").lower()
        if not any(needle in image for needle in needles):
            continue
        if not remove_running and state not in REMOVABLE_CONTAINER_STATES:
            continue
        container_id = str(row.get("ID") or "").strip()
        if container_id:
            container_ids.add(container_id)

    removed: list[str] = []
    for container_id in sorted(container_ids):
        result = run(["docker", "rm", "-f", container_id])
        if result.returncode == 0:
            removed.append(container_id)
    return len(removed), removed


def cleanup_unused_networks(*, compose_only: bool) -> tuple[int, list[str]]:
    removed: list[str] = []
    for network_name in list_lines(["docker", "network", "ls", "--format", "{{.Name}}"]):
        if network_name in DEFAULT_NETWORKS:
            continue
        network = inspect_one("network", network_name)
        if not network:
            continue
        containers = network.get("Containers") or {}
        if containers:
            continue
        labels = network.get("Labels") or {}
        if compose_only and "com.docker.compose.project" not in labels:
            continue
        result = run(["docker", "network", "rm", network_name])
        if result.returncode == 0:
            removed.append(network_name)
    return len(removed), removed


def main(argv: list[str] | None = None) -> int:
    ensure_docker_path()
    parser = argparse.ArgumentParser(description="Best-effort Docker runtime cleanup.")
    parser.add_argument("--reason", default="manual")
    parser.add_argument("--json", action="store_true")
    parser.add_argument(
        "--image-contains",
        action="append",
        default=[],
        help="Remove Docker containers whose image string contains this value.",
    )
    parser.add_argument(
        "--remove-running-matched",
        action="store_true",
        help="Allow --image-contains cleanup to remove running matched containers.",
    )
    args = parser.parse_args(argv)

    if not env_enabled("AIREADY_DOCKER_RUNTIME_CLEANUP", default=True):
        payload = {
            "reason": args.reason,
            "status": "disabled",
            "removed_containers": 0,
            "removed_matched_containers": 0,
            "removed_networks": 0,
        }
    elif not docker_available():
        payload = {
            "reason": args.reason,
            "status": "docker-unavailable",
            "removed_containers": 0,
            "removed_matched_containers": 0,
            "removed_networks": 0,
        }
    else:
        matched_count, matched_containers = cleanup_matching_containers(
            image_contains=args.image_contains,
            remove_running=args.remove_running_matched,
        )
        container_count, containers = cleanup_compose_containers()
        compose_only = not env_enabled("AIREADY_DOCKER_CLEANUP_ALL_UNUSED_NETWORKS", default=True)
        network_count, networks = cleanup_unused_networks(compose_only=compose_only)
        payload = {
            "reason": args.reason,
            "status": "ok",
            "removed_containers": container_count,
            "removed_matched_containers": matched_count,
            "removed_networks": network_count,
            "matched_containers_sample": matched_containers[:8],
            "containers_sample": containers[:8],
            "networks_sample": networks[:8],
        }

    if args.json:
        print(json.dumps(payload, ensure_ascii=False))
    else:
        print(
            "[docker-cleanup] "
            f"reason={payload['reason']} "
            f"status={payload['status']} "
            f"removed_containers={payload['removed_containers']} "
            f"removed_matched_containers={payload.get('removed_matched_containers', 0)} "
            f"removed_networks={payload['removed_networks']}"
        )
        if payload.get("matched_containers_sample"):
            print("[docker-cleanup] matched_containers_sample=" + ",".join(payload["matched_containers_sample"]))
        if payload.get("networks_sample"):
            print("[docker-cleanup] networks_sample=" + ",".join(payload["networks_sample"]))
        if payload.get("containers_sample"):
            print("[docker-cleanup] containers_sample=" + ",".join(payload["containers_sample"]))

    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
