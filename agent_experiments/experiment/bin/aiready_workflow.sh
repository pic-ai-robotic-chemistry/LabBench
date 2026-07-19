#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
EXPERIMENT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
ROOT_DIR="$(cd "${EXPERIMENT_DIR}/.." && pwd)"
cd "${ROOT_DIR}"

usage() {
  cat <<'EOF'
Usage:
  bash experiment/bin/aiready_workflow.sh <command> [--profile PATH] [--run-label LABEL]

Commands:
  bootstrap   Create/update .venv and install this repo in editable mode.
  prepare     Generate tasks, configs, Docker build contexts, and isolation report.
  build       Build/push base, harness, task, and final images from an existing manifest.
  run         Preflight generated configs and run the matrix in containers.
  collect     Bundle current run results and write selected_trials/dispatch stats.
  score       Prepare, build, run, and aggregate LLM-judge scoring.
  score-prepare
              Generate scoring tasks/configs from selected_trials.csv.
  score-build Build/push shared scoring judge images.
  score-run   Run generated scoring configs in containers.
  score-aggregate
              Aggregate score.json artifacts into CSV/JSON summaries.
  all         Run prepare, build, run, and collect in order.
  all-with-scoring
              Run all experiment stages, then score and aggregate.
  package     Build a GitHub-ready source package under dist/.
  status      Show runtime-state progress JSON/text from the existing monitor.

Common options:
  --profile PATH       Env profile to source. Default: experiment/profiles/aiready-v15-smoke.env
  --run-label LABEL    Stable label for generated/, jobs/, analysis/, and image tags.

Profiles are shell env files. Put secrets in .env, not in profile files.
EOF
}

COMMAND="${1:-}"
if [[ -z "${COMMAND}" || "${COMMAND}" == "-h" || "${COMMAND}" == "--help" ]]; then
  usage
  exit 0
fi
shift || true

PROFILE="${AIREADY_PROFILE:-experiment/profiles/aiready-v15-smoke.env}"
RUN_LABEL_ARG=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --profile)
      PROFILE="$2"
      shift 2
      ;;
    --run-label)
      RUN_LABEL_ARG="$2"
      shift 2
      ;;
    -h|--help)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

load_profile() {
  if [[ ! -f "${PROFILE}" ]]; then
    echo "Profile not found: ${PROFILE}" >&2
    exit 2
  fi
  set -a
  # shellcheck disable=SC1090
  source "${PROFILE}"
  set +a
}

venv_python_candidate() {
  if command -v python3.12 >/dev/null 2>&1; then
    command -v python3.12
    return 0
  fi
  if [[ -x "${HOME}/.local/bin/python3.12" ]]; then
    printf '%s\n' "${HOME}/.local/bin/python3.12"
    return 0
  fi
  if command -v python3 >/dev/null 2>&1; then
    command -v python3
    return 0
  fi
  return 1
}

bootstrap() {
  local python_bin
  python_bin="$(venv_python_candidate)" || {
    echo "No python3/python3.12 found." >&2
    exit 1
  }
  if [[ ! -x ".venv/bin/python" ]]; then
    "${python_bin}" -m venv .venv
  fi
  .venv/bin/python -m pip install --upgrade pip
  .venv/bin/python -m pip install -e .
}

