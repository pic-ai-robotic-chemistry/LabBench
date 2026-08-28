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
  if (v === N10_BEST) return 'nt-num nt-best'
  if (v === N10_SECOND) return 'nt-num nt-second'
  return 'nt-num'
}

const DIM_TINTS = ['#e6e0f5', '#dcecfa', '#d9f3e1', '#ffe8d4']

export default function Notion() {
  const maxN10 = leaderboard[0].n10
  return (
    <div className="style-notion">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
      />
      <style>{CSS}</style>

      {/* ── Nav ─────────────────────────────────────────── */}
      <nav className="nt-nav">
        <div className="nt-nav-inner">
          <Link to="/" className="nt-back">
            ← Back to Gallery
          </Link>
          <div className="nt-brand">
            <span className="nt-logo">N</span>
            <span className="nt-brand-name">RoboChem Bench</span>
          </div>
          <div className="nt-nav-links">
            <a href="#nt-board">Leaderboard</a>
            <a href="#nt-tasks">Tasks</a>
            <a href="#nt-cite">Cite</a>
            <a href={paperMeta.links[0].href} className="nt-nav-cta">
              Get the paper
            </a>
          </div>
        </div>
      </nav>

      {/* ── Hero (deep navy band) ───────────────────────── */}
      <header className="nt-hero">
        <span className="nt-dot nt-dot-1" />
        <span className="nt-dot nt-dot-2" />
        <span className="nt-dot nt-dot-3" />
        <span className="nt-dot nt-dot-4" />
        <div className="nt-container nt-hero-inner">
          <span className="nt-badge-purple">Benchmark · 2026</span>
          <h1 className="nt-h1">{paperMeta.title}</h1>
          <p className="nt-sub">{paperMeta.subtitle}</p>
          <p className="nt-authors">{paperMeta.authors.join(', ')}</p>
          <p className="nt-affil">{paperMeta.affiliation}</p>
          <div className="nt-btn-row">
            {paperMeta.links.map((l, i) => (
              <a
                key={l.label}
                href={l.href}
                className={i === 0 ? 'nt-btn nt-btn-primary' : 'nt-btn nt-btn-ondark'}
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </header>

      {/* ── Stats band ──────────────────────────────────── */}
      <section className="nt-stats">
        <div className="nt-container">
          <div className="nt-stats-card">
            {keyStats.map((s) => (
              <div key={s.label} className="nt-stat">
                <div className="nt-stat-value">{s.value}</div>
                <div className="nt-stat-label">{s.label}</div>
                <div className="nt-stat-desc">{s.description}</div>
              </div>
            ))}
          </div>
          <div className="nt-labstats">
            {labStats.map((s) => (
              <div key={s.label} className="nt-labstat">
                <span className="nt-labstat-value">{s.value}</span>
                <span className="nt-labstat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Abstract ────────────────────────────────────── */}
      <section className="nt-section">
        <div className="nt-container nt-narrow">
          <span className="nt-tag nt-tag-purple">Abstract</span>
          <p className="nt-abstract">{abstractText}</p>
        </div>
      </section>

      {/* ── Skills Library ──────────────────────────────── */}
      <section className="nt-section nt-section-soft">
        <div className="nt-container">
          <h2 className="nt-h2">The Skills Library — 45 workstations, one interface</h2>
          <div className="nt-dim-grid">
            {skillCategories.map((d, i) => (
              <div key={d.name} className="nt-dim-card" style={{ background: DIM_TINTS[i] }}>
                <h3 className="nt-dim-title">{d.name}</h3>
                <p className="nt-dim-tagline">{d.tagline}</p>
                <ul className="nt-list">
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
      <section className="nt-section">
        <div className="nt-container">
          <span className="nt-tag nt-tag-purple">Evaluation Pathway</span>
          <h2 className="nt-h2">From task receipt to physical execution</h2>
          <div className="nt-path">
            {pathwayStages.map((stage, si) => (
              <Fragment key={stage}>
                {si > 0 && <span className="nt-path-arrow nt-path-arrow-big">→</span>}
                <div className={`nt-path-stage nt-path-stage-${si}`}>
                  <p className="nt-path-stage-name">{stage}</p>
                  <div className="nt-path-flow">
                    {pathway
                      .filter((n) => n.stage === stage)
                      .map((n, i) => (
                        <Fragment key={n.node}>
                          {i > 0 && <span className="nt-path-arrow">→</span>}
                          <div className={n.node === 'N10' ? 'nt-path-node nt-path-node-hl' : 'nt-path-node'}>
                            <span className="nt-path-node-id">{n.node}</span>
                            <span className="nt-path-node-label">{n.label}</span>
                          </div>
                        </Fragment>
                      ))}
                  </div>
                </div>
              </Fragment>
            ))}
          </div>
          <p className="nt-path-note">{pathwayNote}</p>
        </div>
      </section>

      {/* ── Leaderboard ─────────────────────────────────── */}
      <section className="nt-section" id="nt-board">
        <div className="nt-container">
          <h2 className="nt-h2">Leaderboard</h2>
          <p className="nt-section-note">
            N10 executable yield (%) across 48 configurations — top 8 shown. <strong>Bold</strong> = best,{' '}
            <span className="nt-underline-demo">underline</span> = runner-up.
          </p>
          <div className="nt-table-wrap">
            <table className="nt-table">
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
                    <td className="nt-rank">{r.rank}</td>
                    <td className="nt-model">
                      {r.harness} × {r.model}
                    </td>
                    <td className="nt-org">{r.org}</td>
                    <td>
                      <span className={r.weights === 'open' ? 'nt-tag nt-tag-green' : 'nt-tag nt-tag-orange'}>
                        {r.weights === 'open' ? 'Open' : 'Closed'}
                      </span>
                    </td>
                    <td className="nt-num">{r.trials}</td>
                    <td className="nt-num">{r.executable}</td>
                    <td className={n10Class(r.n10)}>{r.n10.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="nt-table-caption">{leaderboardCaption}</p>
        </div>
      </section>

      {/* ── Charts ──────────────────────────────────────── */}
      <section className="nt-section nt-section-soft">
        <div className="nt-container">
          <h2 className="nt-h2">Results, visualized</h2>

          <div className="nt-panel">
            <h3 className="nt-panel-title">N10 executable yield — top 8 configurations</h3>
            <div className="nt-bars">
              {leaderboard.map((r) => (
                <div key={r.rank} className="nt-bar-row">
                  <span className="nt-bar-label">
                    {r.harness} × {r.model}
                  </span>
                  <div className="nt-bar-track">
                    <div className="nt-bar-fill" style={{ width: `${(r.n10 / maxN10) * 100}%` }} />
                  </div>
                  <span className="nt-bar-value">{r.n10.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="nt-chart-duo">
            <div className="nt-panel">
              <h3 className="nt-panel-title">The long-horizon wall</h3>
              <div className="nt-horizon">
                <div className="nt-horizon-big">
                  <span className="nt-horizon-num">{longHorizon.longest}</span>
                  <span className="nt-horizon-cap">operations in the longest executable workflow</span>
                </div>
                <div className="nt-horizon-body">
                  <div className="nt-ratio">
                    <div
                      className="nt-ratio-in"
                      style={{
                        width: `${((longHorizon.totalExecutable - longHorizon.over30Ops) / longHorizon.totalExecutable) * 100}%`,
                      }}
                    />
                    <div
                      className="nt-ratio-out"
                      style={{ width: `${(longHorizon.over30Ops / longHorizon.totalExecutable) * 100}%` }}
                    />
                  </div>
                  <div className="nt-horizon-legend">
                    <span>
                      <span className="nt-dot" style={{ background: '#2a9d99' }} />
                      {longHorizon.totalExecutable - longHorizon.over30Ops} workflows ≤ 30 operations
                    </span>
                    <span>
                      <span className="nt-dot" style={{ background: '#ff64c8' }} />
                      {longHorizon.over30Ops} workflows &gt; 30 operations
                    </span>
                  </div>
                  <p className="nt-horizon-note">{longHorizon.note}</p>
                </div>
              </div>
            </div>

            <div className="nt-panel">
              <h3 className="nt-panel-title">Open vs closed weights — mean N10 yield</h3>
              <div className="nt-wavg">
                {weightsAvg.map((w, i) => (
                  <div key={w.group} className="nt-wavg-col">
                    <span className="nt-wavg-val">{w.value.toFixed(1)}%</span>
                    <div className="nt-wavg-track">
                      <div
                        className={i === 0 ? 'nt-wavg-fill nt-wavg-closed' : 'nt-wavg-fill nt-wavg-open'}
                        style={{ height: `${(w.value / 16) * 100}%` }}
                      />
                    </div>
                    <span className="nt-wavg-label">{w.group}</span>
                    <span className="nt-wavg-n">{w.n} configurations</span>
                  </div>
                ))}
              </div>
              <p className="nt-chart-note">{weightsAvgCaption}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Task domains ────────────────────────────────── */}
      <section className="nt-section" id="nt-tasks">
        <div className="nt-container">
          <h2 className="nt-h2">32 research tasks across four catalysis domains</h2>
          <div className="nt-dim-grid">
            {taskDomains.map((t, i) => (
              <div
                key={t.domain}
                className={t.domain === 'Electrocatalysis' ? 'nt-task-card nt-task-accent' : 'nt-task-card'}
              >
                <div className="nt-task-top">
                  <span className="nt-task-domain" style={{ background: DIM_TINTS[i] }}>
                    {t.domain}
                  </span>
                  {t.domain === 'Electrocatalysis' && <span className="nt-tag nt-tag-purple">Closed-loop study</span>}
                </div>
                <p className="nt-task-desc">{t.blurb}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Closed-loop adaptation ──────────────────────── */}
      <section className="nt-section nt-section-soft">
        <div className="nt-container">
          <span className="nt-tag nt-tag-purple">Closed-Loop Adaptation</span>
          <h2 className="nt-h2">Five rounds of feedback</h2>
          <p className="nt-section-note">
            Agent: <strong>{closedLoop.agent}</strong> · Task: {closedLoop.task} · {closedLoop.rounds} feedback rounds
          </p>
          <div className="nt-loop-grid">
            <div className="nt-loop-col">
              <h3 className="nt-loop-title">
                <span className="nt-tag nt-tag-green">✓ Observed</span> Localized adaptation
              </h3>
              <ul className="nt-loop-list">
                {closedLoop.adapted.map((a) => (
                  <li key={a}>
                    <span className="nt-loop-mark nt-loop-yes">✓</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
            <div className="nt-loop-col">
              <h3 className="nt-loop-title">
                <span className="nt-tag nt-tag-orange">✗ Not observed</span> Strategic redirection
              </h3>
              <ul className="nt-loop-list">
                {closedLoop.notObserved.map((a) => (
                  <li key={a}>
                    <span className="nt-loop-mark nt-loop-no">✗</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Failure modes ───────────────────────────────── */}
      <section className="nt-section">
        <div className="nt-container">
          <h2 className="nt-h2">How agents break</h2>
          <div className="nt-fail-grid">
            {failureModes.map((f) => (
              <div key={f.name} className="nt-fail">
                <span className="nt-fail-name">{f.name}</span>
                <p className="nt-fail-desc">{f.description}</p>
              </div>
            ))}
          </div>
          <p className="nt-fail-note">{failureNote}</p>
        </div>
      </section>

      {/* ── Methodology + BibTeX ────────────────────────── */}
      <section className="nt-section" id="nt-cite">
        <div className="nt-container nt-method-grid">
          <div>
            <span className="nt-tag nt-tag-purple">Methodology</span>
            <h2 className="nt-h2">Measured, not vibes</h2>
            <p className="nt-method-sub">Multi-axis rubric</p>
            <ul className="nt-list nt-list-method">
              {scoringAxes.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
            <div className="nt-formulas">
              {formulas.map((f) => (
                <code key={f} className="nt-formula">
                  {f}
                </code>
              ))}
            </div>
            <ul className="nt-list nt-list-method">
              {methodologyNotes.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
          <div className="nt-code-card">
            <div className="nt-code-head">robochem-bench.bib</div>
            <pre className="nt-code">{bibtex}</pre>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="nt-footer">
        <div className="nt-container nt-footer-inner">
          <div className="nt-footer-brand">
            <span className="nt-logo">N</span> RoboChem Bench
          </div>
          <p>Style preview · Notion DESIGN.md · Content from arXiv:2607.23045</p>
          <p className="nt-footer-fine">Built with the Notion DESIGN.md · Style preview for RoboChem Bench</p>
        </div>
      </footer>
    </div>
  )
}

const CSS = `
.style-notion {
  background: #ffffff;
  color: #1a1a1a;
  font-family: 'Inter', -apple-system, system-ui, 'Segoe UI', Helvetica, sans-serif;
  font-size: 16px;
  line-height: 1.55;
  min-height: 100dvh;
}
.style-notion .nt-container { max-width: 1216px; margin: 0 auto; padding: 0 32px; }
.style-notion .nt-narrow { max-width: 780px; }

/* nav */
.style-notion .nt-nav { background: #ffffff; border-bottom: 1px solid #e5e3df; position: sticky; top: 0; z-index: 50; }
.style-notion .nt-nav-inner { max-width: 1216px; margin: 0 auto; padding: 0 32px; height: 64px; display: flex; align-items: center; gap: 24px; }
.style-notion .nt-back { font-size: 14px; font-weight: 500; color: #1a1a1a; text-decoration: none; }
.style-notion .nt-back:hover { color: #5645d4; }
.style-notion .nt-brand { display: flex; align-items: center; gap: 10px; margin-left: auto; }
.style-notion .nt-logo {
  display: inline-flex; align-items: center; justify-content: center;
  width: 26px; height: 26px; background: #000000; color: #ffffff;
  font-size: 15px; font-weight: 700; border-radius: 6px;
}
.style-notion .nt-brand-name { font-size: 15px; font-weight: 600; letter-spacing: -0.2px; }
.style-notion .nt-nav-links { display: flex; align-items: center; gap: 20px; }
.style-notion .nt-nav-links a { font-size: 14px; font-weight: 500; color: #5d5b54; text-decoration: none; }
.style-notion .nt-nav-links a:hover { color: #1a1a1a; }
.style-notion .nt-nav-cta {
  background: #5645d4; color: #ffffff !important; padding: 10px 18px; border-radius: 8px;
  font-size: 14px; font-weight: 500;
}

/* hero */
.style-notion .nt-hero {
  background: #0a1530; color: #ffffff; padding: 110px 0 120px; text-align: center;
  position: relative; overflow: hidden;
}
.style-notion .nt-dot { position: absolute; width: 14px; height: 14px; border-radius: 3px; opacity: 0.9; }
.style-notion .nt-dot-1 { background: #ff64c8; top: 64px; left: 8%; transform: rotate(12deg); }
.style-notion .nt-dot-2 { background: #f5d75e; top: 140px; right: 10%; transform: rotate(-8deg); }
.style-notion .nt-dot-3 { background: #2a9d99; bottom: 90px; left: 14%; transform: rotate(6deg); }
.style-notion .nt-dot-4 { background: #7b3ff2; bottom: 150px; right: 16%; transform: rotate(-14deg); }
.style-notion .nt-hero-inner { display: flex; flex-direction: column; align-items: center; }
.style-notion .nt-h1 {
  font-size: 56px; font-weight: 600; line-height: 1.08; letter-spacing: -1.5px;
  margin: 24px 0 0; max-width: 980px; color: #ffffff;
}
.style-notion .nt-sub { font-size: 18px; font-weight: 400; line-height: 1.5; color: rgba(255,255,255,0.82); max-width: 760px; margin: 20px 0 0; }
.style-notion .nt-authors { font-size: 14px; color: rgba(255,255,255,0.62); margin: 28px 0 0; max-width: 860px; }
.style-notion .nt-affil { font-size: 13px; color: rgba(255,255,255,0.45); margin: 6px 0 0; }
.style-notion .nt-btn-row { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px; margin-top: 32px; }
.style-notion .nt-btn {
  display: inline-flex; align-items: center; padding: 10px 18px; border-radius: 8px;
  font-size: 14px; font-weight: 500; text-decoration: none;
}
.style-notion .nt-btn-primary { background: #5645d4; color: #ffffff; }
.style-notion .nt-btn-primary:active { background: #4534b3; }
.style-notion .nt-btn-ondark { background: #ffffff; color: #1a1a1a; }
.style-notion .nt-badge-purple {
  display: inline-block; background: #5645d4; color: #ffffff; font-size: 13px; font-weight: 600;
  padding: 4px 10px; border-radius: 9999px;
}

/* stats */
.style-notion .nt-stats { padding: 0 0 24px; margin-top: -56px; position: relative; z-index: 2; }
.style-notion .nt-stats-card {
  background: #ffffff; border: 1px solid #e5e3df; border-radius: 12px;
  box-shadow: rgba(15,15,15,0.08) 0 4px 12px;
  display: grid; grid-template-columns: repeat(6, 1fr); padding: 40px 24px;
}
.style-notion .nt-stat { text-align: center; padding: 0 12px; }
.style-notion .nt-stat-value { font-size: 34px; font-weight: 600; letter-spacing: -0.8px; color: #1a1a1a; }
.style-notion .nt-stat-label { font-size: 14px; font-weight: 500; color: #37352f; margin-top: 6px; }
.style-notion .nt-stat-desc { font-size: 13px; color: #787671; margin-top: 4px; }

/* lab capability secondary band */
.style-notion .nt-labstats {
  background: #f6f5f4; border: 1px solid #e5e3df; border-radius: 12px; margin-top: 16px;
  display: grid; grid-template-columns: repeat(4, 1fr); padding: 18px 24px;
}
.style-notion .nt-labstat { display: flex; align-items: baseline; justify-content: center; gap: 8px; }
.style-notion .nt-labstat-value { font-size: 20px; font-weight: 600; letter-spacing: -0.4px; color: #5645d4; }
.style-notion .nt-labstat-label { font-size: 12px; font-weight: 600; letter-spacing: 0.5px; text-transform: uppercase; color: #787671; }

/* sections */
.style-notion .nt-section { padding: 72px 0; }
.style-notion .nt-section-soft { background: #f6f5f4; }
.style-notion .nt-h2 { font-size: 36px; font-weight: 600; line-height: 1.2; letter-spacing: -0.5px; margin: 0 0 32px; color: #1a1a1a; }
.style-notion .nt-section-note { font-size: 14px; color: #5d5b54; margin: -16px 0 24px; }
.style-notion .nt-underline-demo { text-decoration: underline; text-underline-offset: 3px; }
.style-notion .nt-abstract { font-size: 22px; line-height: 1.55; color: #37352f; margin: 20px 0 0; }

/* tags */
.style-notion .nt-tag { display: inline-block; font-size: 13px; font-weight: 600; padding: 2px 8px; border-radius: 6px; }
.style-notion .nt-tag-purple { background: #e6e0f5; color: #391c57; }
.style-notion .nt-tag-green { background: #d9f3e1; color: #1aae39; }
.style-notion .nt-tag-orange { background: #ffe8d4; color: #793400; }

/* dimension cards */
.style-notion .nt-dim-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
.style-notion .nt-dim-card { border-radius: 12px; padding: 32px; }
.style-notion .nt-dim-title { font-size: 22px; font-weight: 600; letter-spacing: -0.3px; margin: 0 0 4px; color: #37352f; }
.style-notion .nt-dim-tagline { font-size: 14px; color: #5d5b54; margin: 0 0 16px; }
.style-notion .nt-list { margin: 0; padding: 0; list-style: none; }
.style-notion .nt-list li { font-size: 15px; color: #37352f; padding: 5px 0 5px 22px; position: relative; }
.style-notion .nt-list li::before { content: ''; position: absolute; left: 2px; top: 13px; width: 8px; height: 8px; border-radius: 2px; background: #5645d4; }
.style-notion .nt-list-method li::before { background: #5645d4; }

/* pathway */
.style-notion .nt-path { display: flex; align-items: stretch; gap: 12px; flex-wrap: wrap; margin-top: 8px; }
.style-notion .nt-path-stage { flex: 1 1 240px; background: #ffffff; border: 1px solid #e5e3df; border-radius: 12px; padding: 20px; }
.style-notion .nt-path-stage-name { font-size: 12px; font-weight: 600; letter-spacing: 0.8px; text-transform: uppercase; margin: 0 0 14px; }
.style-notion .nt-path-stage-0 .nt-path-stage-name { color: #5645d4; }
.style-notion .nt-path-stage-1 .nt-path-stage-name { color: #2a9d99; }
.style-notion .nt-path-stage-2 .nt-path-stage-name { color: #dd5b00; }
.style-notion .nt-path-flow { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.style-notion .nt-path-node { background: #f6f5f4; border: 1px solid #e5e3df; border-radius: 8px; padding: 10px 12px; min-width: 96px; }
.style-notion .nt-path-node-id { display: block; font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 500; color: #5645d4; }
.style-notion .nt-path-node-label { display: block; font-size: 13px; color: #37352f; margin-top: 4px; line-height: 1.35; }
.style-notion .nt-path-node-hl { border: 2px solid #5645d4; background: #e6e0f5; }
.style-notion .nt-path-node-hl .nt-path-node-id { color: #391c57; font-weight: 600; }
.style-notion .nt-path-arrow { color: #a4a097; font-size: 14px; }
.style-notion .nt-path-arrow-big { color: #5645d4; font-size: 20px; font-weight: 600; align-self: center; }
.style-notion .nt-path-note { font-size: 14px; color: #5d5b54; margin: 20px 0 0; max-width: 880px; }

/* table */
.style-notion .nt-table-wrap { overflow-x: auto; border: 1px solid #e5e3df; border-radius: 8px; }
.style-notion .nt-table { width: 100%; border-collapse: collapse; font-size: 14px; min-width: 780px; background: #ffffff; }
.style-notion .nt-table th {
  text-align: left; font-size: 11px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;
  color: #787671; padding: 12px 16px; border-bottom: 1px solid #e5e3df; background: #f6f5f4;
}
.style-notion .nt-table td { padding: 12px 16px; border-bottom: 1px solid #ede9e4; color: #37352f; }
.style-notion .nt-table tbody tr:last-child td { border-bottom: none; }
.style-notion .nt-rank { color: #a4a097; font-weight: 500; }
.style-notion .nt-model { font-weight: 500; color: #1a1a1a; }
.style-notion .nt-num { font-variant-numeric: tabular-nums; }
.style-notion .nt-best { font-weight: 700; color: #1a1a1a; }
.style-notion .nt-second { text-decoration: underline; text-underline-offset: 3px; text-decoration-color: #5645d4; }
.style-notion .nt-table-caption { font-size: 13px; color: #787671; margin: 16px 0 0; }

/* charts */
.style-notion .nt-panel {
  background: #ffffff; border: 1px solid #e5e3df; border-radius: 12px; padding: 32px;
}
.style-notion .nt-panel + .nt-chart-duo, .style-notion .nt-chart-duo { margin-top: 24px; }
.style-notion .nt-panel-title { font-size: 18px; font-weight: 600; margin: 0 0 24px; color: #1a1a1a; }
.style-notion .nt-chart-duo { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.style-notion .nt-bars { display: flex; flex-direction: column; gap: 8px; }
.style-notion .nt-bar-row { display: grid; grid-template-columns: 250px 1fr 60px; align-items: center; gap: 12px; }
.style-notion .nt-bar-label { font-size: 13px; font-weight: 500; color: #37352f; text-align: right; }
.style-notion .nt-bar-track { height: 16px; background: #f0eeec; border-radius: 4px; overflow: hidden; }
.style-notion .nt-bar-fill { height: 100%; background: #5645d4; border-radius: 4px; }
.style-notion .nt-bar-value { font-size: 13px; font-variant-numeric: tabular-nums; color: #787671; }
.style-notion .nt-dot { display: inline-block; width: 10px; height: 10px; border-radius: 3px; margin-right: 8px; }

/* long-horizon wall */
.style-notion .nt-horizon { display: flex; gap: 32px; align-items: flex-start; flex-wrap: wrap; }
.style-notion .nt-horizon-big { flex: 0 0 140px; }
.style-notion .nt-horizon-num { font-size: 84px; font-weight: 700; letter-spacing: -2px; line-height: 1; color: #5645d4; display: block; }
.style-notion .nt-horizon-cap { font-size: 13px; color: #787671; display: block; margin-top: 8px; }
.style-notion .nt-horizon-body { flex: 1 1 300px; }
.style-notion .nt-ratio { display: flex; height: 24px; border-radius: 6px; overflow: hidden; background: #f0eeec; }
.style-notion .nt-ratio-in { background: #2a9d99; }
.style-notion .nt-ratio-out { background: #ff64c8; min-width: 12px; }
.style-notion .nt-horizon-legend { display: flex; gap: 20px; margin-top: 12px; font-size: 13px; color: #37352f; flex-wrap: wrap; }
.style-notion .nt-horizon-note { font-size: 14px; color: #5d5b54; margin: 16px 0 0; }

/* open vs closed mean N10 */
.style-notion .nt-wavg { display: flex; gap: 48px; align-items: flex-end; }
.style-notion .nt-wavg-col { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.style-notion .nt-wavg-val { font-size: 28px; font-weight: 700; letter-spacing: -0.6px; color: #1a1a1a; }
.style-notion .nt-wavg-track { height: 150px; width: 40px; background: #f0eeec; border-radius: 4px 4px 0 0; display: flex; align-items: flex-end; }
.style-notion .nt-wavg-fill { width: 100%; border-radius: 4px 4px 0 0; }
.style-notion .nt-wavg-closed { background: #5645d4; }
.style-notion .nt-wavg-open { background: #2a9d99; }
.style-notion .nt-wavg-label { font-size: 13px; font-weight: 500; color: #37352f; }
.style-notion .nt-wavg-n { font-size: 12px; color: #787671; }
.style-notion .nt-chart-note { font-size: 13px; color: #787671; margin: 16px 0 0; }

/* tasks */
.style-notion .nt-task-card { background: #ffffff; border: 1px solid #e5e3df; border-radius: 12px; padding: 24px; }
.style-notion .nt-task-accent { border: 2px solid #5645d4; }
.style-notion .nt-task-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; gap: 12px; flex-wrap: wrap; }
.style-notion .nt-task-domain { font-size: 13px; font-weight: 600; color: #37352f; padding: 4px 10px; border-radius: 6px; }
.style-notion .nt-task-desc { font-size: 15px; color: #37352f; margin: 0; }

/* closed loop */
.style-notion .nt-loop-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.style-notion .nt-loop-col { background: #ffffff; border: 1px solid #e5e3df; border-radius: 12px; padding: 28px; }
.style-notion .nt-loop-title { font-size: 16px; font-weight: 600; margin: 0 0 16px; color: #1a1a1a; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.style-notion .nt-loop-list { margin: 0; padding: 0; list-style: none; }
.style-notion .nt-loop-list li { font-size: 15px; color: #37352f; padding: 6px 0 6px 26px; position: relative; }
.style-notion .nt-loop-mark { position: absolute; left: 0; top: 6px; font-weight: 700; }
.style-notion .nt-loop-yes { color: #1aae39; }
.style-notion .nt-loop-no { color: #793400; }

/* failures */
.style-notion .nt-fail-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
.style-notion .nt-fail { background: #ffffff; border: 1px solid #e5e3df; border-radius: 12px; padding: 24px; }
.style-notion .nt-fail-name { font-size: 16px; font-weight: 600; color: #1a1a1a; }
.style-notion .nt-fail-desc { font-size: 14px; color: #5d5b54; margin: 12px 0 0; }
.style-notion .nt-fail-note { font-size: 14px; color: #5d5b54; margin: 28px 0 0; max-width: 880px; border-left: 3px solid #5645d4; padding-left: 16px; }

/* methodology */
.style-notion .nt-method-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: start; }
.style-notion .nt-list-method { margin-top: 8px; }
.style-notion .nt-method-sub { font-size: 13px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; color: #5645d4; margin: 24px 0 8px; }
.style-notion .nt-formulas { display: flex; flex-direction: column; gap: 8px; margin: 20px 0 24px; }
.style-notion .nt-formula {
  font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 13px; color: #391c57;
  background: #e6e0f5; border-radius: 6px; padding: 10px 14px; display: block;
}
.style-notion .nt-code-card { background: #0a1530; border-radius: 12px; overflow: hidden; }
.style-notion .nt-code-head {
  padding: 12px 16px; font-size: 12px; font-weight: 500; color: rgba(255,255,255,0.55);
  font-family: 'JetBrains Mono', monospace; border-bottom: 1px solid #1a2a52;
}
.style-notion .nt-code {
  margin: 0; padding: 24px; font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 13px; line-height: 1.6; color: #ffffff; overflow-x: auto; white-space: pre;
}

/* footer */
.style-notion .nt-footer { background: #ffffff; border-top: 1px solid #e5e3df; padding: 56px 0 64px; font-size: 14px; color: #5d5b54; }
.style-notion .nt-footer-brand { display: flex; align-items: center; gap: 10px; font-weight: 600; color: #1a1a1a; margin-bottom: 12px; }
.style-notion .nt-footer p { margin: 4px 0; }
.style-notion .nt-footer-fine { color: #a4a097; font-size: 13px; }

@media (max-width: 960px) {
  .style-notion .nt-stats-card { grid-template-columns: repeat(3, 1fr); gap: 24px; }
  .style-notion .nt-labstats { grid-template-columns: repeat(2, 1fr); gap: 12px; }
  .style-notion .nt-dim-grid, .style-notion .nt-chart-duo, .style-notion .nt-fail-grid, .style-notion .nt-method-grid, .style-notion .nt-loop-grid { grid-template-columns: 1fr; }
  .style-notion .nt-h1 { font-size: 36px; letter-spacing: -0.8px; }
  .style-notion .nt-h2 { font-size: 28px; }
  .style-notion .nt-nav-links { display: none; }
  .style-notion .nt-hero { padding: 72px 0 90px; }
  .style-notion .nt-section { padding: 56px 0; }
}
@media (max-width: 560px) {
  .style-notion .nt-stats-card { grid-template-columns: repeat(2, 1fr); }
  .style-notion .nt-labstats { grid-template-columns: 1fr; }
  .style-notion .nt-bar-row { grid-template-columns: 124px 1fr 52px; }
  .style-notion .nt-bar-label { font-size: 11px; }
}
`
