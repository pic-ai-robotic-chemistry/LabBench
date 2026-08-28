import { Fragment } from 'react'
import { Link } from 'react-router'
import {
  paperMeta,
  keyStats,
  labStats,
  abstractText,
  skillCategories,
  pathway,
  pathwayStages,
  pathwayNote,
  leaderboard,
  leaderboardCaption,
  weightsAvg,
  weightsAvgCaption,
  longHorizon,
  taskDomains,
  closedLoop,
  failureModes,
  failureNote,
  scoringAxes,
  formulas,
  methodologyNotes,
  bibtex,
} from '@/data/benchmark'

/* ---------- N10 ranking helpers ---------- */
const sortedN10 = leaderboard.map((r) => r.n10).sort((a, b) => b - a)
const bestN10 = sortedN10[0]
const secondN10 = sortedN10[1]
const maxN10 = bestN10
const maxWeights = Math.max(...weightsAvg.map((r) => r.value))

function n10Class(v: number) {
  if (v === bestN10) return 'cu-num cu-best'
  if (v === secondN10) return 'cu-num cu-second'
  return 'cu-num'
}

function stageClass(stage: string) {
  if (stage === pathwayStages[0]) return 'cu-pipe-design'
  if (stage === pathwayStages[1]) return 'cu-pipe-validation'
  return 'cu-pipe-boundary'
}

const wallUnder = longHorizon.totalExecutable - longHorizon.over30Ops

const TIMELINE = [
  { label: 'Thinking', cls: 'cu-pill-thinking' },
  { label: 'Reading feedback', cls: 'cu-pill-read' },
  { label: 'Adjusting parameters', cls: 'cu-pill-edit' },
  { label: 'Grepping skills', cls: 'cu-pill-grep' },
  { label: 'Done · 44 ops', cls: 'cu-pill-done' },
]

