"""Recompute historical metrics without model or laboratory calls."""
import argparse
import json
from pathlib import Path
from .io import read_rows, write_csv, write_json, sha256
from .cohort import join_records
from .metrics import enrich_cohort, aggregate, agreement


def run(frozen, out):
    frozen, out = Path(frozen), Path(out)
    if out.exists():
        raise FileExistsError('Use a new output directory; existing results are never overwritten')
    names=['selection_manifest.csv','trial_metadata.csv','judge_scores.csv','protocol.json']
    protocol=json.loads((frozen/'protocol.json').read_text())
    rows=enrich_cohort(join_records(*[read_rows(frozen/n) for n in names[:3]],protocol))
    configs=aggregate(rows,protocol)
    agree=agreement(rows)
    out.mkdir(parents=True)
    write_csv(out/'trial_metrics.csv',rows)
    write_csv(out/'configuration_metrics.csv',configs)
    write_csv(out/'judge_agreement.csv',agree)
    checks=manuscript_check(rows,configs,agree)
    write_json(out/'manuscript_check.json',checks)
    write_json(out/'provenance.json',dict(inputs={n:sha256(frozen/n) for n in names},
        code={p.name:sha256(p) for p in Path(__file__).parent.glob('*.py')},
        cohort_trials=len(rows),configs=len(configs),model_calls=0,laboratory_calls=0,
        bootstrap_sequence_identity=protocol['bootstrap']['historical_rng_identity']))
    from .report import render
    render(out,configs,agree,checks)
    return checks


def manuscript_check(rows, configs, agree):
    expected={
        'claude-code__claude47opus_or':(55.973958333333336,60.355770),
        'hermes__qwen37max_bailian':(47.018229166666664,47.668830),
        'hermes__gpt55_or':(35.8203125,43.437937),
        'codex__gpt55_or':(34.231770833333336,42.583948)}
    checks=[]
    for label,observed,wanted in [('trials',len(rows),4608),('configs',len(configs),48),
        ('complete_triples',sum(r['complete_semantic'] for r in rows),2596),
        ('verified_dispatch',sum(r['verified_dispatch'] for r in rows),607)]:
        checks.append(dict(check=label,observed=observed,expected=wanted,passed=observed==wanted))
    for c,(s,h) in expected.items():
        row=next(x for x in configs if x['config_key']==c)
        for metric,wanted,tol in [('semantic_fixed96',s,1e-10),('six_axis_0_100',h,1e-6)]:
            value=row[metric];checks.append(dict(check=c+'/'+metric,observed=value,expected=wanted,
                tolerance=tol,passed=value is not None and abs(value-wanted)<tol))
    for metric,wanted in [('pearson',.916116),('mae',7.460452),('validation_minus_primary',1.594761)]:
        value=agree[0][metric];checks.append(dict(check='judge/'+metric,observed=value,expected=wanted,
            tolerance=1e-6,passed=abs(value-wanted)<1e-6))
    return dict(checks=checks,all_checks_passed=all(c['passed'] for c in checks),
        expected_source='Manuscript structured-benchmark results; rounded values use explicit tolerance',
        supplementary_check='Use verify_suppdata for all configuration values and exact submitted CI endpoints',
        analysis_scope='Structured benchmark scoring and configuration-level statistics')


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--frozen',type=Path,default=Path('frozen/data'))
    parser.add_argument('--out',type=Path,required=True)
    args=parser.parse_args()
    result=run(args.frozen,args.out)
    print(json.dumps(result,ensure_ascii=False,indent=2))
    if not result['all_checks_passed']:
        raise SystemExit(2)


if __name__=='__main__':
    main()
