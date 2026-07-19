#!/usr/bin/env bash
set -euo pipefail

REGISTRY_PREFIX="${REGISTRY_PREFIX:-}"
HARNESSES="${HARNESSES:-claude-code codex gemini-cli hermes kilo-code openclaw}"
SKILL_VARIANTS="${SKILL_VARIANTS:-no-skill raw-skill skillos skillos-provider-swapped}"
TASK_IDS="${TASK_IDS:-}"
BASE_TAG="${BASE_TAG:-v1}"
FINAL_TAG="${FINAL_TAG:-v1}"
PUSH="${PUSH:-0}"
FAIL_ON_MISSING_VARIANT="${FAIL_ON_MISSING_VARIANT:-0}"
IMAGES_ROOT="${IMAGES_ROOT:-images}"
FORCE_REBUILD="${FORCE_REBUILD:-0}"
FORCE_TASK_REBUILD="${FORCE_TASK_REBUILD:-${FORCE_REBUILD}}"
FORCE_FINAL_REBUILD="${FORCE_FINAL_REBUILD:-${FORCE_REBUILD}}"
SKIP_REMOTE_EXISTING="${SKIP_REMOTE_EXISTING:-1}"
BUILD_TIMEOUT_SEC="${BUILD_TIMEOUT_SEC:-5400}"
CONTINUE_ON_ERROR="${CONTINUE_ON_ERROR:-1}"
FAILED_BUILDS_FILE="${FAILED_BUILDS_FILE:-}"
SKIPPED_BUILDS_FILE="${SKIPPED_BUILDS_FILE:-}"
DOCKER_BUILD_MAX_ATTEMPTS="${DOCKER_BUILD_MAX_ATTEMPTS:-4}"
DOCKER_PLATFORM="${DOCKER_PLATFORM:-linux/arm64}"
AMD64_BASE_TAG="${AMD64_BASE_TAG:-${BASE_TAG}-amd64}"
PROGRESS_SCOPE="${PROGRESS_SCOPE:-publish}"

if [[ -z "${REGISTRY_PREFIX}" ]]; then
  echo "REGISTRY_PREFIX is required." >&2
  exit 1
fi

if [[ -z "${TASK_IDS}" ]]; then
  TASK_IDS="$(find "${IMAGES_ROOT}/task" -mindepth 1 -maxdepth 1 -type d -exec basename {} \; | sort | tr '\n' ' ')"
fi

attempted_builds=0
processed_builds=0
skipped_builds=0
failed_builds=0
rebuilt_task_keys=""
failed_task_keys=""
total_builds=0

append_record() {
  local file_path="$1"
  local line="$2"
  [[ -n "${file_path}" ]] || return 0
  mkdir -p "$(dirname "${file_path}")"
  printf '%s\n' "${line}" >> "${file_path}"
}

run_with_timeout() {
  local timeout_sec="$1"
  shift

  if command -v timeout >/dev/null 2>&1; then
    timeout --foreground "${timeout_sec}" "$@"
    return $?
  fi

  if command -v gtimeout >/dev/null 2>&1; then
    gtimeout --foreground "${timeout_sec}" "$@"
    return $?
  fi

  python3 tools/run_with_timeout.py "${timeout_sec}" "$@"
}

resolve_task_platform() {
  local task_id="$1"
  python3 tools/resolve_formal_task_platform.py \
    --task-id "${task_id}" \
    --images-root "${IMAGES_ROOT}" \
    --default-platform "${DOCKER_PLATFORM}"
}

base_tag_for_platform() {
  local platform="$1"
  if [[ "${platform}" == "${DOCKER_PLATFORM}" ]]; then
    printf '%s\n' "${BASE_TAG}"
    return 0
  fi
  case "${platform}" in
    linux/amd64)
      printf '%s\n' "${AMD64_BASE_TAG}"
      ;;
    *)
      printf '%s\n' "${BASE_TAG}"
      ;;
  esac
}