activate_runtime() {
  if [[ ! -x ".venv/bin/python" ]]; then
    bootstrap
  fi
  # shellcheck disable=SC1091
  source .venv/bin/activate
  # shellcheck disable=SC1091
  source tools/formal_env.sh
  load_profile

  if [[ -n "${RUN_LABEL_ARG}" ]]; then
    RUN_LABEL="${RUN_LABEL_ARG}"
  else
    RUN_LABEL="${RUN_LABEL:-aiready-$(date +%Y%m%d-%H%M%S)}"
  fi
  export RUN_LABEL

  RUN_ROOT="${RUN_ROOT:-runs/${RUN_LABEL}}"
  OUT_ROOT="${OUT_ROOT:-${RUN_ROOT}/generated}"
  JOBS_DIR="${JOBS_DIR:-${RUN_ROOT}/jobs}"
  ANALYSIS_ROOT="${ANALYSIS_ROOT:-${RUN_ROOT}/analysis}"
  LOG_DIR="${LOG_DIR:-${RUN_ROOT}/logs}"
  REPORT_DIR="${REPORT_DIR:-${RUN_ROOT}/reports}"
  LOG_PATH="${LOG_PATH:-${LOG_DIR}/workflow.log}"

  BENCHMARK_VERSION="${BENCHMARK_VERSION:-v15}"
  SOURCE_DOCX="${SOURCE_DOCX:-Benchmark_V15.docx}"
  JOB_NAME_PREFIX="${JOB_NAME_PREFIX:-aiready-${BENCHMARK_VERSION}-${RUN_LABEL}}"
  REGISTRY_PREFIX="${REGISTRY_PREFIX:-aiready-local/aiready}"
  IMAGE_TAG="${IMAGE_TAG:-${RUN_LABEL}}"
  BASE_TAG="${BASE_TAG:-${IMAGE_TAG}}"
  FINAL_TAG="${FINAL_TAG:-${IMAGE_TAG}}"
  INSTRUCTION_STYLE="${INSTRUCTION_STYLE:-full}"
  OUTPUT_CONTRACT_MODE="${OUTPUT_CONTRACT_MODE:-plan}"
  EXTRA_SKILL_VARIANTS="${EXTRA_SKILL_VARIANTS:-}"
  N_ATTEMPTS="${N_ATTEMPTS:-1}"
  N_CONCURRENT_TRIALS="${N_CONCURRENT_TRIALS:-2}"
  AGENT_TIMEOUT_SEC="${AGENT_TIMEOUT_SEC:-1800}"
  AIREADY_ENV_CPUS="${AIREADY_ENV_CPUS:-2}"
  AIREADY_ENV_MEMORY_MB="${AIREADY_ENV_MEMORY_MB:-12288}"
  AIREADY_ENV_STORAGE_MB="${AIREADY_ENV_STORAGE_MB:-20480}"
  BUILD_IMAGES="${BUILD_IMAGES:-1}"
  RUN_EXPERIMENTS="${RUN_EXPERIMENTS:-1}"
  PUSH="${PUSH:-0}"
  PUSH_METHOD="${PUSH_METHOD:-docker}"
  HARNESSES="${HARNESSES:-openclaw}"
  # Main experiment skill variant. Supply aiready/aiready_skill_7.6 locally
  # through the aiready-skill-7.6 alias. To use a custom skill,
  # register NAME=PATH through EXTRA_SKILL_VARIANTS and select NAME through
  # SKILL_VARIANTS; do not edit generated tasks by hand.
  SKILL_VARIANTS="${SKILL_VARIANTS:-aiready-skill-7.6}"
  MODELS="${MODELS:-model_a}"
  TASK_IDS="${TASK_IDS:-A01}"
  BUILD_TIMEOUT_SEC="${BUILD_TIMEOUT_SEC:-1800}"
  DOCKER_BUILD_MAX_ATTEMPTS="${DOCKER_BUILD_MAX_ATTEMPTS:-2}"
  DOCKER_PUSH_MAX_ATTEMPTS="${DOCKER_PUSH_MAX_ATTEMPTS:-3}"
  SKIP_REMOTE_EXISTING="${SKIP_REMOTE_EXISTING:-0}"
  FORCE_REBUILD="${FORCE_REBUILD:-0}"
  FORCE_TASK_REBUILD="${FORCE_TASK_REBUILD:-${FORCE_REBUILD}}"
  FORCE_FINAL_REBUILD="${FORCE_FINAL_REBUILD:-${FORCE_REBUILD}}"
  FORMAL_PREPULL_RETRIES="${FORMAL_PREPULL_RETRIES:-3}"
  FORMAL_FORCE_PULL_IMAGES="${FORMAL_FORCE_PULL_IMAGES:-0}"
  FORMAL_PREPULL_WITH_CRANE="${FORMAL_PREPULL_WITH_CRANE:-0}"
  FORMAL_FORCE_CLEAN_BEFORE_RUN="${FORMAL_FORCE_CLEAN_BEFORE_RUN:-1}"
  FORMAL_KEEP_LOCAL_IMAGES_REGEX="${FORMAL_KEEP_LOCAL_IMAGES_REGEX:-aiready-local/aiready/}"
  MONITOR_REFRESH_INTERVAL_SEC="${MONITOR_REFRESH_INTERVAL_SEC:-120}"
  PROGRESS_SCOPE="${PROGRESS_SCOPE:-aiready-formal}"
  FORMAL_RUN_TIMEOUT_SEC="${FORMAL_RUN_TIMEOUT_SEC:-7200}"
  DISPATCH_STATS_MODE="${DISPATCH_STATS_MODE:-none}"
  SCORING_ENABLED="${SCORING_ENABLED:-0}"
  SCORING_SELECTED_TRIALS_CSV="${SCORING_SELECTED_TRIALS_CSV:-${ANALYSIS_ROOT}/selected_trials.csv}"
  SCORING_OUT_ROOT="${SCORING_OUT_ROOT:-${RUN_ROOT}/scoring/generated}"
  SCORING_JOBS_DIR="${SCORING_JOBS_DIR:-${RUN_ROOT}/scoring/jobs}"
  SCORING_JOB_NAME_PREFIX="${SCORING_JOB_NAME_PREFIX:-aiready-${BENCHMARK_VERSION}-${RUN_LABEL}-judge}"
  SCORING_REGISTRY_PREFIX="${SCORING_REGISTRY_PREFIX:-${REGISTRY_PREFIX}}"
  SCORING_IMAGE_TAG="${SCORING_IMAGE_TAG:-${IMAGE_TAG}-judge}"
  SCORING_BASE_TAG="${SCORING_BASE_TAG:-${BASE_TAG}}"
  SCORING_HARNESSES="${SCORING_HARNESSES:-codex}"
  SCORING_JUDGES="${SCORING_JUDGES:-judge_a}"
  SCORING_DIMENSIONS="${SCORING_DIMENSIONS:-physical_implementability workflow_completeness design_rationality}"
  # Reference skills mounted into judge tasks. Keep this aligned with the main
  # experiment skill unless you intentionally want judges to evaluate against a
  # different laboratory capability snapshot.
  SCORING_SKILLS_DIR="${SCORING_SKILLS_DIR:-aiready/aiready_skill_7.6}"
  SCORING_RUBRIC="${SCORING_RUBRIC:-scoring/aiready_scoring_rubric_en.md}"
  SCORING_N_CONCURRENT_TRIALS="${SCORING_N_CONCURRENT_TRIALS:-5}"
  SCORING_AGENT_TIMEOUT_SEC="${SCORING_AGENT_TIMEOUT_SEC:-900}"
  SCORING_ENV_CPUS="${SCORING_ENV_CPUS:-2}"
  SCORING_ENV_MEMORY_MB="${SCORING_ENV_MEMORY_MB:-8192}"
  SCORING_ENV_STORAGE_MB="${SCORING_ENV_STORAGE_MB:-12288}"
  SCORING_DRY_RUN_LIMIT="${SCORING_DRY_RUN_LIMIT:-}"
  SCORING_SKIP_MISSING_FINAL_PLAN="${SCORING_SKIP_MISSING_FINAL_PLAN:-1}"
  SCORING_GENERIC_IMAGE="${SCORING_GENERIC_IMAGE:-}"
  SCORING_BUILD_IMAGES="${SCORING_BUILD_IMAGES:-1}"
  SCORING_RUN_JOBS="${SCORING_RUN_JOBS:-1}"
  SCORING_PUSH="${SCORING_PUSH:-${PUSH}}"
  SCORING_OUT_DIR="${SCORING_OUT_DIR:-${ANALYSIS_ROOT}/scoring}"
  PACKAGE_OUT_DIR="${PACKAGE_OUT_DIR:-dist/aiready-experiment-workflow}"

  export RUN_ROOT OUT_ROOT JOBS_DIR ANALYSIS_ROOT LOG_DIR REPORT_DIR LOG_PATH
  export BENCHMARK_VERSION SOURCE_DOCX JOB_NAME_PREFIX REGISTRY_PREFIX IMAGE_TAG BASE_TAG FINAL_TAG
  export INSTRUCTION_STYLE OUTPUT_CONTRACT_MODE EXTRA_SKILL_VARIANTS
  export N_ATTEMPTS N_CONCURRENT_TRIALS AGENT_TIMEOUT_SEC AIREADY_ENV_CPUS AIREADY_ENV_MEMORY_MB AIREADY_ENV_STORAGE_MB
  export BUILD_IMAGES RUN_EXPERIMENTS PUSH PUSH_METHOD HARNESSES SKILL_VARIANTS MODELS TASK_IDS
  export BUILD_TIMEOUT_SEC DOCKER_BUILD_MAX_ATTEMPTS DOCKER_PUSH_MAX_ATTEMPTS SKIP_REMOTE_EXISTING
  export FORCE_REBUILD FORCE_TASK_REBUILD FORCE_FINAL_REBUILD
  export FORMAL_PREPULL_RETRIES FORMAL_FORCE_PULL_IMAGES FORMAL_PREPULL_WITH_CRANE FORMAL_FORCE_CLEAN_BEFORE_RUN
  export FORMAL_KEEP_LOCAL_IMAGES_REGEX MONITOR_REFRESH_INTERVAL_SEC PROGRESS_SCOPE FORMAL_RUN_TIMEOUT_SEC DISPATCH_STATS_MODE
  export SCORING_ENABLED SCORING_SELECTED_TRIALS_CSV SCORING_OUT_ROOT SCORING_JOBS_DIR SCORING_JOB_NAME_PREFIX
  export SCORING_REGISTRY_PREFIX SCORING_IMAGE_TAG SCORING_BASE_TAG SCORING_HARNESSES SCORING_JUDGES SCORING_DIMENSIONS
  export SCORING_SKILLS_DIR SCORING_RUBRIC SCORING_N_CONCURRENT_TRIALS SCORING_AGENT_TIMEOUT_SEC
  export SCORING_ENV_CPUS SCORING_ENV_MEMORY_MB SCORING_ENV_STORAGE_MB SCORING_DRY_RUN_LIMIT
  export SCORING_SKIP_MISSING_FINAL_PLAN SCORING_GENERIC_IMAGE SCORING_BUILD_IMAGES SCORING_RUN_JOBS
  export SCORING_PUSH SCORING_OUT_DIR PACKAGE_OUT_DIR

  mkdir -p "${RUN_ROOT}" "${ANALYSIS_ROOT}" "${LOG_DIR}" "${REPORT_DIR}" "$(dirname "${PACKAGE_OUT_DIR}")"
}

