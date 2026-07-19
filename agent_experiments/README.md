# AIREADY

AIREADY is a reproducible workflow for evaluating chemistry experiment-planning agents on the AIREADY benchmark. It packages the benchmark source, containerized agent harnesses, experiment preparation scripts, image build scripts, trial execution helpers, dispatch-rate analysis, and LLM-judge scoring into one reusable project.

The intended user is someone who wants to understand AIREADY and reproduce the experiment chain from a clean checkout:

1. Configure local secrets in `.env`.
2. Generate benchmark tasks and Harbor/formal configs.
3. Build base, harness, task, and final Docker images.
4. Run containerized experiment trials.
5. Collect trial artifacts and compute dispatch statistics.
6. Prepare, run, and aggregate scoring jobs.
7. Package the reusable source tree.

Runtime outputs and credentials are intentionally excluded from the source package. The public package contains templates and scripts only.

## Repository Layout

```text
.
├── README.md
├── .env.example
├── pyproject.toml
├── Benchmark_V15.docx
├── agents/
├── environments/
├── experiment/
├── images/
├── runtime-configs/
├── scoring/
└── tools/
```

### Top-Level Files

- `README.md`: this project guide. It explains the reproduction chain, file roles, commands, configuration variables, and output layout.
- `.env.example`: local environment template. Copy it to `.env` and fill secrets on the machine that runs experiments. Do not commit `.env`.
- `pyproject.toml`: Python package metadata. It declares the editable install and restricts package discovery to `agents*` and `environments*` so generated folders are not treated as Python packages.
- `Benchmark_V15.docx`: AIREADY V15 benchmark source document. `tools/prepare_aiready_experiment.py` parses it into individual task directories and model-facing instructions.

Skill files are not distributed in this repository. Place the required local snapshot at `aiready/aiready_skill_7.6/` before running the supplied profiles; this path is ignored by Git.

### `agents/`

`agents/` contains Harbor/formal agent wrappers. There are two layers:

- `aiready_<harness>.py`: a small AIREADY entrypoint class referenced by generated YAML configs.
- `preinstalled_<harness>.py`: the actual runtime adapter for a prebuilt CLI image. It prepares environment variables, registers skills, runs the CLI non-interactively, enforces the JSON output contract, exports final artifacts, and records runtime logs or token/session metadata when the CLI exposes them.

Files:

- `agents/aiready_claude_code.py`: AIREADY entrypoint for Claude Code.
- `agents/aiready_codex.py`: AIREADY entrypoint for Codex.
- `agents/aiready_gemini_cli.py`: AIREADY entrypoint for Gemini CLI.
- `agents/aiready_hermes.py`: AIREADY entrypoint for Hermes.
- `agents/aiready_kilo_code.py`: AIREADY entrypoint for Kilo Code.
- `agents/aiready_openclaw.py`: AIREADY entrypoint for OpenClaw.
- `agents/preinstalled_claude_code.py`: Claude Code adapter. It uses Anthropic-compatible environment variables such as `ANTHROPIC_API_KEY`, `ANTHROPIC_AUTH_TOKEN`, `ANTHROPIC_BASE_URL`, and `ANTHROPIC_MODEL`, plus optional Bedrock variables if the user configures them.
- `agents/preinstalled_codex.py`: Codex adapter. It writes a clean Codex runtime config, configures an OpenAI-compatible provider from `OPENAI_API_KEY` and `OPENAI_BASE_URL`, runs `codex exec`, and exports Codex session artifacts.
- `agents/preinstalled_gemini_cli.py`: Gemini CLI adapter. It uses `GEMINI_API_KEY` or `GOOGLE_API_KEY`, optional `GOOGLE_GEMINI_BASE_URL`, Gemini runtime home isolation, and Gemini session export.
- `agents/preinstalled_hermes.py`: Hermes adapter. It supports explicit `openai/` or `anthropic/` model prefixes, or a bare model with `HERMES_PROVIDER=openai` or `HERMES_PROVIDER=anthropic`.
- `agents/preinstalled_kilo_code.py`: Kilo Code adapter. It writes a Kilo/OpenCode-compatible model provider config using `OPENAI_API_KEY`, `OPENAI_BASE_URL`, and `KILO_PROVIDER_ID` when supplied.
- `agents/preinstalled_openclaw.py`: OpenClaw adapter. It registers an OpenAI-compatible provider in OpenClaw, mounts skills, runs OpenClaw non-interactively, and exports native session metadata.
- `agents/experiment_plan_export.py`: shared helper that extracts or copies the final JSON experiment plan from agent output into `/logs/artifacts/final_plan.json`.
- `agents/runtime_config_support.py`: shared helper for mounting minimal runtime configs, copying config files, and patching AICHEM token config inside containers.

