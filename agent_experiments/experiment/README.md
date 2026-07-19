# AIREADY Workflow Manual

`experiment/` provides the public workflow entrypoint for preparing, running, collecting, scoring, and packaging AIREADY experiments. The scripts in this directory call the lower-level modules under `tools/`, `agents/`, `environments/`, and `images/` in a reproducible order.

## Directory Contents

```text
experiment/
├── README.md
├── bin/
│   ├── aiready_workflow.sh
│   ├── build_github_package.py
│   └── make_selected_trials_from_bundle.py
└── profiles/
    ├── aiready-v15-smoke.env
    └── aiready-v15-full.env
```

## Entry Point

Use `bin/aiready_workflow.sh` for normal operation:

```bash
bash experiment/bin/aiready_workflow.sh <command> [--profile PATH] [--run-label LABEL]
```

Supported commands:

- `bootstrap`: create/update `.venv` and install the repository in editable mode.
- `prepare`: generate benchmark tasks, Harbor configs, manifests, and Docker build contexts.
- `build`: build base, harness, task, and final experiment images.
- `run`: preflight generated configs and execute trials in containers.
- `collect`: aggregate trial results and optionally compute dispatch statistics.
- `score`: run `score-prepare`, `score-build`, `score-run`, and `score-aggregate`.
- `score-prepare`: create judge tasks and scoring configs from selected trials.
- `score-build`: build shared judge images.
- `score-run`: run judge configs in containers.
- `score-aggregate`: aggregate judge `score.json` artifacts.
- `all`: run `prepare`, `build`, `run`, and `collect`.
- `all-with-scoring`: run the full experiment and scoring chain.
- `package`: create a clean source package under `dist/`.
- `status`: print runtime progress from `runtime-state/`.

## Profiles

Profiles contain public experiment parameters. Secrets belong in the repository root `.env`, not in profile files.

### `profiles/aiready-v15-smoke.env`

The smoke profile is intended for quick end-to-end validation:

- task: `A01`
- harness: `openclaw`
- model: `model_a`
- skill: `aiready-skill-7.6`
- attempts: `1`
- dispatch statistics: `no-verify`
- scoring: enabled with `judge_a`

### `profiles/aiready-v15-full.env`

The full profile expands the V15 benchmark matrix:

- task groups: A, B, C, D, E, F, and G tasks configured in the profile.
- harnesses: the package supports `claude-code`, `codex`, `gemini-cli`, `hermes`, `kilo-code`, and `openclaw`. The public full profile starts with OpenClaw as a conservative baseline; edit `HARNESSES` to expand the harness matrix.
- models: the public baseline uses `model_a`; add aliases in `tools/prepare_aiready_experiment.py` and list them in `MODELS` to expand the matrix.
- skill: `aiready-skill-7.6`.
- scoring: enabled.

## Environment Setup

Create your private environment file:

```bash
cp .env.example .env
```

Fill the sections needed for your run:

- Docker and registry credentials.
- Model credentials for variables referenced by generated configs.
- AICHEM/303 credentials if agents need lab endpoints.
- Dispatch verification endpoint if `DISPATCH_STATS_MODE=verify`.
- Runtime aliases required by the selected harnesses.

Then bootstrap:

```bash
bash experiment/bin/aiready_workflow.sh bootstrap
```

## Prepare-Only Smoke

Use this to validate task generation without building images or calling model endpoints:

```bash
BUILD_IMAGES=0 RUN_EXPERIMENTS=0 \
bash experiment/bin/aiready_workflow.sh prepare \
  --profile experiment/profiles/aiready-v15-smoke.env \
  --run-label smoke-prepare
```

Expected outputs:

```text
runs/smoke-prepare/generated/manifest.json
runs/smoke-prepare/generated/configs/
runs/smoke-prepare/generated/tasks/
runs/smoke-prepare/generated/images/
runs/smoke-prepare/reports/experiment-isolation-smoke-prepare.json
```

The generated manifest should include:

```text
aiready-skill-7.6
```

## Experiment Smoke

Run image build, container execution, and collection:

```bash
bash experiment/bin/aiready_workflow.sh all \
  --profile experiment/profiles/aiready-v15-smoke.env \
  --run-label smoke-a01
```

Important outputs:

