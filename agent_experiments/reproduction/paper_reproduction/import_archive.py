"""Import explicit final96 tables and verify every referenced score JSON.

Public archives should be unpacked by their owner. No archive-wide plan glob,
no replacement selection by modification time, and no network access.
"""
import argparse
import json
from pathlib import Path
from .io import read_rows, write_csv, write_json, boolean, sha256, unique, validate_score


def safe_path(root, relative):
    path = (root / relative).resolve()
    if not path.is_relative_to(root.resolve()):
        raise ValueError('Path escapes archive root')
    return path


def run(root, out):
    root, out = Path(root), Path(out)
    if out.exists():
        raise FileExistsError(f'Refusing to replace existing import: {out}')
    cross = root/'trial_id_crosswalk_final96.csv'
    score_table = root/'scoring_detail_final96_rows.csv'
    trials, raw_scores = read_rows(cross), read_rows(score_table)
    unique(trials, 'slot_id')
    trials_by_key = unique(trials, 'global_trial_key')
    selection, metadata, replacements, plans = [], [], [], []
    for row in trials:
        identity = dict(slot_id=row['slot_id'],trial_id=row['global_trial_key'],config_key=row['config_key'],
            benchmark_task=row['benchmark_task'],repeat=int(row['slot_id'].rsplit('rep',1)[1]))
        selection.append(dict(identity,active=True))
        metadata.append(dict(identity,total_tokens=row['total_tokens_for_stats'],duration_seconds=row['duration_seconds'],
            verified_dispatch=boolean(row['verified_success']),task_id=row['verified_success_task_id'],
            plan_expected=boolean(row['final_json_exists'])))
        replacements.append(dict(slot_id=row['slot_id'],active_trial_id=row['global_trial_key'],
            superseded_trial_id=row.get('replaces_global_trial_key',''),replacement_status=row.get('replacement_status','')))
        relative = row['final_json_package_relpath']
        expected = boolean(row['final_json_exists'])
        if expected:
            path = safe_path(root,relative)
            if not path.is_file():
                raise FileNotFoundError(f'Active plan absent: {relative}')
            json.loads(path.read_text())
        plans.append(dict(trial_id=row['global_trial_key'],active_plan=expected,
            archive_relative_path=relative if expected else '',plan_sha256=sha256(path) if expected else '',
            archive_record_relpath=row['raw_record_relpath']))
    scores, raw_index, schema_errors = [], [], []
    for row in raw_scores:
        trial = row['final96_global_trial_key'] or row['all4857_global_trial_key']
        if trial not in trials_by_key:
            raise ValueError('Score refers to non-active trial')
        path = safe_path(root,row['score_json_package_relpath'])
        payload = json.loads(path.read_text())
        dimension = row['dimension'][:2]
        if payload.get('score') != float(row['score']):
            raise ValueError(f'Raw-score/table mismatch: {row["score_global_key"]}')
        try:
            validate_score(payload,dimension)
        except ValueError as exc:
            schema_errors.append(dict(trial_id=trial,judge=row['judge'],dimension=dimension,error=str(exc)))
        scores.append(dict(trial_id=trial,judge_key=row['judge'],dimension=dimension,score=payload['score']))
        raw_index.append(dict(trial_id=trial,judge_key=row['judge'],dimension=dimension,
            archive_relative_path=row['score_json_package_relpath'],sha256=sha256(path)))
    out.mkdir(parents=True)
    for name,rows in [('selection_manifest.csv',selection),('trial_metadata.csv',metadata),('judge_scores.csv',scores),
        ('replacement_mapping.csv',replacements),('active_plans.csv',plans),('raw_score_index.csv',raw_index)]:
        write_csv(out/name,rows)
    write_json(out/'import_validation.json',dict(trials=len(trials),scores=len(scores),
        active_plans=sum(r['active_plan'] for r in plans),raw_score_numeric_mismatch=0,
        extended_schema_errors=schema_errors,source_crosswalk_sha256=sha256(cross),source_score_table_sha256=sha256(score_table),
        evidence_limit='Source tables audited locally; public ZIP byte identity not checked in this import.'))
    tasks = sorted({r['benchmark_task'] for r in trials})
    configs = sorted({r['config_key'] for r in trials})
    write_json(out/'protocol.json',dict(schema='labbench-paper-offline-v1',tasks=tasks,repeats=3,config_order=configs,
        bootstrap=dict(seed=20260711,resamples=2000,generator='numpy.default_rng/PCG64',quantile='linear',
            historical_rng_identity='unconfirmed; supply supplementary CI to validate exact sequence'),
        score_weights=[.5,.25,.25],six_axis_weights=[.30,.15,.15,.20,.10,.10]))
    write_csv(out/'pairings.csv',[dict(config_key=c,harness=c.split('__')[0],source_model_key=c.split('__')[1],
        analysis_model_key=c.split('__')[1].replace('deepseek_v4_bailian','deepseek_v4pro_direct')) for c in configs])
    print(json.dumps(dict(trials=len(trials),scores=len(scores),schema_errors=len(schema_errors)),ensure_ascii=False))


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--archive-root',required=True,type=Path)
    parser.add_argument('--out',required=True,type=Path)
    args=parser.parse_args()
    run(args.archive_root,args.out)


if __name__=='__main__':
    main()