export default function Cursor() {
  return (
    <div className="style-cursor">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
      />
      <style>{CSS}</style>

      {/* ============ NAV ============ */}
      <header className="cu-nav">
        <div className="cu-wrap cu-nav-inner">
          <span className="cu-wordmark">
            robochem<span className="cu-wordmark-accent">_bench</span>
          </span>
          <nav className="cu-nav-links">
            <a href="#cu-framework">Skills</a>
            <a href="#cu-leaderboard">Leaderboard</a>
            <a href="#cu-charts">Analysis</a>
            <a href="#cu-tasks">Tasks</a>
          </nav>
          <div className="cu-nav-right">
            <Link to="/" className="cu-nav-back">
              ← Back to Gallery
            </Link>
            <a href="#" className="cu-btn cu-btn-primary">
              Submit Your Agent
            </a>
          </div>
        </div>
      </header>

      {/* ============ HERO + IDE MOCKUP ============ */}
      <section className="cu-hero">
        <div className="cu-wrap cu-hero-grid">
          <div>
            <p className="cu-eyebrow">Benchmark paper · arXiv:2607.23045</p>
            <h1 className="cu-h1">{paperMeta.title}</h1>
            <p className="cu-sub">{paperMeta.subtitle}</p>
            <p className="cu-authors">
              {paperMeta.authors.join(', ')}
              <br />
              {paperMeta.affiliation}
            </p>
            <div className="cu-btn-row">
              <a href={paperMeta.links[0].href} className="cu-btn cu-btn-primary">
                {paperMeta.links[0].label}
              </a>
              <a href={paperMeta.links[1].href} className="cu-btn cu-btn-secondary">
                {paperMeta.links[1].label}
              </a>
              <a href={paperMeta.links[2].href} className="cu-btn cu-btn-secondary">
                {paperMeta.links[2].label}
              </a>
              <a href={paperMeta.links[3].href} className="cu-btn cu-btn-tertiary">
                {paperMeta.links[3].label} →
              </a>
            </div>
          </div>

          <div className="cu-ide">
            <div className="cu-ide-titlebar">
              <span className="cu-ide-dot" />
              <span className="cu-ide-dot" />
              <span className="cu-ide-dot" />
              <span className="cu-ide-file">closed_loop.yaml — robochem-bench</span>
            </div>
            <div className="cu-ide-body">
              <div className="cu-ide-sidebar">
                <div className="cu-ide-side-head">LABORATORY</div>
                <div className="cu-ide-side-item cu-ide-side-active">▸ electrocatalysis.plan</div>
                <div className="cu-ide-side-item">▸ electrode_materials.plan</div>
                <div className="cu-ide-side-item">▸ photocatalysis.plan</div>
                <div className="cu-ide-side-item">▸ thermal_catalysis.plan</div>
              </div>
              <div className="cu-ide-editor">
                <pre className="cu-ide-code">
{`agent: codex × gpt-5.5
task:  urea_oxidation_catalyst
round: 5/5
feedback:
  gc: yield improving
replan: local only
stations: [ws_liquid, ws_centrifuge, ws_drying]`}
                </pre>
              </div>
              <div className="cu-ide-agent">
                <div className="cu-ide-side-head">AGENT TIMELINE</div>
                {TIMELINE.map((t) => (
                  <div key={t.label} className={`cu-pill ${t.cls}`}>
                    {t.label}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ STATS ============ */}
      <section className="cu-band">
        <div className="cu-wrap cu-stats-grid">
          {keyStats.map((s) => (
            <div key={s.label} className="cu-stat">
              <div className="cu-stat-value">{s.value}</div>
              <div className="cu-stat-label">{s.label}</div>
              <div className="cu-stat-desc">{s.description}</div>
            </div>
          ))}
        </div>
        <div className="cu-wrap cu-labstats">
          {labStats.map((s) => (
            <div key={s.label} className="cu-labstat">
              <span className="cu-labstat-value">{s.value}</span>
              <span className="cu-labstat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ============ ABSTRACT ============ */}
      <section className="cu-band">
        <div className="cu-wrap cu-narrow">
          <p className="cu-eyebrow">Abstract</p>
          <p className="cu-abstract">{abstractText}</p>
        </div>
      </section>

      {/* ============ SKILLS LIBRARY ============ */}
      <section className="cu-band" id="cu-framework">
        <div className="cu-wrap">
          <p className="cu-eyebrow">The Skills Library</p>
          <h2 className="cu-h2">45 workstations, one skills library</h2>
          <div className="cu-dim-grid">
            {skillCategories.map((d, i) => (
              <div key={d.name} className="cu-dim-card">
                <div className="cu-dim-index">0{i + 1} /</div>
                <h3 className="cu-dim-name">{d.name}</h3>
                <p className="cu-dim-tagline">{d.tagline}</p>
                <ul className="cu-dim-list">
                  {d.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ EVALUATION PATHWAY ============ */}
      <section className="cu-band">
        <div className="cu-wrap">
          <p className="cu-eyebrow">Evaluation pathway</p>
          <h2 className="cu-h2">From task receipt to physical execution</h2>
          <div className="cu-pipeline">
            {pathway.map((n, i) => (
              <Fragment key={n.node}>
                {i > 0 && <span className="cu-pipe-arrow">→</span>}
                <div
                  className={`cu-pipe-node ${stageClass(n.stage)}${n.node === 'N10' ? ' cu-pipe-final' : ''}`}
                >
                  <span className="cu-pipe-id">{n.node}</span>
                  <span className="cu-pipe-label">{n.label}</span>
                </div>
              </Fragment>
            ))}
          </div>
          <div className="cu-pipe-legend">
            {pathwayStages.map((stage) => (
              <span key={stage} className="cu-legend-item">
                <span className={`cu-pipe-swatch ${stageClass(stage)}`} />
                {stage}
              </span>
            ))}
          </div>
          <p className="cu-pipe-note">{pathwayNote}</p>
        </div>
      </section>

      {/* ============ LEADERBOARD ============ */}
      <section className="cu-band" id="cu-leaderboard">
        <div className="cu-wrap">
          <p className="cu-eyebrow">Leaderboard</p>
          <h2 className="cu-h2">Top 8 of 48 configurations, ranked by N10 executable yield</h2>
          <p className="cu-note">
            N10 Yield is the expert-adjudicated executable rate (%). <strong>Bold</strong> marks the
            best configuration, <span className="cu-second">underline</span> the runner-up.
          </p>
          <div className="cu-table-card">
            <table className="cu-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Configuration</th>
                  <th>Organization</th>
                  <th>Weights</th>
                  <th className="cu-th-num">Trials</th>
                  <th className="cu-th-num">Executable</th>
                  <th className="cu-th-num">N10 Yield</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((r) => (
                  <tr key={r.rank}>
                    <td className="cu-num cu-muted">{r.rank}</td>
                    <td className="cu-model">
                      {r.harness} × {r.model}
                    </td>
                    <td className="cu-org">{r.org}</td>
                    <td>
                      <span className={r.weights === 'open' ? 'cu-badge cu-badge-open' : 'cu-badge'}>
                        {r.weights === 'open' ? 'Open' : 'Closed'}
                      </span>
                    </td>
                    <td className="cu-td-num">
                      <span className="cu-num">{r.trials}</span>
                    </td>
                    <td className="cu-td-num">
                      <span className="cu-num">{r.executable}</span>
                    </td>
                    <td className="cu-td-num">
                      <span className={n10Class(r.n10)}>{r.n10.toFixed(1)}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="cu-table-caption">{leaderboardCaption}</p>
        </div>
      </section>

      {/* ============ CHARTS ============ */}
      <section className="cu-band" id="cu-charts">
        <div className="cu-wrap">
          <p className="cu-eyebrow">Analysis</p>
          <h2 className="cu-h2">Results at a glance</h2>
          <div className="cu-charts-grid">
            <div className="cu-chart-card cu-chart-wide">
              <h3 className="cu-chart-title">N10 executable yield — top 8 configurations</h3>
              <div className="cu-bars">
                {leaderboard.map((r) => (
                  <div key={r.rank} className="cu-bar-row">
                    <span className="cu-bar-label">
                      {r.harness} × {r.model}
                    </span>
                    <span className="cu-bar-track">
                      <span
                        className={r.rank === 1 ? 'cu-bar-fill cu-bar-top' : 'cu-bar-fill'}
                        style={{ width: `${(r.n10 / maxN10) * 100}%` }}
                      />
                    </span>
                    <span className="cu-bar-value">{r.n10.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="cu-chart-card">
              <h3 className="cu-chart-title">The long-horizon wall</h3>
              <div className="cu-wall-ratio">
                <span
                  className="cu-wall-seg cu-wall-under"
                  style={{ width: `${(wallUnder / longHorizon.totalExecutable) * 100}%` }}
                />
                <span
                  className="cu-wall-seg cu-wall-over"
                  style={{ width: `${(longHorizon.over30Ops / longHorizon.totalExecutable) * 100}%` }}
                />
              </div>
              <div className="cu-wall-meta">
                <span>{wallUnder} executable workflows ≤ 30 ops</span>
                <span>{longHorizon.over30Ops} workflows &gt; 30 ops</span>
              </div>
              <div className="cu-wall-big">
                <span className="cu-wall-num">{longHorizon.longest}</span>
                <span className="cu-wall-cap">operations in the longest executable workflow</span>
              </div>
              <p className="cu-wall-note">{longHorizon.note}</p>
            </div>
            <div className="cu-chart-card">
              <h3 className="cu-chart-title">Open vs Closed — mean N10 yield</h3>
              <div className="cu-grouped">
                {weightsAvg.map((row) => (
                  <div key={row.group} className="cu-group">
                    <div className="cu-group-bars">
                      <span
                        className={
                          row.group.startsWith('Closed') ? 'cu-gbar cu-gbar-closed' : 'cu-gbar cu-gbar-open'
                        }
                        style={{ height: `${(row.value / maxWeights) * 100}%` }}
                      >
                        <span className="cu-gbar-tip">{row.value.toFixed(1)}%</span>
                      </span>
                    </div>
                    <span className="cu-group-label">
                      {row.group.startsWith('Closed') ? 'Closed' : 'Open'} · n={row.n}
                    </span>
                  </div>
                ))}
              </div>
              <div className="cu-legend">
                <span className="cu-legend-item">
                  <span className="cu-legend-swatch" style={{ background: '#9fc9a2' }} /> Open
                </span>
                <span className="cu-legend-item">
                  <span className="cu-legend-swatch" style={{ background: '#9fbbe0' }} /> Closed
                </span>
              </div>
              <p className="cu-chart-note">{weightsAvgCaption}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ TASK DOMAINS ============ */}
      <section className="cu-band" id="cu-tasks">
        <div className="cu-wrap">
          <p className="cu-eyebrow">Task domains</p>
          <h2 className="cu-h2">32 research tasks across 4 catalysis domains</h2>
          <div className="cu-task-grid">
            {taskDomains.map((t, i) => (
              <div key={t.domain} className={i === 0 ? 'cu-task-card cu-task-hot' : 'cu-task-card'}>
                <div className="cu-task-top">
                  <span className="cu-badge">{t.domain}</span>
                  {i === 0 && <span className="cu-badge cu-badge-open">Closed-loop</span>}
                </div>
                <p className="cu-task-desc">{t.blurb}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CLOSED-LOOP ADAPTATION ============ */}
      <section className="cu-band">
        <div className="cu-wrap">
          <p className="cu-eyebrow">Closed-loop adaptation</p>
          <h2 className="cu-h2">Five rounds of feedback — local adjustments only</h2>
          <p className="cu-note">
            Agent: {closedLoop.agent} · Task: {closedLoop.task} · {closedLoop.rounds} feedback rounds
          </p>
          <div className="cu-loop-grid">
            <div className="cu-loop-card">
              <h3 className="cu-loop-title">
                <span className="cu-loop-yes">✓</span> Localized adaptation observed
              </h3>
              <ul className="cu-loop-list">
                {closedLoop.adapted.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
            <div className="cu-loop-card">
              <h3 className="cu-loop-title">
                <span className="cu-loop-no">✗</span> Strategic redirection not observed
              </h3>
              <ul className="cu-loop-list">
                {closedLoop.notObserved.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FAILURE MODES ============ */}
      <section className="cu-band">
        <div className="cu-wrap">
          <p className="cu-eyebrow">Failure analysis</p>
          <h2 className="cu-h2">How agents fail</h2>
          <div className="cu-fail-card">
            {failureModes.map((f) => (
              <div key={f.name} className="cu-fail-row">
                <div className="cu-fail-body">
                  <div className="cu-fail-name">{f.name}</div>
                  <p className="cu-fail-desc">{f.description}</p>
                </div>
              </div>
            ))}
            <p className="cu-fail-note">{failureNote}</p>
          </div>
        </div>
      </section>

      {/* ============ METHODOLOGY + BIBTEX ============ */}
      <section className="cu-band">
        <div className="cu-wrap cu-method-grid">
          <div>
            <p className="cu-eyebrow">Methodology</p>
            <h2 className="cu-h2">How we measured</h2>
            <ul className="cu-method-list">
              {methodologyNotes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
            <p className="cu-eyebrow cu-eyebrow-gap">Scoring rubric — multi-axis R1–R6</p>
            <ul className="cu-axes-list">
              {scoringAxes.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
            <div className="cu-formulas">
              {formulas.map((f) => (
                <code key={f} className="cu-formula">
                  {f}
                </code>
              ))}
            </div>
          </div>
          <div>
            <p className="cu-eyebrow">Cite this work</p>
            <div className="cu-code-block">
              <div className="cu-code-head">robochem.bib</div>
              <pre className="cu-bibtex">
                <code>{bibtex}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* ============ CTA + FOOTER ============ */}
      <section className="cu-band">
        <div className="cu-wrap cu-cta">
          <h2 className="cu-cta-title">Think your agent can do science?</h2>
          <a href="#" className="cu-btn cu-btn-primary">
            Submit Your Agent
          </a>
        </div>
      </section>
      <footer className="cu-footer">
        <div className="cu-wrap cu-footer-inner">
          <span className="cu-wordmark">
            robochem<span className="cu-wordmark-accent">_bench</span>
          </span>
          <p className="cu-footer-note">Style preview · Cursor DESIGN.md · Content from arXiv:2607.23045</p>
          <Link to="/" className="cu-footer-link">
            ← Back to Gallery
          </Link>
        </div>
      </footer>
    </div>
  )
}

/* ---------- scoped styles ---------- */
const CSS = `
.style-cursor{
  background:#1c1b15;color:#f7f7f4;
  font-family:'Inter',system-ui,'Helvetica Neue',Helvetica,Arial,sans-serif;
  min-height:100dvh;-webkit-font-smoothing:antialiased;
}
.style-cursor .cu-wrap{max-width:1200px;margin:0 auto;padding:0 32px;}
.style-cursor .cu-narrow{max-width:800px;}
.style-cursor .cu-band{padding:80px 0 0;}
.style-cursor a{text-decoration:none;color:inherit;}
.style-cursor .cu-eyebrow{font-size:11px;font-weight:600;letter-spacing:0.88px;text-transform:uppercase;color:#807d72;margin:0 0 16px;}

/* nav */
.style-cursor .cu-nav{background:#1c1b15;border-bottom:1px solid #3a382d;position:sticky;top:0;z-index:50;}
.style-cursor .cu-nav-inner{height:64px;display:flex;align-items:center;justify-content:space-between;gap:24px;}
.style-cursor .cu-wordmark{font-size:16px;font-weight:600;letter-spacing:-0.2px;white-space:nowrap;}
.style-cursor .cu-wordmark-accent{color:#f54e00;}
.style-cursor .cu-nav-links{display:flex;gap:24px;}
.style-cursor .cu-nav-links a{font-size:14px;font-weight:500;color:#b8b5aa;}
.style-cursor .cu-nav-links a:hover{color:#f7f7f4;}
.style-cursor .cu-nav-right{display:flex;align-items:center;gap:16px;flex:none;}
.style-cursor .cu-nav-back{font-size:14px;font-weight:500;color:#807d72;white-space:nowrap;}
.style-cursor .cu-nav-back:hover{color:#f7f7f4;}

/* buttons */
.style-cursor .cu-btn{display:inline-flex;align-items:center;height:40px;padding:10px 18px;border-radius:8px;
  font-size:14px;font-weight:500;line-height:1;cursor:pointer;white-space:nowrap;border:1px solid transparent;}
.style-cursor .cu-btn-primary{background:#f54e00;color:#ffffff;}
.style-cursor .cu-btn-primary:hover{background:#d04200;}
.style-cursor .cu-btn-secondary{background:#26251e;color:#f7f7f4;border-color:#454335;}
.style-cursor .cu-btn-tertiary{background:transparent;color:#f7f7f4;padding-left:6px;padding-right:6px;}
.style-cursor .cu-btn-row{display:flex;flex-wrap:wrap;gap:12px;margin-top:32px;}

/* hero + IDE mockup */
.style-cursor .cu-hero{padding:80px 0;}
.style-cursor .cu-hero-grid{display:grid;grid-template-columns:5fr 6fr;gap:48px;align-items:center;}
.style-cursor .cu-h1{font-size:56px;font-weight:400;line-height:1.1;letter-spacing:-1.7px;margin:0 0 20px;color:#f7f7f4;}
.style-cursor .cu-sub{font-size:16px;line-height:1.5;color:#b8b5aa;margin:0 0 16px;}
.style-cursor .cu-authors{font-size:13px;line-height:1.6;color:#807d72;margin:0;}
.style-cursor .cu-h2{font-size:36px;font-weight:400;line-height:1.2;letter-spacing:-0.72px;margin:0 0 12px;color:#f7f7f4;}
.style-cursor .cu-note{font-size:14px;color:#807d72;margin:0 0 24px;}

.style-cursor .cu-ide{background:#26251e;border:1px solid #3a382d;border-radius:12px;overflow:hidden;}
.style-cursor .cu-ide-titlebar{display:flex;align-items:center;gap:6px;padding:12px 16px;border-bottom:1px solid #3a382d;}
.style-cursor .cu-ide-dot{width:10px;height:10px;border-radius:50%;background:#3a382d;}
.style-cursor .cu-ide-file{margin-left:10px;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:12px;color:#807d72;}
.style-cursor .cu-ide-body{display:grid;grid-template-columns:150px 1fr 150px;min-height:230px;}
.style-cursor .cu-ide-sidebar{background:#22211a;padding:14px 12px;border-right:1px solid #3a382d;}
.style-cursor .cu-ide-side-head{font-size:11px;font-weight:600;letter-spacing:0.88px;color:#807d72;margin-bottom:10px;text-transform:uppercase;}
.style-cursor .cu-ide-side-item{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;color:#b8b5aa;
  padding:5px 8px;border-radius:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.style-cursor .cu-ide-side-active{background:#302e25;color:#f7f7f4;}
.style-cursor .cu-ide-editor{padding:16px;overflow-x:auto;}
.style-cursor .cu-ide-code{margin:0;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:12.5px;line-height:1.6;color:#c9c6bb;white-space:pre;}
.style-cursor .cu-ide-agent{background:#22211a;padding:14px 12px;border-left:1px solid #3a382d;display:flex;flex-direction:column;gap:8px;align-items:flex-start;}
.style-cursor .cu-pill{font-size:11px;font-weight:600;letter-spacing:0.88px;text-transform:uppercase;
  padding:4px 10px;border-radius:9999px;color:#26251e;white-space:nowrap;}
.style-cursor .cu-pill-thinking{background:#dfa88f;}
.style-cursor .cu-pill-grep{background:#9fc9a2;}
.style-cursor .cu-pill-read{background:#9fbbe0;}
.style-cursor .cu-pill-edit{background:#c0a8dd;}
.style-cursor .cu-pill-done{background:#c08532;color:#ffffff;}

/* stats */
.style-cursor .cu-stats-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:16px;}
.style-cursor .cu-stat{background:#26251e;border:1px solid #3a382d;border-radius:12px;padding:20px;}
.style-cursor .cu-stat-value{font-size:32px;font-weight:400;letter-spacing:-0.6px;line-height:1.1;color:#f7f7f4;}
.style-cursor .cu-stat-label{font-size:13px;font-weight:600;color:#f7f7f4;margin-top:10px;}
.style-cursor .cu-stat-desc{font-size:12px;color:#807d72;margin-top:3px;}

/* lab stats (secondary band) */
.style-cursor .cu-labstats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:16px;}
.style-cursor .cu-labstat{border:1px dashed #3a382d;border-radius:12px;padding:14px 20px;display:flex;align-items:baseline;gap:12px;}
.style-cursor .cu-labstat-value{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:20px;color:#f54e00;}
.style-cursor .cu-labstat-label{font-size:12px;font-weight:600;letter-spacing:0.88px;text-transform:uppercase;color:#807d72;}

/* abstract */
.style-cursor .cu-abstract{font-size:22px;font-weight:400;line-height:1.5;letter-spacing:0.08px;color:#dcdad2;margin:0;}

/* dimensions */
.style-cursor .cu-dim-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:32px;}
.style-cursor .cu-dim-card{background:#26251e;border:1px solid #3a382d;border-radius:12px;padding:24px;}
.style-cursor .cu-dim-index{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:12px;color:#f54e00;margin-bottom:14px;}
.style-cursor .cu-dim-name{font-size:18px;font-weight:600;line-height:1.4;margin:0 0 6px;color:#f7f7f4;}
.style-cursor .cu-dim-tagline{font-size:13px;color:#807d72;margin:0 0 16px;}
.style-cursor .cu-dim-list{margin:0;padding:0;list-style:none;}
.style-cursor .cu-dim-list li{font-size:14px;line-height:1.5;color:#b8b5aa;padding:9px 0 9px 16px;position:relative;border-top:1px solid #3a382d;}
.style-cursor .cu-dim-list li::before{content:'';position:absolute;left:0;top:16px;width:6px;height:6px;border-radius:50%;background:#f54e00;}

/* pathway pipeline */
.style-cursor .cu-pipeline{display:flex;flex-wrap:wrap;align-items:stretch;gap:10px;margin-top:32px;}
.style-cursor .cu-pipe-node{background:#26251e;border:1px solid #3a382d;border-top:3px solid #9fbbe0;
  border-radius:12px;padding:14px 16px;flex:1;min-width:140px;display:flex;flex-direction:column;gap:6px;}
.style-cursor .cu-pipe-node.cu-pipe-validation{border-top-color:#dfa88f;}
.style-cursor .cu-pipe-node.cu-pipe-boundary{border-top-color:#9fc9a2;}
.style-cursor .cu-pipe-id{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:12px;font-weight:600;color:#9fbbe0;}
.style-cursor .cu-pipe-validation .cu-pipe-id{color:#dfa88f;}
.style-cursor .cu-pipe-boundary .cu-pipe-id{color:#9fc9a2;}
.style-cursor .cu-pipe-label{font-size:13px;line-height:1.45;color:#b8b5aa;}
.style-cursor .cu-pipe-arrow{display:flex;align-items:center;color:#5c594e;font-size:18px;flex:none;}
.style-cursor .cu-pipe-final{background:#f54e00;border-color:#f54e00;}
.style-cursor .cu-pipe-final .cu-pipe-id{color:#ffffff;}
.style-cursor .cu-pipe-final .cu-pipe-label{color:#ffffff;font-weight:600;}
.style-cursor .cu-pipe-legend{display:flex;flex-wrap:wrap;gap:18px;margin-top:18px;}
.style-cursor .cu-pipe-swatch{width:10px;height:10px;border-radius:3px;display:inline-block;background:#9fbbe0;}
.style-cursor .cu-pipe-swatch.cu-pipe-validation{background:#dfa88f;}
.style-cursor .cu-pipe-swatch.cu-pipe-boundary{background:#9fc9a2;}
.style-cursor .cu-pipe-note{font-size:13px;line-height:1.6;color:#807d72;margin:18px 0 0;max-width:820px;}

/* leaderboard */
.style-cursor .cu-table-card{background:#26251e;border:1px solid #3a382d;border-radius:12px;overflow:auto;}
.style-cursor .cu-table{width:100%;border-collapse:collapse;min-width:880px;}
.style-cursor .cu-table th{font-size:11px;font-weight:600;letter-spacing:0.88px;text-transform:uppercase;color:#807d72;
  text-align:left;padding:14px 16px;border-bottom:1px solid #3a382d;white-space:nowrap;}
.style-cursor .cu-table td{padding:12px 16px;border-bottom:1px solid #3a382d;font-size:14px;color:#b8b5aa;white-space:nowrap;}
.style-cursor .cu-table tbody tr:last-child td{border-bottom:none;}
.style-cursor .cu-table tbody tr:hover td{background:#2c2b22;}
.style-cursor .cu-th-num,.style-cursor .cu-td-num{text-align:right;}
.style-cursor .cu-model{font-weight:600;color:#f7f7f4;}
.style-cursor .cu-org{color:#807d72;font-size:13px;}
.style-cursor .cu-num{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:13px;}
.style-cursor .cu-best{font-weight:600;color:#f54e00;}
.style-cursor .cu-second{text-decoration:underline;text-underline-offset:3px;color:#f7f7f4;}
.style-cursor .cu-muted{color:#5c594e;}
.style-cursor .cu-badge{display:inline-block;background:#302e25;color:#b8b5aa;font-size:11px;font-weight:600;
  letter-spacing:0.88px;text-transform:uppercase;padding:4px 10px;border-radius:9999px;}
.style-cursor .cu-badge-open{background:rgba(159,201,162,.15);color:#9fc9a2;}
.style-cursor .cu-table-caption{font-size:13px;color:#807d72;margin:14px 0 0;}

/* charts */
.style-cursor .cu-charts-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:32px;}
.style-cursor .cu-chart-card{background:#26251e;border:1px solid #3a382d;border-radius:12px;padding:24px;}
.style-cursor .cu-chart-wide{grid-column:1 / -1;}
.style-cursor .cu-chart-title{font-size:16px;font-weight:600;color:#f7f7f4;margin:0 0 20px;}
.style-cursor .cu-chart-note{font-size:12px;color:#807d72;margin:14px 0 0;text-align:center;}
.style-cursor .cu-bars{display:flex;flex-direction:column;gap:8px;}
.style-cursor .cu-bar-row{display:grid;grid-template-columns:240px 1fr 56px;gap:12px;align-items:center;}
.style-cursor .cu-bar-label{font-size:13px;color:#b8b5aa;text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.style-cursor .cu-bar-track{display:block;height:13px;background:#1c1b15;border-radius:6px;overflow:hidden;}
.style-cursor .cu-bar-fill{display:block;height:100%;background:#454335;border-radius:6px;}
.style-cursor .cu-bar-top{background:#f54e00;}
.style-cursor .cu-bar-value{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:12px;color:#807d72;}
.style-cursor .cu-legend{display:flex;flex-wrap:wrap;gap:14px;margin-top:16px;justify-content:center;}
.style-cursor .cu-legend-item{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:#807d72;}
.style-cursor .cu-legend-swatch{width:10px;height:10px;border-radius:3px;display:inline-block;}
.style-cursor .cu-grouped{display:flex;justify-content:space-around;align-items:flex-end;height:240px;margin-top:8px;}
.style-cursor .cu-group{display:flex;flex-direction:column;align-items:center;gap:10px;height:100%;justify-content:flex-end;}
.style-cursor .cu-group-bars{display:flex;align-items:flex-end;gap:8px;height:200px;}
.style-cursor .cu-gbar{position:relative;display:block;width:52px;border-radius:6px 6px 0 0;}
.style-cursor .cu-gbar-open{background:#9fc9a2;}
.style-cursor .cu-gbar-closed{background:#9fbbe0;}
.style-cursor .cu-gbar-tip{position:absolute;top:-20px;left:50%;transform:translateX(-50%);
  font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;color:#807d72;white-space:nowrap;}
.style-cursor .cu-group-label{font-size:11px;font-weight:600;letter-spacing:0.88px;text-transform:uppercase;color:#807d72;}

/* long-horizon wall */
.style-cursor .cu-wall-ratio{display:flex;height:22px;border-radius:6px;overflow:hidden;background:#1c1b15;}
.style-cursor .cu-wall-seg{display:block;height:100%;}
.style-cursor .cu-wall-under{background:#454335;}
.style-cursor .cu-wall-over{background:#f54e00;min-width:10px;}
.style-cursor .cu-wall-meta{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;
  font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;color:#807d72;margin-top:10px;}
.style-cursor .cu-wall-big{display:flex;align-items:baseline;gap:16px;margin:30px 0 14px;}
.style-cursor .cu-wall-num{font-size:72px;font-weight:400;line-height:1;letter-spacing:-2px;color:#f54e00;}
.style-cursor .cu-wall-cap{font-size:14px;line-height:1.4;color:#b8b5aa;max-width:220px;}
.style-cursor .cu-wall-note{font-size:13px;line-height:1.55;color:#807d72;margin:0;}

/* tasks */
.style-cursor .cu-task-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:32px;}
.style-cursor .cu-task-card{background:#26251e;border:1px solid #3a382d;border-radius:12px;padding:24px;display:flex;flex-direction:column;gap:14px;}
.style-cursor .cu-task-hot{border-color:#f54e00;}
.style-cursor .cu-task-top{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;}
.style-cursor .cu-task-desc{font-size:14px;line-height:1.5;color:#b8b5aa;margin:0;flex:1;}

/* closed-loop */
.style-cursor .cu-loop-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
.style-cursor .cu-loop-card{background:#26251e;border:1px solid #3a382d;border-radius:12px;padding:24px;}
.style-cursor .cu-loop-title{font-size:16px;font-weight:600;color:#f7f7f4;margin:0;display:flex;align-items:center;gap:10px;}
.style-cursor .cu-loop-yes{font-family:'JetBrains Mono',ui-monospace,monospace;color:#9fc9a2;}
.style-cursor .cu-loop-no{font-family:'JetBrains Mono',ui-monospace,monospace;color:#f54e00;}
.style-cursor .cu-loop-list{margin:14px 0 0;padding:0;list-style:none;}
.style-cursor .cu-loop-list li{font-size:14px;line-height:1.5;color:#b8b5aa;padding:10px 0;border-top:1px solid #3a382d;}

/* failure modes */
.style-cursor .cu-fail-card{background:#26251e;border:1px solid #3a382d;border-radius:12px;padding:8px 24px;margin-top:32px;}
.style-cursor .cu-fail-row{padding:18px 0;border-bottom:1px solid #3a382d;}
.style-cursor .cu-fail-row:last-of-type{border-bottom:none;}
.style-cursor .cu-fail-name{font-size:16px;font-weight:600;color:#f7f7f4;}
.style-cursor .cu-fail-desc{font-size:13px;color:#807d72;margin:4px 0 0;}
.style-cursor .cu-fail-note{font-size:13px;line-height:1.6;color:#b8b5aa;margin:0;padding:20px 0;
  border-top:1px solid #3a382d;}

/* methodology */
.style-cursor .cu-method-grid{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:start;}
.style-cursor .cu-method-list{margin:24px 0 0;padding:0;list-style:none;}
.style-cursor .cu-method-list li{font-size:15px;line-height:1.5;color:#b8b5aa;padding:13px 0 13px 22px;position:relative;border-bottom:1px solid #3a382d;}
.style-cursor .cu-method-list li::before{content:'';position:absolute;left:0;top:20px;width:8px;height:8px;border-radius:50%;background:#f54e00;}
.style-cursor .cu-eyebrow-gap{margin-top:32px;}
.style-cursor .cu-axes-list{margin:0;padding:0;list-style:none;display:grid;grid-template-columns:1fr 1fr;gap:8px;}
.style-cursor .cu-axes-list li{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:12px;color:#b8b5aa;
  background:#1c1b15;border:1px solid #3a382d;border-radius:6px;padding:8px 12px;}
.style-cursor .cu-formulas{display:flex;flex-direction:column;gap:8px;margin-top:20px;}
.style-cursor .cu-formula{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:13px;color:#f54e00;
  background:#1c1b15;border:1px solid #3a382d;border-radius:6px;padding:10px 14px;}
.style-cursor .cu-code-block{background:#26251e;border:1px solid #3a382d;border-radius:12px;overflow:hidden;}
.style-cursor .cu-code-head{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:12px;color:#807d72;
  padding:12px 16px;border-bottom:1px solid #3a382d;}
.style-cursor .cu-bibtex{margin:0;padding:20px;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:13px;
  line-height:1.6;color:#c9c6bb;overflow-x:auto;white-space:pre;}

/* cta + footer */
.style-cursor .cu-cta{text-align:center;padding-top:48px;padding-bottom:16px;}
.style-cursor .cu-cta-title{font-size:36px;font-weight:400;letter-spacing:-0.72px;margin:0 0 28px;color:#f7f7f4;}
.style-cursor .cu-footer{margin-top:80px;border-top:1px solid #3a382d;padding:48px 0;}
.style-cursor .cu-footer-inner{display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap;}
.style-cursor .cu-footer-note{font-size:14px;color:#807d72;margin:0;}
.style-cursor .cu-footer-link{font-size:14px;font-weight:500;color:#807d72;}
.style-cursor .cu-footer-link:hover{color:#f7f7f4;}

@media (max-width:1024px){
  .style-cursor .cu-hero-grid{grid-template-columns:1fr;}
  .style-cursor .cu-stats-grid{grid-template-columns:repeat(3,1fr);}
  .style-cursor .cu-labstats{grid-template-columns:repeat(2,1fr);}
  .style-cursor .cu-dim-grid{grid-template-columns:repeat(2,1fr);}
  .style-cursor .cu-task-grid{grid-template-columns:repeat(2,1fr);}
  .style-cursor .cu-loop-grid{grid-template-columns:1fr;}
  .style-cursor .cu-charts-grid{grid-template-columns:1fr;}
  .style-cursor .cu-method-grid{grid-template-columns:1fr;}
  .style-cursor .cu-nav-links{display:none;}
  .style-cursor .cu-pipe-arrow{display:none;}
}
@media (max-width:640px){
  .style-cursor .cu-wrap{padding:0 20px;}
  .style-cursor .cu-h1{font-size:32px;letter-spacing:-0.9px;}
  .style-cursor .cu-stats-grid{grid-template-columns:repeat(2,1fr);}
  .style-cursor .cu-labstats{grid-template-columns:1fr;}
  .style-cursor .cu-dim-grid,.style-cursor .cu-task-grid{grid-template-columns:1fr;}
  .style-cursor .cu-bar-row{grid-template-columns:130px 1fr 48px;}
  .style-cursor .cu-ide-body{grid-template-columns:1fr;}
  .style-cursor .cu-ide-sidebar,.style-cursor .cu-ide-agent{display:none;}
  .style-cursor .cu-band{padding-top:56px;}
  .style-cursor .cu-hero{padding:56px 0;}
  .style-cursor .cu-cta-title{font-size:26px;}
}
`
