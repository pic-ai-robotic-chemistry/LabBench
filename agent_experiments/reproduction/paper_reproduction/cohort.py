"""Select the exact frozen slot and trial identities; never glob artifacts."""
from collections import Counter
from .io import boolean, number, unique


DIMENSIONS = ('R1', 'R2', 'R3')
PRIMARY = 'codex_gpt55_xhigh'
VALIDATION = 'hermes_deepseek_v4pro'


def validate_selection(rows, protocol):
    active = [r for r in rows if boolean(r['active'])]
    unique(active, 'slot_id')
    unique(active, 'trial_id')
    configs = protocol['config_order']
    tasks = protocol['tasks']
    repeats = protocol['repeats']
    counts = Counter((r['config_key'], r['benchmark_task']) for r in active)
    expected = {(c, t): repeats for c in configs for t in tasks}
    if dict(counts) != expected:
        raise ValueError('Selection does not match frozen configuration/task/repeat matrix')
    for c, t in expected:
        ranks = sorted(int(r['repeat']) for r in active if r['config_key'] == c and r['benchmark_task'] == t)
        if ranks != list(range(1, repeats + 1)):
            raise ValueError(f'Invalid repeat identities: {c}/{t}')
    return active


def join_records(selection, metadata, scores, protocol):
    active = validate_selection(selection, protocol)
    meta = unique(metadata, 'slot_id')
    if set(meta) != {r['slot_id'] for r in active}:
        raise ValueError('Metadata slot set differs from active selection')
    trial_ids = {r['trial_id'] for r in active}
    by_score = {}
    for r in scores:
        key = (r['trial_id'], r['judge_key'], r['dimension'])
        if key in by_score or r['trial_id'] not in trial_ids:
            raise ValueError(f'Duplicate or inactive score identity: {key}')
        if r['judge_key'] not in (PRIMARY, VALIDATION) or r['dimension'] not in DIMENSIONS:
            raise ValueError(f'Unknown judge/dimension: {key}')
        value = number(r['score'])
        if value is None or not 0 <= value <= 100 or value != int(value):
            raise ValueError(f'Invalid score: {key}')
        by_score[key] = value
    output = []
    for r in active:
        m = meta[r['slot_id']]
        for k in ('trial_id', 'config_key', 'benchmark_task', 'repeat'):
            if str(r[k]) != str(m[k]):
                raise ValueError(f'Metadata overwrites frozen identity: {r["slot_id"]}/{k}')
        item = dict(r)
        for k in ('total_tokens', 'duration_seconds'):
            item[k] = number(m[k])
            if item[k] is not None and item[k] < 0:
                raise ValueError(f'Negative resource measure: {k}')
        item['verified_dispatch'] = boolean(m['verified_dispatch'])
        item['task_id'] = m.get('task_id', '')
        item['plan_expected'] = boolean(m['plan_expected'])
        for judge, prefix in ((PRIMARY, 'primary'), (VALIDATION, 'validation')):
            for d in DIMENSIONS:
                item[f'{prefix}_{d}'] = by_score.get((r['trial_id'], judge, d))
        values = [item[f'primary_{d}'] for d in DIMENSIONS]
        complete = all(v is not None for v in values)
        if any(v is not None for v in values) and not item['plan_expected']:
            raise ValueError('Score exists for an inactive/missing plan')
        item['complete_semantic'] = complete
        item['primary_semantic'] = sum(v*w for v,w in zip(values,(.5,.25,.25))) if complete else None
        item['equal_weight_semantic'] = sum(values)/3 if complete else None
        output.append(item)
    return output
