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
  if (v === bestN10) return 'ch-num ch-best'
  if (v === secondN10) return 'ch-num ch-second'
  return 'ch-num'
}

function stageClass(stage: string) {
  if (stage === pathwayStages[0]) return 'ch-pipe-design'
  if (stage === pathwayStages[1]) return 'ch-pipe-validation'
  return 'ch-pipe-boundary'
}

const wallUnder = longHorizon.totalExecutable - longHorizon.over30Ops

export default function Clickhouse() {
  return (
    <div className="style-clickhouse">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
      />
      <style>{CSS}</style>

      {/* ============ NAV ============ */}
      <header className="ch-nav">
        <div className="ch-wrap ch-nav-inner">
          <div className="ch-nav-left">
            <span className="ch-logo-mark" />
            <span className="ch-wordmark">
              RoboChem<strong>Bench</strong>
            </span>
            <nav className="ch-nav-links">
              <a href="#ch-framework">Skills</a>
              <a href="#ch-leaderboard">Leaderboard</a>
              <a href="#ch-charts">Analysis</a>
              <a href="#ch-tasks">Tasks</a>
            </nav>
          </div>
          <div className="ch-nav-right">
            <Link to="/" className="ch-nav-back">
              ← Back to Gallery
            </Link>
            <a href="#" className="ch-btn ch-btn-primary ch-btn-sm">
              Submit Your Agent
            </a>
          </div>
        </div>
      </header>

      {/* ============ HERO ============ */}
      <section className="ch-hero">
        <div className="ch-wrap ch-hero-grid">
          <div>
            <p className="ch-eyebrow">Benchmark paper · arXiv:2607.23045</p>
            <h1 className="ch-h1">{paperMeta.title}</h1>
            <p className="ch-sub">{paperMeta.subtitle}</p>
            <p className="ch-authors">
              {paperMeta.authors.join(', ')}
              <br />
              {paperMeta.affiliation}
            </p>
            <div className="ch-btn-row">
              <a href={paperMeta.links[0].href} className="ch-btn ch-btn-primary">
                {paperMeta.links[0].label}
              </a>
              <a href={paperMeta.links[1].href} className="ch-btn ch-btn-secondary">
                {paperMeta.links[1].label}
              </a>
              <a href={paperMeta.links[2].href} className="ch-btn ch-btn-secondary">
                {paperMeta.links[2].label}
              </a>
              <a href={paperMeta.links[3].href} className="ch-btn ch-btn-text">
                {paperMeta.links[3].label} →
              </a>
            </div>
          </div>
          <div className="ch-code-window">
            <div className="ch-code-head">
              <span className="ch-code-dot" />
              <span className="ch-code-dot" />
              <span className="ch-code-dot" />
              <span className="ch-code-title">leaderboard.sql</span>
            </div>
            <pre className="ch-code-body">
              <code>
                <span className="ch-tok-k">SELECT</span> harness, model, n10{'\n'}
                <span className="ch-tok-k">FROM</span> robochem.leaderboard{'\n'}
                <span className="ch-tok-k">WHERE</span> weights = <span className="ch-tok-s">'closed'</span>
                {'\n'}
                <span className="ch-tok-k">ORDER BY</span> n10 <span className="ch-tok-k">DESC</span>
                {'\n'}
                <span className="ch-tok-k">LIMIT</span> <span className="ch-tok-n">8</span>;{'\n\n'}
                <span className="ch-tok-c">-- 8 rows in set. Elapsed: 0.003 sec.</span>
              </code>
            </pre>
            <div className="ch-code-status">
              <span className="ch-status-dot" /> 45 workstations online · 4,608 trials indexed
            </div>
          </div>
        </div>
      </section>

      {/* ============ STATS ============ */}
      <section className="ch-stats">
        <div className="ch-wrap ch-stats-grid">
          {keyStats.map((s) => (
            <div key={s.label} className="ch-stat">
              <div className="ch-stat-value">{s.value}</div>
              <div className="ch-stat-label">{s.label}</div>
              <div className="ch-stat-desc">{s.description}</div>
            </div>
          ))}
        </div>
        <div className="ch-wrap ch-labstats">
          {labStats.map((s) => (
            <div key={s.label} className="ch-labstat">
              <div className="ch-labstat-value">{s.value}</div>
              <div className="ch-labstat-label">{s.label}</div>
              <div className="ch-labstat-desc">{s.description}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ ABSTRACT ============ */}
      <section className="ch-section">
        <div className="ch-wrap ch-narrow">
          <p className="ch-eyebrow">Abstract</p>
          <p className="ch-abstract">{abstractText}</p>
        </div>
      </section>

      {/* ============ SKILLS LIBRARY ============ */}
      <section className="ch-section" id="ch-framework">
        <div className="ch-wrap">
          <p className="ch-eyebrow">The Skills Library</p>
          <h2 className="ch-h2">45 workstations, one skills library</h2>
          <div className="ch-dim-grid">
            {skillCategories.map((d, i) => (
              <div key={d.name} className={i === 0 ? 'ch-dim-card ch-dim-yellow' : 'ch-dim-card'}>
                <div className="ch-dim-index">0{i + 1}</div>
                <h3 className="ch-dim-name">{d.name}</h3>
                <p className="ch-dim-tagline">{d.tagline}</p>
                <ul className="ch-dim-list">
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
      <section className="ch-section">
        <div className="ch-wrap">
          <p className="ch-eyebrow">Evaluation pathway</p>
          <h2 className="ch-h2">From task receipt to physical execution</h2>
          <div className="ch-pipeline">
            {pathway.map((n, i) => (
              <Fragment key={n.node}>
                {i > 0 && <span className="ch-pipe-arrow">→</span>}
                <div
                  className={`ch-pipe-node ${stageClass(n.stage)}${n.node === 'N10' ? ' ch-pipe-final' : ''}`}
                >
                  <span className="ch-pipe-id">{n.node}</span>
                  <span className="ch-pipe-label">{n.label}</span>
                </div>
              </Fragment>
            ))}
          </div>
          <div className="ch-pipe-legend">
            {pathwayStages.map((stage) => (
              <span key={stage} className="ch-legend-item">
                <span className={`ch-pipe-swatch ${stageClass(stage)}`} />
                {stage}
              </span>
            ))}
          </div>
          <p className="ch-pipe-note">{pathwayNote}</p>
        </div>
      </section>

      {/* ============ LEADERBOARD ============ */}
      <section className="ch-section" id="ch-leaderboard">
        <div className="ch-wrap">
          <p className="ch-eyebrow">Leaderboard</p>
          <h2 className="ch-h2">Top 8 of 48 configurations, ranked by N10 executable yield</h2>
          <p className="ch-section-note">
            N10 Yield is the expert-adjudicated executable rate (%).{' '}
            <span className="ch-best">Bold</span> marks the best configuration,{' '}
            <span className="ch-second">underline</span> the runner-up.
          </p>
          <div className="ch-table-card">
            <table className="ch-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Configuration</th>
                  <th>Organization</th>
                  <th>Weights</th>
                  <th className="ch-th-num">Trials</th>
                  <th className="ch-th-num">Executable</th>
                  <th className="ch-th-num">N10 Yield</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((r) => (
                  <tr key={r.rank}>
                    <td className="ch-num ch-muted">{r.rank}</td>
                    <td className="ch-model">
                      {r.harness} × {r.model}
                    </td>
                    <td className="ch-org">{r.org}</td>
                    <td>
                      <span className={r.weights === 'open' ? 'ch-badge ch-badge-open' : 'ch-badge'}>
                        {r.weights === 'open' ? 'Open' : 'Closed'}
                      </span>
                    </td>
                    <td className="ch-td-num">
                      <span className="ch-num">{r.trials}</span>
                    </td>
                    <td className="ch-td-num">
                      <span className="ch-num">{r.executable}</span>
                    </td>
                    <td className="ch-td-num">
                      <span className={n10Class(r.n10)}>{r.n10.toFixed(1)}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="ch-table-caption">{leaderboardCaption}</p>
        </div>
      </section>

      {/* ============ CHARTS ============ */}
      <section className="ch-section" id="ch-charts">
        <div className="ch-wrap">
          <p className="ch-eyebrow">Analysis</p>
          <h2 className="ch-h2">Results at a glance</h2>
          <div className="ch-charts-grid">
            <div className="ch-chart-card ch-chart-wide">
              <h3 className="ch-chart-title">N10 executable yield — top 8 configurations</h3>
              <div className="ch-bars">
                {leaderboard.map((r) => (
                  <div key={r.rank} className="ch-bar-row">
                    <span className="ch-bar-label">
                      {r.harness} × {r.model}
                    </span>
                    <span className="ch-bar-track">
                      <span
                        className={r.rank === 1 ? 'ch-bar-fill ch-bar-top' : 'ch-bar-fill'}
                        style={{ width: `${(r.n10 / maxN10) * 100}%` }}
                      />
                    </span>
                    <span className="ch-bar-value">{r.n10.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="ch-chart-card">
              <h3 className="ch-chart-title">The long-horizon wall</h3>
              <div className="ch-wall-ratio">
                <span
                  className="ch-wall-seg ch-wall-under"
                  style={{ width: `${(wallUnder / longHorizon.totalExecutable) * 100}%` }}
                />
                <span
                  className="ch-wall-seg ch-wall-over"
                  style={{ width: `${(longHorizon.over30Ops / longHorizon.totalExecutable) * 100}%` }}
                />
              </div>
              <div className="ch-wall-meta">
                <span>{wallUnder} executable workflows ≤ 30 ops</span>
                <span>{longHorizon.over30Ops} workflows &gt; 30 ops</span>
              </div>
              <div className="ch-wall-big">
                <span className="ch-wall-num">{longHorizon.longest}</span>
                <span className="ch-wall-cap">operations in the longest executable workflow</span>
              </div>
              <p className="ch-wall-note">{longHorizon.note}</p>
            </div>
            <div className="ch-chart-card">
              <h3 className="ch-chart-title">Open vs Closed — mean N10 yield</h3>
              <div className="ch-grouped">
                {weightsAvg.map((row) => (
                  <div key={row.group} className="ch-group">
                    <div className="ch-group-bars">
                      <span
                        className={
                          row.group.startsWith('Closed') ? 'ch-gbar ch-gbar-closed' : 'ch-gbar ch-gbar-open'
                        }
                        style={{ height: `${(row.value / maxWeights) * 100}%` }}
                      >
                        <span className="ch-gbar-tip">{row.value.toFixed(1)}%</span>
                      </span>
                    </div>
                    <span className="ch-group-label">
                      {row.group.startsWith('Closed') ? 'Closed' : 'Open'} · n={row.n}
                    </span>
                  </div>
                ))}
              </div>
              <div className="ch-legend">
                <span className="ch-legend-item">
                  <span className="ch-legend-swatch" style={{ background: '#5a5a5a' }} /> Open
                </span>
                <span className="ch-legend-item">
                  <span className="ch-legend-swatch" style={{ background: '#faff69' }} /> Closed
                </span>
              </div>
              <p className="ch-chart-note">{weightsAvgCaption}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ TASK DOMAINS ============ */}
      <section className="ch-section" id="ch-tasks">
        <div className="ch-wrap">
          <p className="ch-eyebrow">Task domains</p>
          <h2 className="ch-h2">32 research tasks across 4 catalysis domains</h2>
          <div className="ch-task-grid">
            {taskDomains.map((t, i) => (
              <div key={t.domain} className={i === 0 ? 'ch-task-card ch-task-hot' : 'ch-task-card'}>
                <div className="ch-task-top">
                  <span className="ch-badge">{t.domain}</span>
                  {i === 0 && <span className="ch-task-flag">Closed-loop</span>}
                </div>
                <p className="ch-task-desc">{t.blurb}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CLOSED-LOOP ADAPTATION ============ */}
      <section className="ch-section">
        <div className="ch-wrap">
          <p className="ch-eyebrow">Closed-loop adaptation</p>
          <h2 className="ch-h2">Five rounds of feedback — local adjustments only</h2>
          <p className="ch-section-note">
            Agent: {closedLoop.agent} · Task: {closedLoop.task} · {closedLoop.rounds} feedback rounds
          </p>
          <div className="ch-loop-grid">
            <div className="ch-loop-card">
              <h3 className="ch-loop-title">Localized adaptation observed</h3>
              <ul className="ch-loop-list">
                {closedLoop.adapted.map((a) => (
                  <li key={a}>
                    <span className="ch-loop-yes">✓</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
            <div className="ch-loop-card">
              <h3 className="ch-loop-title">Strategic redirection not observed</h3>
              <ul className="ch-loop-list">
                {closedLoop.notObserved.map((a) => (
                  <li key={a}>
                    <span className="ch-loop-no">✗</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FAILURE MODES ============ */}
      <section className="ch-section">
        <div className="ch-wrap">
          <p className="ch-eyebrow">Failure analysis</p>
          <h2 className="ch-h2">How agents fail</h2>
          <div className="ch-fail-card">
            {failureModes.map((f) => (
              <div key={f.name} className="ch-fail-row">
                <div className="ch-fail-head">
                  <span className="ch-fail-name">{f.name}</span>
                </div>
                <p className="ch-fail-desc">{f.description}</p>
              </div>
            ))}
            <p className="ch-fail-note">{failureNote}</p>
          </div>
        </div>
      </section>

      {/* ============ METHODOLOGY + BIBTEX ============ */}
      <section className="ch-section">
        <div className="ch-wrap ch-method-grid">
          <div>
            <p className="ch-eyebrow">Methodology</p>
            <h2 className="ch-h2">How we measured</h2>
            <ul className="ch-method-list">
              {methodologyNotes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
            <p className="ch-eyebrow ch-eyebrow-gap">Scoring rubric — multi-axis R1–R6</p>
            <ul className="ch-axes-list">
              {scoringAxes.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
            <div className="ch-formulas">
              {formulas.map((f) => (
                <code key={f} className="ch-formula">
                  {f}
                </code>
              ))}
            </div>
          </div>
          <div>
            <p className="ch-eyebrow">Cite this work</p>
            <div className="ch-code-window">
              <div className="ch-code-head">
                <span className="ch-code-dot" />
                <span className="ch-code-dot" />
                <span className="ch-code-dot" />
                <span className="ch-code-title">robochem.bib</span>
              </div>
              <pre className="ch-code-body">
                <code>{bibtex}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* ============ CTA BAND ============ */}
      <section className="ch-section">
        <div className="ch-wrap">
          <div className="ch-cta-band">
            <h2 className="ch-cta-title">Think your agent can do science?</h2>
            <p className="ch-cta-sub">
              Submit to the RoboChem Bench leaderboard — 4,608 trials, zero mercy.
            </p>
            <a href="#" className="ch-btn ch-btn-dark">
              Submit Your Agent
            </a>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer className="ch-footer">
        <div className="ch-wrap ch-footer-inner">
          <span className="ch-wordmark">
            RoboChem<strong>Bench</strong>
          </span>
          <p className="ch-footer-note">
            Style preview · ClickHouse DESIGN.md · Content from arXiv:2607.23045
          </p>
          <Link to="/" className="ch-footer-link">
            ← Back to Gallery
          </Link>
        </div>
      </footer>
    </div>
  )
}

/* ---------- scoped styles ---------- */
const CSS = `
.style-clickhouse{
  background:#0a0a0a;color:#ffffff;
  font-family:'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;
  min-height:100dvh;-webkit-font-smoothing:antialiased;
}
.style-clickhouse .ch-wrap{max-width:1280px;margin:0 auto;padding:0 32px;}
.style-clickhouse .ch-narrow{max-width:820px;}
.style-clickhouse .ch-section{padding:96px 0 0;}
.style-clickhouse a{text-decoration:none;}

/* nav */
.style-clickhouse .ch-nav{background:#0a0a0a;border-bottom:1px solid #2a2a2a;position:sticky;top:0;z-index:50;}
.style-clickhouse .ch-nav-inner{height:64px;display:flex;align-items:center;justify-content:space-between;gap:24px;}
.style-clickhouse .ch-nav-left{display:flex;align-items:center;gap:14px;min-width:0;}
.style-clickhouse .ch-logo-mark{width:18px;height:18px;background:#faff69;border-radius:4px;flex:none;}
.style-clickhouse .ch-wordmark{font-size:16px;font-weight:600;letter-spacing:-0.2px;white-space:nowrap;}
.style-clickhouse .ch-wordmark strong{color:#faff69;font-weight:700;}
.style-clickhouse .ch-nav-links{display:flex;gap:22px;margin-left:20px;}
.style-clickhouse .ch-nav-links a{color:#cccccc;font-size:14px;font-weight:500;}
.style-clickhouse .ch-nav-links a:hover{color:#faff69;}
.style-clickhouse .ch-nav-right{display:flex;align-items:center;gap:18px;flex:none;}
.style-clickhouse .ch-nav-back{color:#888888;font-size:14px;font-weight:500;white-space:nowrap;}
.style-clickhouse .ch-nav-back:hover{color:#faff69;}

/* buttons */
.style-clickhouse .ch-btn{display:inline-flex;align-items:center;height:40px;padding:12px 20px;border-radius:8px;
  font-size:14px;font-weight:600;line-height:1;border:none;cursor:pointer;white-space:nowrap;}
.style-clickhouse .ch-btn-primary{background:#faff69;color:#0a0a0a;}
.style-clickhouse .ch-btn-primary:hover{background:#e6eb52;}
.style-clickhouse .ch-btn-secondary{background:#1a1a1a;color:#ffffff;border:1px solid #2a2a2a;}
.style-clickhouse .ch-btn-text{background:transparent;color:#faff69;padding-left:4px;padding-right:4px;}
.style-clickhouse .ch-btn-dark{background:#0a0a0a;color:#faff69;}
.style-clickhouse .ch-btn-sm{height:36px;padding:10px 16px;}
.style-clickhouse .ch-btn-row{display:flex;flex-wrap:wrap;gap:12px;margin-top:32px;}

/* hero */
.style-clickhouse .ch-hero{padding:96px 0;}
.style-clickhouse .ch-hero-grid{display:grid;grid-template-columns:7fr 5fr;gap:48px;align-items:center;}
.style-clickhouse .ch-eyebrow{font-size:12px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:#faff69;margin:0 0 16px;}
.style-clickhouse .ch-h1{font-size:52px;font-weight:700;line-height:1.1;letter-spacing:-2px;margin:0 0 20px;color:#ffffff;}
.style-clickhouse .ch-sub{font-size:18px;font-weight:400;line-height:1.55;color:#cccccc;margin:0 0 16px;}
.style-clickhouse .ch-authors{font-size:13px;font-weight:500;line-height:1.5;color:#888888;margin:0;}
.style-clickhouse .ch-h2{font-size:32px;font-weight:700;line-height:1.2;letter-spacing:-1px;margin:0 0 12px;color:#ffffff;}
.style-clickhouse .ch-section-note{font-size:14px;color:#888888;margin:0 0 24px;}

/* code window */
.style-clickhouse .ch-code-window{background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;overflow:hidden;}
.style-clickhouse .ch-code-head{display:flex;align-items:center;gap:6px;padding:14px 16px;border-bottom:1px solid #2a2a2a;}
.style-clickhouse .ch-code-dot{width:10px;height:10px;border-radius:50%;background:#3a3a3a;}
.style-clickhouse .ch-code-title{margin-left:8px;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:12px;color:#888888;}
.style-clickhouse .ch-code-body{margin:0;padding:24px;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:14px;line-height:1.55;color:#cccccc;overflow-x:auto;}
.style-clickhouse .ch-tok-k{color:#3b82f6;}
.style-clickhouse .ch-tok-s{color:#faff69;}
.style-clickhouse .ch-tok-n{color:#22c55e;}
.style-clickhouse .ch-tok-c{color:#5a5a5a;}
.style-clickhouse .ch-code-status{display:flex;align-items:center;gap:8px;padding:12px 16px;border-top:1px solid #2a2a2a;
  font-size:13px;font-weight:500;color:#888888;}
.style-clickhouse .ch-status-dot{width:8px;height:8px;border-radius:50%;background:#22c55e;}

/* stats */
.style-clickhouse .ch-stats{padding:0 0 8px;}
.style-clickhouse .ch-stats-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:32px;}
.style-clickhouse .ch-stat-value{font-size:56px;font-weight:700;line-height:1;letter-spacing:-1.5px;color:#faff69;}
.style-clickhouse .ch-stat-label{font-size:14px;font-weight:600;color:#ffffff;margin-top:10px;}
.style-clickhouse .ch-stat-desc{font-size:13px;font-weight:500;color:#888888;margin-top:4px;}

/* lab stats (secondary band) */
.style-clickhouse .ch-labstats{display:grid;grid-template-columns:repeat(4,1fr);gap:32px;margin-top:48px;
  padding-top:32px;border-top:1px solid #2a2a2a;}
.style-clickhouse .ch-labstat-value{font-size:28px;font-weight:700;line-height:1;letter-spacing:-0.8px;color:#faff69;}
.style-clickhouse .ch-labstat-label{font-size:12px;font-weight:600;letter-spacing:1px;text-transform:uppercase;color:#ffffff;margin-top:8px;}
.style-clickhouse .ch-labstat-desc{font-size:12px;font-weight:500;color:#888888;margin-top:3px;}

/* abstract */
.style-clickhouse .ch-abstract{font-size:20px;line-height:1.6;color:#e6e6e6;margin:0;}

/* dimensions */
.style-clickhouse .ch-dim-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;margin-top:32px;}
.style-clickhouse .ch-dim-card{background:#1a1a1a;border-radius:12px;padding:32px;border:1px solid transparent;}
.style-clickhouse .ch-dim-yellow{background:#faff69;color:#0a0a0a;}
.style-clickhouse .ch-dim-index{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:13px;color:#888888;margin-bottom:16px;}
.style-clickhouse .ch-dim-yellow .ch-dim-index{color:#0a0a0a;opacity:.55;}
.style-clickhouse .ch-dim-name{font-size:18px;font-weight:600;line-height:1.4;margin:0 0 6px;color:#ffffff;}
.style-clickhouse .ch-dim-yellow .ch-dim-name{color:#0a0a0a;}
.style-clickhouse .ch-dim-tagline{font-size:13px;color:#888888;margin:0 0 18px;}
.style-clickhouse .ch-dim-yellow .ch-dim-tagline{color:#0a0a0a;opacity:.6;}
.style-clickhouse .ch-dim-list{margin:0;padding:0;list-style:none;}
.style-clickhouse .ch-dim-list li{font-size:14px;line-height:1.55;color:#cccccc;padding:8px 0 8px 16px;position:relative;border-top:1px solid #2a2a2a;}
.style-clickhouse .ch-dim-yellow .ch-dim-list li{color:#0a0a0a;border-top-color:rgba(10,10,10,.18);}
.style-clickhouse .ch-dim-list li::before{content:'';position:absolute;left:0;top:15px;width:6px;height:6px;background:#faff69;border-radius:2px;}
.style-clickhouse .ch-dim-yellow .ch-dim-list li::before{background:#0a0a0a;}

/* pathway pipeline */
.style-clickhouse .ch-pipeline{display:flex;flex-wrap:wrap;align-items:stretch;gap:10px;margin-top:32px;}
.style-clickhouse .ch-pipe-node{background:#1a1a1a;border:1px solid #2a2a2a;border-top:3px solid #3b82f6;
  border-radius:10px;padding:14px 16px;flex:1;min-width:140px;display:flex;flex-direction:column;gap:6px;}
.style-clickhouse .ch-pipe-node.ch-pipe-validation{border-top-color:#faff69;}
.style-clickhouse .ch-pipe-node.ch-pipe-boundary{border-top-color:#22c55e;}
.style-clickhouse .ch-pipe-id{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:12px;font-weight:600;color:#3b82f6;}
.style-clickhouse .ch-pipe-validation .ch-pipe-id{color:#faff69;}
.style-clickhouse .ch-pipe-boundary .ch-pipe-id{color:#22c55e;}
.style-clickhouse .ch-pipe-label{font-size:13px;line-height:1.45;color:#cccccc;}
.style-clickhouse .ch-pipe-arrow{display:flex;align-items:center;color:#5a5a5a;font-size:18px;flex:none;}
.style-clickhouse .ch-pipe-final{background:#faff69;border-color:#faff69;}
.style-clickhouse .ch-pipe-final .ch-pipe-id{color:#0a0a0a;}
.style-clickhouse .ch-pipe-final .ch-pipe-label{color:#0a0a0a;font-weight:600;}
.style-clickhouse .ch-pipe-legend{display:flex;flex-wrap:wrap;gap:18px;margin-top:18px;}
.style-clickhouse .ch-pipe-swatch{width:10px;height:10px;border-radius:2px;display:inline-block;background:#3b82f6;}
.style-clickhouse .ch-pipe-swatch.ch-pipe-validation{background:#faff69;}
.style-clickhouse .ch-pipe-swatch.ch-pipe-boundary{background:#22c55e;}
.style-clickhouse .ch-pipe-note{font-size:13px;line-height:1.6;color:#888888;margin:18px 0 0;max-width:860px;}

/* leaderboard table */
.style-clickhouse .ch-table-card{background:#121212;border:1px solid #2a2a2a;border-radius:12px;overflow:auto;}
.style-clickhouse .ch-table{width:100%;border-collapse:collapse;min-width:860px;}
.style-clickhouse .ch-table th{font-size:12px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:#888888;
  text-align:left;padding:16px;border-bottom:1px solid #2a2a2a;white-space:nowrap;}
.style-clickhouse .ch-table td{padding:13px 16px;border-bottom:1px solid #2a2a2a;font-size:14px;color:#cccccc;white-space:nowrap;}
.style-clickhouse .ch-table tbody tr:last-child td{border-bottom:none;}
.style-clickhouse .ch-table tbody tr:hover td{background:#1a1a1a;}
.style-clickhouse .ch-th-num,.style-clickhouse .ch-td-num{text-align:right;}
.style-clickhouse .ch-model{font-weight:600;color:#ffffff;}
.style-clickhouse .ch-org{color:#888888;font-size:13px;}
.style-clickhouse .ch-num{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:14px;}
.style-clickhouse .ch-best{font-weight:700;color:#faff69;}
.style-clickhouse .ch-second{text-decoration:underline;text-underline-offset:3px;color:#e6e6e6;}
.style-clickhouse .ch-muted{color:#5a5a5a;}
.style-clickhouse .ch-badge{display:inline-block;background:#1a1a1a;color:#ffffff;font-size:13px;font-weight:500;
  padding:4px 12px;border-radius:9999px;border:1px solid #2a2a2a;}
.style-clickhouse .ch-badge-open{color:#faff69;border-color:#3a3a1f;}
.style-clickhouse .ch-table-caption{font-size:13px;color:#888888;margin:14px 0 0;}

/* charts */
.style-clickhouse .ch-charts-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:32px;}
.style-clickhouse .ch-chart-card{background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;padding:24px;}
.style-clickhouse .ch-chart-wide{grid-column:1 / -1;}
.style-clickhouse .ch-chart-title{font-size:16px;font-weight:600;color:#ffffff;margin:0 0 20px;}
.style-clickhouse .ch-chart-note{font-size:12px;color:#888888;margin:14px 0 0;text-align:center;}
.style-clickhouse .ch-bars{display:flex;flex-direction:column;gap:8px;}
.style-clickhouse .ch-bar-row{display:grid;grid-template-columns:240px 1fr 56px;gap:12px;align-items:center;}
.style-clickhouse .ch-bar-label{font-size:13px;font-weight:500;color:#cccccc;text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.style-clickhouse .ch-bar-track{display:block;height:14px;background:#242424;border-radius:4px;overflow:hidden;}
.style-clickhouse .ch-bar-fill{display:block;height:100%;background:#5a5a5a;border-radius:4px;}
.style-clickhouse .ch-bar-top{background:#faff69;}
.style-clickhouse .ch-bar-value{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:13px;color:#888888;}
.style-clickhouse .ch-legend{display:flex;flex-wrap:wrap;gap:14px;margin-top:16px;justify-content:center;}
.style-clickhouse .ch-legend-item{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:500;color:#888888;}
.style-clickhouse .ch-legend-swatch{width:10px;height:10px;border-radius:2px;display:inline-block;}
.style-clickhouse .ch-grouped{display:flex;justify-content:space-around;align-items:flex-end;height:240px;margin-top:8px;}
.style-clickhouse .ch-group{display:flex;flex-direction:column;align-items:center;gap:10px;height:100%;justify-content:flex-end;}
.style-clickhouse .ch-group-bars{display:flex;align-items:flex-end;gap:8px;height:200px;}
.style-clickhouse .ch-gbar{position:relative;display:block;width:52px;border-radius:4px 4px 0 0;}
.style-clickhouse .ch-gbar-open{background:#5a5a5a;}
.style-clickhouse .ch-gbar-closed{background:#faff69;}
.style-clickhouse .ch-gbar-tip{position:absolute;top:-20px;left:50%;transform:translateX(-50%);
  font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;color:#888888;white-space:nowrap;}
.style-clickhouse .ch-gbar-closed .ch-gbar-tip{color:#faff69;}
.style-clickhouse .ch-group-label{font-size:12px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:#888888;}

/* long-horizon wall */
.style-clickhouse .ch-wall-ratio{display:flex;height:22px;border-radius:6px;overflow:hidden;background:#242424;}
.style-clickhouse .ch-wall-seg{display:block;height:100%;}
.style-clickhouse .ch-wall-under{background:#5a5a5a;}
.style-clickhouse .ch-wall-over{background:#faff69;min-width:10px;}
.style-clickhouse .ch-wall-meta{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;
  font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;color:#888888;margin-top:10px;}
.style-clickhouse .ch-wall-big{display:flex;align-items:baseline;gap:16px;margin:30px 0 14px;}
.style-clickhouse .ch-wall-num{font-size:72px;font-weight:700;line-height:1;letter-spacing:-2px;color:#faff69;}
.style-clickhouse .ch-wall-cap{font-size:14px;line-height:1.4;color:#cccccc;max-width:220px;}
.style-clickhouse .ch-wall-note{font-size:13px;line-height:1.55;color:#888888;margin:0;}

/* tasks */
.style-clickhouse .ch-task-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;margin-top:32px;}
.style-clickhouse .ch-task-card{background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;padding:24px;display:flex;flex-direction:column;gap:14px;}
.style-clickhouse .ch-task-hot{border-color:#faff69;}
.style-clickhouse .ch-task-top{display:flex;align-items:center;justify-content:space-between;gap:8px;}
.style-clickhouse .ch-task-flag{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:10px;font-weight:500;
  letter-spacing:1.5px;text-transform:uppercase;color:#faff69;}
.style-clickhouse .ch-task-desc{font-size:14px;line-height:1.55;color:#cccccc;margin:0;flex:1;}

/* closed-loop */
.style-clickhouse .ch-loop-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:8px;}
.style-clickhouse .ch-loop-card{background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;padding:28px;}
.style-clickhouse .ch-loop-title{font-size:16px;font-weight:600;color:#ffffff;margin:0;}
.style-clickhouse .ch-loop-list{margin:14px 0 0;padding:0;list-style:none;}
.style-clickhouse .ch-loop-list li{font-size:14px;line-height:1.5;color:#cccccc;padding:10px 0;border-top:1px solid #2a2a2a;}
.style-clickhouse .ch-loop-yes{font-family:'JetBrains Mono',ui-monospace,monospace;font-weight:700;color:#22c55e;margin-right:10px;}
.style-clickhouse .ch-loop-no{font-family:'JetBrains Mono',ui-monospace,monospace;font-weight:700;color:#888888;margin-right:10px;}

/* failure modes */
.style-clickhouse .ch-fail-card{background:#1a1a1a;border:1px solid #2a2a2a;border-radius:12px;padding:8px 32px;margin-top:32px;}
.style-clickhouse .ch-fail-row{padding:20px 0;border-bottom:1px solid #2a2a2a;}
.style-clickhouse .ch-fail-row:last-of-type{border-bottom:none;}
.style-clickhouse .ch-fail-head{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px;}
.style-clickhouse .ch-fail-name{font-size:16px;font-weight:600;color:#ffffff;}
.style-clickhouse .ch-fail-desc{font-size:14px;color:#888888;margin:0;}
.style-clickhouse .ch-fail-note{font-size:13px;line-height:1.6;color:#cccccc;margin:0;padding:20px 0;
  border-top:1px solid #2a2a2a;}

/* methodology */
.style-clickhouse .ch-method-grid{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:start;}
.style-clickhouse .ch-method-list{margin:24px 0 0;padding:0;list-style:none;}
.style-clickhouse .ch-method-list li{font-size:16px;line-height:1.55;color:#cccccc;padding:14px 0 14px 24px;position:relative;border-bottom:1px solid #2a2a2a;}
.style-clickhouse .ch-method-list li::before{content:'';position:absolute;left:0;top:22px;width:8px;height:8px;background:#faff69;border-radius:2px;}
.style-clickhouse .ch-eyebrow-gap{margin-top:36px;}
.style-clickhouse .ch-axes-list{margin:0;padding:0;list-style:none;display:grid;grid-template-columns:1fr 1fr;gap:8px;}
.style-clickhouse .ch-axes-list li{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:12px;color:#cccccc;
  background:#1a1a1a;border:1px solid #2a2a2a;border-radius:8px;padding:8px 12px;}
.style-clickhouse .ch-formulas{display:flex;flex-direction:column;gap:8px;margin-top:24px;}
.style-clickhouse .ch-formula{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:13px;color:#faff69;
  background:#1a1a1a;border:1px solid #2a2a2a;border-radius:8px;padding:10px 14px;}

/* cta band */
.style-clickhouse .ch-cta-band{background:#faff69;color:#0a0a0a;border-radius:12px;padding:64px;text-align:center;}
.style-clickhouse .ch-cta-title{font-size:40px;font-weight:700;line-height:1.15;letter-spacing:-1.5px;margin:0 0 12px;color:#0a0a0a;}
.style-clickhouse .ch-cta-sub{font-size:16px;color:#0a0a0a;opacity:.75;margin:0 0 28px;}

/* footer */
.style-clickhouse .ch-footer{margin-top:96px;border-top:1px solid #2a2a2a;padding:64px 0;background:#0a0a0a;}
.style-clickhouse .ch-footer-inner{display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap;}
.style-clickhouse .ch-footer-note{font-size:14px;color:#888888;margin:0;}
.style-clickhouse .ch-footer-link{font-size:14px;font-weight:500;color:#888888;}
.style-clickhouse .ch-footer-link:hover{color:#faff69;}

@media (max-width:1024px){
  .style-clickhouse .ch-hero-grid{grid-template-columns:1fr;}
  .style-clickhouse .ch-stats-grid{grid-template-columns:repeat(3,1fr);}
  .style-clickhouse .ch-labstats{grid-template-columns:repeat(2,1fr);}
  .style-clickhouse .ch-dim-grid{grid-template-columns:repeat(2,1fr);}
  .style-clickhouse .ch-task-grid{grid-template-columns:repeat(2,1fr);}
  .style-clickhouse .ch-loop-grid{grid-template-columns:1fr;}
  .style-clickhouse .ch-charts-grid{grid-template-columns:1fr;}
  .style-clickhouse .ch-method-grid{grid-template-columns:1fr;}
  .style-clickhouse .ch-nav-links{display:none;}
  .style-clickhouse .ch-pipe-arrow{display:none;}
}
@media (max-width:640px){
  .style-clickhouse .ch-wrap{padding:0 20px;}
  .style-clickhouse .ch-h1{font-size:34px;letter-spacing:-1.2px;}
  .style-clickhouse .ch-stats-grid{grid-template-columns:repeat(2,1fr);}
  .style-clickhouse .ch-stat-value{font-size:40px;}
  .style-clickhouse .ch-labstats{grid-template-columns:repeat(2,1fr);}
  .style-clickhouse .ch-dim-grid,.style-clickhouse .ch-task-grid{grid-template-columns:1fr;}
  .style-clickhouse .ch-bar-row{grid-template-columns:130px 1fr 48px;}
  .style-clickhouse .ch-cta-band{padding:40px 24px;}
  .style-clickhouse .ch-cta-title{font-size:28px;}
  .style-clickhouse .ch-section{padding-top:64px;}
  .style-clickhouse .ch-hero{padding:64px 0;}
}
`
