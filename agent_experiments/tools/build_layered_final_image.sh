#!/usr/bin/env bash
set -euo pipefail

REGISTRY_PREFIX="${REGISTRY_PREFIX:-}"
TASK_ID="${TASK_ID:-}"
HARNESS="${HARNESS:-}"
SKILL_VARIANT="${SKILL_VARIANT:-}"
BASE_TAG="${BASE_TAG:-v1}"
FINAL_TAG="${FINAL_TAG:-v1}"
PUSH="${PUSH:-0}"
PUSH_METHOD="${PUSH_METHOD:-auto}"
IMAGES_ROOT="${IMAGES_ROOT:-images}"
HARBOR_REGISTRY="${HARBOR_REGISTRY:-}"
HARBOR_USERNAME="${HARBOR_USERNAME:-}"
HARBOR_PASSWORD="${HARBOR_PASSWORD:-}"
FORCE_REBUILD="${FORCE_REBUILD:-0}"
FORCE_TASK_REBUILD="${FORCE_TASK_REBUILD:-${FORCE_REBUILD}}"
FORCE_FINAL_REBUILD="${FORCE_FINAL_REBUILD:-${FORCE_REBUILD}}"
SKIP_REMOTE_EXISTING="${SKIP_REMOTE_EXISTING:-1}"
DOCKER_BUILD_MAX_ATTEMPTS="${DOCKER_BUILD_MAX_ATTEMPTS:-4}"
DOCKER_BUILD_RETRY_SLEEP_SEC="${DOCKER_BUILD_RETRY_SLEEP_SEC:-10}"
DOCKER_PLATFORM="${DOCKER_PLATFORM:-linux/arm64}"
VALIDATE_FINAL_IMAGE="${VALIDATE_FINAL_IMAGE:-1}"
SKIP_FINAL_IMAGE_SMOKE_TEST="${SKIP_FINAL_IMAGE_SMOKE_TEST:-0}"
VALIDATE_REFERENCE_SOLUTION="${VALIDATE_REFERENCE_SOLUTION:-0}"
VALIDATE_CHECK_TIMEOUT_SEC="${VALIDATE_CHECK_TIMEOUT_SEC:-${IMAGE_VALIDATION_CHECK_TIMEOUT_SEC:-180}}"
CLEAN_LOCAL_AFTER_SUCCESS="${CLEAN_LOCAL_AFTER_SUCCESS:-0}"
VERIFY_REMOTE_AFTER_PUSH="${VERIFY_REMOTE_AFTER_PUSH:-1}"
REMOTE_VERIFY_MAX_ATTEMPTS="${REMOTE_VERIFY_MAX_ATTEMPTS:-6}"
REMOTE_VERIFY_RETRY_SLEEP_SEC="${REMOTE_VERIFY_RETRY_SLEEP_SEC:-10}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ -f "${ROOT_DIR}/tools/formal_env.sh" ]]; then
  # Keep Docker auth non-interactive on SSH workers using DOCKER_CONFIG.
  source "${ROOT_DIR}/tools/formal_env.sh"
fi

if [[ -z "${REGISTRY_PREFIX}" || -z "${TASK_ID}" || -z "${HARNESS}" || -z "${SKILL_VARIANT}" ]]; then
  echo "Required environment variables:" >&2
  echo "  REGISTRY_PREFIX" >&2
  echo "  TASK_ID" >&2
  echo "  HARNESS" >&2
  echo "  SKILL_VARIANT" >&2
  echo "Example:" >&2
  echo "  REGISTRY_PREFIX=registry.example.com/skillsomething TASK_ID=skillbench_0001 HARNESS=codex SKILL_VARIANT=skillos bash tools/build_layered_final_image.sh" >&2
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
  local max_attempts="${DOCKER_BUILD_MAX_ATTEMPTS}"
  local base_sleep_sec="${DOCKER_BUILD_RETRY_SLEEP_SEC}"
  local attempt=1

  while (( attempt <= max_attempts )); do
    if docker build "${@:1}"; then
      return 0
    fi

    if (( attempt == max_attempts )); then
      echo "Build failed after ${attempt} attempts." >&2
      return 1
    fi

    echo "Build attempt ${attempt}/${max_attempts} failed for ${TASK_ID}/${HARNESS}/${SKILL_VARIANT}; retrying..." >&2
    sleep "$(( base_sleep_sec * attempt ))"
    attempt=$((attempt + 1))
  done
}

local_image_exists() {
  local image="$1"
  docker image inspect "${image}" >/dev/null 2>&1
}

