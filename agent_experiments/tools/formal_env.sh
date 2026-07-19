#!/usr/bin/env bash
set -euo pipefail

# Load local environment variables for AIREADY runs.
# This script is intended to be sourced:
#   source tools/formal_env.sh

__FORMAL_ENV_RESTORE_XTRACE=0
case "$-" in
  *x*)
    __FORMAL_ENV_RESTORE_XTRACE=1
    set +x
    ;;
esac

# Non-interactive macOS SSH shells may omit /usr/local/bin and /opt/homebrew/bin,
# which hides Docker.app's CLI shim and makes Docker Compose fall back incorrectly.
case ":${PATH:-}:" in
  *:/usr/local/bin:*) ;;
  *) export PATH="/usr/local/bin:${PATH:-}" ;;
esac
case ":${PATH:-}:" in
  *:/opt/homebrew/bin:*) ;;
  *) export PATH="/opt/homebrew/bin:${PATH:-}" ;;
esac
case ":${PATH:-}:" in
  *:/Applications/Docker.app/Contents/Resources/bin:*) ;;
  *) export PATH="/Applications/Docker.app/Contents/Resources/bin:${PATH:-}" ;;
esac

formal_ensure_docker_cli_plugins() {
  local docker_config="${DOCKER_CONFIG:-}"
  [[ -n "${docker_config}" ]] || return 0
  local plugin_dir="${docker_config}/cli-plugins"
  mkdir -p "${plugin_dir}" 2>/dev/null || return 0
  local plugin source_path target_path
  for plugin in docker-compose docker-buildx; do
    target_path="${plugin_dir}/${plugin}"
    [[ -e "${target_path}" ]] && continue
    for source_path in \
      "${HOME}/.docker/cli-plugins/${plugin}" \
      "/Applications/Docker.app/Contents/Resources/cli-plugins/${plugin}"
    do
      if [[ -x "${source_path}" ]]; then
        [[ "${source_path}" == "${target_path}" ]] && break
        ln -sf "${source_path}" "${target_path}" 2>/dev/null || true
        break
      fi
    done
  done
}

formal_ensure_docker_cli_plugins

formal_ensure_docker_harbor_auth() {
  local docker_config="${DOCKER_CONFIG:-}"
  [[ -n "${docker_config}" ]] || return 0
  [[ -n "${HARBOR_REGISTRY:-}" && -n "${HARBOR_USERNAME:-}" && -n "${HARBOR_PASSWORD:-}" ]] || return 0
  mkdir -p "${docker_config}" 2>/dev/null || return 0
  local auth
  auth="$(printf '%s:%s' "${HARBOR_USERNAME}" "${HARBOR_PASSWORD}" | base64 | tr -d '\n')" || return 0
  python3 - "${docker_config}/config.json" "${HARBOR_REGISTRY}" "${auth}" <<'PY' 2>/dev/null || true
import json
import sys
from pathlib import Path

path = Path(sys.argv[1])
registry = sys.argv[2]
auth = sys.argv[3]
try:
    payload = json.loads(path.read_text(encoding="utf-8")) if path.exists() else {}
except Exception:
    payload = {}
payload.pop("credsStore", None)
payload.pop("credHelpers", None)
payload.setdefault("auths", {})[registry] = {"auth": auth}
path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
PY
}

formal_load_env_file() {
  local env_file="$1"
  local line key value
  while IFS= read -r line || [[ -n "${line}" ]]; do
    line="${line%$'\r'}"
    [[ -n "${line//[[:space:]]/}" ]] || continue
    [[ "${line}" =~ ^[[:space:]]*# ]] && continue
    [[ "${line}" == *"="* ]] || continue
    key="${line%%=*}"
    value="${line#*=}"
    key="${key#"${key%%[![:space:]]*}"}"
    key="${key%"${key##*[![:space:]]}"}"
    value="${value#"${value%%[![:space:]]*}"}"
    value="${value%"${value##*[![:space:]]}"}"
    if [[ "${value}" == \"*\" && "${value}" == *\" ]]; then
      value="${value:1:${#value}-2}"
    elif [[ "${value}" == \'*\' && "${value}" == *\' ]]; then
      value="${value:1:${#value}-2}"
    fi
    if [[ ! "${key}" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
      continue
    fi
    export "${key}=${value}"
  done < "${env_file}"
}

if [[ -f ".env" ]]; then
  formal_load_env_file ".env"
elif [[ -f ".env.example" ]]; then
  formal_load_env_file ".env.example"
fi

formal_ensure_docker_cli_plugins

# Keep registry credentials explicit. Public packages should not depend on
# private aliases or machine-local environment conventions.
export HARBOR_REGISTRY="${HARBOR_REGISTRY:-}"
export HARBOR_USERNAME="${HARBOR_USERNAME:-}"
export HARBOR_PASSWORD="${HARBOR_PASSWORD:-}"
formal_ensure_docker_harbor_auth

# Generic runtime defaults. Provider-specific endpoints and keys should come
# from generated configs and the private .env file, not from this loader.
export OPENAI_API_KEY="${OPENAI_API_KEY:-}"
export OPENAI_BASE_URL="${OPENAI_BASE_URL:-}"
export PREBUILT_IMAGE_PULL_POLICY="${PREBUILT_IMAGE_PULL_POLICY:-missing}"
export AIREADY_CONTAINER_PROXY_ENABLED="${AIREADY_CONTAINER_PROXY_ENABLED:-1}"
export AIREADY_CONTAINER_PROXY_DOCKER_DESKTOP_FALLBACK="${AIREADY_CONTAINER_PROXY_DOCKER_DESKTOP_FALLBACK:-1}"
export AIREADY_CONTAINER_PROXY_HOST="${AIREADY_CONTAINER_PROXY_HOST:-http.docker.internal}"
export AIREADY_DOCKER_COMPOSE_UP_TIMEOUT_SEC="${AIREADY_DOCKER_COMPOSE_UP_TIMEOUT_SEC:-600}"
export AIREADY_DOCKER_START_WAIT_SEC="${AIREADY_DOCKER_START_WAIT_SEC:-240}"

# AICHEM / 303 endpoints for agent-invoked skills only.
# The harness does not perform post-run submission or task creation.
export AUTH_SERVICE_URL="${AUTH_SERVICE_URL:-${AICHEM_CLOUD_GATEWAY:-}}"
export AICHEM_CLOUD_GATEWAY="${AICHEM_CLOUD_GATEWAY:-${AUTH_SERVICE_URL:-}}"
export AICHEM_APP_TOKEN="${AICHEM_APP_TOKEN:-}"
export WORKFLOW_SERVICE_URL="${WORKFLOW_SERVICE_URL:-}"
export AICHEM_TARGET_APP_LABEL="${AICHEM_TARGET_APP_LABEL:-303Lab}"
export AICHEM_TIMEOUT_SEC="${AICHEM_TIMEOUT_SEC:-60}"

if [[ "${__FORMAL_ENV_RESTORE_XTRACE}" == "1" ]]; then
  set -x
fi
unset __FORMAL_ENV_RESTORE_XTRACE
unset -f formal_load_env_file
unset -f formal_ensure_docker_harbor_auth
unset -f formal_ensure_docker_cli_plugins
