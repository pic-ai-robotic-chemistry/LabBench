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
  if (v === N10_BEST) return 'ap-num ap-best'
  if (v === N10_SECOND) return 'ap-num ap-second'
  return 'ap-num'
}

export default function Apple() {
  const maxN10 = leaderboard[0].n10
  return (
    <div className="style-apple">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&family=JetBrains+Mono:wght@400&display=swap"
      />
      <style>{CSS}</style>

      {/* ── Global nav (black bar) ──────────────────────── */}
      <nav className="ap-global-nav">
        <div className="ap-gnav-inner">
          <span className="ap-gnav-mark"></span>
          <Link to="/" className="ap-gnav-link">
            ← Back to Gallery
          </Link>
          <a className="ap-gnav-link" href="#ap-board">Leaderboard</a>
          <a className="ap-gnav-link" href="#ap-tasks">Tasks</a>
          <a className="ap-gnav-link" href="#ap-cite">Cite</a>
        </div>
      </nav>
      {/* ── Sub nav (frosted) ───────────────────────────── */}
      <div className="ap-subnav">
        <div className="ap-subnav-inner">
          <span className="ap-subnav-title">RoboChem Bench</span>
          <a href={paperMeta.links[0].href} className="ap-btn ap-btn-small">Get the paper</a>
        </div>
      </div>

      {/* ── Hero tile (white) ───────────────────────────── */}
      <header className="ap-tile ap-tile-white">
        <div className="ap-inner">
          <h1 className="ap-h1">{paperMeta.title}</h1>
          <p className="ap-lead">{paperMeta.subtitle}</p>
          <p className="ap-authors">{paperMeta.authors.join(', ')}</p>
          <p className="ap-affil">{paperMeta.affiliation}</p>
          <div className="ap-btn-row">
            {paperMeta.links.map((l, i) => (
              <a key={l.label} href={l.href} className={i === 0 ? 'ap-btn ap-btn-primary' : 'ap-btn ap-btn-ghost'}>
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </header>

      {/* ── Stats band (parchment) ──────────────────────── */}
      <section className="ap-tile ap-tile-parchment">
        <div className="ap-inner">
          <div className="ap-stats-grid">
            {keyStats.map((s) => (
              <div key={s.label} className="ap-stat">
                <div className="ap-stat-value">{s.value}</div>
                <div className="ap-stat-label">{s.label}</div>
                <div className="ap-stat-desc">{s.description}</div>
              </div>
            ))}
          </div>
          <div className="ap-labstats">
            {labStats.map((s) => (
              <div key={s.label} className="ap-labstat">
                <span className="ap-labstat-value">{s.value}</span>
                <span className="ap-labstat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Abstract (white) ────────────────────────────── */}
      <section className="ap-tile ap-tile-white">
        <div className="ap-inner ap-narrow">
          <h2 className="ap-h2">Abstract</h2>
          <p className="ap-body-lg">{abstractText}</p>
        </div>
      </section>

      {/* ── Skills Library (dark tile) ──────────────────── */}
      <section className="ap-tile ap-tile-dark">
        <div className="ap-inner">
          <h2 className="ap-h2 ap-on-dark">The Skills Library.</h2>
          <p className="ap-sub-dark">45 modular workstations, exposed as machine-readable skills.</p>
          <div className="ap-dim-grid">
            {skillCategories.map((d) => (
              <div key={d.name} className="ap-dim-card">
                <h3 className="ap-dim-title">{d.name}</h3>
                <p className="ap-dim-tagline">{d.tagline}</p>
                <ul className="ap-list">
                  {d.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Evaluation pathway (parchment) ──────────────── */}
      <section className="ap-tile ap-tile-parchment">
        <div className="ap-inner">
          <h2 className="ap-h2">From task receipt to physical execution.</h2>
          <div className="ap-path">
            {pathwayStages.map((stage, si) => (
              <Fragment key={stage}>
                {si > 0 && <span className="ap-path-arrow ap-path-arrow-big">→</span>}
                <div className={`ap-path-stage ap-path-stage-${si}`}>
                  <p className="ap-path-stage-name">{stage}</p>
                  <div className="ap-path-flow">
                    {pathway
                      .filter((n) => n.stage === stage)
                      .map((n, i) => (
                        <Fragment key={n.node}>
                          {i > 0 && <span className="ap-path-arrow">→</span>}
                          <div className={n.node === 'N10' ? 'ap-path-node ap-path-node-hl' : 'ap-path-node'}>
                            <span className="ap-path-node-id">{n.node}</span>
                            <span className="ap-path-node-label">{n.label}</span>
                          </div>
                        </Fragment>
                      ))}
                  </div>
                </div>
              </Fragment>
            ))}
          </div>
          <p className="ap-path-note">{pathwayNote}</p>
        </div>
      </section>

      {/* ── Leaderboard (white) ─────────────────────────── */}
      <section className="ap-tile ap-tile-white" id="ap-board">
        <div className="ap-inner">
          <h2 className="ap-h2">Leaderboard</h2>
          <p className="ap-caption-note">
            N10 executable yield (%). <strong>Bold</strong> marks the best;{' '}
            <span className="ap-underline-demo">underline</span> the runner-up.
          </p>
          <div className="ap-table-wrap">
            <table className="ap-table">
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
                    <td className="ap-rank">{r.rank}</td>
                    <td className="ap-model">
                      {r.harness} × {r.model}
                    </td>
                    <td className="ap-org">{r.org}</td>
                    <td>
                      <span className={r.weights === 'open' ? 'ap-chip' : 'ap-chip ap-chip-dark'}>
                        {r.weights === 'open' ? 'Open' : 'Closed'}
                      </span>
                    </td>
                    <td className="ap-num">{r.trials}</td>
                    <td className="ap-num">{r.executable}</td>
                    <td className={n10Class(r.n10)}>{r.n10.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="ap-table-caption">{leaderboardCaption}</p>
        </div>
      </section>

      {/* ── Charts (parchment) ──────────────────────────── */}
      <section className="ap-tile ap-tile-parchment">
        <div className="ap-inner">
          <h2 className="ap-h2">Results at a glance</h2>

          <div className="ap-chart-block">
            <h3 className="ap-h3">N10 executable yield — top 8 configurations</h3>
            <div className="ap-bars">
              {leaderboard.map((r) => (
                <div key={r.rank} className="ap-bar-row">
                  <span className="ap-bar-label">
                    {r.harness} × {r.model}
                  </span>
                  <div className="ap-bar-track">
                    <div className="ap-bar-fill" style={{ width: `${(r.n10 / maxN10) * 100}%` }} />
                  </div>
                  <span className="ap-bar-value">{r.n10.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="ap-chart-duo">
            <div className="ap-chart-block">
              <h3 className="ap-h3">The long-horizon wall</h3>
              <div className="ap-horizon">
                <div className="ap-horizon-big">
                  <span className="ap-horizon-num">{longHorizon.longest}</span>
                  <span className="ap-horizon-cap">operations in the longest executable workflow</span>
                </div>
                <div className="ap-horizon-body">
                  <div className="ap-ratio">
                    <div
                      className="ap-ratio-in"
                      style={{
                        width: `${((longHorizon.totalExecutable - longHorizon.over30Ops) / longHorizon.totalExecutable) * 100}%`,
                      }}
                    />
                    <div
                      className="ap-ratio-out"
                      style={{ width: `${(longHorizon.over30Ops / longHorizon.totalExecutable) * 100}%` }}
                    />
                  </div>
                  <div className="ap-horizon-legend">
                    <span>
                      <span className="ap-dot" style={{ background: '#7a7a7a' }} />
                      {longHorizon.totalExecutable - longHorizon.over30Ops} workflows ≤ 30 operations
                    </span>
                    <span>
                      <span className="ap-dot" style={{ background: '#0066cc' }} />
                      {longHorizon.over30Ops} workflows &gt; 30 operations
                    </span>
                  </div>
                  <p className="ap-horizon-note">{longHorizon.note}</p>
                </div>
              </div>
            </div>

            <div className="ap-chart-block">
              <h3 className="ap-h3">Open vs closed weights — mean N10 yield</h3>
              <div className="ap-wavg">
                {weightsAvg.map((w, i) => (
                  <div key={w.group} className="ap-wavg-col">
                    <span className="ap-wavg-val">{w.value.toFixed(1)}%</span>
                    <div className="ap-wavg-track">
                      <div
                        className={i === 0 ? 'ap-wavg-fill ap-wavg-closed' : 'ap-wavg-fill ap-wavg-open'}
                        style={{ height: `${(w.value / 16) * 100}%` }}
                      />
                    </div>
                    <span className="ap-wavg-label">{w.group}</span>
                    <span className="ap-wavg-n">{w.n} configurations</span>
                  </div>
                ))}
              </div>
              <p className="ap-chart-note">{weightsAvgCaption}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Task domains (dark tile 2) ──────────────────── */}
      <section className="ap-tile ap-tile-dark2" id="ap-tasks">
        <div className="ap-inner">
          <h2 className="ap-h2 ap-on-dark">Four catalysis domains. 32 research tasks.</h2>
          <p className="ap-sub-dark">Real glassware. Real constraints. No shortcuts.</p>
          <div className="ap-dim-grid">
            {taskDomains.map((t) => (
              <div
                key={t.domain}
                className={t.domain === 'Electrocatalysis' ? 'ap-task-card ap-task-accent' : 'ap-task-card'}
              >
                <div className="ap-task-top">
                  <span className="ap-task-domain">{t.domain}</span>
                  {t.domain === 'Electrocatalysis' && <span className="ap-task-badge">Closed-loop study</span>}
                </div>
                <p className="ap-task-desc">{t.blurb}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Closed-loop adaptation (white) ──────────────── */}
      <section className="ap-tile ap-tile-white">
        <div className="ap-inner">
          <h2 className="ap-h2">Five rounds of feedback.</h2>
          <p className="ap-caption-note">
            Agent: <strong>{closedLoop.agent}</strong> · Task: {closedLoop.task} · {closedLoop.rounds} feedback rounds
          </p>
          <div className="ap-loop-grid">
            <div className="ap-loop-col">
              <h3 className="ap-h3">Localized adaptation observed</h3>
              <ul className="ap-loop-list">
                {closedLoop.adapted.map((a) => (
                  <li key={a}>
                    <span className="ap-loop-mark ap-loop-yes">✓</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
            <div className="ap-loop-col">
              <h3 className="ap-h3">Strategic redirection not observed</h3>
              <ul className="ap-loop-list">
                {closedLoop.notObserved.map((a) => (
                  <li key={a}>
                    <span className="ap-loop-mark ap-loop-no">✗</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Failure modes (parchment) ───────────────────── */}
      <section className="ap-tile ap-tile-parchment">
        <div className="ap-inner">
          <h2 className="ap-h2">How agents break</h2>
          <div className="ap-fail-grid">
            {failureModes.map((f) => (
              <div key={f.name} className="ap-fail">
                <div className="ap-fail-name">{f.name}</div>
                <p className="ap-fail-desc">{f.description}</p>
              </div>
            ))}
          </div>
          <p className="ap-fail-note">{failureNote}</p>
        </div>
      </section>

      {/* ── Methodology + BibTeX (dark tile 3) ──────────── */}
      <section className="ap-tile ap-tile-dark3" id="ap-cite">
        <div className="ap-inner ap-method-grid">
          <div>
            <h2 className="ap-h2 ap-on-dark">Methodology</h2>
            <p className="ap-method-sub">Multi-axis rubric</p>
            <ul className="ap-list ap-list-dark">
              {scoringAxes.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
            <div className="ap-formulas">
              {formulas.map((f) => (
                <code key={f} className="ap-formula">
                  {f}
                </code>
              ))}
            </div>
            <ul className="ap-list ap-list-dark">
              {methodologyNotes.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
          <div className="ap-code-card">
            <pre className="ap-code">{bibtex}</pre>
          </div>
        </div>
      </section>

      {/* ── Footer (parchment) ──────────────────────────── */}
      <footer className="ap-footer">
        <div className="ap-inner">
          <p className="ap-footer-line">RoboChem Bench</p>
          <p>Style preview · Apple DESIGN.md · Content from arXiv:2607.23045</p>
          <p className="ap-footer-fine">Built with the Apple DESIGN.md · Style preview for RoboChem Bench</p>
        </div>
      </footer>
    </div>
  )
}

const CSS = `
.style-apple {
  background: #ffffff;
  color: #1d1d1f;
  font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Inter', system-ui, sans-serif;
  font-size: 17px;
  line-height: 1.47;
  letter-spacing: -0.374px;
  min-height: 100dvh;
}
.style-apple .ap-inner { max-width: 1024px; margin: 0 auto; padding: 0 24px; }
.style-apple .ap-narrow { max-width: 760px; }

/* global nav */
.style-apple .ap-global-nav { background: #000000; height: 44px; display: flex; align-items: center; }
.style-apple .ap-gnav-inner { max-width: 1024px; margin: 0 auto; padding: 0 24px; width: 100%; display: flex; align-items: center; gap: 28px; }
.style-apple .ap-gnav-link {
  font-size: 12px; font-weight: 400; letter-spacing: -0.12px; color: #ffffff; opacity: 0.85; text-decoration: none;
}
.style-apple .ap-gnav-link:hover { opacity: 1; }

/* sub nav */
.style-apple .ap-subnav {
  background: rgba(245,245,247,0.8); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(0,0,0,0.08); position: sticky; top: 0; z-index: 50;
}
.style-apple .ap-subnav-inner { max-width: 1024px; margin: 0 auto; padding: 0 24px; height: 52px; display: flex; align-items: center; justify-content: space-between; }
.style-apple .ap-subnav-title { font-size: 21px; font-weight: 600; letter-spacing: 0.231px; color: #1d1d1f; }

/* buttons */
.style-apple .ap-btn {
  display: inline-flex; align-items: center; border-radius: 9999px; text-decoration: none;
  font-size: 17px; font-weight: 400; padding: 11px 22px; transition: transform 0.1s ease;
}
.style-apple .ap-btn:active { transform: scale(0.95); }
.style-apple .ap-btn-primary { background: #0066cc; color: #ffffff; }
.style-apple .ap-btn-ghost { background: transparent; color: #0066cc; border: 1px solid #0066cc; }
.style-apple .ap-btn-small { font-size: 14px; padding: 8px 16px; background: #0066cc; color: #ffffff; }

/* tiles */
.style-apple .ap-tile { padding: 80px 0; }
.style-apple .ap-tile-white { background: #ffffff; }
.style-apple .ap-tile-parchment { background: #f5f5f7; }
.style-apple .ap-tile-dark { background: #272729; color: #ffffff; }
.style-apple .ap-tile-dark2 { background: #2a2a2c; color: #ffffff; }
.style-apple .ap-tile-dark3 { background: #252527; color: #ffffff; }

/* hero */
.style-apple .ap-h1 {
  font-size: 56px; font-weight: 600; line-height: 1.07; letter-spacing: -0.28px;
  margin: 0; max-width: 980px; color: #1d1d1f;
}
.style-apple .ap-lead { font-size: 28px; font-weight: 400; line-height: 1.25; letter-spacing: 0.196px; color: #1d1d1f; max-width: 800px; margin: 24px 0 0; }
.style-apple .ap-authors { font-size: 14px; color: #7a7a7a; margin: 32px 0 0; max-width: 840px; }
.style-apple .ap-affil { font-size: 12px; color: #7a7a7a; margin: 6px 0 0; }
.style-apple .ap-btn-row { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 28px; }

/* headings */
.style-apple .ap-h2 { font-size: 40px; font-weight: 600; line-height: 1.1; letter-spacing: 0; margin: 0 0 32px; color: #1d1d1f; }
.style-apple .ap-h3 { font-size: 21px; font-weight: 600; letter-spacing: 0.231px; margin: 0 0 24px; color: #1d1d1f; }
.style-apple .ap-on-dark { color: #ffffff; }
.style-apple .ap-sub-dark { font-size: 21px; font-weight: 400; color: #cccccc; margin: -16px 0 40px; }
.style-apple .ap-body-lg { font-size: 24px; font-weight: 300; line-height: 1.5; color: #1d1d1f; margin: 0; }
.style-apple .ap-caption-note { font-size: 14px; color: #7a7a7a; margin: -16px 0 24px; }
.style-apple .ap-underline-demo { text-decoration: underline; text-underline-offset: 3px; }

/* stats */
.style-apple .ap-stats-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 32px; }
.style-apple .ap-stat { text-align: center; }
.style-apple .ap-stat-value { font-size: 48px; font-weight: 600; letter-spacing: -1px; line-height: 1.1; color: #1d1d1f; }
.style-apple .ap-stat-label { font-size: 14px; font-weight: 600; color: #333333; margin-top: 8px; }
.style-apple .ap-stat-desc { font-size: 12px; color: #7a7a7a; margin-top: 4px; }

/* lab capability secondary band */
.style-apple .ap-labstats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-top: 40px; padding-top: 28px; border-top: 1px solid #e0e0e0; }
.style-apple .ap-labstat { text-align: center; }
.style-apple .ap-labstat-value { font-size: 26px; font-weight: 600; letter-spacing: -0.5px; color: #1d1d1f; display: block; }
.style-apple .ap-labstat-label { font-size: 12px; font-weight: 600; color: #7a7a7a; display: block; margin-top: 4px; }

/* dimension cards on dark */
.style-apple .ap-dim-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
.style-apple .ap-dim-card { background: #2a2a2c; border-radius: 18px; padding: 32px; }
.style-apple .ap-dim-title { font-size: 21px; font-weight: 600; color: #ffffff; margin: 0 0 4px; }
.style-apple .ap-dim-tagline { font-size: 14px; color: #cccccc; margin: 0 0 16px; }
.style-apple .ap-list { margin: 0; padding: 0; list-style: none; }
.style-apple .ap-list li { font-size: 15px; color: #cccccc; padding: 6px 0 6px 18px; position: relative; }
.style-apple .ap-list li::before { content: ''; position: absolute; left: 0; top: 14px; width: 6px; height: 6px; border-radius: 50%; background: #2997ff; }
.style-apple .ap-list-dark li { color: #cccccc; }

/* pathway */
.style-apple .ap-path { display: flex; align-items: stretch; gap: 12px; flex-wrap: wrap; }
.style-apple .ap-path-stage { flex: 1 1 240px; background: #ffffff; border: 1px solid #e0e0e0; border-radius: 18px; padding: 24px; }
.style-apple .ap-path-stage-name { font-size: 12px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; margin: 0 0 14px; color: #7a7a7a; }
.style-apple .ap-path-stage-2 .ap-path-stage-name { color: #0066cc; }
.style-apple .ap-path-flow { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.style-apple .ap-path-node { background: #fafafc; border: 1px solid #e0e0e0; border-radius: 12px; padding: 10px 14px; min-width: 96px; }
.style-apple .ap-path-node-id { display: block; font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 12px; color: #0066cc; }
.style-apple .ap-path-node-label { display: block; font-size: 13px; color: #333333; margin-top: 4px; line-height: 1.35; }
.style-apple .ap-path-node-hl { border: 2px solid #0066cc; background: #ffffff; }
.style-apple .ap-path-arrow { color: #7a7a7a; font-size: 14px; }
.style-apple .ap-path-arrow-big { color: #0066cc; font-size: 20px; align-self: center; }
.style-apple .ap-path-note { font-size: 14px; color: #7a7a7a; margin: 24px 0 0; max-width: 880px; }

/* table */
.style-apple .ap-table-wrap { overflow-x: auto; border: 1px solid #e0e0e0; border-radius: 18px; background: #ffffff; }
.style-apple .ap-table { width: 100%; border-collapse: collapse; font-size: 14px; min-width: 780px; }
.style-apple .ap-table th {
  text-align: left; font-size: 12px; font-weight: 600; letter-spacing: -0.12px; color: #7a7a7a;
  padding: 14px 16px; border-bottom: 1px solid #e0e0e0; background: #fafafc;
}
.style-apple .ap-table td { padding: 12px 16px; border-bottom: 1px solid #f0f0f0; color: #333333; }
.style-apple .ap-table tbody tr:last-child td { border-bottom: none; }
.style-apple .ap-rank { color: #7a7a7a; }
.style-apple .ap-model { font-weight: 600; color: #1d1d1f; }
.style-apple .ap-num { font-variant-numeric: tabular-nums; }
.style-apple .ap-best { font-weight: 600; color: #1d1d1f; }
.style-apple .ap-second { text-decoration: underline; text-underline-offset: 3px; text-decoration-color: #0066cc; }
.style-apple .ap-chip {
  display: inline-block; font-size: 12px; font-weight: 400; padding: 4px 12px; border-radius: 9999px;
  background: #fafafc; color: #333333; border: 1px solid #e0e0e0;
}
.style-apple .ap-chip-dark { background: #1d1d1f; color: #ffffff; border-color: #1d1d1f; }
.style-apple .ap-table-caption { font-size: 12px; color: #7a7a7a; margin: 16px 0 0; }

/* charts */
.style-apple .ap-chart-block { margin-top: 48px; }
.style-apple .ap-chart-block:first-of-type { margin-top: 0; }
.style-apple .ap-bars { display: flex; flex-direction: column; gap: 10px; }
.style-apple .ap-bar-row { display: grid; grid-template-columns: 240px 1fr 60px; align-items: center; gap: 12px; }
.style-apple .ap-bar-label { font-size: 14px; color: #333333; text-align: right; }
.style-apple .ap-bar-track { height: 14px; background: rgba(0,0,0,0.06); border-radius: 9999px; overflow: hidden; }
.style-apple .ap-bar-fill { height: 100%; background: #0066cc; border-radius: 9999px; }
.style-apple .ap-bar-value { font-size: 13px; font-variant-numeric: tabular-nums; color: #7a7a7a; }
.style-apple .ap-chart-duo { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; margin-top: 56px; }
.style-apple .ap-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 8px; }

/* long-horizon wall */
.style-apple .ap-horizon { display: flex; gap: 36px; align-items: flex-start; flex-wrap: wrap; }
.style-apple .ap-horizon-big { flex: 0 0 150px; }
.style-apple .ap-horizon-num { font-size: 92px; font-weight: 600; letter-spacing: -2px; line-height: 1; color: #0066cc; display: block; }
.style-apple .ap-horizon-cap { font-size: 13px; color: #7a7a7a; display: block; margin-top: 8px; }
.style-apple .ap-horizon-body { flex: 1 1 300px; }
.style-apple .ap-ratio { display: flex; height: 22px; border-radius: 9999px; overflow: hidden; background: rgba(0,0,0,0.06); }
.style-apple .ap-ratio-in { background: #7a7a7a; }
.style-apple .ap-ratio-out { background: #0066cc; min-width: 12px; }
.style-apple .ap-horizon-legend { display: flex; gap: 20px; margin-top: 12px; font-size: 13px; color: #333333; flex-wrap: wrap; }
.style-apple .ap-horizon-note { font-size: 14px; color: #7a7a7a; margin: 16px 0 0; }

/* open vs closed mean N10 */
.style-apple .ap-wavg { display: flex; gap: 48px; align-items: flex-end; }
.style-apple .ap-wavg-col { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.style-apple .ap-wavg-val { font-size: 30px; font-weight: 600; letter-spacing: -0.5px; color: #1d1d1f; }
.style-apple .ap-wavg-track { height: 150px; width: 40px; background: rgba(0,0,0,0.06); border-radius: 9999px 9999px 0 0; display: flex; align-items: flex-end; }
.style-apple .ap-wavg-fill { width: 100%; border-radius: 9999px 9999px 0 0; }
.style-apple .ap-wavg-closed { background: #0066cc; }
.style-apple .ap-wavg-open { background: #7a7a7a; }
.style-apple .ap-wavg-label { font-size: 13px; font-weight: 600; color: #333333; }
.style-apple .ap-wavg-n { font-size: 12px; color: #7a7a7a; }
.style-apple .ap-chart-note { font-size: 12px; color: #7a7a7a; margin: 16px 0 0; }

/* task cards on dark */
.style-apple .ap-task-card { background: #272729; border-radius: 18px; padding: 28px; }
.style-apple .ap-task-accent { outline: 2px solid #2997ff; outline-offset: -2px; }
.style-apple .ap-task-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; gap: 12px; flex-wrap: wrap; }
.style-apple .ap-task-domain { font-size: 14px; font-weight: 600; color: #ffffff; }
.style-apple .ap-task-badge { font-size: 12px; font-weight: 600; color: #2997ff; border: 1px solid #2997ff; border-radius: 9999px; padding: 3px 10px; }
.style-apple .ap-task-desc { font-size: 15px; color: #cccccc; margin: 0; }

/* closed loop */
.style-apple .ap-loop-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.style-apple .ap-loop-col { background: #fafafc; border: 1px solid #e0e0e0; border-radius: 18px; padding: 28px; }
.style-apple .ap-loop-list { margin: 0; padding: 0; list-style: none; }
.style-apple .ap-loop-list li { font-size: 15px; color: #333333; padding: 6px 0 6px 26px; position: relative; }
.style-apple .ap-loop-mark { position: absolute; left: 0; top: 6px; font-weight: 600; }
.style-apple .ap-loop-yes { color: #0066cc; }
.style-apple .ap-loop-no { color: #7a7a7a; }

/* failures */
.style-apple .ap-fail-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; }
.style-apple .ap-fail { background: #ffffff; border: 1px solid #e0e0e0; border-radius: 18px; padding: 24px; }
.style-apple .ap-fail-name { font-size: 14px; font-weight: 600; color: #333333; }
.style-apple .ap-fail-desc { font-size: 13px; color: #7a7a7a; margin: 10px 0 0; }
.style-apple .ap-fail-note { font-size: 14px; color: #7a7a7a; margin: 32px 0 0; max-width: 880px; border-left: 3px solid #0066cc; padding-left: 16px; }

/* methodology */
.style-apple .ap-method-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 56px; align-items: start; }
.style-apple .ap-method-sub { font-size: 12px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; color: #2997ff; margin: 24px 0 10px; }
.style-apple .ap-formulas { display: flex; flex-direction: column; gap: 8px; margin: 20px 0 28px; }
.style-apple .ap-formula {
  font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13px;
  color: #cccccc; background: #1b1b1d; border-radius: 12px; padding: 10px 14px; display: block;
}
.style-apple .ap-code-card { background: #1b1b1d; border-radius: 18px; overflow: hidden; }
.style-apple .ap-code {
  margin: 0; padding: 28px; font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 13px; line-height: 1.6; color: #cccccc; overflow-x: auto; white-space: pre;
}

/* footer */
.style-apple .ap-footer { background: #f5f5f7; color: #333333; padding: 64px 0; font-size: 12px; letter-spacing: -0.12px; }
.style-apple .ap-footer-line { font-size: 14px; font-weight: 600; color: #1d1d1f; margin: 0 0 12px; }
.style-apple .ap-footer p { margin: 4px 0; }
.style-apple .ap-footer-fine { color: #7a7a7a; }

@media (max-width: 960px) {
  .style-apple .ap-stats-grid { grid-template-columns: repeat(3, 1fr); }
  .style-apple .ap-labstats { grid-template-columns: repeat(2, 1fr); }
  .style-apple .ap-dim-grid, .style-apple .ap-chart-duo, .style-apple .ap-method-grid, .style-apple .ap-loop-grid { grid-template-columns: 1fr; }
  .style-apple .ap-fail-grid { grid-template-columns: repeat(2, 1fr); }
  .style-apple .ap-h1 { font-size: 34px; }
  .style-apple .ap-h2 { font-size: 28px; }
  .style-apple .ap-tile { padding: 56px 0; }
  .style-apple .ap-global-nav .ap-gnav-link:nth-child(n+3) { display: none; }
}
@media (max-width: 560px) {
  .style-apple .ap-stats-grid { grid-template-columns: repeat(2, 1fr); }
  .style-apple .ap-fail-grid { grid-template-columns: 1fr; }
  .style-apple .ap-bar-row { grid-template-columns: 124px 1fr 52px; }
  .style-apple .ap-bar-label { font-size: 11px; }
}
`
