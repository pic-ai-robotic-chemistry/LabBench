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

const N10_MAX = Math.max(...leaderboard.map((r) => r.n10))
const N10_SECOND = Math.max(...leaderboard.filter((r) => r.n10 !== N10_MAX).map((r) => r.n10))
const MAX_WEIGHTS_AVG = Math.max(...weightsAvg.map((w) => w.value))
const LH_UNDER = longHorizon.totalExecutable - longHorizon.over30Ops
const stageIndex = (stage: string) => pathwayStages.indexOf(stage)
const DOMAIN_BADGES = ['#fb923c', '#ec4899', '#8b5cf6', '#34d399']

export default function Cal() {
  return (
    <div className="style-cal">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400&display=swap"
      />
      <style>{CSS}</style>

      {/* ── Nav ─────────────────────────────────────────── */}
      <header className="cal-nav">
        <div className="cal-nav-inner">
          <span className="cal-wordmark">
            <span className="cal-wordmark-dot" />
            RoboChem<span className="cal-wordmark-tld">.bench</span>
          </span>
          <nav className="cal-nav-pill-group" aria-label="Sections">
            <a href="#abstract" className="cal-tab cal-tab-active">Overview</a>
            <a href="#leaderboard" className="cal-tab">Leaderboard</a>
            <a href="#results" className="cal-tab">Results</a>
            <a href="#methods" className="cal-tab">Methods</a>
          </nav>
          <div className="cal-nav-right">
            <Link to="/" className="cal-text-link">← Back to Gallery</Link>
            <a href="#" className="cal-btn-primary">Submit Your Agent</a>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────── */}
      <section className="cal-hero">
        <div className="cal-wrap cal-hero-inner">
          <span className="cal-badge-pill">{paperMeta.affiliation}</span>
          <h1 className="cal-hero-title">{paperMeta.title}</h1>
          <p className="cal-hero-sub">{paperMeta.subtitle}</p>
          <p className="cal-hero-authors">
            {paperMeta.authors.join(', ')}
          </p>
          <p className="cal-hero-affil">{paperMeta.affiliation}</p>
          <div className="cal-hero-actions">
            {paperMeta.links.map((l, i) => (
              <a key={l.label} href={l.href} className={i === 0 ? 'cal-btn-primary' : 'cal-btn-secondary'}>
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats band ──────────────────────────────────── */}
      <section className="cal-stats">
        <div className="cal-wrap cal-stats-grid">
          {keyStats.map((s) => (
            <div key={s.label} className="cal-stat-card">
              <div className="cal-stat-value">{s.value}</div>
              <div className="cal-stat-label">{s.label}</div>
              <div className="cal-stat-desc">{s.description}</div>
            </div>
          ))}
        </div>
        <div className="cal-wrap cal-labstats">
          {labStats.map((s) => (
            <span key={s.label} className="cal-labstat">
              <strong>{s.value}</strong> {s.label.toLowerCase()}
            </span>
          ))}
        </div>
      </section>

      {/* ── Abstract ────────────────────────────────────── */}
      <section id="abstract" className="cal-section cal-section-soft">
        <div className="cal-wrap cal-prose">
          <p className="cal-kicker">Abstract</p>
          <p className="cal-abstract">{abstractText}</p>
        </div>
      </section>

      {/* ── Skills library ──────────────────────────────── */}
      <section className="cal-section">
        <div className="cal-wrap">
          <p className="cal-kicker">The skills library</p>
          <h2 className="cal-h2">45 workstations, one skills library</h2>
          <div className="cal-dim-grid">
            {skillCategories.map((d) => (
              <div key={d.name} className="cal-feature-card">
                <h3 className="cal-title-md">{d.name}</h3>
                <p className="cal-dim-tag">{d.tagline}</p>
                <ul className="cal-dim-list">
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
      <section className="cal-section cal-section-soft">
        <div className="cal-wrap">
          <p className="cal-kicker">Evaluation pathway</p>
          <h2 className="cal-h2">From task received to physical execution</h2>
          <div className="cal-path-flow">
            {pathway.map((n, i) => (
              <Fragment key={n.node}>
                {i > 0 && (
                  <span className="cal-path-arrow" aria-hidden="true">
                    →
                  </span>
                )}
                <div
                  className={`cal-path-node cal-path-s${stageIndex(n.stage)}${n.node === 'N10' ? ' cal-path-final' : ''}`}
                >
                  <span className="cal-path-node-id">{n.node}</span>
                  <span className="cal-path-node-label">{n.label}</span>
                </div>
              </Fragment>
            ))}
          </div>
          <div className="cal-path-legend">
            {pathwayStages.map((s, i) => (
              <span key={s} className="cal-path-legend-item">
                <span className={`cal-dot cal-path-dot-s${i}`} />
                {s}
              </span>
            ))}
          </div>
          <p className="cal-section-note cal-path-note">{pathwayNote}</p>
        </div>
      </section>

      {/* ── Leaderboard ─────────────────────────────────── */}
      <section id="leaderboard" className="cal-section">
        <div className="cal-wrap">
          <p className="cal-kicker">Leaderboard</p>
          <h2 className="cal-h2">Top 8 of 48 configurations, ranked by N10 yield</h2>
          <p className="cal-section-note">
            N10 yield is the share of 96 trials per configuration adjudicated executable by experts.{' '}
            <strong>Bold</strong> marks the best; <span className="cal-underline">underline</span> the runner-up.
          </p>
          <div className="cal-table-card">
            <table className="cal-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Configuration</th>
                  <th>Organization</th>
                  <th>Weights</th>
                  <th className="cal-th-num">Trials</th>
                  <th className="cal-th-num">Executable</th>
                  <th className="cal-th-num">N10 Yield</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((r) => (
                  <tr key={r.rank}>
                    <td className="cal-td-rank">{r.rank}</td>
                    <td className="cal-td-model">
                      {r.harness} × {r.model}
                    </td>
                    <td className="cal-td-org">{r.org}</td>
                    <td>
                      <span className={r.weights === 'open' ? 'cal-badge cal-badge-open' : 'cal-badge'}>
                        {r.weights === 'open' ? 'Open' : 'Closed'}
                      </span>
                    </td>
                    <td className="cal-td-num">{r.trials}</td>
                    <td className="cal-td-num">{r.executable}</td>
                    <td
                      className={`cal-td-num ${
                        r.n10 === N10_MAX ? 'cal-best' : r.n10 === N10_SECOND ? 'cal-second' : ''
                      }`}
                    >
                      {r.n10.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="cal-section-note cal-table-caption">{leaderboardCaption}</p>
        </div>
      </section>

      {/* ── Charts ──────────────────────────────────────── */}
      <section id="results" className="cal-section cal-section-soft">
        <div className="cal-wrap">
          <p className="cal-kicker">Results</p>
          <h2 className="cal-h2">Reading the results</h2>
          <div className="cal-chart-grid">
            <div className="cal-mockup-card cal-chart-wide">
              <h3 className="cal-title-md">N10 executable yield — top 8 configurations</h3>
              <p className="cal-chart-note">Expert-adjudicated executable rate at N10, in percent.</p>
              <div className="cal-bars">
                {leaderboard.map((r) => (
                  <div key={r.rank} className="cal-bar-row">
                    <span className="cal-bar-name">
                      {r.harness} × {r.model}
                    </span>
                    <span className="cal-bar-track">
                      <span
                        className="cal-bar-fill"
                        style={{
                          width: `${(r.n10 / N10_MAX) * 100}%`,
                          background: r.weights === 'open' ? '#34d399' : '#111111',
                        }}
                      />
                    </span>
                    <span className="cal-bar-val">{r.n10.toFixed(1)}</span>
                  </div>
                ))}
              </div>
              <p className="cal-chart-note">
                <span className="cal-legend-inline"><i style={{ background: '#111111' }} /> Closed</span>
                <span className="cal-legend-inline"><i style={{ background: '#34d399' }} /> Open</span>
              </p>
            </div>
            <div className="cal-mockup-card">
              <h3 className="cal-title-md">The long-horizon wall</h3>
              <div className="cal-lh">
                <div className="cal-lh-top">
                  <span className="cal-lh-big">{longHorizon.longest}</span>
                  <span className="cal-lh-big-label">operations in the longest executable workflow</span>
                </div>
                <div className="cal-lh-bar">
                  <span
                    className="cal-lh-under"
                    style={{ width: `${(LH_UNDER / longHorizon.totalExecutable) * 100}%` }}
                  />
                  <span
                    className="cal-lh-over"
                    style={{ width: `${(longHorizon.over30Ops / longHorizon.totalExecutable) * 100}%` }}
                  />
                </div>
                <div className="cal-lh-legend">
                  <span>{LH_UNDER} workflows · ≤ 30 ops</span>
                  <span>{longHorizon.over30Ops} · &gt; 30 ops</span>
                </div>
                <p className="cal-chart-note cal-lh-note">{longHorizon.note}</p>
              </div>
            </div>
            <div className="cal-mockup-card">
              <h3 className="cal-title-md">Open vs closed weights</h3>
              <p className="cal-chart-note">Mean N10 yield within each family.</p>
              <div className="cal-grouped">
                {weightsAvg.map((g) => (
                  <div key={g.group} className="cal-group">
                    <span className="cal-group-label">
                      {g.group} · n = {g.n}
                    </span>
                    <div className="cal-group-bars">
                      <div className="cal-group-row">
                        <span className="cal-group-tag">N10</span>
                        <span className="cal-bar-track">
                          <span
                            className="cal-bar-fill"
                            style={{
                              width: `${(g.value / MAX_WEIGHTS_AVG) * 100}%`,
                              background: g.group.startsWith('Open') ? '#34d399' : '#111111',
                            }}
                          />
                        </span>
                        <span className="cal-bar-val">{g.value.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="cal-chart-note">{weightsAvgCaption}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Task domains ────────────────────────────────── */}
      <section className="cal-section">
        <div className="cal-wrap">
          <p className="cal-kicker">Task domains</p>
          <h2 className="cal-h2">Four catalysis domains, 32 research tasks</h2>
          <div className="cal-task-grid">
            {taskDomains.map((t, i) => (
              <div key={t.domain} className="cal-feature-card cal-task">
                <div className="cal-task-head">
                  <span className="cal-badge-pill" style={{ background: `${DOMAIN_BADGES[i]}22`, color: '#111111' }}>
                    <span className="cal-dot" style={{ background: DOMAIN_BADGES[i] }} />
                    {t.domain}
                  </span>
                  {t.domain === 'Electrocatalysis' && (
                    <span className="cal-badge cal-badge-open">Closed-loop study</span>
                  )}
                </div>
                <p className="cal-task-desc">{t.blurb}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Closed-loop adaptation ──────────────────────── */}
      <section className="cal-section cal-section-soft">
        <div className="cal-wrap">
          <p className="cal-kicker">Closed-loop adaptation</p>
          <h2 className="cal-h2">Five rounds of feedback, local adjustments only</h2>
          <p className="cal-section-note">
            Agent {closedLoop.agent} · Task: {closedLoop.task} · {closedLoop.rounds} feedback rounds
          </p>
          <div className="cal-loop-grid">
            <div className="cal-mockup-card">
              <h3 className="cal-title-md">Localized adaptation observed</h3>
              <ul className="cal-loop-list">
                {closedLoop.adapted.map((a) => (
                  <li key={a}>
                    <span className="cal-loop-yes" aria-hidden="true">✓</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
            <div className="cal-mockup-card">
              <h3 className="cal-title-md">Strategic redirection not observed</h3>
              <ul className="cal-loop-list">
                {closedLoop.notObserved.map((a) => (
                  <li key={a}>
                    <span className="cal-loop-no" aria-hidden="true">✗</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Failure modes ───────────────────────────────── */}
      <section className="cal-section">
        <div className="cal-wrap">
          <p className="cal-kicker">Failure analysis</p>
          <h2 className="cal-h2">Where agents break</h2>
          <div className="cal-fail-grid">
            {failureModes.map((f) => (
              <div key={f.name} className="cal-mockup-card cal-fail">
                <div className="cal-fail-top">
                  <span className="cal-fail-name">{f.name}</span>
                </div>
                <p className="cal-fail-desc">{f.description}</p>
              </div>
            ))}
          </div>
          <p className="cal-section-note cal-fail-note">{failureNote}</p>
        </div>
      </section>

      {/* ── Methods + BibTeX ────────────────────────────── */}
      <section id="methods" className="cal-section cal-section-soft">
        <div className="cal-wrap cal-methods-grid">
          <div>
            <p className="cal-kicker">Methodology</p>
            <h2 className="cal-h2">How we ran the bench</h2>
            <ul className="cal-method-list">
              {methodologyNotes.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
            <p className="cal-kicker cal-mt">Scoring rubric</p>
            <div className="cal-axes">
              {scoringAxes.map((a) => (
                <span key={a} className="cal-badge-pill cal-axis">{a}</span>
              ))}
            </div>
            <div className="cal-code-card cal-formula-block">
              <div className="cal-code-head">
                <span>scoring.ts</span>
                <span className="cal-code-lang">formulas</span>
              </div>
              <pre>{formulas.join('\n')}</pre>
            </div>
          </div>
          <div>
            <p className="cal-kicker">Citation</p>
            <div className="cal-code-card">
              <div className="cal-code-head">
                <span>guo2026stresstesting.bib</span>
                <span className="cal-code-lang">bibtex</span>
              </div>
              <pre>{bibtex}</pre>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="cal-footer">
        <div className="cal-wrap">
          <div className="cal-footer-top">
            <span className="cal-footer-wordmark">
              <span className="cal-wordmark-dot" />
              RoboChem<span className="cal-footer-tld">.bench</span>
            </span>
          </div>
          <div className="cal-footer-cols">
            <div>
              <p className="cal-footer-head">Paper</p>
              <a href="#abstract">Abstract</a>
              <a href="#leaderboard">Leaderboard</a>
              <a href="#results">Results</a>
              <a href="#methods">Methods</a>
            </div>
            <div>
              <p className="cal-footer-head">Resources</p>
              <a href={paperMeta.links[0].href}>Paper (arXiv)</a>
              <a href="#">Code (GitHub)</a>
              <a href="#">Dataset</a>
              <a href="#">Submit Your Agent</a>
            </div>
            <div>
              <p className="cal-footer-head">Gallery</p>
              <Link to="/">← Back to Gallery</Link>
            </div>
          </div>
          <p className="cal-footer-note">Style preview · Cal.com DESIGN.md · Content from arXiv:2607.23045</p>
        </div>
      </footer>
    </div>
  )
}

const CSS = `
.style-cal {
  background: #ffffff; color: #111111;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 16px; line-height: 1.5; min-height: 100dvh;
}
.style-cal * { box-sizing: border-box; }
.style-cal a { text-decoration: none; color: inherit; }
.cal-wrap { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
.cal-prose { max-width: 760px; }
.cal-kicker { font-size: 14px; font-weight: 600; color: #6b7280; margin: 0 0 12px; }
.cal-h2 { font-size: 36px; font-weight: 600; line-height: 1.15; letter-spacing: -1px; margin: 0 0 16px; }
.cal-title-md { font-size: 18px; font-weight: 600; line-height: 1.4; margin: 0; }
.cal-section { padding: 96px 0; }
.cal-section-soft { background: #f8f9fa; }
.cal-section-note { font-size: 14px; color: #6b7280; margin: 0 0 24px; max-width: 640px; }
.cal-underline { text-decoration: underline; text-underline-offset: 3px; }

/* Nav */
.cal-nav {
  position: sticky; top: 0; z-index: 50; background: #ffffff;
  border-bottom: 1px solid #f3f4f6; height: 64px; display: flex; align-items: center;
}
.cal-nav-inner {
  max-width: 1200px; margin: 0 auto; padding: 0 24px; width: 100%;
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
}
.cal-wordmark { display: inline-flex; align-items: center; gap: 8px; font-size: 17px; font-weight: 600; letter-spacing: -0.3px; }
.cal-wordmark-dot { width: 10px; height: 10px; border-radius: 9999px; background: #111111; display: inline-block; }
.cal-wordmark-tld { color: #6b7280; }
.cal-nav-pill-group {
  display: flex; gap: 2px; background: #f8f9fa; border-radius: 9999px; padding: 6px;
}
.cal-tab { font-size: 14px; font-weight: 500; color: #6b7280; padding: 8px 14px; border-radius: 8px; }
.cal-tab-active { background: #ffffff; color: #111111; box-shadow: 0 1px 2px rgba(0,0,0,0.06); }
.cal-nav-right { display: flex; align-items: center; gap: 16px; }
.cal-text-link { font-size: 14px; font-weight: 600; color: #111111; white-space: nowrap; }
.cal-text-link:hover { text-decoration: underline; text-underline-offset: 4px; }

/* Buttons */
.style-cal .cal-btn-primary {
  background: #111111; color: #ffffff; font-size: 14px; font-weight: 600;
  padding: 12px 20px; border-radius: 8px; display: inline-flex; align-items: center; height: 40px; white-space: nowrap;
}
.cal-btn-primary:hover { background: #242424; }
.cal-btn-secondary {
  background: #ffffff; color: #111111; font-size: 14px; font-weight: 600;
  padding: 12px 20px; border-radius: 8px; border: 1px solid #e5e7eb;
  display: inline-flex; align-items: center; height: 40px; white-space: nowrap;
}
.cal-btn-secondary:hover { border-color: #111111; }

/* Hero */
.cal-hero { padding: 96px 0 64px; }
.cal-hero-inner { max-width: 840px; }
.cal-badge-pill {
  display: inline-flex; align-items: center; gap: 6px; background: #f5f5f5; color: #111111;
  font-size: 13px; font-weight: 500; padding: 4px 12px; border-radius: 9999px; margin-bottom: 24px;
}
.cal-hero-title { font-size: 56px; font-weight: 600; line-height: 1.05; letter-spacing: -2px; margin: 0 0 20px; }
.cal-hero-sub { font-size: 18px; line-height: 1.5; color: #374151; margin: 0 0 16px; max-width: 720px; }
.cal-hero-authors { font-size: 14px; color: #6b7280; margin: 0 0 4px; }
.cal-hero-affil { font-size: 14px; color: #898989; margin: 0 0 32px; }
.cal-hero-actions { display: flex; flex-wrap: wrap; gap: 12px; }

/* Stats */
.cal-stats { padding: 0 0 64px; }
.cal-stats-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 16px; }
.cal-stat-card { background: #f5f5f5; border-radius: 12px; padding: 20px; }
.cal-stat-value { font-size: 32px; font-weight: 600; letter-spacing: -1px; line-height: 1.1; }
.cal-stat-label { font-size: 13px; font-weight: 600; margin-top: 6px; }
.cal-stat-desc { font-size: 12px; color: #6b7280; margin-top: 2px; line-height: 1.4; }

/* Abstract */
.cal-abstract { font-size: 18px; line-height: 1.6; color: #374151; margin: 0; }

/* Dimension cards */
.cal-dim-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; margin-top: 32px; }
.cal-feature-card { background: #f5f5f5; border-radius: 12px; padding: 32px; }
.cal-dim-tag { font-size: 13px; color: #6b7280; margin: 6px 0 18px; }
.cal-dim-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
.cal-dim-list li {
  font-size: 14px; color: #374151; padding-left: 20px; position: relative;
}
.cal-dim-list li::before {
  content: ''; position: absolute; left: 0; top: 8px; width: 8px; height: 8px;
  border-radius: 9999px; background: #111111;
}

/* Table */
.cal-table-card {
  background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow-x: auto;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}
.cal-table { width: 100%; border-collapse: collapse; font-size: 14px; min-width: 880px; }
.cal-table th {
  text-align: left; font-size: 13px; font-weight: 500; color: #6b7280;
  padding: 14px 16px; border-bottom: 1px solid #e5e7eb; white-space: nowrap;
}
.cal-table td { padding: 13px 16px; border-bottom: 1px solid #f3f4f6; white-space: nowrap; }
.cal-table tbody tr:last-child td { border-bottom: none; }
.cal-table tbody tr:hover { background: #f8f9fa; }
.cal-th-num, .cal-td-num { text-align: right; font-variant-numeric: tabular-nums; }
.cal-td-rank { color: #898989; }
.cal-td-model { font-weight: 600; }
.cal-td-org { color: #6b7280; }
.cal-best { font-weight: 600; color: #111111; }
.cal-second { text-decoration: underline; text-underline-offset: 3px; }
.cal-badge {
  display: inline-block; background: #f5f5f5; color: #111111; font-size: 13px; font-weight: 500;
  padding: 4px 12px; border-radius: 9999px;
}
.cal-badge-open { background: rgba(52, 211, 153, 0.18); }

/* Charts */
.cal-chart-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 32px; }
.cal-chart-wide { grid-column: 1 / -1; }
.cal-mockup-card {
  background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}
.cal-chart-note { font-size: 13px; color: #6b7280; margin: 6px 0 20px; display: flex; gap: 16px; flex-wrap: wrap; }
.cal-bars { display: grid; gap: 8px; }
.cal-bar-row { display: grid; grid-template-columns: 160px 1fr 48px; align-items: center; gap: 12px; }
.cal-bar-name { font-size: 13px; color: #374151; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cal-bar-track { display: block; height: 16px; background: #f3f4f6; border-radius: 6px; overflow: hidden; }
.cal-bar-fill { display: block; height: 100%; border-radius: 6px; }
.cal-bar-val { font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 12px; color: #6b7280; text-align: right; }
.cal-legend-inline { display: inline-flex; align-items: center; gap: 6px; }
.cal-legend-inline i { width: 10px; height: 10px; border-radius: 3px; display: inline-block; }
.cal-radar { width: 100%; height: auto; display: block; }
.cal-radar-label { font-size: 11px; font-weight: 500; fill: #6b7280; font-family: 'Inter', sans-serif; }
.cal-legend { list-style: none; margin: 12px 0 0; padding: 0; display: grid; gap: 6px; }
.cal-legend li { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #374151; }
.cal-dot { width: 10px; height: 10px; border-radius: 9999px; display: inline-block; }
.cal-grouped { display: grid; gap: 18px; }
.cal-group-label { font-size: 14px; font-weight: 600; display: block; margin-bottom: 8px; }
.cal-group-bars { display: grid; gap: 6px; }
.cal-group-row { display: grid; grid-template-columns: 52px 1fr 48px; align-items: center; gap: 10px; }
.cal-group-tag { font-size: 12px; color: #898989; }

/* Tasks */
.cal-task-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; margin-top: 32px; }
.cal-task { display: flex; flex-direction: column; gap: 16px; }
.cal-task-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap; }
.cal-task-head .cal-badge-pill { margin-bottom: 0; }
.cal-stars { color: #fb923c; font-size: 14px; letter-spacing: 2px; }
.cal-task-desc { font-size: 15px; line-height: 1.55; color: #374151; margin: 0; flex: 1; }
.cal-task-meta { display: flex; gap: 8px; }
.cal-task-meta .cal-badge-pill { margin-bottom: 0; }

/* Failure modes */
.cal-fail-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-top: 32px; }
.cal-fail { display: flex; flex-direction: column; gap: 12px; }
.cal-fail-top { display: flex; flex-direction: column; gap: 4px; }
.cal-fail-pct { font-size: 32px; font-weight: 600; letter-spacing: -1px; }
.cal-fail-name { font-size: 14px; font-weight: 600; }
.cal-fail-track { height: 6px; background: #f3f4f6; border-radius: 9999px; overflow: hidden; }
.cal-fail-fill { display: block; height: 100%; background: #ef4444; border-radius: 9999px; }
.cal-fail-desc { font-size: 13px; color: #6b7280; margin: 0; line-height: 1.5; }

/* Methods */
.cal-methods-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; }
.cal-method-list { list-style: none; margin: 24px 0 0; padding: 0; display: grid; gap: 14px; }
.cal-method-list li { font-size: 15px; color: #374151; padding-left: 22px; position: relative; }
.cal-method-list li::before {
  content: ''; position: absolute; left: 0; top: 7px; width: 10px; height: 10px;
  border-radius: 9999px; border: 2px solid #111111;
}
.cal-code-card {
  background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; margin-top: 16px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}
.cal-code-head {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 16px; border-bottom: 1px solid #f3f4f6;
  font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 13px; color: #374151;
}
.cal-code-lang { font-size: 12px; color: #898989; background: #f5f5f5; padding: 2px 8px; border-radius: 9999px; }
.cal-code-card pre {
  margin: 0; padding: 20px; font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 13px; line-height: 1.6; color: #111111; overflow-x: auto; background: #f8f9fa;
}

/* Footer */
.cal-footer { background: #101010; color: #a1a1aa; padding: 64px 0 32px; }
.cal-footer-top { margin-bottom: 40px; }
.cal-footer-wordmark { display: inline-flex; align-items: center; gap: 8px; font-size: 17px; font-weight: 600; color: #ffffff; }
.cal-footer-wordmark .cal-wordmark-dot { background: #ffffff; }
.cal-footer-tld { color: #a1a1aa; }
.cal-footer-cols { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; max-width: 720px; }
.cal-footer-head { font-size: 14px; font-weight: 600; color: #ffffff; margin: 0 0 12px; }
.cal-footer-cols a { display: block; font-size: 14px; color: #a1a1aa; padding: 4px 0; }
.cal-footer-cols a:hover { color: #ffffff; }
.cal-footer-note { font-size: 13px; color: #6b7280; margin: 48px 0 0; border-top: 1px solid #1a1a1a; padding-top: 24px; }

@media (max-width: 1024px) {
  .cal-stats-grid { grid-template-columns: repeat(3, 1fr); }
  .cal-fail-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 860px) {
  .cal-nav-pill-group { display: none; }
  .cal-hero-title { font-size: 38px; letter-spacing: -1px; }
  .cal-h2 { font-size: 28px; }
  .cal-section { padding: 64px 0; }
  .cal-dim-grid, .cal-task-grid, .cal-chart-grid, .cal-methods-grid { grid-template-columns: 1fr; }
}
@media (max-width: 560px) {
  .cal-stats-grid { grid-template-columns: repeat(2, 1fr); }
  .cal-fail-grid { grid-template-columns: 1fr; }
  .cal-bar-row { grid-template-columns: 110px 1fr 44px; }
  .cal-footer-cols { grid-template-columns: 1fr; }
}

/* Lab capability band */
.cal-labstats { display: flex; flex-wrap: wrap; gap: 12px 28px; margin-top: 20px; }
.cal-labstat { font-size: 13px; color: #6b7280; }
.cal-labstat strong {
  font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 16px;
  font-weight: 600; color: #111111; margin-right: 6px;
}

/* Evaluation pathway */
.cal-path-flow { display: flex; flex-wrap: wrap; align-items: stretch; gap: 8px; margin-top: 32px; }
.cal-path-arrow { align-self: center; color: #898989; font-size: 14px; }
.cal-path-node {
  background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px;
  padding: 14px 16px; max-width: 200px; border-top-width: 3px;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}
.cal-path-s0 { border-top-color: #111111; }
.cal-path-s1 { border-top-color: #3b82f6; }
.cal-path-s2 { border-top-color: #8b5cf6; }
.cal-path-final { border: 2px solid #111111; background: #111111; color: #ffffff; }
.cal-path-node-id {
  display: block; font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 12px; margin-bottom: 4px; color: #6b7280;
}
.cal-path-final .cal-path-node-id { color: #34d399; font-weight: 600; }
.cal-path-node-label { display: block; font-size: 13px; line-height: 1.4; }
.cal-path-legend { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 16px; }
.cal-path-legend-item { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: #6b7280; }
.cal-path-dot-s0 { background: #111111; }
.cal-path-dot-s1 { background: #3b82f6; }
.cal-path-dot-s2 { background: #8b5cf6; }
.cal-path-note { margin-top: 16px; }
.cal-table-caption { margin-top: 12px; }

/* Long-horizon wall */
.cal-lh { margin-top: 16px; }
.cal-lh-top { display: flex; align-items: baseline; gap: 12px; }
.cal-lh-big { font-size: 64px; font-weight: 600; letter-spacing: -2px; line-height: 1; }
.cal-lh-big-label { font-size: 13px; color: #6b7280; max-width: 180px; line-height: 1.4; }
.cal-lh-bar {
  display: flex; height: 14px; border-radius: 6px; overflow: hidden;
  background: #f3f4f6; margin: 20px 0 8px;
}
.cal-lh-under { display: block; height: 100%; background: #d1d5db; }
.cal-lh-over { display: block; height: 100%; background: #111111; min-width: 6px; }
.cal-lh-legend { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; font-size: 12px; color: #6b7280; }
.cal-lh-note { margin-top: 16px; }

/* Closed-loop adaptation */
.cal-loop-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 8px; }
.cal-loop-list { list-style: none; margin: 16px 0 0; padding: 0; display: grid; gap: 10px; }
.cal-loop-list li { display: flex; gap: 10px; align-items: flex-start; font-size: 14px; color: #374151; }
.cal-loop-yes { color: #059669; font-weight: 600; flex: none; }
.cal-loop-no { color: #ef4444; font-weight: 600; flex: none; }
.cal-fail-note { margin-top: 24px; }

/* Scoring rubric */
.cal-mt { margin-top: 32px; }
.cal-axes { display: flex; flex-wrap: wrap; gap: 8px; }
.cal-axis { margin-bottom: 0; }
.cal-formula-block { margin-top: 16px; }

@media (max-width: 860px) {
  .cal-loop-grid { grid-template-columns: 1fr; }
  .cal-path-node { max-width: none; flex: 1 1 40%; }
  .cal-path-arrow { display: none; }
}
`
