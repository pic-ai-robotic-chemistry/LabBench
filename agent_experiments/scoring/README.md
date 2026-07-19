# AIREADY Scoring

This directory contains the LLM-judge scoring assets for AIREADY experiment-plan trials.

## Scope

The scoring workflow evaluates existing trial artifacts. It does not create, edit, or dispatch experiments.

Each judge receives:

- benchmark task text extracted from `Benchmark_V15.docx`;
- the scoring rubric in `scoring/aiready_scoring_rubric_en.md`;
- the locally supplied skill reference from `aiready/aiready_skill_7.6`;
- the trial artifact `artifacts/final_plan.json`.

Each judge writes one JSON result:

```json
{
  "score": 86,
  "reason": "Concise reason focused only on the requested dimension.",
  "evidence": [
    "Specific evidence from the task text or final_plan.json."
  ]
}
```

## Included Files

- `README.md`: this guide.
- `aiready_scoring_rubric_en.md`: rubric used by `tools/prepare_aiready_scoring.py`.
- `images/Dockerfile`: shared judge image Dockerfile.
- `score_rule_en/`: reusable English judge prompt and scoring-rule components.

## Supported Judge Configurations

- `judge_a`: neutral Codex-compatible judge configuration. Set
  `AIREADY_SCORING_JUDGE_A_MODEL_NAME`,
  `AIREADY_SCORING_JUDGE_A_BASE_URL`, and
  `AIREADY_SCORING_JUDGE_A_API_KEY` in `.env`.

## Supported Dimensions

- `physical_implementability`
- `workflow_completeness`
- `design_rationality`

## Recommended Workflow

Use the top-level workflow script:

```bash
bash experiment/bin/aiready_workflow.sh score \
  --profile experiment/profiles/aiready-v15-smoke.env \
  --run-label smoke-a01
```

This runs:

```text
score-prepare -> score-build -> score-run -> score-aggregate
```

## Stage Commands

Prepare scoring tasks:

```bash
bash experiment/bin/aiready_workflow.sh score-prepare \
  --profile experiment/profiles/aiready-v15-full.env \
  --run-label v15-full
```

Build judge images:

```bash
bash experiment/bin/aiready_workflow.sh score-build \
  --profile experiment/profiles/aiready-v15-full.env \
  --run-label v15-full
```

Run judge containers:

```bash
bash experiment/bin/aiready_workflow.sh score-run \
  --profile experiment/profiles/aiready-v15-full.env \
  --run-label v15-full
```

Aggregate scores:

```bash
bash experiment/bin/aiready_workflow.sh score-aggregate \
  --profile experiment/profiles/aiready-v15-full.env \
  --run-label v15-full
```

## Outputs

```text
runs/<run-label>/scoring/generated/manifest.json
runs/<run-label>/scoring/jobs/
runs/<run-label>/analysis/scoring/summary.json
runs/<run-label>/analysis/scoring/per_judge_scores.csv
runs/<run-label>/analysis/scoring/per_trial_dimension_scores.csv
runs/<run-label>/analysis/scoring/per_trial_overall_scores.csv
runs/<run-label>/analysis/scoring/disagreement_cases.csv
```

## Configuration

Common profile settings:

```bash
SCORING_JUDGES="judge_a"
SCORING_HARNESSES="codex"
SCORING_DIMENSIONS="physical_implementability workflow_completeness design_rationality"
SCORING_SKILLS_DIR="aiready/aiready_skill_7.6"
SCORING_N_CONCURRENT_TRIALS=5
SCORING_AGENT_TIMEOUT_SEC=900
```

Use `SCORING_DRY_RUN_LIMIT` to inspect a small number of generated judge tasks:

```bash
SCORING_DRY_RUN_LIMIT=3 \
bash experiment/bin/aiready_workflow.sh score-prepare \
  --profile experiment/profiles/aiready-v15-full.env \
  --run-label v15-full
```
