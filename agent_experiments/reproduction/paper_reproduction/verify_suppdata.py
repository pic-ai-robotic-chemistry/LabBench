"""Compare structured-benchmark data with Supplementary Data 3."""
import argparse
import json
from decimal import Decimal
from pathlib import Path
from .io import read_rows, sha256, number, boolean, write_json
from .xlsx_read import sheets

SELECTED = ['F3_Design_Matrix', 'F3_Config_Counts', 'F3_Trial_Index',
            'F3_Config_Metrics', 'F3_Denom96', 'F3_Trial_Metrics',
            'F3_Judge_Pairs', 'F3_Stage_Counts', 'ED_Fig3', 'ED_Fig4',
            'ED_Fig6', 'ED_Fig7', 'ED_Fig8', 'ED_Fig9',
            'Judge_Prompt_R1', 'Judge_Prompt_R2', 'Judge_Prompt_R3', 'R1_Constraints']


def config_key(row):
    return row['harness']+'__'+row['model_key'].replace('deepseek_v4_bailian','deepseek_v4pro_direct')


def index(rows, key):
    result = {}
    for row in rows:
        identity = key(row)
        if identity in result:
            raise ValueError(f'Duplicate supplementary identity: {identity}')
        result[identity] = row
    return result


def verify(suppdata, analysis, frozen, rules):
    data = sheets(suppdata, SELECTED)
    trials = index(read_rows(analysis/'trial_metrics.csv'), lambda r:r['trial_id'])
    configs = index(read_rows(analysis/'configuration_metrics.csv'),
                    lambda r:r['config_key'].replace('deepseek_v4_bailian','deepseek_v4pro_direct'))
    finite = {k:r for k,r in trials.items() if boolean(r['complete_semantic'])}
    checks = []

    def compare(label, left, right, mapping, tolerance=1e-10):
        same_keys = set(left)==set(right)
        missing, differences, max_error = 0, 0, 0.
        for key in set(left)&set(right):
            for a,b in mapping:
                x,y=number(left[key][a]),number(right[key][b])
                if (x is None)!=(y is None):
                    missing+=1
                elif x is not None:
                    max_error=max(max_error,abs(x-y));differences+=abs(x-y)>tolerance
        checks.append(dict(check=label,rows=len(left),reference_rows=len(right),fields=len(mapping),
            key_sets_equal=same_keys,missing_pattern_mismatches=missing,value_mismatches=differences,
            max_absolute_error=max_error,tolerance=tolerance,passed=same_keys and not missing and not differences))

    idx=index(data['F3_Trial_Index'],lambda r:r['global_trial_key'])
    flags={k:{f:int(boolean(r[f])) for f in ['verified_dispatch','plan_expected']} for k,r in trials.items()}
    compare('retained trial index',flags,idx,[('verified_dispatch','verified_success'),('plan_expected','final_json_present')])
    identity_mismatches=[]
    for key in set(trials)&set(idx):
        a,b=trials[key],idx[key]
        aid,bid=a['task_id'],b['verified_success_task_id']
        same_id=(aid==bid) or (bool(aid) and bool(bid) and Decimal(aid)==Decimal(bid))
        same_config=a['config_key'].replace('deepseek_v4_bailian','deepseek_v4pro_direct')==config_key(b)
        if not same_id or not same_config or a['benchmark_task']!=b['benchmark_task']:
            identity_mismatches.append(key)
    checks.append(dict(check='retained trial task/configuration/laboratory ID identity',rows=len(trials),
        mismatches=len(identity_mismatches),passed=set(trials)==set(idx) and not identity_mismatches))
    compare('trial metrics',finite,index(data['F3_Trial_Metrics'],lambda r:r['global_trial_key']),[
        ('primary_R1','R1'),('primary_R2','R2'),('primary_R3','R3'),('primary_semantic','semantic_score'),
        ('task_adjusted_semantic','task_adjusted_semantic_score'),('efficiency','efficiency_score'),
        ('total_tokens','total_tokens'),('duration_seconds','duration_seconds')],1e-8)
    scores=index(read_rows(frozen/'judge_scores.csv'),lambda r:(r['trial_id'],r['judge_key'],r['dimension']))
    expected={}
    pairs=index(data['F3_Judge_Pairs'],lambda r:(r['trial_key'],r['dimension']))
    for row in pairs.values():
        for source,judge in [('gpt','codex_gpt55_xhigh'),('ds','hermes_deepseek_v4pro')]:
            expected[(row['trial_key'],judge,row['dimension'])]={'score':row[source]}
    compare('all raw score values',scores,expected,[('score','score')],0)
    compare('fixed96 configuration metrics',configs,index(data['F3_Denom96'],config_key),[
        ('fixed96_R1','R1'),('fixed96_R2','R2'),('fixed96_R3','R3'),('semantic_fixed96','semantic_mean'),
        ('D_dispatch_percent','dispatch_rate'),('T_stability','stability_score'),('E_efficiency','efficiency_score'),
        ('ci95_low','semantic_ci_low'),('ci95_high','semantic_ci_high')])
    compare('conditional configuration metrics',configs,index(data['F3_Config_Metrics'],config_key),[
        ('complete_n','n_trials'),('conditional_semantic','semantic_mean'),
        ('task_adjusted_conditional','task_adjusted_semantic_mean'),('coverage','coverage'),('scored_task_n','n_tasks')])
    stages=index([r for r in data['F3_Stage_Counts'] if r['matrix_status']=='observed'],config_key)
    for row in stages.values():
        for k in ['json_stage_heat_composite','dispatch_stage_heat_composite']:row[k]=float(row[k])*100
    compare('stage composites',configs,stages,[('semantic_fixed96','json_stage_heat_composite'),
        ('six_axis_0_100','dispatch_stage_heat_composite'),('dispatch_n','verified_dispatch_count')])
    compare('task-cluster bootstrap intervals',configs,index(data['ED_Fig3'],config_key),[
        ('ci95_low','task_cluster_bootstrap_ci_low'),('ci95_high','task_cluster_bootstrap_ci_high')])
    eq=index(data['ED_Fig8'],config_key)
    for row in eq.values():
        row['primary_score']=float(row['primary_score'])*100
        row['equal_weight_score']=float(row['equal_weight_score'])*100
    compare('equal weight sensitivity',configs,eq,[('semantic_fixed96','primary_score'),
        ('equal_weight_fixed96','equal_weight_score'),('primary_rank','primary_rank'),
        ('equal_rank','equal_weight_rank'),('equal_minus_primary_rank','rank_shift')])
    agree=index([r for r in read_rows(analysis/'judge_agreement.csv') if r['dimension']!='overall'],lambda r:r['dimension'])
    compare('judge agreement by dimension',agree,index(data['ED_Fig4'],lambda r:r['dimension']),[
        ('paired_dimension_n','paired_n'),('pearson','pearson_r'),('spearman','spearman_rho'),
        ('mae','mean_absolute_error'),('validation_minus_primary','deepseek_minus_gpt_bias')])
    prompt_checks=[]
    for sheet,file in [('Judge_Prompt_'+d,'JUDGE_PROMPT_'+d+'_EN.md') for d in ('R1','R2','R3')]+[('R1_Constraints','CONSTRAINTS_R1_EN.md')]:
        rows=data[sheet];source=rules/'score_rule_en'/file
        normalized=[line.strip() for line in source.read_text().splitlines()]
        reference=[row['line_text'].strip() for row in rows]
        prompt_checks.append(dict(file=file,declared_hashes=sorted({r['sha256'] for r in rows}),
            local_sha256=sha256(source),declared_hash_match={r['sha256'] for r in rows}=={sha256(source)},
            normalized_line_text_match=normalized==reference,source_lines=len(normalized),reference_lines=len(reference)))
    return dict(schema='suppdata3-scoped-audit-v1',suppdata_sha256=sha256(suppdata),
        scope='Structured benchmark scoring and statistical tables',
        formulas_recalculated=False,source_cells='literal cells; formula cells are rejected',
        checks=checks,all_numeric_checks_passed=all(x['passed'] for x in checks),
        prompt_checks=prompt_checks,all_prompt_checks_passed=all(
            x['declared_hash_match'] and x['normalized_line_text_match'] for x in prompt_checks))


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--suppdata',required=True,type=Path);p.add_argument('--analysis',required=True,type=Path)
    p.add_argument('--frozen',default='frozen/data',type=Path);p.add_argument('--rules',default='frozen/rules',type=Path)
    p.add_argument('--out',required=True,type=Path);a=p.parse_args()
    if a.out.exists():raise FileExistsError(a.out)
    result=verify(a.suppdata,a.analysis,a.frozen,a.rules);write_json(a.out,result)
    print(json.dumps(result,ensure_ascii=False,indent=2))
    if not result['all_numeric_checks_passed'] or not result['all_prompt_checks_passed']:raise SystemExit(2)


if __name__=='__main__':main()
