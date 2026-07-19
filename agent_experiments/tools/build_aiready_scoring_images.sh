#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${ROOT_DIR}"

REGISTRY_PREFIX="${REGISTRY_PREFIX:-aiready-local/aiready}"
IMAGE_TAG="${IMAGE_TAG:-judge}"
BASE_TAG="${BASE_TAG:-dev}"
HARNESSES="${HARNESSES:-codex}"
JUDGES="${JUDGES:-${SCORING_JUDGES:-}}"
PUSH="${PUSH:-0}"

judge_harness() {
  case "$1" in
    judge_a)
      printf '%s\n' "codex"
      ;;
    *)
      echo "Unsupported scoring judge: $1" >&2
      return 2
      ;;
  esac
}

build_scoring_image() {
  local judge_key="$1"
  local harness="$2"
  local harness_registry_prefix="${REGISTRY_PREFIX}"
  local harness_base_tag="${BASE_TAG}"
  local harness_image
  local scoring_image

  harness_image="${harness_registry_prefix}/harness-${harness}:${harness_base_tag}"
  scoring_image="${REGISTRY_PREFIX}/scoring-judge-${judge_key}:${IMAGE_TAG}"
  echo "[scoring-image] building ${scoring_image} from ${harness_image}"
  docker build \
    --build-arg "HARNESS_IMAGE=${harness_image}" \
    -t "${scoring_image}" \
    -f scoring/images/Dockerfile \
    scoring/images

  if [[ "${PUSH}" == "1" ]]; then
    echo "[scoring-image] pushing ${scoring_image}"
    docker push "${scoring_image}"
  fi
}

if [[ -n "${JUDGES}" ]]; then
  for judge_key in ${JUDGES}; do
    harness="$(judge_harness "${judge_key}")"
    build_scoring_image "${judge_key}" "${harness}"
  done
  exit 0
fi

for harness in ${HARNESSES}; do
  case "${harness}" in
    codex)
      judge_key="judge_a"
      ;;
    *)
      echo "Unsupported scoring harness: ${harness}" >&2
      exit 2
      ;;
  esac
  build_scoring_image "${judge_key}" "${harness}"
done
