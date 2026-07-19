#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

source .venv/bin/activate
source tools/formal_env.sh

CRANE_BIN="${CRANE_BIN:-${ROOT_DIR}/.tools/bin/crane}"
CRANE_PUSH_TIMEOUT_SEC="${CRANE_PUSH_TIMEOUT_SEC:-0}"
DOCKER_PUSH_RETRIES="${DOCKER_PUSH_RETRIES:-3}"
DOCKER_PUSH_SLEEP_SEC="${DOCKER_PUSH_SLEEP_SEC:-8}"
PUSH_MODE="${PUSH_MODE:-docker-first}"

if [[ ! -x "${CRANE_BIN}" ]]; then
  echo "Missing crane binary: ${CRANE_BIN}" >&2
  exit 1
fi

if [[ $# -ne 2 ]]; then
  echo "Usage: bash tools/push_local_image_to_harbor_via_crane.sh <local-image> <remote-image>" >&2
  exit 1
fi

LOCAL_IMAGE="$1"
REMOTE_IMAGE="$2"
TMP_DIR="$(mktemp -d /tmp/crane-push-image.XXXXXX)"
TAR_PATH="${TMP_DIR}/image.tar"
DOCKER_CONFIG_DIR="${TMP_DIR}/docker-config"

cleanup() {
  rm -rf "${TMP_DIR}"
}
trap cleanup EXIT

mkdir -p "${DOCKER_CONFIG_DIR}"
AUTH_B64="$(
  printf '%s:%s' "${HARBOR_USERNAME}" "${HARBOR_PASSWORD}" | base64 | tr -d '\n'
)"
cat >"${DOCKER_CONFIG_DIR}/config.json" <<EOF
{
  "auths": {
    "${HARBOR_REGISTRY}": {
      "auth": "${AUTH_B64}"
    }
  }
}
EOF
export DOCKER_CONFIG="${DOCKER_CONFIG_DIR}"

docker image inspect "${LOCAL_IMAGE}" >/dev/null 2>&1

docker_push_remote() {
  local local_image="$1"
  local remote_image="$2"
  local attempt

  docker tag "${local_image}" "${remote_image}"
  for (( attempt=1; attempt<=DOCKER_PUSH_RETRIES; attempt++ )); do
    echo "[push] docker push attempt ${attempt}/${DOCKER_PUSH_RETRIES}: ${remote_image}"
    if docker push "${remote_image}"; then
      echo "Pushed via docker push:"
      echo "  local  = ${local_image}"
      echo "  remote = ${remote_image}"
      return 0
    fi
    if [[ "${attempt}" -lt "${DOCKER_PUSH_RETRIES}" ]]; then
      sleep "${DOCKER_PUSH_SLEEP_SEC}"
    fi
  done
  return 1
}

crane_push_remote() {
  local local_image="$1"
  local remote_image="$2"

  docker save -o "${TAR_PATH}" "${local_image}"

  if [[ "${CRANE_PUSH_TIMEOUT_SEC}" =~ ^[1-9][0-9]*$ ]]; then
    python3 - "${CRANE_BIN}" "${TAR_PATH}" "${remote_image}" "${CRANE_PUSH_TIMEOUT_SEC}" <<'PY'
import subprocess
import sys

crane_bin, tar_path, remote_image, timeout_sec = sys.argv[1:]
timeout_sec = int(timeout_sec)

try:
    completed = subprocess.run(
        [crane_bin, "push", tar_path, remote_image],
        check=False,
        timeout=timeout_sec,
    )
except subprocess.TimeoutExpired:
    print(
        f"crane push timed out after {timeout_sec}s: {remote_image}",
        file=sys.stderr,
    )
    raise SystemExit(124)

raise SystemExit(completed.returncode)
PY
  else
    "${CRANE_BIN}" push "${TAR_PATH}" "${remote_image}"
  fi

  echo "Pushed via crane:"
  echo "  local  = ${local_image}"
  echo "  remote = ${remote_image}"
}

case "${PUSH_MODE}" in
  docker-only)
    docker_push_remote "${LOCAL_IMAGE}" "${REMOTE_IMAGE}"
    ;;
  crane-only)
    crane_push_remote "${LOCAL_IMAGE}" "${REMOTE_IMAGE}"
    ;;
  docker-first)
    if ! docker_push_remote "${LOCAL_IMAGE}" "${REMOTE_IMAGE}"; then
      echo "[push] docker push failed for ${REMOTE_IMAGE}; falling back to crane" >&2
      crane_push_remote "${LOCAL_IMAGE}" "${REMOTE_IMAGE}"
    fi
    ;;
  *)
    echo "Unsupported PUSH_MODE: ${PUSH_MODE}" >&2
    exit 1
    ;;
esac