run_logged() {
  mkdir -p "$(dirname "${LOG_PATH}")"
  echo "== $* ==" | tee -a "${LOG_PATH}"
  "$@" 2>&1 | tee -a "${LOG_PATH}"
}

manifest_path() {
  printf '%s\n' "${OUT_ROOT}/manifest.json"
}

require_manifest() {
  local manifest
  manifest="$(manifest_path)"
  if [[ ! -f "${manifest}" ]]; then
    echo "Missing manifest: ${manifest}. Run prepare first." >&2
    exit 1
  fi
}

active_harnesses() {
  python3 - "$(manifest_path)" <<'PY'
import json
import sys
from pathlib import Path

manifest = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
harnesses = []
for config_path in manifest.get("config_paths", []):
    parts = Path(config_path).parts
    if "configs" not in parts:
        continue
    index = parts.index("configs")
    if index + 1 < len(parts) and parts[index + 1] not in harnesses:
        harnesses.append(parts[index + 1])
print(" ".join(harnesses))
PY
}

config_paths() {
  python3 - "$(manifest_path)" <<'PY'
import json
import sys
from pathlib import Path

manifest = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
for item in manifest.get("config_paths", []):
    print(item)
PY
}

scoring_manifest_path() {
  printf '%s\n' "${SCORING_OUT_ROOT}/manifest.json"
}

