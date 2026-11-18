"""Strict local I/O and explicit evidence validation; no network calls."""
import csv
import hashlib
import json
import math
from pathlib import Path


def sha256(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def read_rows(path):
    path = Path(path)
    if path.suffix == '.jsonl':
        return [json.loads(line) for line in path.read_text().splitlines() if line.strip()]
    with path.open(encoding='utf-8-sig', newline='') as f:
        return list(csv.DictReader(f))


def write_json(path, value):
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    Path(path).write_text(json.dumps(value, ensure_ascii=False, indent=2, allow_nan=False) + '\n', encoding='utf-8')


def write_csv(path, rows):
    if not rows:
        raise ValueError(f'No rows to write: {path}')
    fields = list(dict.fromkeys(k for r in rows for k in r))
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    with Path(path).open('w', newline='', encoding='utf-8') as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)


def number(value):
    if value is None or value == '':
        return None
    if isinstance(value, bool):
        raise ValueError('Boolean is not a numeric measurement')
    result = float(value)
    if not math.isfinite(result):
        raise ValueError(f'Nonfinite numeric value: {value}')
    return result


def boolean(value):
    if value in (True, 1, '1', 'true', 'True'):
        return True
    if value in (False, 0, '0', 'false', 'False'):
        return False
    raise ValueError(f'Missing or invalid boolean: {value!r}')


def unique(rows, key):
    indexed = {}
    for row in rows:
        value = row.get(key)
        if not value or value in indexed:
            raise ValueError(f'Missing/duplicate {key}: {value}')
        indexed[value] = row
    return indexed


def validate_score(payload, expected_dimension=None):
    if not isinstance(payload, dict):
        raise ValueError('Score must be an object')
    score = payload.get('score')
    if type(score) is not int or not 0 <= score <= 100:
        raise ValueError('Score must be an integer in [0,100]')
    for field in ('dimension', 'reason'):
        if not isinstance(payload.get(field), str) or not payload[field].strip():
            raise ValueError(f'Missing {field}')
    allowed = {'R1_physical_system_executability','R2_problem_coverage_workflow_completeness',
               'R3_visible_scientific_design_reasonableness'}
    dimension = payload['dimension'][:2]
    if payload['dimension'] not in allowed or (expected_dimension and dimension != expected_dimension):
        raise ValueError('Dimension mismatch')
    evidence = payload.get('evidence')
    if not isinstance(evidence, list) or not evidence or not all(
        (isinstance(x, str) and x.strip()) or (isinstance(x, dict) and x) for x in evidence
    ):
        raise ValueError('Evidence must contain nonempty strings or objects')
    if not isinstance(payload.get('issues'), list) or not isinstance(payload.get('rule_audit'), dict):
        raise ValueError('Missing issues/rule_audit')
    if payload.get('confidence') not in ('high','medium','low'):
        raise ValueError('Invalid confidence')
    return payload


def compact_plan(path, max_chars=120000):
    raw = Path(path).read_text(encoding='utf-8')
    payload = json.loads(raw)
    if not isinstance(payload, (dict, list)):
        raise ValueError('Plan must be a JSON object or array, not null/scalar')
    rendered = json.dumps(payload, ensure_ascii=False, indent=2)
    if max(len(raw), len(rendered)) > max_chars:
        raise ValueError(f'Plan exceeds {max_chars} characters; explicit input-budget decision required')
    return rendered