### `environments/`

- `environments/prebuilt_local_docker.py`: Harbor/formal environment adapter for prebuilt local Docker images. It launches tasks from images built by this workflow and sends environment variables through `docker exec` stdin so secrets do not appear directly in process arguments.

### `experiment/`

`experiment/` is the recommended workflow entrypoint.

- `experiment/bin/aiready_workflow.sh`: top-level command wrapper. It implements `bootstrap`, `prepare`, `build`, `run`, `collect`, `score`, `all`, `all-with-scoring`, `package`, and `status`.
- `experiment/bin/build_github_package.py`: builds a clean source package under `dist/aiready-experiment-workflow` and optionally writes `dist/aiready-experiment-workflow.zip`.
- `experiment/bin/make_selected_trials_from_bundle.py`: converts collected trial summaries into `selected_trials.csv`, which is used by dispatch statistics and scoring.
- `experiment/profiles/aiready-v15-smoke.env`: small A01 smoke profile for validating the pipeline.
- `experiment/profiles/aiready-v15-full.env`: full V15 profile template for the complete benchmark.
- `experiment/README.md`: workflow-specific manual for the `experiment/` directory.

### `images/`

`images/` contains Docker build contexts for layered experiment images.

- `images/base/Dockerfile`: base runtime with Python, Node-compatible system tools, `jq`, `ripgrep`, `requests`, `openpyxl`, and `anthropic`.
- `images/harness/claude-code/Dockerfile`: installs Claude Code into the harness layer.
- `images/harness/codex/Dockerfile`: installs Codex into the harness layer.
- `images/harness/gemini-cli/Dockerfile`: installs Gemini CLI into the harness layer.
- `images/harness/hermes/Dockerfile`: builds and installs Hermes CLI and its browser-related runtime dependencies.
- `images/harness/kilo-code/Dockerfile`: installs Kilo Code CLI into the harness layer.
- `images/harness/openclaw/Dockerfile`: installs OpenClaw into the harness layer.

The final experiment image is built in four layers:

```text
base image -> harness image -> task image -> skill image
```

This layering lets multiple tasks and skill variants reuse the same base and harness layers.

### `runtime-configs/`

Runtime config templates are intentionally minimal and safe to publish.

- `runtime-configs/README.md`: rules for runtime config templates.
- `runtime-configs/codex/config.toml`: placeholder Codex provider config.
- `runtime-configs/codex/auth.json`: placeholder Codex auth file. It must not contain real credentials.
- `runtime-configs/claude-code/.claude.json`: placeholder Claude Code config.
- `runtime-configs/claude-code/settings.json`: placeholder Claude Code settings.
- `runtime-configs/manifest.json`: generated by the package builder with relative paths. Do not copy local absolute-path manifests into the public package.

Gemini CLI, Hermes, Kilo Code, and OpenClaw are configured through generated YAML environment variables and their isolated container runtime directories.

### `scoring/`

- `scoring/README.md`: scoring package notes.
- `scoring/aiready_scoring_rubric_en.md`: scoring rubric used by judge prompts.
- `scoring/score_rule_en/`: dimension-specific scoring rule files.
- `scoring/images/`: shared image assets for scoring tasks.

