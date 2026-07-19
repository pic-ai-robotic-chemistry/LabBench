#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

source .venv/bin/activate
source tools/formal_env.sh

if [[ $# -lt 1 ]]; then
  echo "Usage: bash tools/run_formal_matrix_with_progress.sh <config.yaml> [<config.yaml> ...]" >&2
  exit 1
fi

TOTAL="$#"
INDEX=0
FAIL_COUNT=0
FAILED_CONFIGS=()
PROGRESS_SCOPE="${PROGRESS_SCOPE:-aiready-formal}"
FORMAL_MATRIX_FINISHED_STATE_WRITTEN=0

metadata_json_for_queue() {
  python3 - "$@" <<'PY'
import json
import sys
items = [item for item in sys.argv[1:] if item]
print(json.dumps({"queued_configs": items}, ensure_ascii=False))
PY
}

metadata_json_for_failed_queue() {
  local marker="__FAILED_CONFIGS__"
  python3 - "${marker}" "$@" <<'PY'
import json
import sys
marker = sys.argv[1]
items = sys.argv[2:]
idx = items.index(marker) if marker in items else len(items)
queued = [item for item in items[:idx] if item]
failed = [item for item in items[idx + 1:] if item]
print(json.dumps({"queued_configs": queued, "failed_configs": failed}, ensure_ascii=False))
PY
}

config_job_meta() {
  local config_path="$1"
  python3 - "${config_path}" <<'PY'
from pathlib import Path
import sys
import yaml
payload = yaml.safe_load(Path(sys.argv[1]).read_text(encoding="utf-8")) or {}
job_name = payload.get("job_name") or "unknown-job"
jobs_dir = payload.get("jobs_dir") or "jobs"
print(job_name)
print(str(Path(jobs_dir) / job_name))
PY
}

job_dir_has_finished_result() {
  local job_dir="$1"
  [[ -n "${job_dir}" && -f "${job_dir}/result.json" ]] || return 1
  python3 - "${job_dir}/result.json" <<'PY'
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

MISSING_CONFIGS=()
for CONFIG_PATH in "$@"; do
  if [[ ! -f "${CONFIG_PATH}" ]]; then
    MISSING_CONFIGS+=("${CONFIG_PATH}")
  fi
done

if [[ "${#MISSING_CONFIGS[@]}" -gt 0 ]]; then
  python3 tools/runtime_progress.py finish \
    --scope "${PROGRESS_SCOPE}" \
    --status failed \
    --phase config-missing \
    --message "AIREADY matrix refused to start because config files are missing" \
    --completed-steps 0 \
    --total-steps "${TOTAL}" \
    --metadata-json "$(python3 - "${MISSING_CONFIGS[@]}" <<'PY'
import json, sys
print(json.dumps({"missing_configs": sys.argv[1:]}, ensure_ascii=False))
PY
)"
  FORMAL_MATRIX_FINISHED_STATE_WRITTEN=1
  printf 'Missing AIREADY configs:\n' >&2
  printf '  %s\n' "${MISSING_CONFIGS[@]}" >&2
  exit 1
fi

python3 tools/validate_experiment_isolation.py \
  --scope aiready \
  $(printf -- ' --aiready-config %q' "$@") \
  --report-out "runtime-state/reports/experiment-isolation-matrix-$(date +%Y%m%d-%H%M%S).json"

finalize_matrix_on_exit() {
  local exit_code="${1:-0}"
  if [[ "${FORMAL_MATRIX_FINISHED_STATE_WRITTEN}" != "1" ]]; then
    python3 tools/runtime_progress.py finish \
      --scope "${PROGRESS_SCOPE}" \
      --status failed \
      --phase aborted \
      --message "AIREADY matrix exited unexpectedly" \
      --completed-steps "${INDEX}" \
      --total-steps "${TOTAL}" >/dev/null 2>&1 || true
  fi
  return "${exit_code}"
}
trap 'finalize_matrix_on_exit $?' EXIT

for CONFIG_PATH in "$@"; do
  INDEX=$((INDEX + 1))
  LAST_RUN_ID="aiready-matrix-$(date +%Y%m%d-%H%M%S)-${INDEX}"
  CONFIG_META="$(config_job_meta "${CONFIG_PATH}")"
  JOB_NAME="$(printf '%s\n' "${CONFIG_META}" | sed -n '1p')"
  JOB_DIR="$(printf '%s\n' "${CONFIG_META}" | sed -n '2p')"

  if job_dir_has_finished_result "${JOB_DIR}"; then
    echo "[matrix] skipping already finished config ${INDEX}/${TOTAL}: ${CONFIG_PATH}"
    python3 tools/runtime_progress.py update \
      --scope "${PROGRESS_SCOPE}" \
      --run-id "${LAST_RUN_ID}" \
      --status running \
      --phase queue \
      --message "skipped already finished AIREADY config ${INDEX}/${TOTAL}" \
      --current-item "${CONFIG_PATH}" \
      --completed-steps "${INDEX}" \
      --total-steps "${TOTAL}" \
      --config-path "${CONFIG_PATH}" \
      --job-name "${JOB_NAME}" \
      --job-dir "${JOB_DIR}" \
      --metadata-json "$(metadata_json_for_queue "$@")"
    continue
  fi

  python3 tools/runtime_progress.py update \
    --scope "${PROGRESS_SCOPE}" \
    --run-id "${LAST_RUN_ID}" \
    --status running \
    --phase queue \
    --message "starting AIREADY config ${INDEX}/${TOTAL}" \
    --current-item "${CONFIG_PATH}" \
    --completed-steps "$((INDEX - 1))" \
    --total-steps "${TOTAL}" \
    --config-path "${CONFIG_PATH}" \
    --job-name "${JOB_NAME}" \
    --job-dir "${JOB_DIR}" \
    --metadata-json "$(metadata_json_for_queue "$@")"

  set +e
  RUN_ID="${LAST_RUN_ID}" \
  PROGRESS_SCOPE="${PROGRESS_SCOPE}" \
    bash tools/run_formal_with_cleanup.sh "${CONFIG_PATH}"
  EXIT_CODE=$?
  set -e

  if [[ "${EXIT_CODE}" -ne 0 ]] && job_dir_has_finished_result "${JOB_DIR}"; then
    echo "[matrix] treating non-zero exit as success because job result is finished/effectively finished: ${JOB_DIR}" >&2
    EXIT_CODE=0
  fi

  if [[ "${EXIT_CODE}" -ne 0 ]]; then
    FAIL_COUNT=$((FAIL_COUNT + 1))
    FAILED_CONFIGS+=("${CONFIG_PATH}")
  fi

  python3 tools/runtime_progress.py update \
    --scope "${PROGRESS_SCOPE}" \
    --run-id "${LAST_RUN_ID}" \
    --status running \
    --phase queue \
    --message "finished AIREADY config ${INDEX}/${TOTAL}" \
    --current-item "${CONFIG_PATH}" \
    --completed-steps "${INDEX}" \
    --total-steps "${TOTAL}" \
    --config-path "${CONFIG_PATH}" \
    --job-name "${JOB_NAME}" \
    --job-dir "${JOB_DIR}" \
    --metadata-json "$(metadata_json_for_queue "$@")"
done

if [[ "${FAIL_COUNT}" -eq 0 ]]; then
  python3 tools/runtime_progress.py finish \
    --scope "${PROGRESS_SCOPE}" \
    --status success \
    --phase finished \
    --message "AIREADY matrix finished" \
    --completed-steps "${TOTAL}" \
    --total-steps "${TOTAL}"
  FORMAL_MATRIX_FINISHED_STATE_WRITTEN=1
else
  python3 tools/runtime_progress.py finish \
    --scope "${PROGRESS_SCOPE}" \
    --status failed \
    --phase finished \
    --message "AIREADY matrix finished with failures" \
    --completed-steps "${TOTAL}" \
    --total-steps "${TOTAL}" \
    --metadata-json "$(metadata_json_for_failed_queue "$@" __FAILED_CONFIGS__ "${FAILED_CONFIGS[@]}")"
  FORMAL_MATRIX_FINISHED_STATE_WRITTEN=1
  printf 'Failed configs:\n' >&2
  printf '  %s\n' "${FAILED_CONFIGS[@]}" >&2
  exit 1
fi
