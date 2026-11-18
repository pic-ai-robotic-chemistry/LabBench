"""Prepare isolated paper-faithful scoring inputs; never dispatch a paid run.

The caller supplies immutable judge image digests. Runtime/CLI identity remains
a separate release prerequisite; an image string is not an executed validation.
"""
import argparse
import json
import re
import shutil
from pathlib import Path
from xml.etree import ElementTree as ET
from zipfile import ZipFile
from .io import read_rows, unique, boolean, compact_plan, sha256, write_json
from .import_archive import safe_path
from .cohort import PRIMARY, VALIDATION


def task_texts(docx):
    with ZipFile(docx) as z:
        root=ET.fromstring(z.read('word/document.xml'))
    ns={'w':'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
    paragraphs=[''.join(n.text or '' for n in p.findall('.//w:t',ns)).strip() for p in root.findall('.//w:p',ns)]
    paragraphs=[p for p in paragraphs if p]
    result={}
    for i,p in enumerate(paragraphs[:-1]):
        m=re.match(r'^([A-G]\d{2})(?:\s*[:：]\s*|\s+|(?=[^\s:：]))(.+)',p)
        if m and len(paragraphs[i+1])>80:
            result[m[1]]=m[2]+'\n\n'+paragraphs[i+1]
    return result


def prepare(archive_root,frozen,rules,docx,out,trial_ids,images):
    archive_root,frozen,rules,out=map(Path,(archive_root,frozen,rules,out))
    if out.exists():raise FileExistsError('New output directory required')
    for judge in (PRIMARY,VALIDATION):
        if not re.fullmatch(r'[^\s]+@sha256:[0-9a-f]{64}',images.get(judge,'')):
            raise ValueError('Supply an immutable image digest for each judge')
    selection=unique(read_rows(frozen/'selection_manifest.csv'),'trial_id')
    plans=unique(read_rows(frozen/'active_plans.csv'),'trial_id')
    tasks=task_texts(docx)
    prepared=[]
    # Validate the entire selected input set before any output write.
    inputs=[]
    for trial in trial_ids:
        if trial not in selection or trial not in plans:raise ValueError('Unselected trial')
        p=plans[trial]
        if not boolean(p['active_plan']):raise ValueError('Selected slot has no active plan; no synthetic scoring input')
        source=safe_path(archive_root,p['archive_relative_path'])
        if sha256(source)!=p['plan_sha256']:raise ValueError('Frozen plan hash drift')
        compact_plan(source)
        task=selection[trial]['benchmark_task']
        if task not in tasks:raise ValueError(f'Task missing: {task}')
        inputs.append((trial,source,task))
    out.mkdir(parents=True)
    for trial,source,task in inputs:
        for judge in (PRIMARY,VALIDATION):
            for d in ('R1','R2','R3'):
                task_name=trial+'__'+d+'__'+judge
                td=out/'tasks'/judge/task_name
                input_dir=td/'environment/input';input_dir.mkdir(parents=True)
                rule_dir=input_dir/'rules';rule_dir.mkdir()
                shutil.copy2(source,input_dir/'final_json.json')
                (input_dir/'problem_statement.txt').write_text(tasks[task],encoding='utf-8')
                current=rules/'score_rule_en'/('JUDGE_PROMPT_'+d+'_EN.md')
                shutil.copy2(current,rule_dir/'JUDGE_PROMPT_CURRENT_DIMENSION_EN.md')
                if d=='R1':shutil.copy2(rules/'score_rule_en/CONSTRAINTS_R1_EN.md',rule_dir/'CONSTRAINTS_R1_EN.md')
                common=(rules/'agent_judge_prompts/COMMON_SYSTEM_PROMPT.md').read_text()
                schema=(rules/'agent_judge_prompts/OUTPUT_SCHEMA.md').read_text()
                (td/'instruction.md').write_text(common+'\n\n'+schema+'\n\n'
                    f'Score only {d}. Read /workspace/input/problem_statement.txt and /workspace/input/final_json.json.\n'
                    'The full scoring rule is /workspace/input/rules/JUDGE_PROMPT_CURRENT_DIMENSION_EN.md.\n'
                    +('Also read /workspace/input/rules/CONSTRAINTS_R1_EN.md.\n' if d=='R1' else '')
                    +'Write the full audited JSON to /workspace/output/score.json and /logs/artifacts/score.json.\n'
                    'Do not call model or laboratory services outside the judge harness. Do not modify or dispatch the plan.\n',encoding='utf-8')
                (td/'environment/Dockerfile').write_text('FROM '+images[judge]+'\nCOPY input /workspace/input\nRUN mkdir -p /workspace/output /logs/artifacts\n')
                (td/'task.toml').write_text('version = "1.0"\n[agent]\ntimeout_sec = 1200.0\n[verifier]\ntimeout_sec = 120.0\n[environment]\nbuild_timeout_sec = 600.0\ncpus = 2\nmemory_mb = 8192\nstorage_mb = 12288\n')
                test=td/'tests';test.mkdir()
                shutil.copy2(Path(__file__).parent/'io.py',test/'paper_io.py')
                (test/'test.sh').write_text('#!/bin/bash\nset -uo pipefail\nmkdir -p /logs/verifier /logs/artifacts\n'
                    'python3 /tests/check.py > /logs/verifier/test_output.log 2>&1\nstatus=$?\n'
                    'if [ "$status" -eq 0 ]; then echo 1; else echo 0; fi > /logs/verifier/reward.txt\nexit 0\n')
                (test/'check.py').write_text('import json,shutil\nfrom pathlib import Path\nfrom paper_io import validate_score\n'
                    f'p=Path("/workspace/output/score.json")\nvalidate_score(json.loads(p.read_text()),{d!r})\n'
                    'shutil.copy2(p,"/logs/artifacts/score.json")\n')
                prepared.append(dict(task_name=task_name,trial_id=trial,judge_key=judge,dimension=d,task_dir=str(td.resolve()),
                    plan_sha256=sha256(source),rule_sha256=sha256(current),image=images[judge]))
    configs=[]
    for judge,harness,model in [(PRIMARY,'codex','openai/gpt-5.5'),(VALIDATION,'hermes','deepseek-v4-pro')]:
        prefix='PRIMARY' if judge==PRIMARY else 'VALIDATION'
        config={'job_name':'paper-score-'+judge,'jobs_dir':str((out/'jobs').resolve()),'n_attempts':1,
            'orchestrator':{'type':'local','n_concurrent_trials':1,'retry':{'max_retries':0}},
            'environment':{'type':None,'import_path':'environments.prebuilt_local_docker:PrebuiltLocalDockerEnvironment','force_build':True,'delete':False},
            'agents':[{'name':harness+'-scoring-runtime','import_path':'agents.aiready_'+harness+':Aiready'+harness.capitalize(),
                'model_name':model,'override_timeout_sec':1200,'max_timeout_sec':1200,
                'kwargs':{'reasoning_effort':'xhigh','reasoning_summary':'none'} if judge==PRIMARY else {'toolsets':'hermes-cli'},
                'env':{'OPENAI_API_KEY':'${AIREADY_PAPER_'+prefix+'_API_KEY}',
                    'OPENAI_BASE_URL':'${AIREADY_PAPER_'+prefix+'_BASE_URL}',
                    'OUTPUT_CONTRACT_MODE':'off','AIREADY_DISABLE_AGENT_PROMPT_AUGMENTATION':'1'}}],
            'datasets':[{'path':str((out/'tasks'/judge).resolve())}],
            'artifacts':['/workspace/output/score.json','/logs/artifacts/score.json']}
        path=out/'configs'/(judge+'.yaml');write_json(path,config);configs.append(str(path.resolve()))
    write_json(out/'manifest.json',dict(schema='paper-scoring-preparation-v1',prepared=prepared,configs=configs,
        executed=False,model_calls=0,laboratory_calls=0,
        benchmark_sha256=sha256(docx),
        frozen_input_hashes={p.name:sha256(p) for p in sorted(frozen.glob('*.csv'))},
        rule_hashes={str(p.relative_to(rules)):sha256(p) for p in sorted(rules.rglob('*.md'))},
        runtime_limits='Generated JSON-compatible YAML must pass Harbor/adapter smoke with the actual pinned release before execution.'))
    return prepared


def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--archive-root',required=True,type=Path);p.add_argument('--frozen',default='frozen/data',type=Path)
    p.add_argument('--rules',default='frozen/rules',type=Path);p.add_argument('--docx',default='../Benchmark_V15.docx',type=Path)
    p.add_argument('--out',required=True,type=Path);p.add_argument('--trial-id',action='append',required=True)
    p.add_argument('--primary-image',required=True);p.add_argument('--validation-image',required=True)
    a=p.parse_args(); result=prepare(a.archive_root,a.frozen,a.rules,a.docx,a.out,a.trial_id,{PRIMARY:a.primary_image,VALIDATION:a.validation_image})
    print(json.dumps({'prepared':len(result),'executed':False}))


if __name__=='__main__':main()
