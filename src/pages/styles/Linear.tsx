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
  if (v === N10_BEST) return 'ln-num ln-best'
  if (v === N10_SECOND) return 'ln-num ln-second'
  return 'ln-num'
}

export default function Linear() {
  const maxN10 = leaderboard[0].n10
  return (
    <div className="style-linear">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400&display=swap"
      />
      <style>{CSS}</style>

      {/* ── Top nav ─────────────────────────────────────── */}
      <nav className="ln-nav">
        <div className="ln-nav-inner">
          <div className="ln-brand">
            <svg width="18" height="18" viewBox="0 0 100 100" fill="none" aria-hidden="true">
              <rect width="100" height="100" rx="20" fill="#5e6ad2" />
              <path d="M28 72 V28 h10 v34 h34 v10 Z" fill="#ffffff" />
            </svg>
            <span className="ln-brand-name">RoboChem Bench</span>
          </div>
          <div className="ln-nav-links">
            <a href="#ln-board">Leaderboard</a>
            <a href="#ln-tasks">Tasks</a>
            <a href="#ln-cite">Cite</a>
          </div>
          <div className="ln-nav-right">
            <Link to="/" className="ln-btn ln-btn-secondary">
              ← Back to Gallery
            </Link>
            <a href={paperMeta.links[0].href} className="ln-btn ln-btn-primary">
              Get the paper
            </a>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────── */}
      <header className="ln-hero">
        <div className="ln-container">
          <p className="ln-eyebrow">Benchmark · 2026</p>
          <h1 className="ln-h1">{paperMeta.title}</h1>
          <p className="ln-sub">{paperMeta.subtitle}</p>
          <p className="ln-authors">{paperMeta.authors.join(', ')}</p>
          <p className="ln-affil">{paperMeta.affiliation}</p>
          <div className="ln-btn-row">
            {paperMeta.links.map((l, i) => (
              <a key={l.label} href={l.href} className={i === 0 ? 'ln-btn ln-btn-primary' : 'ln-btn ln-btn-secondary'}>
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </header>

      {/* ── Stats band ──────────────────────────────────── */}
      <section className="ln-section ln-section-tight">
        <div className="ln-container">
          <div className="ln-stats-panel">
            {keyStats.map((s) => (
              <div key={s.label} className="ln-stat">
                <div className="ln-stat-value">{s.value}</div>
                <div className="ln-stat-label">{s.label}</div>
                <div className="ln-stat-desc">{s.description}</div>
              </div>
            ))}
          </div>
          <div className="ln-labstats">
            {labStats.map((s) => (
              <div key={s.label} className="ln-labstat">
                <span className="ln-labstat-value">{s.value}</span>
                <span className="ln-labstat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Abstract ────────────────────────────────────── */}
      <section className="ln-section">
        <div className="ln-container ln-narrow">
          <p className="ln-eyebrow">Abstract</p>
          <p className="ln-abstract">{abstractText}</p>
        </div>
      </section>

      {/* ── Skills Library ──────────────────────────────── */}
      <section className="ln-section">
        <div className="ln-container">
          <p className="ln-eyebrow">The Skills Library</p>
          <h2 className="ln-h2">45 workstations, one skills library</h2>
          <div className="ln-dim-grid">
            {skillCategories.map((d) => (
              <div key={d.name} className="ln-card">
                <h3 className="ln-card-title">{d.name}</h3>
                <p className="ln-card-tagline">{d.tagline}</p>
                <ul className="ln-list">
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
      <section className="ln-section">
        <div className="ln-container">
          <p className="ln-eyebrow">Evaluation Pathway</p>
          <h2 className="ln-h2">From task receipt to physical execution</h2>
          <div className="ln-path">
            {pathwayStages.map((stage, si) => (
              <Fragment key={stage}>
                {si > 0 && <span className="ln-path-arrow ln-path-arrow-big">→</span>}
                <div className={`ln-path-stage ln-path-stage-${si}`}>
                  <p className="ln-path-stage-name">{stage}</p>
                  <div className="ln-path-flow">
                    {pathway
                      .filter((n) => n.stage === stage)
                      .map((n, i) => (
                        <Fragment key={n.node}>
                          {i > 0 && <span className="ln-path-arrow">→</span>}
                          <div className={n.node === 'N10' ? 'ln-path-node ln-path-node-hl' : 'ln-path-node'}>
                            <span className="ln-path-node-id">{n.node}</span>
                            <span className="ln-path-node-label">{n.label}</span>
                          </div>
                        </Fragment>
                      ))}
                  </div>
                </div>
              </Fragment>
            ))}
          </div>
          <p className="ln-path-note">{pathwayNote}</p>
        </div>
      </section>

      {/* ── Leaderboard ─────────────────────────────────── */}
      <section className="ln-section" id="ln-board">
        <div className="ln-container">
          <p className="ln-eyebrow">Leaderboard</p>
          <h2 className="ln-h2">48 configurations, ranked by N10 yield</h2>
          <p className="ln-section-note">
            N10 executable yield (%) — top 8 shown. <strong>Bold</strong> marks the best;{' '}
            <span className="ln-underline-demo">underline</span> the runner-up.
          </p>
          <div className="ln-table-wrap">
            <table className="ln-table">
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
                    <td className="ln-rank">{r.rank}</td>
                    <td className="ln-model">
                      {r.harness} × {r.model}
                    </td>
                    <td className="ln-org">{r.org}</td>
                    <td>
                      <span className={r.weights === 'open' ? 'ln-badge' : 'ln-badge ln-badge-closed'}>
                        {r.weights === 'open' ? 'Open' : 'Closed'}
                      </span>
                    </td>
                    <td className="ln-num">{r.trials}</td>
                    <td className="ln-num">{r.executable}</td>
                    <td className={n10Class(r.n10)}>{r.n10.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="ln-table-caption">{leaderboardCaption}</p>
        </div>
      </section>

      {/* ── Charts ──────────────────────────────────────── */}
      <section className="ln-section">
        <div className="ln-container">
          <p className="ln-eyebrow">Results</p>
          <h2 className="ln-h2">Where the frontier stands</h2>

          <div className="ln-panel ln-panel-xl">
            <h3 className="ln-panel-title">N10 executable yield — top 8 configurations</h3>
            <div className="ln-bars">
              {leaderboard.map((r) => (
                <div key={r.rank} className="ln-bar-row">
                  <span className="ln-bar-label">
                    {r.harness} × {r.model}
                  </span>
                  <div className="ln-bar-track">
                    <div className="ln-bar-fill" style={{ width: `${(r.n10 / maxN10) * 100}%` }} />
                  </div>
                  <span className="ln-bar-value">{r.n10.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="ln-chart-duo">
            <div className="ln-panel">
              <h3 className="ln-panel-title">The long-horizon wall</h3>
              <div className="ln-horizon">
                <div className="ln-horizon-big">
                  <span className="ln-horizon-num">{longHorizon.longest}</span>
                  <span className="ln-horizon-cap">operations in the longest executable workflow</span>
                </div>
                <div className="ln-horizon-body">
                  <div className="ln-ratio">
                    <div
                      className="ln-ratio-in"
                      style={{
                        width: `${((longHorizon.totalExecutable - longHorizon.over30Ops) / longHorizon.totalExecutable) * 100}%`,
                      }}
                    />
                    <div
                      className="ln-ratio-out"
                      style={{ width: `${(longHorizon.over30Ops / longHorizon.totalExecutable) * 100}%` }}
                    />
                  </div>
                  <div className="ln-horizon-legend">
                    <span>
                      <span className="ln-dot" style={{ background: '#828fff' }} />
                      {longHorizon.totalExecutable - longHorizon.over30Ops} workflows ≤ 30 operations
                    </span>
                    <span>
                      <span className="ln-dot" style={{ background: '#f7f8f8' }} />
                      {longHorizon.over30Ops} workflows &gt; 30 operations
                    </span>
                  </div>
                  <p className="ln-horizon-note">{longHorizon.note}</p>
                </div>
              </div>
            </div>

            <div className="ln-panel">
              <h3 className="ln-panel-title">Open vs closed weights — mean N10 yield</h3>
              <div className="ln-wavg">
                {weightsAvg.map((w, i) => (
                  <div key={w.group} className="ln-wavg-col">
                    <span className="ln-wavg-val">{w.value.toFixed(1)}%</span>
                    <div className="ln-wavg-track">
                      <div
                        className={i === 0 ? 'ln-wavg-fill ln-wavg-closed' : 'ln-wavg-fill ln-wavg-open'}
                        style={{ height: `${(w.value / 16) * 100}%` }}
                      />
                    </div>
                    <span className="ln-wavg-label">{w.group}</span>
                    <span className="ln-wavg-n">{w.n} configurations</span>
                  </div>
                ))}
              </div>
              <p className="ln-chart-note">{weightsAvgCaption}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Task domains ────────────────────────────────── */}
      <section className="ln-section" id="ln-tasks">
        <div className="ln-container">
          <p className="ln-eyebrow">Task Domains</p>
          <h2 className="ln-h2">32 research tasks across four catalysis domains</h2>
          <div className="ln-dim-grid">
            {taskDomains.map((t) => (
              <div key={t.domain} className={t.domain === 'Electrocatalysis' ? 'ln-card ln-card-accent' : 'ln-card'}>
                <div className="ln-task-top">
                  <span className="ln-badge">{t.domain}</span>
                  {t.domain === 'Electrocatalysis' && <span className="ln-badge ln-badge-accent">Closed-loop study</span>}
                </div>
                <p className="ln-task-desc">{t.blurb}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Closed-loop adaptation ──────────────────────── */}
      <section className="ln-section">
        <div className="ln-container">
          <p className="ln-eyebrow">Closed-Loop Adaptation</p>
          <h2 className="ln-h2">Five rounds of feedback</h2>
          <p className="ln-section-note">
            Agent: <strong>{closedLoop.agent}</strong> · Task: {closedLoop.task} · {closedLoop.rounds} feedback rounds
          </p>
          <div className="ln-loop-grid">
            <div className="ln-card">
              <h3 className="ln-loop-title">Localized adaptation observed</h3>
              <ul className="ln-loop-list">
                {closedLoop.adapted.map((a) => (
                  <li key={a}>
                    <span className="ln-loop-mark ln-loop-yes">✓</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
            <div className="ln-card">
              <h3 className="ln-loop-title">Strategic redirection not observed</h3>
              <ul className="ln-loop-list">
                {closedLoop.notObserved.map((a) => (
                  <li key={a}>
                    <span className="ln-loop-mark ln-loop-no">✗</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Failure modes ───────────────────────────────── */}
      <section className="ln-section">
        <div className="ln-container">
          <p className="ln-eyebrow">Failure Analysis</p>
          <h2 className="ln-h2">How agents break</h2>
          <div className="ln-fail-grid">
            {failureModes.map((f) => (
              <div key={f.name} className="ln-card ln-fail">
                <span className="ln-fail-name">{f.name}</span>
                <p className="ln-fail-desc">{f.description}</p>
              </div>
            ))}
          </div>
          <p className="ln-fail-note">{failureNote}</p>
        </div>
      </section>

      {/* ── Methodology + BibTeX ────────────────────────── */}
      <section className="ln-section" id="ln-cite">
        <div className="ln-container ln-method-grid">
          <div>
            <p className="ln-eyebrow">Methodology</p>
            <h2 className="ln-h2">Measured, not vibes</h2>
            <p className="ln-method-sub">Multi-axis rubric</p>
            <ul className="ln-list">
              {scoringAxes.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
            <div className="ln-formulas">
              {formulas.map((f) => (
                <code key={f} className="ln-formula">
                  {f}
                </code>
              ))}
            </div>
            <ul className="ln-list">
              {methodologyNotes.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
          <div className="ln-code-card">
            <div className="ln-code-head">robochem-bench.bib</div>
            <pre className="ln-code">{bibtex}</pre>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="ln-footer">
        <div className="ln-container">
          <div className="ln-footer-brand">
            <svg width="14" height="14" viewBox="0 0 100 100" fill="none" aria-hidden="true">
              <rect width="100" height="100" rx="20" fill="#5e6ad2" />
              <path d="M28 72 V28 h10 v34 h34 v10 Z" fill="#ffffff" />
            </svg>
            RoboChem Bench
          </div>
          <p>Style preview · Linear DESIGN.md · Content from arXiv:2607.23045</p>
          <p className="ln-footer-fine">Built with the Linear DESIGN.md · Style preview for RoboChem Bench</p>
        </div>
      </footer>
    </div>
  )
}

const CSS = `
.style-linear {
  background: #010102;
  color: #f7f8f8;
  font-family: 'Inter', 'SF Pro Display', -apple-system, system-ui, 'Segoe UI', Roboto, sans-serif;
  font-size: 16px;
  line-height: 1.5;
  letter-spacing: -0.05px;
  min-height: 100dvh;
}
.style-linear .ln-container { max-width: 1280px; margin: 0 auto; padding: 0 32px; }
.style-linear .ln-narrow { max-width: 760px; }

/* nav */
.style-linear .ln-nav {
  background: #010102; border-bottom: 1px solid #23252a; position: sticky; top: 0; z-index: 50; height: 56px;
  display: flex; align-items: center;
}
.style-linear .ln-nav-inner { max-width: 1280px; margin: 0 auto; padding: 0 32px; width: 100%; display: flex; align-items: center; gap: 28px; }
.style-linear .ln-brand { display: flex; align-items: center; gap: 10px; }
.style-linear .ln-brand-name { font-size: 15px; font-weight: 600; letter-spacing: -0.2px; color: #f7f8f8; }
.style-linear .ln-nav-links { display: flex; gap: 20px; }
.style-linear .ln-nav-links a { font-size: 14px; font-weight: 400; color: #8a8f98; text-decoration: none; }
.style-linear .ln-nav-links a:hover { color: #f7f8f8; }
.style-linear .ln-nav-right { margin-left: auto; display: flex; gap: 10px; }

/* buttons */
.style-linear .ln-btn {
  display: inline-flex; align-items: center; padding: 8px 14px; border-radius: 8px;
  font-size: 14px; font-weight: 500; line-height: 1.2; text-decoration: none;
}
.style-linear .ln-btn-primary { background: #5e6ad2; color: #ffffff; }
.style-linear .ln-btn-primary:hover { background: #828fff; }
.style-linear .ln-btn-primary:active { background: #5e69d1; }
.style-linear .ln-btn-secondary { background: #0f1011; color: #f7f8f8; border: 1px solid #23252a; }

/* hero */
.style-linear .ln-hero { padding: 112px 0 88px; }
.style-linear .ln-eyebrow {
  font-size: 13px; font-weight: 500; letter-spacing: 0.4px; color: #8a8f98; margin: 0 0 16px;
}
.style-linear .ln-h1 {
  font-size: 64px; font-weight: 600; line-height: 1.06; letter-spacing: -2.2px;
  margin: 0; max-width: 960px; color: #f7f8f8;
}
.style-linear .ln-sub { font-size: 18px; font-weight: 400; letter-spacing: -0.1px; color: #d0d6e0; max-width: 720px; margin: 24px 0 0; }
.style-linear .ln-authors { font-size: 14px; color: #8a8f98; margin: 28px 0 0; max-width: 860px; }
.style-linear .ln-affil { font-size: 12px; color: #62666d; margin: 6px 0 0; }
.style-linear .ln-btn-row { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 32px; }

/* sections */
.style-linear .ln-section { padding: 96px 0 0; }
.style-linear .ln-section-tight { padding-top: 0; }
.style-linear .ln-h2 {
  font-size: 40px; font-weight: 600; line-height: 1.15; letter-spacing: -1px; margin: 0 0 32px; color: #f7f8f8;
}
.style-linear .ln-section-note { font-size: 14px; color: #8a8f98; margin: -16px 0 24px; }
.style-linear .ln-underline-demo { text-decoration: underline; text-underline-offset: 3px; }
.style-linear .ln-abstract { font-size: 20px; font-weight: 400; letter-spacing: -0.2px; line-height: 1.45; color: #d0d6e0; margin: 0; }

/* stats panel */
.style-linear .ln-stats-panel {
  background: #0f1011; border: 1px solid #23252a; border-radius: 12px;
  display: grid; grid-template-columns: repeat(6, 1fr);
}
.style-linear .ln-stat { padding: 28px 24px; border-left: 1px solid #23252a; }
.style-linear .ln-stat:first-child { border-left: none; }
.style-linear .ln-stat-value { font-size: 34px; font-weight: 600; letter-spacing: -1px; line-height: 1.1; color: #f7f8f8; font-variant-numeric: tabular-nums; }
.style-linear .ln-stat-label { font-size: 13px; font-weight: 500; color: #d0d6e0; margin-top: 8px; }
.style-linear .ln-stat-desc { font-size: 12px; color: #62666d; margin-top: 4px; }

/* lab capability secondary band */
.style-linear .ln-labstats {
  background: #0f1011; border: 1px solid #23252a; border-radius: 12px; margin-top: 12px;
  display: grid; grid-template-columns: repeat(4, 1fr);
}
.style-linear .ln-labstat { padding: 16px 24px; border-left: 1px solid #23252a; }
.style-linear .ln-labstat:first-child { border-left: none; }
.style-linear .ln-labstat-value { font-size: 20px; font-weight: 600; letter-spacing: -0.5px; color: #828fff; font-variant-numeric: tabular-nums; display: block; }
.style-linear .ln-labstat-label { font-size: 12px; color: #62666d; display: block; margin-top: 4px; }

/* cards */
.style-linear .ln-dim-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
.style-linear .ln-card {
  background: #0f1011; border: 1px solid #23252a; border-radius: 12px; padding: 24px;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
}
.style-linear .ln-card-accent { border-color: #5e6ad2; }
.style-linear .ln-card-title { font-size: 22px; font-weight: 500; letter-spacing: -0.4px; line-height: 1.25; margin: 0 0 6px; color: #f7f8f8; }
.style-linear .ln-card-tagline { font-size: 14px; color: #8a8f98; margin: 0 0 16px; }
.style-linear .ln-list { margin: 0; padding: 0; list-style: none; }
.style-linear .ln-list li { font-size: 15px; color: #d0d6e0; padding: 6px 0 6px 20px; position: relative; }
.style-linear .ln-list li::before { content: ''; position: absolute; left: 2px; top: 14px; width: 8px; height: 8px; border-radius: 50%; background: #5e6ad2; }

/* pathway */
.style-linear .ln-path { display: flex; align-items: stretch; gap: 12px; flex-wrap: wrap; }
.style-linear .ln-path-stage {
  flex: 1 1 240px; background: #0f1011; border: 1px solid #23252a; border-radius: 12px; padding: 20px;
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.04);
}
.style-linear .ln-path-stage-name { font-size: 12px; font-weight: 500; letter-spacing: 0.4px; color: #8a8f98; margin: 0 0 14px; }
.style-linear .ln-path-stage-2 .ln-path-stage-name { color: #828fff; }
.style-linear .ln-path-flow { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.style-linear .ln-path-node { background: #141516; border: 1px solid #23252a; border-radius: 8px; padding: 10px 12px; min-width: 96px; }
.style-linear .ln-path-node-id { display: block; font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 12px; color: #828fff; }
.style-linear .ln-path-node-label { display: block; font-size: 13px; color: #d0d6e0; margin-top: 4px; line-height: 1.35; }
.style-linear .ln-path-node-hl { border: 1px solid #5e6ad2; background: rgba(94,106,210,0.12); }
.style-linear .ln-path-node-hl .ln-path-node-id { color: #f7f8f8; font-weight: 600; }
.style-linear .ln-path-arrow { color: #62666d; font-size: 14px; }
.style-linear .ln-path-arrow-big { color: #828fff; font-size: 20px; align-self: center; }
.style-linear .ln-path-note { font-size: 14px; color: #8a8f98; margin: 20px 0 0; max-width: 880px; }

/* table */
.style-linear .ln-table-wrap { overflow-x: auto; border: 1px solid #23252a; border-radius: 12px; background: #0f1011; }
.style-linear .ln-table { width: 100%; border-collapse: collapse; font-size: 14px; min-width: 780px; }
.style-linear .ln-table th {
  text-align: left; font-size: 12px; font-weight: 500; letter-spacing: 0.4px; color: #8a8f98;
  padding: 12px 16px; border-bottom: 1px solid #23252a; background: #141516;
}
.style-linear .ln-table td { padding: 12px 16px; border-bottom: 1px solid #1b1d21; color: #d0d6e0; }
.style-linear .ln-table tbody tr:last-child td { border-bottom: none; }
.style-linear .ln-rank { color: #62666d; font-variant-numeric: tabular-nums; }
.style-linear .ln-model { font-weight: 500; color: #f7f8f8; }
.style-linear .ln-org { color: #8a8f98; }
.style-linear .ln-num { font-variant-numeric: tabular-nums; }
.style-linear .ln-best { font-weight: 600; color: #f7f8f8; }
.style-linear .ln-second { text-decoration: underline; text-underline-offset: 3px; text-decoration-color: #5e6ad2; }
.style-linear .ln-badge {
  display: inline-block; font-size: 12px; font-weight: 400; padding: 2px 8px; border-radius: 9999px;
  background: #141516; color: #d0d6e0; border: 1px solid #23252a;
}
.style-linear .ln-badge-closed { background: #0f1011; color: #8a8f98; }
.style-linear .ln-badge-accent { border-color: #5e6ad2; color: #828fff; }
.style-linear .ln-table-caption { font-size: 13px; color: #62666d; margin: 16px 0 0; }

/* panels & charts */
.style-linear .ln-panel { background: #0f1011; border: 1px solid #23252a; border-radius: 12px; padding: 24px; box-shadow: inset 0 1px 0 rgba(255,255,255,0.04); }
.style-linear .ln-panel-xl { border-radius: 16px; padding: 28px; }
.style-linear .ln-panel-title { font-size: 18px; font-weight: 500; letter-spacing: -0.2px; margin: 0 0 24px; color: #f7f8f8; }
.style-linear .ln-chart-duo { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 24px; }
.style-linear .ln-bars { display: flex; flex-direction: column; gap: 8px; }
.style-linear .ln-bar-row { display: grid; grid-template-columns: 250px 1fr 60px; align-items: center; gap: 12px; }
.style-linear .ln-bar-label { font-size: 13px; color: #d0d6e0; text-align: right; }
.style-linear .ln-bar-track { height: 14px; background: #141516; border-radius: 4px; overflow: hidden; border: 1px solid #23252a; }
.style-linear .ln-bar-fill { height: 100%; background: #5e6ad2; border-radius: 4px; }
.style-linear .ln-bar-value { font-size: 12px; font-variant-numeric: tabular-nums; color: #8a8f98; }
.style-linear .ln-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 8px; }

/* long-horizon wall */
.style-linear .ln-horizon { display: flex; gap: 32px; align-items: flex-start; flex-wrap: wrap; }
.style-linear .ln-horizon-big { flex: 0 0 150px; }
.style-linear .ln-horizon-num { font-size: 92px; font-weight: 600; letter-spacing: -2px; line-height: 1; color: #828fff; display: block; }
.style-linear .ln-horizon-cap { font-size: 13px; color: #8a8f98; display: block; margin-top: 8px; }
.style-linear .ln-horizon-body { flex: 1 1 300px; }
.style-linear .ln-ratio { display: flex; height: 20px; border-radius: 4px; overflow: hidden; background: #141516; border: 1px solid #23252a; }
.style-linear .ln-ratio-in { background: #828fff; }
.style-linear .ln-ratio-out { background: #f7f8f8; min-width: 12px; }
.style-linear .ln-horizon-legend { display: flex; gap: 20px; margin-top: 12px; font-size: 13px; color: #d0d6e0; flex-wrap: wrap; }
.style-linear .ln-horizon-note { font-size: 14px; color: #8a8f98; margin: 16px 0 0; }

/* open vs closed mean N10 */
.style-linear .ln-wavg { display: flex; gap: 48px; align-items: flex-end; }
.style-linear .ln-wavg-col { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.style-linear .ln-wavg-val { font-size: 30px; font-weight: 600; letter-spacing: -0.6px; color: #f7f8f8; font-variant-numeric: tabular-nums; }
.style-linear .ln-wavg-track { height: 150px; width: 40px; background: #141516; border: 1px solid #23252a; border-bottom: none; border-radius: 4px 4px 0 0; display: flex; align-items: flex-end; }
.style-linear .ln-wavg-fill { width: 100%; border-radius: 4px 4px 0 0; }
.style-linear .ln-wavg-closed { background: #5e6ad2; }
.style-linear .ln-wavg-open { background: #8a8f98; }
.style-linear .ln-wavg-label { font-size: 13px; font-weight: 500; color: #d0d6e0; }
.style-linear .ln-wavg-n { font-size: 12px; color: #8a8f98; }
.style-linear .ln-chart-note { font-size: 12px; color: #62666d; margin: 16px 0 0; }

/* tasks */
.style-linear .ln-task-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; gap: 12px; flex-wrap: wrap; }
.style-linear .ln-task-desc { font-size: 14px; color: #d0d6e0; margin: 0; }

/* closed loop */
.style-linear .ln-loop-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.style-linear .ln-loop-title { font-size: 16px; font-weight: 500; letter-spacing: -0.3px; margin: 0 0 16px; color: #f7f8f8; }
.style-linear .ln-loop-list { margin: 0; padding: 0; list-style: none; }
.style-linear .ln-loop-list li { font-size: 15px; color: #d0d6e0; padding: 6px 0 6px 26px; position: relative; }
.style-linear .ln-loop-mark { position: absolute; left: 0; top: 6px; font-weight: 600; }
.style-linear .ln-loop-yes { color: #828fff; }
.style-linear .ln-loop-no { color: #62666d; }

/* failures */
.style-linear .ln-fail-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
.style-linear .ln-fail-name { font-size: 16px; font-weight: 500; color: #f7f8f8; }
.style-linear .ln-fail-desc { font-size: 14px; color: #8a8f98; margin: 12px 0 0; }
.style-linear .ln-fail-note { font-size: 14px; color: #8a8f98; margin: 28px 0 0; max-width: 880px; border-left: 3px solid #5e6ad2; padding-left: 16px; }

/* methodology */
.style-linear .ln-method-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: start; }
.style-linear .ln-method-sub { font-size: 13px; font-weight: 500; letter-spacing: 0.4px; color: #828fff; margin: 24px 0 10px; }
.style-linear .ln-formulas { display: flex; flex-direction: column; gap: 8px; margin: 20px 0 28px; }
.style-linear .ln-formula {
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13px; color: #d0d6e0;
  background: #0f1011; border: 1px solid #23252a; border-radius: 8px; padding: 10px 14px; display: block;
}
.style-linear .ln-code-card { background: #0f1011; border: 1px solid #23252a; border-radius: 16px; overflow: hidden; box-shadow: inset 0 1px 0 rgba(255,255,255,0.04); }
.style-linear .ln-code-head {
  padding: 12px 16px; font-size: 12px; color: #62666d;
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  border-bottom: 1px solid #23252a;
}
.style-linear .ln-code {
  margin: 0; padding: 24px; font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 13px; line-height: 1.5; color: #d0d6e0; overflow-x: auto; white-space: pre;
}

/* footer */
.style-linear .ln-footer { background: #010102; border-top: 1px solid #23252a; color: #8a8f98; padding: 64px 0; margin-top: 96px; font-size: 12px; }
.style-linear .ln-footer-brand { display: flex; align-items: center; gap: 8px; color: #f7f8f8; font-size: 13px; font-weight: 600; margin-bottom: 12px; }
.style-linear .ln-footer p { margin: 4px 0; }
.style-linear .ln-footer-fine { color: #62666d; }

@media (max-width: 1024px) {
  .style-linear .ln-stats-panel { grid-template-columns: repeat(3, 1fr); }
  .style-linear .ln-stat { border-left: none; border-top: 1px solid #23252a; }
  .style-linear .ln-stat:nth-child(-n+3) { border-top: none; }
  .style-linear .ln-labstats { grid-template-columns: repeat(2, 1fr); }
  .style-linear .ln-labstat { border-left: none; border-top: 1px solid #23252a; }
  .style-linear .ln-labstat:nth-child(-n+2) { border-top: none; }
  .style-linear .ln-dim-grid, .style-linear .ln-chart-duo, .style-linear .ln-fail-grid, .style-linear .ln-method-grid, .style-linear .ln-loop-grid { grid-template-columns: 1fr; }
  .style-linear .ln-h1 { font-size: 40px; letter-spacing: -1.2px; }
  .style-linear .ln-h2 { font-size: 28px; }
  .style-linear .ln-nav-links { display: none; }
  .style-linear .ln-hero { padding: 72px 0 56px; }
  .style-linear .ln-section { padding-top: 64px; }
}
@media (max-width: 560px) {
  .style-linear .ln-stats-panel { grid-template-columns: repeat(2, 1fr); }
  .style-linear .ln-stat:nth-child(-n+3) { border-top: 1px solid #23252a; }
  .style-linear .ln-stat:nth-child(-n+2) { border-top: none; }
  .style-linear .ln-labstats { grid-template-columns: 1fr; }
  .style-linear .ln-labstat:nth-child(-n+2) { border-top: 1px solid #23252a; }
  .style-linear .ln-labstat:first-child { border-top: none; }
  .style-linear .ln-bar-row { grid-template-columns: 124px 1fr 52px; }
  .style-linear .ln-bar-label { font-size: 11px; }
}
`
