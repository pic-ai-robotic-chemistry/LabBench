import copy
import json
import tempfile
import unittest
from pathlib import Path
from paper_reproduction.io import compact_plan, validate_score
from paper_reproduction.cohort import join_records, PRIMARY, VALIDATION
from paper_reproduction.metrics import enrich_cohort, aggregate, bootstrap


def fixture():
    protocol={'config_order':['a','b'],'tasks':['T1','T2'],'repeats':3,'bootstrap':{'seed':20260711,'resamples':2000}}
    selection=[];meta=[];scores=[]
    for c in protocol['config_order']:
        for t in protocol['tasks']:
            for repeat in range(1,4):
                key=f'{c}_{t}_{repeat}'
                s=dict(slot_id=key,trial_id=key,config_key=c,benchmark_task=t,repeat=repeat,active=True)
                selection.append(s)
                meta.append(dict(s,total_tokens=1 if c=='a' else 9,duration_seconds=1 if c=='a' else 9,verified_dispatch=True,plan_expected=True))
                for judge in (PRIMARY,VALIDATION):
                    for d,score in zip(('R1','R2','R3'),(67,49,80)):
                        scores.append(dict(trial_id=key,judge_key=judge,dimension=d,score=score if judge==PRIMARY else 0))
    return selection,meta,scores,protocol


class ReproductionTests(unittest.TestCase):
    def rows(self):
        s,m,j,p=fixture();return enrich_cohort(join_records(s,m,j,p)),p

    def test_primary_does_not_mix_validation(self):
        rows,p=self.rows();self.assertEqual(rows[0]['primary_semantic'],65.75)

    def test_global_efficiency_not_per_config(self):
        rows,p=self.rows();a=aggregate(rows,p)
        self.assertEqual(a[0]['E_efficiency'],75)
        self.assertEqual(a[1]['E_efficiency'],25)

    def test_missing_dimension_remains_missing(self):
        s,m,j,p=fixture();j=[r for r in j if not(r['trial_id']=='a_T1_1' and r['judge_key']==PRIMARY and r['dimension']=='R3')]
        rows=enrich_cohort(join_records(s,m,j,p));self.assertIsNone(rows[0]['primary_semantic'])
        self.assertAlmostEqual(aggregate(rows,p)[0]['semantic_fixed96'],65.75*5/6)

    def test_zero_resource_is_not_missing(self):
        s,m,j,p=fixture();m[0]['total_tokens']=0;m[0]['duration_seconds']=''
        rows=enrich_cohort(join_records(s,m,j,p));self.assertIsNotNone(rows[0]['efficiency'])
        self.assertGreater(rows[0]['efficiency'],95)

    def test_missing_resource_stays_none(self):
        s,m,j,p=fixture();m[0]['total_tokens']='';m[0]['duration_seconds']=''
        self.assertIsNone(enrich_cohort(join_records(s,m,j,p))[0]['efficiency'])

    def test_duplicate_scores_fail_closed(self):
        s,m,j,p=fixture();j.append(j[0])
        with self.assertRaises(ValueError):join_records(s,m,j,p)

    def test_duplicate_metadata_cannot_substitute_missing(self):
        s,m,j,p=fixture();m[-1]=m[0]
        with self.assertRaises(ValueError):join_records(s,m,j,p)

    def test_superseded_trial_cannot_overwrite_active_identity(self):
        s,m,j,p=fixture();m[0]['trial_id']='old_artifact'
        with self.assertRaises(ValueError):join_records(s,m,j,p)

    def test_missing_repeat_blocks(self):
        s,m,j,p=fixture();s.pop()
        with self.assertRaises(ValueError):join_records(s,m,j,p)

    def test_unknown_dispatch_is_not_false(self):
        s,m,j,p=fixture();m[0]['verified_dispatch']=''
        with self.assertRaises(ValueError):join_records(s,m,j,p)

    def test_recorded_zero_score_is_valid(self):
        s,m,j,p=fixture()
        for r in j:r['score']=0
        rows=enrich_cohort(join_records(s,m,j,p));self.assertTrue(rows[0]['complete_semantic'])
        self.assertEqual(rows[0]['primary_semantic'],0)

    def test_population_sd(self):
        rows,p=self.rows()
        for i,row in enumerate(rows):row['primary_semantic']=[0,50,100][i%3]
        import numpy as np
        self.assertAlmostEqual(aggregate(rows,p)[0]['T_stability'],100-np.std([0,50,100],ddof=0))

    def test_task_adjustment_uses_global_task_population(self):
        rows,p=self.rows()
        for r in rows:r['primary_semantic']=10 if r['config_key']=='a' else 90
        result=enrich_cohort(rows)
        self.assertEqual(result[0]['task_adjusted_semantic'],10)
        self.assertEqual(result[-1]['task_adjusted_semantic'],90)

    def test_bootstrap_reproducible(self):
        self.assertEqual(bootstrap(range(32),20260711),bootstrap(range(32),20260711))
        self.assertEqual(bootstrap([50]*32,20260711),[50,50])

    def test_long_plan_never_null(self):
        with tempfile.TemporaryDirectory() as d:
            path=Path(d)/'plan.json';path.write_text(json.dumps({'x':'z'*120026}))
            with self.assertRaises(ValueError):compact_plan(path)
            self.assertEqual(len(json.loads(compact_plan(path,200000))['x']),120026)

    def test_expanded_rendered_json_limit(self):
        with tempfile.TemporaryDirectory() as d:
            path=Path(d)/'plan.json';path.write_text('[1,2,3]')
            with self.assertRaises(ValueError):compact_plan(path,10)

    def test_extended_schema_accepted(self):
        p=dict(dimension='R1_physical_system_executability',score=67,reason='audited',evidence=[{'step':1}],issues=[],confidence='high',rule_audit={})
        self.assertEqual(validate_score(p,'R1'),p)
        with self.assertRaises(ValueError):validate_score(dict(p,score=True),'R1')
        with self.assertRaises(ValueError):validate_score(dict(p,dimension='R1_unknown'),'R1')
        with self.assertRaises(ValueError):validate_score(dict(p,confidence=''),'R1')

    def test_output_refuses_existing_directory(self):
        from paper_reproduction.run import run
        with tempfile.TemporaryDirectory() as d:
            with self.assertRaises(FileExistsError):run('irrelevant',d)


if __name__=='__main__':unittest.main()
