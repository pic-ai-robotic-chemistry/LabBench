# AIREADY Agent-Judge Output Schema

Every judge run scores exactly one trial and exactly one dimension. The judge must write one strict JSON object to both:

```text
/workspace/output/score.json
/logs/artifacts/score.json
```

## Required Top-Level Schema

```json
{
  "dimension": "R1_physical_system_executability",
  "score": 0,
  "reason": "Concise score rationale focused only on this dimension.",
  "evidence": [
    {
      "source": "final_json",
      "quote_or_pointer": "step 3 / field parameters...",
      "interpretation": "Why this evidence matters for the dimension."
    }
  ],
  "issues": [
    {
      "severity": "critical",
      "rule_ref": "T6.1 / W3.1",
      "summary": "Short issue summary.",
      "evidence": "Specific visible field/path."
    }
  ],
  "confidence": "high",
  "rule_audit": {}
}
```

## Field Requirements

| Field | Type | Requirement |
|---|---|---|
| `dimension` | string | One of the allowed dimension IDs below |
| `score` | integer | 0-100 inclusive |
| `reason` | string | Concise rationale for the selected dimension only |
| `evidence` | array | 1 or more evidence objects when possible |
| `evidence[].source` | string | Recommended: `final_json`, `problem_statement`, `constraints`, `rule`, or `skill` |
| `evidence[].quote_or_pointer` | string | Specific field path, step number, rule section, or file path; do not paste long file content |
| `evidence[].interpretation` | string | Why this evidence supports the score |
| `issues` | array | May be empty if no material issues |
| `issues[].severity` | string | R1/R2: `critical`, `major`, `minor`; R3 may use `fatal`, `major`, `minor` |
| `issues[].rule_ref` | string | Rule ID, section, or dimension reference |
| `issues[].summary` | string | Short issue summary |
| `issues[].evidence` | string | Specific visible evidence |
| `confidence` | string | `high`, `medium`, or `low` |
| `rule_audit` | object | Required dimension-specific detailed audit |

## Allowed Dimension IDs

```text
R1_physical_system_executability
R2_problem_coverage_workflow_completeness
R3_visible_scientific_design_reasonableness
```

## Required `rule_audit`

The judge must include dimension-specific detailed audit output under `rule_audit`.

Examples:

```json
{
  "rule_audit": {
    "preflight_audit": {},
    "dimension_scores": {},
    "ceilings_applied": []
  }
}
```

```json
{
  "rule_audit": {
    "requirement_ledger": [],
    "coverage_matrix": [],
    "dimension_scores": {},
    "shortcircuit_applied": false
  }
}
```

```json
{
  "rule_audit": {
    "scientific_claim": "",
    "visible_design_findings": [],
    "unobservable_measurement_details": [],
    "dimension_scores": {},
    "fatal_ceiling_applied": false
  }
}
```

## Forbidden Output

- Markdown outside JSON.
- JSON comments.
- Multiple JSON objects.
- Scores outside 0-100.
- Scoring more than one dimension in one output file.
- Calling 303 endpoints, dispatching experiments, or changing the submitted final JSON.
