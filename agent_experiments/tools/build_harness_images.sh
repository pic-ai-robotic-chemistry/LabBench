#!/usr/bin/env bash
set -euo pipefail

REGISTRY_PREFIX="${REGISTRY_PREFIX:-}"
BASE_TAG="${BASE_TAG:-v1}"
PUSH_METHOD="${PUSH_METHOD:-auto}"
CODEX_VERSION="${CODEX_VERSION:-latest}"
CLAUDE_CODE_VERSION="${CLAUDE_CODE_VERSION:-latest}"
GEMINI_CLI_VERSION="${GEMINI_CLI_VERSION:-0.43.0}"
HERMES_VERSION="${HERMES_VERSION:-main}"
KILO_CODE_VERSION="${KILO_CODE_VERSION:-7.3.1}"
OPENCLAW_VERSION="${OPENCLAW_VERSION:-2026.4.15}"
HARNESSES="${HARNESSES:-claude-code codex gemini-cli hermes kilo-code openclaw}"
PUSH="${PUSH:-0}"
HARBOR_REGISTRY="${HARBOR_REGISTRY:-}"
HARBOR_USERNAME="${HARBOR_USERNAME:-}"
HARBOR_PASSWORD="${HARBOR_PASSWORD:-}"
FORCE_REBUILD="${FORCE_REBUILD:-0}"
SKIP_REMOTE_EXISTING="${SKIP_REMOTE_EXISTING:-1}"
DOCKER_PLATFORM="${DOCKER_PLATFORM:-linux/arm64}"
UBUNTU_APT_MIRROR="${UBUNTU_APT_MIRROR:-}"
VALIDATE_HARNESS_IMAGES="${VALIDATE_HARNESS_IMAGES:-1}"
PROGRESS_SCOPE="${PROGRESS_SCOPE:-publish}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ -f "${ROOT_DIR}/tools/formal_env.sh" ]]; then
  source "${ROOT_DIR}/tools/formal_env.sh"
fi

if [[ -z "${REGISTRY_PREFIX}" ]]; then
  echo "REGISTRY_PREFIX is required, for example:" >&2
  echo "  REGISTRY_PREFIX=registry.example.com/skillsomething" >&2
  exit 1
fi

registry_host_from_prefix() {
  local prefix="$1"
  local head="${prefix%%/*}"
  if [[ "${head}" == *.* || "${head}" == *:* || "${head}" == "localhost" ]]; then
    printf '%s\n' "${head}"
    return 0
  fi
  return 1
}

docker_login_if_configured() {
  local registry_host
  if ! registry_host="$(registry_host_from_prefix "${REGISTRY_PREFIX}")"; then
    return 0
  fi

  if [[ -z "${HARBOR_REGISTRY}" || -z "${HARBOR_USERNAME}" || -z "${HARBOR_PASSWORD}" ]]; then
    return 0
  fi

  if [[ "${registry_host}" != "${HARBOR_REGISTRY}" ]]; then
    return 0
  fi

  printf '%s' "${HARBOR_PASSWORD}" | docker login "${registry_host}" -u "${HARBOR_USERNAME}" --password-stdin >/dev/null
}

docker_push_with_retry() {
  local image="$1"
  local max_attempts="${DOCKER_PUSH_MAX_ATTEMPTS:-5}"
  local base_sleep_sec="${DOCKER_PUSH_RETRY_SLEEP_SEC:-5}"
  local attempt=1

  while (( attempt <= max_attempts )); do
    docker_login_if_configured
    if docker push "${image}"; then
      return 0
    fi

    if (( attempt == max_attempts )); then
      echo "Push failed for ${image} after ${attempt} attempts." >&2
      return 1
    fi

    echo "Push attempt ${attempt}/${max_attempts} failed for ${image}; retrying after re-login..." >&2
    sleep "$(( base_sleep_sec * attempt ))"
    attempt=$((attempt + 1))
  done
}