require_scoring_manifest() {
  local manifest
  manifest="$(scoring_manifest_path)"
  if [[ ! -f "${manifest}" ]]; then
    echo "Missing scoring manifest: ${manifest}. Run score-prepare first." >&2
    exit 1
  fi
}

scoring_config_paths() {
  python3 - "$(scoring_manifest_path)" <<'PY'
import json
import sys
from pathlib import Path

manifest = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
for item in manifest.get("config_paths", []):
    print(item)
PY
}

# Stage 1: expand a profile into concrete AIREADY tasks/configs/images.
# Inputs: profile variables, SOURCE_DOCX, selected skill directories.
# Outputs: ${OUT_ROOT}/manifest.json plus configs/tasks/images under ${OUT_ROOT}.
prepare_stage() {
  activate_runtime
  local extra_args=()
  local item
  for item in ${EXTRA_SKILL_VARIANTS}; do
    extra_args+=(--extra-skill-variant "${item}")
  done

  run_logged python3 tools/runtime_progress.py start \
    --scope publish \
    --run-id "aiready-${RUN_LABEL}" \
    --status running \
    --phase prepare \
    --message "preparing aiready tasks and configs" \
    --current-item "${OUT_ROOT}" \
    --log-path "${LOG_PATH}"

  # shellcheck disable=SC2086
  run_logged python3 tools/prepare_aiready_experiment.py \
    --out-root "${OUT_ROOT}" \
    --benchmark-version "${BENCHMARK_VERSION}" \
    --source-docx "${SOURCE_DOCX}" \
    --task-ids ${TASK_IDS} \
    --harnesses ${HARNESSES} \
    --models ${MODELS} \
    --skill-variants ${SKILL_VARIANTS} \
    ${extra_args[@]+"${extra_args[@]}"} \
    --registry-prefix "${REGISTRY_PREFIX}" \
    --image-tag "${IMAGE_TAG}" \
    --instruction-style "${INSTRUCTION_STYLE}" \
    --output-contract-mode "${OUTPUT_CONTRACT_MODE}" \
    --jobs-dir "${JOBS_DIR}" \
    --job-name-prefix "${JOB_NAME_PREFIX}" \
    --n-attempts "${N_ATTEMPTS}" \
    --n-concurrent-trials "${N_CONCURRENT_TRIALS}" \
    --agent-timeout-sec "${AGENT_TIMEOUT_SEC}" \
    --environment-cpus "${AIREADY_ENV_CPUS}" \
    --environment-memory-mb "${AIREADY_ENV_MEMORY_MB}" \
    --environment-storage-mb "${AIREADY_ENV_STORAGE_MB}"

  run_logged python3 tools/validate_experiment_isolation.py \
    --scope aiready \
    --aiready-config-root "${OUT_ROOT}/configs" \
    --report-out "${REPORT_DIR}/experiment-isolation-${RUN_LABEL}.json"

  run_logged python3 tools/prepare_aiready_image_layers.py \
    --prepared-root "${OUT_ROOT}"

  run_logged python3 tools/runtime_progress.py finish \
    --scope publish \
    --run-id "aiready-${RUN_LABEL}" \
    --status success \
    --phase prepared \
    --message "aiready prepare phase finished" \
    --completed-steps 1 \
    --total-steps 1 \
    --log-path "${LOG_PATH}"
}

