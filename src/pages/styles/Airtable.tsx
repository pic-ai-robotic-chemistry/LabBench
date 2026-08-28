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
  if (v === bestN10) return 'at-num at-best'
  if (v === secondN10) return 'at-num at-second'
  return 'at-num'
}

function stageClass(stage: string) {
  if (stage === pathwayStages[0]) return 'at-pipe-design'
  if (stage === pathwayStages[1]) return 'at-pipe-validation'
  return 'at-pipe-boundary'
}

const DIM_SURFACES = ['#fcab79', '#a8d8c4', '#f4d35e', '#f5e9d4']
const wallUnder = longHorizon.totalExecutable - longHorizon.over30Ops

export default function Airtable() {
  return (
    <div className="style-airtable">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
      />
      <style>{CSS}</style>

      {/* ============ NAV ============ */}
      <header className="at-nav">
        <div className="at-wrap at-nav-inner">
          <div className="at-nav-left">
            <span className="at-logo">
              <span className="at-logo-dot" />
              RoboChem Bench
            </span>
            <nav className="at-nav-links">
              <a href="#at-framework">Skills</a>
              <a href="#at-leaderboard">Leaderboard</a>
              <a href="#at-charts">Analysis</a>
              <a href="#at-tasks">Tasks</a>
            </nav>
          </div>
          <div className="at-nav-right">
            <Link to="/" className="at-nav-back">
              ← Back to Gallery
            </Link>
            <a href="#" className="at-btn at-btn-primary">
              Submit Your Agent
            </a>
          </div>
        </div>
      </header>

      {/* ============ HERO (white, calm) ============ */}
      <section className="at-hero">
        <div className="at-wrap at-hero-inner">
          <p className="at-eyebrow">Benchmark paper · arXiv:2607.23045</p>
          <h1 className="at-h1">{paperMeta.title}</h1>
          <p className="at-sub">{paperMeta.subtitle}</p>
          <p className="at-authors">
            {paperMeta.authors.join(', ')}
            <br />
            {paperMeta.affiliation}
          </p>
          <div className="at-btn-row">
            <a href={paperMeta.links[0].href} className="at-btn at-btn-primary">
              {paperMeta.links[0].label}
            </a>
            <a href={paperMeta.links[1].href} className="at-btn at-btn-secondary">
              {paperMeta.links[1].label}
            </a>
            <a href={paperMeta.links[2].href} className="at-btn at-btn-secondary">
              {paperMeta.links[2].label}
            </a>
            <a href={paperMeta.links[3].href} className="at-text-link">
              {paperMeta.links[3].label} →
            </a>
          </div>
        </div>
      </section>

      {/* ============ STATS (cream callout band) ============ */}
      <section className="at-band">
        <div className="at-wrap">
          <div className="at-stats-card">
            {keyStats.map((s) => (
              <div key={s.label} className="at-stat">
                <div className="at-stat-value">{s.value}</div>
                <div className="at-stat-label">{s.label}</div>
                <div className="at-stat-desc">{s.description}</div>
              </div>
            ))}
          </div>
          <div className="at-labstats">
            {labStats.map((s) => (
              <div key={s.label} className="at-labstat">
                <div className="at-labstat-value">{s.value}</div>
                <div className="at-labstat-label">{s.label}</div>
                <div className="at-labstat-desc">{s.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ ABSTRACT ============ */}
      <section className="at-band">
        <div className="at-wrap at-narrow">
          <p className="at-eyebrow">Abstract</p>
          <p className="at-abstract">{abstractText}</p>
        </div>
      </section>

      {/* ============ SKILLS LIBRARY (pastel demo-grid cards) ============ */}
      <section className="at-band" id="at-framework">
        <div className="at-wrap">
          <p className="at-eyebrow">The Skills Library</p>
          <h2 className="at-h2">45 workstations, one skills library</h2>
          <div className="at-dim-grid">
            {skillCategories.map((d, i) => (
              <div
                key={d.name}
                className="at-dim-card"
                style={{ background: DIM_SURFACES[i] }}
              >
                <div className="at-dim-index">Category {i + 1}</div>
                <h3 className="at-dim-name">{d.name}</h3>
                <p className="at-dim-tagline">{d.tagline}</p>
                <ul className="at-dim-list">
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
      <section className="at-band">
        <div className="at-wrap">
          <p className="at-eyebrow">Evaluation pathway</p>
          <h2 className="at-h2">From task receipt to physical execution</h2>
          <div className="at-pipeline">
            {pathway.map((n, i) => (
              <Fragment key={n.node}>
                {i > 0 && <span className="at-pipe-arrow">→</span>}
                <div
                  className={`at-pipe-node ${stageClass(n.stage)}${n.node === 'N10' ? ' at-pipe-final' : ''}`}
                >
                  <span className="at-pipe-id">{n.node}</span>
                  <span className="at-pipe-label">{n.label}</span>
                </div>
              </Fragment>
            ))}
          </div>
          <div className="at-pipe-legend">
            {pathwayStages.map((stage) => (
              <span key={stage} className="at-legend-item">
                <span className={`at-pipe-swatch ${stageClass(stage)}`} />
                {stage}
              </span>
            ))}
          </div>
          <p className="at-pipe-note">{pathwayNote}</p>
        </div>
      </section>

      {/* ============ LEADERBOARD ============ */}
      <section className="at-band" id="at-leaderboard">
        <div className="at-wrap">
          <p className="at-eyebrow">Leaderboard</p>
          <h2 className="at-h2">Top 8 of 48 configurations, ranked by N10 executable yield</h2>
          <p className="at-note">
            N10 Yield is the expert-adjudicated executable rate (%). <strong>Bold</strong> marks the
            best configuration, <span className="at-second">underline</span> the runner-up.
          </p>
          <div className="at-table-card">
            <table className="at-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Configuration</th>
                  <th>Organization</th>
                  <th>Weights</th>
                  <th className="at-th-num">Trials</th>
                  <th className="at-th-num">Executable</th>
                  <th className="at-th-num">N10 Yield</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((r) => (
                  <tr key={r.rank}>
                    <td className="at-num at-muted">{r.rank}</td>
                    <td>
                      <a href="#" className="at-model">
                        {r.harness} × {r.model}
                      </a>
                    </td>
                    <td className="at-org">{r.org}</td>
                    <td>
                      <span className={r.weights === 'open' ? 'at-badge at-badge-open' : 'at-badge'}>
                        {r.weights === 'open' ? 'Open' : 'Closed'}
                      </span>
                    </td>
                    <td className="at-td-num">
                      <span className="at-num">{r.trials}</span>
                    </td>
                    <td className="at-td-num">
                      <span className="at-num">{r.executable}</span>
                    </td>
                    <td className="at-td-num">
                      <span className={n10Class(r.n10)}>{r.n10.toFixed(1)}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="at-table-caption">{leaderboardCaption}</p>
        </div>
      </section>

      {/* ============ CHARTS ============ */}
      <section className="at-band" id="at-charts">
        <div className="at-wrap">
          <p className="at-eyebrow">Analysis</p>
          <h2 className="at-h2">Results at a glance</h2>
          <div className="at-charts-grid">
            <div className="at-chart-card at-chart-wide">
              <h3 className="at-chart-title">N10 executable yield — top 8 configurations</h3>
              <div className="at-bars">
                {leaderboard.map((r) => (
                  <div key={r.rank} className="at-bar-row">
                    <span className="at-bar-label">
                      {r.harness} × {r.model}
                    </span>
                    <span className="at-bar-track">
                      <span
                        className={r.rank === 1 ? 'at-bar-fill at-bar-top' : 'at-bar-fill'}
                        style={{ width: `${(r.n10 / maxN10) * 100}%` }}
                      />
                    </span>
                    <span className="at-bar-value">{r.n10.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="at-chart-card">
              <h3 className="at-chart-title">The long-horizon wall</h3>
              <div className="at-wall-ratio">
                <span
                  className="at-wall-seg at-wall-under"
                  style={{ width: `${(wallUnder / longHorizon.totalExecutable) * 100}%` }}
                />
                <span
                  className="at-wall-seg at-wall-over"
                  style={{ width: `${(longHorizon.over30Ops / longHorizon.totalExecutable) * 100}%` }}
                />
              </div>
              <div className="at-wall-meta">
                <span>{wallUnder} executable workflows ≤ 30 ops</span>
                <span>{longHorizon.over30Ops} workflows &gt; 30 ops</span>
              </div>
              <div className="at-wall-big">
                <span className="at-wall-num">{longHorizon.longest}</span>
                <span className="at-wall-cap">operations in the longest executable workflow</span>
              </div>
              <p className="at-wall-note">{longHorizon.note}</p>
            </div>
            <div className="at-chart-card">
              <h3 className="at-chart-title">Open vs Closed — mean N10 yield</h3>
              <div className="at-grouped">
                {weightsAvg.map((row) => (
                  <div key={row.group} className="at-group">
                    <div className="at-group-bars">
                      <span
                        className={
                          row.group.startsWith('Closed') ? 'at-gbar at-gbar-closed' : 'at-gbar at-gbar-open'
                        }
                        style={{ height: `${(row.value / maxWeights) * 100}%` }}
                      >
                        <span className="at-gbar-tip">{row.value.toFixed(1)}%</span>
                      </span>
                    </div>
                    <span className="at-group-label">
                      {row.group.startsWith('Closed') ? 'Closed' : 'Open'} · n={row.n}
                    </span>
                  </div>
                ))}
              </div>
              <div className="at-legend">
                <span className="at-legend-item">
                  <span className="at-legend-swatch" style={{ background: '#0a2e0e' }} /> Open
                </span>
                <span className="at-legend-item">
                  <span className="at-legend-swatch" style={{ background: '#aa2d00' }} /> Closed
                </span>
              </div>
              <p className="at-chart-note">{weightsAvgCaption}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ TASK DOMAINS ============ */}
      <section className="at-band" id="at-tasks">
        <div className="at-wrap">
          <p className="at-eyebrow">Task domains</p>
          <h2 className="at-h2">32 research tasks across 4 catalysis domains</h2>
          <div className="at-task-grid">
            {taskDomains.map((t, i) => (
              <div key={t.domain} className={i === 0 ? 'at-task-card at-task-hot' : 'at-task-card'}>
                <div className="at-task-top">
                  <span className="at-badge at-badge-domain">{t.domain}</span>
                  {i === 0 && <span className="at-badge at-badge-open">Closed-loop</span>}
                </div>
                <p className="at-task-desc">{t.blurb}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CLOSED-LOOP ADAPTATION ============ */}
      <section className="at-band">
        <div className="at-wrap">
          <p className="at-eyebrow">Closed-loop adaptation</p>
          <h2 className="at-h2">Five rounds of feedback — local adjustments only</h2>
          <p className="at-note">
            Agent: {closedLoop.agent} · Task: {closedLoop.task} · {closedLoop.rounds} feedback rounds
          </p>
          <div className="at-loop-grid">
            <div className="at-loop-card at-loop-yes-card">
              <h3 className="at-loop-title">Localized adaptation observed</h3>
              <ul className="at-loop-list">
                {closedLoop.adapted.map((a) => (
                  <li key={a}>
                    <span className="at-loop-yes">✓</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
            <div className="at-loop-card at-loop-no-card">
              <h3 className="at-loop-title">Strategic redirection not observed</h3>
              <ul className="at-loop-list">
                {closedLoop.notObserved.map((a) => (
                  <li key={a}>
                    <span className="at-loop-no">✗</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FAILURE MODES (signature coral card) ============ */}
      <section className="at-band">
        <div className="at-wrap">
          <div className="at-coral-card">
            <p className="at-eyebrow at-eyebrow-on-coral">Failure analysis</p>
            <h2 className="at-h2 at-on-dark">How agents fail</h2>
            <div className="at-fail-grid">
              {failureModes.map((f) => (
                <div key={f.name} className="at-fail-row">
                  <div className="at-fail-head">
                    <span className="at-fail-name">{f.name}</span>
                  </div>
                  <p className="at-fail-desc">{f.description}</p>
                </div>
              ))}
            </div>
            <p className="at-fail-note">{failureNote}</p>
          </div>
        </div>
      </section>

      {/* ============ METHODOLOGY + BIBTEX ============ */}
      <section className="at-band">
        <div className="at-wrap at-method-grid">
          <div className="at-method-card">
            <p className="at-eyebrow">Methodology</p>
            <h2 className="at-h2">How we measured</h2>
            <ul className="at-method-list">
              {methodologyNotes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
            <p className="at-eyebrow at-eyebrow-gap">Scoring rubric — multi-axis R1–R6</p>
            <ul className="at-axes-list">
              {scoringAxes.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
            <div className="at-formulas">
              {formulas.map((f) => (
                <code key={f} className="at-formula">
                  {f}
                </code>
              ))}
            </div>
          </div>
          <div className="at-method-card">
            <p className="at-eyebrow">Cite this work</p>
            <pre className="at-bibtex">
              <code>{bibtex}</code>
            </pre>
          </div>
        </div>
      </section>

      {/* ============ DARK CTA CARD ============ */}
      <section className="at-band">
        <div className="at-wrap">
          <div className="at-dark-card">
            <h2 className="at-h2 at-on-dark">Think your agent can do science?</h2>
            <p className="at-dark-sub">
              Submit to the RoboChem Bench leaderboard — 4,608 trials, zero mercy.
            </p>
            <a href="#" className="at-btn at-btn-on-dark">
              Submit Your Agent
            </a>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="at-footer">
        <div className="at-wrap at-footer-inner">
          <span className="at-logo">
            <span className="at-logo-dot" />
            RoboChem Bench
          </span>
          <p className="at-footer-note">Style preview · Airtable DESIGN.md · Content from arXiv:2607.23045</p>
          <Link to="/" className="at-footer-link">
            ← Back to Gallery
          </Link>
        </div>
      </footer>
    </div>
  )
}

/* ---------- scoped styles ---------- */
const CSS = `
.style-airtable{
  background:#ffffff;color:#181d26;
  font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',sans-serif;
  min-height:100dvh;-webkit-font-smoothing:antialiased;
}
.style-airtable .at-wrap{max-width:1280px;margin:0 auto;padding:0 48px;}
.style-airtable .at-narrow{max-width:780px;}
.style-airtable .at-band{padding:96px 0 0;}
.style-airtable a{text-decoration:none;}

/* nav */
.style-airtable .at-nav{background:#ffffff;border-bottom:1px solid #dddddd;position:sticky;top:0;z-index:50;}
.style-airtable .at-nav-inner{height:64px;display:flex;align-items:center;justify-content:space-between;gap:24px;}
.style-airtable .at-nav-left{display:flex;align-items:center;gap:28px;min-width:0;}
.style-airtable .at-logo{display:inline-flex;align-items:center;gap:8px;font-size:16px;font-weight:500;color:#181d26;white-space:nowrap;}
.style-airtable .at-logo-dot{width:16px;height:16px;border-radius:5px;background:linear-gradient(135deg,#fcab79 0%,#aa2d00 100%);flex:none;}
.style-airtable .at-nav-links{display:flex;gap:24px;}
.style-airtable .at-nav-links a{color:#333840;font-size:14px;font-weight:400;}
.style-airtable .at-nav-links a:hover{color:#181d26;}
.style-airtable .at-nav-right{display:flex;align-items:center;gap:18px;flex:none;}
.style-airtable .at-nav-back{color:#41454d;font-size:14px;white-space:nowrap;}
.style-airtable .at-nav-back:hover{color:#181d26;}

/* buttons */
.style-airtable .at-btn{display:inline-flex;align-items:center;padding:16px 24px;border-radius:12px;
  font-size:16px;font-weight:500;line-height:1.4;cursor:pointer;white-space:nowrap;border:1px solid transparent;}
.style-airtable .at-btn-primary{background:#181d26;color:#ffffff;box-shadow:0 2px 8px rgba(27,97,201,.18);}
.style-airtable .at-btn-primary:hover{background:#0d1218;}
.style-airtable .at-btn-secondary{background:#ffffff;color:#181d26;border-color:#dddddd;}
.style-airtable .at-btn-on-dark{background:#ffffff;color:#181d26;}
.style-airtable .at-btn-row{display:flex;flex-wrap:wrap;align-items:center;gap:12px;margin-top:36px;}
.style-airtable .at-text-link{color:#1b61c9;font-size:16px;font-weight:500;padding:16px 8px;}

/* hero */
.style-airtable .at-hero{padding:96px 0;}
.style-airtable .at-hero-inner{max-width:840px;}
.style-airtable .at-eyebrow{font-size:14px;font-weight:500;letter-spacing:0.16px;color:#41454d;margin:0 0 16px;text-transform:uppercase;}
.style-airtable .at-h1{font-size:44px;font-weight:400;line-height:1.15;letter-spacing:0;margin:0 0 20px;color:#181d26;}
.style-airtable .at-sub{font-size:20px;font-weight:400;line-height:1.5;color:#333840;margin:0 0 18px;}
.style-airtable .at-authors{font-size:14px;line-height:1.6;color:#41454d;margin:0;}
.style-airtable .at-h2{font-size:32px;font-weight:400;line-height:1.2;margin:0 0 12px;color:#181d26;}
.style-airtable .at-on-dark{color:#ffffff;}
.style-airtable .at-note{font-size:14px;color:#41454d;margin:0 0 24px;}

/* stats cream band */
.style-airtable .at-stats-card{background:#f5e9d4;border-radius:10px;padding:40px 32px;
  display:grid;grid-template-columns:repeat(6,1fr);gap:24px;}
.style-airtable .at-stat-value{font-size:36px;font-weight:500;line-height:1.1;color:#181d26;letter-spacing:-0.5px;}
.style-airtable .at-stat-label{font-size:14px;font-weight:500;color:#181d26;margin-top:8px;}
.style-airtable .at-stat-desc{font-size:13px;color:#41454d;margin-top:2px;}

/* lab stats (secondary band) */
.style-airtable .at-labstats{background:#f5e9d4;border-radius:10px;margin-top:16px;padding:24px 32px;
  display:grid;grid-template-columns:repeat(4,1fr);gap:24px;}
.style-airtable .at-labstat-value{font-size:24px;font-weight:500;line-height:1.1;color:#aa2d00;letter-spacing:-0.5px;}
.style-airtable .at-labstat-label{font-size:13px;font-weight:500;color:#181d26;margin-top:6px;}
.style-airtable .at-labstat-desc{font-size:12px;color:#41454d;margin-top:2px;}

/* abstract */
.style-airtable .at-abstract{font-size:22px;line-height:1.55;color:#181d26;margin:0;font-weight:400;}

/* dimensions */
.style-airtable .at-dim-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;margin-top:32px;}
.style-airtable .at-dim-card{border-radius:10px;padding:24px;color:#181d26;}
.style-airtable .at-dim-index{font-size:13px;font-weight:500;letter-spacing:0.16px;text-transform:uppercase;opacity:.65;margin-bottom:14px;}
.style-airtable .at-dim-name{font-size:20px;font-weight:500;line-height:1.4;margin:0 0 6px;}
.style-airtable .at-dim-tagline{font-size:13px;opacity:.7;margin:0 0 16px;}
.style-airtable .at-dim-list{margin:0;padding:0;list-style:none;}
.style-airtable .at-dim-list li{font-size:14px;line-height:1.45;padding:9px 0 9px 18px;position:relative;border-top:1px solid rgba(24,29,38,.16);}
.style-airtable .at-dim-list li::before{content:'';position:absolute;left:0;top:15px;width:7px;height:7px;border-radius:2px;background:#181d26;opacity:.7;}

/* pathway pipeline */
.style-airtable .at-pipeline{display:flex;flex-wrap:wrap;align-items:stretch;gap:10px;margin-top:32px;}
.style-airtable .at-pipe-node{background:#ffffff;border:1px solid #dddddd;border-top:3px solid #1b61c9;
  border-radius:10px;padding:14px 16px;flex:1;min-width:140px;display:flex;flex-direction:column;gap:6px;}
.style-airtable .at-pipe-node.at-pipe-validation{border-top-color:#aa2d00;}
.style-airtable .at-pipe-node.at-pipe-boundary{border-top-color:#0a2e0e;}
.style-airtable .at-pipe-id{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:12px;font-weight:500;color:#1b61c9;}
.style-airtable .at-pipe-validation .at-pipe-id{color:#aa2d00;}
.style-airtable .at-pipe-boundary .at-pipe-id{color:#0a2e0e;}
.style-airtable .at-pipe-label{font-size:13px;line-height:1.45;color:#333840;}
.style-airtable .at-pipe-arrow{display:flex;align-items:center;color:#9297a0;font-size:18px;flex:none;}
.style-airtable .at-pipe-final{background:#aa2d00;border-color:#aa2d00;}
.style-airtable .at-pipe-final .at-pipe-id{color:#f4d35e;}
.style-airtable .at-pipe-final .at-pipe-label{color:#ffffff;font-weight:500;}
.style-airtable .at-pipe-legend{display:flex;flex-wrap:wrap;gap:18px;margin-top:18px;}
.style-airtable .at-pipe-swatch{width:10px;height:10px;border-radius:3px;display:inline-block;background:#1b61c9;}
.style-airtable .at-pipe-swatch.at-pipe-validation{background:#aa2d00;}
.style-airtable .at-pipe-swatch.at-pipe-boundary{background:#0a2e0e;}
.style-airtable .at-pipe-note{font-size:13px;line-height:1.6;color:#41454d;margin:18px 0 0;max-width:860px;}

/* leaderboard */
.style-airtable .at-table-card{background:#ffffff;border:1px solid #dddddd;border-radius:10px;overflow:auto;}
.style-airtable .at-table{width:100%;border-collapse:collapse;min-width:880px;}
.style-airtable .at-table th{font-size:13px;font-weight:500;letter-spacing:0.16px;text-transform:uppercase;color:#41454d;
  text-align:left;padding:14px 16px;border-bottom:1px solid #dddddd;background:#f8fafc;white-space:nowrap;}
.style-airtable .at-table td{padding:12px 16px;border-bottom:1px solid #dddddd;font-size:14px;color:#333840;white-space:nowrap;}
.style-airtable .at-table tbody tr:last-child td{border-bottom:none;}
.style-airtable .at-table tbody tr:hover td{background:#f8fafc;}
.style-airtable .at-th-num,.style-airtable .at-td-num{text-align:right;}
.style-airtable .at-model{color:#1b61c9;font-weight:500;}
.style-airtable .at-org{color:#41454d;font-size:13px;}
.style-airtable .at-num{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:13px;}
.style-airtable .at-best{font-weight:600;color:#181d26;}
.style-airtable .at-second{text-decoration:underline;text-underline-offset:3px;}
.style-airtable .at-muted{color:#9297a0;}
.style-airtable .at-badge{display:inline-block;background:#e0e2e6;color:#181d26;font-size:13px;font-weight:500;padding:3px 10px;border-radius:6px;}
.style-airtable .at-badge-open{background:#a8d8c4;}
.style-airtable .at-badge-domain{background:#f5e9d4;}
.style-airtable .at-table-caption{font-size:13px;color:#41454d;margin:14px 0 0;}

/* charts */
.style-airtable .at-charts-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:32px;}
.style-airtable .at-chart-card{background:#ffffff;border:1px solid #dddddd;border-radius:10px;padding:24px;}
.style-airtable .at-chart-wide{grid-column:1 / -1;}
.style-airtable .at-chart-title{font-size:18px;font-weight:500;color:#181d26;margin:0 0 20px;}
.style-airtable .at-chart-note{font-size:12px;color:#41454d;margin:14px 0 0;text-align:center;}
.style-airtable .at-bars{display:flex;flex-direction:column;gap:9px;}
.style-airtable .at-bar-row{display:grid;grid-template-columns:240px 1fr 56px;gap:12px;align-items:center;}
.style-airtable .at-bar-label{font-size:13px;color:#333840;text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.style-airtable .at-bar-track{display:block;height:14px;background:#f8fafc;border-radius:6px;overflow:hidden;}
.style-airtable .at-bar-fill{display:block;height:100%;background:#9297a0;border-radius:6px;}
.style-airtable .at-bar-top{background:#aa2d00;}
.style-airtable .at-bar-value{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:12px;color:#41454d;}
.style-airtable .at-legend{display:flex;flex-wrap:wrap;gap:14px;margin-top:16px;justify-content:center;}
.style-airtable .at-legend-item{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:500;color:#41454d;}
.style-airtable .at-legend-swatch{width:10px;height:10px;border-radius:3px;display:inline-block;}
.style-airtable .at-grouped{display:flex;justify-content:space-around;align-items:flex-end;height:240px;margin-top:8px;}
.style-airtable .at-group{display:flex;flex-direction:column;align-items:center;gap:10px;height:100%;justify-content:flex-end;}
.style-airtable .at-group-bars{display:flex;align-items:flex-end;gap:8px;height:200px;}
.style-airtable .at-gbar{position:relative;display:block;width:52px;border-radius:6px 6px 0 0;}
.style-airtable .at-gbar-open{background:#0a2e0e;}
.style-airtable .at-gbar-closed{background:#aa2d00;}
.style-airtable .at-gbar-tip{position:absolute;top:-20px;left:50%;transform:translateX(-50%);
  font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;color:#41454d;white-space:nowrap;}
.style-airtable .at-group-label{font-size:12px;font-weight:500;letter-spacing:0.16px;text-transform:uppercase;color:#41454d;}

/* long-horizon wall */
.style-airtable .at-wall-ratio{display:flex;height:22px;border-radius:6px;overflow:hidden;background:#f8fafc;}
.style-airtable .at-wall-seg{display:block;height:100%;}
.style-airtable .at-wall-under{background:#9297a0;}
.style-airtable .at-wall-over{background:#aa2d00;min-width:10px;}
.style-airtable .at-wall-meta{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;
  font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;color:#41454d;margin-top:10px;}
.style-airtable .at-wall-big{display:flex;align-items:baseline;gap:16px;margin:30px 0 14px;}
.style-airtable .at-wall-num{font-size:72px;font-weight:500;line-height:1;letter-spacing:-2px;color:#aa2d00;}
.style-airtable .at-wall-cap{font-size:14px;line-height:1.4;color:#333840;max-width:220px;}
.style-airtable .at-wall-note{font-size:13px;line-height:1.55;color:#41454d;margin:0;}

/* tasks */
.style-airtable .at-task-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;margin-top:32px;}
.style-airtable .at-task-card{background:#ffffff;border:1px solid #dddddd;border-radius:10px;padding:16px;display:flex;flex-direction:column;gap:14px;}
.style-airtable .at-task-hot{border-color:#aa2d00;box-shadow:0 2px 10px rgba(170,45,0,.12);}
.style-airtable .at-task-top{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;}
.style-airtable .at-task-desc{font-size:14px;line-height:1.5;color:#333840;margin:0;flex:1;}

/* closed-loop */
.style-airtable .at-loop-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;}
.style-airtable .at-loop-card{border-radius:10px;padding:28px;border:1px solid #dddddd;background:#ffffff;}
.style-airtable .at-loop-yes-card{background:#edf7f2;border-color:#a8d8c4;}
.style-airtable .at-loop-no-card{background:#fafafa;}
.style-airtable .at-loop-title{font-size:18px;font-weight:500;color:#181d26;margin:0;}
.style-airtable .at-loop-list{margin:14px 0 0;padding:0;list-style:none;}
.style-airtable .at-loop-list li{font-size:14px;line-height:1.5;color:#333840;padding:10px 0;border-top:1px solid rgba(24,29,38,.12);}
.style-airtable .at-loop-yes{font-family:'JetBrains Mono',ui-monospace,monospace;font-weight:600;color:#0a2e0e;margin-right:10px;}
.style-airtable .at-loop-no{font-family:'JetBrains Mono',ui-monospace,monospace;font-weight:600;color:#aa2d00;margin-right:10px;}

/* failure modes on coral */
.style-airtable .at-coral-card{background:#aa2d00;color:#ffffff;border-radius:12px;padding:48px;}
.style-airtable .at-eyebrow-on-coral{color:#fcab79;}
.style-airtable .at-fail-grid{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-top:24px;}
.style-airtable .at-fail-head{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px;}
.style-airtable .at-fail-name{font-size:18px;font-weight:500;color:#ffffff;}
.style-airtable .at-fail-desc{font-size:14px;line-height:1.45;color:rgba(255,255,255,.82);margin:0;}
.style-airtable .at-fail-note{font-size:14px;line-height:1.6;color:#f4d35e;margin:32px 0 0;
  padding-top:24px;border-top:1px solid rgba(255,255,255,.25);}

/* methodology */
.style-airtable .at-method-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;align-items:stretch;}
.style-airtable .at-method-card{background:#f8fafc;border-radius:12px;padding:32px;}
.style-airtable .at-method-list{margin:20px 0 0;padding:0;list-style:none;}
.style-airtable .at-method-list li{font-size:14px;line-height:1.5;color:#333840;padding:12px 0 12px 22px;position:relative;border-bottom:1px solid #dddddd;}
.style-airtable .at-method-list li::before{content:'';position:absolute;left:0;top:18px;width:8px;height:8px;border-radius:2px;background:#aa2d00;}
.style-airtable .at-eyebrow-gap{margin-top:32px;}
.style-airtable .at-axes-list{margin:0;padding:0;list-style:none;display:grid;grid-template-columns:1fr 1fr;gap:8px;}
.style-airtable .at-axes-list li{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:12px;color:#333840;
  background:#ffffff;border:1px solid #dddddd;border-radius:6px;padding:8px 12px;}
.style-airtable .at-formulas{display:flex;flex-direction:column;gap:8px;margin-top:20px;}
.style-airtable .at-formula{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:13px;color:#aa2d00;
  background:#ffffff;border:1px solid #dddddd;border-radius:6px;padding:10px 14px;}
.style-airtable .at-bibtex{margin:16px 0 0;background:#181d26;color:#f5e9d4;border-radius:10px;padding:20px;
  font-family:'JetBrains Mono',ui-monospace,monospace;font-size:13px;line-height:1.6;overflow-x:auto;white-space:pre;}

/* dark cta */
.style-airtable .at-dark-card{background:#181d26;color:#ffffff;border-radius:12px;padding:48px;}
.style-airtable .at-dark-sub{font-size:16px;color:rgba(255,255,255,.75);margin:0 0 24px;}

/* footer */
.style-airtable .at-footer{margin-top:96px;border-top:1px solid #dddddd;padding:64px 0;background:#ffffff;}
.style-airtable .at-footer-inner{display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap;}
.style-airtable .at-footer-note{font-size:14px;color:#41454d;margin:0;}
.style-airtable .at-footer-link{font-size:14px;color:#41454d;}
.style-airtable .at-footer-link:hover{color:#1b61c9;}

@media (max-width:1024px){
  .style-airtable .at-stats-card{grid-template-columns:repeat(3,1fr);}
  .style-airtable .at-labstats{grid-template-columns:repeat(2,1fr);}
  .style-airtable .at-dim-grid{grid-template-columns:repeat(2,1fr);}
  .style-airtable .at-task-grid{grid-template-columns:repeat(2,1fr);}
  .style-airtable .at-loop-grid{grid-template-columns:1fr;}
  .style-airtable .at-charts-grid{grid-template-columns:1fr;}
  .style-airtable .at-method-grid{grid-template-columns:1fr;}
  .style-airtable .at-fail-grid{grid-template-columns:1fr;}
  .style-airtable .at-nav-links{display:none;}
  .style-airtable .at-pipe-arrow{display:none;}
}
@media (max-width:640px){
  .style-airtable .at-wrap{padding:0 20px;}
  .style-airtable .at-h1{font-size:30px;}
  .style-airtable .at-stats-card{grid-template-columns:repeat(2,1fr);padding:28px 20px;}
  .style-airtable .at-labstats{grid-template-columns:repeat(2,1fr);padding:20px;}
  .style-airtable .at-dim-grid,.style-airtable .at-task-grid{grid-template-columns:1fr;}
  .style-airtable .at-bar-row{grid-template-columns:130px 1fr 48px;}
  .style-airtable .at-coral-card,.style-airtable .at-dark-card{padding:32px 24px;}
  .style-airtable .at-band{padding-top:64px;}
  .style-airtable .at-hero{padding:64px 0;}
  .style-airtable .at-btn{padding:12px 18px;font-size:14px;}
}
`
