"""Human-readable methods and results with definitions beside each table."""
import html
from pathlib import Path


DEFINITIONS = '''Each configuration is one harness–model pairing. The cohort contains 48 configurations, each with 32 tasks and 3 retained repeats (96 slots).
R1, R2 and R3 are the primary GPT/Codex judge's physical system executability, problem coverage/workflow completeness and visible scientific design reasonableness scores (0–100, higher is better). Validation-judge scores are analysed separately.
complete_n counts trials with all three primary scores; missing raw scores remain missing. conditional_semantic averages 0.50 R1 + 0.25 R2 + 0.25 R3 over these complete trials.
semantic_fixed96 sums complete primary semantic scores and divides by all 96 assigned slots. Unscored slots contribute zero only to this fixed-denominator estimator.
D is verified dispatches / 96 × 100. Dispatch verification does not establish physical experiment completion.
T = 100 minus the mean within-task population standard deviation of primary semantic scores, clipped at zero; tasks require at least two finite scores (ddof=0).
E averages reverse midrank percentiles for tokens and duration over the entire finite primary-scored cohort, then averages available components within each configuration. Recorded zeros are retained; missing values are excluded.
six_axis = 0.60 × semantic_fixed96 + 0.20 × D + 0.10 × E + 0.10 × T (0–100).
Confidence intervals use 2,000 task-cluster bootstrap resamples of the 32 tasks, seed 20260711, NumPy PCG64 and linear 2.5%/97.5% quantiles. Use verify_suppdata to compare all 48 intervals with Supplementary Data 3.
Bold values indicate column maxima, including ties; they do not imply statistical significance.'''


def render(out, configs, agree, checks):
    fields=['config_key','complete_n','conditional_semantic','semantic_fixed96','D_dispatch_percent','E_efficiency','T_stability','six_axis_0_100']
    best={k:max(r[k] for r in configs if r[k] is not None) for k in fields[2:]}
    lines=['# LabBench reported-analysis reproduction','',
        'These tables were recomputed from retained experimental records. No new model responses or laboratory observations are generated.',
        '','## Configuration metrics','',DEFINITIONS,'',
        '| Configuration | Complete trials | Conditional semantic ↑ | Fixed-96 semantic ↑ | Dispatch % ↑ | Efficiency ↑ | Stability ↑ | Six-axis ↑ |',
        '|---|---:|---:|---:|---:|---:|---:|---:|']
    for r in sorted(configs,key=lambda x:x['semantic_fixed96'],reverse=True):
        cells=[]
        for k in fields:
            v=r[k]; text=str(v) if k in fields[:2] else ('Missing' if v is None else f'{v:.6f}')
            if k in best and v is not None and abs(v-best[k])<1e-10:
                text=f'**{text}**'
            cells.append(text)
        lines.append('| '+' | '.join(cells)+' |')
    lines += ['', '## Judge agreement', '',
        'Each observation pairs GPT and DeepSeek scores for the same trial and dimension. Pearson and Spearman measure correlation; MAE measures absolute disagreement (lower is better). Mean difference is DeepSeek minus GPT. Agreement alone does not establish correctness.',
        '', '| Dimension | Paired observations | Pearson | Spearman | MAE ↓ | Mean difference |', '|---|---:|---:|---:|---:|---:|']
    for r in agree:
        lines.append('| '+' | '.join(str(r[k]) if k in ('dimension','paired_dimension_n') else f'{r[k]:.6f}' for k in ['dimension','paired_dimension_n','pearson','spearman','mae','validation_minus_primary'])+' |')
    status = 'passed' if checks['all_checks_passed'] else 'failed; see manuscript_check.json'
    lines += ['', '## Validation', '',
        f"Manuscript numerical checkpoints: {len(checks['checks'])}; {status}.",
        'This report covers the structured benchmark. Supplementary workbook checks are available through paper_reproduction.verify_suppdata.',
        'Optional diagnostic figures are rendered from these tables; they do not reproduce the original publication layouts.', '']
    (Path(out)/'REPORT.md').write_text('\n'.join(lines),encoding='utf-8')
    # Self-contained review page: readable tables without external JS/CSS.
    body=[]; in_table=False
    for line in lines:
        if line.startswith('|'):
            if line.startswith('|---'):continue
            if not in_table:body.append('<div class="scroll"><table>');in_table=True
            values=[x.strip() for x in line.strip('|').split('|')]
            cells=[]
            for v in values:
                t=html.escape(v)
                if v.startswith('**') and v.endswith('**'):t='<strong>'+html.escape(v[2:-2])+'</strong>'
                cells.append('<td>'+t+'</td>')
            body.append('<tr>'+''.join(cells)+'</tr>')
        else:
            if in_table:body.append('</table></div>');in_table=False
            if line.startswith('# '):body.append('<h1>'+html.escape(line[2:])+'</h1>')
            elif line.startswith('## '):body.append('<h2>'+html.escape(line[3:])+'</h2>')
            elif line:body.append('<p>'+html.escape(line).replace('\n','<br>')+'</p>')
    document='<!doctype html><html lang="en"><meta charset="utf-8"><title>LabBench reported-analysis reproduction</title><style>body{max-width:1300px;margin:40px auto;padding:0 24px;font:16px/1.65 system-ui;color:#182331}h1{font-size:28px}h2{margin-top:36px}table{border-collapse:collapse;font-size:13px;width:100%}td{border:1px solid #d7dfe6;padding:7px;text-align:right;white-space:nowrap}td:first-child{text-align:left}tr:first-child{background:#e8eef3;font-weight:bold}.scroll{overflow-x:auto}strong{color:#104c80}</style>'+''.join(body)+'</html>'
    (Path(out)/'REPORT.html').write_text(document,encoding='utf-8')