validate_final_image() {
  local image="$1"
  local task_dir="$2"
  local report_path="runtime-state/reports/image-validation-final-${image_task_id}-${HARNESS}-${SKILL_VARIANT}.json"
  local args=(
    --image "${image}"
    --kind final
    --harness "${HARNESS}"
    --task-id "${TASK_ID}"
    --task-dir "${task_dir}"
    --platform "${DOCKER_PLATFORM}"
    --check-timeout-sec "${VALIDATE_CHECK_TIMEOUT_SEC}"
    --report-out "${report_path}"
  )
  if [[ "${VALIDATE_REFERENCE_SOLUTION}" == "1" ]]; then
    args+=(--require-reference-solution)
  fi
      python3 tools/validate_built_image.py \
    "${args[@]}"
}

remote_image_exists() {
  local image="$1"
  docker manifest inspect "${image}" >/dev/null 2>&1
}

verify_remote_image_exists() {
  local image="$1"
  local max_attempts="${REMOTE_VERIFY_MAX_ATTEMPTS}"
  local base_sleep_sec="${REMOTE_VERIFY_RETRY_SLEEP_SEC}"
  local attempt=1

  while (( attempt <= max_attempts )); do
    if remote_image_exists "${image}"; then
      return 0
    fi

    if (( attempt == max_attempts )); then
      echo "Remote manifest missing after push: ${image}" >&2
      return 1
    fi

    echo "Remote manifest not visible yet for ${image}; retrying verification..." >&2
    sleep "$(( base_sleep_sec * attempt ))"
    attempt=$((attempt + 1))
  done
}

tag_local_build_alias() {
  local source_image="$1"
  local alias_image="$2"

  if ! local_image_exists "${source_image}"; then
    return 1
  fi

  docker tag "${source_image}" "${alias_image}" >/dev/null
}

smoke_test_final_image() {
  local image="$1"
  local smoke_cmd

  case "${HARNESS}" in
    claude-code)
      smoke_cmd='command -v node >/dev/null && node --version >/dev/null && command -v claude >/dev/null && claude --version >/dev/null'
      ;;
    codex)
      smoke_cmd='command -v node >/dev/null && node --version >/dev/null && command -v codex >/dev/null && codex --version >/dev/null'
      ;;
    gemini-cli)
      smoke_cmd='command -v node >/dev/null && node --version >/dev/null && command -v gemini >/dev/null && gemini --version >/dev/null'
      ;;
    hermes)
      smoke_cmd='command -v python3 >/dev/null && command -v hermes >/dev/null && hermes version >/dev/null'
      ;;
    kilo-code)
      smoke_cmd='command -v node >/dev/null && node --version >/dev/null && command -v kilo >/dev/null && kilo --version >/dev/null'
      ;;
    openclaw)
      smoke_cmd='command -v node >/dev/null && node --version >/dev/null && command -v openclaw >/dev/null && openclaw --version >/dev/null'
      ;;
    *)
      echo "Unsupported public harness: ${HARNESS}. Supported harnesses: claude-code codex gemini-cli hermes kilo-code openclaw." >&2
      return 2
      ;;
  esac

  echo "Smoke testing final image for ${HARNESS}: ${image}"
  docker run --rm --platform "${DOCKER_PLATFORM}" --entrypoint /bin/sh "${image}" -lc "${smoke_cmd}"
}

image_task_id="$(printf '%s' "${TASK_ID}" | tr '[:upper:]' '[:lower:]')"
task_context_dir="${IMAGES_ROOT}/task/${TASK_ID}"
skill_context_dir="${IMAGES_ROOT}/skill/${TASK_ID}/${SKILL_VARIANT}"

if [[ ! -d "${task_context_dir}" ]]; then
  task_context_dir="${IMAGES_ROOT}/task/${image_task_id}"
fi

if [[ ! -d "${skill_context_dir}" ]]; then
  skill_context_dir="${IMAGES_ROOT}/skill/${image_task_id}/${SKILL_VARIANT}"
fi

if [[ ! -d "${task_context_dir}" ]]; then
  echo "Missing task layer context: ${task_context_dir}" >&2
  exit 1
fi

if [[ ! -d "${skill_context_dir}" ]]; then
  echo "Missing skill layer context: ${skill_context_dir}" >&2
  exit 1
fi

harness_image="${REGISTRY_PREFIX}/harness-${HARNESS}:${BASE_TAG}"
task_image="${REGISTRY_PREFIX}/task-${image_task_id}-${HARNESS}:${FINAL_TAG}"
final_image="${REGISTRY_PREFIX}/final-${image_task_id}-${HARNESS}-${SKILL_VARIANT}:${FINAL_TAG}"
local_harness_build_image="${harness_image}"
local_task_build_image="${task_image}"
if registry_host_from_prefix "${REGISTRY_PREFIX}" >/dev/null; then
  local_harness_build_image="aiready-local/harness-${HARNESS}:${BASE_TAG}"
  local_task_build_image="aiready-local/task-${image_task_id}-${HARNESS}:${FINAL_TAG}"
