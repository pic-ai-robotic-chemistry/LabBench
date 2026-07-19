#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

source .venv/bin/activate
source tools/formal_env.sh

if [[ $# -ne 1 ]]; then
  echo "Usage: bash tools/run_formal_with_cleanup.sh <aiready-config.yaml>" >&2
  exit 1
fi

CONFIG_PATH="$1"
RUN_ID="${RUN_ID:-aiready-$(date +%Y%m%d-%H%M%S)}"
PROGRESS_SCOPE="${PROGRESS_SCOPE:-aiready-formal}"
STATE_DIR="${ROOT_DIR}/runtime-state"
LOG_DIR="${STATE_DIR}/logs"
REPORTS_DIR="${STATE_DIR}/reports"
mkdir -p "${LOG_DIR}" "${REPORTS_DIR}"
LOG_PATH="${LOG_DIR}/${RUN_ID}.log"
RUNTIME_CONFIG_TMP="$(mktemp "${STATE_DIR}/${RUN_ID}.config.XXXXXX")"
RUNTIME_CONFIG_PATH="${RUNTIME_CONFIG_TMP}.yaml"
mv "${RUNTIME_CONFIG_TMP}" "${RUNTIME_CONFIG_PATH}"
FINISHED_STATE_WRITTEN=0

cleanup_runtime_config() {
  rm -f "${RUNTIME_CONFIG_PATH}"
}

cleanup_docker_runtime() {
  local reason="${1:-manual}"
  python3 tools/docker_runtime_cleanup.py --reason "${reason}" 2>&1 | tee -a "${LOG_PATH}" >/dev/null || true
}
trap 'cleanup_runtime_config; cleanup_docker_runtime "early-exit"' EXIT

on_exit() {
  local exit_code="$?"
  cleanup_runtime_config
  cleanup_docker_runtime "exit"
  finalize_on_exit "${exit_code}"
}

python3 tools/materialize_env_config.py \
  --input "${CONFIG_PATH}" \
  --output "${RUNTIME_CONFIG_PATH}"

if [[ "${AIREADY_SKIP_EXPERIMENT_ISOLATION:-0}" != "1" ]]; then
  python3 tools/validate_experiment_isolation.py \
    --scope aiready \
    --aiready-config "${RUNTIME_CONFIG_PATH}" \
    --report-out "${REPORTS_DIR}/${RUN_ID}-isolation.json"
else
  echo "[skip] AIREADY experiment isolation validation disabled for this run" | tee -a "${LOG_PATH}"
fi

CONFIG_META="$(python3 - "${RUNTIME_CONFIG_PATH}" <<'PY'
from pathlib import Path
import sys
import yaml
payload = yaml.safe_load(Path(sys.argv[1]).read_text(encoding="utf-8")) or {}
job_name = payload.get("job_name") or "unknown-job"
jobs_dir = payload.get("jobs_dir") or "jobs"
print(job_name)
print(jobs_dir)
print(str(Path(jobs_dir) / job_name))
PY
)"
JOB_NAME="$(printf '%s\n' "${CONFIG_META}" | sed -n '1p')"
JOBS_DIR="$(printf '%s\n' "${CONFIG_META}" | sed -n '2p')"
JOB_DIR="$(printf '%s\n' "${CONFIG_META}" | sed -n '3p')"
FORMAL_ARCHIVE_EXISTING_JOB_DIR="${FORMAL_ARCHIVE_EXISTING_JOB_DIR:-1}"
FORMAL_RESUME_EXISTING_JOB_DIR="${FORMAL_RESUME_EXISTING_JOB_DIR:-0}"
FORMAL_HARBOR_REWRITE_LOCK_ON_RESUME="${FORMAL_HARBOR_REWRITE_LOCK_ON_RESUME:-0}"
FORMAL_RUN_TIMEOUT_SEC="${FORMAL_RUN_TIMEOUT_SEC:-7200}"

job_dir_has_finished_result() {
  [[ -f "${JOB_DIR}/result.json" ]] || return 1
  python3 - "${JOB_DIR}/result.json" <<'PY'
import json
import sys
from pathlib import Path
try:
    payload = json.loads(Path(sys.argv[1]).read_text(encoding="utf-8"))
except Exception:
    raise SystemExit(1)
stats = payload.get("stats") or {}
total = payload.get("n_total_trials")
try:
    total = int(total)
    completed = int(stats.get("n_completed_trials") or stats.get("n_trials") or 0)
    errored = int(stats.get("n_errored_trials") or stats.get("n_errors") or 0)
    running = int(stats.get("n_running_trials") or 0)
    pending = int(stats.get("n_pending_trials") or 0)
    cancelled = int(stats.get("n_cancelled_trials") or 0)
except Exception:
    raise SystemExit(1)
effectively_finished = (
    total > 0
    and completed == total
    and errored == 0
    and running == 0
    and pending == 0
    and cancelled == 0
)
raise SystemExit(0 if effectively_finished else 1)
PY
}

archive_existing_job_dir() {
  if [[ ! -d "${JOB_DIR}" ]]; then
    return 0
  fi
  if job_dir_has_finished_result; then
    echo "[cleanup] existing job is finished/effectively finished; keeping ${JOB_DIR}" | tee -a "${LOG_PATH}"
    return 0
  fi
  if [[ "${FORMAL_RESUME_EXISTING_JOB_DIR}" == "1" ]]; then
    echo "[cleanup] preserving existing unfinished job directory for Harbor resume: ${JOB_DIR}" | tee -a "${LOG_PATH}"
    return 0
  fi
  if [[ "${FORMAL_ARCHIVE_EXISTING_JOB_DIR}" == "1" ]]; then
    local archive_root archive_path
    archive_root="${STATE_DIR}/archived-jobs"
    archive_path="${archive_root}/${JOB_NAME}.$(date +%Y%m%d-%H%M%S)"
    mkdir -p "${archive_root}"
    echo "[cleanup] archiving existing job directory ${JOB_DIR} -> ${archive_path}" | tee -a "${LOG_PATH}"
    mv "${JOB_DIR}" "${archive_path}"
  else
    echo "[cleanup] removing existing job directory ${JOB_DIR}" | tee -a "${LOG_PATH}"
    rm -rf "${JOB_DIR}"
  fi
}

prepare_harbor_resume_job_dir() {
  if [[ "${FORMAL_RESUME_EXISTING_JOB_DIR}" != "1" ]]; then
    return 0
  fi
  if [[ "${FORMAL_HARBOR_REWRITE_LOCK_ON_RESUME}" != "1" ]]; then
    return 0
  fi
  if [[ ! -d "${JOB_DIR}" || ! -f "${JOB_DIR}/lock.json" ]]; then
    return 0
  fi
  if job_dir_has_finished_result; then
    return 0
  fi
  local backup_path
  backup_path="${JOB_DIR}/lock.json.resume-backup.$(date +%Y%m%d-%H%M%S)"
  echo "[cleanup] backing up existing Harbor lock for resume ${JOB_DIR}/lock.json -> ${backup_path}" | tee -a "${LOG_PATH}"
  mv "${JOB_DIR}/lock.json" "${backup_path}"
}

finalize_on_exit() {
  local exit_code="${1:-0}"
  if [[ "${FINISHED_STATE_WRITTEN}" != "1" ]]; then
    python3 tools/runtime_progress.py finish \
      --scope "${PROGRESS_SCOPE}" \
      --run-id "${RUN_ID}" \
      --status failed \
      --phase aborted \
      --message "AIREADY config exited unexpectedly" \
      --config-path "${CONFIG_PATH}" \
      --job-name "${JOB_NAME}" \
      --job-dir "${JOB_DIR}" \
      --log-path "${LOG_PATH}" >/dev/null 2>&1 || true
  fi
  return "${exit_code}"
}
trap on_exit EXIT

cleanup_docker_runtime "pre-run"
archive_existing_job_dir
prepare_harbor_resume_job_dir

if job_dir_has_finished_result; then
  python3 tools/runtime_progress.py finish \
    --scope "${PROGRESS_SCOPE}" \
    --run-id "${RUN_ID}" \
    --status success \
    --phase finished \
    --message "AIREADY Harbor config already finished" \
    --config-path "${CONFIG_PATH}" \
    --job-name "${JOB_NAME}" \
    --job-dir "${JOB_DIR}" \
    --log-path "${LOG_PATH}"
  FINISHED_STATE_WRITTEN=1
  exit 0
fi

python3 tools/runtime_progress.py update \
  --scope "${PROGRESS_SCOPE}" \
  --run-id "${RUN_ID}" \
  --status running \
  --phase harbor-run \
  --message "running AIREADY Harbor config" \
  --current-item "${CONFIG_PATH}" \
  --config-path "${CONFIG_PATH}" \
  --job-name "${JOB_NAME}" \
  --job-dir "${JOB_DIR}" \
  --log-path "${LOG_PATH}"

echo "[aiready-run] config: ${CONFIG_PATH}" | tee -a "${LOG_PATH}"
echo "[aiready-run] runtime config: ${RUNTIME_CONFIG_PATH}" | tee -a "${LOG_PATH}"
echo "[aiready-run] job: ${JOB_NAME}" | tee -a "${LOG_PATH}"
echo "[aiready-run] job dir: ${JOB_DIR}" | tee -a "${LOG_PATH}"

set +e
python3 tools/run_with_timeout.py "${FORMAL_RUN_TIMEOUT_SEC}" harbor run -c "${RUNTIME_CONFIG_PATH}" -y 2>&1 | tee -a "${LOG_PATH}"
EXIT_CODE=${PIPESTATUS[0]}
set -e

if [[ "${EXIT_CODE}" -ne 0 ]] && job_dir_has_finished_result; then
  echo "[aiready-run] non-zero Harbor exit treated as success because result.json is finished/effectively finished" | tee -a "${LOG_PATH}"
  EXIT_CODE=0
fi

if [[ "${EXIT_CODE}" -eq 0 ]]; then
  python3 tools/runtime_progress.py finish \
    --scope "${PROGRESS_SCOPE}" \
    --run-id "${RUN_ID}" \
    --status success \
    --phase finished \
    --message "AIREADY Harbor config finished" \
    --config-path "${CONFIG_PATH}" \
    --job-name "${JOB_NAME}" \
    --job-dir "${JOB_DIR}" \
    --log-path "${LOG_PATH}"
  FINISHED_STATE_WRITTEN=1
  exit 0
fi

python3 tools/runtime_progress.py finish \
  --scope "${PROGRESS_SCOPE}" \
  --run-id "${RUN_ID}" \
  --status failed \
  --phase failed \
  --message "AIREADY Harbor config failed" \
  --config-path "${CONFIG_PATH}" \
  --job-name "${JOB_NAME}" \
  --job-dir "${JOB_DIR}" \
  --log-path "${LOG_PATH}"
FINISHED_STATE_WRITTEN=1
exit "${EXIT_CODE}"