push_image_with_fallback() {
  local image="$1"
  local push_method="${PUSH_METHOD}"

  case "${push_method}" in
    docker)
      docker_push_with_retry "${image}"
      ;;
    crane)
      bash "${ROOT_DIR}/tools/push_local_image_to_harbor_via_crane.sh" "${image}" "${image}"
      ;;
    auto)
      if docker_push_with_retry "${image}"; then
        return 0
      fi
      echo "docker push failed for ${image}; falling back to crane" >&2
      bash "${ROOT_DIR}/tools/push_local_image_to_harbor_via_crane.sh" "${image}" "${image}"
      ;;
    *)
      echo "Unsupported PUSH_METHOD: ${push_method}" >&2
      return 1
      ;;
  esac
}

docker_build_with_retry() {
  local max_attempts="${DOCKER_BUILD_MAX_ATTEMPTS:-4}"
  local base_sleep_sec="${DOCKER_BUILD_RETRY_SLEEP_SEC:-10}"
  local attempt=1

  while (( attempt <= max_attempts )); do
    if docker build "${@:1}"; then
      return 0
    fi

    if (( attempt == max_attempts )); then
      echo "Build failed after ${attempt} attempts." >&2
      return 1
    fi

    echo "Build attempt ${attempt}/${max_attempts} failed; retrying..." >&2
    sleep "$(( base_sleep_sec * attempt ))"
    attempt=$((attempt + 1))
  done
}

local_image_exists() {
  local image="$1"
  docker image inspect "${image}" >/dev/null 2>&1
}

validate_harness_image() {
  local harness="$1"
  local image="$2"
  local report_path="runtime-state/reports/image-validation-harness-${harness}.json"
      python3 tools/validate_built_image.py \
    --image "${image}" \
    --kind harness \
    --harness "${harness}" \
    --platform "${DOCKER_PLATFORM}" \
    --report-out "${report_path}"
}

remote_image_exists() {
  local image="$1"
  docker manifest inspect "${image}" >/dev/null 2>&1
}

base_image="${REGISTRY_PREFIX}/base-runtime:${BASE_TAG}"

if [[ -n "${RUN_ID:-}" ]]; then
  python3 tools/runtime_progress.py update \
    --scope "${PROGRESS_SCOPE}" \
    --run-id "${RUN_ID}" \
    --status running \
    --phase build-base \
    --message "building base image" \
    --current-item "${base_image}"
fi

if [[ "${FORCE_REBUILD}" == "1" ]]; then
  docker_build_with_retry \
    --platform "${DOCKER_PLATFORM}" \
    -f images/base/Dockerfile \
    --build-arg "UBUNTU_APT_MIRROR=${UBUNTU_APT_MIRROR}" \
    -t "${base_image}" \
    .
elif local_image_exists "${base_image}"; then
  echo "Reusing local base image: ${base_image}"
elif [[ "${SKIP_REMOTE_EXISTING}" == "1" ]] && remote_image_exists "${base_image}"; then
  echo "Remote base image already exists, skipping local build: ${base_image}"
else
  docker_build_with_retry \
    --platform "${DOCKER_PLATFORM}" \
    -f images/base/Dockerfile \
    --build-arg "UBUNTU_APT_MIRROR=${UBUNTU_APT_MIRROR}" \
    -t "${base_image}" \
    .
fi

if [[ "${PUSH}" == "1" ]]; then
  if [[ "${SKIP_REMOTE_EXISTING}" == "1" ]] && remote_image_exists "${base_image}"; then
    echo "Remote base image already exists, skipping push: ${base_image}"
  elif local_image_exists "${base_image}"; then
    push_image_with_fallback "${base_image}"
  else
    echo "Base image not built locally; assuming remote copy is the source of truth: ${base_image}"
  fi
fi

built_images=()
if local_image_exists "${base_image}"; then
  built_images+=("${base_image}")
fi
pushed_images=()
if [[ "${PUSH}" == "1" ]]; then
  pushed_images+=("${base_image}")
fi