# Stage 2: build Docker images referenced by the prepare manifest.
# Inputs: ${OUT_ROOT}/manifest.json and generated image contexts.
# Outputs: local/remote Docker images plus build reports under ${REPORT_DIR}.
build_stage() {
  activate_runtime
  require_manifest
  local active
  active="$(active_harnesses)"
  if [[ -z "${active}" ]]; then
    active="${HARNESSES}"
  fi

  export REGISTRY_PREFIX BASE_TAG PUSH PUSH_METHOD FORCE_REBUILD SKIP_REMOTE_EXISTING
  export DOCKER_PUSH_MAX_ATTEMPTS
  export HARNESSES="${active}"
  export VALIDATE_HARNESS_IMAGES=1
  export RUN_ID="aiready-${RUN_LABEL}"
  run_logged bash tools/build_harness_images.sh

  export SKILL_VARIANTS TASK_IDS FINAL_TAG BUILD_TIMEOUT_SEC DOCKER_BUILD_MAX_ATTEMPTS
  export FORCE_TASK_REBUILD FORCE_FINAL_REBUILD
  export IMAGES_ROOT="${OUT_ROOT}/images"
  export CONTINUE_ON_ERROR=1
  export FAILED_BUILDS_FILE="${REPORT_DIR}/failed-builds-${RUN_LABEL}.csv"
  export SKIPPED_BUILDS_FILE="${REPORT_DIR}/skipped-builds-${RUN_LABEL}.csv"
  run_logged bash tools/build_image_matrix.sh
}