```text
runs/smoke-a01/generated/manifest.json
runs/smoke-a01/jobs/
runs/smoke-a01/analysis/results/trial-summary.csv
runs/smoke-a01/analysis/selected_trials.csv
runs/smoke-a01/logs/workflow.log
```

## Experiment And Scoring Smoke

Run the full chain:

```bash
bash experiment/bin/aiready_workflow.sh all-with-scoring \
  --profile experiment/profiles/aiready-v15-smoke.env \
  --run-label smoke-a01-scored
```

Important scoring outputs:

```text
runs/smoke-a01-scored/scoring/generated/manifest.json
runs/smoke-a01-scored/scoring/jobs/
runs/smoke-a01-scored/analysis/scoring/summary.json
runs/smoke-a01-scored/analysis/scoring/per_judge_scores.csv
runs/smoke-a01-scored/analysis/scoring/per_trial_dimension_scores.csv
runs/smoke-a01-scored/analysis/scoring/per_trial_overall_scores.csv
```

## Full V15 Run

```bash
bash experiment/bin/aiready_workflow.sh all-with-scoring \
  --profile experiment/profiles/aiready-v15-full.env \
  --run-label v15-full-$(date +%Y%m%d-%H%M%S)
```

Before running the full profile, review:

- `REGISTRY_PREFIX`
- `IMAGE_TAG`, `BASE_TAG`, `FINAL_TAG`
- `PUSH`
- `N_CONCURRENT_TRIALS`
- `AGENT_TIMEOUT_SEC`
- `DISPATCH_STATS_MODE`
- scoring judge and dimension settings

## Resume By Stage

Use the same run label to continue a run:

```bash
bash experiment/bin/aiready_workflow.sh build \
  --profile experiment/profiles/aiready-v15-full.env \
  --run-label v15-full

bash experiment/bin/aiready_workflow.sh run \
  --profile experiment/profiles/aiready-v15-full.env \
  --run-label v15-full

bash experiment/bin/aiready_workflow.sh collect \
  --profile experiment/profiles/aiready-v15-full.env \
  --run-label v15-full

bash experiment/bin/aiready_workflow.sh score-aggregate \
  --profile experiment/profiles/aiready-v15-full.env \
  --run-label v15-full
```

## Stage Details

### `prepare`

Calls:

```text
tools/runtime_progress.py start
tools/prepare_aiready_experiment.py
tools/validate_experiment_isolation.py
tools/prepare_aiready_image_layers.py
tools/runtime_progress.py finish
```

Outputs:

```text
runs/<run-label>/generated/manifest.json
runs/<run-label>/generated/configs/
runs/<run-label>/generated/tasks/
runs/<run-label>/generated/images/
runs/<run-label>/reports/experiment-isolation-<run-label>.json
```

### `build`

Calls:

```text
tools/build_harness_images.sh
tools/build_image_matrix.sh
tools/build_layered_final_image.sh
tools/validate_built_image.py
```

Outputs:

```text
runs/<run-label>/reports/failed-builds-<run-label>.csv
runs/<run-label>/reports/skipped-builds-<run-label>.csv
runs/<run-label>/logs/workflow.log
```

### `run`

Calls:

```text
tools/preflight_aiready_run.py
tools/run_formal_matrix_with_progress.sh
tools/run_formal_with_cleanup.sh
environments/prebuilt_local_docker.py
```

Outputs:

```text
runs/<run-label>/jobs/
runs/<run-label>/reports/preflight-<run-label>.json
runtime-state/
```

### `collect`

Calls:

```text
tools/build_aiready_analysis_bundle.py
experiment/bin/make_selected_trials_from_bundle.py
tools/stat_aiready_trials.py
```

Outputs:

```text
runs/<run-label>/analysis/results/manifest.json
runs/<run-label>/analysis/results/trial-summary.csv
runs/<run-label>/analysis/results/lead-summary.md
runs/<run-label>/analysis/selected_trials.csv
runs/<run-label>/analysis/dispatch-stats/
```

### `score-prepare`

Calls:

```text
tools/prepare_aiready_scoring.py
```

Outputs:

```text
runs/<run-label>/scoring/generated/manifest.json
runs/<run-label>/scoring/generated/prepared_items.jsonl
runs/<run-label>/scoring/generated/skipped_items.jsonl
runs/<run-label>/scoring/generated/configs/
runs/<run-label>/scoring/generated/tasks/
```

