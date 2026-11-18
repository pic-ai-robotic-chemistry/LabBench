"""Regenerate analytical panels; not a claim of original figure-layout identity."""
import argparse
from pathlib import Path
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from .io import read_rows, number, boolean


def load(path):
    rows=read_rows(path)
    for r in rows:
        for k,v in r.items():
            if k not in {'config_key','slot_id','trial_id','benchmark_task','active','task_id','complete_semantic','plan_expected','verified_dispatch'}:
                try:r[k]=number(v)
                except ValueError:pass
    return rows


def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--analysis',required=True,type=Path);a=p.parse_args()
    out=a.analysis/'figures'
    if out.exists():raise FileExistsError(out)
    out.mkdir()
    c=load(a.analysis/'configuration_metrics.csv'); r=load(a.analysis/'trial_metrics.csv')
    finite=[x for x in r if boolean(x['complete_semantic'])]
    plt.rcParams.update({'font.size':10,'axes.spines.top':False,'axes.spines.right':False,'svg.fonttype':'none'})
    def save(fig,name,note):
        fig.text(.02,.01,note,fontsize=8,ha='left',va='bottom',wrap=True)
        fig.tight_layout(rect=(0,.09,1,1))
        fig.savefig(out/(name+'.svg'));fig.savefig(out/(name+'.png'),dpi=160);plt.close(fig)
    harnesses=sorted({x['config_key'].split('__')[0] for x in c})
    models=sorted({x['config_key'].split('__')[1].replace('deepseek_v4_bailian','deepseek_v4pro_direct') for x in c})
    fig,ax=plt.subplots(1,2,figsize=(13,6))
    upper=max(x[k] for x in c for k in ('semantic_fixed96','six_axis_0_100') if x[k] is not None)
    for axis,metric,title in zip(ax,['semantic_fixed96','six_axis_0_100'],['JSON-stage (0–100, higher)','Dispatch composite (0–100, higher)']):
        z=np.full((len(harnesses),len(models)),np.nan)
        for x in c:
            h,m=x['config_key'].split('__');m=m.replace('deepseek_v4_bailian','deepseek_v4pro_direct')
            z[harnesses.index(h),models.index(m)]=x[metric]
        image=axis.imshow(z,vmin=0,vmax=upper,cmap='viridis',aspect='auto')
        axis.set_xticks(range(len(models)),models,rotation=70,ha='right');axis.set_yticks(range(len(harnesses)),harnesses)
        axis.set_title(title)
        for i in range(len(harnesses)):
            for j in range(len(models)):
                axis.text(j,i,'N/A' if np.isnan(z[i,j]) else f'{z[i,j]:.1f}',ha='center',va='center',fontsize=7,color='white' if not np.isnan(z[i,j]) and z[i,j]<upper*.6 else 'black')
        fig.colorbar(image,ax=axis,fraction=.03)
    save(fig,'Fig3de_recomputed','48 observed configurations; fixed denominator 96; absent family pairings = N/A. Original glyph layout not replicated.')
    top=sorted(c,key=lambda x:x['semantic_fixed96'],reverse=True)[:12]
    fig,ax=plt.subplots(figsize=(10,6));y=np.arange(12)
    vals=np.array([x['semantic_fixed96'] for x in top]);lo=np.array([x['ci95_low'] for x in top]);hi=np.array([x['ci95_high'] for x in top])
    ax.errorbar(vals,y,xerr=[vals-lo,hi-vals],fmt='o',color='#245e8c',capsize=3);ax.set_yticks(y,[x['config_key'] for x in top]);ax.invert_yaxis();ax.set_xlabel('Fixed-96 semantic score (0–100, higher)')
    save(fig,'ED3a_bootstrap','95% percentile CI: 2,000 task-cluster resamples, 32 tasks; PCG64 + linear quantile. Submitted CI values verified separately.')
    fig,axes=plt.subplots(1,3,figsize=(12,4))
    for axis,d in zip(axes,['R1','R2','R3']):
        paired=[x for x in finite if x['validation_'+d] is not None]
        axis.scatter([x['primary_'+d] for x in paired],[x['validation_'+d] for x in paired],s=6,alpha=.2)
        axis.plot([0,100],[0,100],'--',color='gray');axis.set(xlim=(0,100),ylim=(0,100),title=d,xlabel='Primary GPT score',ylabel='Validation DeepSeek score')
    save(fig,'ED4_judge_agreement','Paired scores of the same trial and dimension (0–100); n=2,596 per dimension. Correlation does not establish human validity.')
    fig,axes=plt.subplots(1,3,figsize=(13,4))
    axes[0].scatter([x['coverage'] for x in c],[x['conditional_semantic'] for x in c],c=[x['semantic_fixed96'] for x in c]);axes[0].set(xlabel='Complete triples / 96',ylabel='Conditional semantic mean',title='Coverage vs quality')
    axes[1].scatter([x['conditional_semantic'] for x in c],[x['task_adjusted_conditional'] for x in c]);axes[1].plot([0,65],[0,65],'--',color='gray');axes[1].set(xlabel='Unadjusted conditional mean',ylabel='Task-adjusted mean',title='Task composition sensitivity')
    axes[2].scatter([x['semantic_fixed96'] for x in c],[x['equal_weight_fixed96'] for x in c]);axes[2].plot([0,65],[0,65],'--',color='gray');axes[2].set(xlabel='Primary weights .50/.25/.25',ylabel='Equal weights 1/3',title='Weight sensitivity')
    save(fig,'ED6_7_8_sensitivity','Each point is one configuration (n=48). Scores 0–100, higher; descriptive sensitivity, not a significance test.')
    fig,ax=plt.subplots(figsize=(8,5))
    positive=[x for x in finite if x['total_tokens'] is not None and x['total_tokens']>0 and x['duration_seconds'] is not None and x['duration_seconds']>0]
    for value,label,color in [(False,'No verified dispatch','#8495a3'),(True,'Verified dispatch','#246595')]:
        group=[x for x in positive if boolean(x['verified_dispatch'])==value]
        ax.scatter([x['total_tokens'] for x in group],[x['duration_seconds'] for x in group],s=8,alpha=.4,label=label,color=color)
    ax.set(xscale='log',yscale='log',xlabel='Recorded total tokens (lower resource use)',ylabel='Wall time, seconds (lower resource use)');ax.legend()
    save(fig,'ED9a_resources','Finite primary-scored trials with both resource values >0; log-plot filter differs from E (recorded zeros retained in E).')


if __name__=='__main__':main()
