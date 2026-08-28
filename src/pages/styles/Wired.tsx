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

export default function Wired() {
  return (
    <div className="style-wired">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&family=Lora:ital,wght@0,400;0,700;1,400&family=Playfair+Display:wght@400;500&family=JetBrains+Mono:wght@400&display=swap"
      />
      <style>{CSS}</style>

      {/* ── Masthead band ───────────────────────────────── */}
      <div className="wrd-masthead">
        <span className="wrd-masthead-word">ROBOCHEM&nbsp;BENCH</span>
      </div>
      <header className="wrd-nav">
        <div className="wrd-nav-inner">
          <span className="wrd-nav-burger" aria-hidden="true">☰</span>
          <nav className="wrd-nav-links">
            <a href="#abstract">Abstract</a>
            <a href="#leaderboard">Leaderboard</a>
            <a href="#results">Results</a>
            <a href="#methods">Methods</a>
          </nav>
          <Link to="/" className="wrd-nav-back">← Back to Gallery</Link>
        </div>
      </header>

      {/* ── Hero ────────────────────────────────────────── */}
      <section className="wrd-hero">
        <div className="wrd-wrap">
          <p className="wrd-eyebrow">SCIENTIFIC AGENCY · BENCHMARK · 2026</p>
          <h1 className="wrd-hero-title">{paperMeta.title}</h1>
          <p className="wrd-hero-sub">{paperMeta.subtitle}</p>
          <p className="wrd-byline">
            By {paperMeta.authors.join(', ')} · {paperMeta.affiliation}
          </p>
          <div className="wrd-hero-actions">
            {paperMeta.links.map((l, i) => (
              <a key={l.label} href={l.href} className={i === 0 ? 'wrd-btn-primary' : 'wrd-btn-outline'}>
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats band ──────────────────────────────────── */}
      <section className="wrd-stats">
        <div className="wrd-wrap wrd-stats-grid">
          {keyStats.map((s) => (
            <div key={s.label} className="wrd-stat">
              <div className="wrd-stat-value">{s.value}</div>
              <div className="wrd-stat-label">{s.label}</div>
              <div className="wrd-stat-desc">{s.description}</div>
            </div>
          ))}
        </div>
        <div className="wrd-wrap wrd-labstats">
          {labStats.map((s) => (
            <span key={s.label} className="wrd-labstat">
              <strong>{s.value}</strong> {s.label.toLowerCase()}
            </span>
          ))}
        </div>
      </section>

      {/* ── Abstract ────────────────────────────────────── */}
      <section id="abstract" className="wrd-section">
        <div className="wrd-wrap wrd-prose">
          <p className="wrd-eyebrow">ABSTRACT</p>
          <p className="wrd-abstract">{abstractText}</p>
        </div>
      </section>

      {/* ── Skills library ──────────────────────────────── */}
      <section className="wrd-section wrd-section-lined">
        <div className="wrd-wrap">
          <p className="wrd-eyebrow">THE SKILLS LIBRARY</p>
          <h2 className="wrd-h2">45 workstations, one skills library</h2>
          <div className="wrd-dim-grid">
            {skillCategories.map((d, i) => (
              <article key={d.name} className="wrd-story-card">
                <p className="wrd-card-index">N<sup>o</sup> {i + 1}</p>
                <h3 className="wrd-display-md">{d.name}</h3>
                <p className="wrd-card-tag">{d.tagline}</p>
                <ul className="wrd-card-list">
                  {d.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Evaluation pathway N1 → N10 ─────────────────── */}
      <section className="wrd-section">
        <div className="wrd-wrap">
          <p className="wrd-eyebrow">THE EVALUATION PATHWAY</p>
          <h2 className="wrd-h2">The road to N10</h2>
          <div className="wrd-path-flow">
            {pathway.map((n, i) => (
              <Fragment key={n.node}>
                {i > 0 && (
                  <span className="wrd-path-arrow" aria-hidden="true">
                    →
                  </span>
                )}
                <div
                  className={`wrd-path-node wrd-path-s${stageIndex(n.stage)}${n.node === 'N10' ? ' wrd-path-final' : ''}`}
                >
                  <span className="wrd-path-node-id">{n.node}</span>
                  <span className="wrd-path-node-label">{n.label}</span>
                </div>
              </Fragment>
            ))}
          </div>
          <div className="wrd-path-legend">
            {pathwayStages.map((s, i) => (
              <span key={s} className="wrd-path-legend-item">
                <span className={`wrd-path-dot wrd-path-dot-s${i}`} />
                {s}
              </span>
            ))}
          </div>
          <p className="wrd-section-note wrd-path-note">{pathwayNote}</p>
        </div>
      </section>

      {/* ── Leaderboard ─────────────────────────────────── */}
      <section id="leaderboard" className="wrd-section wrd-section-lined">
        <div className="wrd-wrap">
          <p className="wrd-eyebrow">THE LEADERBOARD</p>
          <h2 className="wrd-h2">Eight configurations, one hard question</h2>
          <p className="wrd-section-note">
            N10 yield: the share of 96 trials per configuration adjudicated executable by experts.{' '}
            <strong>Bold</strong> is the best; <span className="wrd-underline">underline</span> is the runner-up.
          </p>
          <div className="wrd-table-wrap">
            <table className="wrd-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Configuration</th>
                  <th>Organization</th>
                  <th>Weights</th>
                  <th className="wrd-th-num">Trials</th>
                  <th className="wrd-th-num">Executable</th>
                  <th className="wrd-th-num">N10 Yield</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((r) => (
                  <tr key={r.rank}>
                    <td className="wrd-td-rank">{r.rank}</td>
                    <td className="wrd-td-model">
                      {r.harness} × {r.model}
                    </td>
                    <td className="wrd-td-org">{r.org}</td>
                    <td>
                      <span className={r.weights === 'open' ? 'wrd-type wrd-type-open' : 'wrd-type'}>
                        {r.weights === 'open' ? 'Open' : 'Closed'}
                      </span>
                    </td>
                    <td className="wrd-td-num">{r.trials}</td>
                    <td className="wrd-td-num">{r.executable}</td>
                    <td
                      className={`wrd-td-num ${
                        r.n10 === N10_MAX ? 'wrd-best' : r.n10 === N10_SECOND ? 'wrd-second' : ''
                      }`}
                    >
                      {r.n10.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="wrd-section-note wrd-table-caption">{leaderboardCaption}</p>
        </div>
      </section>

      {/* ── Charts ──────────────────────────────────────── */}
      <section id="results" className="wrd-section">
        <div className="wrd-wrap">
          <p className="wrd-eyebrow">READING THE RESULTS</p>
          <h2 className="wrd-h2">The gap between saying and doing</h2>
          <div className="wrd-chart-grid">
            <div className="wrd-chart-block wrd-chart-wide">
              <h3 className="wrd-display-sm">N10 executable yield — the top eight</h3>
              <p className="wrd-chart-note">
                Expert-adjudicated executable rate at N10, in percent. Solid bars: closed-weight. Hatched bars:
                open-weight.
              </p>
              <div className="wrd-bars">
                {leaderboard.map((r) => (
                  <div key={r.rank} className="wrd-bar-row">
                    <span className="wrd-bar-name">
                      {r.harness} × {r.model}
                    </span>
                    <span className="wrd-bar-track">
                      <span
                        className={r.weights === 'open' ? 'wrd-bar-fill wrd-bar-open' : 'wrd-bar-fill'}
                        style={{ width: `${(r.n10 / N10_MAX) * 100}%` }}
                      />
                    </span>
                    <span className="wrd-bar-val">{r.n10.toFixed(1)}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="wrd-chart-block">
              <h3 className="wrd-display-sm">The long-horizon wall</h3>
              <div className="wrd-lh">
                <div className="wrd-lh-big">{longHorizon.longest}</div>
                <p className="wrd-lh-big-label">operations in the longest executable workflow</p>
                <div className="wrd-lh-bar">
                  <span
                    className="wrd-lh-under"
                    style={{ width: `${(LH_UNDER / longHorizon.totalExecutable) * 100}%` }}
                  />
                  <span
                    className="wrd-lh-over"
                    style={{ width: `${(longHorizon.over30Ops / longHorizon.totalExecutable) * 100}%` }}
                  />
                </div>
                <div className="wrd-lh-legend">
                  <span>{LH_UNDER} workflows · ≤ 30 ops</span>
                  <span>{longHorizon.over30Ops} · &gt; 30 ops</span>
                </div>
                <p className="wrd-chart-note wrd-lh-note">{longHorizon.note}</p>
              </div>
            </div>
            <div className="wrd-chart-block">
              <h3 className="wrd-display-sm">Open vs closed weights</h3>
              <p className="wrd-chart-note">Mean N10 yield within each family.</p>
              <div className="wrd-grouped">
                {weightsAvg.map((g) => (
                  <div key={g.group} className="wrd-group">
                    <span className="wrd-group-label">
                      {g.group} · n = {g.n}
                    </span>
                    <div className="wrd-group-bars">
                      <div className="wrd-group-row">
                        <span className="wrd-group-tag">N10</span>
                        <span className="wrd-bar-track">
                          <span
                            className={g.group.startsWith('Open') ? 'wrd-bar-fill wrd-bar-open' : 'wrd-bar-fill'}
                            style={{ width: `${(g.value / MAX_WEIGHTS_AVG) * 100}%` }}
                          />
                        </span>
                        <span className="wrd-bar-val">{g.value.toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="wrd-chart-note">{weightsAvgCaption}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Task domains ────────────────────────────────── */}
      <section className="wrd-section wrd-section-lined">
        <div className="wrd-wrap">
          <p className="wrd-eyebrow">THE TASK DOMAINS</p>
          <h2 className="wrd-h2">Four arenas of catalysis, 32 tasks</h2>
          <div className="wrd-task-list">
            {taskDomains.map((t) => (
              <article key={t.domain} className="wrd-story-row">
                <div className="wrd-task-head">
                  <span className="wrd-task-domain">{t.domain}</span>
                  {t.domain === 'Electrocatalysis' && (
                    <span className="wrd-type wrd-type-open">Closed-loop study</span>
                  )}
                </div>
                <p className="wrd-task-desc">{t.blurb}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Closed-loop adaptation ──────────────────────── */}
      <section className="wrd-section">
        <div className="wrd-wrap">
          <p className="wrd-eyebrow">THE CLOSED-LOOP STUDY</p>
          <h2 className="wrd-h2">Five rounds of feedback, and the agent blinked locally</h2>
          <p className="wrd-section-note">
            Agent {closedLoop.agent} · Task: {closedLoop.task} · {closedLoop.rounds} feedback rounds
          </p>
          <div className="wrd-loop-grid">
            <div className="wrd-story-card">
              <p className="wrd-card-index">Observed</p>
              <h3 className="wrd-display-md">Localized adaptation</h3>
              <ul className="wrd-card-list">
                {closedLoop.adapted.map((a) => (
                  <li key={a}>
                    <span className="wrd-loop-yes" aria-hidden="true">✓</span> {a}
                  </li>
                ))}
              </ul>
            </div>
            <div className="wrd-story-card">
              <p className="wrd-card-index">Not observed</p>
              <h3 className="wrd-display-md">Strategic redirection</h3>
              <ul className="wrd-card-list">
                {closedLoop.notObserved.map((a) => (
                  <li key={a}>
                    <span className="wrd-loop-no" aria-hidden="true">✗</span> {a}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Failure modes ───────────────────────────────── */}
      <section className="wrd-section wrd-section-lined">
        <div className="wrd-wrap">
          <p className="wrd-eyebrow">FAILURE ANALYSIS</p>
          <h2 className="wrd-h2">Where agents break</h2>
          <div className="wrd-fail-grid">
            {failureModes.map((f) => (
              <div key={f.name} className="wrd-fail-item">
                <div className="wrd-fail-name">{f.name}</div>
                <p className="wrd-fail-desc">{f.description}</p>
              </div>
            ))}
          </div>
          <p className="wrd-section-note wrd-fail-note">{failureNote}</p>
        </div>
      </section>

      {/* ── Methods + BibTeX ────────────────────────────── */}
      <section id="methods" className="wrd-section">
        <div className="wrd-wrap wrd-methods-grid">
          <div>
            <p className="wrd-eyebrow">METHODOLOGY</p>
            <h2 className="wrd-h2">How we ran the bench</h2>
            <ul className="wrd-method-list">
              {methodologyNotes.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
            <p className="wrd-eyebrow wrd-mt">THE SCORING RUBRIC</p>
            <ul className="wrd-method-list">
              {scoringAxes.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
            <div className="wrd-codeblock wrd-formula-block">
              <div className="wrd-codeblock-head">scoring formulas</div>
              <pre>{formulas.join('\n')}</pre>
            </div>
          </div>
          <div>
            <p className="wrd-eyebrow">CITE THIS WORK</p>
            <div className="wrd-codeblock">
              <div className="wrd-codeblock-head">bibtex</div>
              <pre>{bibtex}</pre>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="wrd-footer">
        <div className="wrd-wrap">
          <div className="wrd-footer-word">ROBOCHEM&nbsp;BENCH</div>
          <div className="wrd-footer-cols">
            <div>
              <p className="wrd-footer-eyebrow">PAPER</p>
              <a href="#abstract">Abstract</a>
              <a href="#leaderboard">Leaderboard</a>
              <a href="#results">Results</a>
            </div>
            <div>
              <p className="wrd-footer-eyebrow">RESOURCES</p>
              <a href={paperMeta.links[0].href}>Paper (arXiv)</a>
              <a href="#">Code (GitHub)</a>
              <a href="#">Dataset</a>
            </div>
            <div>
              <p className="wrd-footer-eyebrow">GALLERY</p>
              <Link to="/">← Back to Gallery</Link>
            </div>
          </div>
          <p className="wrd-footer-note">Style preview · WIRED DESIGN.md · Content from arXiv:2607.23045</p>
        </div>
      </footer>
    </div>
  )
}

const CSS = `
.style-wired {
  background: #ffffff;
  color: #000000;
  font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  min-height: 100dvh;
}
.style-wired * { box-sizing: border-box; }
.style-wired a { text-decoration: none; color: inherit; }
.wrd-wrap { max-width: 1240px; margin: 0 auto; padding: 0 20px; }
.wrd-prose { max-width: 760px; }

/* Type helpers */
.wrd-eyebrow {
  font-size: 14px; font-weight: 700; letter-spacing: 0.4px; line-height: 18px;
  text-transform: uppercase; margin: 0 0 16px;
}
.wrd-h2 {
  font-family: 'Playfair Display', 'Times New Roman', Georgia, serif;
  font-size: 48px; font-weight: 400; line-height: 1.05; letter-spacing: -0.4px; margin: 0 0 20px;
}
.wrd-display-md {
  font-family: 'Playfair Display', 'Times New Roman', Georgia, serif;
  font-size: 30px; font-weight: 400; line-height: 1.1; letter-spacing: -0.3px; margin: 0;
}
.wrd-display-sm {
  font-family: 'Playfair Display', 'Times New Roman', Georgia, serif;
  font-size: 26px; font-weight: 400; line-height: 1.08; margin: 0 0 8px;
}
.wrd-section { padding: 48px 0; }
.wrd-section-lined { border-top: 1px solid #e0e0e0; }
.wrd-section-note { font-size: 14px; line-height: 18px; letter-spacing: 0.4px; color: #757575; margin: 0 0 24px; }
.wrd-underline { text-decoration: underline; text-underline-offset: 3px; }

/* Masthead + nav */
.wrd-masthead { border-bottom: 1px solid #e0e0e0; padding: 12px 20px; text-align: center; }
.wrd-masthead-word {
  font-family: 'Playfair Display', 'Times New Roman', Georgia, serif;
  font-size: 28px; font-weight: 500; letter-spacing: 2px;
}
.wrd-nav { border-bottom: 2px solid #000000; background: #ffffff; position: sticky; top: 0; z-index: 50; }
.wrd-nav-inner {
  max-width: 1400px; margin: 0 auto; padding: 12px 20px;
  display: flex; align-items: center; gap: 24px;
}
.wrd-nav-burger { font-size: 18px; line-height: 1; }
.wrd-nav-links { display: flex; gap: 24px; flex: 1; }
.wrd-nav-links a { font-size: 14px; font-weight: 700; letter-spacing: 0.4px; }
.wrd-nav-links a:hover { text-decoration: underline; text-underline-offset: 4px; }
.wrd-nav-back { font-size: 14px; font-weight: 700; letter-spacing: 0.4px; border: 1px solid #000000; padding: 8px 16px; white-space: nowrap; }
.wrd-nav-back:hover { background: #000000; color: #ffffff; }

/* Hero */
.wrd-hero { padding: 48px 0; }
.wrd-hero-title {
  font-family: 'Playfair Display', 'Times New Roman', Georgia, serif;
  font-size: 64px; font-weight: 400; line-height: 0.95; letter-spacing: -0.5px;
  margin: 0 0 24px; max-width: 1000px;
}
.wrd-hero-sub {
  font-family: 'Lora', Georgia, 'Times New Roman', serif;
  font-size: 19px; line-height: 1.47; letter-spacing: 0.108px; color: #1a1a1a;
  margin: 0 0 20px; max-width: 780px;
}
.wrd-byline {
  font-family: 'Lora', Georgia, serif; font-size: 12.73px; font-weight: 700;
  line-height: 2.2; letter-spacing: 0.108px; color: #757575; margin: 0 0 28px;
}
.wrd-hero-actions { display: flex; flex-wrap: wrap; gap: 12px; }
.style-wired .wrd-btn-primary {
  background: #000000; color: #ffffff; font-size: 16px; font-weight: 700;
  letter-spacing: 0.3px; padding: 12px 20px; border: 1px solid #000000;
}
.style-wired .wrd-btn-primary:hover { background: #1a1a1a; color: #ffffff; }
.style-wired .wrd-btn-outline {
  background: #ffffff; color: #000000; font-size: 16px; font-weight: 700;
  letter-spacing: 0.3px; padding: 12px 20px; border: 1px solid #000000;
}
.wrd-btn-outline:hover { background: #f5f5f5; }

/* Stats */
.wrd-stats { border-top: 1px solid #e0e0e0; border-bottom: 1px solid #e0e0e0; padding: 32px 0; }
.wrd-stats-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 20px; }
.wrd-stat { border-left: 1px solid #e0e0e0; padding-left: 16px; }
.wrd-stat:first-child { border-left: none; padding-left: 0; }
.wrd-stat-value {
  font-family: 'Playfair Display', 'Times New Roman', Georgia, serif;
  font-size: 44px; line-height: 1; letter-spacing: -0.4px;
}
.wrd-stat-label { font-size: 14px; font-weight: 700; letter-spacing: 0.4px; margin-top: 8px; text-transform: uppercase; }
.wrd-stat-desc { font-size: 12px; line-height: 16px; color: #757575; margin-top: 4px; }

/* Abstract */
.wrd-abstract {
  font-family: 'Lora', Georgia, 'Times New Roman', serif;
  font-size: 19px; line-height: 1.47; letter-spacing: 0.108px; margin: 0;
}
.wrd-abstract::first-letter {
  font-family: 'Playfair Display', Georgia, serif; font-size: 64px; line-height: 0.85;
  float: left; padding: 6px 10px 0 0; font-weight: 400;
}
.wrd-abstract-note { font-family: 'Lora', Georgia, serif; font-size: 14px; color: #757575; margin: 20px 0 0; }

/* Dimension story cards */
.wrd-dim-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 32px; margin-top: 32px; }
.wrd-story-card { background: #ffffff; border-top: 2px solid #000000; padding: 16px 0 0; }
.wrd-card-index { font-size: 12px; font-weight: 700; letter-spacing: 0.4px; color: #757575; margin: 0 0 8px; text-transform: uppercase; }
.wrd-card-tag { font-family: 'Lora', Georgia, serif; font-size: 14px; color: #757575; margin: 10px 0 16px; }
.wrd-card-list { list-style: none; margin: 0; padding: 0; }
.wrd-card-list li {
  font-size: 14px; line-height: 18px; letter-spacing: 0.4px; color: #1a1a1a;
  padding: 8px 0; border-top: 1px solid #e0e0e0;
}

/* Table */
.wrd-table-wrap { border-top: 2px solid #000000; border-bottom: 2px solid #000000; overflow-x: auto; }
.wrd-table { width: 100%; border-collapse: collapse; min-width: 880px; }
.wrd-table th {
  text-align: left; font-size: 12px; font-weight: 400; letter-spacing: 0.4px; text-transform: uppercase;
  color: #757575; background: #f5f5f5; padding: 12px 16px; border-bottom: 1px solid #e0e0e0; white-space: nowrap;
}
.wrd-table td { font-size: 14px; letter-spacing: 0.4px; padding: 12px 16px; border-bottom: 1px solid #e0e0e0; white-space: nowrap; }
.wrd-table tbody tr:last-child td { border-bottom: none; }
.wrd-th-num, .wrd-td-num { text-align: right; font-variant-numeric: tabular-nums; }
.wrd-td-rank { font-weight: 700; }
.wrd-td-model { font-weight: 700; }
.wrd-td-org { color: #757575; }
.wrd-best { font-weight: 700; }
.wrd-second { text-decoration: underline; text-underline-offset: 3px; }
.wrd-type {
  font-size: 12px; font-weight: 700; letter-spacing: 0.4px; text-transform: uppercase;
  border: 1px solid #000000; padding: 3px 8px; display: inline-block;
}
.wrd-type-open { background: #000000; color: #ffffff; }

/* Charts */
.wrd-chart-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; margin-top: 32px; }
.wrd-chart-wide { grid-column: 1 / -1; }
.wrd-chart-note { font-size: 12px; line-height: 16px; color: #757575; margin: 0 0 20px; }
.wrd-bars { display: grid; gap: 6px; }
.wrd-bar-row { display: grid; grid-template-columns: 170px 1fr 48px; align-items: center; gap: 12px; }
.wrd-bar-name { font-size: 13px; letter-spacing: 0.2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.wrd-bar-track { display: block; height: 16px; background: #f5f5f5; }
.wrd-bar-fill { display: block; height: 100%; background: #000000; }
.wrd-bar-open {
  background: repeating-linear-gradient(-45deg, #000000 0 2px, #ffffff 2px 6px);
  border-right: 1px solid #000000;
}
.wrd-bar-val { font-size: 12px; color: #757575; text-align: right; font-variant-numeric: tabular-nums; }
.wrd-radar { width: 100%; height: auto; display: block; }
.wrd-radar-label { font-size: 11px; font-weight: 700; letter-spacing: 1px; fill: #757575; text-transform: uppercase; }
.wrd-legend { list-style: none; margin: 12px 0 0; padding: 0; display: grid; gap: 6px; }
.wrd-legend li { display: flex; align-items: center; gap: 8px; font-size: 13px; letter-spacing: 0.2px; }
.wrd-swatch { width: 12px; height: 12px; display: inline-block; }
.wrd-grouped { display: grid; gap: 20px; }
.wrd-group-label {
  font-size: 14px; font-weight: 700; letter-spacing: 0.4px; text-transform: uppercase;
  display: block; margin-bottom: 8px; border-bottom: 1px solid #e0e0e0; padding-bottom: 6px;
}
.wrd-group-bars { display: grid; gap: 6px; }
.wrd-group-row { display: grid; grid-template-columns: 56px 1fr 48px; align-items: center; gap: 10px; }
.wrd-group-tag { font-size: 11px; font-weight: 700; letter-spacing: 0.4px; color: #757575; }

/* Tasks */
.wrd-task-list { margin-top: 24px; }
.wrd-story-row { padding: 16px 0; border-bottom: 1px solid #e0e0e0; }
.wrd-task-head { display: flex; justify-content: space-between; align-items: baseline; gap: 16px; flex-wrap: wrap; }
.wrd-task-domain { font-size: 17px; font-weight: 700; letter-spacing: -0.144px; }
.wrd-stars { font-size: 14px; letter-spacing: 3px; }
.wrd-task-desc {
  font-family: 'Lora', Georgia, serif; font-size: 16px; line-height: 1.5; letter-spacing: 0.09px;
  margin: 8px 0; max-width: 760px;
}
.wrd-task-meta { font-size: 12px; line-height: 16px; color: #757575; margin: 0; text-transform: uppercase; letter-spacing: 0.4px; }

/* Failure modes */
.wrd-fail-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px; margin-top: 32px; }
.wrd-fail-item { border-top: 2px solid #000000; padding-top: 16px; }
.wrd-fail-pct {
  font-family: 'Playfair Display', 'Times New Roman', Georgia, serif;
  font-size: 48px; line-height: 1; letter-spacing: -0.4px;
}
.wrd-fail-name { font-size: 14px; font-weight: 700; letter-spacing: 0.4px; text-transform: uppercase; margin: 10px 0; }
.wrd-fail-track { height: 4px; background: #f5f5f5; margin-bottom: 12px; }
.wrd-fail-fill { display: block; height: 100%; background: #000000; }
.wrd-fail-desc { font-size: 13px; line-height: 18px; color: #757575; margin: 0; }

/* Methods */
.wrd-methods-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; }
.wrd-method-list { list-style: none; margin: 24px 0 0; padding: 0; }
.wrd-method-list li {
  font-family: 'Lora', Georgia, serif; font-size: 16px; line-height: 1.5;
  padding: 10px 0; border-bottom: 1px solid #e0e0e0;
}
.wrd-codeblock { background: #f5f5f5; border: 1px solid #e0e0e0; margin-top: 16px; }
.wrd-codeblock-head {
  font-size: 11px; font-weight: 700; letter-spacing: 0.4px; text-transform: uppercase;
  color: #757575; padding: 10px 16px; border-bottom: 1px solid #e0e0e0;
}
.wrd-codeblock pre {
  margin: 0; padding: 16px; font-family: 'JetBrains Mono', Menlo, Consolas, monospace;
  font-size: 13px; line-height: 1.6; overflow-x: auto; color: #000000;
}

/* Footer */
.wrd-footer { background: #000000; color: #ffffff; padding: 48px 0 32px; margin-top: 48px; }
.wrd-footer-word {
  font-family: 'Playfair Display', 'Times New Roman', Georgia, serif;
  font-size: 32px; font-weight: 500; letter-spacing: 2px; margin-bottom: 32px;
}
.wrd-footer-cols { display: grid; grid-template-columns: repeat(3, 1fr); gap: 32px; max-width: 640px; }
.wrd-footer-cols a { display: block; font-size: 14px; line-height: 18px; letter-spacing: 0.4px; color: #ffffff; padding: 4px 0; }
.wrd-footer-cols a:hover { text-decoration: underline; text-underline-offset: 4px; }
.wrd-footer-eyebrow { font-size: 12px; font-weight: 700; letter-spacing: 0.4px; text-transform: uppercase; color: #757575; margin: 0 0 10px; }
.wrd-footer-note { font-size: 12px; line-height: 16px; color: #757575; margin: 40px 0 0; border-top: 1px solid #1a1a1a; padding-top: 20px; }

@media (max-width: 960px) {
  .wrd-hero-title { font-size: 44px; }
  .wrd-h2 { font-size: 34px; }
  .wrd-stats-grid { grid-template-columns: repeat(3, 1fr); row-gap: 32px; }
  .wrd-stat:nth-child(4) { border-left: none; padding-left: 0; }
  .wrd-dim-grid, .wrd-chart-grid, .wrd-methods-grid { grid-template-columns: 1fr; }
  .wrd-fail-grid { grid-template-columns: repeat(2, 1fr); }
  .wrd-nav-links { display: none; }
}
@media (max-width: 560px) {
  .wrd-hero-title { font-size: 34px; }
  .wrd-stats-grid { grid-template-columns: repeat(2, 1fr); }
  .wrd-stat { border-left: none; padding-left: 0; }
  .wrd-fail-grid { grid-template-columns: 1fr; }
  .wrd-bar-row { grid-template-columns: 110px 1fr 44px; }
}

/* Lab capability band */
.wrd-labstats {
  display: flex; flex-wrap: wrap; gap: 24px; margin-top: 24px; padding-top: 20px;
  border-top: 1px solid #e0e0e0;
}
.wrd-labstat { font-size: 12px; letter-spacing: 0.4px; color: #757575; text-transform: uppercase; }
.wrd-labstat strong {
  font-family: 'Playfair Display', 'Times New Roman', Georgia, serif;
  font-size: 20px; font-weight: 500; color: #000000; margin-right: 4px; letter-spacing: 0;
}

/* Evaluation pathway */
.wrd-path-flow { display: flex; flex-wrap: wrap; align-items: stretch; gap: 8px; margin-top: 32px; }
.wrd-path-arrow { align-self: center; color: #757575; font-size: 14px; }
.wrd-path-node { border: 1px solid #000000; padding: 12px 14px; max-width: 200px; border-top-width: 4px; }
.wrd-path-s0 { border-top-color: #000000; }
.wrd-path-s1 { border-top-color: #757575; }
.wrd-path-s2 { border-top-color: #c9c9c9; }
.wrd-path-final { background: #000000; color: #ffffff; border-color: #000000; }
.wrd-path-node-id {
  display: block; font-family: 'JetBrains Mono', Menlo, Consolas, monospace;
  font-size: 12px; margin-bottom: 4px; letter-spacing: 0.4px;
}
.wrd-path-node-label { display: block; font-size: 13px; line-height: 1.4; letter-spacing: 0.2px; }
.wrd-path-legend { display: flex; flex-wrap: wrap; gap: 20px; margin-top: 16px; }
.wrd-path-legend-item {
  display: inline-flex; align-items: center; gap: 8px; font-size: 12px; font-weight: 700;
  letter-spacing: 0.4px; text-transform: uppercase; color: #757575;
}
.wrd-path-dot { width: 12px; height: 12px; display: inline-block; }
.wrd-path-dot-s0 { background: #000000; }
.wrd-path-dot-s1 { background: #757575; }
.wrd-path-dot-s2 { background: #c9c9c9; }
.wrd-path-note { margin-top: 20px; }
.wrd-table-caption { margin-top: 12px; }

/* Long-horizon wall */
.wrd-lh { margin-top: 16px; }
.wrd-lh-big {
  font-family: 'Playfair Display', 'Times New Roman', Georgia, serif;
  font-size: 88px; line-height: 1; letter-spacing: -0.4px;
}
.wrd-lh-big-label {
  font-family: 'Lora', Georgia, serif; font-size: 14px; color: #757575; margin: 8px 0 0;
}
.wrd-lh-bar { display: flex; height: 16px; background: #f5f5f5; margin: 24px 0 8px; }
.wrd-lh-under { display: block; height: 100%; background: #c9c9c9; }
.wrd-lh-over { display: block; height: 100%; background: #000000; min-width: 6px; }
.wrd-lh-legend {
  display: flex; justify-content: space-between; gap: 12px; flex-wrap: wrap;
  font-size: 12px; letter-spacing: 0.4px; color: #757575; text-transform: uppercase;
}
.wrd-lh-note { margin-top: 20px; }

/* Closed-loop adaptation */
.wrd-loop-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-top: 8px; }
.wrd-loop-yes { font-weight: 700; }
.wrd-loop-no { font-weight: 700; color: #757575; }
.wrd-fail-note { margin-top: 24px; }
.wrd-mt { margin-top: 32px; }
.wrd-formula-block { margin-top: 16px; }

@media (max-width: 960px) {
  .wrd-loop-grid { grid-template-columns: 1fr; }
  .wrd-path-node { max-width: none; flex: 1 1 40%; }
  .wrd-path-arrow { display: none; }
}
`