cleanup_failed_build_artifacts() {
  local task_id="$1"
  local image_task_id="$2"
  local harness="$3"
  local skill_variant="$4"

  local task_image="${REGISTRY_PREFIX}/task-${image_task_id}-${harness}:${FINAL_TAG}"
  local final_image="${REGISTRY_PREFIX}/final-${image_task_id}-${harness}-${skill_variant}:${FINAL_TAG}"
  local task_dockerfile="${IMAGES_ROOT}/task/${image_task_id}/Dockerfile"
  local final_dockerfile="${IMAGES_ROOT}/skill/${image_task_id}/${skill_variant}/Dockerfile"

  pkill -f "docker build -f ${task_dockerfile}" >/dev/null 2>&1 || true
  pkill -f "docker build -f ${final_dockerfile}" >/dev/null 2>&1 || true

  docker image rm -f "${final_image}" >/dev/null 2>&1 || true
  docker image rm -f "${task_image}" >/dev/null 2>&1 || true
}

for harness in ${HARNESSES}; do
  for task_id in ${TASK_IDS}; do
    image_task_id="$(printf '%s' "${task_id}" | tr '[:upper:]' '[:lower:]')"
    for skill_variant in ${SKILL_VARIANTS}; do
      skill_context_dir="${IMAGES_ROOT}/skill/${task_id}/${skill_variant}"
      if [[ ! -d "${skill_context_dir}" ]]; then
        skill_context_dir="${IMAGES_ROOT}/skill/${image_task_id}/${skill_variant}"
      fi
      if [[ -d "${skill_context_dir}" ]]; then
        total_builds=$((total_builds + 1))
      fi
    done
  done
done