# Stage 3: run the generated Harbor/formal configs in Docker containers.
# Inputs: generated config paths from ${OUT_ROOT}/manifest.json.
# Outputs: trial artifacts under ${JOBS_DIR} and monitor state under runtime-state/.
run_stage() {
  activate_runtime
  require_manifest
  local configs=()
  local config_path
  while IFS= read -r config_path; do
    [[ -n "${config_path}" ]] || continue
    configs+=("${config_path}")
  done < <(config_paths)
  if [[ "${#configs[@]}" -eq 0 ]]; then
    echo "No configs found in $(manifest_path)" >&2
    exit 1
  fi

  local preflight_args=()
  for config_path in "${configs[@]}"; do
    preflight_args+=(--config "${config_path}")
  done
  run_logged python3 tools/preflight_aiready_run.py \
    "${preflight_args[@]}" \
    --report-out "${REPORT_DIR}/preflight-${RUN_LABEL}.json"

  FORMAL_PREPULL_RETRIES="${FORMAL_PREPULL_RETRIES}" \
  FORMAL_FORCE_PULL_IMAGES="${FORMAL_FORCE_PULL_IMAGES}" \
  FORMAL_PREPULL_WITH_CRANE="${FORMAL_PREPULL_WITH_CRANE}" \
  FORMAL_FORCE_CLEAN_BEFORE_RUN="${FORMAL_FORCE_CLEAN_BEFORE_RUN}" \
  FORMAL_KEEP_LOCAL_IMAGES_REGEX="${FORMAL_KEEP_LOCAL_IMAGES_REGEX}" \
  MONITOR_REFRESH_INTERVAL_SEC="${MONITOR_REFRESH_INTERVAL_SEC}" \
  FORMAL_RUN_TIMEOUT_SEC="${FORMAL_RUN_TIMEOUT_SEC}" \
  PROGRESS_SCOPE="${PROGRESS_SCOPE}" \
  run_logged bash tools/run_formal_matrix_with_progress.sh "${configs[@]}"
}

# Stage 4: collect experiment results into analysis tables and optional dispatch stats.
# Inputs: ${JOBS_DIR} via the prepare manifest.
# Outputs: ${ANALYSIS_ROOT}/results, selected_trials.csv, and optional dispatch-stats/.
collect_stage() {
  activate_runtime
  require_manifest
  local results_dir="${RESULTS_DIR:-${ANALYSIS_ROOT}/results}"
  local selected_trials="${SELECTED_TRIALS_CSV:-${ANALYSIS_ROOT}/selected_trials.csv}"
  local dispatch_dir="${DISPATCH_STATS_DIR:-${ANALYSIS_ROOT}/dispatch-stats}"

  run_logged python3 tools/build_aiready_analysis_bundle.py \
    --manifest "$(manifest_path)" \
    --out-dir "${results_dir}"

  run_logged python3 experiment/bin/make_selected_trials_from_bundle.py \
    --bundle-dir "${results_dir}" \
    --out "${selected_trials}"

  case "${DISPATCH_STATS_MODE}" in
    none|"")
      ;;
    no-verify)
      run_logged python3 tools/stat_aiready_trials.py \
        --input "${selected_trials}" \
        --out-dir "${dispatch_dir}" \
        --env-file .env \
        --no-verify
      ;;
    verify)
      run_logged python3 tools/stat_aiready_trials.py \
        --input "${selected_trials}" \
        --out-dir "${dispatch_dir}" \
        --env-file .env \
        --verify-param "${VERIFY_PARAM:-taskId}" \
        --require-data \
        --refresh-cache
      ;;
    *)
      echo "Unsupported DISPATCH_STATS_MODE=${DISPATCH_STATS_MODE}; expected none, no-verify, or verify." >&2
      exit 2
      ;;
  esac

  echo "analysis_root=${ANALYSIS_ROOT}" | tee -a "${LOG_PATH}"
}