### `score-build`

Calls:

```text
tools/build_aiready_scoring_images.sh
```

The stage builds judge images referenced by the scoring configs and pushes them only when `SCORING_PUSH=1`.

### `score-run`

Calls:

```text
tools/preflight_aiready_run.py
tools/run_formal_matrix_with_progress.sh
tools/run_formal_with_cleanup.sh
```

Each judge task writes:

```text
/workspace/score.json
/logs/artifacts/score.json
```

### `score-aggregate`

Calls:

```text
tools/aggregate_aiready_scoring.py
```

Outputs:

```text
runs/<run-label>/analysis/scoring/summary.json
runs/<run-label>/analysis/scoring/per_judge_scores.csv
runs/<run-label>/analysis/scoring/per_trial_dimension_scores.csv
runs/<run-label>/analysis/scoring/per_trial_overall_scores.csv
runs/<run-label>/analysis/scoring/disagreement_cases.csv
```

### `package`

Calls:

```text
experiment/bin/build_github_package.py
```

Outputs:

```text
dist/aiready-experiment-workflow/
dist/aiready-experiment-workflow.zip
```

The package includes source files, documentation, workflow profiles, runtime templates, scoring assets and benchmark input. Skill files, private credentials and generated runtime outputs are not part of this repository.

## Common Profile Settings

Select tasks:

```bash
TASK_IDS="A01 A02 A03 A04"
```

Select harnesses:

```bash
HARNESSES="claude-code codex gemini-cli hermes kilo-code openclaw"
```

Select models:

```bash
MODELS="model_a"
```

Select the locally supplied skill:

```bash
SKILL_VARIANTS="aiready-skill-7.6"
SCORING_SKILLS_DIR="aiready/aiready_skill_7.6"
```

Place the required skill snapshot at `aiready/aiready_skill_7.6/` before running these profiles.

Configure image publishing:

```bash
REGISTRY_PREFIX="your-registry.example.com/your-namespace/aiready"
IMAGE_TAG="v15-$(date +%Y%m%d-%H%M%S)"
BASE_TAG="${IMAGE_TAG}"
FINAL_TAG="${IMAGE_TAG}"
PUSH=1
PUSH_METHOD=docker
SKIP_REMOTE_EXISTING=1
```

Configure concurrency and timeout:

```bash
N_CONCURRENT_TRIALS=4
AGENT_TIMEOUT_SEC=1800
```

Configure dispatch statistics:

```bash
DISPATCH_STATS_MODE=none
DISPATCH_STATS_MODE=no-verify
DISPATCH_STATS_MODE=verify
VERIFY_PARAM=taskId
```

Configure scoring:

```bash
SCORING_JUDGES="judge_a"
SCORING_HARNESSES="codex"
SCORING_DIMENSIONS="physical_implementability"
SCORING_DRY_RUN_LIMIT=5
```

## Checks

After shell-script edits:

```bash
bash -n experiment/bin/aiready_workflow.sh
```

After Python edits:

```bash
python3 -m py_compile \
  experiment/bin/build_github_package.py \
  experiment/bin/make_selected_trials_from_bundle.py \
  tools/prepare_aiready_experiment.py \
  tools/prepare_aiready_scoring.py
```

Before publishing a package:

```bash
bash experiment/bin/aiready_workflow.sh package
unzip -t dist/aiready-experiment-workflow.zip
```

## Troubleshooting

If `prepare` cannot find a skill, verify `SKILL_VARIANTS` and `SCORING_SKILLS_DIR`.

If `build` cannot pull base images, check Docker networking, registry auth, and proxy settings.

If `run` fails before starting a trial, inspect:

```bash
cat runs/<run-label>/reports/preflight-<run-label>.json
tail -200 runs/<run-label>/logs/workflow.log
```

If `collect` cannot produce `selected_trials.csv`, check whether `runs/<run-label>/jobs/` contains completed trial directories and valid `result.json` files.

If scoring skips entries, inspect:

```bash
cat runs/<run-label>/scoring/generated/skipped_items.jsonl
```

If verified dispatch statistics are zero, confirm that trial artifacts contain numeric task IDs and that `.env` contains a valid `verify_endpoint` and authorization header.
