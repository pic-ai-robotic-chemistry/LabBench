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

export default function Ibm() {
  return (
    <div className="style-ibm">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400&family=IBM+Plex+Sans:wght@300;400;600&display=swap"
      />
      <style>{CSS}</style>

      {/* ── Utility bar + Nav ───────────────────────────── */}
      <div className="ibm-utility">
        <div className="ibm-wrap ibm-utility-inner">
          <span>Style preview · IBM Carbon DESIGN.md</span>
          <Link to="/" className="ibm-utility-link">← Back to Gallery</Link>
        </div>
      </div>
      <header className="ibm-nav">
        <div className="ibm-wrap ibm-nav-inner">
          <span className="ibm-wordmark">RoboChem&nbsp;Bench</span>
          <nav className="ibm-nav-links">
            <a href="#abstract">Abstract</a>
            <a href="#leaderboard">Leaderboard</a>
            <a href="#results">Results</a>
            <a href="#methods">Methods</a>
          </nav>
          <a href="#" className="ibm-btn-primary ibm-nav-cta">Submit Your Agent</a>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────── */}
      <section className="ibm-hero">
        <div className="ibm-wrap">
          <p className="ibm-eyebrow">Benchmark paper · {paperMeta.affiliation}</p>
          <h1 className="ibm-hero-title">{paperMeta.title}</h1>
          <p className="ibm-hero-sub">{paperMeta.subtitle}</p>
          <p className="ibm-hero-authors">{paperMeta.authors.join(', ')}</p>
          <p className="ibm-hero-affil">{paperMeta.affiliation}</p>
          <div className="ibm-hero-actions">
            {paperMeta.links.map((l, i) => (
              <a
                key={l.label}
                href={l.href}
                className={
                  i === 0
                    ? 'ibm-btn-primary'
                    : i === 1
                      ? 'ibm-btn-secondary'
                      : i === 2
                        ? 'ibm-btn-tertiary'
                        : 'ibm-btn-ghost'
                }
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats band ──────────────────────────────────── */}
      <section className="ibm-stats">
        <div className="ibm-wrap ibm-stats-grid">
          {keyStats.map((s) => (
            <div key={s.label} className="ibm-stat">
              <div className="ibm-stat-value">{s.value}</div>
              <div className="ibm-stat-label">{s.label}</div>
              <div className="ibm-stat-desc">{s.description}</div>
            </div>
          ))}
        </div>
        <div className="ibm-wrap ibm-labstats">
          {labStats.map((s) => (
            <span key={s.label} className="ibm-labstat">
              <strong>{s.value}</strong> {s.label.toLowerCase()}
            </span>
          ))}
        </div>
      </section>

      {/* ── Abstract ────────────────────────────────────── */}
      <section id="abstract" className="ibm-section ibm-section-gray">
        <div className="ibm-wrap ibm-prose">
          <p className="ibm-eyebrow">Abstract</p>
          <p className="ibm-abstract">{abstractText}</p>
        </div>
      </section>

      {/* ── Skills library ──────────────────────────────── */}
      <section className="ibm-section">
        <div className="ibm-wrap">
          <p className="ibm-eyebrow">The skills library</p>
          <h2 className="ibm-h2">45 workstations, one skills library</h2>
          <div className="ibm-dim-grid">
            {skillCategories.map((d, i) => (
              <div key={d.name} className="ibm-card">
                <p className="ibm-card-index">0{i + 1}</p>
                <h3 className="ibm-card-title">{d.name}</h3>
                <p className="ibm-card-tag">{d.tagline}</p>
                <ul className="ibm-card-list">
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
      <section className="ibm-section ibm-section-gray">
        <div className="ibm-wrap">
          <p className="ibm-eyebrow">Evaluation pathway</p>
          <h2 className="ibm-h2">From task received to physical execution</h2>
          <div className="ibm-path-flow">
            {pathway.map((n, i) => (
              <Fragment key={n.node}>
                {i > 0 && (
                  <span className="ibm-path-arrow" aria-hidden="true">
                    →
                  </span>
                )}
                <div
                  className={`ibm-path-node ibm-path-s${stageIndex(n.stage)}${n.node === 'N10' ? ' ibm-path-final' : ''}`}
                >
                  <span className="ibm-path-node-id">{n.node}</span>
                  <span className="ibm-path-node-label">{n.label}</span>
                </div>
              </Fragment>
            ))}
          </div>
          <div className="ibm-path-legend">
            {pathwayStages.map((s, i) => (
              <span key={s} className="ibm-path-legend-item">
                <span className={`ibm-swatch ibm-path-dot-s${i}`} />
                {s}
              </span>
            ))}
          </div>
          <p className="ibm-note ibm-path-note">{pathwayNote}</p>
        </div>
      </section>

      {/* ── Leaderboard ─────────────────────────────────── */}
      <section id="leaderboard" className="ibm-section">
        <div className="ibm-wrap">
          <p className="ibm-eyebrow">Leaderboard</p>
          <h2 className="ibm-h2">Top 8 of 48 configurations, ranked by N10 yield</h2>
          <p className="ibm-note">
            N10 yield is the share of 96 trials per configuration adjudicated executable by experts.{' '}
            <strong>Bold</strong> marks the best; <span className="ibm-underline">underline</span> the runner-up.
          </p>
          <div className="ibm-table-wrap">
            <table className="ibm-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Configuration</th>
                  <th>Organization</th>
                  <th>Weights</th>
                  <th className="ibm-th-num">Trials</th>
                  <th className="ibm-th-num">Executable</th>
                  <th className="ibm-th-num">N10 Yield</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((r) => (
                  <tr key={r.rank}>
                    <td className="ibm-td-rank">{r.rank}</td>
                    <td className="ibm-td-model">
                      {r.harness} × {r.model}
                    </td>
                    <td className="ibm-td-org">{r.org}</td>
                    <td>
                      <span className={r.weights === 'open' ? 'ibm-tag ibm-tag-open' : 'ibm-tag'}>
                        {r.weights === 'open' ? 'Open' : 'Closed'}
                      </span>
                    </td>
                    <td className="ibm-td-num">{r.trials}</td>
                    <td className="ibm-td-num">{r.executable}</td>
                    <td
                      className={`ibm-td-num ${
                        r.n10 === N10_MAX ? 'ibm-best' : r.n10 === N10_SECOND ? 'ibm-second' : ''
                      }`}
                    >
                      {r.n10.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="ibm-note ibm-table-caption">{leaderboardCaption}</p>
        </div>
      </section>

      {/* ── Charts ──────────────────────────────────────── */}
      <section id="results" className="ibm-section ibm-section-gray">
        <div className="ibm-wrap">
          <p className="ibm-eyebrow">Results</p>
          <h2 className="ibm-h2">Reading the results</h2>
          <div className="ibm-chart-grid">
            <div className="ibm-card ibm-chart-wide">
              <h3 className="ibm-card-title">N10 executable yield — top 8 configurations</h3>
              <p className="ibm-chart-note">
                Expert-adjudicated executable rate at N10, in percent. Blue bars: closed-weight. Gray bars:
                open-weight.
              </p>
              <div className="ibm-bars">
                {leaderboard.map((r) => (
                  <div key={r.rank} className="ibm-bar-row">
                    <span className="ibm-bar-name">
                      {r.harness} × {r.model}
                    </span>
                    <span className="ibm-bar-track">
                      <span
                        className="ibm-bar-fill"
                        style={{
                          width: `${(r.n10 / N10_MAX) * 100}%`,
                          background: r.weights === 'open' ? '#8c8c8c' : '#0f62fe',
                        }}
                      />
                    </span>
                    <span className="ibm-bar-val">{r.n10.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="ibm-card">
              <h3 className="ibm-card-title">The long-horizon wall</h3>
              <div className="ibm-lh">
                <div className="ibm-lh-top">
                  <span className="ibm-lh-big">{longHorizon.longest}</span>
                  <span className="ibm-lh-big-label">operations in the longest executable workflow</span>
                </div>
                <div className="ibm-lh-bar">
                  <span
                    className="ibm-lh-under"
                    style={{ width: `${(LH_UNDER / longHorizon.totalExecutable) * 100}%` }}
                  />
                  <span
                    className="ibm-lh-over"
                    style={{ width: `${(longHorizon.over30Ops / longHorizon.totalExecutable) * 100}%` }}
                  />
                </div>
                <div className="ibm-lh-legend">
                  <span>{LH_UNDER} workflows · ≤ 30 ops</span>
                  <span>{longHorizon.over30Ops} · &gt; 30 ops</span>
                </div>
                <p className="ibm-chart-note ibm-lh-note">{longHorizon.note}</p>
              </div>
            </div>
            <div className="ibm-card">
              <h3 className="ibm-card-title">Open vs closed weights</h3>
              <p className="ibm-chart-note">Mean N10 yield within each family.</p>
              <div className="ibm-grouped">
                {weightsAvg.map((g) => (
                  <div key={g.group} className="ibm-group">
                    <span className="ibm-group-label">
                      {g.group} · n = {g.n}
                    </span>
                    <div className="ibm-group-bars">
                      <div className="ibm-group-row">
                        <span className="ibm-group-tag">N10</span>
                        <span className="ibm-bar-track">
                          <span
                            className="ibm-bar-fill"
                            style={{
                              width: `${(g.value / MAX_WEIGHTS_AVG) * 100}%`,
                              background: g.group.startsWith('Open') ? '#8c8c8c' : '#0f62fe',
                            }}
                          />
                        </span>
                        <span className="ibm-bar-val">{g.value.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="ibm-chart-note">{weightsAvgCaption}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Task domains ────────────────────────────────── */}
      <section className="ibm-section">
        <div className="ibm-wrap">
          <p className="ibm-eyebrow">Task domains</p>
          <h2 className="ibm-h2">Four catalysis domains, 32 research tasks</h2>
          <div className="ibm-task-grid">
            {taskDomains.map((t) => (
              <div key={t.domain} className="ibm-card ibm-task">
                <div className="ibm-task-head">
                  <span className="ibm-tag ibm-tag-open">{t.domain}</span>
                  {t.domain === 'Electrocatalysis' && (
                    <span className="ibm-tag">Closed-loop study</span>
                  )}
                </div>
                <p className="ibm-task-desc">{t.blurb}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Closed-loop adaptation ──────────────────────── */}
      <section className="ibm-section ibm-section-gray">
        <div className="ibm-wrap">
          <p className="ibm-eyebrow">Closed-loop adaptation</p>
          <h2 className="ibm-h2">Five rounds of feedback, local adjustments only</h2>
          <p className="ibm-note">
            Agent {closedLoop.agent} · Task: {closedLoop.task} · {closedLoop.rounds} feedback rounds
          </p>
          <div className="ibm-loop-grid">
            <div className="ibm-card">
              <p className="ibm-card-index">Observed</p>
              <h3 className="ibm-card-title">Localized adaptation</h3>
              <ul className="ibm-card-list ibm-loop-list">
                {closedLoop.adapted.map((a) => (
                  <li key={a}>
                    <span className="ibm-loop-yes" aria-hidden="true">✓</span> {a}
                  </li>
                ))}
              </ul>
            </div>
            <div className="ibm-card">
              <p className="ibm-card-index">Not observed</p>
              <h3 className="ibm-card-title">Strategic redirection</h3>
              <ul className="ibm-card-list ibm-loop-list">
                {closedLoop.notObserved.map((a) => (
                  <li key={a}>
                    <span className="ibm-loop-no" aria-hidden="true">✗</span> {a}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Failure modes ───────────────────────────────── */}
      <section className="ibm-section">
        <div className="ibm-wrap">
          <p className="ibm-eyebrow">Failure analysis</p>
          <h2 className="ibm-h2">Where agents break</h2>
          <div className="ibm-fail-grid">
            {failureModes.map((f) => (
              <div key={f.name} className="ibm-fail">
                <div className="ibm-fail-name">{f.name}</div>
                <p className="ibm-fail-desc">{f.description}</p>
              </div>
            ))}
          </div>
          <p className="ibm-note ibm-fail-note">{failureNote}</p>
        </div>
      </section>

      {/* ── Methods + BibTeX ────────────────────────────── */}
      <section id="methods" className="ibm-section ibm-section-gray">
        <div className="ibm-wrap ibm-methods-grid">
          <div>
            <p className="ibm-eyebrow">Methodology</p>
            <h2 className="ibm-h2">How we ran the bench</h2>
            <ul className="ibm-method-list">
              {methodologyNotes.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
            <p className="ibm-eyebrow ibm-mt">Scoring rubric</p>
            <ul className="ibm-method-list">
              {scoringAxes.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
            <div className="ibm-codeblock ibm-formula-block">
              <div className="ibm-codeblock-head">Scoring formulas</div>
              <pre>{formulas.join('\n')}</pre>
            </div>
          </div>
          <div>
            <p className="ibm-eyebrow">Citation</p>
            <div className="ibm-codeblock">
              <div className="ibm-codeblock-head">bibtex</div>
              <pre>{bibtex}</pre>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA banner ──────────────────────────────────── */}
      <section className="ibm-cta">
        <div className="ibm-wrap ibm-cta-inner">
          <div>
            <h2 className="ibm-cta-title">Think your agent can do science?</h2>
            <p className="ibm-cta-sub">Submit it to RoboChem Bench and measure it against 48 configurations.</p>
          </div>
          <a href="#" className="ibm-btn-on-blue">Submit Your Agent</a>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="ibm-footer">
        <div className="ibm-wrap">
          <div className="ibm-footer-cols">
            <div className="ibm-footer-brand">
              <span className="ibm-footer-word">RoboChem&nbsp;Bench</span>
              <p className="ibm-footer-tag">A physical-world testbed for measuring scientific agency.</p>
            </div>
            <div>
              <p className="ibm-footer-head">Paper</p>
              <a href="#abstract">Abstract</a>
              <a href="#leaderboard">Leaderboard</a>
              <a href="#results">Results</a>
            </div>
            <div>
              <p className="ibm-footer-head">Resources</p>
              <a href={paperMeta.links[0].href}>Paper (arXiv)</a>
              <a href="#">Code (GitHub)</a>
              <a href="#">Dataset</a>
            </div>
            <div>
              <p className="ibm-footer-head">Gallery</p>
              <Link to="/">← Back to Gallery</Link>
            </div>
          </div>
          <p className="ibm-footer-note">Style preview · IBM DESIGN.md · Content from arXiv:2607.23045</p>
        </div>
      </footer>
    </div>
  )
}

const CSS = `
.style-ibm {
  background: #ffffff; color: #161616;
  font-family: 'IBM Plex Sans', 'Helvetica Neue', Arial, sans-serif;
  font-size: 16px; line-height: 1.5; letter-spacing: 0.16px; min-height: 100dvh;
}
.style-ibm * { box-sizing: border-box; }
.style-ibm a { text-decoration: none; color: inherit; }
.ibm-wrap { max-width: 1312px; margin: 0 auto; padding: 0 32px; }
.ibm-prose { max-width: 800px; }
.ibm-eyebrow { font-size: 14px; font-weight: 400; line-height: 1.29; letter-spacing: 0.16px; color: #525252; margin: 0 0 16px; }
.ibm-h2 { font-size: 42px; font-weight: 300; line-height: 1.2; margin: 0 0 20px; letter-spacing: 0; }
.ibm-section { padding: 96px 0; }
.ibm-section-gray { background: #f4f4f4; }
.ibm-note { font-size: 14px; color: #525252; margin: 0 0 24px; max-width: 640px; }
.ibm-underline { text-decoration: underline; text-underline-offset: 3px; text-decoration-color: #0f62fe; }

/* Utility + nav */
.ibm-utility { background: #f4f4f4; height: 32px; display: flex; align-items: center; font-size: 12px; color: #525252; letter-spacing: 0.32px; }
.ibm-utility-inner { display: flex; justify-content: space-between; align-items: center; }
.ibm-utility-link { color: #525252; }
.ibm-utility-link:hover { color: #0f62fe; }
.ibm-nav { background: #ffffff; border-bottom: 1px solid #e0e0e0; height: 48px; display: flex; align-items: center; position: sticky; top: 0; z-index: 50; }
.ibm-nav-inner { display: flex; align-items: center; gap: 32px; }
.ibm-wordmark { font-size: 15px; font-weight: 600; letter-spacing: 0.16px; }
.ibm-nav-links { display: flex; gap: 24px; flex: 1; }
.ibm-nav-links a { font-size: 14px; color: #161616; }
.ibm-nav-links a:hover { color: #0f62fe; }
.ibm-nav-cta { padding: 8px 16px; font-size: 13px; }

/* Buttons */
.ibm-btn-primary {
  background: #0f62fe; color: #ffffff; font-size: 14px; letter-spacing: 0.16px;
  padding: 12px 16px; display: inline-block; border-radius: 0; white-space: nowrap;
}
.ibm-btn-primary:hover { background: #0050e6; }
.ibm-btn-primary:active { background: #002d9c; }
.ibm-btn-secondary {
  background: #161616; color: #ffffff; font-size: 14px; letter-spacing: 0.16px;
  padding: 12px 16px; display: inline-block; border-radius: 0; white-space: nowrap;
}
.ibm-btn-tertiary {
  background: #ffffff; color: #0f62fe; font-size: 14px; letter-spacing: 0.16px;
  padding: 12px 16px; display: inline-block; border-radius: 0; border: 1px solid #0f62fe; white-space: nowrap;
}
.ibm-btn-ghost {
  background: transparent; color: #0f62fe; font-size: 14px; letter-spacing: 0.16px;
  padding: 12px 16px; display: inline-block; white-space: nowrap;
}
.ibm-btn-ghost:hover { text-decoration: underline; text-underline-offset: 3px; }
.ibm-btn-on-blue {
  background: #ffffff; color: #0f62fe; font-size: 14px; letter-spacing: 0.16px;
  padding: 12px 16px; display: inline-block; white-space: nowrap;
}

/* Hero */
.ibm-hero { padding: 96px 0; border-bottom: 1px solid #e0e0e0; }
.ibm-hero-title { font-size: 60px; font-weight: 300; line-height: 1.17; letter-spacing: -0.4px; margin: 0 0 24px; max-width: 960px; }
.ibm-hero-sub { font-size: 20px; line-height: 1.4; color: #525252; margin: 0 0 20px; max-width: 760px; letter-spacing: 0; }
.ibm-hero-authors { font-size: 14px; color: #525252; margin: 0 0 4px; max-width: 820px; }
.ibm-hero-affil { font-size: 14px; color: #8c8c8c; margin: 0 0 32px; }
.ibm-hero-actions { display: flex; flex-wrap: wrap; gap: 12px; }

/* Stats */
.ibm-stats { padding: 64px 0; }
.ibm-stats-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 0; border: 1px solid #e0e0e0; }
.ibm-stat { padding: 24px; border-left: 1px solid #e0e0e0; }
.ibm-stat:first-child { border-left: none; }
.ibm-stat-value { font-size: 42px; font-weight: 300; line-height: 1.2; letter-spacing: 0; }
.ibm-stat-label { font-size: 14px; font-weight: 600; margin-top: 8px; }
.ibm-stat-desc { font-size: 12px; color: #8c8c8c; margin-top: 2px; letter-spacing: 0.32px; }

/* Abstract */
.ibm-abstract { font-size: 18px; line-height: 1.5; color: #161616; margin: 0; }

/* Cards */
.ibm-dim-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; margin-top: 40px; }
.ibm-card { background: #ffffff; border: 1px solid #e0e0e0; padding: 24px; border-radius: 0; }
.ibm-card-index { font-size: 14px; color: #0f62fe; margin: 0 0 12px; }
.ibm-card-title { font-size: 24px; font-weight: 400; line-height: 1.33; margin: 0; letter-spacing: 0; }
.ibm-card-tag { font-size: 13px; color: #8c8c8c; margin: 8px 0 18px; }
.ibm-card-list { list-style: none; margin: 0; padding: 0; }
.ibm-card-list li { font-size: 14px; color: #525252; padding: 8px 0; border-top: 1px solid #e0e0e0; }

/* Table */
.ibm-table-wrap { border: 1px solid #e0e0e0; overflow-x: auto; background: #ffffff; }
.ibm-table { width: 100%; border-collapse: collapse; font-size: 14px; min-width: 880px; }
.ibm-table th {
  text-align: left; font-size: 14px; font-weight: 600; color: #161616;
  background: #f4f4f4; padding: 12px 16px; border-bottom: 1px solid #e0e0e0; white-space: nowrap;
}
.ibm-table td { padding: 12px 16px; border-bottom: 1px solid #e0e0e0; white-space: nowrap; }
.ibm-table tbody tr:last-child td { border-bottom: none; }
.ibm-table tbody tr:hover { background: #f4f4f4; }
.ibm-th-num, .ibm-td-num { text-align: right; font-variant-numeric: tabular-nums; }
.ibm-td-rank { color: #8c8c8c; }
.ibm-td-model { font-weight: 600; }
.ibm-td-org { color: #525252; }
.ibm-best { font-weight: 600; }
.ibm-second { text-decoration: underline; text-underline-offset: 3px; text-decoration-color: #0f62fe; }
.ibm-tag {
  display: inline-block; background: #e0e0e0; color: #161616; font-size: 12px;
  padding: 3px 10px; border-radius: 0; letter-spacing: 0.32px;
}
.ibm-tag-open { background: #ffffff; color: #0f62fe; border: 1px solid #0f62fe; }

/* Charts */
.ibm-chart-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 40px; }
.ibm-chart-wide { grid-column: 1 / -1; }
.ibm-chart-note { font-size: 13px; color: #525252; margin: 8px 0 20px; }
.ibm-bars { display: grid; gap: 8px; }
.ibm-bar-row { display: grid; grid-template-columns: 170px 1fr 52px; align-items: center; gap: 12px; }
.ibm-bar-name { font-size: 13px; color: #161616; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ibm-bar-track { display: block; height: 16px; background: #f4f4f4; }
.ibm-bar-fill { display: block; height: 100%; }
.ibm-bar-val { font-size: 12px; color: #525252; text-align: right; font-variant-numeric: tabular-nums; }
.ibm-radar { width: 100%; height: auto; display: block; }
.ibm-radar-label { font-size: 11px; fill: #525252; font-family: 'IBM Plex Sans', sans-serif; letter-spacing: 0.32px; }
.ibm-legend { list-style: none; margin: 12px 0 0; padding: 0; display: grid; gap: 6px; }
.ibm-legend li { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #161616; }
.ibm-swatch { width: 12px; height: 12px; display: inline-block; }
.ibm-grouped { display: grid; gap: 20px; }
.ibm-group-label { font-size: 14px; font-weight: 600; display: block; margin-bottom: 8px; border-bottom: 1px solid #e0e0e0; padding-bottom: 6px; }
.ibm-group-bars { display: grid; gap: 6px; }
.ibm-group-row { display: grid; grid-template-columns: 56px 1fr 52px; align-items: center; gap: 10px; }
.ibm-group-tag { font-size: 12px; color: #8c8c8c; letter-spacing: 0.32px; }

/* Tasks */
.ibm-task-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; margin-top: 40px; }
.ibm-task { display: flex; flex-direction: column; gap: 14px; }
.ibm-task-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.ibm-stars { color: #0f62fe; font-size: 14px; letter-spacing: 2px; }
.ibm-task-desc { font-size: 15px; line-height: 1.5; color: #161616; margin: 0; flex: 1; }
.ibm-task-meta { font-size: 12px; color: #8c8c8c; letter-spacing: 0.32px; margin: 0; }

/* Failure modes */
.ibm-fail-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-top: 40px; }
.ibm-fail { border-top: 2px solid #161616; padding-top: 20px; }
.ibm-fail-pct { font-size: 42px; font-weight: 300; line-height: 1.2; }
.ibm-fail-name { font-size: 14px; font-weight: 600; margin: 8px 0 12px; }
.ibm-fail-track { height: 4px; background: #f4f4f4; margin-bottom: 12px; }
.ibm-fail-fill { display: block; height: 100%; background: #da1e28; }
.ibm-fail-desc { font-size: 13px; line-height: 1.5; color: #525252; margin: 0; }

/* Methods */
.ibm-methods-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; }
.ibm-method-list { list-style: none; margin: 24px 0 0; padding: 0; }
.ibm-method-list li { font-size: 15px; color: #161616; padding: 12px 0; border-bottom: 1px solid #e0e0e0; }
.ibm-codeblock { background: #f4f4f4; border: 1px solid #e0e0e0; margin-top: 16px; }
.ibm-codeblock-head {
  font-size: 12px; color: #525252; letter-spacing: 0.32px; text-transform: uppercase;
  padding: 10px 16px; border-bottom: 1px solid #e0e0e0; background: #ffffff;
}
.ibm-codeblock pre {
  margin: 0; padding: 20px; font-family: 'IBM Plex Mono', Menlo, Consolas, monospace;
  font-size: 13px; line-height: 1.6; color: #161616; overflow-x: auto;
}

/* CTA banner */
.ibm-cta { background: #0f62fe; color: #ffffff; padding: 48px 0; }
.ibm-cta-inner { display: flex; justify-content: space-between; align-items: center; gap: 32px; flex-wrap: wrap; }
.ibm-cta-title { font-size: 32px; font-weight: 400; line-height: 1.25; margin: 0 0 8px; letter-spacing: 0; }
.ibm-cta-sub { font-size: 16px; color: rgba(255,255,255,0.85); margin: 0; }

/* Footer */
.ibm-footer { background: #161616; color: #c6c6c6; padding: 64px 0 32px; }
.ibm-footer-cols { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 32px; }
.ibm-footer-word { font-size: 18px; font-weight: 600; color: #ffffff; }
.ibm-footer-tag { font-size: 14px; color: #c6c6c6; margin: 12px 0 0; max-width: 280px; }
.ibm-footer-head { font-size: 14px; font-weight: 600; color: #ffffff; margin: 0 0 12px; }
.ibm-footer-cols a { display: block; font-size: 14px; color: #c6c6c6; padding: 4px 0; }
.ibm-footer-cols a:hover { color: #ffffff; }
.ibm-footer-note { font-size: 12px; color: #8c8c8c; letter-spacing: 0.32px; margin: 48px 0 0; border-top: 1px solid #262626; padding-top: 24px; }

@media (max-width: 1056px) {
  .ibm-stats-grid { grid-template-columns: repeat(3, 1fr); }
  .ibm-stat:nth-child(4) { border-left: none; }
  .ibm-stat:nth-child(n+4) { border-top: 1px solid #e0e0e0; }
  .ibm-fail-grid { grid-template-columns: repeat(2, 1fr); }
  .ibm-footer-cols { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 860px) {
  .ibm-nav-links { display: none; }
  .ibm-hero-title { font-size: 42px; }
  .ibm-h2 { font-size: 32px; }
  .ibm-section { padding: 64px 0; }
  .ibm-dim-grid, .ibm-task-grid, .ibm-chart-grid, .ibm-methods-grid { grid-template-columns: 1fr; }
}
@media (max-width: 560px) {
  .ibm-wrap { padding: 0 16px; }
  .ibm-stats-grid { grid-template-columns: 1fr 1fr; }
  .ibm-stat:nth-child(3) { border-left: none; }
  .ibm-stat:nth-child(n+3) { border-top: 1px solid #e0e0e0; }
  .ibm-fail-grid { grid-template-columns: 1fr; }
  .ibm-bar-row { grid-template-columns: 110px 1fr 44px; }
}

/* Lab capability band */
.ibm-labstats {
  display: flex; flex-wrap: wrap; gap: 16px 40px; margin-top: 32px; padding: 16px 24px;
  border: 1px solid #e0e0e0; border-top: none;
}
.ibm-labstat { font-size: 12px; color: #8c8c8c; letter-spacing: 0.32px; text-transform: uppercase; }
.ibm-labstat strong {
  font-family: 'IBM Plex Mono', Menlo, Consolas, monospace; font-size: 16px;
  font-weight: 400; color: #161616; margin-right: 6px; letter-spacing: 0;
}

/* Evaluation pathway */
.ibm-path-flow { display: flex; flex-wrap: wrap; align-items: stretch; gap: 8px; margin-top: 40px; }
.ibm-path-arrow { align-self: center; color: #8c8c8c; font-size: 14px; }
.ibm-path-node {
  background: #ffffff; border: 1px solid #e0e0e0; padding: 16px;
  max-width: 220px; border-top-width: 4px;
}
.ibm-path-s0 { border-top-color: #0f62fe; }
.ibm-path-s1 { border-top-color: #0043ce; }
.ibm-path-s2 { border-top-color: #8c8c8c; }
.ibm-path-final { background: #0f62fe; color: #ffffff; border-color: #0f62fe; }
.ibm-path-node-id {
  display: block; font-family: 'IBM Plex Mono', Menlo, Consolas, monospace;
  font-size: 12px; margin-bottom: 6px; color: #525252;
}
.ibm-path-final .ibm-path-node-id { color: #ffffff; }
.ibm-path-node-label { display: block; font-size: 14px; line-height: 1.4; }
.ibm-path-legend { display: flex; flex-wrap: wrap; gap: 24px; margin-top: 20px; }
.ibm-path-legend-item {
  display: inline-flex; align-items: center; gap: 8px; font-size: 12px;
  color: #525252; letter-spacing: 0.32px; text-transform: uppercase;
}
.ibm-path-dot-s0 { background: #0f62fe; }
.ibm-path-dot-s1 { background: #0043ce; }
.ibm-path-dot-s2 { background: #8c8c8c; }
.ibm-path-note { margin-top: 24px; }
.ibm-table-caption { margin-top: 12px; }

/* Long-horizon wall */
.ibm-lh { margin-top: 16px; }
.ibm-lh-top { display: flex; align-items: baseline; gap: 16px; }
.ibm-lh-big { font-size: 88px; font-weight: 300; line-height: 1; }
.ibm-lh-big-label { font-size: 13px; color: #8c8c8c; max-width: 200px; line-height: 1.4; letter-spacing: 0.32px; }
.ibm-lh-bar { display: flex; height: 16px; background: #f4f4f4; margin: 24px 0 8px; }
.ibm-lh-under { display: block; height: 100%; background: #c6c6c6; }
.ibm-lh-over { display: block; height: 100%; background: #0f62fe; min-width: 6px; }
.ibm-lh-legend {
  display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap;
  font-size: 12px; color: #8c8c8c; letter-spacing: 0.32px; text-transform: uppercase;
}
.ibm-lh-note { margin-top: 20px; }

/* Closed-loop adaptation */
.ibm-loop-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 8px; }
.ibm-loop-list { margin-top: 16px; }
.ibm-loop-yes { color: #0f62fe; font-weight: 600; }
.ibm-loop-no { color: #da1e28; font-weight: 600; }
.ibm-fail-note { margin-top: 32px; }

/* Scoring rubric */
.ibm-mt { margin-top: 32px; }
.ibm-formula-block { margin-top: 16px; }

@media (max-width: 1056px) {
  .ibm-loop-grid { grid-template-columns: 1fr; }
}
@media (max-width: 860px) {
  .ibm-path-node { max-width: none; flex: 1 1 40%; }
  .ibm-path-arrow { display: none; }
}
`
