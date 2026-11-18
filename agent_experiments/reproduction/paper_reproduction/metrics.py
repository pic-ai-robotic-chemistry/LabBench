"""Manuscript estimands. Cohort-wide transformations precede aggregation."""
from collections import defaultdict
import numpy as np


def average(values):
    values = [v for v in values if v is not None]
    return float(np.mean(values)) if values else None


def ranks(values):
    a = np.asarray(values, dtype=float)
    ordered = np.sort(a)
    return (np.searchsorted(ordered, a, 'left') + np.searchsorted(ordered, a, 'right') + 1)/2


def enrich_cohort(rows):
    """Use all finite primary triples, not per-config populations.

    Empirical mid-distribution percentile = 100*(#less + #equal/2)/n.
    Recorded zero resource use is retained. Missing use is not zero.
    """
    rows = [dict(r) for r in rows]
    finite = [r for r in rows if r['complete_semantic']]
    task_values = defaultdict(list)
    for r in finite:
        task_values[r['benchmark_task']].append(r['primary_semantic'])
    global_mean = average([r['primary_semantic'] for r in finite])
    for source, output in [('total_tokens','token_efficiency'), ('duration_seconds','time_efficiency')]:
        valid = [r for r in finite if r[source] is not None]
        for r in rows:
            r[output] = None
        if valid:
            percentiles = 100*(ranks([r[source] for r in valid])-.5)/len(valid)
            for r,p in zip(valid, percentiles):
                r[output] = float(100-p)
    for r in rows:
        r['efficiency'] = average([r['token_efficiency'], r['time_efficiency']])
        r['task_adjusted_semantic'] = (
            r['primary_semantic'] - average(task_values[r['benchmark_task']]) + global_mean
            if r['complete_semantic'] else None
        )
    return rows


def bootstrap(task_means, seed, count=2000):
    """PCG64 + linear quantiles. Historical RNG identity needs author confirmation."""
    a = np.asarray(task_means, dtype=float)
    rng = np.random.default_rng(seed)
    samples = rng.choice(a, size=(count, len(a)), replace=True).mean(axis=1)
    return [float(v) for v in np.quantile(samples, [.025,.975], method='linear')]


def aggregate(rows, protocol):
    outputs = []
    tasks = protocol['tasks']
    denominator = len(tasks)*protocol['repeats']
    for index, config in enumerate(protocol['config_order']):
        group = [r for r in rows if r['config_key'] == config]
        if len(group) != denominator:
            raise ValueError('Fixed denominator violated')
        finite = [r for r in group if r['complete_semantic']]
        item = dict(config_key=config, assigned_n=denominator, complete_n=len(finite), coverage=len(finite)/denominator)
        for d in ('R1','R2','R3'):
            vals = [r['primary_'+d] for r in finite]
            item['conditional_'+d] = average(vals)
            item['fixed96_'+d] = sum(vals)/denominator
        item['conditional_semantic'] = average([r['primary_semantic'] for r in finite])
        item['semantic_fixed96'] = sum(r['primary_semantic'] for r in finite)/denominator
        item['equal_weight_fixed96'] = sum(r['equal_weight_semantic'] for r in finite)/denominator
        item['dispatch_n'] = sum(r['verified_dispatch'] for r in group)
        item['D_dispatch_percent'] = 100*item['dispatch_n']/denominator
        deviations, task_means = [], []
        for task in tasks:
            vals = [r['primary_semantic'] for r in finite if r['benchmark_task'] == task]
            if len(vals) >= 2:
                deviations.append(float(np.std(vals, ddof=0)))
            task_means.append(sum(vals)/protocol['repeats'])
        item['stability_task_n'] = len(deviations)
        item['T_stability'] = max(0,100-average(deviations)) if deviations else None
        item['E_efficiency'] = average([r['efficiency'] for r in finite])
        item['efficiency_trial_n'] = sum(r['efficiency'] is not None for r in finite)
        item['scored_task_n'] = len({r['benchmark_task'] for r in finite})
        item['task_adjusted_conditional'] = average([r['task_adjusted_semantic'] for r in finite])
        item['six_axis_0_100'] = (
            .6*item['semantic_fixed96']+.2*item['D_dispatch_percent']+.1*item['T_stability']+.1*item['E_efficiency']
            if item['T_stability'] is not None and item['E_efficiency'] is not None else None
        )
        item['bootstrap_seed'] = protocol['bootstrap']['seed']+index
        item['ci95_low'], item['ci95_high'] = bootstrap(task_means,item['bootstrap_seed'],protocol['bootstrap']['resamples'])
        outputs.append(item)
    for source, output in [('semantic_fixed96','primary_rank'),('equal_weight_fixed96','equal_rank')]:
        for r, rank in zip(outputs, ranks([-r[source] for r in outputs])):
            r[output] = float(rank)
    for r in outputs:
        r['equal_minus_primary_rank'] = r['equal_rank']-r['primary_rank']
    return outputs


def correlation(x,y):
    if len(x)<2 or np.std(x)==0 or np.std(y)==0:
        return None
    return float(np.corrcoef(x,y)[0,1])


def agreement(rows):
    result = []
    for dimension in ('overall','R1','R2','R3'):
        dims = ('R1','R2','R3') if dimension=='overall' else (dimension,)
        pairs = [(r['primary_'+d],r['validation_'+d]) for r in rows for d in dims
                 if r['primary_'+d] is not None and r['validation_'+d] is not None]
        x,y = [p[0] for p in pairs],[p[1] for p in pairs]
        result.append(dict(dimension=dimension,paired_dimension_n=len(pairs),pearson=correlation(x,y),
            spearman=correlation(ranks(x),ranks(y)) if pairs else None,
            mae=average([abs(a-b) for a,b in pairs]),validation_minus_primary=average([b-a for a,b in pairs])))
    return result
