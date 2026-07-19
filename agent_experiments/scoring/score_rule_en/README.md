# AIREADY Scoring Rules · English Translation

This directory is an English review copy of the Chinese scoring-rule directory:

- Source: `scoring/score_rule/`
- Translation output: `scoring/score_rule_en/`

Files:

- `JUDGE_PROMPT_R1_EN.md` — R1 physical/system executability judge prompt.
- `CONSTRAINTS_R1_EN.md` — R1 hard constraints distilled from device skills and workflow/lab-operation constraints.
- `JUDGE_PROMPT_R2_EN.md` — R2 problem coverage and workflow completeness judge prompt.
- `JUDGE_PROMPT_R3_EN.md` — R3 visible scientific design reasonableness judge prompt.

Translation policy:

- Chinese workstation names, operation names, parameter names, enum literals, schema field names, and rule IDs are preserved exactly where they are machine-facing or exact-match constraints.
- English names in the workstation whitelist are retained as references only; they must not be used to replace the Chinese `workstation` values in final JSON.
- Rule IDs such as `T1.1`, `V0.5`, `W3.5`, `D1-D5`, `U1-U5`, and `S1-S3` are preserved exactly.
- The Chinese source files were not overwritten.