for harness in ${HARNESSES}; do
  case "${harness}" in
    claude-code)
      image="${REGISTRY_PREFIX}/harness-claude-code:${BASE_TAG}"
      dockerfile="images/harness/claude-code/Dockerfile"
      version_arg="CLAUDE_CODE_VERSION"
      version_value="${CLAUDE_CODE_VERSION}"
      ;;
    codex)
      image="${REGISTRY_PREFIX}/harness-codex:${BASE_TAG}"
      dockerfile="images/harness/codex/Dockerfile"
      version_arg="CODEX_VERSION"
      version_value="${CODEX_VERSION}"
      ;;
    gemini-cli)
      image="${REGISTRY_PREFIX}/harness-gemini-cli:${BASE_TAG}"
      dockerfile="images/harness/gemini-cli/Dockerfile"
      version_arg="GEMINI_CLI_VERSION"
      version_value="${GEMINI_CLI_VERSION}"
      ;;
    hermes)
      image="${REGISTRY_PREFIX}/harness-hermes:${BASE_TAG}"
      dockerfile="images/harness/hermes/Dockerfile"
      version_arg="HERMES_VERSION"
      version_value="${HERMES_VERSION}"
      ;;
    kilo-code)
      image="${REGISTRY_PREFIX}/harness-kilo-code:${BASE_TAG}"
      dockerfile="images/harness/kilo-code/Dockerfile"
      version_arg="KILO_CODE_VERSION"
      version_value="${KILO_CODE_VERSION}"
      ;;
    openclaw)
      image="${REGISTRY_PREFIX}/harness-openclaw:${BASE_TAG}"
      dockerfile="images/harness/openclaw/Dockerfile"
      version_arg="OPENCLAW_VERSION"
      version_value="${OPENCLAW_VERSION}"
      ;;
    *)
      echo "Unsupported public harness: ${harness}. Supported harnesses: claude-code codex gemini-cli hermes kilo-code openclaw." >&2
      exit 1
      ;;
  esac

  if [[ -n "${RUN_ID:-}" ]]; then
    python3 tools/runtime_progress.py update \
      --scope "${PROGRESS_SCOPE}" \
      --run-id "${RUN_ID}" \
      --status running \
      --phase build-harness \
      --message "building harness image" \
      --current-item "${image}"
  fi

  if [[ "${FORCE_REBUILD}" == "1" ]]; then
    docker_build_with_retry \
      --platform "${DOCKER_PLATFORM}" \
      -f "${dockerfile}" \
      --build-arg BASE_IMAGE="${base_image}" \
      --build-arg "${version_arg}=${version_value}" \
      --build-arg "UBUNTU_APT_MIRROR=${UBUNTU_APT_MIRROR}" \
      -t "${image}" \
      .
  elif local_image_exists "${image}"; then
    echo "Reusing local harness image: ${image}"
  elif [[ "${SKIP_REMOTE_EXISTING}" == "1" ]] && remote_image_exists "${image}"; then
    echo "Remote harness image already exists, skipping local build: ${image}"
  else
    docker_build_with_retry \
      --platform "${DOCKER_PLATFORM}" \
      -f "${dockerfile}" \
      --build-arg BASE_IMAGE="${base_image}" \
      --build-arg "${version_arg}=${version_value}" \
      --build-arg "UBUNTU_APT_MIRROR=${UBUNTU_APT_MIRROR}" \
      -t "${image}" \
      .
  fi

  if local_image_exists "${image}"; then
    if [[ "${VALIDATE_HARNESS_IMAGES}" == "1" ]]; then
      validate_harness_image "${harness}" "${image}"
    fi
    built_images+=("${image}")
  fi
  if [[ "${PUSH}" == "1" ]]; then
    if [[ "${SKIP_REMOTE_EXISTING}" == "1" ]] && remote_image_exists "${image}"; then
      echo "Remote harness image already exists, skipping push: ${image}"
    elif local_image_exists "${image}"; then
      push_image_with_fallback "${image}"
    else
      echo "Harness image not built locally; assuming remote copy is the source of truth: ${image}"
    fi
    pushed_images+=("${image}")
  fi
done

echo "Built images:"
if [[ ${#built_images[@]} -gt 0 ]]; then
  for image in "${built_images[@]}"; do
    echo "  ${image}"
  done
else
  echo "  (none built locally)"
fi

if [[ "${PUSH}" == "1" ]]; then
  echo "Pushed images:"
  if [[ ${#pushed_images[@]} -gt 0 ]]; then
    for image in "${pushed_images[@]}"; do
      echo "  ${image}"
    done
  else
    echo "  (none pushed from local)"
  fi
fi
