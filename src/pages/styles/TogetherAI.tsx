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
  if (v === bestN10) return 'tg-num tg-best'
  if (v === secondN10) return 'tg-num tg-second'
  return 'tg-num'
}

function stageClass(stage: string) {
  if (stage === pathwayStages[0]) return 'tg-pipe-design'
  if (stage === pathwayStages[1]) return 'tg-pipe-validation'
  return 'tg-pipe-boundary'
}

const wallUnder = longHorizon.totalExecutable - longHorizon.over30Ops

export default function TogetherAI() {
  return (
    <div className="style-together">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=JetBrains+Mono:wght@400;500&display=swap"
      />
      <style>{CSS}</style>

      {/* ============ NAV ============ */}
      <header className="tg-nav">
        <div className="tg-wrap tg-nav-inner">
          <span className="tg-wordmark">
            robochem<span className="tg-wordmark-dot">.bench</span>
          </span>
          <nav className="tg-nav-links">
            <a href="#tg-framework">Skills</a>
            <a href="#tg-leaderboard">Leaderboard</a>
            <a href="#tg-charts">Analysis</a>
            <a href="#tg-tasks">Tasks</a>
          </nav>
          <div className="tg-nav-right">
            <Link to="/" className="tg-nav-back">
              ← Back to Gallery
            </Link>
            <a href="#" className="tg-btn tg-btn-mint">
              Submit
            </a>
          </div>
        </div>
      </header>

      {/* ============ HERO (dark blueprint + gradient ribbon) ============ */}
      <section className="tg-hero">
        <div className="tg-wrap tg-hero-grid">
          <div>
            <p className="tg-eyebrow">Benchmark paper · arXiv:2607.23045</p>
            <h1 className="tg-h1">{paperMeta.title}</h1>
            <p className="tg-sub">{paperMeta.subtitle}</p>
            <p className="tg-authors">
              {paperMeta.authors.join(', ')}
              <br />
              {paperMeta.affiliation}
            </p>
            <div className="tg-btn-row">
              <a href={paperMeta.links[0].href} className="tg-btn tg-btn-mint">
                {paperMeta.links[0].label}
              </a>
              <a href={paperMeta.links[1].href} className="tg-btn tg-btn-white">
                {paperMeta.links[1].label}
              </a>
              <a href={paperMeta.links[2].href} className="tg-btn tg-btn-ghost">
                {paperMeta.links[2].label}
              </a>
              <a href={paperMeta.links[3].href} className="tg-btn tg-btn-ghost">
                {paperMeta.links[3].label}
              </a>
            </div>
          </div>
          <div className="tg-ribbon-wrap" aria-hidden="true">
            <svg viewBox="0 0 420 300" className="tg-ribbon">
              <defs>
                <linearGradient id="tg-grad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#fc4c02" />
                  <stop offset="50%" stopColor="#ef2cc1" />
                  <stop offset="100%" stopColor="#bdbbff" />
                </linearGradient>
              </defs>
              <path
                d="M-20 210 C 80 120, 150 260, 230 170 S 380 60, 450 130"
                fill="none"
                stroke="url(#tg-grad)"
                strokeWidth="34"
                strokeLinecap="round"
                opacity="0.9"
              />
              <path
                d="M-20 250 C 90 170, 160 295, 240 210 S 390 105, 450 175"
                fill="none"
                stroke="url(#tg-grad)"
                strokeWidth="18"
                strokeLinecap="round"
                opacity="0.45"
              />
              <path
                d="M-20 170 C 70 80, 140 220, 220 130 S 370 20, 450 90"
                fill="none"
                stroke="url(#tg-grad)"
                strokeWidth="10"
                strokeLinecap="round"
                opacity="0.3"
              />
            </svg>
            <div className="tg-ribbon-caption">FIG. 01 — AGENT TRAJECTORY FIELD</div>
          </div>
        </div>
      </section>

      {/* ============ STATS ============ */}
      <section className="tg-band">
        <div className="tg-wrap tg-stats-grid">
          {keyStats.map((s, i) => (
            <div key={s.label} className={i === 1 ? 'tg-stat tg-stat-mint' : 'tg-stat'}>
              <div className="tg-stat-value">{s.value}</div>
              <div className="tg-stat-label">{s.label}</div>
              <div className="tg-stat-desc">{s.description}</div>
            </div>
          ))}
        </div>
        <div className="tg-wrap tg-labstats">
          {labStats.map((s) => (
            <div key={s.label} className="tg-labstat">
              <div className="tg-labstat-value">{s.value}</div>
              <div className="tg-labstat-label">{s.label}</div>
              <div className="tg-labstat-desc">{s.description}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ============ ABSTRACT ============ */}
      <section className="tg-band">
        <div className="tg-wrap tg-narrow">
          <p className="tg-eyebrow">Abstract</p>
          <p className="tg-abstract">{abstractText}</p>
        </div>
      </section>

      {/* ============ SKILLS LIBRARY (research-card grid) ============ */}
      <section className="tg-band" id="tg-framework">
        <div className="tg-wrap">
          <p className="tg-eyebrow">The Skills Library</p>
          <h2 className="tg-h2">45 workstations, one skills library</h2>
          <div className="tg-dim-grid">
            {skillCategories.map((d, i) => (
              <div key={d.name} className="tg-dim-card">
                <div className="tg-dim-index">SKILL-0{i + 1}</div>
                <h3 className="tg-dim-name">{d.name}</h3>
                <p className="tg-dim-tagline">{d.tagline}</p>
                <ul className="tg-dim-list">
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
      <section className="tg-band">
        <div className="tg-wrap">
          <p className="tg-eyebrow">Evaluation pathway</p>
          <h2 className="tg-h2">From task receipt to physical execution</h2>
          <div className="tg-pipeline">
            {pathway.map((n, i) => (
              <Fragment key={n.node}>
                {i > 0 && <span className="tg-pipe-arrow">→</span>}
                <div
                  className={`tg-pipe-node ${stageClass(n.stage)}${n.node === 'N10' ? ' tg-pipe-final' : ''}`}
                >
                  <span className="tg-pipe-id">{n.node}</span>
                  <span className="tg-pipe-label">{n.label}</span>
                </div>
              </Fragment>
            ))}
          </div>
          <div className="tg-pipe-legend">
            {pathwayStages.map((stage) => (
              <span key={stage} className="tg-legend-item">
                <span className={`tg-pipe-swatch ${stageClass(stage)}`} />
                {stage}
              </span>
            ))}
          </div>
          <p className="tg-pipe-note">{pathwayNote}</p>
        </div>
      </section>

      {/* ============ LEADERBOARD ============ */}
      <section className="tg-band" id="tg-leaderboard">
        <div className="tg-wrap">
          <p className="tg-eyebrow">Leaderboard</p>
          <h2 className="tg-h2">Top 8 of 48 configurations, ranked by N10 executable yield</h2>
          <p className="tg-note">
            N10 Yield is the expert-adjudicated executable rate (%). <strong>Bold</strong> marks the
            best configuration, <span className="tg-second">underline</span> the runner-up.
          </p>
          <div className="tg-table-card">
            <table className="tg-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Configuration</th>
                  <th>Organization</th>
                  <th>Weights</th>
                  <th className="tg-th-num">Trials</th>
                  <th className="tg-th-num">Executable</th>
                  <th className="tg-th-num">N10 Yield</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((r) => (
                  <tr key={r.rank}>
                    <td className="tg-num tg-muted">{String(r.rank).padStart(2, '0')}</td>
                    <td className="tg-model">
                      {r.harness} × {r.model}
                    </td>
                    <td className="tg-org">{r.org}</td>
                    <td>
                      <span className={r.weights === 'open' ? 'tg-badge tg-badge-open' : 'tg-badge'}>
                        {r.weights === 'open' ? 'OPEN' : 'CLOSED'}
                      </span>
                    </td>
                    <td className="tg-td-num">
                      <span className="tg-num">{r.trials}</span>
                    </td>
                    <td className="tg-td-num">
                      <span className="tg-num">{r.executable}</span>
                    </td>
                    <td className="tg-td-num">
                      <span className={n10Class(r.n10)}>{r.n10.toFixed(1)}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="tg-table-caption">{leaderboardCaption}</p>
        </div>
      </section>

      {/* ============ CHARTS ============ */}
      <section className="tg-band" id="tg-charts">
        <div className="tg-wrap">
          <p className="tg-eyebrow">Analysis</p>
          <h2 className="tg-h2">Results at a glance</h2>
          <div className="tg-charts-grid">
            <div className="tg-chart-card tg-chart-wide">
              <h3 className="tg-chart-title">N10 executable yield — top 8 configurations</h3>
              <div className="tg-bars">
                {leaderboard.map((r) => (
                  <div key={r.rank} className="tg-bar-row">
                    <span className="tg-bar-label">
                      {r.harness} × {r.model}
                    </span>
                    <span className="tg-bar-track">
                      <span
                        className={r.rank === 1 ? 'tg-bar-fill tg-bar-top' : 'tg-bar-fill'}
                        style={{ width: `${(r.n10 / maxN10) * 100}%` }}
                      />
                    </span>
                    <span className="tg-bar-value">{r.n10.toFixed(1)}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="tg-chart-card">
              <h3 className="tg-chart-title">The long-horizon wall</h3>
              <div className="tg-wall-ratio">
                <span
                  className="tg-wall-seg tg-wall-under"
                  style={{ width: `${(wallUnder / longHorizon.totalExecutable) * 100}%` }}
                />
                <span
                  className="tg-wall-seg tg-wall-over"
                  style={{ width: `${(longHorizon.over30Ops / longHorizon.totalExecutable) * 100}%` }}
                />
              </div>
              <div className="tg-wall-meta">
                <span>{wallUnder} executable workflows ≤ 30 ops</span>
                <span>{longHorizon.over30Ops} workflows &gt; 30 ops</span>
              </div>
              <div className="tg-wall-big">
                <span className="tg-wall-num">{longHorizon.longest}</span>
                <span className="tg-wall-cap">operations in the longest executable workflow</span>
              </div>
              <p className="tg-wall-note">{longHorizon.note}</p>
            </div>
            <div className="tg-chart-card">
              <h3 className="tg-chart-title">Open vs Closed — mean N10 yield</h3>
              <div className="tg-grouped">
                {weightsAvg.map((row) => (
                  <div key={row.group} className="tg-group">
                    <div className="tg-group-bars">
                      <span
                        className={
                          row.group.startsWith('Closed') ? 'tg-gbar tg-gbar-closed' : 'tg-gbar tg-gbar-open'
                        }
                        style={{ height: `${(row.value / maxWeights) * 100}%` }}
                      >
                        <span className="tg-gbar-tip">{row.value.toFixed(1)}%</span>
                      </span>
                    </div>
                    <span className="tg-group-label">
                      {row.group.startsWith('Closed') ? 'Closed' : 'Open'} · n={row.n}
                    </span>
                  </div>
                ))}
              </div>
              <div className="tg-legend">
                <span className="tg-legend-item">
                  <span className="tg-legend-swatch" style={{ background: '#bdbbff' }} /> Open
                </span>
                <span className="tg-legend-item">
                  <span className="tg-legend-swatch" style={{ background: '#fc4c02' }} /> Closed
                </span>
              </div>
              <p className="tg-chart-note">{weightsAvgCaption}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ============ TASK DOMAINS ============ */}
      <section className="tg-band" id="tg-tasks">
        <div className="tg-wrap">
          <p className="tg-eyebrow">Task domains</p>
          <h2 className="tg-h2">32 research tasks across 4 catalysis domains</h2>
          <div className="tg-task-grid">
            {taskDomains.map((t, i) => (
              <div key={t.domain} className={i === 0 ? 'tg-task-card tg-task-hot' : 'tg-task-card'}>
                <div className="tg-task-top">
                  <span className="tg-badge">{t.domain}</span>
                  {i === 0 && <span className="tg-badge tg-badge-open">CLOSED-LOOP</span>}
                </div>
                <p className="tg-task-desc">{t.blurb}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ CLOSED-LOOP ADAPTATION ============ */}
      <section className="tg-band">
        <div className="tg-wrap">
          <p className="tg-eyebrow">Closed-loop adaptation</p>
          <h2 className="tg-h2">Five rounds of feedback — local adjustments only</h2>
          <p className="tg-note">
            Agent: {closedLoop.agent} · Task: {closedLoop.task} · {closedLoop.rounds} feedback rounds
          </p>
          <div className="tg-loop-grid">
            <div className="tg-loop-card tg-loop-yes-card">
              <h3 className="tg-loop-title">Localized adaptation observed</h3>
              <ul className="tg-loop-list">
                {closedLoop.adapted.map((a) => (
                  <li key={a}>
                    <span className="tg-loop-yes">✓</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
            <div className="tg-loop-card">
              <h3 className="tg-loop-title">Strategic redirection not observed</h3>
              <ul className="tg-loop-list">
                {closedLoop.notObserved.map((a) => (
                  <li key={a}>
                    <span className="tg-loop-no">✗</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FAILURE MODES ============ */}
      <section className="tg-band">
        <div className="tg-wrap">
          <p className="tg-eyebrow">Failure analysis</p>
          <h2 className="tg-h2">How agents fail</h2>
          <div className="tg-fail-grid">
            {failureModes.map((f) => (
              <div key={f.name} className="tg-fail-row">
                <div className="tg-fail-name">{f.name}</div>
                <p className="tg-fail-desc">{f.description}</p>
              </div>
            ))}
          </div>
          <p className="tg-fail-note">{failureNote}</p>
        </div>
      </section>

      {/* ============ METHODOLOGY + BIBTEX ============ */}
      <section className="tg-band">
        <div className="tg-wrap tg-method-grid">
          <div>
            <p className="tg-eyebrow">Methodology</p>
            <h2 className="tg-h2">How we measured</h2>
            <ul className="tg-method-list">
              {methodologyNotes.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
            <p className="tg-eyebrow tg-eyebrow-gap">Scoring rubric — multi-axis R1–R6</p>
            <ul className="tg-axes-list">
              {scoringAxes.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
            <div className="tg-formulas">
              {formulas.map((f) => (
                <code key={f} className="tg-formula">
                  {f}
                </code>
              ))}
            </div>
          </div>
          <div>
            <p className="tg-eyebrow">Cite this work</p>
            <div className="tg-code-card">
              <div className="tg-code-head">robochem.bib</div>
              <pre className="tg-bibtex">
                <code>{bibtex}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* ============ FOOTER + WORDMARK STENCIL ============ */}
      <footer className="tg-footer">
        <div className="tg-wrap tg-footer-inner">
          <div className="tg-footer-col">
            <p className="tg-eyebrow">RoboChem Bench</p>
            <p className="tg-footer-note">Style preview · Together AI DESIGN.md · Content from arXiv:2607.23045</p>
          </div>
          <Link to="/" className="tg-btn tg-btn-ghost">
            ← Back to Gallery
          </Link>
        </div>
        <div className="tg-wordmark-banner" aria-hidden="true">
          robochem.bench
        </div>
      </footer>
    </div>
  )
}

/* ---------- scoped styles ---------- */
const CSS = `
.style-together{
  background:#010120;color:#ffffff;
  font-family:'Inter','Helvetica Neue',Arial,sans-serif;
  min-height:100dvh;-webkit-font-smoothing:antialiased;
  font-feature-settings:'ss01';
}
.style-together .tg-wrap{max-width:1280px;margin:0 auto;padding:0 32px;}
.style-together .tg-narrow{max-width:820px;}
.style-together .tg-band{padding:80px 0 0;}
.style-together a{text-decoration:none;color:inherit;}
.style-together .tg-eyebrow{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;font-weight:500;
  letter-spacing:0.55px;text-transform:uppercase;color:#959494;margin:0 0 16px;}

/* nav */
.style-together .tg-nav{background:#010120;border-bottom:1px solid #26263a;position:sticky;top:0;z-index:50;}
.style-together .tg-nav-inner{height:64px;display:flex;align-items:center;justify-content:space-between;gap:24px;}
.style-together .tg-wordmark{font-size:16px;font-weight:500;letter-spacing:-0.16px;white-space:nowrap;}
.style-together .tg-wordmark-dot{color:#ef2cc1;}
.style-together .tg-nav-links{display:flex;gap:24px;}
.style-together .tg-nav-links a{font-size:16px;font-weight:400;color:#ffffff;}
.style-together .tg-nav-links a:hover{color:#bdbbff;}
.style-together .tg-nav-right{display:flex;align-items:center;gap:16px;flex:none;}
.style-together .tg-nav-back{font-size:14px;color:#959494;white-space:nowrap;}
.style-together .tg-nav-back:hover{color:#ffffff;}

/* buttons — mono caps, 4px radius */
.style-together .tg-btn{display:inline-flex;align-items:center;padding:10px 24px;border-radius:4px;
  font-family:'JetBrains Mono',ui-monospace,monospace;font-size:14px;font-weight:500;letter-spacing:0.08px;
  text-transform:uppercase;cursor:pointer;white-space:nowrap;border:1px solid transparent;}
.style-together .tg-btn-mint{background:#c8f6f9;color:#010120;}
.style-together .tg-btn-white{background:#ffffff;color:#010120;}
.style-together .tg-btn-ghost{background:#313641;color:#ffffff;}
.style-together .tg-btn-row{display:flex;flex-wrap:wrap;gap:12px;margin-top:36px;}

/* hero — blueprint grid */
.style-together .tg-hero{
  padding:80px 0;
  background-image:
    linear-gradient(rgba(189,187,255,.06) 1px,transparent 1px),
    linear-gradient(90deg,rgba(189,187,255,.06) 1px,transparent 1px);
  background-size:48px 48px;
  border-bottom:1px solid #26263a;
}
.style-together .tg-hero-grid{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;}
.style-together .tg-h1{font-size:56px;font-weight:500;line-height:1.1;letter-spacing:-1.7px;margin:0 0 20px;color:#ffffff;}
.style-together .tg-sub{font-size:18px;font-weight:400;line-height:1.4;letter-spacing:-0.18px;color:#c9c9d6;margin:0 0 16px;}
.style-together .tg-authors{font-size:14px;line-height:1.6;color:#959494;margin:0;}
.style-together .tg-h2{font-size:36px;font-weight:500;line-height:1.15;letter-spacing:-0.7px;margin:0 0 12px;color:#ffffff;}
.style-together .tg-note{font-size:14px;color:#959494;margin:0 0 24px;}
.style-together .tg-ribbon-wrap{position:relative;}
.style-together .tg-ribbon{width:100%;height:auto;display:block;}
.style-together .tg-ribbon-caption{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:10px;font-weight:400;
  letter-spacing:0.5px;color:#959494;text-align:right;margin-top:8px;}

/* stats */
.style-together .tg-stats-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:16px;}
.style-together .tg-stat{background:#010120;border:1px solid #26263a;border-radius:4px;padding:24px;}
.style-together .tg-stat-mint{background:#c8f6f9;color:#010120;border-color:#c8f6f9;}
.style-together .tg-stat-value{font-size:32px;font-weight:500;letter-spacing:-0.6px;line-height:1.1;}
.style-together .tg-stat-label{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;font-weight:500;
  letter-spacing:0.55px;text-transform:uppercase;color:#959494;margin-top:12px;}
.style-together .tg-stat-mint .tg-stat-label{color:#010120;opacity:.6;}
.style-together .tg-stat-desc{font-size:13px;color:#959494;margin-top:6px;}
.style-together .tg-stat-mint .tg-stat-desc{color:#010120;opacity:.7;}

/* lab stats (secondary band) */
.style-together .tg-labstats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:16px;}
.style-together .tg-labstat{background:#0a0a2e;border:1px solid #26263a;border-radius:4px;padding:16px 20px;}
.style-together .tg-labstat-value{font-size:24px;font-weight:500;letter-spacing:-0.5px;line-height:1.1;color:#c8f6f9;}
.style-together .tg-labstat-label{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:10px;font-weight:500;
  letter-spacing:0.55px;text-transform:uppercase;color:#959494;margin-top:8px;}
.style-together .tg-labstat-desc{font-size:12px;color:#959494;margin-top:4px;}

/* abstract */
.style-together .tg-abstract{font-size:22px;font-weight:400;line-height:1.5;letter-spacing:-0.2px;color:#e6e6f0;margin:0;}

/* dimensions */
.style-together .tg-dim-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:32px;}
.style-together .tg-dim-card{background:#010120;border:1px solid #313641;border-radius:4px;padding:24px;}
.style-together .tg-dim-index{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;font-weight:500;
  letter-spacing:0.55px;color:#ef2cc1;margin-bottom:16px;}
.style-together .tg-dim-name{font-size:22px;font-weight:500;line-height:1.15;letter-spacing:-0.22px;margin:0 0 6px;color:#ffffff;}
.style-together .tg-dim-tagline{font-size:13px;color:#959494;margin:0 0 16px;}
.style-together .tg-dim-list{margin:0;padding:0;list-style:none;}
.style-together .tg-dim-list li{font-size:14px;line-height:1.5;color:#c9c9d6;padding:9px 0 9px 16px;position:relative;border-top:1px solid #26263a;}
.style-together .tg-dim-list li::before{content:'';position:absolute;left:0;top:16px;width:6px;height:6px;background:#fc4c02;border-radius:1px;}

/* pathway pipeline */
.style-together .tg-pipeline{display:flex;flex-wrap:wrap;align-items:stretch;gap:10px;margin-top:32px;}
.style-together .tg-pipe-node{background:#010120;border:1px solid #313641;border-top:3px solid #bdbbff;
  border-radius:4px;padding:14px 16px;flex:1;min-width:140px;display:flex;flex-direction:column;gap:6px;}
.style-together .tg-pipe-node.tg-pipe-validation{border-top-color:#fc4c02;}
.style-together .tg-pipe-node.tg-pipe-boundary{border-top-color:#c8f6f9;}
.style-together .tg-pipe-id{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:12px;font-weight:500;color:#bdbbff;}
.style-together .tg-pipe-validation .tg-pipe-id{color:#fc4c02;}
.style-together .tg-pipe-boundary .tg-pipe-id{color:#c8f6f9;}
.style-together .tg-pipe-label{font-size:13px;line-height:1.45;color:#c9c9d6;}
.style-together .tg-pipe-arrow{display:flex;align-items:center;color:#5b5b70;font-size:18px;flex:none;}
.style-together .tg-pipe-final{background:linear-gradient(135deg,#fc4c02,#ef2cc1);border-color:transparent;}
.style-together .tg-pipe-final .tg-pipe-id{color:#ffffff;}
.style-together .tg-pipe-final .tg-pipe-label{color:#ffffff;font-weight:500;}
.style-together .tg-pipe-legend{display:flex;flex-wrap:wrap;gap:18px;margin-top:18px;}
.style-together .tg-pipe-swatch{width:10px;height:10px;border-radius:2px;display:inline-block;background:#bdbbff;}
.style-together .tg-pipe-swatch.tg-pipe-validation{background:#fc4c02;}
.style-together .tg-pipe-swatch.tg-pipe-boundary{background:#c8f6f9;}
.style-together .tg-pipe-note{font-size:13px;line-height:1.6;color:#959494;margin:18px 0 0;max-width:860px;}

/* leaderboard */
.style-together .tg-table-card{border:1px solid #26263a;border-radius:4px;overflow:auto;}
.style-together .tg-table{width:100%;border-collapse:collapse;min-width:880px;}
.style-together .tg-table th{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;font-weight:500;
  letter-spacing:0.55px;text-transform:uppercase;color:#959494;text-align:left;padding:14px 16px;
  border-bottom:1px solid #26263a;background:#0a0a2e;white-space:nowrap;}
.style-together .tg-table td{padding:13px 16px;border-bottom:1px solid #26263a;font-size:16px;color:#e6e6f0;white-space:nowrap;}
.style-together .tg-table tbody tr:last-child td{border-bottom:none;}
.style-together .tg-table tbody tr:hover td{background:#0a0a2e;}
.style-together .tg-th-num,.style-together .tg-td-num{text-align:right;}
.style-together .tg-model{font-weight:500;}
.style-together .tg-org{color:#959494;font-size:14px;}
.style-together .tg-num{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:14px;}
.style-together .tg-best{font-weight:500;color:#c8f6f9;}
.style-together .tg-second{text-decoration:underline;text-underline-offset:3px;color:#ffffff;}
.style-together .tg-muted{color:#5b5b70;}
.style-together .tg-badge{display:inline-block;background:#313641;color:#ffffff;
  font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;font-weight:500;letter-spacing:0.55px;
  padding:4px 10px;border-radius:4px;}
.style-together .tg-badge-open{background:rgba(189,187,255,.16);color:#bdbbff;}
.style-together .tg-table-caption{font-size:13px;color:#959494;margin:14px 0 0;}

/* charts */
.style-together .tg-charts-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:32px;}
.style-together .tg-chart-card{background:#010120;border:1px solid #26263a;border-radius:4px;padding:24px;}
.style-together .tg-chart-wide{grid-column:1 / -1;}
.style-together .tg-chart-title{font-size:18px;font-weight:500;letter-spacing:-0.18px;color:#ffffff;margin:0 0 20px;}
.style-together .tg-chart-note{font-size:12px;color:#959494;margin:14px 0 0;text-align:center;}
.style-together .tg-bars{display:flex;flex-direction:column;gap:8px;}
.style-together .tg-bar-row{display:grid;grid-template-columns:240px 1fr 56px;gap:12px;align-items:center;}
.style-together .tg-bar-label{font-size:13px;color:#c9c9d6;text-align:right;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.style-together .tg-bar-track{display:block;height:14px;background:#0a0a2e;border-radius:2px;overflow:hidden;}
.style-together .tg-bar-fill{display:block;height:100%;background:#313641;border-radius:2px;}
.style-together .tg-bar-top{background:linear-gradient(90deg,#fc4c02,#ef2cc1,#bdbbff);}
.style-together .tg-bar-value{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:12px;color:#959494;}
.style-together .tg-legend{display:flex;flex-wrap:wrap;gap:14px;margin-top:16px;justify-content:center;}
.style-together .tg-legend-item{display:inline-flex;align-items:center;gap:6px;font-size:12px;color:#959494;}
.style-together .tg-legend-swatch{width:10px;height:10px;border-radius:2px;display:inline-block;}
.style-together .tg-grouped{display:flex;justify-content:space-around;align-items:flex-end;height:240px;margin-top:8px;}
.style-together .tg-group{display:flex;flex-direction:column;align-items:center;gap:10px;height:100%;justify-content:flex-end;}
.style-together .tg-group-bars{display:flex;align-items:flex-end;gap:8px;height:200px;}
.style-together .tg-gbar{position:relative;display:block;width:52px;border-radius:2px 2px 0 0;}
.style-together .tg-gbar-open{background:#bdbbff;}
.style-together .tg-gbar-closed{background:#fc4c02;}
.style-together .tg-gbar-tip{position:absolute;top:-20px;left:50%;transform:translateX(-50%);
  font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;color:#959494;white-space:nowrap;}
.style-together .tg-group-label{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;letter-spacing:0.55px;text-transform:uppercase;color:#959494;}

/* long-horizon wall */
.style-together .tg-wall-ratio{display:flex;height:22px;border-radius:2px;overflow:hidden;background:#0a0a2e;}
.style-together .tg-wall-seg{display:block;height:100%;}
.style-together .tg-wall-under{background:#313641;}
.style-together .tg-wall-over{background:linear-gradient(90deg,#fc4c02,#ef2cc1);min-width:10px;}
.style-together .tg-wall-meta{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;
  font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;color:#959494;margin-top:10px;}
.style-together .tg-wall-big{display:flex;align-items:baseline;gap:16px;margin:30px 0 14px;}
.style-together .tg-wall-num{font-size:72px;font-weight:500;line-height:1;letter-spacing:-2px;
  background:linear-gradient(90deg,#fc4c02,#ef2cc1,#bdbbff);-webkit-background-clip:text;background-clip:text;color:transparent;}
.style-together .tg-wall-cap{font-size:14px;line-height:1.4;color:#c9c9d6;max-width:220px;}
.style-together .tg-wall-note{font-size:13px;line-height:1.55;color:#959494;margin:0;}

/* tasks */
.style-together .tg-task-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:32px;}
.style-together .tg-task-card{background:#010120;border:1px solid #313641;border-radius:4px;padding:24px;display:flex;flex-direction:column;gap:14px;}
.style-together .tg-task-hot{border-color:#ef2cc1;}
.style-together .tg-task-top{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap;}
.style-together .tg-task-desc{font-size:14px;line-height:1.5;color:#c9c9d6;margin:0;flex:1;}

/* closed-loop */
.style-together .tg-loop-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
.style-together .tg-loop-card{border:1px solid #26263a;border-radius:4px;padding:24px;background:#010120;}
.style-together .tg-loop-yes-card{background:#0a0a2e;border-color:#313641;}
.style-together .tg-loop-title{font-size:18px;font-weight:500;letter-spacing:-0.18px;color:#ffffff;margin:0;}
.style-together .tg-loop-list{margin:14px 0 0;padding:0;list-style:none;}
.style-together .tg-loop-list li{font-size:14px;line-height:1.5;color:#c9c9d6;padding:10px 0;border-top:1px solid #26263a;}
.style-together .tg-loop-yes{font-family:'JetBrains Mono',ui-monospace,monospace;font-weight:600;color:#c8f6f9;margin-right:10px;}
.style-together .tg-loop-no{font-family:'JetBrains Mono',ui-monospace,monospace;font-weight:600;color:#ef2cc1;margin-right:10px;}

/* failure modes */
.style-together .tg-fail-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:32px;}
.style-together .tg-fail-row{border:1px solid #26263a;border-radius:4px;padding:24px;}
.style-together .tg-fail-name{font-size:16px;font-weight:500;color:#ffffff;margin-bottom:12px;}
.style-together .tg-fail-desc{font-size:13px;line-height:1.5;color:#959494;margin:0;}
.style-together .tg-fail-note{font-size:13px;line-height:1.6;color:#c9c9d6;margin:24px 0 0;padding:16px 20px;
  border:1px solid #313641;border-left:3px solid #ef2cc1;border-radius:4px;}

/* methodology */
.style-together .tg-method-grid{display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:start;}
.style-together .tg-method-list{margin:24px 0 0;padding:0;list-style:none;}
.style-together .tg-method-list li{font-size:16px;line-height:1.5;color:#c9c9d6;padding:14px 0 14px 22px;position:relative;border-bottom:1px solid #26263a;}
.style-together .tg-method-list li::before{content:'';position:absolute;left:0;top:22px;width:8px;height:8px;background:#bdbbff;border-radius:1px;}
.style-together .tg-eyebrow-gap{margin-top:32px;}
.style-together .tg-axes-list{margin:0;padding:0;list-style:none;display:grid;grid-template-columns:1fr 1fr;gap:8px;}
.style-together .tg-axes-list li{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:12px;color:#c9c9d6;
  background:#0a0a2e;border:1px solid #26263a;border-radius:4px;padding:8px 12px;}
.style-together .tg-formulas{display:flex;flex-direction:column;gap:8px;margin-top:20px;}
.style-together .tg-formula{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:13px;color:#c8f6f9;
  background:#0a0a2e;border:1px solid #26263a;border-radius:4px;padding:10px 14px;}
.style-together .tg-code-card{background:#0a0a2e;border:1px solid #26263a;border-radius:4px;overflow:hidden;}
.style-together .tg-code-head{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:10px;letter-spacing:0.5px;
  text-transform:uppercase;color:#959494;padding:12px 16px;border-bottom:1px solid #26263a;}
.style-together .tg-bibtex{margin:0;padding:20px;font-family:'JetBrains Mono',ui-monospace,monospace;font-size:13px;
  line-height:1.6;color:#c8f6f9;overflow-x:auto;white-space:pre;}

/* footer + wordmark */
.style-together .tg-footer{margin-top:80px;border-top:1px solid #26263a;}
.style-together .tg-footer-inner{display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap;padding:48px 32px;}
.style-together .tg-footer-note{font-size:14px;color:#959494;margin:0;}
.style-together .tg-wordmark-banner{
  font-size:clamp(48px,10.5vw,150px);font-weight:500;letter-spacing:-3px;line-height:1;
  color:#17173d;text-align:center;padding:24px 0 40px;white-space:nowrap;overflow:hidden;
  border-top:1px solid #26263a;user-select:none;
}

@media (max-width:1024px){
  .style-together .tg-hero-grid{grid-template-columns:1fr;}
  .style-together .tg-stats-grid{grid-template-columns:repeat(3,1fr);}
  .style-together .tg-labstats{grid-template-columns:repeat(2,1fr);}
  .style-together .tg-dim-grid{grid-template-columns:repeat(2,1fr);}
  .style-together .tg-task-grid{grid-template-columns:repeat(2,1fr);}
  .style-together .tg-loop-grid{grid-template-columns:1fr;}
  .style-together .tg-fail-grid{grid-template-columns:repeat(2,1fr);}
  .style-together .tg-charts-grid{grid-template-columns:1fr;}
  .style-together .tg-method-grid{grid-template-columns:1fr;}
  .style-together .tg-nav-links{display:none;}
  .style-together .tg-pipe-arrow{display:none;}
}
@media (max-width:640px){
  .style-together .tg-wrap{padding:0 16px;}
  .style-together .tg-h1{font-size:32px;letter-spacing:-1px;}
  .style-together .tg-stats-grid{grid-template-columns:repeat(2,1fr);}
  .style-together .tg-labstats{grid-template-columns:repeat(2,1fr);}
  .style-together .tg-dim-grid,.style-together .tg-task-grid,.style-together .tg-fail-grid{grid-template-columns:1fr;}
  .style-together .tg-bar-row{grid-template-columns:130px 1fr 48px;}
  .style-together .tg-band{padding-top:56px;}
  .style-together .tg-hero{padding:56px 0;}
}
`
