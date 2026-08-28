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
  if (v === bestN10) return 'co-num co-best'
  if (v === secondN10) return 'co-num co-second'
  return 'co-num'
}

function stageClass(stage: string) {
  if (stage === pathwayStages[0]) return 'co-pipe-design'
  if (stage === pathwayStages[1]) return 'co-pipe-validation'
  return 'co-pipe-boundary'
}

const STAT_SURFACES = ['#eeece7', '#edfce9', '#eeece7', '#f1f5ff', '#eeece7', '#edfce9']
const wallUnder = longHorizon.totalExecutable - longHorizon.over30Ops

export default function Cohere() {
  return (
    <div className="style-cohere">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500&family=Inter:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap"
      />
      <style>{CSS}</style>

      {/* ============ ANNOUNCEMENT BAR ============ */}
      <div className="co-announce">
        RoboChem Bench is now open for submissions — 45 workstations, 4,608 trials.{' '}
        <a href="#">Learn more</a>
      </div>

      {/* ============ NAV ============ */}
      <header className="co-nav">
        <div className="co-wrap co-nav-inner">
          <span className="co-wordmark">RoboChem Bench</span>
          <nav className="co-nav-links">
            <a href="#co-framework">Skills</a>
            <a href="#co-leaderboard">Leaderboard</a>
            <a href="#co-charts">Analysis</a>
            <a href="#co-tasks">Tasks</a>
          </nav>
          <div className="co-nav-right">
            <Link to="/" className="co-nav-back">
              ← Back to Gallery
            </Link>
            <a href="#" className="co-btn co-btn-primary">
              Submit Your Agent
            </a>
          </div>
        </div>
      </header>

      {/* ============ HERO ============ */}
      <section className="co-hero">
        <div className="co-wrap co-hero-inner">
          <p className="co-mono-label">Benchmark paper · arXiv:2607.23045</p>
          <h1 className="co-h1">{paperMeta.title}</h1>
          <p className="co-sub">{paperMeta.subtitle}</p>
          <p className="co-authors">
            {paperMeta.authors.join(', ')}
            <br />
            {paperMeta.affiliation}
          </p>
          <div className="co-btn-row">
            <a href={paperMeta.links[0].href} className="co-btn co-btn-primary">
              {paperMeta.links[0].label}
            </a>
            <a href={paperMeta.links[1].href} className="co-btn co-btn-outline">
              {paperMeta.links[1].label}
            </a>
            <a href={paperMeta.links[2].href} className="co-btn co-btn-outline">
              {paperMeta.links[2].label}
            </a>
            <a href={paperMeta.links[3].href} className="co-text-link">
              {paperMeta.links[3].label}
            </a>
          </div>
        </div>
      </section>

      {/* ============ STATS ============ */}
      <section className="co-band">
        <div className="co-wrap co-stats-grid">
          {keyStats.map((s, i) => (
            <div key={s.label} className="co-stat" style={{ background: STAT_SURFACES[i] }}>
              <div className="co-stat-value">{s.value}</div>
              <div className="co-stat-label">{s.label}</div>
              <div className="co-stat-desc">{s.description}</div>
            </div>
          ))}
        </div>
        <div className="co-wrap co-labstats">
          {labStats.map((s) => (
            <div key={s.label} className="co-labstat">
              <span className="co-labstat-value">{s.value}</span>
              <span className="co-labstat-label">{s.label}</span>
              <span className="co-labstat-desc">{s.description}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ============ ABSTRACT ============ */}
      <section className="co-band">
        <div className="co-wrap co-narrow">
          <p className="co-mono-label">Abstract</p>
          <p className="co-abstract">{abstractText}</p>
        </div>
      </section>

      {/* ============ SKILLS LIBRARY (deep-green band) ============ */}
      <section className="co-band" id="co-framework">
        <div className="co-wrap">
          <div className="co-green-band">
            <p className="co-mono-label co-mono-on-dark">The Skills Library</p>
            <h2 className="co-h2 co-on-dark">45 workstations, one skills library</h2>
            <div className="co-dim-grid">
              {skillCategories.map((d, i) => (
                <div key={d.name} className="co-dim-card">
                  <div className="co-dim-index">0{i + 1}</div>
                  <h3 className="co-dim-name">{d.name}</h3>
                  <p className="co-dim-tagline">{d.tagline}</p>
                  <ul className="co-dim-list">
                    {d.bullets.map((b) => (
                      <li key={b}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ EVALUATION PATHWAY ============ */}
      <section className="co-band">
        <div className="co-wrap">
          <p className="co-mono-label">Evaluation pathway</p>
          <h2 className="co-h2">From task receipt to physical execution</h2>
          <div className="co-pipeline">
            {pathway.map((n, i) => (
              <Fragment key={n.node}>
                {i > 0 && <span className="co-pipe-arrow">→</span>}
                <div
                  className={`co-pipe-node ${stageClass(n.stage)}${n.node === 'N10' ? ' co-pipe-final' : ''}`}
                >
                  <span className="co-pipe-id">{n.node}</span>
                  <span className="co-pipe-label">{n.label}</span>
                </div>
              </Fragment>
            ))}
          </div>
          <div className="co-pipe-legend">
            {pathwayStages.map((stage) => (
              <span key={stage} className="co-legend-item">
                <span className={`co-pipe-swatch ${stageClass(stage)}`} />
                {stage}
              </span>
            ))}
          </div>
          <p className="co-pipe-note">{pathwayNote}</p>
        </div>
      </section>

      {/* ============ LEADERBOARD (research-table style) ============ */}
      <section className="co-band" id="co-leaderboard">
        <div className="co-wrap">
          <p className="co-mono-label">Leaderboard</p>
          <h2 className="co-h2">Top 8 of 48 configurations, ranked by N10 executable yield</h2>
          <p className="co-note">
            N10 Yield is the expert-adjudicated executable rate (%). <strong>Bold</strong> marks the
            best configuration, <span className="co-second">underline</span> the runner-up.
          </p>
          <div className="co-table-card">
            <table className="co-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Configuration</th>
                  <th>Organization</th>
                  <th>Weights</th>
                  <th className="co-th-num">Trials</th>
                  <th className="co-th-num">Executable</th>
                  <th className="co-th-num">N10 Yield</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((r) => (
                  <tr key={r.rank}>
                    <td className="co-num co-muted">{String(r.rank).padStart(2, '0')}</td>
                    <td className="co-model">
                      {r.harness} × {r.model}
                    </td>
                    <td className="co-org">{r.org}</td>
                    <td>
                      <span className={r.weights === 'open' ? 'co-chip co-chip-open' : 'co-chip'}>
                        {r.weights === 'open' ? 'Open' : 'Closed'}
                      </span>
                    </td>
                    <td className="co-td-num">
                      <span className="co-num">{r.trials}</span>
                    </td>
                    <td className="co-td-num">
                      <span className="co-num">{r.executable}</span>
                    </td>
                    <td className="co-td-num">
                      <span className={n10Class(r.n10)}>{r.n10.toFixed(1)}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="co-table-caption">{leaderboardCaption}</p>
        </div>
      </section>

      {/* ============ CHARTS ============ */}
      <section className="co-band" id="co-charts">
        <div className="co-wrap">
          <p className="co-mono-label">Analysis</p>
          <h2 className="co-h2">Results at a glance</h2>
          <div className="co-charts-grid">
            <div className="co-chart-card co-chart-wide">
              <h3 className="co-chart-title">N10 executable yield — top 8 configurations</h3>
              <div className="co-bars">
                {leaderboard.map((r) => (
                  <div key={r.rank} className="co-bar-row">
                    <span className="co-bar-label">
                      {r.harness} × {r.model}
                    </span>
                    <span className="co-bar-track">
                      <span
                        className={r.rank === 1 ? 'co-bar-fill co-bar-top' : 'co-bar-fill'}
                        style={{ width: `${(r.n10 / maxN10) * 100}%` }}
                      />
                    </span>
                    <span className="co-bar-value">{r.n10.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="co-chart-card">
              <h3 className="co-chart-title">The long-horizon wall</h3>
              <div className="co-wall-ratio">
                <span
                  className="co-wall-seg co-wall-under"
                  style={{ width: `${(wallUnder / longHorizon.totalExecutable) * 100}%` }}
                />
                <span
                  className="co-wall-seg co-wall-over"
                  style={{ width: `${(longHorizon.over30Ops / longHorizon.totalExecutable) * 100}%` }}
                />
              </div>
              <div className="co-wall-meta">
                <span>{wallUnder} executable workflows ≤ 30 ops</span>
                <span>{longHorizon.over30Ops} workflows &gt; 30 ops</span>
              </div>
              <div className="co-wall-big">
                <span className="co-wall-num">{longHorizon.longest}</span>
                <span className="co-wall-cap">operations in the longest executable workflow</span>
              </div>
              <p className="co-wall-note">{longHorizon.note}</p>
            </div>
            <div className="co-chart-card">
              <h3 className="co-chart-title">Open vs Closed — mean N10 yield</h3>
              <div className="co-grouped">
                {weightsAvg.map((row) => (
                  <div key={row.group} className="co-group">
                    <div className="co-group-bars">
                      <span
                        className={
                          row.group.startsWith('Closed') ? 'co-gbar co-gbar-closed' : 'co-gbar co-gbar-open'
                        }
                        style={{ height: `${(row.value / maxWeights) * 100}%` }}
                      >
                        <span className="co-gbar-tip">{row.value.toFixed(1)}%</span>
                      </span>
                    </div>
                    <span className="co-group-label">
                      {row.group.startsWith('Closed') ? 'Closed' : 'Open'} · n={row.n}
                    </span>
                  </div>
                ))}
              </div>
              <div className="co-legend">
                <span className="co-legend-item">
                  <span className="co-legend-swatch" style={{ background: '#003c33' }} /> Open
                </span>
                <span className="co-legend-item">
                  <span className="co-legend-swatch" style={{ background: '#ff7759' }} /> Closed
                </span>
              </div>
              <p className="co-chart-note">{weightsAvgCaption}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ TASK DOMAINS (soft-stone product cards) ============ */}
      <section className="co-band" id="co-tasks">
        <div className="co-wrap">
          <p className="co-mono-label">Task domains</p>
          <h2 className="co-h2">32 research tasks across 4 catalysis domains</h2>
          <div className="co-task-grid">
            {taskDomains.map((t, i) => (
              <div key={t.domain} className={i === 0 ? 'co-task-card co-task-hot' : 'co-task-card'}>
                <div className="co-task-top">
                  <span className="co-chip co-chip-domain">{t.domain}</span>
                  {i === 0 && <span className="co-chip co-chip-open">Closed-loop</span>}
                </div>
                <p className="co-task-desc">{t.blurb}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CLOSED-LOOP ADAPTATION ============ */}
      <section className="co-band">
        <div className="co-wrap">
          <p className="co-mono-label">Closed-loop adaptation</p>
          <h2 className="co-h2">Five rounds of feedback — local adjustments only</h2>
          <p className="co-note">
            Agent: {closedLoop.agent} · Task: {closedLoop.task} · {closedLoop.rounds} feedback rounds
          </p>
          <div className="co-loop-grid">
            <div className="co-loop-card co-loop-yes-card">
              <h3 className="co-loop-title">Localized adaptation observed</h3>
              <ul className="co-loop-list">
                {closedLoop.adapted.map((a) => (
                  <li key={a}>
                    <span className="co-loop-yes">✓</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
            <div className="co-loop-card">
              <h3 className="co-loop-title">Strategic redirection not observed</h3>
              <ul className="co-loop-list">
                {closedLoop.notObserved.map((a) => (
                  <li key={a}>
                    <span className="co-loop-no">✗</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FAILURE MODES ============ */}
      <section className="co-band">
        <div className="co-wrap co-narrow">
          <p className="co-mono-label">Failure analysis</p>
          <h2 className="co-h2">How agents fail</h2>
          <div className="co-fail-list">
            {failureModes.map((f) => (
              <div key={f.name} className="co-fail-row">
                <div className="co-fail-body">
                  <div className="co-fail-name">{f.name}</div>
                  <p className="co-fail-desc">{f.description}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="co-fail-note">{failureNote}</p>
        </div>
      </section>

      {/* ============ METHODOLOGY + BIBTEX (pale-blue section) ============ */}
      <section className="co-band">
        <div className="co-wrap">
          <div className="co-pale-section">
            <div className="co-method-grid">
              <div>
                <p className="co-mono-label">Methodology</p>
                <h2 className="co-h2">How we measured</h2>
                <ul className="co-method-list">
                  {methodologyNotes.map((n) => (
                    <li key={n}>{n}</li>
                  ))}
                </ul>
                <p className="co-mono-label co-label-gap">Scoring rubric — multi-axis R1–R6</p>
                <ul className="co-axes-list">
                  {scoringAxes.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
                <div className="co-formulas">
                  {formulas.map((f) => (
                    <code key={f} className="co-formula">
                      {f}
                    </code>
                  ))}
                </div>
              </div>
              <div>
                <p className="co-mono-label">Cite this work</p>
                <div className="co-console-card">
                  <div className="co-console-head">
                    <span className="co-console-chip">BibTeX</span>
                    <span className="co-console-status">ready</span>
                  </div>
                  <pre className="co-bibtex">
                    <code>{bibtex}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FOOTER (dark) ============ */}
      <footer className="co-footer">
        <div className="co-wrap">
          <div className="co-footer-top">
            <div>
              <p className="co-footer-coral">Benchmarks move fast</p>
              <h2 className="co-footer-title">Think your agent can do science?</h2>
              <a href="#" className="co-btn co-btn-white">
                Submit Your Agent
              </a>
            </div>
          </div>
          <div className="co-footer-bottom">
            <span className="co-footer-mark">RoboChem Bench</span>
            <p className="co-footer-note">Style preview · Cohere DESIGN.md · Content from arXiv:2607.23045</p>
            <Link to="/" className="co-footer-link">
              ← Back to Gallery
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

/* ---------- scoped styles ---------- */
const CSS = `
.style-cohere{
  background:#ffffff;color:#212121;
  font-family:'Inter',Arial,ui-sans-serif,system-ui,sans-serif;
  min-height:100dvh;-webkit-font-smoothing:antialiased;
}
.style-cohere .co-wrap{max-width:1280px;margin:0 auto;padding:0 32px;}
.style-cohere .co-narrow{max-width:820px;}
.style-cohere .co-band{padding:80px 0 0;}
.style-cohere a{text-decoration:none;color:inherit;}
.style-cohere .co-mono-label{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:13px;font-weight:500;
  letter-spacing:0.28px;text-transform:uppercase;color:#75758a;margin:0 0 16px;}
.style-cohere .co-mono-on-dark{color:#9fd8cc;}
.style-cohere .co-on-dark{color:#ffffff;}

/* announcement */
.style-cohere .co-announce{background:#000000;color:#ffffff;font-size:12px;line-height:1.4;height:36px;
  display:flex;align-items:center;justify-content:center;gap:4px;padding:0 16px;text-align:center;}
.style-cohere .co-announce a{color:#ffffff;text-decoration:underline;}

/* nav */
.style-cohere .co-nav{background:#ffffff;border-bottom:1px solid #d9d9dd;position:sticky;top:0;z-index:50;}
.style-cohere .co-nav-inner{height:64px;display:flex;align-items:center;justify-content:space-between;gap:24px;}
.style-cohere .co-wordmark{font-family:'Space Grotesk','Inter',sans-serif;font-size:18px;font-weight:500;letter-spacing:-0.3px;white-space:nowrap;}
.style-cohere .co-nav-links{display:flex;gap:28px;}
.style-cohere .co-nav-links a{font-size:16px;color:#212121;}
.style-cohere .co-nav-links a:hover{color:#1863dc;}
.style-cohere .co-nav-right{display:flex;align-items:center;gap:18px;flex:none;}
.style-cohere .co-nav-back{font-size:14px;color:#75758a;white-space:nowrap;}
.style-cohere .co-nav-back:hover{color:#212121;}

/* buttons */
.style-cohere .co-btn{display:inline-flex;align-items:center;padding:12px 24px;font-size:14px;font-weight:500;
  line-height:1.71;cursor:pointer;white-space:nowrap;}
.style-cohere .co-btn-primary{background:#17171c;color:#ffffff;border-radius:32px;}
.style-cohere .co-btn-primary:hover{background:#000000;}
.style-cohere .co-btn-outline{background:transparent;color:#17171c;border:1px solid #d9d9dd;border-radius:30px;padding:6px 18px;}
.style-cohere .co-btn-white{background:#ffffff;color:#17171c;border-radius:32px;}
.style-cohere .co-text-link{font-size:16px;color:#212121;text-decoration:underline;text-underline-offset:4px;padding:8px 4px;}
.style-cohere .co-btn-row{display:flex;flex-wrap:wrap;align-items:center;gap:14px;margin-top:36px;}

/* hero */
.style-cohere .co-hero{padding:96px 0 80px;}
.style-cohere .co-hero-inner{max-width:900px;}
.style-cohere .co-h1{font-family:'Space Grotesk','Inter',sans-serif;font-size:64px;font-weight:400;line-height:1.02;
  letter-spacing:-1.3px;margin:0 0 24px;color:#212121;}
.style-cohere .co-sub{font-size:18px;line-height:1.4;color:#616161;margin:0 0 16px;max-width:720px;}
.style-cohere .co-authors{font-size:14px;line-height:1.5;color:#93939f;margin:0;}
.style-cohere .co-h2{font-family:'Space Grotesk','Inter',sans-serif;font-size:36px;font-weight:400;line-height:1.2;
  letter-spacing:-0.4px;margin:0 0 12px;color:#212121;}
.style-cohere .co-note{font-size:14px;color:#75758a;margin:0 0 24px;}

/* stats */
.style-cohere .co-stats-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:16px;}
.style-cohere .co-stat{border-radius:8px;padding:24px;}
.style-cohere .co-stat-value{font-family:'Space Grotesk','Inter',sans-serif;font-size:36px;font-weight:400;
  letter-spacing:-0.7px;line-height:1;color:#212121;}
.style-cohere .co-stat-label{font-size:14px;font-weight:500;color:#212121;margin-top:10px;}
.style-cohere .co-stat-desc{font-size:12px;color:#616161;margin-top:2px;}

/* lab stats (secondary band) */
.style-cohere .co-labstats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:16px;}
.style-cohere .co-labstat{border:1px solid #d9d9dd;border-radius:8px;padding:16px 20px;display:flex;flex-direction:column;}
.style-cohere .co-labstat-value{font-family:'Space Grotesk','Inter',sans-serif;font-size:24px;font-weight:400;
  letter-spacing:-0.5px;line-height:1;color:#1863dc;}
.style-cohere .co-labstat-label{font-size:13px;font-weight:500;color:#212121;margin-top:8px;}
.style-cohere .co-labstat-desc{font-size:11px;color:#616161;margin-top:2px;}

/* abstract */
.style-cohere .co-abstract{font-size:24px;font-weight:400;line-height:1.45;color:#212121;margin:0;letter-spacing:-0.2px;}

/* green band + dimensions */
.style-cohere .co-green-band{background:#003c33;border-radius:22px;padding:64px 56px;}
.style-cohere .co-dim-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:32px;}
.style-cohere .co-dim-card{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);border-radius:8px;padding:24px;color:#ffffff;}
.style-cohere .co-dim-index{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:12px;color:#9fd8cc;margin-bottom:14px;}
.style-cohere .co-dim-name{font-family:'Space Grotesk','Inter',sans-serif;font-size:22px;font-weight:400;line-height:1.3;margin:0 0 6px;}
.style-cohere .co-dim-tagline{font-size:13px;color:rgba(255,255,255,.6);margin:0 0 16px;}
.style-cohere .co-dim-list{margin:0;padding:0;list-style:none;}
.style-cohere .co-dim-list li{font-size:14px;line-height:1.5;color:rgba(255,255,255,.85);padding:9px 0 9px 16px;
  position:relative;border-top:1px solid rgba(255,255,255,.14);}
.style-cohere .co-dim-list li::before{content:'';position:absolute;left:0;top:16px;width:6px;height:6px;border-radius:50%;background:#ff7759;}

/* pathway pipeline */
.style-cohere .co-pipeline{display:flex;flex-wrap:wrap;align-items:stretch;gap:10px;margin-top:32px;}
.style-cohere .co-pipe-node{background:#ffffff;border:1px solid #d9d9dd;border-top:3px solid #1863dc;
  border-radius:8px;padding:14px 16px;flex:1;min-width:140px;display:flex;flex-direction:column;gap:6px;}
.style-cohere .co-pipe-node.co-pipe-validation{border-top-color:#ff7759;}
.style-cohere .co-pipe-node.co-pipe-boundary{border-top-color:#003c33;}
.style-cohere .co-pipe-id{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:12px;font-weight:500;color:#1863dc;}
.style-cohere .co-pipe-validation .co-pipe-id{color:#ff7759;}
.style-cohere .co-pipe-boundary .co-pipe-id{color:#003c33;}
.style-cohere .co-pipe-label{font-size:13px;line-height:1.45;color:#616161;}
.style-cohere .co-pipe-arrow{display:flex;align-items:center;color:#93939f;font-size:18px;flex:none;}
.style-cohere .co-pipe-final{background:#003c33;border-color:#003c33;}
.style-cohere .co-pipe-final .co-pipe-id{color:#9fd8cc;}
.style-cohere .co-pipe-final .co-pipe-label{color:#ffffff;font-weight:500;}
.style-cohere .co-pipe-legend{display:flex;flex-wrap:wrap;gap:18px;margin-top:18px;}
.style-cohere .co-pipe-swatch{width:10px;height:10px;border-radius:3px;display:inline-block;background:#1863dc;}
.style-cohere .co-pipe-swatch.co-pipe-validation{background:#ff7759;}
.style-cohere .co-pipe-swatch.co-pipe-boundary{background:#003c33;}
.style-cohere .co-pipe-note{font-size:13px;line-height:1.6;color:#75758a;margin:18px 0 0;max-width:860px;}

/* leaderboard */
.style-cohere .co-table-card{border-top:2px solid #212121;overflow-x:auto;}
.style-cohere .co-table{width:100%;border-collapse:collapse;min-width:880px;}
.style-cohere .co-table th{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;font-weight:500;
  letter-spacing:0.55px;text-transform:uppercase;color:#75758a;text-align:left;padding:14px 12px;border-bottom:1px solid #d9d9dd;white-space:nowrap;}
.style-cohere .co-table td{padding:18px 12px;border-bottom:1px solid #d9d9dd;font-size:16px;color:#212121;white-space:nowrap;}
.style-cohere .co-table tbody tr:hover td{background:#fafafa;}
.style-cohere .co-th-num,.style-cohere .co-td-num{text-align:right;}
.style-cohere .co-model{font-weight:500;}
.style-cohere .co-org{color:#75758a;font-size:14px;}
.style-cohere .co-num{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:14px;}
.style-cohere .co-best{font-weight:600;color:#17171c;}
.style-cohere .co-second{text-decoration:underline;text-underline-offset:3px;}
.style-cohere .co-muted{color:#93939f;}
.style-cohere .co-chip{display:inline-block;background:#eeece7;color:#212121;font-size:13px;font-weight:500;padding:4px 12px;border-radius:8px;}
.style-cohere .co-chip-open{background:#edfce9;}
.style-cohere .co-chip-domain{background:#ffffff;border:1px solid #d9d9dd;}
.style-cohere .co-table-caption{font-size:13px;color:#75758a;margin:14px 0 0;}

/* charts */
.style-cohere .co-charts-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:32px;}
.style-cohere .co-chart-card{background:#ffffff;border:1px solid #d9d9dd;border-radius:16px;padding:28px;}
.style-cohere .co-chart-wide{grid-column:1 / -1;}
.style-cohere .co-chart-title{font-family:'Space Grotesk','Inter',sans-serif;font-size:20px;font-weight:400;color:#212121;margin:0 0 20px;}
.style-cohere .co-chart-note{font-size:12px;color:#75758a;margin:14px 0 0;text-align:center;}
.style-cohere .co-bars{display:flex;flex-direction:column;gap:9px;}
.style-cohere .co-bar-row{display:grid;grid-template-columns:240px 1fr 56px;gap:12px;align-items:center;}
.style-cohere .co-bar-label{font-size:13px;color:#616161;text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.style-cohere .co-bar-track{display:block;height:14px;background:#f2f2f2;border-radius:7px;overflow:hidden;}
.style-cohere .co-bar-fill{display:block;height:100%;background:#93939f;border-radius:7px;}
.style-cohere .co-bar-top{background:#ff7759;}
.style-cohere .co-bar-value{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:12px;color:#75758a;}
.style-cohere .co-legend{display:flex;flex-wrap:wrap;gap:14px;margin-top:16px;justify-content:center;}
.style-cohere .co-legend-item{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:#75758a;}
.style-cohere .co-legend-swatch{width:10px;height:10px;border-radius:3px;display:inline-block;}
.style-cohere .co-grouped{display:flex;justify-content:space-around;align-items:flex-end;height:240px;margin-top:8px;}
.style-cohere .co-group{display:flex;flex-direction:column;align-items:center;gap:10px;height:100%;justify-content:flex-end;}
.style-cohere .co-group-bars{display:flex;align-items:flex-end;gap:8px;height:200px;}
.style-cohere .co-gbar{position:relative;display:block;width:52px;border-radius:7px 7px 0 0;}
.style-cohere .co-gbar-open{background:#003c33;}
.style-cohere .co-gbar-closed{background:#ff7759;}
.style-cohere .co-gbar-tip{position:absolute;top:-20px;left:50%;transform:translateX(-50%);
  font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;color:#75758a;white-space:nowrap;}
.style-cohere .co-group-label{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;letter-spacing:0.55px;text-transform:uppercase;color:#75758a;}

/* long-horizon wall */
.style-cohere .co-wall-ratio{display:flex;height:22px;border-radius:7px;overflow:hidden;background:#f2f2f2;}
.style-cohere .co-wall-seg{display:block;height:100%;}
.style-cohere .co-wall-under{background:#93939f;}
.style-cohere .co-wall-over{background:#ff7759;min-width:10px;}
.style-cohere .co-wall-meta{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;
  font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;color:#75758a;margin-top:10px;}
.style-cohere .co-wall-big{display:flex;align-items:baseline;gap:16px;margin:30px 0 14px;}
.style-cohere .co-wall-num{font-family:'Space Grotesk','Inter',sans-serif;font-size:72px;font-weight:400;line-height:1;letter-spacing:-1.5px;color:#ff7759;}
.style-cohere .co-wall-cap{font-size:14px;line-height:1.4;color:#616161;max-width:220px;}
.style-cohere .co-wall-note{font-size:13px;line-height:1.55;color:#75758a;margin:0;}

/* tasks */
.style-cohere .co-task-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:24px;margin-top:32px;}
.style-cohere .co-task-card{background:#eeece7;border-radius:8px;padding:28px;display:flex;flex-direction:column;gap:16px;}
.style-cohere .co-task-hot{background:#edfce9;}
.style-cohere .co-task-top{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;}
.style-cohere .co-task-desc{font-size:15px;line-height:1.5;color:#212121;margin:0;flex:1;}

/* closed-loop */
.style-cohere .co-loop-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;}
.style-cohere .co-loop-card{border:1px solid #d9d9dd;border-radius:16px;padding:28px;background:#ffffff;}
.style-cohere .co-loop-yes-card{background:#edfce9;border-color:#edfce9;}
.style-cohere .co-loop-title{font-family:'Space Grotesk','Inter',sans-serif;font-size:20px;font-weight:400;color:#212121;margin:0;}
.style-cohere .co-loop-list{margin:14px 0 0;padding:0;list-style:none;}
.style-cohere .co-loop-list li{font-size:14px;line-height:1.5;color:#212121;padding:10px 0;border-top:1px solid rgba(23,23,28,.1);}
.style-cohere .co-loop-yes{font-family:'JetBrains Mono',ui-monospace,monospace;font-weight:600;color:#003c33;margin-right:10px;}
.style-cohere .co-loop-no{font-family:'JetBrains Mono',ui-monospace,monospace;font-weight:600;color:#ff7759;margin-right:10px;}

/* failure modes */
.style-cohere .co-fail-list{margin-top:8px;}
.style-cohere .co-fail-row{padding:28px 0;border-bottom:1px solid #d9d9dd;}
.style-cohere .co-fail-row:last-child{border-bottom:none;}
.style-cohere .co-fail-name{font-size:20px;font-weight:500;color:#212121;margin-bottom:6px;}
.style-cohere .co-fail-desc{font-size:14px;color:#616161;margin:0;}
.style-cohere .co-fail-note{font-size:14px;line-height:1.6;color:#212121;margin:28px 0 0;padding:20px 24px;
  background:#eeece7;border-radius:8px;}

/* methodology pale section */
.style-cohere .co-pale-section{background:#f1f5ff;border-radius:22px;padding:56px;}
.style-cohere .co-method-grid{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:start;}
.style-cohere .co-method-list{margin:20px 0 0;padding:0;list-style:none;}
.style-cohere .co-method-list li{font-size:16px;line-height:1.5;color:#212121;padding:14px 0 14px 24px;position:relative;border-bottom:1px solid #d9d9dd;}
.style-cohere .co-method-list li::before{content:'';position:absolute;left:0;top:22px;width:8px;height:8px;border-radius:50%;background:#1863dc;}
.style-cohere .co-label-gap{margin-top:32px;}
.style-cohere .co-axes-list{margin:0;padding:0;list-style:none;display:grid;grid-template-columns:1fr 1fr;gap:8px;}
.style-cohere .co-axes-list li{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:12px;color:#212121;
  background:#ffffff;border:1px solid #d9d9dd;border-radius:8px;padding:8px 12px;}
.style-cohere .co-formulas{display:flex;flex-direction:column;gap:8px;margin-top:20px;}
.style-cohere .co-formula{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:13px;color:#1863dc;
  background:#ffffff;border:1px solid #d9d9dd;border-radius:8px;padding:10px 14px;}
.style-cohere .co-console-card{background:#17171c;border-radius:8px;padding:24px;color:#ffffff;}
.style-cohere .co-console-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;}
.style-cohere .co-console-chip{background:#ff7759;color:#17171c;font-size:12px;font-weight:500;padding:3px 10px;border-radius:8px;}
.style-cohere .co-console-status{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:12px;color:#9fd8cc;}
.style-cohere .co-bibtex{margin:0;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:13px;line-height:1.6;
  color:#e8e8ec;overflow-x:auto;white-space:pre;}

/* footer */
.style-cohere .co-footer{margin-top:80px;background:#17171c;color:#ffffff;padding:72px 0 40px;}
.style-cohere .co-footer-top{padding-bottom:56px;border-bottom:1px solid rgba(255,255,255,.14);}
.style-cohere .co-footer-coral{font-size:14px;color:#ff7759;margin:0 0 12px;}
.style-cohere .co-footer-title{font-family:'Space Grotesk','Inter',sans-serif;font-size:40px;font-weight:400;
  letter-spacing:-0.8px;margin:0 0 28px;line-height:1.1;}
.style-cohere .co-footer-bottom{display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap;padding-top:32px;}
.style-cohere .co-footer-mark{font-family:'Space Grotesk','Inter',sans-serif;font-size:16px;font-weight:500;}
.style-cohere .co-footer-note{font-size:12px;color:#93939f;margin:0;}
.style-cohere .co-footer-link{font-size:12px;color:#93939f;}
.style-cohere .co-footer-link:hover{color:#ffffff;}

@media (max-width:1024px){
  .style-cohere .co-stats-grid{grid-template-columns:repeat(3,1fr);}
  .style-cohere .co-labstats{grid-template-columns:repeat(2,1fr);}
  .style-cohere .co-dim-grid{grid-template-columns:repeat(2,1fr);}
  .style-cohere .co-task-grid{grid-template-columns:repeat(2,1fr);}
  .style-cohere .co-loop-grid{grid-template-columns:1fr;}
  .style-cohere .co-charts-grid{grid-template-columns:1fr;}
  .style-cohere .co-method-grid{grid-template-columns:1fr;}
  .style-cohere .co-nav-links{display:none;}
  .style-cohere .co-green-band{padding:48px 32px;}
  .style-cohere .co-pipe-arrow{display:none;}
}
@media (max-width:640px){
  .style-cohere .co-wrap{padding:0 20px;}
  .style-cohere .co-h1{font-size:36px;letter-spacing:-0.7px;}
  .style-cohere .co-stats-grid{grid-template-columns:repeat(2,1fr);}
  .style-cohere .co-labstats{grid-template-columns:repeat(2,1fr);}
  .style-cohere .co-dim-grid,.style-cohere .co-task-grid{grid-template-columns:1fr;}
  .style-cohere .co-bar-row{grid-template-columns:130px 1fr 48px;}
  .style-cohere .co-pale-section{padding:32px 20px;}
  .style-cohere .co-green-band{padding:32px 20px;border-radius:16px;}
  .style-cohere .co-band{padding-top:56px;}
  .style-cohere .co-hero{padding:64px 0 56px;}
  .style-cohere .co-footer-title{font-size:28px;}
}
`
