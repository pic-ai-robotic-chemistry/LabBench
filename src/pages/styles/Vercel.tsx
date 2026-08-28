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

function Triangle() {
  return (
    <svg width="18" height="16" viewBox="0 0 18 16" aria-hidden="true">
      <path d="M9 0L18 16H0L9 0Z" fill="#171717" />
    </svg>
  )
}

export default function Vercel() {
  return (
    <div className="style-vercel">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400&family=Inter:wght@400;500;600&display=swap"
      />
      <style>{CSS}</style>

      {/* ── Nav ─────────────────────────────────────────── */}
      <header className="vcl-nav">
        <div className="vcl-nav-inner">
          <div className="vcl-nav-left">
            <Triangle />
            <span className="vcl-wordmark">RoboChem Bench</span>
            <nav className="vcl-nav-links">
              <a href="#abstract">Abstract</a>
              <a href="#leaderboard">Leaderboard</a>
              <a href="#results">Results</a>
              <a href="#methods">Methods</a>
            </nav>
          </div>
          <div className="vcl-nav-right">
            <Link to="/" className="vcl-nav-cta-ghost">← Gallery</Link>
            <a href="#" className="vcl-nav-cta">Submit</a>
          </div>
        </div>
      </header>

      {/* ── Hero with mesh gradient ─────────────────────── */}
      <section className="vcl-hero">
        <div className="vcl-mesh" aria-hidden="true" />
        <div className="vcl-wrap vcl-hero-inner">
          <span className="vcl-banner">arXiv:2607.23045 — 45 workstations, 4,608 trials</span>
          <h1 className="vcl-hero-title">{paperMeta.title}.</h1>
          <p className="vcl-hero-sub">{paperMeta.subtitle}</p>
          <p className="vcl-hero-authors">{paperMeta.authors.join(', ')}</p>
          <p className="vcl-hero-affil">{paperMeta.affiliation}</p>
          <div className="vcl-hero-actions">
            {paperMeta.links.map((l, i) => (
              <a key={l.label} href={l.href} className={i === 0 ? 'vcl-btn-primary' : 'vcl-btn-secondary'}>
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats band ──────────────────────────────────── */}
      <section className="vcl-stats">
        <div className="vcl-wrap vcl-stats-grid">
          {keyStats.map((s) => (
            <div key={s.label} className="vcl-stat">
              <div className="vcl-stat-value">{s.value}</div>
              <div className="vcl-stat-label">{s.label}</div>
              <div className="vcl-stat-desc">{s.description}</div>
            </div>
          ))}
        </div>
        <div className="vcl-wrap vcl-labstats">
          {labStats.map((s) => (
            <span key={s.label} className="vcl-labstat">
              <strong>{s.value}</strong> {s.label.toLowerCase()}
            </span>
          ))}
        </div>
      </section>

      {/* ── Abstract ────────────────────────────────────── */}
      <section id="abstract" className="vcl-section">
        <div className="vcl-wrap vcl-prose">
          <p className="vcl-mono-eyebrow">abstract</p>
          <h2 className="vcl-h2">Making scientific agency measurable.</h2>
          <p className="vcl-lead">{abstractText}</p>
        </div>
      </section>

      {/* ── Skills library ──────────────────────────────── */}
      <section className="vcl-section vcl-section-line">
        <div className="vcl-wrap">
          <p className="vcl-mono-eyebrow">skills_library</p>
          <h2 className="vcl-h2">45 workstations, one skills library.</h2>
          <div className="vcl-dim-grid">
            {skillCategories.map((d, i) => (
              <div key={d.name} className="vcl-card">
                <p className="vcl-mono-eyebrow vcl-dim-num">0{i + 1} / {d.tagline}</p>
                <h3 className="vcl-h3">{d.name}</h3>
                <ul className="vcl-dim-list">
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
      <section className="vcl-section vcl-section-line">
        <div className="vcl-wrap">
          <p className="vcl-mono-eyebrow">pathway_n1_to_n10</p>
          <h2 className="vcl-h2">From task received to physical execution.</h2>
          <div className="vcl-path-flow">
            {pathway.map((n, i) => (
              <Fragment key={n.node}>
                {i > 0 && (
                  <span className="vcl-path-arrow" aria-hidden="true">
                    →
                  </span>
                )}
                <div
                  className={`vcl-path-node vcl-path-s${stageIndex(n.stage)}${n.node === 'N10' ? ' vcl-path-final' : ''}`}
                >
                  <span className="vcl-path-node-id">{n.node}</span>
                  <span className="vcl-path-node-label">{n.label}</span>
                </div>
              </Fragment>
            ))}
          </div>
          <div className="vcl-path-legend">
            {pathwayStages.map((s, i) => (
              <span key={s} className="vcl-path-legend-item">
                <span className={`vcl-dot vcl-path-dot-s${i}`} />
                {s}
              </span>
            ))}
          </div>
          <p className="vcl-note vcl-note-tight">{pathwayNote}</p>
        </div>
      </section>

      {/* ── Leaderboard ─────────────────────────────────── */}
      <section id="leaderboard" className="vcl-section vcl-section-line">
        <div className="vcl-wrap">
          <p className="vcl-mono-eyebrow">leaderboard</p>
          <h2 className="vcl-h2">Top 8 of 48 configurations, one ranking.</h2>
          <p className="vcl-note">
            N10 yield: the share of 96 trials per configuration adjudicated executable by experts.{' '}
            <strong>Bold</strong> is the best, <span className="vcl-underline">underline</span> the runner-up.
          </p>
          <div className="vcl-table-card">
            <table className="vcl-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Configuration</th>
                  <th>Organization</th>
                  <th>Weights</th>
                  <th className="vcl-th-num">Trials</th>
                  <th className="vcl-th-num">Executable</th>
                  <th className="vcl-th-num">N10 Yield</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((r) => (
                  <tr key={r.rank}>
                    <td className="vcl-td-rank">{r.rank}</td>
                    <td className="vcl-td-model">
                      {r.harness} × {r.model}
                    </td>
                    <td className="vcl-td-org">{r.org}</td>
                    <td>
                      <span className={r.weights === 'open' ? 'vcl-badge vcl-badge-open' : 'vcl-badge'}>
                        {r.weights === 'open' ? 'Open' : 'Closed'}
                      </span>
                    </td>
                    <td className="vcl-td-num">{r.trials}</td>
                    <td className="vcl-td-num">{r.executable}</td>
                    <td
                      className={`vcl-td-num ${
                        r.n10 === N10_MAX ? 'vcl-best' : r.n10 === N10_SECOND ? 'vcl-second' : ''
                      }`}
                    >
                      {r.n10.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="vcl-note vcl-note-tight">{leaderboardCaption}</p>
        </div>
      </section>

      {/* ── Charts ──────────────────────────────────────── */}
      <section id="results" className="vcl-section vcl-section-line">
        <div className="vcl-wrap">
          <p className="vcl-mono-eyebrow">results</p>
          <h2 className="vcl-h2">The numbers, drawn plainly.</h2>
          <div className="vcl-chart-grid">
            <div className="vcl-card vcl-chart-wide">
              <h3 className="vcl-h3">N10 executable yield — top 8 configurations</h3>
              <p className="vcl-note">Expert-adjudicated executable rate at N10, in percent.</p>
              <div className="vcl-bars">
                {leaderboard.map((r) => (
                  <div key={r.rank} className="vcl-bar-row">
                    <span className="vcl-bar-name">
                      {r.harness} × {r.model}
                    </span>
                    <span className="vcl-bar-track">
                      <span
                        className="vcl-bar-fill"
                        style={{
                          width: `${(r.n10 / N10_MAX) * 100}%`,
                          background:
                            r.rank === 1
                              ? 'linear-gradient(90deg, #007cf0, #00dfd8)'
                              : r.weights === 'open'
                                ? '#a1a1a1'
                                : '#171717',
                        }}
                      />
                    </span>
                    <span className="vcl-bar-val">{r.n10.toFixed(1)}</span>
                  </div>
                ))}
              </div>
              <p className="vcl-note vcl-note-tight">
                Ink bars are closed-weight; gray bars are open-weight; the leader carries the develop gradient.
              </p>
            </div>
            <div className="vcl-card">
              <h3 className="vcl-h3">The long-horizon wall</h3>
              <div className="vcl-lh">
                <div className="vcl-lh-top">
                  <span className="vcl-lh-big">{longHorizon.longest}</span>
                  <span className="vcl-lh-big-label">operations in the longest executable workflow</span>
                </div>
                <div className="vcl-lh-bar">
                  <span
                    className="vcl-lh-under"
                    style={{ width: `${(LH_UNDER / longHorizon.totalExecutable) * 100}%` }}
                  />
                  <span
                    className="vcl-lh-over"
                    style={{ width: `${(longHorizon.over30Ops / longHorizon.totalExecutable) * 100}%` }}
                  />
                </div>
                <div className="vcl-lh-legend">
                  <span>{LH_UNDER} · ≤ 30 ops</span>
                  <span>{longHorizon.over30Ops} · &gt; 30 ops</span>
                </div>
                <p className="vcl-note vcl-note-tight">{longHorizon.note}</p>
              </div>
            </div>
            <div className="vcl-card">
              <h3 className="vcl-h3">Open vs closed weights</h3>
              <p className="vcl-note">Mean N10 yield within each family.</p>
              <div className="vcl-grouped">
                {weightsAvg.map((g) => (
                  <div key={g.group} className="vcl-group">
                    <span className="vcl-group-label">
                      {g.group} · n = {g.n}
                    </span>
                    <div className="vcl-group-bars">
                      <div className="vcl-group-row">
                        <span className="vcl-group-tag">N10</span>
                        <span className="vcl-bar-track">
                          <span
                            className="vcl-bar-fill"
                            style={{
                              width: `${(g.value / MAX_WEIGHTS_AVG) * 100}%`,
                              background: g.group.startsWith('Open') ? '#0070f3' : '#171717',
                            }}
                          />
                        </span>
                        <span className="vcl-bar-val">{g.value.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="vcl-note vcl-note-tight">{weightsAvgCaption}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Task domains ────────────────────────────────── */}
      <section className="vcl-section vcl-section-line">
        <div className="vcl-wrap">
          <p className="vcl-mono-eyebrow">task_domains</p>
          <h2 className="vcl-h2">Four catalysis domains, 32 tasks.</h2>
          <div className="vcl-task-grid">
            {taskDomains.map((t) => (
              <div key={t.domain} className="vcl-card vcl-task">
                <div className="vcl-task-head">
                  <span className="vcl-badge">{t.domain}</span>
                  {t.domain === 'Electrocatalysis' && (
                    <span className="vcl-badge vcl-badge-open">Closed-loop</span>
                  )}
                </div>
                <p className="vcl-task-desc">{t.blurb}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Closed-loop adaptation ──────────────────────── */}
      <section className="vcl-section vcl-section-line">
        <div className="vcl-wrap">
          <p className="vcl-mono-eyebrow">closed_loop</p>
          <h2 className="vcl-h2">Five rounds of feedback, local adjustments only.</h2>
          <p className="vcl-note">
            Agent {closedLoop.agent} · Task: {closedLoop.task} · {closedLoop.rounds} feedback rounds
          </p>
          <div className="vcl-loop-grid">
            <div className="vcl-card">
              <p className="vcl-mono-eyebrow vcl-dim-num">observed: true</p>
              <h3 className="vcl-h3">Localized adaptation</h3>
              <ul className="vcl-dim-list vcl-loop-list">
                {closedLoop.adapted.map((a) => (
                  <li key={a}>
                    <span className="vcl-loop-yes" aria-hidden="true">✓</span> {a}
                  </li>
                ))}
              </ul>
            </div>
            <div className="vcl-card">
              <p className="vcl-mono-eyebrow vcl-dim-num">observed: false</p>
              <h3 className="vcl-h3">Strategic redirection</h3>
              <ul className="vcl-dim-list vcl-loop-list">
                {closedLoop.notObserved.map((a) => (
                  <li key={a}>
                    <span className="vcl-loop-no" aria-hidden="true">✗</span> {a}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Failure modes (dark band) ───────────────────── */}
      <section className="vcl-dark">
        <div className="vcl-wrap">
          <p className="vcl-mono-eyebrow vcl-mono-dark">failure_analysis</p>
          <h2 className="vcl-h2 vcl-h2-dark">Where agents break.</h2>
          <div className="vcl-fail-grid">
            {failureModes.map((f) => (
              <div key={f.name} className="vcl-fail">
                <div className="vcl-fail-name">{f.name}</div>
                <p className="vcl-fail-desc">{f.description}</p>
              </div>
            ))}
          </div>
          <p className="vcl-fail-note">{failureNote}</p>
        </div>
      </section>

      {/* ── Methods + BibTeX ────────────────────────────── */}
      <section id="methods" className="vcl-section">
        <div className="vcl-wrap vcl-methods-grid">
          <div>
            <p className="vcl-mono-eyebrow">methodology</p>
            <h2 className="vcl-h2">How we ran the bench.</h2>
            <ul className="vcl-method-list">
              {methodologyNotes.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
            <p className="vcl-mono-eyebrow vcl-mt">scoring_rubric</p>
            <ul className="vcl-method-list">
              {scoringAxes.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
            <div className="vcl-codeblock vcl-formula-block">
              <div className="vcl-codeblock-head">
                <span className="vcl-code-dot" />
                <span className="vcl-code-dot" />
                <span className="vcl-code-dot" />
                <span className="vcl-code-title">scoring.ts</span>
              </div>
              <pre>{formulas.join('\n')}</pre>
            </div>
          </div>
          <div>
            <p className="vcl-mono-eyebrow">citation.bib</p>
            <div className="vcl-codeblock">
              <div className="vcl-codeblock-head">
                <span className="vcl-code-dot" />
                <span className="vcl-code-dot" />
                <span className="vcl-code-dot" />
                <span className="vcl-code-title">bibtex</span>
              </div>
              <pre>{bibtex}</pre>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="vcl-footer">
        <div className="vcl-wrap">
          <div className="vcl-footer-cols">
            <div>
              <p className="vcl-footer-head">PAPER</p>
              <a href="#abstract">Abstract</a>
              <a href="#leaderboard">Leaderboard</a>
              <a href="#results">Results</a>
            </div>
            <div>
              <p className="vcl-footer-head">RESOURCES</p>
              <a href={paperMeta.links[0].href}>Paper (arXiv)</a>
              <a href="#">Code (GitHub)</a>
              <a href="#">Dataset</a>
            </div>
            <div>
              <p className="vcl-footer-head">GALLERY</p>
              <Link to="/">← Back to Gallery</Link>
            </div>
            <div className="vcl-footer-brand">
              <Triangle />
              <span>RoboChem Bench</span>
            </div>
          </div>
          <p className="vcl-footer-note">Style preview · Vercel DESIGN.md · Content from arXiv:2607.23045</p>
        </div>
      </footer>
    </div>
  )
}

const CSS = `
.style-vercel {
  background: #fafafa; color: #171717;
  font-family: 'Inter', system-ui, -apple-system, sans-serif;
  font-feature-settings: 'ss01', 'ss02';
  font-size: 16px; line-height: 1.5; min-height: 100dvh;
}
.style-vercel * { box-sizing: border-box; }
.style-vercel a { text-decoration: none; color: inherit; }
.style-vercel ::selection { background: #171717; color: #f2f2f2; }
.vcl-wrap { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
.vcl-prose { max-width: 760px; }
.vcl-mono-eyebrow {
  font-family: 'Geist Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px; line-height: 16px; color: #888888; margin: 0 0 12px;
}
.vcl-mono-dark { color: #888888; }
.vcl-h2 { font-size: 32px; font-weight: 600; line-height: 40px; letter-spacing: -1.28px; margin: 0 0 16px; }
.vcl-h2-dark { color: #ffffff; }
.vcl-h3 { font-size: 20px; font-weight: 600; line-height: 28px; letter-spacing: -0.6px; margin: 0; }
.vcl-section { padding: 96px 0; }
.vcl-section-line { border-top: 1px solid #ebebeb; }
.vcl-note { font-size: 14px; line-height: 20px; letter-spacing: -0.28px; color: #4d4d4d; margin: 0 0 24px; }
.vcl-note-tight { margin: 16px 0 0; }
.vcl-underline { text-decoration: underline; text-underline-offset: 3px; }
.vcl-lead { font-size: 18px; line-height: 28px; color: #4d4d4d; margin: 0; }

/* Nav */
.vcl-nav {
  position: sticky; top: 0; z-index: 50; height: 64px;
  background: rgba(255,255,255,0.85); backdrop-filter: blur(10px);
  border-bottom: 1px solid #ebebeb; display: flex; align-items: center;
}
.vcl-nav-inner {
  max-width: 1200px; width: 100%; margin: 0 auto; padding: 0 24px;
  display: flex; align-items: center; justify-content: space-between;
}
.vcl-nav-left { display: flex; align-items: center; gap: 12px; }
.vcl-wordmark { font-size: 15px; font-weight: 600; letter-spacing: -0.3px; margin-right: 12px; }
.vcl-nav-links { display: flex; gap: 4px; }
.vcl-nav-links a { font-size: 14px; color: #4d4d4d; padding: 8px 12px; border-radius: 9999px; letter-spacing: -0.28px; }
.vcl-nav-links a:hover { background: #f5f5f5; color: #171717; }
.vcl-nav-right { display: flex; gap: 8px; align-items: center; }
.vcl-nav-cta {
  background: #171717; color: #ffffff; font-size: 14px; font-weight: 500;
  border-radius: 6px; height: 28px; display: inline-flex; align-items: center; padding: 0 10px;
}
.vcl-nav-cta-ghost {
  background: #ffffff; color: #171717; font-size: 14px; font-weight: 500;
  border: 1px solid #ebebeb; border-radius: 6px; height: 28px; display: inline-flex; align-items: center; padding: 0 10px;
}

/* Hero */
.vcl-hero { position: relative; overflow: hidden; background: #ffffff; padding: 128px 0 96px; }
.vcl-mesh {
  position: absolute; inset: -20% -10% auto; height: 120%;
  background:
    radial-gradient(38% 45% at 18% 30%, rgba(0, 124, 240, 0.28), transparent 70%),
    radial-gradient(34% 42% at 46% 12%, rgba(0, 223, 216, 0.24), transparent 70%),
    radial-gradient(36% 46% at 74% 26%, rgba(121, 40, 202, 0.22), transparent 70%),
    radial-gradient(34% 42% at 88% 54%, rgba(255, 0, 128, 0.16), transparent 70%),
    radial-gradient(30% 36% at 34% 62%, rgba(249, 203, 40, 0.14), transparent 70%);
  filter: blur(20px); pointer-events: none;
}
.vcl-hero-inner { position: relative; max-width: 880px; }
.vcl-banner {
  display: inline-block; background: #ffffff; border: 1px solid #ebebeb; color: #4d4d4d;
  font-size: 14px; padding: 8px 12px; border-radius: 9999px; margin-bottom: 24px;
  box-shadow: 0 1px 1px rgba(0,0,0,0.02), 0 2px 2px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(0,0,0,0.02);
}
.vcl-hero-title { font-size: 48px; font-weight: 600; line-height: 48px; letter-spacing: -2.4px; margin: 0 0 20px; }
.vcl-hero-sub { font-size: 18px; line-height: 28px; color: #4d4d4d; margin: 0 0 16px; max-width: 720px; }
.vcl-hero-authors { font-size: 14px; color: #4d4d4d; margin: 0 0 4px; letter-spacing: -0.28px; }
.vcl-hero-affil {
  font-family: 'Geist Mono', ui-monospace, Menlo, monospace; font-size: 12px; color: #888888; margin: 0 0 32px;
}
.vcl-hero-actions { display: flex; flex-wrap: wrap; gap: 12px; }
.style-vercel .vcl-btn-primary {
  background: #171717; color: #ffffff; font-size: 16px; font-weight: 500;
  border-radius: 100px; padding: 12px 20px; display: inline-flex; align-items: center;
  box-shadow: 0 1px 1px rgba(0,0,0,0.02), 0 2px 2px rgba(0,0,0,0.04);
}
.vcl-btn-secondary {
  background: #ffffff; color: #171717; font-size: 16px; font-weight: 500;
  border-radius: 100px; padding: 12px 20px; display: inline-flex; align-items: center;
  box-shadow: 0 1px 1px rgba(0,0,0,0.02), 0 2px 2px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(0,0,0,0.08);
}

/* Stats */
.vcl-stats { background: #ffffff; border-top: 1px solid #ebebeb; border-bottom: 1px solid #ebebeb; padding: 48px 0; }
.vcl-stats-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 24px; }
.vcl-stat { border-left: 1px solid #ebebeb; padding-left: 20px; }
.vcl-stat:first-child { border-left: none; padding-left: 0; }
.vcl-stat-value { font-size: 32px; font-weight: 600; letter-spacing: -1.28px; line-height: 40px; }
.vcl-stat-label { font-size: 14px; font-weight: 500; letter-spacing: -0.28px; margin-top: 4px; }
.vcl-stat-desc { font-size: 12px; line-height: 16px; color: #888888; margin-top: 2px; }

/* Cards */
.vcl-dim-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; margin-top: 32px; }
.vcl-card {
  background: #ffffff; border-radius: 8px; padding: 24px;
  box-shadow: 0 2px 2px rgba(0,0,0,0.04), 0 8px 8px -8px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(0,0,0,0.08);
}
.vcl-dim-num { margin-bottom: 8px; }
.vcl-dim-tag { font-size: 13px; color: #888888; margin: 6px 0 16px; }
.vcl-dim-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 8px; }
.vcl-dim-list li { font-size: 14px; color: #4d4d4d; letter-spacing: -0.28px; padding-left: 16px; position: relative; }
.vcl-dim-list li::before { content: '→'; position: absolute; left: 0; color: #888888; font-size: 12px; }

/* Table */
.vcl-table-card {
  background: #ffffff; border-radius: 12px; overflow-x: auto;
  box-shadow: 0 2px 2px rgba(0,0,0,0.04), 0 8px 16px -4px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(0,0,0,0.08);
}
.vcl-table { width: 100%; border-collapse: collapse; min-width: 880px; }
.vcl-table th {
  text-align: left; font-family: 'Geist Mono', ui-monospace, Menlo, monospace;
  font-size: 11px; font-weight: 400; text-transform: uppercase; letter-spacing: 0.5px;
  color: #888888; background: #fafafa; padding: 12px 16px; border-bottom: 1px solid #ebebeb; white-space: nowrap;
}
.vcl-table td { font-size: 14px; letter-spacing: -0.28px; padding: 12px 16px; border-bottom: 1px solid #ebebeb; white-space: nowrap; }
.vcl-table tbody tr:last-child td { border-bottom: none; }
.vcl-th-num, .vcl-td-num { text-align: right; font-variant-numeric: tabular-nums; }
.vcl-td-num { font-family: 'Geist Mono', ui-monospace, Menlo, monospace; font-size: 13px; }
.vcl-td-rank { font-family: 'Geist Mono', ui-monospace, Menlo, monospace; font-size: 13px; color: #888888; }
.vcl-td-model { font-weight: 500; }
.vcl-td-org { color: #4d4d4d; }
.vcl-best { font-weight: 600; color: #171717; }
.vcl-second { text-decoration: underline; text-underline-offset: 3px; }
.vcl-badge {
  display: inline-block; background: #fafafa; color: #4d4d4d; font-size: 12px;
  padding: 2px 8px; border-radius: 9999px; box-shadow: inset 0 0 0 1px rgba(0,0,0,0.08);
}
.vcl-badge-open { background: #d3e5ff; color: #0761d1; box-shadow: none; }

/* Charts */
.vcl-chart-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 32px; }
.vcl-chart-wide { grid-column: 1 / -1; }
.vcl-bars { display: grid; gap: 8px; }
.vcl-bar-row { display: grid; grid-template-columns: 160px 1fr 48px; align-items: center; gap: 12px; }
.vcl-bar-name { font-size: 13px; letter-spacing: -0.28px; color: #4d4d4d; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.vcl-bar-track { display: block; height: 16px; background: #f5f5f5; border-radius: 4px; overflow: hidden; }
.vcl-bar-fill { display: block; height: 100%; border-radius: 4px; }
.vcl-bar-val { font-family: 'Geist Mono', ui-monospace, Menlo, monospace; font-size: 12px; color: #888888; text-align: right; }
.vcl-radar { width: 100%; height: auto; display: block; }
.vcl-radar-label { font-family: 'Geist Mono', ui-monospace, Menlo, monospace; font-size: 11px; fill: #888888; }
.vcl-legend { list-style: none; margin: 12px 0 0; padding: 0; display: grid; gap: 6px; }
.vcl-legend li { display: flex; align-items: center; gap: 8px; font-size: 13px; letter-spacing: -0.28px; color: #4d4d4d; }
.vcl-dot { width: 10px; height: 10px; border-radius: 9999px; display: inline-block; }
.vcl-grouped { display: grid; gap: 18px; }
.vcl-group-label { font-size: 14px; font-weight: 500; letter-spacing: -0.28px; display: block; margin-bottom: 8px; }
.vcl-group-bars { display: grid; gap: 6px; }
.vcl-group-row { display: grid; grid-template-columns: 52px 1fr 48px; align-items: center; gap: 10px; }
.vcl-group-tag { font-family: 'Geist Mono', ui-monospace, Menlo, monospace; font-size: 11px; color: #888888; }

/* Tasks */
.vcl-task-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; margin-top: 32px; }
.vcl-task { display: flex; flex-direction: column; gap: 14px; }
.vcl-task-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.vcl-stars { font-size: 13px; letter-spacing: 2px; color: #171717; }
.vcl-task-desc { font-size: 15px; line-height: 1.55; color: #171717; margin: 0; flex: 1; letter-spacing: -0.28px; }
.vcl-task-meta { margin: 0; font-size: 12px; color: #888888; }
.vcl-task-meta code { font-family: 'Geist Mono', ui-monospace, Menlo, monospace; font-size: 12px; background: #fafafa; padding: 2px 6px; border-radius: 4px; box-shadow: inset 0 0 0 1px rgba(0,0,0,0.06); }

/* Dark band */
.vcl-dark { background: #171717; color: #ffffff; padding: 96px 0; }
.vcl-fail-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-top: 40px; }
.vcl-fail { border-top: 1px solid #333333; padding-top: 20px; }
.vcl-fail-pct { font-size: 32px; font-weight: 600; letter-spacing: -1.28px; color: #ffffff; }
.vcl-fail-name { font-size: 14px; font-weight: 500; color: #ffffff; margin: 8px 0 12px; letter-spacing: -0.28px; }
.vcl-fail-track { height: 3px; background: #333333; border-radius: 9999px; overflow: hidden; margin-bottom: 12px; }
.vcl-fail-fill { display: block; height: 100%; background: linear-gradient(90deg, #007cf0, #00dfd8); }
.vcl-fail-desc { font-size: 13px; line-height: 20px; color: #888888; margin: 0; }

/* Methods */
.vcl-methods-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; }
.vcl-method-list { list-style: none; margin: 24px 0 0; padding: 0; display: grid; gap: 0; }
.vcl-method-list li {
  font-size: 15px; color: #4d4d4d; letter-spacing: -0.28px;
  padding: 12px 0; border-bottom: 1px solid #ebebeb;
}
.vcl-codeblock {
  background: #171717; border-radius: 8px; overflow: hidden; margin-top: 16px;
  box-shadow: 0 2px 2px rgba(0,0,0,0.04), 0 8px 16px -4px rgba(0,0,0,0.1);
}
.vcl-codeblock-head {
  display: flex; align-items: center; gap: 6px; padding: 12px 16px; border-bottom: 1px solid #2a2a2a;
}
.vcl-code-dot { width: 10px; height: 10px; border-radius: 9999px; background: #333333; display: inline-block; }
.vcl-code-title {
  margin-left: 8px; font-family: 'Geist Mono', ui-monospace, Menlo, monospace; font-size: 12px; color: #888888;
}
.vcl-codeblock pre {
  margin: 0; padding: 20px; font-family: 'Geist Mono', ui-monospace, Menlo, monospace;
  font-size: 13px; line-height: 20px; color: #ededed; overflow-x: auto;
}

/* Footer */
.vcl-footer { background: #ffffff; border-top: 1px solid #ebebeb; padding: 64px 0 32px; }
.vcl-footer-cols { display: grid; grid-template-columns: repeat(4, 1fr); gap: 32px; }
.vcl-footer-head {
  font-family: 'Geist Mono', ui-monospace, Menlo, monospace; font-size: 12px; text-transform: uppercase;
  letter-spacing: 0.5px; color: #888888; margin: 0 0 12px;
}
.vcl-footer-cols a { display: block; font-size: 14px; letter-spacing: -0.28px; color: #4d4d4d; padding: 4px 0; }
.vcl-footer-cols a:hover { color: #171717; }
.vcl-footer-brand { display: flex; align-items: center; gap: 10px; font-size: 14px; font-weight: 600; }
.vcl-footer-note { font-size: 12px; color: #888888; margin: 48px 0 0; border-top: 1px solid #ebebeb; padding-top: 24px; }

@media (max-width: 1024px) {
  .vcl-stats-grid { grid-template-columns: repeat(3, 1fr); row-gap: 32px; }
  .vcl-stat:nth-child(4) { border-left: none; padding-left: 0; }
  .vcl-fail-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 860px) {
  .vcl-nav-links { display: none; }
  .vcl-hero { padding: 80px 0 64px; }
  .vcl-hero-title { font-size: 34px; line-height: 38px; letter-spacing: -1.4px; }
  .vcl-section { padding: 64px 0; }
  .vcl-dark { padding: 64px 0; }
  .vcl-dim-grid, .vcl-chart-grid, .vcl-task-grid, .vcl-methods-grid, .vcl-footer-cols { grid-template-columns: 1fr; }
}
@media (max-width: 560px) {
  .vcl-stats-grid { grid-template-columns: repeat(2, 1fr); }
  .vcl-stat { border-left: none; padding-left: 0; }
  .vcl-fail-grid { grid-template-columns: 1fr; }
  .vcl-bar-row { grid-template-columns: 110px 1fr 44px; }
}

/* Lab capability band */
.vcl-labstats {
  display: flex; flex-wrap: wrap; gap: 12px 28px; margin-top: 32px; padding-top: 24px;
  border-top: 1px solid #ebebeb;
}
.vcl-labstat {
  font-family: 'Geist Mono', ui-monospace, Menlo, monospace; font-size: 12px; color: #888888;
}
.vcl-labstat strong { font-size: 16px; font-weight: 500; color: #171717; margin-right: 6px; }

/* Evaluation pathway */
.vcl-path-flow { display: flex; flex-wrap: wrap; align-items: stretch; gap: 8px; margin: 32px 0 16px; }
.vcl-path-arrow { align-self: center; color: #888888; font-size: 14px; }
.vcl-path-node {
  background: #ffffff; border-radius: 8px; padding: 14px 16px; max-width: 200px;
  box-shadow: 0 2px 2px rgba(0,0,0,0.04), 0 8px 8px -8px rgba(0,0,0,0.04), inset 0 0 0 1px rgba(0,0,0,0.08);
  border-top: 3px solid transparent;
}
.vcl-path-s0 { border-top-color: #0070f3; }
.vcl-path-s1 { border-top-color: #7928ca; }
.vcl-path-s2 { border-top-color: #ff0080; }
.vcl-path-final { background: #171717; color: #ffffff; box-shadow: inset 0 0 0 1px #171717; border-top-color: #00dfd8; }
.vcl-path-node-id {
  display: block; font-family: 'Geist Mono', ui-monospace, Menlo, monospace;
  font-size: 11px; color: #888888; margin-bottom: 4px;
}
.vcl-path-final .vcl-path-node-id { color: #00dfd8; }
.vcl-path-node-label { display: block; font-size: 13px; line-height: 1.4; letter-spacing: -0.28px; }
.vcl-path-legend { display: flex; flex-wrap: wrap; gap: 16px; }
.vcl-path-legend-item { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: #4d4d4d; }
.vcl-path-dot-s0 { background: #0070f3; }
.vcl-path-dot-s1 { background: #7928ca; }
.vcl-path-dot-s2 { background: #ff0080; }

/* Long-horizon wall */
.vcl-lh { margin-top: 16px; }
.vcl-lh-top { display: flex; align-items: baseline; gap: 12px; }
.vcl-lh-big { font-size: 64px; font-weight: 600; letter-spacing: -2.56px; line-height: 1; }
.vcl-lh-big-label { font-size: 13px; color: #888888; max-width: 180px; line-height: 1.4; }
.vcl-lh-bar {
  display: flex; height: 14px; border-radius: 4px; overflow: hidden;
  background: #f5f5f5; margin: 20px 0 8px;
}
.vcl-lh-under { display: block; height: 100%; background: #d4d4d4; }
.vcl-lh-over { display: block; height: 100%; background: linear-gradient(90deg, #007cf0, #00dfd8); min-width: 6px; }
.vcl-lh-legend {
  display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap;
  font-family: 'Geist Mono', ui-monospace, Menlo, monospace; font-size: 11px; color: #888888;
}

/* Closed-loop adaptation */
.vcl-loop-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 8px; }
.vcl-loop-list { margin-top: 16px; }
.vcl-loop-list li::before { content: none; }
.vcl-loop-yes { color: #0070f3; font-weight: 600; }
.vcl-loop-no { color: #888888; font-weight: 600; }
.vcl-fail-note {
  font-size: 13px; line-height: 20px; color: #888888; margin: 32px 0 0;
  border-top: 1px solid #333333; padding-top: 20px;
}

/* Scoring rubric */
.vcl-mt { margin-top: 32px; }
.vcl-formula-block { margin-top: 16px; }

@media (max-width: 860px) {
  .vcl-loop-grid { grid-template-columns: 1fr; }
  .vcl-path-node { max-width: none; flex: 1 1 40%; }
  .vcl-path-arrow { display: none; }
}
`