# Scoring stage A: materialize judge tasks from selected experiment trials.
# Inputs: selected_trials.csv, SOURCE_DOCX, SCORING_SKILLS_DIR, and rubric.
# Outputs: ${SCORING_OUT_ROOT}/manifest.json plus scoring tasks/configs.
score_prepare_stage() {
  activate_runtime
  if [[ ! -f "${SCORING_SELECTED_TRIALS_CSV}" ]]; then
    echo "Missing selected trials for scoring: ${SCORING_SELECTED_TRIALS_CSV}. Run collect first or set SCORING_SELECTED_TRIALS_CSV." >&2
    exit 1
  fi

  local optional_args=()
  if [[ -n "${SCORING_DRY_RUN_LIMIT}" ]]; then
    optional_args+=(--dry-run-limit "${SCORING_DRY_RUN_LIMIT}")
  fi
  if [[ "${SCORING_SKIP_MISSING_FINAL_PLAN}" == "1" ]]; then
    optional_args+=(--skip-missing-final-plan)
  fi
  if [[ -n "${SCORING_GENERIC_IMAGE}" ]]; then
    optional_args+=(--generic-image "${SCORING_GENERIC_IMAGE}")
  fi

  # shellcheck disable=SC2086
  run_logged python3 tools/prepare_aiready_scoring.py \
    --selected-trials "${SCORING_SELECTED_TRIALS_CSV}" \
    --source-docx "${SOURCE_DOCX}" \
    --skills-dir "${SCORING_SKILLS_DIR}" \
    --rubric "${SCORING_RUBRIC}" \
    --out-root "${SCORING_OUT_ROOT}" \
    --jobs-dir "${SCORING_JOBS_DIR}" \
    --job-name-prefix "${SCORING_JOB_NAME_PREFIX}" \
    --registry-prefix "${SCORING_REGISTRY_PREFIX}" \
    --image-tag "${SCORING_IMAGE_TAG}" \
    --dimensions ${SCORING_DIMENSIONS} \
    --judges ${SCORING_JUDGES} \
    --n-concurrent-trials "${SCORING_N_CONCURRENT_TRIALS}" \
    --agent-timeout-sec "${SCORING_AGENT_TIMEOUT_SEC}" \
    --environment-cpus "${SCORING_ENV_CPUS}" \
    --environment-memory-mb "${SCORING_ENV_MEMORY_MB}" \
    --environment-storage-mb "${SCORING_ENV_STORAGE_MB}" \
    ${optional_args[@]+"${optional_args[@]}"}
}

# Scoring stage B: build shared judge images used by scoring configs.
score_build_stage() {
  activate_runtime
  require_scoring_manifest
  REGISTRY_PREFIX="${SCORING_REGISTRY_PREFIX}" \
  IMAGE_TAG="${SCORING_IMAGE_TAG}" \
  BASE_TAG="${SCORING_BASE_TAG}" \
  HARNESSES="${SCORING_HARNESSES}" \
  JUDGES="${SCORING_JUDGES}" \
  PUSH="${SCORING_PUSH}" \
  run_logged bash tools/build_aiready_scoring_images.sh
}

