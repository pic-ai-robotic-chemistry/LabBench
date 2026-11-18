# LabBench agent experiments

This directory contains the structured-benchmark tasks, laboratory skills, retained experimental records, scoring rules and analysis code. The main reproduction path below recomputes the reported results from those records: **48 harness–model configurations × 32 tasks × 3 retained repeats = 4,608 assigned trials**.

The analysis uses the archived scores and runtime metadata. It does not require model API keys, Docker or laboratory access. The [experiment workflow manual](experiment/README.md) describes preparing and running new experiments.

## Recompute the reported results

From the repository root, create a separate Python 3.11 environment and install the pinned analysis dependencies:

```bash
cd agent_experiments/reproduction
python3.11 -m venv .venv
.venv/bin/python -m pip install -r requirements-analysis.lock
shasum -a 256 -c frozen/SHA256SUMS
.venv/bin/python -m unittest discover -s tests -v
.venv/bin/python -m paper_reproduction.run \
  --frozen frozen/data --out reproduced-results
```

`requirements-analysis.lock` pins the analysis and plotting dependencies and PyYAML for preparation validation. The analysis environment is separate from the Harbor/container environment used to execute new experiments. The commands above install and execute the analysis; they do not install the agent runtime.

Choose a new output directory for each analysis run. The command exits with status 2 if any manuscript checkpoint fails and preserves the outputs for inspection.

The data flow is:

```text
retained-slot manifest + trial metadata + primary/validation scores + protocol
    → identity and cohort checks
    → per-trial scores and resource metrics
    → configuration summaries, bootstrap intervals and judge agreement
    → manuscript checkpoints, tables, report and provenance
```

| Output in `reproduced-results/` | Contents |
|---|---|
| `trial_metrics.csv` | All 4,608 assigned trials, retaining missing values and completion flags |
| `configuration_metrics.csv` | 48 configuration summaries, fixed-96 estimates, 95% intervals and sensitivity metrics |
| `judge_agreement.csv` | Overall and dimension-specific primary/validation judge comparisons |
| `manuscript_check.json` | 15 numerical checkpoints with expected values and tolerances |
| `provenance.json` | Hashes of the inputs and analysis code, cohort sizes and bootstrap identity |
| `REPORT.md`, `REPORT.html` | Readable tables and statistical definitions |

Expected cohort totals are **2,596 complete primary R1/R2/R3 triples**, **2,012 unscored assigned trials**, **15,576 individual score observations** across two judges and three dimensions, and **607 verified dispatches**. A verified dispatch is distinct from completion of a physical experiment. The [reference tables](reproduction/reference/) contain the expected configuration metrics and judge agreement. Numerical definitions and missing-value conventions appear below.

For example, `claude-code__claude47opus_or` has fixed-96 semantic score `55.973958333333336` and six-axis score approximately `60.355770`. Passing these checks establishes reproduction of the retained-record analysis; a fresh stochastic model run is not expected to match historical scores.

## Compare against Supplementary Data 3

With the manuscript's `SuppData3.xlsx` available locally, run this from `agent_experiments/reproduction/` after the analysis:

```bash
.venv/bin/python -m paper_reproduction.verify_suppdata \
  --suppdata /absolute/path/to/SuppData3.xlsx \
  --analysis reproduced-results \
  --out reproduced-suppdata-check.json
```

This compares all 15,576 raw scores, 4,608 trial identities, 2,596 complete trial metrics, 48 configuration summaries and all 48 bootstrap intervals (96 endpoints). It also compares the four rule-file hashes and line text against the workbook. Raw scores must agree exactly; trial metrics use absolute tolerance `1e-8`, configuration metrics and interval endpoints `1e-10`. The output records counts, missing-value mismatches, maximum errors and pass/fail results. A failed numerical or rule comparison returns status 2. The workbook is supplied with the paper and is not duplicated here.

Optional diagnostic plots can be generated from the same tables:

```bash
.venv/bin/python -m paper_reproduction.figures --analysis reproduced-results
```

These five PNG/SVG panels show the recomputed quantities; they are diagnostic plots rather than the original publication layouts.

## Scoring and statistical definitions

The primary judge is GPT/Codex (`codex_gpt55_xhigh`); DeepSeek/Hermes (`hermes_deepseek_v4pro`) is the validation judge. The primary estimate uses only the primary judge's scores. Validation scores enter the agreement analysis separately.

| Dimension | Rule files in `reproduction/frozen/rules/score_rule_en/` |
|---|---|
| R1: physical system executability | `JUDGE_PROMPT_R1_EN.md` and `CONSTRAINTS_R1_EN.md` |
| R2: problem coverage and workflow completeness | `JUDGE_PROMPT_R2_EN.md` |
| R3: visible scientific design reasonableness | `JUDGE_PROMPT_R3_EN.md` |

These are the four scoring files used across three dimensions. Constraints are part of R1. The common judge instructions and output schema are also included under `frozen/rules/agent_judge_prompts/`.

- A trial's semantic score is `0.50 R1 + 0.25 R2 + 0.25 R3`, requiring a complete primary-judge triple. Missing scores remain missing in the trial table.
- `conditional_semantic` averages complete trials. `semantic_fixed96` divides their score sum by all 96 assigned slots; an unscored slot contributes zero only in this fixed-denominator estimator.
- `D` is verified dispatches divided by 96, expressed as a percentage.
- `E` uses reverse midrank percentiles for token use and duration across the entire finite primary-scored cohort, averages available components per trial, and then averages within each configuration. Recorded zeros remain valid observations; missing resource values are not converted to zero.
- `T` is `max(0, 100 − mean within-task population SD)`, including tasks with at least two finite primary scores and using `ddof=0`.
- The six-axis composite is `0.60 semantic_fixed96 + 0.20 D + 0.10 E + 0.10 T`.
- The 95% confidence interval resamples the 32 tasks as clusters, retaining their three slots, with 2,000 bootstrap draws, seed `20260711`, NumPy PCG64 and linear quantiles. This implementation reproduces the supplied Supplementary Data 3 intervals; it is not presented as the recovered original analysis script.