The scoring pipeline reads selected experiment trials, creates judge tasks, runs judge containers, and aggregates `score.json` artifacts into CSV/JSON tables.

### `tools/`

Core workflow tools:

- `tools/prepare_aiready_experiment.py`: parses the benchmark DOCX, generates task directories, prebuilt task trees, Harbor/formal YAML configs, and `manifest.json`.
- `tools/prepare_aiready_image_layers.py`: reads the generated manifest and creates layered Docker build contexts under `runs/<run-label>/generated/images`.
- `tools/prepare_image_layers.py`: lower-level reusable task/skill layer builder used by the AIREADY image-layer script.
- `tools/build_harness_images.sh`: builds base and harness images for selected harnesses.
- `tools/build_image_matrix.sh`: builds task and final images for every task/harness/skill combination in the generated manifest.
- `tools/build_layered_final_image.sh`: builds one task/final image pair.
- `tools/validate_built_image.py`: smoke-tests built harness and final images.
- `tools/validate_experiment_isolation.py`: checks generated YAML configs for the correct wrappers, datasets, artifacts, and output contract.
- `tools/preflight_aiready_run.py`: validates configs before running the formal matrix.
- `tools/run_formal_matrix_with_progress.sh`: runs one or more generated configs and records progress.
- `tools/run_formal_with_cleanup.sh`: executes a single formal config with Docker cleanup behavior.
- `tools/runtime_progress.py`: writes and displays progress state under `runtime-state/`.
- `tools/materialize_env_config.py`: expands `${ENV_VAR}` placeholders in YAML configs using the local process environment.
- `tools/output_contract.py`: shared output-contract logic for required JSON plan and scoring artifacts.
- `tools/build_aiready_analysis_bundle.py`: collects trial artifacts into analysis tables and a reviewable result bundle.
- `tools/stat_aiready_trials.py`: computes dispatch statistics from selected trials; it can run in no-verify mode or verify mode.
- `tools/prepare_aiready_scoring.py`: creates scoring tasks and judge configs from `selected_trials.csv`.
- `tools/build_aiready_scoring_images.sh`: builds shared judge images for scoring.
- `tools/aggregate_aiready_scoring.py`: aggregates judge `score.json` files into final score tables.
- `tools/docker_runtime_cleanup.py`: cleanup helper for stale Docker resources.
- `tools/formal_env.sh`: loads `.env` and common runtime environment settings.
- `tools/push_local_image_to_harbor_via_crane.sh`: optional push fallback using `crane`.
- `tools/render_formal_monitor.py`: renders formal run monitor output.
- `tools/resolve_formal_task_platform.py`: resolves platform metadata for task image builds.
- `tools/run_with_timeout.py`: portable timeout helper used when GNU `timeout` is unavailable.
- `tools/task_inventory.py`: task-directory inspection and image-name sanitization helpers.

## Requirements

- Docker available from the command line.
- Python 3.12 recommended. The workflow uses `python3.12` when available and falls back to `python3`.
- Network access to the model endpoints configured in `.env`.
- A Docker registry if you set `PUSH=1`.
- AICHEM/303 credentials if agents need laboratory endpoint access or if dispatch verification is enabled.

## Environment Setup

Create your private local environment file:

```bash
cp .env.example .env
```

Fill only the sections needed for your run:

- Docker and registry credentials.
- Optional proxy settings.
- AICHEM/303 endpoint credentials.
- Dispatch verification endpoint and authorization header, if `DISPATCH_STATS_MODE=verify`.
- Model endpoint and harness-specific API keys.
- Scoring judge model endpoint and key.

Do not put secrets in `experiment/profiles/*.env`. Profiles should stay shareable; `.env` is private and machine-local.

## Model Configuration

The public profiles use one neutral experiment model alias:

```text
model_a
```

`tools/prepare_aiready_experiment.py` expands that alias into generated YAML configs. The default variables are:

```text
AIREADY_MODEL_A_NAME
AIREADY_MODEL_A_BASE_URL
AIREADY_MODEL_A_ANTHROPIC_BASE_URL
AIREADY_MODEL_A_GEMINI_BASE_URL
AIREADY_<HARNESS>_MODEL_A_API_KEY
```