# Scoring stage C: run judge configs in the same formal container runner.
score_run_stage() {
  activate_runtime
  require_scoring_manifest
  local configs=()
  local config_path
  while IFS= read -r config_path; do
    [[ -n "${config_path}" ]] || continue
    configs+=("${config_path}")
  done < <(scoring_config_paths)
  if [[ "${#configs[@]}" -eq 0 ]]; then
    echo "No scoring configs found in $(scoring_manifest_path)" >&2
    exit 1
  fi

  local preflight_args=()
  for config_path in "${configs[@]}"; do
    preflight_args+=(--config "${config_path}")
  done
  run_logged python3 tools/preflight_aiready_run.py \
    "${preflight_args[@]}" \
    --report-out "${REPORT_DIR}/scoring-preflight-${RUN_LABEL}.json"

  FORMAL_PREPULL_RETRIES="${FORMAL_PREPULL_RETRIES}" \
  FORMAL_FORCE_PULL_IMAGES="${FORMAL_FORCE_PULL_IMAGES}" \
  FORMAL_PREPULL_WITH_CRANE="${FORMAL_PREPULL_WITH_CRANE}" \
  FORMAL_FORCE_CLEAN_BEFORE_RUN="${FORMAL_FORCE_CLEAN_BEFORE_RUN}" \
  FORMAL_KEEP_LOCAL_IMAGES_REGEX="${FORMAL_KEEP_LOCAL_IMAGES_REGEX}" \
  MONITOR_REFRESH_INTERVAL_SEC="${MONITOR_REFRESH_INTERVAL_SEC}" \
  FORMAL_RUN_TIMEOUT_SEC="${FORMAL_RUN_TIMEOUT_SEC}" \
  PROGRESS_SCOPE="${PROGRESS_SCOPE}-scoring" \
  run_logged bash tools/run_formal_matrix_with_progress.sh "${configs[@]}"
}

# Scoring stage D: aggregate score.json artifacts into reviewable CSV/JSON tables.
score_aggregate_stage() {
  activate_runtime
  require_scoring_manifest
  run_logged python3 tools/aggregate_aiready_scoring.py \
    --scoring-manifest "$(scoring_manifest_path)" \
    --jobs-root "${SCORING_JOBS_DIR}" \
    --out-dir "${SCORING_OUT_DIR}"
}

score_stage() {
  score_prepare_stage
  if [[ "${SCORING_BUILD_IMAGES}" == "1" ]]; then
    score_build_stage
  fi
  if [[ "${SCORING_RUN_JOBS}" == "1" ]]; then
    score_run_stage
  fi
  score_aggregate_stage
}

# Packaging stage: copy only reusable source/materials into dist/ for GitHub upload.
package_stage() {
  activate_runtime
  run_logged python3 experiment/bin/build_github_package.py \
    --out-dir "${PACKAGE_OUT_DIR}" \
    --zip
}

status_stage() {
  activate_runtime
  python3 tools/runtime_progress.py show --scope "${STATUS_SCOPE:-all}" --format "${STATUS_FORMAT:-text}"
}

case "${COMMAND}" in
  bootstrap)
    load_profile
    bootstrap
    ;;
  prepare)
    prepare_stage
    ;;
  build)
    build_stage
    ;;
  run)
    run_stage
    ;;
  collect)
    collect_stage
    ;;
  score)
    score_stage
    ;;
  score-prepare)
    score_prepare_stage
    ;;
  score-build)
    score_build_stage
    ;;
  score-run)
    score_run_stage
    ;;
  score-aggregate)
    score_aggregate_stage
    ;;
  all)
    prepare_stage
    if [[ "${BUILD_IMAGES:-1}" == "1" ]]; then
      build_stage
    fi
    if [[ "${RUN_EXPERIMENTS:-1}" == "1" ]]; then
      run_stage
    fi
    collect_stage
    ;;
  all-with-scoring)
    prepare_stage
    if [[ "${BUILD_IMAGES:-1}" == "1" ]]; then
      build_stage
    fi
    if [[ "${RUN_EXPERIMENTS:-1}" == "1" ]]; then
      run_stage
    fi
    collect_stage
    score_stage
    ;;
  package)
    package_stage
    ;;
  status)
    status_stage
    ;;
  *)
    echo "Unknown command: ${COMMAND}" >&2
    usage >&2
    exit 2
    ;;
esac