The analysis also outputs equal-weight and task-adjusted sensitivity summaries. Historical numerical checks apply to the retained cohort supplied here.

## Prepare the complete paper configuration

The [full profile](experiment/profiles/aiready-v15-full.env) uses the exact observed [pairings table](reproduction/frozen/data/pairings.csv), the 32 task identifiers in [Benchmark_V15.docx](Benchmark_V15.docx), the bundled skill snapshot and three attempts. Pairings are explicit so unobserved harness/model combinations are not generated.

| Harness | Configurations | Assigned trials |
|---|---:|---:|
| Claude Code | 7 | 672 |
| Codex | 7 | 672 |
| Gemini CLI | 7 | 672 |
| Hermes | 9 | 864 |
| Kilo Code | 9 | 864 |
| OpenClaw | 9 | 864 |
| **Total** | **48** | **4,608** |

After the analysis environment has been installed, run from `agent_experiments/`:

```bash
source reproduction/.venv/bin/activate
bash experiment/bin/aiready_workflow.sh prepare \
  --profile experiment/profiles/aiready-v15-full.env \
  --run-label paper-full
```

Use a fresh run label. This prepares tasks, 48 Harbor YAML configurations, Docker build contexts and an isolation report without building images or calling model or laboratory services. Inspect `runs/paper-full/generated/manifest.json`: `expected_trials` is `4608`, `n_attempts` is `3`, and `config_paths` contains 48 entries. Each task includes the three skill entry points and 45 workstation references.

The pairings table preserves source model identifiers. In particular, Claude Code's `deepseek_v4_bailian` source key maps to the analysis identity `deepseek_v4pro_direct`; it must not be replaced by a second generated configuration.

Generated configs retain environment placeholders for runtime model names, endpoints and keys. For model key `gpt55_or`, these include `AIREADY_GPT55_OR_NAME`, `AIREADY_GPT55_OR_BASE_URL` and, on Codex, `AIREADY_CODEX_GPT55_OR_API_KEY`. Other keys use the uppercase source model key and harness name with underscores. Claude Code uses `AIREADY_<MODEL>_ANTHROPIC_BASE_URL`; Gemini CLI uses `AIREADY_<MODEL>_GEMINI_BASE_URL`. Set the corresponding provider model IDs and credentials in a private `.env` before running new experiments; preparation needs none of them.

The [smoke profile](experiment/profiles/aiready-v15-smoke.env) remains a one-task, one-model example with generic scoring. Generic `judge_a` aggregation is not the manuscript estimator; it is disabled in the paper profile. Use the retained-record analysis above to reproduce the reported values. The [workflow manual](experiment/README.md) covers the separate build/run/collect stages.

## Input records and additional tools

| Location | Purpose |
|---|---|
| `reproduction/frozen/data/selection_manifest.csv` | One active trial per retained task/repeat slot |
| `reproduction/frozen/data/trial_metadata.csv` | Runtime resources, dispatch flags and plan-presence flags |
| `reproduction/frozen/data/judge_scores.csv` | Primary and validation scores keyed by trial and dimension |
| `reproduction/frozen/data/protocol.json` | Task/configuration order, weights and bootstrap parameters |
| `reproduction/frozen/data/replacement_mapping.csv` | Retained and superseded trial identities |
| `reproduction/frozen/data/active_plans.csv`, `raw_score_index.csv` | Archive-relative paths and hashes of original plans and score JSON files |
| `reproduction/frozen/SHA256SUMS` | Checksums of all bundled frozen tables and scoring instructions |
| `reproduction/paper_reproduction/` | Cohort validation, import, scoring preparation, analysis, reporting and workbook comparison |
| `aiready/aiready_skill_7.6/` | Laboratory skill instructions, scripts, workstation constraints and parameter templates |

The skill snapshot includes 48 `SKILL.md` files and 46 `references_audit` constraint documents used by the workstation skill. Spreadsheet copies omit author and absolute-path metadata; their worksheet content is preserved. Snapshot version `7.6` identifies these bundled resources, not the runtime image used by every historical trial.

The frozen numerical tables and rules originate from `LabBench_paper_reproduction_patch_20261116_scope_v2.zip` (SHA-256 `bdec79b4eb8c44410ad72bce9be3f0dbe0f617b0721f763b2ec18dc626a942fd`). They retain the original trial identities, values and rule bytes. The analysis reads these tables directly; the larger raw plan/score archive is only needed for the following optional tools.

From `agent_experiments/reproduction/`, `python -m paper_reproduction.import_archive --archive-root ROOT --out NEW_DIR` imports an indexed archive containing `trial_id_crosswalk_final96.csv`, `scoring_detail_final96_rows.csv` and every relative path referenced by those tables. It verifies plan/score files and retained identities. It does not discover or download an archive automatically.

`python -m paper_reproduction.prepare_scores --help` describes preparation of judge inputs for explicitly selected active plans. It uses the four full rules, separate primary/validation judges and immutable judge-image digests. This tool prepares task files and configs; execution uses the corresponding configured runtime.
