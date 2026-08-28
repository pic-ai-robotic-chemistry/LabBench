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

function Check() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="mlf-check">
      <path d="M3 8.5l3.2 3.2L13 5" stroke="#00b48a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function Mintlify() {
  return (
    <div className="style-mintlify">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500&family=Inter:wght@400;500;600;700&display=swap"
      />
      <style>{CSS}</style>

      {/* ── Nav ─────────────────────────────────────────── */}
      <header className="mlf-nav">
        <div className="mlf-nav-inner">
          <div className="mlf-nav-left">
            <span className="mlf-logo">
              <span className="mlf-logo-dot" />
              RoboChem Bench
            </span>
            <nav className="mlf-nav-links">
              <a href="#abstract">Abstract</a>
              <a href="#leaderboard">Leaderboard</a>
              <a href="#results">Results</a>
              <a href="#methods">Methods</a>
            </nav>
          </div>
          <div className="mlf-nav-right">
            <div className="mlf-search-pill">
              <span>Search the paper…</span>
              <kbd>⌘K</kbd>
            </div>
            <Link to="/" className="mlf-btn-ghost">
              ← Back to Gallery
            </Link>
            <a href={paperMeta.links[0].href} className="mlf-btn-primary">
              Get the paper
            </a>
          </div>
        </div>
      </header>

      {/* ── Hero (atmospheric dark teal → mint band) ────── */}
      <section className="mlf-hero">
        <div className="mlf-hero-inner">
          <span className="mlf-badge-hero">{paperMeta.affiliation}</span>
          <h1 className="mlf-hero-title">{paperMeta.title}</h1>
          <p className="mlf-hero-sub">{paperMeta.subtitle}</p>
          <p className="mlf-hero-authors">
            {paperMeta.authors.join(', ')}
            <span className="mlf-hero-affil">{paperMeta.affiliation}</span>
          </p>
          <div className="mlf-hero-actions">
            {paperMeta.links.map((l, i) => (
              <a
                key={l.label}
                href={l.href}
                className={i === 0 ? 'mlf-btn-accent' : i === 3 ? 'mlf-btn-hero-ghost' : 'mlf-btn-on-dark'}
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats band ──────────────────────────────────── */}
      <section className="mlf-stats">
        <div className="mlf-wrap mlf-stats-grid">
          {keyStats.map((s) => (
            <div key={s.label} className="mlf-stat">
              <div className="mlf-stat-value">{s.value}</div>
              <div className="mlf-stat-label">{s.label}</div>
              <div className="mlf-stat-desc">{s.description}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Lab capability band ─────────────────────────── */}
      <section className="mlf-labstats">
        <div className="mlf-wrap mlf-labstats-grid">
          {labStats.map((s) => (
            <div key={s.label} className="mlf-labstat">
              <span className="mlf-labstat-value">{s.value}</span>
              <span className="mlf-labstat-label">{s.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Abstract ────────────────────────────────────── */}
      <section id="abstract" className="mlf-section">
        <div className="mlf-wrap mlf-prose">
          <p className="mlf-micro">ABSTRACT</p>
          <p className="mlf-abstract">{abstractText}</p>
        </div>
      </section>

      {/* ── Skills library ──────────────────────────────── */}
      <section className="mlf-section mlf-section-soft">
        <div className="mlf-wrap">
          <p className="mlf-micro">THE SKILLS LIBRARY</p>
          <h2 className="mlf-h2">45 workstations, one skills library</h2>
          <div className="mlf-dim-grid">
            {skillCategories.map((d, i) => (
              <div key={d.name} className="mlf-card">
                <div className="mlf-dim-head">
                  <span className="mlf-dim-num">0{i + 1}</span>
                  <h3 className="mlf-h5">{d.name}</h3>
                </div>
                <p className="mlf-dim-tag">{d.tagline}</p>
                <ul className="mlf-dim-list">
                  {d.bullets.map((b) => (
                    <li key={b}>
                      <Check />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Evaluation pathway N1 → N10 ─────────────────── */}
      <section className="mlf-section">
        <div className="mlf-wrap">
          <p className="mlf-micro">EVALUATION PATHWAY</p>
          <h2 className="mlf-h2">From task received to physical execution</h2>
          <div className="mlf-path-flow">
            {pathway.map((n, i) => (
              <Fragment key={n.node}>
                {i > 0 && (
                  <span className="mlf-path-arrow" aria-hidden="true">
                    →
                  </span>
                )}
                <div
                  className={`mlf-path-node mlf-path-s${stageIndex(n.stage)}${n.node === 'N10' ? ' mlf-path-final' : ''}`}
                >
                  <span className="mlf-path-node-id">{n.node}</span>
                  <span className="mlf-path-node-label">{n.label}</span>
                </div>
              </Fragment>
            ))}
          </div>
          <div className="mlf-path-legend">
            {pathwayStages.map((s, i) => (
              <span key={s} className="mlf-path-legend-item">
                <span className={`mlf-path-dot mlf-path-dot-s${i}`} />
                {s}
              </span>
            ))}
          </div>
          <p className="mlf-section-note mlf-path-note">{pathwayNote}</p>
        </div>
      </section>

      {/* ── Leaderboard ─────────────────────────────────── */}
      <section id="leaderboard" className="mlf-section mlf-section-soft">
        <div className="mlf-wrap">
          <p className="mlf-micro">LEADERBOARD</p>
          <h2 className="mlf-h2">Top 8 of 48 configurations, ranked by N10 yield</h2>
          <p className="mlf-section-note">
            N10 yield is the share of trials adjudicated executable by experts at the physical-execution boundary.{' '}
            <strong>Bold</strong> marks the best N10 yield, <span className="mlf-underline">underline</span> the
            runner-up.
          </p>
          <div className="mlf-table-wrap">
            <table className="mlf-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Configuration</th>
                  <th>Organization</th>
                  <th>Weights</th>
                  <th className="mlf-th-num">Trials</th>
                  <th className="mlf-th-num">Executable</th>
                  <th className="mlf-th-num">N10 Yield</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((r) => (
                  <tr key={r.rank}>
                    <td className="mlf-td-rank">{r.rank}</td>
                    <td className="mlf-td-model">
                      {r.harness} × {r.model}
                    </td>
                    <td className="mlf-td-org">{r.org}</td>
                    <td>
                      <span className={r.weights === 'open' ? 'mlf-badge mlf-badge-open' : 'mlf-badge'}>
                        {r.weights === 'open' ? 'Open' : 'Closed'}
                      </span>
                    </td>
                    <td className="mlf-td-num">{r.trials}</td>
                    <td className="mlf-td-num">{r.executable}</td>
                    <td
                      className={`mlf-td-num ${
                        r.n10 === N10_MAX ? 'mlf-best' : r.n10 === N10_SECOND ? 'mlf-second' : ''
                      }`}
                    >
                      {r.n10.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mlf-section-note mlf-table-caption">{leaderboardCaption}</p>
        </div>
      </section>

      {/* ── Charts ──────────────────────────────────────── */}
      <section id="results" className="mlf-section">
        <div className="mlf-wrap">
          <p className="mlf-micro">RESULTS</p>
          <h2 className="mlf-h2">Reading the results</h2>
          <div className="mlf-chart-grid">
            <div className="mlf-card mlf-chart-wide">
              <h3 className="mlf-h5">N10 executable yield — top 8 configurations</h3>
              <p className="mlf-chart-note">
                Expert-adjudicated executable rate at N10, in percent. Softer bars are open-weight configurations.
              </p>
              <div className="mlf-bars">
                {leaderboard.map((r) => (
                  <div key={r.rank} className="mlf-bar-row">
                    <span className="mlf-bar-name">
                      {r.harness} × {r.model}
                    </span>
                    <span className="mlf-bar-track">
                      <span
                        className="mlf-bar-fill"
                        style={{ width: `${(r.n10 / N10_MAX) * 100}%`, opacity: r.weights === 'open' ? 0.55 : 1 }}
                      />
                    </span>
                    <span className="mlf-bar-val">{r.n10.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="mlf-card">
              <h3 className="mlf-h5">The long-horizon wall</h3>
              <div className="mlf-lh">
                <div className="mlf-lh-top">
                  <span className="mlf-lh-big">{longHorizon.longest}</span>
                  <span className="mlf-lh-big-label">operations in the longest executable workflow</span>
                </div>
                <div className="mlf-lh-bar">
                  <span
                    className="mlf-lh-under"
                    style={{ width: `${(LH_UNDER / longHorizon.totalExecutable) * 100}%` }}
                  />
                  <span
                    className="mlf-lh-over"
                    style={{ width: `${(longHorizon.over30Ops / longHorizon.totalExecutable) * 100}%` }}
                  />
                </div>
                <div className="mlf-lh-legend">
                  <span>
                    {LH_UNDER} executable workflows · ≤ 30 ops
                  </span>
                  <span>{longHorizon.over30Ops} · &gt; 30 ops</span>
                </div>
                <p className="mlf-chart-note mlf-lh-note">{longHorizon.note}</p>
              </div>
            </div>
            <div className="mlf-card">
              <h3 className="mlf-h5">Open vs closed weights</h3>
              <p className="mlf-chart-note">Mean N10 yield within each family.</p>
              <div className="mlf-grouped">
                {weightsAvg.map((g) => (
                  <div key={g.group} className="mlf-group">
                    <span className="mlf-group-label">
                      {g.group} <span className="mlf-group-n">n = {g.n}</span>
                    </span>
                    <div className="mlf-group-bars">
                      <div className="mlf-group-row">
                        <span className="mlf-group-tag">N10</span>
                        <span className="mlf-bar-track">
                          <span
                            className={`mlf-bar-fill ${g.group.startsWith('Open') ? 'mlf-fill-open' : 'mlf-fill-closed'}`}
                            style={{ width: `${(g.value / MAX_WEIGHTS_AVG) * 100}%` }}
                          />
                        </span>
                        <span className="mlf-bar-val">{g.value.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mlf-chart-note">{weightsAvgCaption}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Task domains ────────────────────────────────── */}
      <section className="mlf-section mlf-section-soft">
        <div className="mlf-wrap">
          <p className="mlf-micro">TASK DOMAINS</p>
          <h2 className="mlf-h2">Four catalysis domains, 32 research tasks</h2>
          <div className="mlf-task-grid">
            {taskDomains.map((t) => (
              <div key={t.domain} className="mlf-card mlf-task">
                <div className="mlf-task-head">
                  <span className="mlf-badge-tag">{t.domain}</span>
                  {t.domain === 'Electrocatalysis' && (
                    <span className="mlf-badge mlf-badge-open">Closed-loop study</span>
                  )}
                </div>
                <p className="mlf-task-desc">{t.blurb}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Closed-loop adaptation ──────────────────────── */}
      <section className="mlf-section">
        <div className="mlf-wrap">
          <p className="mlf-micro">CLOSED-LOOP ADAPTATION</p>
          <h2 className="mlf-h2">Five rounds of feedback, local adjustments only</h2>
          <p className="mlf-section-note">
            Agent {closedLoop.agent} · Task: {closedLoop.task} · {closedLoop.rounds} feedback rounds
          </p>
          <div className="mlf-loop-grid">
            <div className="mlf-card mlf-loop-card">
              <h3 className="mlf-h5">Localized adaptation observed</h3>
              <ul className="mlf-loop-list">
                {closedLoop.adapted.map((a) => (
                  <li key={a}>
                    <span className="mlf-loop-yes" aria-hidden="true">
                      ✓
                    </span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
            <div className="mlf-card mlf-loop-card">
              <h3 className="mlf-h5">Strategic redirection not observed</h3>
              <ul className="mlf-loop-list">
                {closedLoop.notObserved.map((a) => (
                  <li key={a}>
                    <span className="mlf-loop-no" aria-hidden="true">
                      ✗
                    </span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Failure modes ───────────────────────────────── */}
      <section className="mlf-section mlf-section-soft">
        <div className="mlf-wrap">
          <p className="mlf-micro">FAILURE ANALYSIS</p>
          <h2 className="mlf-h2">Where agents break</h2>
          <div className="mlf-card mlf-fail-card">
            {failureModes.map((f) => (
              <div key={f.name} className="mlf-fail-row">
                <div className="mlf-fail-head">
                  <span className="mlf-fail-name">{f.name}</span>
                </div>
                <p className="mlf-fail-desc">{f.description}</p>
              </div>
            ))}
          </div>
          <p className="mlf-section-note mlf-fail-note">{failureNote}</p>
        </div>
      </section>

      {/* ── Methods + BibTeX ────────────────────────────── */}
      <section id="methods" className="mlf-section">
        <div className="mlf-wrap mlf-methods-grid">
          <div>
            <p className="mlf-micro">METHODOLOGY</p>
            <h2 className="mlf-h2">How we ran the bench</h2>
            <ul className="mlf-method-list">
              {methodologyNotes.map((m) => (
                <li key={m}>
                  <Check />
                  <span>{m}</span>
                </li>
              ))}
            </ul>
            <p className="mlf-micro mlf-mt">SCORING RUBRIC</p>
            <div className="mlf-axes">
              {scoringAxes.map((a) => (
                <span key={a} className="mlf-code-inline">
                  {a}
                </span>
              ))}
            </div>
            <div className="mlf-codeblock mlf-formula-block">
              <pre>{formulas.join('\n')}</pre>
            </div>
          </div>
          <div>
            <p className="mlf-micro">CITATION</p>
            <div className="mlf-codeblock">
              <div className="mlf-codeblock-head">
                <span>bibtex</span>
                <span className="mlf-copy-btn">Copy code</span>
              </div>
              <pre>{bibtex}</pre>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="mlf-footer">
        <div className="mlf-wrap mlf-footer-inner">
          <div>
            <span className="mlf-logo">
              <span className="mlf-logo-dot" />
              RoboChem Bench
            </span>
            <p className="mlf-footer-note">Style preview · Mintlify DESIGN.md · Content from arXiv:2607.23045</p>
          </div>
          <div className="mlf-footer-links">
            <a href="#abstract">Abstract</a>
            <a href="#leaderboard">Leaderboard</a>
            <a href="#results">Results</a>
            <Link to="/">← Back to Gallery</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

const CSS = `
.style-mintlify {
  background: #ffffff;
  color: #0a0a0a;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 16px;
  line-height: 1.5;
  min-height: 100dvh;
}
.style-mintlify * { box-sizing: border-box; }
.style-mintlify a { text-decoration: none; color: inherit; }
.mlf-wrap { max-width: 1120px; margin: 0 auto; padding: 0 32px; }
.mlf-prose { max-width: 760px; }
.mlf-micro {
  font-size: 11px; font-weight: 600; letter-spacing: 0.5px; line-height: 1.4;
  color: #00b48a; margin: 0 0 12px; text-transform: uppercase;
}
.mlf-h2 { font-size: 36px; font-weight: 600; line-height: 1.2; letter-spacing: -0.5px; margin: 0 0 16px; }
.mlf-h5 { font-size: 18px; font-weight: 600; line-height: 1.4; margin: 0; }
.mlf-section { padding: 64px 0; }
.mlf-section-soft { background: #fafafa; border-top: 1px solid #ededed; border-bottom: 1px solid #ededed; }
.mlf-section-note { font-size: 14px; color: #5a5a5c; margin: 0 0 24px; max-width: 640px; }
.mlf-underline { text-decoration: underline; text-underline-offset: 3px; }

/* Nav */
.mlf-nav {
  position: sticky; top: 0; z-index: 50;
  background: rgba(255,255,255,0.9); backdrop-filter: blur(8px);
  border-bottom: 1px solid #ededed;
}
.mlf-nav-inner {
  max-width: 1280px; margin: 0 auto; padding: 0 32px; height: 64px;
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
}
.mlf-nav-left { display: flex; align-items: center; gap: 28px; }
.mlf-logo { display: inline-flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 600; letter-spacing: -0.2px; }
.mlf-logo-dot { width: 10px; height: 10px; border-radius: 9999px; background: #00d4a4; display: inline-block; }
.mlf-nav-links { display: flex; gap: 20px; }
.mlf-nav-links a { font-size: 14px; color: #5a5a5c; }
.mlf-nav-links a:hover { color: #0a0a0a; }
.mlf-nav-right { display: flex; align-items: center; gap: 12px; }
.mlf-search-pill {
  display: flex; align-items: center; gap: 16px; height: 36px; padding: 0 12px;
  background: #f7f7f7; border: 1px solid #e5e5e5; border-radius: 8px;
  color: #888888; font-size: 14px; min-width: 180px;
}
.mlf-search-pill kbd {
  font-family: 'Geist Mono', Menlo, monospace; font-size: 11px; color: #a8a8aa;
  border: 1px solid #e5e5e5; border-radius: 4px; padding: 1px 5px; background: #fff;
}
.mlf-btn-primary {
  background: #0a0a0a; color: #ffffff; font-size: 14px; font-weight: 500;
  padding: 10px 20px; border-radius: 9999px; display: inline-block; white-space: nowrap;
}
.mlf-btn-primary:hover { background: #1c1c1e; }
.mlf-btn-ghost { font-size: 14px; font-weight: 500; color: #0a0a0a; padding: 8px 12px; border-radius: 8px; white-space: nowrap; }
.mlf-btn-ghost:hover { background: #f7f7f7; }

/* Hero */
.mlf-hero {
  background: linear-gradient(135deg, #1a3d4a 0%, #2d5a4f 100%);
  color: #ffffff; padding: 96px 0 104px;
}
.mlf-hero-inner { max-width: 1120px; margin: 0 auto; padding: 0 32px; }
.mlf-badge-hero {
  display: inline-block; background: rgba(0, 212, 164, 0.16); color: #7cebcb;
  font-family: 'Geist Mono', Menlo, monospace; font-size: 13px; font-weight: 500;
  padding: 4px 10px; border-radius: 6px; margin-bottom: 24px;
}
.mlf-hero-title {
  font-size: 56px; font-weight: 600; line-height: 1.1; letter-spacing: -1.5px;
  margin: 0 0 20px; max-width: 900px;
}
.mlf-hero-sub { font-size: 18px; line-height: 1.5; color: #b3b3b3; margin: 0 0 24px; max-width: 720px; }
.mlf-hero-authors { font-size: 14px; color: #b3b3b3; margin: 0 0 32px; max-width: 820px; }
.mlf-hero-affil { display: block; margin-top: 6px; color: #7cebcb; font-size: 13px; }
.mlf-hero-actions { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
.mlf-btn-accent {
  background: #00d4a4; color: #0a0a0a; font-size: 14px; font-weight: 500;
  padding: 10px 20px; border-radius: 9999px;
}
.mlf-btn-accent:hover { background: #00b48a; color: #ffffff; }
.mlf-btn-on-dark {
  background: #ffffff; color: #0a0a0a; font-size: 14px; font-weight: 500;
  padding: 10px 20px; border-radius: 9999px;
}
.mlf-btn-hero-ghost { color: #ffffff; font-size: 14px; font-weight: 500; padding: 10px 8px; }
.mlf-btn-hero-ghost:hover { text-decoration: underline; text-underline-offset: 4px; }

/* Stats */
.mlf-stats { padding: 48px 0; border-bottom: 1px solid #ededed; }
.mlf-stats-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 24px; }
.mlf-stat { border-left: 2px solid #00d4a4; padding-left: 16px; }
.mlf-stat-value { font-size: 36px; font-weight: 600; letter-spacing: -0.5px; line-height: 1.1; }
.mlf-stat-label { font-size: 14px; font-weight: 500; margin-top: 6px; }
.mlf-stat-desc { font-size: 13px; color: #888888; margin-top: 2px; }

/* Abstract */
.mlf-abstract { font-size: 18px; line-height: 1.55; color: #1c1c1e; margin: 0; }
.mlf-abstract::first-letter { color: #00b48a; font-weight: 600; }

/* Cards & skills */
.mlf-dim-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; margin-top: 32px; }
.mlf-card {
  background: #ffffff; border: 1px solid #e5e5e5; border-radius: 12px; padding: 24px;
}
.mlf-dim-head { display: flex; align-items: baseline; gap: 12px; }
.mlf-dim-num {
  font-family: 'Geist Mono', Menlo, monospace; font-size: 13px; color: #00b48a; font-weight: 500;
}
.mlf-dim-tag { font-size: 13px; color: #888888; margin: 8px 0 16px; }
.mlf-dim-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
.mlf-dim-list li { display: flex; gap: 10px; align-items: flex-start; font-size: 14px; color: #3a3a3c; }
.mlf-check { flex: none; margin-top: 3px; }

/* Table */
.mlf-table-wrap { border: 1px solid #e5e5e5; border-radius: 8px; overflow-x: auto; background: #ffffff; }
.mlf-table { width: 100%; border-collapse: collapse; font-size: 14px; min-width: 880px; }
.mlf-table th {
  text-align: left; font-size: 11px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase;
  color: #5a5a5c; padding: 12px 16px; border-bottom: 1px solid #e5e5e5; background: #fafafa; white-space: nowrap;
}
.mlf-table td { padding: 12px 16px; border-bottom: 1px solid #ededed; white-space: nowrap; }
.mlf-table tbody tr:last-child td { border-bottom: none; }
.mlf-table tbody tr:hover { background: #fafafa; }
.mlf-th-num, .mlf-td-num { text-align: right; font-variant-numeric: tabular-nums; }
.mlf-td-num { font-family: 'Geist Mono', Menlo, monospace; font-size: 13px; color: #3a3a3c; }
.mlf-td-rank { color: #888888; font-family: 'Geist Mono', Menlo, monospace; font-size: 13px; }
.mlf-td-model { font-weight: 500; }
.mlf-td-org { color: #5a5a5c; }
.mlf-best { font-weight: 700; color: #0a0a0a; }
.mlf-second { text-decoration: underline; text-underline-offset: 3px; text-decoration-color: #00b48a; }
.mlf-badge {
  display: inline-block; background: #f7f7f7; color: #5a5a5c;
  font-family: 'Geist Mono', Menlo, monospace; font-size: 12px; padding: 2px 8px; border-radius: 6px;
  border: 1px solid #e5e5e5;
}
.mlf-badge-open { background: rgba(0, 212, 164, 0.1); color: #00b48a; border-color: rgba(0, 212, 164, 0.3); }

/* Charts */
.mlf-chart-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 32px; }
.mlf-chart-wide { grid-column: 1 / -1; }
.mlf-chart-note { font-size: 13px; color: #888888; margin: 6px 0 20px; }
.mlf-bars { display: grid; gap: 8px; }
.mlf-bar-row { display: grid; grid-template-columns: 160px 1fr 48px; align-items: center; gap: 12px; }
.mlf-bar-name { font-size: 13px; color: #3a3a3c; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.mlf-bar-track { display: block; height: 18px; background: #f7f7f7; border-radius: 4px; overflow: hidden; }
.mlf-bar-fill { display: block; height: 100%; background: #00d4a4; border-radius: 4px; }
.mlf-fill-open { background: #7cebcb; }
.mlf-fill-closed { background: #0a0a0a; }
.mlf-bar-val { font-family: 'Geist Mono', Menlo, monospace; font-size: 12px; color: #5a5a5c; text-align: right; }
.mlf-radar { width: 100%; height: auto; display: block; }
.mlf-radar-label { font-family: 'Geist Mono', Menlo, monospace; font-size: 11px; fill: #888888; }
.mlf-legend { list-style: none; margin: 12px 0 0; padding: 0; display: grid; gap: 6px; }
.mlf-legend li { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #3a3a3c; }
.mlf-dot { width: 10px; height: 10px; border-radius: 9999px; display: inline-block; }
.mlf-grouped { display: grid; gap: 18px; }
.mlf-group-label { font-size: 14px; font-weight: 600; display: block; margin-bottom: 8px; }
.mlf-group-bars { display: grid; gap: 6px; }
.mlf-group-row { display: grid; grid-template-columns: 52px 1fr 48px; align-items: center; gap: 10px; }
.mlf-group-tag { font-family: 'Geist Mono', Menlo, monospace; font-size: 11px; color: #888888; }

/* Tasks */
.mlf-task-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; margin-top: 32px; }
.mlf-task { display: flex; flex-direction: column; gap: 14px; }
.mlf-task-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.mlf-stars { color: #00b48a; font-size: 14px; letter-spacing: 2px; }
.mlf-task-desc { font-size: 15px; line-height: 1.55; color: #1c1c1e; margin: 0; flex: 1; }
.mlf-task-meta { display: flex; gap: 8px; }
.mlf-code-inline {
  background: #f7f7f7; color: #1c1c1e; font-family: 'Geist Mono', Menlo, monospace;
  font-size: 13px; font-weight: 500; padding: 2px 8px; border-radius: 4px; border: 1px solid #e5e5e5;
}
.mlf-badge-tag {
  background: rgba(55, 114, 207, 0.12); color: #3772cf; font-size: 13px; font-weight: 600;
  padding: 2px 8px; border-radius: 6px; display: inline-block;
}

/* Failure modes */
.mlf-fail-card { padding: 8px 24px; margin-top: 32px; }
.mlf-fail-row { padding: 20px 0; border-bottom: 1px solid #ededed; }
.mlf-fail-row:last-child { border-bottom: none; }
.mlf-fail-head { display: flex; justify-content: space-between; align-items: baseline; }
.mlf-fail-name { font-size: 16px; font-weight: 600; }
.mlf-fail-pct { font-family: 'Geist Mono', Menlo, monospace; font-size: 18px; font-weight: 500; color: #c37d0d; }
.mlf-fail-track { height: 6px; background: #f7f7f7; border-radius: 9999px; margin: 10px 0 8px; overflow: hidden; }
.mlf-fail-fill { display: block; height: 100%; background: #c37d0d; border-radius: 9999px; }
.mlf-fail-desc { font-size: 14px; color: #5a5a5c; margin: 0; }

/* Methods */
.mlf-methods-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; }
.mlf-method-list { list-style: none; margin: 24px 0 0; padding: 0; display: grid; gap: 14px; }
.mlf-method-list li { display: flex; gap: 10px; align-items: flex-start; font-size: 15px; color: #3a3a3c; }
.mlf-codeblock { background: #1c1c1e; border-radius: 8px; overflow: hidden; margin-top: 16px; }
.mlf-codeblock-head {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 16px; border-bottom: 1px solid #1f1f1f; color: #b3b3b3; font-size: 13px;
  font-family: 'Geist Mono', Menlo, monospace;
}
.mlf-copy-btn { border: 1px solid #1f1f1f; border-radius: 6px; padding: 2px 8px; font-size: 12px; }
.mlf-codeblock pre {
  margin: 0; padding: 16px; color: #ffffff; font-family: 'Geist Mono', Menlo, monospace;
  font-size: 13px; line-height: 1.6; overflow-x: auto;
}

/* Footer */
.mlf-footer { border-top: 1px solid #e5e5e5; padding: 48px 0; }
.mlf-footer-inner { display: flex; justify-content: space-between; gap: 32px; flex-wrap: wrap; }
.mlf-footer-note { font-size: 13px; color: #888888; margin: 12px 0 0; }
.mlf-footer-links { display: flex; gap: 20px; align-items: flex-start; }
.mlf-footer-links a { font-size: 14px; color: #5a5a5c; }
.mlf-footer-links a:hover { color: #0a0a0a; }

@media (max-width: 960px) {
  .mlf-nav-links, .mlf-search-pill { display: none; }
  .mlf-hero-title { font-size: 40px; letter-spacing: -1px; }
  .mlf-stats-grid { grid-template-columns: repeat(3, 1fr); }
  .mlf-dim-grid, .mlf-task-grid, .mlf-chart-grid, .mlf-methods-grid { grid-template-columns: 1fr; }
  .mlf-h2 { font-size: 28px; }
}
@media (max-width: 560px) {
  .mlf-wrap { padding: 0 20px; }
  .mlf-hero { padding: 64px 0; }
  .mlf-hero-title { font-size: 32px; }
  .mlf-stats-grid { grid-template-columns: repeat(2, 1fr); }
  .mlf-bar-row { grid-template-columns: 110px 1fr 44px; }
}

/* Lab capability band */
.mlf-labstats { padding: 20px 0; border-bottom: 1px solid #ededed; background: #fafafa; }
.mlf-labstats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; }
.mlf-labstat { display: flex; align-items: baseline; gap: 8px; }
.mlf-labstat-value { font-family: 'Geist Mono', Menlo, monospace; font-size: 20px; font-weight: 500; color: #0a0a0a; }
.mlf-labstat-label { font-size: 12px; color: #888888; }

/* Evaluation pathway */
.mlf-path-flow { display: flex; flex-wrap: wrap; align-items: stretch; gap: 8px; margin-top: 32px; }
.mlf-path-arrow { align-self: center; color: #888888; font-size: 14px; }
.mlf-path-node {
  background: #ffffff; border: 1px solid #e5e5e5; border-radius: 10px;
  padding: 12px 14px; max-width: 190px; border-top-width: 3px;
}
.mlf-path-s0 { border-top-color: #00b48a; }
.mlf-path-s1 { border-top-color: #3772cf; }
.mlf-path-s2 { border-top-color: #c37d0d; }
.mlf-path-final { border: 2px solid #00b48a; background: rgba(0, 212, 164, 0.08); }
.mlf-path-node-id {
  display: block; font-family: 'Geist Mono', Menlo, monospace; font-size: 12px;
  font-weight: 500; color: #00b48a; margin-bottom: 4px;
}
.mlf-path-s1 .mlf-path-node-id { color: #3772cf; }
.mlf-path-s2 .mlf-path-node-id { color: #c37d0d; }
.mlf-path-final .mlf-path-node-id { color: #00b48a; font-weight: 700; }
.mlf-path-node-label { display: block; font-size: 13px; line-height: 1.4; color: #3a3a3c; }
.mlf-path-legend { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 16px; }
.mlf-path-legend-item { display: inline-flex; align-items: center; gap: 6px; font-size: 12px; color: #5a5a5c; }
.mlf-path-dot { width: 10px; height: 10px; border-radius: 9999px; display: inline-block; }
.mlf-path-dot-s0 { background: #00b48a; }
.mlf-path-dot-s1 { background: #3772cf; }
.mlf-path-dot-s2 { background: #c37d0d; }
.mlf-path-note { margin-top: 16px; }
.mlf-table-caption { margin-top: 12px; }

/* Long-horizon wall */
.mlf-lh { margin-top: 16px; }
.mlf-lh-top { display: flex; align-items: baseline; gap: 12px; }
.mlf-lh-big { font-size: 64px; font-weight: 600; letter-spacing: -1.5px; line-height: 1; color: #0a0a0a; }
.mlf-lh-big-label { font-size: 13px; color: #888888; max-width: 180px; line-height: 1.4; }
.mlf-lh-bar { display: flex; height: 14px; border-radius: 4px; overflow: hidden; background: #f7f7f7; margin: 20px 0 8px; }
.mlf-lh-under { display: block; height: 100%; background: #d8d8d8; }
.mlf-lh-over { display: block; height: 100%; background: #00b48a; min-width: 6px; }
.mlf-lh-legend { display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap; font-size: 12px; color: #888888; }
.mlf-lh-note { margin-top: 16px; }
.mlf-group-n { font-family: 'Geist Mono', Menlo, monospace; font-size: 12px; font-weight: 400; color: #888888; }

/* Closed-loop adaptation */
.mlf-loop-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 8px; }
.mlf-loop-card { display: flex; flex-direction: column; gap: 16px; }
.mlf-loop-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 10px; }
.mlf-loop-list li { display: flex; gap: 10px; align-items: flex-start; font-size: 14px; color: #3a3a3c; }
.mlf-loop-yes { color: #00b48a; font-weight: 700; flex: none; }
.mlf-loop-no { color: #c37d0d; font-weight: 700; flex: none; }
.mlf-fail-note { margin-top: 20px; }

/* Scoring rubric */
.mlf-mt { margin-top: 32px; }
.mlf-axes { display: flex; flex-wrap: wrap; gap: 8px; }
.mlf-formula-block { margin-top: 16px; }
.mlf-formula-block pre { color: #7cebcb; }

@media (max-width: 960px) {
  .mlf-labstats-grid { grid-template-columns: repeat(2, 1fr); row-gap: 12px; }
  .mlf-loop-grid { grid-template-columns: 1fr; }
  .mlf-path-node { max-width: none; flex: 1 1 40%; }
  .mlf-path-arrow { display: none; }
}
@media (max-width: 560px) {
  .mlf-labstats-grid { grid-template-columns: 1fr; }
}
`