Harness-specific keys:

```text
AIREADY_CLAUDE_CODE_MODEL_A_API_KEY
AIREADY_CODEX_MODEL_A_API_KEY
AIREADY_GEMINI_CLI_MODEL_A_API_KEY
AIREADY_HERMES_MODEL_A_API_KEY
AIREADY_KILO_CODE_MODEL_A_API_KEY
AIREADY_OPENCLAW_MODEL_A_API_KEY
```

Only fill the keys for harnesses selected in `HARNESSES`.

Endpoint protocols:

- Claude Code uses the Anthropic-compatible endpoint variables.
- Gemini CLI uses the Gemini-compatible endpoint variables.
- Codex, Hermes, Kilo Code, and OpenClaw use the OpenAI-compatible endpoint variables.

To add another model alias:

1. Add an entry to `MODELS` in `tools/prepare_aiready_experiment.py`.
2. Add corresponding variables to `.env.example` and your private `.env`.
3. Add the alias to `MODELS` in the active profile.

Example:

```bash
MODELS="model_a model_b"
```

## Profiles And Parameters

Profiles live under `experiment/profiles/`.

`experiment/profiles/aiready-v15-smoke.env` is for quick validation:

```bash
TASK_IDS="A01"
HARNESSES="openclaw"
MODELS="model_a"
SKILL_VARIANTS="aiready-skill-7.6"
N_ATTEMPTS=1
N_CONCURRENT_TRIALS=1
AGENT_TIMEOUT_SEC=120
DISPATCH_STATS_MODE=no-verify
SCORING_ENABLED=1
SCORING_HARNESSES="codex"
SCORING_JUDGES="judge_a"
```

`experiment/profiles/aiready-v15-full.env` is the full benchmark template. Edit these variables most often:

```bash
# Select benchmark tasks.
TASK_IDS="A01 A02 E01"

# Select agent harnesses.
HARNESSES="claude-code codex gemini-cli hermes kilo-code openclaw"

# Select model aliases registered in tools/prepare_aiready_experiment.py.
MODELS="model_a"

# Select skill aliases.
SKILL_VARIANTS="aiready-skill-7.6"

# Docker image naming and registry behavior.
REGISTRY_PREFIX="registry.example.com/namespace/aiready-v15"
IMAGE_TAG="v15"
BASE_TAG="${IMAGE_TAG}"
FINAL_TAG="${IMAGE_TAG}"
PUSH=1

# Throughput and resource controls.
N_ATTEMPTS=1
N_CONCURRENT_TRIALS=10
AGENT_TIMEOUT_SEC=1800
AIREADY_ENV_CPUS=2
AIREADY_ENV_MEMORY_MB=12288
AIREADY_ENV_STORAGE_MB=20480
```

Trial count is approximately:

```text
number of TASK_IDS
* number of HARNESSES
* number of MODELS
* number of SKILL_VARIANTS
* N_ATTEMPTS
```

## Quick Start

Bootstrap the Python environment:

```bash
bash experiment/bin/aiready_workflow.sh bootstrap
```

Generate a prepare-only smoke run without building images or running containers:

```bash
BUILD_IMAGES=0 RUN_EXPERIMENTS=0 \
bash experiment/bin/aiready_workflow.sh prepare \
  --profile experiment/profiles/aiready-v15-smoke.env \
  --run-label smoke-prepare
```

Run the smoke experiment:

```bash
bash experiment/bin/aiready_workflow.sh all \
  --profile experiment/profiles/aiready-v15-smoke.env \
  --run-label smoke-a01
```

Run the smoke experiment and scoring chain:

```bash
bash experiment/bin/aiready_workflow.sh all-with-scoring \
  --profile experiment/profiles/aiready-v15-smoke.env \
  --run-label smoke-a01-scored
```

Run a full profile:

```bash
bash experiment/bin/aiready_workflow.sh all-with-scoring \
  --profile experiment/profiles/aiready-v15-full.env \
  --run-label v15-full-$(date +%Y%m%d-%H%M%S)
```

Show progress:

```bash
bash experiment/bin/aiready_workflow.sh status
```

## Stage Commands

Use the same `--run-label` to resume a run stage by stage.

Prepare:

```bash
bash experiment/bin/aiready_workflow.sh prepare \
  --profile experiment/profiles/aiready-v15-full.env \
  --run-label v15-full
```

What it does:

- starts a progress record
- parses the benchmark DOCX
- generates task directories
- generates prebuilt task trees
- generates Harbor/formal YAML configs
- validates isolation
- prepares layered Docker contexts

Build:

```bash
bash experiment/bin/aiready_workflow.sh build \
  --profile experiment/profiles/aiready-v15-full.env \
  --run-label v15-full
```

What it does:

- builds the base image
- builds selected harness images
- builds task-layer images
- builds final skill-layer images
- validates images with CLI smoke tests
- pushes images when `PUSH=1`

Run:

```bash
bash experiment/bin/aiready_workflow.sh run \
  --profile experiment/profiles/aiready-v15-full.env \
  --run-label v15-full
```

What it does:

- preflights generated configs
- materializes environment variables from `.env`
- runs the config matrix in containers
- records jobs under `runs/<run-label>/jobs`

Collect:

```bash
bash experiment/bin/aiready_workflow.sh collect \
  --profile experiment/profiles/aiready-v15-full.env \
  --run-label v15-full
```

What it does:

- gathers raw trial files
- writes trial summary tables
- creates `selected_trials.csv`
- computes dispatch statistics when enabled

Score:

```bash
bash experiment/bin/aiready_workflow.sh score \
  --profile experiment/profiles/aiready-v15-full.env \
  --run-label v15-full
```

What it does:

- prepares scoring tasks from selected trials
- builds judge images
- runs judge configs
- aggregates `score.json` files into score tables

Package:

```bash
bash experiment/bin/aiready_workflow.sh package \
  --profile experiment/profiles/aiready-v15-smoke.env \
  --run-label package-check
```

What it does:

- writes `dist/aiready-experiment-workflow`
- writes `dist/aiready-experiment-workflow.zip`
- excludes `.env`, `.venv`, `runs/`, `jobs/`, `analysis/`, `runtime-state/`, nested `dist/`, and other generated outputs

## Dispatch Statistics

Dispatch statistics are controlled by `DISPATCH_STATS_MODE`.

```bash
# Disable dispatch statistics.
DISPATCH_STATS_MODE=none

# Extract candidate task IDs from local artifacts only.
DISPATCH_STATS_MODE=no-verify

# Verify extracted task IDs through the endpoint configured in .env.
DISPATCH_STATS_MODE=verify
VERIFY_PARAM=taskId
```

Verified mode uses:

```bash
python3 tools/stat_aiready_trials.py \
  --input runs/<run-label>/analysis/selected_trials.csv \
  --out-dir runs/<run-label>/analysis/dispatch-stats \
  --env-file .env \
  --verify-param taskId \
  --require-data \
  --refresh-cache
```

No-verify mode uses:

```bash
python3 tools/stat_aiready_trials.py \
  --input runs/<run-label>/analysis/selected_trials.csv \
  --out-dir runs/<run-label>/analysis/dispatch-stats \
  --env-file .env \
  --no-verify
```

## Scoring

The scoring chain is independent from the experiment harness. A common setup is to run experiments with one or more generation harnesses and score the resulting plans with a Codex-compatible judge.

Important scoring variables:

```bash
SCORING_ENABLED=1
SCORING_BUILD_IMAGES=1
SCORING_RUN_JOBS=1
SCORING_HARNESSES="codex"
SCORING_JUDGES="judge_a"
SCORING_DIMENSIONS="physical_implementability workflow_completeness design_rationality"
SCORING_SKILLS_DIR="aiready/aiready_skill_7.6"  # local, not distributed
SCORING_SELECTED_TRIALS_CSV="runs/<run-label>/analysis/selected_trials.csv"
```