fi

cleanup_partial_images() {
  local image
  for image in "${final_image}" "${task_image}" "${local_task_build_image}"; do
    docker image rm -f "${image}" >/dev/null 2>&1 || true
  done
}

trap cleanup_partial_images TERM INT

if [[ "${SKIP_REMOTE_EXISTING}" == "1" ]] && remote_image_exists "${final_image}"; then
  echo "Remote final image already exists, skipping local build: ${final_image}"
  if [[ "${PUSH}" == "1" ]]; then
    echo "Remote final image already exists, skipping push: ${final_image}"
  fi
  exit 0
fi

task_build_harness_image="${harness_image}"
if [[ "${local_harness_build_image}" != "${harness_image}" ]] && tag_local_build_alias "${harness_image}" "${local_harness_build_image}"; then
  task_build_harness_image="${local_harness_build_image}"
fi

if [[ "${FORCE_TASK_REBUILD}" == "1" ]]; then
  docker_build_with_retry \
    --platform "${DOCKER_PLATFORM}" \
    -f "${task_context_dir}/Dockerfile" \
    --build-arg HARNESS_IMAGE="${task_build_harness_image}" \
    -t "${task_image}" \
    "${task_context_dir}"
elif local_image_exists "${task_image}"; then
  echo "Reusing local task image: ${task_image}"
elif [[ "${SKIP_REMOTE_EXISTING}" == "1" ]] && remote_image_exists "${task_image}"; then
  echo "Remote task image already exists, skipping local task build: ${task_image}"
else
  docker_build_with_retry \
    --platform "${DOCKER_PLATFORM}" \
    -f "${task_context_dir}/Dockerfile" \
    --build-arg HARNESS_IMAGE="${task_build_harness_image}" \
    -t "${task_image}" \
    "${task_context_dir}"
fi

final_build_task_image="${task_image}"
if [[ "${local_task_build_image}" != "${task_image}" ]] && tag_local_build_alias "${task_image}" "${local_task_build_image}"; then
  final_build_task_image="${local_task_build_image}"
fi

if [[ "${FORCE_FINAL_REBUILD}" == "1" ]]; then
  docker_build_with_retry \
    --platform "${DOCKER_PLATFORM}" \
    -f "${skill_context_dir}/Dockerfile" \
    --build-arg TASK_IMAGE="${final_build_task_image}" \
    --build-arg HARNESS_NAME="${HARNESS}" \
    -t "${final_image}" \
    "${skill_context_dir}"
elif local_image_exists "${final_image}"; then
  echo "Reusing local final image: ${final_image}"
else
  docker_build_with_retry \
    --platform "${DOCKER_PLATFORM}" \
    -f "${skill_context_dir}/Dockerfile" \
    --build-arg TASK_IMAGE="${final_build_task_image}" \
    --build-arg HARNESS_NAME="${HARNESS}" \
    -t "${final_image}" \
    "${skill_context_dir}"
fi

if local_image_exists "${final_image}"; then
  if [[ "${VALIDATE_FINAL_IMAGE}" == "1" ]]; then
    validate_final_image "${final_image}" "${task_context_dir}/context"
  fi
  if [[ "${SKIP_FINAL_IMAGE_SMOKE_TEST}" != "1" ]]; then
    smoke_test_final_image "${final_image}"
  fi
fi

if [[ "${PUSH}" == "1" ]]; then
  if [[ "${SKIP_REMOTE_EXISTING}" == "1" ]] && remote_image_exists "${task_image}"; then
    echo "Remote task image already exists, skipping push: ${task_image}"
  elif local_image_exists "${task_image}"; then
    push_image_with_fallback "${task_image}"
  else
    echo "Task image not built locally; assuming remote copy is the source of truth: ${task_image}"
  fi

  if [[ "${SKIP_REMOTE_EXISTING}" == "1" ]] && remote_image_exists "${final_image}"; then
    echo "Remote final image already exists, skipping push: ${final_image}"
  elif local_image_exists "${final_image}"; then
    push_image_with_fallback "${final_image}"
  else
    echo "Final image not built locally; assuming remote copy is the source of truth: ${final_image}"
  fi

  if [[ "${VERIFY_REMOTE_AFTER_PUSH}" == "1" ]]; then
    verify_remote_image_exists "${task_image}"
    verify_remote_image_exists "${final_image}"
  fi
fi

echo "Built layered images:"
echo "  task  = ${task_image}"
echo "  final = ${final_image}"

if [[ "${CLEAN_LOCAL_AFTER_SUCCESS}" == "1" ]]; then
  echo "Cleaning local task/final images after successful publish/validation."
  docker image rm -f \
    "${final_image}" \
    "${task_image}" \
    "${local_task_build_image}" \
    >/dev/null 2>&1 || true
fi

trap - TERM INT
