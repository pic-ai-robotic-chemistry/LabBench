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
  if (v === N10_BEST) return 'st-num st-best'
  if (v === N10_SECOND) return 'st-num st-second'
  return 'st-num'
}

export default function Stripe() {
  const maxN10 = leaderboard[0].n10
  return (
    <div className="style-stripe">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=JetBrains+Mono:wght@300;400&display=swap"
      />
      <style>{CSS}</style>

      {/* ── Hero with gradient mesh ─────────────────────── */}
      <header className="st-hero">
        <div className="st-mesh" aria-hidden="true">
          <span className="st-blob st-blob-1" />
          <span className="st-blob st-blob-2" />
          <span className="st-blob st-blob-3" />
          <span className="st-blob st-blob-4" />
          <span className="st-blob st-blob-5" />
        </div>
        <nav className="st-nav">
          <div className="st-nav-inner">
            <Link to="/" className="st-back">
              ← Back to Gallery
            </Link>
            <span className="st-wordmark">RoboChem Bench</span>
            <div className="st-nav-links">
              <a href="#st-board">Leaderboard</a>
              <a href="#st-tasks">Tasks</a>
              <a href="#st-cite">Cite</a>
              <a href={paperMeta.links[0].href} className="st-btn st-btn-primary st-btn-nav">
                Get the paper
              </a>
            </div>
          </div>
        </nav>
        <div className="st-container st-hero-inner">
          <p className="st-eyebrow">BENCHMARK · 2026</p>
          <h1 className="st-h1">{paperMeta.title}</h1>
          <p className="st-sub">{paperMeta.subtitle}</p>
          <p className="st-authors">{paperMeta.authors.join(', ')}</p>
          <p className="st-affil">{paperMeta.affiliation}</p>
          <div className="st-btn-row">
            {paperMeta.links.map((l, i) => (
              <a key={l.label} href={l.href} className={i === 0 ? 'st-btn st-btn-primary' : 'st-btn st-btn-secondary'}>
                {l.label}
                {i === 0 ? <span className="st-btn-arrow"> →</span> : null}
              </a>
            ))}
          </div>
        </div>
      </header>

      {/* ── Stats band ──────────────────────────────────── */}
      <section className="st-stats">
        <div className="st-container">
          <div className="st-stats-grid">
            {keyStats.map((s) => (
              <div key={s.label} className="st-stat">
                <div className="st-stat-value">{s.value}</div>
                <div className="st-stat-label">{s.label}</div>
                <div className="st-stat-desc">{s.description}</div>
              </div>
            ))}
          </div>
          <div className="st-labstats">
            {labStats.map((s) => (
              <div key={s.label} className="st-labstat">
                <span className="st-labstat-value">{s.value}</span>
                <span className="st-labstat-label">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Abstract ────────────────────────────────────── */}
      <section className="st-section">
        <div className="st-container st-narrow">
          <p className="st-eyebrow">ABSTRACT</p>
          <p className="st-abstract">{abstractText}</p>
        </div>
      </section>

      {/* ── Skills Library ──────────────────────────────── */}
      <section className="st-section st-section-soft">
        <div className="st-container">
          <p className="st-eyebrow">THE SKILLS LIBRARY</p>
          <h2 className="st-h2">45 workstations, one skills library</h2>
          <div className="st-dim-grid">
            {skillCategories.map((d) => (
              <div key={d.name} className="st-card">
                <h3 className="st-card-title">{d.name}</h3>
                <p className="st-card-tagline">{d.tagline}</p>
                <ul className="st-list">
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
      <section className="st-section">
        <div className="st-container">
          <p className="st-eyebrow">EVALUATION PATHWAY</p>
          <h2 className="st-h2">From task receipt to physical execution</h2>
          <div className="st-path">
            {pathwayStages.map((stage, si) => (
              <Fragment key={stage}>
                {si > 0 && <span className="st-path-arrow st-path-arrow-big">→</span>}
                <div className={`st-path-stage st-path-stage-${si}`}>
                  <p className="st-path-stage-name">{stage}</p>
                  <div className="st-path-flow">
                    {pathway
                      .filter((n) => n.stage === stage)
                      .map((n, i) => (
                        <Fragment key={n.node}>
                          {i > 0 && <span className="st-path-arrow">→</span>}
                          <div className={n.node === 'N10' ? 'st-path-node st-path-node-hl' : 'st-path-node'}>
                            <span className="st-path-node-id">{n.node}</span>
                            <span className="st-path-node-label">{n.label}</span>
                          </div>
                        </Fragment>
                      ))}
                  </div>
                </div>
              </Fragment>
            ))}
          </div>
          <p className="st-path-note">{pathwayNote}</p>
        </div>
      </section>

      {/* ── Leaderboard ─────────────────────────────────── */}
      <section className="st-section st-section-soft" id="st-board">
        <div className="st-container">
          <p className="st-eyebrow">LEADERBOARD</p>
          <h2 className="st-h2">48 configurations, ranked by N10 yield</h2>
          <p className="st-section-note">
            N10 executable yield (%) — top 8 shown. <span className="st-best-inline">Bold</span> marks the best;{' '}
            <span className="st-underline-demo">underline</span> the runner-up.
          </p>
          <div className="st-table-wrap">
            <table className="st-table">
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
                    <td className="st-rank">{r.rank}</td>
                    <td className="st-model">
                      {r.harness} × {r.model}
                    </td>
                    <td className="st-org">{r.org}</td>
                    <td>
                      <span className={r.weights === 'open' ? 'st-tag st-tag-open' : 'st-tag st-tag-closed'}>
                        {r.weights === 'open' ? 'Open' : 'Closed'}
                      </span>
                    </td>
                    <td className="st-num">{r.trials}</td>
                    <td className="st-num">{r.executable}</td>
                    <td className={n10Class(r.n10)}>{r.n10.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="st-table-caption">{leaderboardCaption}</p>
        </div>
      </section>

      {/* ── Charts ──────────────────────────────────────── */}
      <section className="st-section">
        <div className="st-container">
          <p className="st-eyebrow">RESULTS</p>
          <h2 className="st-h2">Where the frontier stands</h2>

          <div className="st-panel">
            <h3 className="st-panel-title">N10 executable yield — top 8 configurations</h3>
            <div className="st-bars">
              {leaderboard.map((r) => (
                <div key={r.rank} className="st-bar-row">
                  <span className="st-bar-label">
                    {r.harness} × {r.model}
                  </span>
                  <div className="st-bar-track">
                    <div className="st-bar-fill" style={{ width: `${(r.n10 / maxN10) * 100}%` }} />
                  </div>
                  <span className="st-bar-value">{r.n10.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="st-chart-duo">
            <div className="st-panel">
              <h3 className="st-panel-title">The long-horizon wall</h3>
              <div className="st-horizon">
                <div className="st-horizon-big">
                  <span className="st-horizon-num">{longHorizon.longest}</span>
                  <span className="st-horizon-cap">operations in the longest executable workflow</span>
                </div>
                <div className="st-horizon-body">
                  <div className="st-ratio">
                    <div
                      className="st-ratio-in"
                      style={{
                        width: `${((longHorizon.totalExecutable - longHorizon.over30Ops) / longHorizon.totalExecutable) * 100}%`,
                      }}
                    />
                    <div
                      className="st-ratio-out"
                      style={{ width: `${(longHorizon.over30Ops / longHorizon.totalExecutable) * 100}%` }}
                    />
                  </div>
                  <div className="st-horizon-legend">
                    <span>
                      <span className="st-dot" style={{ background: '#b9b9f9' }} />
                      {longHorizon.totalExecutable - longHorizon.over30Ops} workflows ≤ 30 operations
                    </span>
                    <span>
                      <span className="st-dot" style={{ background: '#ea2261' }} />
                      {longHorizon.over30Ops} workflows &gt; 30 operations
                    </span>
                  </div>
                  <p className="st-horizon-note">{longHorizon.note}</p>
                </div>
              </div>
            </div>

            <div className="st-panel">
              <h3 className="st-panel-title">Open vs closed weights — mean N10 yield</h3>
              <div className="st-wavg">
                {weightsAvg.map((w, i) => (
                  <div key={w.group} className="st-wavg-col">
                    <span className="st-wavg-val">{w.value.toFixed(1)}%</span>
                    <div className="st-wavg-track">
                      <div
                        className={i === 0 ? 'st-wavg-fill st-wavg-closed' : 'st-wavg-fill st-wavg-open'}
                        style={{ height: `${(w.value / 16) * 100}%` }}
                      />
                    </div>
                    <span className="st-wavg-label">{w.group}</span>
                    <span className="st-wavg-n">{w.n} configurations</span>
                  </div>
                ))}
              </div>
              <p className="st-chart-note">{weightsAvgCaption}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Task domains (cream band) ───────────────────── */}
      <section className="st-section st-section-cream" id="st-tasks">
        <div className="st-container">
          <p className="st-eyebrow">TASK DOMAINS</p>
          <h2 className="st-h2">32 research tasks across four catalysis domains</h2>
          <div className="st-dim-grid">
            {taskDomains.map((t) => (
              <div
                key={t.domain}
                className={t.domain === 'Electrocatalysis' ? 'st-card st-card-cream st-card-accent' : 'st-card st-card-cream'}
              >
                <div className="st-task-top">
                  <span className="st-pill-tag">{t.domain}</span>
                  {t.domain === 'Electrocatalysis' && <span className="st-pill-badge">Closed-loop study</span>}
                </div>
                <p className="st-task-desc">{t.blurb}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Closed-loop adaptation ──────────────────────── */}
      <section className="st-section st-section-soft">
        <div className="st-container">
          <p className="st-eyebrow">CLOSED-LOOP ADAPTATION</p>
          <h2 className="st-h2">Five rounds of feedback</h2>
          <p className="st-section-note">
            Agent: <span className="st-best-inline">{closedLoop.agent}</span> · Task: {closedLoop.task} ·{' '}
            {closedLoop.rounds} feedback rounds
          </p>
          <div className="st-loop-grid">
            <div className="st-card st-loop-col">
              <h3 className="st-loop-title">Localized adaptation observed</h3>
              <ul className="st-loop-list">
                {closedLoop.adapted.map((a) => (
                  <li key={a}>
                    <span className="st-loop-mark st-loop-yes">✓</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
            <div className="st-card st-loop-col">
              <h3 className="st-loop-title">Strategic redirection not observed</h3>
              <ul className="st-loop-list">
                {closedLoop.notObserved.map((a) => (
                  <li key={a}>
                    <span className="st-loop-mark st-loop-no">✗</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Failure modes ───────────────────────────────── */}
      <section className="st-section">
        <div className="st-container">
          <p className="st-eyebrow">FAILURE ANALYSIS</p>
          <h2 className="st-h2">How agents break</h2>
          <div className="st-fail-grid">
            {failureModes.map((f) => (
              <div key={f.name} className="st-card st-fail">
                <span className="st-fail-name">{f.name}</span>
                <p className="st-fail-desc">{f.description}</p>
              </div>
            ))}
          </div>
          <p className="st-fail-note">{failureNote}</p>
        </div>
      </section>

      {/* ── Methodology + BibTeX (dark dashboard band) ──── */}
      <section className="st-dark" id="st-cite">
        <div className="st-container st-dark-grid">
          <div>
            <p className="st-eyebrow st-eyebrow-dark">METHODOLOGY</p>
            <h2 className="st-h2 st-h2-dark">Measured, not vibes</h2>
            <p className="st-method-sub">MULTI-AXIS RUBRIC</p>
            <ul className="st-list st-list-dark">
              {scoringAxes.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
            <div className="st-formulas">
              {formulas.map((f) => (
                <code key={f} className="st-formula">
                  {f}
                </code>
              ))}
            </div>
            <ul className="st-list st-list-dark">
              {methodologyNotes.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          </div>
          <div className="st-code-card">
            <div className="st-code-head">robochem-bench.bib</div>
            <pre className="st-code">{bibtex}</pre>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="st-footer">
        <div className="st-container">
          <p className="st-footer-brand">RoboChem Bench</p>
          <p>Style preview · Stripe DESIGN.md · Content from arXiv:2607.23045</p>
          <p className="st-footer-fine">Built with the Stripe DESIGN.md · Style preview for RoboChem Bench</p>
        </div>
      </footer>
    </div>
  )
}

const CSS = `
.style-stripe {
  background: #ffffff;
  color: #0d253d;
  font-family: 'Inter', 'SF Pro Display', system-ui, -apple-system, sans-serif;
  font-size: 15px;
  font-weight: 300;
  line-height: 1.4;
  font-feature-settings: 'ss01';
  min-height: 100dvh;
}
.style-stripe .st-container { max-width: 1200px; margin: 0 auto; padding: 0 32px; }
.style-stripe .st-narrow { max-width: 760px; }

/* hero + mesh */
.style-stripe .st-hero { position: relative; overflow: hidden; padding-bottom: 96px; }
.style-stripe .st-mesh { position: absolute; inset: 0; height: 460px; overflow: hidden; }
.style-stripe .st-blob { position: absolute; border-radius: 50%; filter: blur(70px); }
.style-stripe .st-blob-1 { width: 560px; height: 320px; background: #f5e9d4; top: -120px; left: -8%; }
.style-stripe .st-blob-2 { width: 480px; height: 300px; background: #ffb88a; top: -80px; left: 22%; opacity: 0.85; }
.style-stripe .st-blob-3 { width: 520px; height: 320px; background: #b9b9f9; top: -100px; left: 46%; }
.style-stripe .st-blob-4 { width: 500px; height: 300px; background: #533afd; top: -60px; right: 4%; opacity: 0.55; }
.style-stripe .st-blob-5 { width: 420px; height: 280px; background: #ea2261; top: 60px; right: -6%; opacity: 0.4; }

/* nav on mesh */
.style-stripe .st-nav { position: relative; z-index: 10; }
.style-stripe .st-nav-inner {
  max-width: 1200px; margin: 16px auto 0; padding: 16px 24px; display: flex; align-items: center; gap: 24px;
  background: rgba(255,255,255,0.85); backdrop-filter: blur(12px); border-radius: 4px;
}
.style-stripe .st-back { font-size: 15px; font-weight: 400; color: #0d253d; text-decoration: none; }
.style-stripe .st-back:hover { color: #533afd; }
.style-stripe .st-wordmark { font-size: 16px; font-weight: 500; letter-spacing: -0.2px; color: #0d253d; margin-left: auto; }
.style-stripe .st-nav-links { display: flex; align-items: center; gap: 20px; }
.style-stripe .st-nav-links a { font-size: 15px; font-weight: 400; color: #273951; text-decoration: none; }
.style-stripe .st-nav-links a:hover { color: #533afd; }

.style-stripe .st-hero-inner { position: relative; z-index: 5; padding-top: 88px; }
.style-stripe .st-eyebrow {
  font-size: 10px; font-weight: 400; letter-spacing: 0.1px; text-transform: uppercase;
  color: #533afd; margin: 0 0 16px;
}
.style-stripe .st-h1 {
  font-size: 56px; font-weight: 300; line-height: 1.03; letter-spacing: -1.4px;
  margin: 0; max-width: 920px; color: #0d253d;
}
.style-stripe .st-sub { font-size: 16px; font-weight: 300; line-height: 1.5; color: #273951; max-width: 680px; margin: 24px 0 0; }
.style-stripe .st-authors { font-size: 13px; font-weight: 400; letter-spacing: -0.39px; color: #64748d; margin: 28px 0 0; max-width: 820px; font-feature-settings: 'tnum'; }
.style-stripe .st-affil { font-size: 11px; font-weight: 300; color: #64748d; margin: 6px 0 0; }
.style-stripe .st-btn-row { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 32px; }
.style-stripe .st-btn {
  display: inline-flex; align-items: center; padding: 8px 16px; border-radius: 9999px;
  font-size: 16px; font-weight: 400; line-height: 1.0; text-decoration: none;
}
.style-stripe .st-btn-primary { background: #533afd; color: #ffffff; }
.style-stripe .st-btn-primary:active { background: #2e2b8c; }
.style-stripe .st-btn-secondary { background: #ffffff; color: #533afd; border: 1px solid #533afd; }
.style-stripe .st-btn-nav { font-size: 14px; }

/* stats */
.style-stripe .st-stats { background: #ffffff; padding: 72px 0 8px; }
.style-stripe .st-stats-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 32px; }
.style-stripe .st-stat { border-top: 1px solid #e3e8ee; padding-top: 20px; }
.style-stripe .st-stat-value {
  font-size: 40px; font-weight: 300; letter-spacing: -0.96px; line-height: 1.1; color: #0d253d;
  font-feature-settings: 'tnum';
}
.style-stripe .st-stat-label { font-size: 14px; font-weight: 400; letter-spacing: -0.42px; color: #0d253d; margin-top: 8px; font-feature-settings: 'tnum'; }
.style-stripe .st-stat-desc { font-size: 13px; font-weight: 400; letter-spacing: -0.39px; color: #64748d; margin-top: 4px; }

/* lab capability secondary band */
.style-stripe .st-labstats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 32px; margin-top: 36px; }
.style-stripe .st-labstat { border-top: 1px solid #e3e8ee; padding-top: 14px; }
.style-stripe .st-labstat-value { font-size: 22px; font-weight: 300; letter-spacing: -0.5px; color: #533afd; font-feature-settings: 'tnum'; display: block; }
.style-stripe .st-labstat-label { font-size: 12px; font-weight: 400; letter-spacing: -0.3px; color: #64748d; display: block; margin-top: 4px; }

/* sections */
.style-stripe .st-section { padding: 80px 0; }
.style-stripe .st-section-soft { background: #f6f9fc; }
.style-stripe .st-section-cream { background: #f5e9d4; }
.style-stripe .st-h2 { font-size: 48px; font-weight: 300; line-height: 1.15; letter-spacing: -0.96px; margin: 0 0 32px; color: #0d253d; }
.style-stripe .st-h2-dark { color: #ffffff; }
.style-stripe .st-eyebrow-dark { color: #b9b9f9; }
.style-stripe .st-section-note { font-size: 14px; color: #64748d; margin: -16px 0 24px; font-feature-settings: 'tnum'; }
.style-stripe .st-best-inline { font-weight: 600; color: #0d253d; }
.style-stripe .st-underline-demo { text-decoration: underline; text-underline-offset: 3px; }
.style-stripe .st-abstract { font-size: 26px; font-weight: 300; line-height: 1.4; letter-spacing: -0.26px; color: #273951; margin: 0; }

/* cards */
.style-stripe .st-dim-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
.style-stripe .st-card {
  background: #ffffff; border: 1px solid #e3e8ee; border-radius: 12px; padding: 32px;
  box-shadow: rgba(0,55,112,0.08) 0 1px 3px;
}
.style-stripe .st-card-cream { background: #ffffff; }
.style-stripe .st-card-accent { border: 2px solid #533afd; }
.style-stripe .st-card-title { font-size: 22px; font-weight: 300; letter-spacing: -0.22px; line-height: 1.1; margin: 0 0 8px; color: #0d253d; }
.style-stripe .st-card-tagline { font-size: 14px; font-weight: 300; color: #64748d; margin: 0 0 16px; }
.style-stripe .st-list { margin: 0; padding: 0; list-style: none; }
.style-stripe .st-list li { font-size: 15px; font-weight: 300; color: #273951; padding: 6px 0 6px 20px; position: relative; }
.style-stripe .st-list li::before { content: ''; position: absolute; left: 0; top: 13px; width: 8px; height: 2px; background: #533afd; }
.style-stripe .st-list-dark li { color: rgba(255,255,255,0.75); }
.style-stripe .st-list-dark li::before { background: #b9b9f9; }

/* pathway */
.style-stripe .st-path { display: flex; align-items: stretch; gap: 12px; flex-wrap: wrap; }
.style-stripe .st-path-stage {
  flex: 1 1 240px; background: #ffffff; border: 1px solid #e3e8ee; border-radius: 12px; padding: 24px;
  box-shadow: rgba(0,55,112,0.08) 0 1px 3px;
}
.style-stripe .st-path-stage-name { font-size: 10px; font-weight: 400; letter-spacing: 0.1px; text-transform: uppercase; margin: 0 0 14px; color: #64748d; }
.style-stripe .st-path-stage-2 .st-path-stage-name { color: #533afd; }
.style-stripe .st-path-flow { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.style-stripe .st-path-node { background: #f6f9fc; border: 1px solid #e3e8ee; border-radius: 8px; padding: 10px 12px; min-width: 96px; }
.style-stripe .st-path-node-id { display: block; font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 12px; color: #533afd; }
.style-stripe .st-path-node-label { display: block; font-size: 13px; font-weight: 300; color: #273951; margin-top: 4px; line-height: 1.35; }
.style-stripe .st-path-node-hl { border: 2px solid #533afd; background: #ffffff; }
.style-stripe .st-path-arrow { color: #a8c3de; font-size: 14px; }
.style-stripe .st-path-arrow-big { color: #533afd; font-size: 20px; align-self: center; }
.style-stripe .st-path-note { font-size: 14px; font-weight: 300; color: #64748d; margin: 24px 0 0; max-width: 880px; }

/* table */
.style-stripe .st-table-wrap { overflow-x: auto; border: 1px solid #e3e8ee; border-radius: 12px; background: #ffffff; box-shadow: rgba(0,55,112,0.08) 0 1px 3px; }
.style-stripe .st-table { width: 100%; border-collapse: collapse; font-size: 14px; min-width: 780px; }
.style-stripe .st-table th {
  text-align: left; font-size: 10px; font-weight: 400; letter-spacing: 0.1px; text-transform: uppercase;
  color: #64748d; padding: 14px 16px; border-bottom: 1px solid #e3e8ee; background: #f6f9fc;
}
.style-stripe .st-table td { padding: 12px 16px; border-bottom: 1px solid #eef2f6; color: #273951; font-weight: 300; }
.style-stripe .st-table tbody tr:last-child td { border-bottom: none; }
.style-stripe .st-rank { color: #64748d; }
.style-stripe .st-model { font-weight: 400; color: #0d253d; }
.style-stripe .st-num { font-feature-settings: 'tnum'; letter-spacing: -0.42px; }
.style-stripe .st-best { font-weight: 600; color: #0d253d; }
.style-stripe .st-second { text-decoration: underline; text-underline-offset: 3px; text-decoration-color: #533afd; }
.style-stripe .st-tag {
  display: inline-block; font-size: 10px; font-weight: 400; letter-spacing: 0.1px; text-transform: uppercase;
  padding: 4px 8px; border-radius: 9999px;
}
.style-stripe .st-tag-open { background: #b9b9f9; color: #4434d4; }
.style-stripe .st-tag-closed { background: #eef2f6; color: #273951; }
.style-stripe .st-table-caption { font-size: 13px; font-weight: 300; color: #64748d; margin: 16px 0 0; font-feature-settings: 'tnum'; }

/* charts */
.style-stripe .st-panel {
  background: #ffffff; border: 1px solid #e3e8ee; border-radius: 12px; padding: 32px;
  box-shadow: rgba(0,55,112,0.08) 0 8px 24px, rgba(0,55,112,0.04) 0 2px 6px;
}
.style-stripe .st-panel-title { font-size: 26px; font-weight: 300; letter-spacing: -0.26px; margin: 0 0 24px; color: #0d253d; }
.style-stripe .st-chart-duo { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 24px; }
.style-stripe .st-bars { display: flex; flex-direction: column; gap: 8px; }
.style-stripe .st-bar-row { display: grid; grid-template-columns: 250px 1fr 60px; align-items: center; gap: 12px; }
.style-stripe .st-bar-label { font-size: 13px; font-weight: 400; color: #273951; text-align: right; }
.style-stripe .st-bar-track { height: 14px; background: #f6f9fc; border-radius: 9999px; overflow: hidden; border: 1px solid #eef2f6; }
.style-stripe .st-bar-fill { height: 100%; background: linear-gradient(90deg, #533afd, #665efd); border-radius: 9999px; }
.style-stripe .st-bar-value { font-size: 13px; font-feature-settings: 'tnum'; letter-spacing: -0.42px; color: #64748d; }
.style-stripe .st-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 8px; }

/* long-horizon wall */
.style-stripe .st-horizon { display: flex; gap: 32px; align-items: flex-start; flex-wrap: wrap; }
.style-stripe .st-horizon-big { flex: 0 0 150px; }
.style-stripe .st-horizon-num { font-size: 92px; font-weight: 300; letter-spacing: -2px; line-height: 1; color: #ea2261; display: block; font-feature-settings: 'tnum'; }
.style-stripe .st-horizon-cap { font-size: 13px; font-weight: 300; color: #64748d; display: block; margin-top: 8px; }
.style-stripe .st-horizon-body { flex: 1 1 300px; }
.style-stripe .st-ratio { display: flex; height: 22px; border-radius: 9999px; overflow: hidden; background: #f6f9fc; border: 1px solid #eef2f6; }
.style-stripe .st-ratio-in { background: #b9b9f9; }
.style-stripe .st-ratio-out { background: #ea2261; min-width: 12px; }
.style-stripe .st-horizon-legend { display: flex; gap: 20px; margin-top: 12px; font-size: 13px; font-weight: 300; color: #273951; flex-wrap: wrap; }
.style-stripe .st-horizon-note { font-size: 14px; font-weight: 300; color: #64748d; margin: 16px 0 0; }

/* open vs closed mean N10 */
.style-stripe .st-wavg { display: flex; gap: 48px; align-items: flex-end; }
.style-stripe .st-wavg-col { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.style-stripe .st-wavg-val { font-size: 30px; font-weight: 300; letter-spacing: -0.6px; color: #0d253d; font-feature-settings: 'tnum'; }
.style-stripe .st-wavg-track { height: 150px; width: 40px; background: #f6f9fc; border-radius: 9999px 9999px 0 0; border: 1px solid #eef2f6; border-bottom: none; display: flex; align-items: flex-end; }
.style-stripe .st-wavg-fill { width: 100%; border-radius: 9999px 9999px 0 0; }
.style-stripe .st-wavg-closed { background: #533afd; }
.style-stripe .st-wavg-open { background: #ea2261; }
.style-stripe .st-wavg-label { font-size: 13px; font-weight: 400; color: #0d253d; }
.style-stripe .st-wavg-n { font-size: 12px; font-weight: 300; color: #64748d; }
.style-stripe .st-chart-note { font-size: 13px; font-weight: 300; color: #64748d; margin: 16px 0 0; }

/* tasks */
.style-stripe .st-task-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; gap: 12px; flex-wrap: wrap; }
.style-stripe .st-pill-tag {
  display: inline-block; background: #b9b9f9; color: #4434d4; font-size: 10px; font-weight: 400;
  letter-spacing: 0.1px; text-transform: uppercase; padding: 4px 8px; border-radius: 9999px;
}
.style-stripe .st-pill-badge {
  display: inline-block; border: 1px solid #533afd; color: #533afd; font-size: 10px; font-weight: 400;
  letter-spacing: 0.1px; text-transform: uppercase; padding: 4px 8px; border-radius: 9999px;
}
.style-stripe .st-task-desc { font-size: 15px; font-weight: 300; color: #273951; margin: 0; }

/* closed loop */
.style-stripe .st-loop-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.style-stripe .st-loop-col { padding: 28px; }
.style-stripe .st-loop-title { font-size: 18px; font-weight: 300; letter-spacing: -0.18px; margin: 0 0 16px; color: #0d253d; }
.style-stripe .st-loop-list { margin: 0; padding: 0; list-style: none; }
.style-stripe .st-loop-list li { font-size: 15px; font-weight: 300; color: #273951; padding: 6px 0 6px 26px; position: relative; }
.style-stripe .st-loop-mark { position: absolute; left: 0; top: 6px; font-weight: 600; }
.style-stripe .st-loop-yes { color: #533afd; }
.style-stripe .st-loop-no { color: #ea2261; }

/* failures */
.style-stripe .st-fail-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 24px; }
.style-stripe .st-fail-name { font-size: 18px; font-weight: 300; color: #0d253d; }
.style-stripe .st-fail-desc { font-size: 14px; font-weight: 300; color: #64748d; margin: 12px 0 0; }
.style-stripe .st-fail-note { font-size: 14px; font-weight: 300; color: #64748d; margin: 32px 0 0; max-width: 880px; border-left: 3px solid #533afd; padding-left: 16px; }

/* dark band */
.style-stripe .st-dark { background: #1c1e54; color: #ffffff; padding: 80px 0; }
.style-stripe .st-dark-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 64px; align-items: start; }
.style-stripe .st-method-sub { font-size: 10px; font-weight: 400; letter-spacing: 0.1px; text-transform: uppercase; color: #b9b9f9; margin: 28px 0 10px; }
.style-stripe .st-formulas { display: flex; flex-direction: column; gap: 8px; margin: 20px 0 28px; }
.style-stripe .st-formula {
  font-family: 'JetBrains Mono', ui-monospace, monospace; font-size: 13px; font-weight: 300; color: #ffffff;
  background: #0d253d; border-radius: 8px; padding: 10px 14px; display: block;
}
.style-stripe .st-code-card { background: #0d253d; border-radius: 16px; overflow: hidden; box-shadow: rgba(0,55,112,0.08) 0 8px 24px; }
.style-stripe .st-code-head {
  padding: 12px 16px; font-size: 12px; color: rgba(255,255,255,0.5);
  font-family: 'JetBrains Mono', monospace; border-bottom: 1px solid rgba(255,255,255,0.1);
}
.style-stripe .st-code {
  margin: 0; padding: 24px; font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 13px; font-weight: 300; line-height: 1.6; color: #ffffff; overflow-x: auto; white-space: pre;
}

/* footer */
.style-stripe .st-footer { background: #ffffff; color: #64748d; padding: 64px 0; font-size: 13px; letter-spacing: -0.39px; border-top: 1px solid #e3e8ee; }
.style-stripe .st-footer-brand { font-size: 16px; font-weight: 500; color: #0d253d; margin: 0 0 12px; }
.style-stripe .st-footer p { margin: 4px 0; }
.style-stripe .st-footer-fine { color: #a8c3de; font-size: 11px; }

@media (max-width: 960px) {
  .style-stripe .st-stats-grid { grid-template-columns: repeat(3, 1fr); }
  .style-stripe .st-labstats { grid-template-columns: repeat(2, 1fr); }
  .style-stripe .st-dim-grid, .style-stripe .st-chart-duo, .style-stripe .st-fail-grid, .style-stripe .st-dark-grid, .style-stripe .st-loop-grid { grid-template-columns: 1fr; }
  .style-stripe .st-h1 { font-size: 36px; letter-spacing: -0.9px; }
  .style-stripe .st-h2 { font-size: 32px; }
  .style-stripe .st-nav-links a:not(.st-btn) { display: none; }
  .style-stripe .st-section { padding: 56px 0; }
}
@media (max-width: 560px) {
  .style-stripe .st-stats-grid { grid-template-columns: repeat(2, 1fr); }
  .style-stripe .st-bar-row { grid-template-columns: 124px 1fr 52px; }
  .style-stripe .st-bar-label { font-size: 11px; }
}
`