for harness in ${HARNESSES}; do
  for task_id in ${TASK_IDS}; do
    image_task_id="$(printf '%s' "${task_id}" | tr '[:upper:]' '[:lower:]')"
    for skill_variant in ${SKILL_VARIANTS}; do
      skill_context_dir="${IMAGES_ROOT}/skill/${task_id}/${skill_variant}"
      if [[ ! -d "${skill_context_dir}" ]]; then
        skill_context_dir="${IMAGES_ROOT}/skill/${image_task_id}/${skill_variant}"
      fi

      if [[ ! -d "${skill_context_dir}" ]]; then
        if [[ "${FAIL_ON_MISSING_VARIANT}" == "1" ]]; then
          echo "Missing skill layer context for ${task_id} / ${skill_variant}" >&2
          exit 1
        fi
        echo "== skip ${task_id} / ${harness} / ${skill_variant} (missing skill layer) =="
        skipped_builds=$((skipped_builds + 1))
        append_record "${SKIPPED_BUILDS_FILE}" "${task_id},${harness},${skill_variant},missing-skill-layer"
        continue
      fi

      echo "== build ${task_id} / ${harness} / ${skill_variant} =="
      if [[ -n "${RUN_ID:-}" ]]; then
        python3 tools/runtime_progress.py update \
          --scope "${PROGRESS_SCOPE}" \
          --run-id "${RUN_ID}" \
          --status running \
          --phase build-task-final \
          --message "building task/final image pair" \
          --current-item "${task_id} / ${harness} / ${skill_variant}" \
          --completed-steps "${processed_builds}" \
          --total-steps "${total_builds}"
      fi
      task_force_rebuild="${FORCE_TASK_REBUILD}"
      effective_platform="$(resolve_task_platform "${task_id}")"
      effective_base_tag="$(base_tag_for_platform "${effective_platform}")"
      task_key="${harness}::${image_task_id}::${effective_platform}::${effective_base_tag}"
      if [[ " ${failed_task_keys} " == *" ${task_key} "* ]]; then
        echo "== skip ${task_id} / ${harness} / ${skill_variant} (task-layer-failed-earlier) =="
        skipped_builds=$((skipped_builds + 1))
        processed_builds=$((processed_builds + 1))
        append_record "${SKIPPED_BUILDS_FILE}" "${task_id},${harness},${skill_variant},task-layer-failed-earlier"
        if [[ -n "${RUN_ID:-}" ]]; then
          python3 tools/runtime_progress.py update \
            --scope "${PROGRESS_SCOPE}" \
            --run-id "${RUN_ID}" \
            --status running \
            --phase build-task-final \
            --message "skipped because task layer failed earlier in this harness batch" \
            --current-item "${task_id} / ${harness} / ${skill_variant}" \
            --completed-steps "${processed_builds}" \
            --total-steps "${total_builds}"
        fi
        continue
      fi
      if [[ "${task_force_rebuild}" == "1" && " ${rebuilt_task_keys} " == *" ${task_key} "* ]]; then
        task_force_rebuild="0"
      fi
      set +e
      REGISTRY_PREFIX="${REGISTRY_PREFIX}" \
      TASK_ID="${task_id}" \
      HARNESS="${harness}" \
      SKILL_VARIANT="${skill_variant}" \
      BASE_TAG="${effective_base_tag}" \
      FINAL_TAG="${FINAL_TAG}" \
      PUSH="${PUSH}" \
      PUSH_METHOD="${PUSH_METHOD:-auto}" \
      IMAGES_ROOT="${IMAGES_ROOT}" \
      FORCE_TASK_REBUILD="${task_force_rebuild}" \
      FORCE_FINAL_REBUILD="${FORCE_FINAL_REBUILD}" \
      SKIP_REMOTE_EXISTING="${SKIP_REMOTE_EXISTING}" \
      DOCKER_BUILD_MAX_ATTEMPTS="${DOCKER_BUILD_MAX_ATTEMPTS}" \
      DOCKER_PLATFORM="${effective_platform}" \
      run_with_timeout "${BUILD_TIMEOUT_SEC}" bash tools/build_layered_final_image.sh
      build_exit_code=$?
      set -e

      if [[ "${build_exit_code}" -eq 0 ]]; then
        rebuilt_task_keys="${rebuilt_task_keys} ${task_key}"
        attempted_builds=$((attempted_builds + 1))
        processed_builds=$((processed_builds + 1))
      else
        failed_builds=$((failed_builds + 1))
        processed_builds=$((processed_builds + 1))
        reason="build-failed"
        if [[ "${build_exit_code}" -eq 124 || "${build_exit_code}" -eq 137 ]]; then
          reason="timeout"
        fi
        failed_task_keys="${failed_task_keys} ${task_key}"
        echo "== skip ${task_id} / ${harness} / ${skill_variant} (${reason}) =="
        append_record "${FAILED_BUILDS_FILE}" "${task_id},${harness},${skill_variant},${reason}"
        cleanup_failed_build_artifacts "${task_id}" "${image_task_id}" "${harness}" "${skill_variant}"

        if [[ -n "${RUN_ID:-}" ]]; then
          python3 tools/runtime_progress.py update \
            --scope "${PROGRESS_SCOPE}" \
            --run-id "${RUN_ID}" \
            --status running \
            --phase build-task-final \
            --message "skipped failed task/final image pair" \
            --current-item "${task_id} / ${harness} / ${skill_variant}" \
            --completed-steps "${processed_builds}" \
            --total-steps "${total_builds}" \
            --metadata-json "$(python3 - <<'PY'
import json, os
print(json.dumps({
    "failed_builds_file": os.environ.get("FAILED_BUILDS_FILE"),
    "skipped_builds_file": os.environ.get("SKIPPED_BUILDS_FILE"),
}, ensure_ascii=False))
PY
)"
        fi

        if [[ "${CONTINUE_ON_ERROR}" == "1" ]]; then
          continue
        fi
        exit "${build_exit_code}"
      fi

      if [[ -n "${RUN_ID:-}" ]]; then
        python3 tools/runtime_progress.py update \
          --scope "${PROGRESS_SCOPE}" \
          --run-id "${RUN_ID}" \
          --status running \
          --phase build-task-final \
          --message "built task/final image pair" \
          --current-item "${task_id} / ${harness} / ${skill_variant}" \
          --completed-steps "${processed_builds}" \
          --total-steps "${total_builds}"
      fi
    done
  done
done

echo "Build matrix summary:"
echo "  built   = ${attempted_builds}"
echo "  skipped = ${skipped_builds}"
echo "  failed  = ${failed_builds}"
