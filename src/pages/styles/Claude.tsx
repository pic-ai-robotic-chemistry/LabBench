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
import type { LeaderboardRow } from '@/data/benchmark'

const N10_SORTED = [...leaderboard].sort((a, b) => b.n10 - a.n10)
const N10_BEST = N10_SORTED[0].n10
const N10_SECOND = N10_SORTED[1].n10

function n10Class(v: number) {
  if (v === N10_BEST) return 'cl-num cl-best'
  if (v === N10_SECOND) return 'cl-num cl-second'
  return 'cl-num'
}

export default function Claude() {
  const maxN10 = leaderboard[0].n10
  return (
    <div className="style-claude">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
      />
      <style>{CSS}</style>

      {/* ── Nav ─────────────────────────────────────────── */}
      <nav className="cl-nav">
        <div className="cl-nav-inner">
          <Link to="/" className="cl-back">
            ← Back to Gallery
          </Link>
          <div className="cl-brand">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z"
                fill="#141413"
              />
            </svg>
            <span className="cl-brand-name">RoboChem Bench</span>
          </div>
          <div className="cl-nav-links">
            <a href="#cl-board">Leaderboard</a>
            <a href="#cl-tasks">Tasks</a>
            <a href="#cl-cite">Cite</a>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────── */}
      <header className="cl-hero">
        <div className="cl-container">
          <span className="cl-badge-coral">Benchmark · 2026</span>
          <h1 className="cl-h1">{paperMeta.title}</h1>
          <p className="cl-sub">{paperMeta.subtitle}</p>
          <p className="cl-authors">{paperMeta.authors.join(', ')}</p>
          <p className="cl-affil">{paperMeta.affiliation}</p>
          <div className="cl-btn-row">
            {paperMeta.links.map((l, i) => (
              <a key={l.label} href={l.href} className={i === 0 ? 'cl-btn cl-btn-primary' : 'cl-btn cl-btn-secondary'}>
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </header>

      {/* ── Stats band ──────────────────────────────────── */}
      <section className="cl-stats">
        <div className="cl-container">
          <div className="cl-stats-grid">
            {keyStats.map((s) => (
              <div key={s.label} className="cl-stat">
                <div className="cl-stat-value">{s.value}</div>
                <div className="cl-stat-label">{s.label}</div>
                <div className="cl-stat-desc">{s.description}</div>
              </div>
            ))}
          </div>
          <div className="cl-labstats">
            {labStats.map((s) => (
              <div key={s.label} className="cl-labstat">
                <div className="cl-labstat-value">{s.value}</div>
                <div className="cl-labstat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Abstract ────────────────────────────────────── */}
      <section className="cl-section">
        <div className="cl-container cl-narrow">
          <p className="cl-eyebrow">Abstract</p>
          <p className="cl-abstract">{abstractText}</p>
        </div>
      </section>

      {/* ── Skills Library ──────────────────────────────── */}
      <section className="cl-section cl-section-soft">
        <div className="cl-container">
          <p className="cl-eyebrow">The Skills Library</p>
          <h2 className="cl-h2">45 workstations, one skills library</h2>
          <div className="cl-dim-grid">
            {skillCategories.map((d) => (
              <div key={d.name} className="cl-card">
                <h3 className="cl-card-title">{d.name}</h3>
                <p className="cl-card-tagline">{d.tagline}</p>
                <ul className="cl-list">
                  {d.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Evaluation pathway N1 → N10 ─────────────────── */}
      <section className="cl-section">
        <div className="cl-container">
          <p className="cl-eyebrow">Evaluation Pathway</p>
          <h2 className="cl-h2">From task receipt to physical execution</h2>
          <div className="cl-path">
            {pathwayStages.map((stage, si) => (
              <Fragment key={stage}>
                {si > 0 && <span className="cl-path-arrow cl-path-arrow-big">→</span>}
                <div className={`cl-path-stage cl-path-stage-${si}`}>
                  <p className="cl-path-stage-name">{stage}</p>
                  <div className="cl-path-flow">
                    {pathway
                      .filter((n) => n.stage === stage)
                      .map((n, i) => (
                        <Fragment key={n.node}>
                          {i > 0 && <span className="cl-path-arrow">→</span>}
                          <div className={n.node === 'N10' ? 'cl-path-node cl-path-node-hl' : 'cl-path-node'}>
                            <span className="cl-path-node-id">{n.node}</span>
                            <span className="cl-path-node-label">{n.label}</span>
                          </div>
                        </Fragment>
                      ))}
                  </div>
                </div>
              </Fragment>
            ))}
          </div>
          <p className="cl-path-note">{pathwayNote}</p>
        </div>
      </section>

      {/* ── Leaderboard ─────────────────────────────────── */}
      <section className="cl-section" id="cl-board">
        <div className="cl-container">
          <p className="cl-eyebrow">Leaderboard</p>
          <h2 className="cl-h2">48 configurations, ranked by N10 yield</h2>
          <p className="cl-section-note">
            N10 executable yield (%). <strong>Bold</strong> marks the best;{' '}
            <span className="cl-underline-demo">underline</span> marks runner-up.
          </p>
          <div className="cl-table-wrap">
            <table className="cl-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Configuration</th>
                  <th>Organization</th>
                  <th>Weights</th>
                  <th>Trials</th>
                  <th>Executable</th>
                  <th>N10 Yield</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((r: LeaderboardRow) => (
                  <tr key={r.rank}>
                    <td className="cl-rank">{r.rank}</td>
                    <td className="cl-model">
                      {r.harness} × {r.model}
                    </td>
                    <td className="cl-org">{r.org}</td>
                    <td>
                      <span className={r.weights === 'open' ? 'cl-badge cl-badge-open' : 'cl-badge cl-badge-closed'}>
                        {r.weights === 'open' ? 'Open' : 'Closed'}
                      </span>
                    </td>
                    <td className="cl-num">{r.trials}</td>
                    <td className="cl-num">{r.executable}</td>
                    <td className={n10Class(r.n10)}>{r.n10.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="cl-table-caption">{leaderboardCaption}</p>
        </div>
      </section>

      {/* ── Charts ──────────────────────────────────────── */}
      <section className="cl-section cl-section-soft">
        <div className="cl-container">
          <p className="cl-eyebrow">Results in Brief</p>
          <h2 className="cl-h2">Where the frontier stands</h2>

          <div className="cl-chart-block">
            <h3 className="cl-chart-title">N10 executable yield — top 8 configurations</h3>
            <div className="cl-bars">
              {leaderboard.map((r) => (
                <div key={r.rank} className="cl-bar-row">
                  <span className="cl-bar-label">
                    {r.harness} × {r.model}
                  </span>
                  <div className="cl-bar-track">
                    <div className="cl-bar-fill" style={{ width: `${(r.n10 / maxN10) * 100}%` }} />
                  </div>
                  <span className="cl-bar-value">{r.n10.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="cl-chart-duo">
            <div className="cl-chart-block">
              <h3 className="cl-chart-title">The long-horizon wall</h3>
              <div className="cl-horizon">
                <div className="cl-horizon-big">
                  <span className="cl-horizon-num">{longHorizon.longest}</span>
                  <span className="cl-horizon-cap">operations in the longest executable workflow</span>
                </div>
                <div className="cl-horizon-body">
                  <div className="cl-ratio">
                    <div
                      className="cl-ratio-in"
                      style={{
                        width: `${((longHorizon.totalExecutable - longHorizon.over30Ops) / longHorizon.totalExecutable) * 100}%`,
                      }}
                    />
                    <div
                      className="cl-ratio-out"
                      style={{ width: `${(longHorizon.over30Ops / longHorizon.totalExecutable) * 100}%` }}
                    />
                  </div>
                  <div className="cl-horizon-legend">
                    <span>
                      <span className="cl-dot" style={{ background: '#5db8a6' }} />
                      {longHorizon.totalExecutable - longHorizon.over30Ops} workflows ≤ 30 operations
                    </span>
                    <span>
                      <span className="cl-dot" style={{ background: '#cc785c' }} />
                      {longHorizon.over30Ops} workflows &gt; 30 operations
                    </span>
                  </div>
                  <p className="cl-horizon-note">{longHorizon.note}</p>
                </div>
              </div>
            </div>

            <div className="cl-chart-block">
              <h3 className="cl-chart-title">Open vs closed weights — mean N10 yield</h3>
              <div className="cl-wavg">
                {weightsAvg.map((w, i) => (
                  <div key={w.group} className="cl-wavg-col">
                    <span className="cl-wavg-val">{w.value.toFixed(1)}%</span>
                    <div className="cl-wavg-track">
                      <div
                        className={i === 0 ? 'cl-wavg-fill cl-wavg-closed' : 'cl-wavg-fill cl-wavg-open'}
                        style={{ height: `${(w.value / 16) * 100}%` }}
                      />
                    </div>
                    <span className="cl-wavg-label">{w.group}</span>
                    <span className="cl-wavg-n">{w.n} configurations</span>
                  </div>
                ))}
              </div>
              <p className="cl-chart-note">{weightsAvgCaption}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Task domains ────────────────────────────────── */}
      <section className="cl-section" id="cl-tasks">
        <div className="cl-container">
          <p className="cl-eyebrow">Task Domains</p>
          <h2 className="cl-h2">32 research tasks across four catalysis domains</h2>
          <div className="cl-dim-grid">
            {taskDomains.map((t) => (
              <div key={t.domain} className={t.domain === 'Electrocatalysis' ? 'cl-card cl-card-accent' : 'cl-card'}>
                <span className="cl-badge-pill">{t.domain}</span>
                <p className="cl-task-desc">{t.blurb}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Closed-loop adaptation ──────────────────────── */}
      <section className="cl-section cl-section-soft">
        <div className="cl-container">
          <p className="cl-eyebrow">Closed-Loop Adaptation</p>
          <h2 className="cl-h2">Five rounds of feedback</h2>
          <p className="cl-section-note">
            Agent: <strong>{closedLoop.agent}</strong> · Task: {closedLoop.task} · {closedLoop.rounds} feedback rounds
          </p>
          <div className="cl-loop-grid">
            <div className="cl-loop-col">
              <h3 className="cl-loop-title">Localized adaptation observed</h3>
              <ul className="cl-loop-list">
                {closedLoop.adapted.map((a) => (
                  <li key={a}>
                    <span className="cl-loop-mark cl-loop-yes">✓</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
            <div className="cl-loop-col">
              <h3 className="cl-loop-title">Strategic redirection not observed</h3>
              <ul className="cl-loop-list">
                {closedLoop.notObserved.map((a) => (
                  <li key={a}>
                    <span className="cl-loop-mark cl-loop-no">✗</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Failure modes ───────────────────────────────── */}
      <section className="cl-section">
        <div className="cl-container">
          <p className="cl-eyebrow">Failure Analysis</p>
          <h2 className="cl-h2">How agents break</h2>
          <div className="cl-fail-grid">
            {failureModes.map((f) => (
              <div key={f.name} className="cl-fail">
                <span className="cl-fail-name">{f.name}</span>
                <p className="cl-fail-desc">{f.description}</p>
              </div>
            ))}
          </div>
          <p className="cl-fail-note">{failureNote}</p>
        </div>
      </section>

      {/* ── Methodology + BibTeX (dark band) ────────────── */}
      <section className="cl-dark" id="cl-cite">
        <div className="cl-container cl-dark-grid">
          <div>
            <p className="cl-eyebrow cl-eyebrow-dark">Methodology</p>
            <h2 className="cl-h2 cl-h2-dark">Measured, not vibes</h2>
            <p className="cl-method-sub">Multi-axis rubric</p>
            <ul className="cl-list cl-list-dark">
              {scoringAxes.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
            <div className="cl-formulas">
              {formulas.map((f) => (
                <code key={f} className="cl-formula">
                  {f}
                </code>
              ))}
            </div>
            <ul className="cl-list cl-list-dark">
              {methodologyNotes.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
          <div className="cl-code-card">
            <div className="cl-code-head">
              <span className="cl-code-dot" />
              <span className="cl-code-dot" />
              <span className="cl-code-dot" />
              <span className="cl-code-title">robochem-bench.bib</span>
            </div>
            <pre className="cl-code">{bibtex}</pre>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="cl-footer">
        <div className="cl-container">
          <div className="cl-footer-brand">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M12 2 L14 10 L22 12 L14 14 L12 22 L10 14 L2 12 L10 10 Z" fill="#faf9f5" />
            </svg>
            RoboChem Bench
          </div>
          <p>Style preview · Claude DESIGN.md · Content from arXiv:2607.23045</p>
          <p className="cl-footer-fine">Built with the Claude DESIGN.md · Style preview for RoboChem Bench</p>
        </div>
      </footer>
    </div>
  )
}

const CSS = `
.style-claude {
  background: #faf9f5;
  color: #141413;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 16px;
  line-height: 1.55;
  min-height: 100dvh;
}
.style-claude .cl-container { max-width: 1200px; margin: 0 auto; padding: 0 32px; }
.style-claude .cl-narrow { max-width: 760px; }

/* nav */
.style-claude .cl-nav { background: #faf9f5; border-bottom: 1px solid #e6dfd8; position: sticky; top: 0; z-index: 50; }
.style-claude .cl-nav-inner { max-width: 1200px; margin: 0 auto; padding: 0 32px; height: 64px; display: flex; align-items: center; gap: 24px; }
.style-claude .cl-back { font-size: 14px; font-weight: 500; color: #141413; text-decoration: none; }
.style-claude .cl-back:hover { color: #cc785c; }
.style-claude .cl-brand { display: flex; align-items: center; gap: 8px; margin-left: auto; }
.style-claude .cl-brand-name { font-size: 14px; font-weight: 600; letter-spacing: 0.2px; }
.style-claude .cl-nav-links { display: flex; gap: 20px; }
.style-claude .cl-nav-links a { font-size: 14px; font-weight: 500; color: #6c6a64; text-decoration: none; }
.style-claude .cl-nav-links a:hover { color: #141413; }

/* hero */
.style-claude .cl-hero { padding: 96px 0 80px; }
.style-claude .cl-h1 {
  font-family: 'Cormorant Garamond', 'Tiempos Headline', Georgia, serif;
  font-size: 56px; font-weight: 500; line-height: 1.08; letter-spacing: -1.2px;
  margin: 20px 0 0; max-width: 900px; color: #141413;
}
.style-claude .cl-sub { font-size: 20px; line-height: 1.5; color: #3d3d3a; max-width: 720px; margin: 24px 0 0; }
.style-claude .cl-authors { font-size: 14px; color: #6c6a64; margin: 28px 0 0; max-width: 820px; }
.style-claude .cl-affil { font-size: 13px; color: #8e8b82; margin: 6px 0 0; }
.style-claude .cl-btn-row { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 32px; }
.style-claude .cl-btn {
  display: inline-flex; align-items: center; height: 40px; padding: 0 20px;
  border-radius: 8px; font-size: 14px; font-weight: 500; text-decoration: none;
}
.style-claude .cl-btn-primary { background: #cc785c; color: #ffffff; }
.style-claude .cl-btn-primary:active { background: #a9583e; }
.style-claude .cl-btn-secondary { background: #faf9f5; color: #141413; border: 1px solid #e6dfd8; }
.style-claude .cl-badge-coral {
  display: inline-block; background: #cc785c; color: #fff; font-size: 12px; font-weight: 500;
  letter-spacing: 1.5px; text-transform: uppercase; padding: 4px 12px; border-radius: 9999px;
}

/* stats */
.style-claude .cl-stats { background: #f5f0e8; border-top: 1px solid #ebe6df; border-bottom: 1px solid #ebe6df; padding: 48px 0; }
.style-claude .cl-stats-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 24px; }
.style-claude .cl-stat-value {
  font-family: 'Cormorant Garamond', Georgia, serif; font-size: 44px; font-weight: 500;
  letter-spacing: -0.5px; line-height: 1.1; color: #141413;
}
.style-claude .cl-stat-label { font-size: 14px; font-weight: 500; color: #252523; margin-top: 8px; }
.style-claude .cl-stat-desc { font-size: 13px; color: #6c6a64; margin-top: 4px; }

/* lab capability secondary band */
.style-claude .cl-labstats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-top: 36px; padding-top: 28px; border-top: 1px solid #ebe6df; }
.style-claude .cl-labstat-value {
  font-family: 'Cormorant Garamond', Georgia, serif; font-size: 26px; font-weight: 500;
  letter-spacing: -0.3px; line-height: 1.1; color: #141413;
}
.style-claude .cl-labstat-label { font-size: 12px; font-weight: 500; letter-spacing: 1px; text-transform: uppercase; color: #6c6a64; margin-top: 6px; }

/* sections */
.style-claude .cl-section { padding: 96px 0; }
.style-claude .cl-section-soft { background: #f5f0e8; }
.style-claude .cl-eyebrow {
  font-size: 12px; font-weight: 500; letter-spacing: 1.5px; text-transform: uppercase;
  color: #cc785c; margin: 0 0 12px;
}
.style-claude .cl-h2 {
  font-family: 'Cormorant Garamond', Georgia, serif; font-size: 40px; font-weight: 500;
  line-height: 1.12; letter-spacing: -0.8px; margin: 0 0 32px; color: #141413;
}
.style-claude .cl-h2-dark { color: #faf9f5; }
.style-claude .cl-eyebrow-dark { color: #e8a55a; }
.style-claude .cl-section-note { font-size: 14px; color: #6c6a64; margin: -16px 0 24px; }
.style-claude .cl-underline-demo { text-decoration: underline; text-underline-offset: 3px; }
.style-claude .cl-abstract {
  font-family: 'Cormorant Garamond', Georgia, serif; font-size: 26px; font-weight: 500;
  line-height: 1.45; color: #252523; margin: 0;
}

/* cards */
.style-claude .cl-dim-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
.style-claude .cl-card { background: #efe9de; border-radius: 12px; padding: 32px; }
.style-claude .cl-card-accent { outline: 2px solid #cc785c; outline-offset: -2px; }
.style-claude .cl-card-title { font-size: 18px; font-weight: 500; margin: 0 0 6px; color: #141413; }
.style-claude .cl-card-tagline { font-size: 14px; color: #6c6a64; margin: 0 0 16px; }
.style-claude .cl-list { margin: 0; padding: 0; list-style: none; }
.style-claude .cl-list li { font-size: 15px; color: #3d3d3a; padding: 6px 0 6px 20px; position: relative; }
.style-claude .cl-list li::before { content: ''; position: absolute; left: 0; top: 14px; width: 8px; height: 8px; border-radius: 50%; background: #cc785c; }
.style-claude .cl-list-dark li { color: #a09d96; }
.style-claude .cl-list-dark li::before { background: #e8a55a; }

/* pathway */
.style-claude .cl-path { display: flex; align-items: stretch; gap: 12px; flex-wrap: wrap; }
.style-claude .cl-path-stage { flex: 1 1 240px; background: #f5f0e8; border: 1px solid #ebe6df; border-radius: 12px; padding: 20px; }
.style-claude .cl-path-stage-name { font-size: 12px; font-weight: 500; letter-spacing: 1.5px; text-transform: uppercase; margin: 0 0 14px; }
.style-claude .cl-path-stage-0 .cl-path-stage-name { color: #cc785c; }
.style-claude .cl-path-stage-1 .cl-path-stage-name { color: #2f7a6b; }
.style-claude .cl-path-stage-2 .cl-path-stage-name { color: #9a6b1f; }
.style-claude .cl-path-flow { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.style-claude .cl-path-node { background: #faf9f5; border: 1px solid #e6dfd8; border-radius: 8px; padding: 10px 12px; min-width: 96px; }
.style-claude .cl-path-node-id { display: block; font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 500; color: #cc785c; }
.style-claude .cl-path-node-label { display: block; font-size: 13px; color: #3d3d3a; margin-top: 4px; line-height: 1.35; }
.style-claude .cl-path-node-hl { border: 2px solid #cc785c; background: #efe9de; }
.style-claude .cl-path-node-hl .cl-path-node-id { color: #a9583e; font-weight: 600; }
.style-claude .cl-path-arrow { color: #8e8b82; font-size: 14px; }
.style-claude .cl-path-arrow-big { color: #cc785c; font-size: 20px; font-weight: 500; align-self: center; }
.style-claude .cl-path-note { font-size: 14px; color: #6c6a64; margin: 20px 0 0; max-width: 880px; }

/* table */
.style-claude .cl-table-wrap { overflow-x: auto; border: 1px solid #e6dfd8; border-radius: 12px; background: #faf9f5; }
.style-claude .cl-table { width: 100%; border-collapse: collapse; font-size: 14px; min-width: 760px; }
.style-claude .cl-table th {
  text-align: left; font-size: 12px; font-weight: 500; letter-spacing: 1.5px; text-transform: uppercase;
  color: #6c6a64; padding: 14px 16px; border-bottom: 1px solid #e6dfd8; background: #f5f0e8;
}
.style-claude .cl-table td { padding: 12px 16px; border-bottom: 1px solid #ebe6df; color: #3d3d3a; }
.style-claude .cl-table tbody tr:last-child td { border-bottom: none; }
.style-claude .cl-rank { color: #8e8b82; font-weight: 500; }
.style-claude .cl-model { font-weight: 500; color: #141413; }
.style-claude .cl-num { font-variant-numeric: tabular-nums; }
.style-claude .cl-best { font-weight: 600; color: #141413; }
.style-claude .cl-second { text-decoration: underline; text-underline-offset: 3px; text-decoration-color: #cc785c; }
.style-claude .cl-badge { display: inline-block; font-size: 13px; font-weight: 500; padding: 4px 12px; border-radius: 9999px; }
.style-claude .cl-badge-open { background: rgba(93,184,166,0.16); color: #2f7a6b; }
.style-claude .cl-badge-closed { background: #efe9de; color: #3d3d3a; }
.style-claude .cl-table-caption { font-size: 13px; color: #6c6a64; margin: 16px 0 0; }

/* charts */
.style-claude .cl-chart-block { margin-top: 48px; }
.style-claude .cl-chart-block:first-of-type { margin-top: 0; }
.style-claude .cl-chart-title {
  font-family: 'Cormorant Garamond', Georgia, serif; font-size: 24px; font-weight: 500;
  letter-spacing: -0.3px; margin: 0 0 20px; color: #141413;
}
.style-claude .cl-bars { display: flex; flex-direction: column; gap: 8px; }
.style-claude .cl-bar-row { display: grid; grid-template-columns: 250px 1fr 60px; align-items: center; gap: 12px; }
.style-claude .cl-bar-label { font-size: 13px; font-weight: 500; color: #3d3d3a; text-align: right; }
.style-claude .cl-bar-track { height: 18px; background: rgba(20,20,19,0.06); border-radius: 6px; overflow: hidden; }
.style-claude .cl-bar-fill { height: 100%; background: #cc785c; border-radius: 6px; }
.style-claude .cl-bar-value { font-size: 13px; font-variant-numeric: tabular-nums; color: #6c6a64; }
.style-claude .cl-chart-duo { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; margin-top: 48px; }
.style-claude .cl-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 8px; }

/* long-horizon wall */
.style-claude .cl-horizon { display: flex; gap: 40px; align-items: flex-start; flex-wrap: wrap; }
.style-claude .cl-horizon-big { flex: 0 0 170px; }
.style-claude .cl-horizon-num {
  font-family: 'Cormorant Garamond', Georgia, serif; font-size: 96px; font-weight: 500;
  line-height: 1; color: #cc785c; display: block;
}
.style-claude .cl-horizon-cap { font-size: 14px; color: #6c6a64; display: block; margin-top: 8px; }
.style-claude .cl-horizon-body { flex: 1 1 320px; }
.style-claude .cl-ratio { display: flex; height: 28px; border-radius: 6px; overflow: hidden; background: rgba(20,20,19,0.06); }
.style-claude .cl-ratio-in { background: #5db8a6; }
.style-claude .cl-ratio-out { background: #cc785c; min-width: 12px; }
.style-claude .cl-horizon-legend { display: flex; gap: 24px; margin-top: 12px; font-size: 13px; color: #3d3d3a; flex-wrap: wrap; }
.style-claude .cl-horizon-note { font-size: 14px; color: #6c6a64; margin: 16px 0 0; }

/* open vs closed mean N10 */
.style-claude .cl-wavg { display: flex; gap: 48px; align-items: flex-end; }
.style-claude .cl-wavg-col { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.style-claude .cl-wavg-val { font-family: 'Cormorant Garamond', Georgia, serif; font-size: 30px; font-weight: 500; color: #141413; }
.style-claude .cl-wavg-track { height: 150px; width: 44px; background: rgba(20,20,19,0.06); border-radius: 6px 6px 0 0; display: flex; align-items: flex-end; }
.style-claude .cl-wavg-fill { width: 100%; border-radius: 6px 6px 0 0; }
.style-claude .cl-wavg-closed { background: #cc785c; }
.style-claude .cl-wavg-open { background: #5db8a6; }
.style-claude .cl-wavg-label { font-size: 13px; font-weight: 500; color: #252523; }
.style-claude .cl-wavg-n { font-size: 12px; color: #6c6a64; }
.style-claude .cl-chart-note { font-size: 13px; color: #6c6a64; margin: 16px 0 0; }

/* tasks */
.style-claude .cl-badge-pill { background: #e8e0d2; color: #141413; font-size: 13px; font-weight: 500; padding: 4px 12px; border-radius: 9999px; }
.style-claude .cl-task-desc { font-size: 15px; color: #3d3d3a; margin: 16px 0 0; }

/* closed loop */
.style-claude .cl-loop-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.style-claude .cl-loop-col { background: #efe9de; border-radius: 12px; padding: 28px; }
.style-claude .cl-loop-title { font-size: 17px; font-weight: 500; margin: 0 0 16px; color: #141413; }
.style-claude .cl-loop-list { margin: 0; padding: 0; list-style: none; }
.style-claude .cl-loop-list li { font-size: 15px; color: #3d3d3a; padding: 6px 0 6px 26px; position: relative; }
.style-claude .cl-loop-mark { position: absolute; left: 0; top: 6px; font-weight: 600; }
.style-claude .cl-loop-yes { color: #2f7a6b; }
.style-claude .cl-loop-no { color: #a9583e; }

/* failures */
.style-claude .cl-fail-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 32px; }
.style-claude .cl-fail { background: #faf9f5; border: 1px solid #e6dfd8; border-radius: 12px; padding: 24px; }
.style-claude .cl-fail-name { font-size: 16px; font-weight: 500; color: #141413; }
.style-claude .cl-fail-desc { font-size: 14px; color: #6c6a64; margin: 12px 0 0; }
.style-claude .cl-fail-note { font-size: 14px; color: #6c6a64; margin: 28px 0 0; max-width: 880px; border-left: 3px solid #cc785c; padding-left: 16px; }

/* dark band */
.style-claude .cl-dark { background: #181715; color: #faf9f5; padding: 96px 0; }
.style-claude .cl-dark-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: start; }
.style-claude .cl-method-sub { font-size: 13px; font-weight: 500; letter-spacing: 1.5px; text-transform: uppercase; color: #e8a55a; margin: 28px 0 12px; }
.style-claude .cl-formulas { display: flex; flex-direction: column; gap: 8px; margin: 24px 0 28px; }
.style-claude .cl-formula {
  font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 13px; color: #faf9f5;
  background: #1f1e1b; border-radius: 8px; padding: 10px 14px; display: block;
}
.style-claude .cl-code-card { background: #1f1e1b; border-radius: 12px; overflow: hidden; }
.style-claude .cl-code-head { display: flex; align-items: center; gap: 6px; padding: 14px 18px; background: #252320; }
.style-claude .cl-code-dot { width: 10px; height: 10px; border-radius: 50%; background: #3a382f; }
.style-claude .cl-code-title { margin-left: 10px; font-size: 13px; color: #a09d96; font-family: 'JetBrains Mono', monospace; }
.style-claude .cl-code {
  margin: 0; padding: 24px; font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 14px; line-height: 1.6; color: #faf9f5; overflow-x: auto; white-space: pre;
}

/* footer */
.style-claude .cl-footer { background: #181715; border-top: 1px solid #252320; color: #a09d96; padding: 48px 0 64px; font-size: 14px; }
.style-claude .cl-footer-brand { display: flex; align-items: center; gap: 8px; color: #faf9f5; font-weight: 600; margin-bottom: 12px; }
.style-claude .cl-footer p { margin: 4px 0; }
.style-claude .cl-footer-fine { color: #6c6a64; font-size: 13px; }

@media (max-width: 960px) {
  .style-claude .cl-stats-grid { grid-template-columns: repeat(3, 1fr); }
  .style-claude .cl-labstats { grid-template-columns: repeat(2, 1fr); }
  .style-claude .cl-dim-grid, .style-claude .cl-chart-duo, .style-claude .cl-fail-grid, .style-claude .cl-dark-grid, .style-claude .cl-loop-grid { grid-template-columns: 1fr; }
  .style-claude .cl-h1 { font-size: 38px; }
  .style-claude .cl-h2 { font-size: 30px; }
  .style-claude .cl-nav-links { display: none; }
  .style-claude .cl-section { padding: 64px 0; }
  .style-claude .cl-hero { padding: 64px 0 48px; }
}
@media (max-width: 560px) {
  .style-claude .cl-stats-grid { grid-template-columns: repeat(2, 1fr); }
  .style-claude .cl-bar-row { grid-template-columns: 130px 1fr 52px; }
  .style-claude .cl-bar-label { font-size: 11px; }
}
`