Judge credentials are configured in `.env`:

```text
AIREADY_SCORING_JUDGE_A_MODEL_NAME
AIREADY_SCORING_JUDGE_A_BASE_URL
AIREADY_SCORING_JUDGE_A_API_KEY
```

Run scoring only:

```bash
bash experiment/bin/aiready_workflow.sh score \
  --profile experiment/profiles/aiready-v15-full.env \
  --run-label v15-full
```

Run scoring sub-stages:

```bash
bash experiment/bin/aiready_workflow.sh score-prepare \
  --profile experiment/profiles/aiready-v15-full.env \
  --run-label v15-full

bash experiment/bin/aiready_workflow.sh score-build \
  --profile experiment/profiles/aiready-v15-full.env \
  --run-label v15-full

bash experiment/bin/aiready_workflow.sh score-run \
  --profile experiment/profiles/aiready-v15-full.env \
  --run-label v15-full

bash experiment/bin/aiready_workflow.sh score-aggregate \
  --profile experiment/profiles/aiready-v15-full.env \
  --run-label v15-full
```

## Output Layout

Each run writes to:

```text
runs/<run-label>/
  generated/
    manifest.json
    configs/
    tasks/
    prebuilt-tasks/
    images/
  jobs/
  analysis/
    results/
    selected_trials.csv
    dispatch-stats/
    scoring/
  logs/
    workflow.log
  reports/
  scoring/
    generated/
    jobs/
```

Important files:

- `runs/<run-label>/generated/manifest.json`: generated tasks, configs, selected harnesses, selected model aliases, image roots, and skill variants.
- `runs/<run-label>/generated/configs/`: Harbor/formal YAML configs.
- `runs/<run-label>/generated/tasks/`: task source trees with instructions, tests, reference solution, and skill copy.
- `runs/<run-label>/generated/images/`: Docker build contexts for task and final images.
- `runs/<run-label>/jobs/`: raw trial artifacts.
- `runs/<run-label>/analysis/results/trial-summary.csv`: trial-level results.
- `runs/<run-label>/analysis/results/lead-summary.md`: human-readable results summary.
- `runs/<run-label>/analysis/selected_trials.csv`: selected trial table for dispatch stats and scoring.
- `runs/<run-label>/analysis/dispatch-stats/summary.json`: dispatch statistics summary.
- `runs/<run-label>/analysis/scoring/summary.json`: scoring aggregation summary.
- `runs/<run-label>/analysis/scoring/per_judge_scores.csv`: per-judge score rows.
- `runs/<run-label>/analysis/scoring/per_trial_dimension_scores.csv`: per-trial, per-dimension scores.
- `runs/<run-label>/analysis/scoring/per_trial_overall_scores.csv`: per-trial overall scores.

## GitHub Publishing Checklist

Before publishing:

```bash
bash experiment/bin/aiready_workflow.sh package \
  --profile experiment/profiles/aiready-v15-smoke.env \
  --run-label package-check

unzip -t dist/aiready-experiment-workflow.zip
```

Confirm the package does not contain private or generated files:

```bash
find dist/aiready-experiment-workflow \
  -name '.env' -o \
  -path '*/.venv/*' -o \
  -path '*/runs/*' -o \
  -path '*/jobs/*' -o \
  -path '*/analysis/*' -o \
  -path '*/runtime-state/*' -o \
  -path '*/dist/*'
```

Run a prepare-only smoke from the packaged directory:

```bash
cd dist/aiready-experiment-workflow

BUILD_IMAGES=0 RUN_EXPERIMENTS=0 \
bash experiment/bin/aiready_workflow.sh prepare \
  --profile experiment/profiles/aiready-v15-smoke.env \
  --run-label package-smoke-prepare
```

Then remove generated smoke outputs before publishing:

```bash
rm -rf runs runtime-state .venv
```

The package builder normally excludes these outputs when it regenerates the package from the source checkout.
