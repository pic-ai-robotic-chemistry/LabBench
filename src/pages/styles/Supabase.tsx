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
} from '../../data/benchmark'

const n10Sorted = leaderboard.map((r) => r.n10).sort((a, b) => b - a)
const bestN10 = n10Sorted[0]
const secondN10 = n10Sorted[1]

const stageColors = ['#3ecf8e', '#644fc1', '#ffdb13']

const css = `
.style-supabase{font-family:'Inter','Helvetica Neue',Helvetica,Arial,sans-serif;background:#171717;color:#ededed;min-height:100dvh;-webkit-font-smoothing:antialiased}
.style-supabase a{text-decoration:none;color:inherit}
.style-supabase code,.style-supabase pre{font-family:ui-monospace,Menlo,Monaco,Consolas,'Liberation Mono',monospace}
.sb-container{max-width:1280px;margin:0 auto;padding:0 24px}
/* nav */
.sb-nav{position:sticky;top:0;z-index:50;background:rgba(23,23,23,.85);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid #2a2a2a}
.sb-nav-inner{height:64px;display:flex;align-items:center;gap:20px}
.sb-brand{display:flex;align-items:center;gap:10px;font-size:16px;font-weight:500;color:#fff;letter-spacing:-0.2px}
.sb-mark{width:22px;height:22px;border-radius:6px;background:linear-gradient(135deg,#3ecf8e,#24b47e);display:inline-flex;align-items:center;justify-content:center;color:#171717;font-weight:700;font-size:13px}
.sb-nav-spacer{flex:1}
.sb-back{font-size:14px;color:#9a9a9a;transition:color .15s}
.sb-back:hover{color:#fff}
.sb-btn{display:inline-flex;align-items:center;gap:8px;padding:8px 16px;border-radius:6px;font-size:14px;font-weight:500;line-height:1.4;border:1px solid transparent;cursor:pointer;transition:background .15s,border-color .15s}
.sb-btn-primary{background:#3ecf8e;color:#171717}
.sb-btn-primary:hover{background:#24b47e}
.sb-btn-outline{background:transparent;color:#ededed;border-color:#3a3a3a}
.sb-btn-outline:hover{border-color:#5a5a5a}
/* hero */
.sb-hero{padding:96px 0 64px;position:relative}
.sb-hero-grid{display:grid;grid-template-columns:1.05fr .95fr;gap:48px;align-items:center}
.sb-eyebrow{display:inline-flex;align-items:center;gap:8px;font-size:12px;font-weight:500;color:#3ecf8e;letter-spacing:.6px;text-transform:uppercase;margin-bottom:20px}
.sb-eyebrow:before{content:"";width:8px;height:8px;border-radius:50%;background:#3ecf8e}
.sb-title{font-size:48px;font-weight:500;line-height:1.1;letter-spacing:-1.44px;color:#fff;margin:0}
.sb-subtitle{margin-top:20px;font-size:18px;line-height:1.55;color:#9a9a9a}
.sb-authors{margin-top:16px;font-size:13px;line-height:1.6;color:#707070}
.sb-authors b{color:#b2b2b2;font-weight:500}
.sb-cta-row{display:flex;flex-wrap:wrap;gap:12px;margin-top:32px}
/* terminal mockup */
.sb-term{background:#1c1c1c;border:1px solid #2e2e2e;border-radius:12px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,.35)}
.sb-term-head{display:flex;align-items:center;gap:8px;padding:12px 16px;border-bottom:1px solid #2e2e2e;background:#202020}
.sb-term-dot{width:11px;height:11px;border-radius:50%;background:#3a3a3a}
.sb-term-title{margin-left:8px;font-size:12px;color:#707070}
.sb-term-body{padding:18px 20px;font-size:13px;line-height:1.8;color:#c9c9c9;overflow-x:auto}
.sb-t-k{color:#3ecf8e}
.sb-t-s{color:#ffdb13}
.sb-t-c{color:#707070}
.sb-t-f{color:#8ab8ff}
/* sections */
.sb-section{padding:56px 0}
.sb-section-head{margin-bottom:32px}
.sb-h2{font-size:36px;font-weight:500;line-height:1.15;letter-spacing:-0.72px;color:#fff;margin:0}
.sb-h2-sub{margin-top:8px;font-size:16px;color:#707070;max-width:640px}
/* stats */
.sb-stats{display:grid;grid-template-columns:repeat(6,1fr);border:1px solid #2e2e2e;border-radius:12px;overflow:hidden;background:#1c1c1c}
.sb-stat{padding:24px;border-right:1px solid #2e2e2e}
.sb-stat:last-child{border-right:none}
.sb-stat-value{font-size:32px;font-weight:500;letter-spacing:-0.72px;color:#3ecf8e;font-variant-numeric:tabular-nums}
.sb-stat-label{margin-top:6px;font-size:13px;font-weight:500;color:#ededed}
.sb-stat-desc{margin-top:4px;font-size:12px;line-height:1.45;color:#707070}
.sb-labstats{display:grid;grid-template-columns:repeat(4,1fr);border:1px solid #2e2e2e;border-radius:12px;overflow:hidden;background:#1c1c1c;margin-top:16px}
.sb-labstat{padding:16px 20px;border-right:1px solid #2e2e2e}
.sb-labstat:last-child{border-right:none}
.sb-labstat-value{font-size:20px;font-weight:500;letter-spacing:-0.4px;color:#8ab8ff;font-variant-numeric:tabular-nums}
.sb-labstat-label{margin-top:4px;font-size:12px;font-weight:500;color:#ededed}
.sb-labstat-desc{margin-top:2px;font-size:11px;line-height:1.4;color:#707070}
/* abstract */
.sb-abstract{max-width:860px}
.sb-abstract p{margin:0;font-size:18px;line-height:1.6;color:#c9c9c9}
.sb-abstract .sb-hl{color:#3ecf8e}
/* dims */
.sb-dims{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.sb-dim{background:#1c1c1c;border:1px solid #2e2e2e;border-radius:12px;padding:28px;transition:border-color .15s}
.sb-dim:hover{border-color:#3ecf8e55}
.sb-dim-idx{font-size:12px;font-weight:500;color:#3ecf8e;letter-spacing:1px;font-family:ui-monospace,Menlo,monospace}
.sb-dim-name{margin-top:10px;font-size:18px;font-weight:500;color:#fff}
.sb-dim-tag{margin-top:4px;font-size:12px;color:#707070}
.sb-dim-list{margin:16px 0 0;padding:0;list-style:none}
.sb-dim-list li{position:relative;padding-left:16px;font-size:14px;line-height:1.5;color:#9a9a9a;margin-top:10px}
.sb-dim-list li:before{content:"";position:absolute;left:0;top:8px;width:6px;height:6px;border-radius:50%;background:#3ecf8e}
/* pathway */
.sb-path{display:flex;align-items:stretch;gap:14px;flex-wrap:wrap}
.sb-path-stage{flex:1;min-width:240px;background:#1c1c1c;border:1px solid #2e2e2e;border-radius:12px;padding:20px}
.sb-path-stage-name{font-size:11px;font-weight:500;letter-spacing:1px;text-transform:uppercase;color:var(--sc);font-family:ui-monospace,Menlo,monospace;margin-bottom:6px}
.sb-path-node{background:#202020;border:1px solid #2e2e2e;border-left:3px solid var(--sc);border-radius:8px;padding:10px 12px;margin-top:10px}
.sb-path-node-id{font-family:ui-monospace,Menlo,monospace;font-size:11px;color:var(--sc);letter-spacing:.4px}
.sb-path-node-label{margin-top:2px;font-size:13px;line-height:1.45;color:#c9c9c9}
.sb-path-node.sb-final{border-color:#ffdb13;border-left-color:#ffdb13;background:rgba(255,219,19,.07);box-shadow:0 0 0 1px rgba(255,219,19,.3)}
.sb-path-arrow{display:flex;align-items:center;font-size:18px;color:#3a3a3a}
.sb-path-note{margin-top:16px;font-size:13px;line-height:1.6;color:#707070;max-width:860px}
/* leaderboard */
.sb-panel{background:#1c1c1c;border:1px solid #2e2e2e;border-radius:12px;overflow:hidden}
.sb-panel-head{display:flex;align-items:center;gap:12px;padding:16px 24px;border-bottom:1px solid #2e2e2e}
.sb-panel-title{font-size:14px;font-weight:500;color:#fff}
.sb-panel-note{margin-left:auto;font-size:12px;color:#707070;font-family:ui-monospace,Menlo,monospace}
.sb-tablewrap{overflow-x:auto}
.sb-table{width:100%;border-collapse:collapse;min-width:860px}
.sb-table th{padding:12px 16px;text-align:left;font-size:12px;font-weight:500;color:#707070;border-bottom:1px solid #2e2e2e;white-space:nowrap;text-transform:uppercase;letter-spacing:.6px}
.sb-table th.sb-num,.sb-table td.sb-num{text-align:right;font-variant-numeric:tabular-nums}
.sb-table td{padding:11px 16px;font-size:14px;color:#c9c9c9;border-bottom:1px solid #262626;white-space:nowrap}
.sb-table tbody tr:hover{background:#202020}
.sb-table tbody tr:last-child td{border-bottom:none}
.sb-rank{color:#707070;font-variant-numeric:tabular-nums}
.sb-model{color:#fff;font-weight:500}
.sb-org{color:#9a9a9a}
.sb-badge{display:inline-block;padding:2px 8px;border-radius:9999px;font-size:12px;font-weight:400}
.sb-badge-open{background:rgba(62,207,142,.14);color:#3ecf8e}
.sb-badge-closed{background:#2a2a2a;color:#9a9a9a}
.sb-cell-best{color:#3ecf8e;font-weight:600}
.sb-cell-second{color:#ededed;text-decoration:underline;text-underline-offset:3px;text-decoration-color:#3ecf8e88}
.sb-caption{padding:14px 24px 18px;font-size:12px;line-height:1.5;color:#707070;border-top:1px solid #2e2e2e;font-family:ui-monospace,Menlo,monospace}
/* charts */
.sb-bars{padding:8px 24px 24px}
.sb-bar-row{display:flex;align-items:center;gap:16px;padding:5px 0}
.sb-bar-label{width:220px;text-align:right;font-size:13px;color:#9a9a9a;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sb-bar-track{flex:1;height:16px;background:#242424;border-radius:6px;overflow:hidden}
.sb-bar-fill{height:100%;border-radius:6px;background:#3ecf8e}
.sb-bar-fill.sb-muted{background:#3a3a3a}
.sb-bar-value{width:48px;font-size:13px;color:#c9c9c9;font-variant-numeric:tabular-nums}
.sb-legend{display:flex;flex-wrap:wrap;gap:16px;padding:0 24px 20px;font-size:12px;color:#9a9a9a}
.sb-legend-item{display:flex;align-items:center;gap:6px}
.sb-legend-dot{width:10px;height:10px;border-radius:3px}
.sb-chart-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
/* long-horizon wall */
.sb-wall{padding:20px 24px 24px;display:flex;flex-direction:column;gap:16px}
.sb-wall-nums{display:flex;align-items:baseline;gap:24px;flex-wrap:wrap}
.sb-wall-big{font-size:52px;font-weight:500;letter-spacing:-1.5px;line-height:1;color:#ffdb13;font-variant-numeric:tabular-nums}
.sb-wall-big-sub{font-size:13px;color:#9a9a9a;max-width:220px;line-height:1.5}
.sb-wall-grid{display:flex;flex-wrap:wrap;gap:3px}
.sb-wall-cell{width:9px;height:9px;border-radius:2px;background:#2a2a2a}
.sb-wall-cell.sb-over{background:#ffdb13}
.sb-wall-note{font-size:13px;line-height:1.6;color:#707070;margin:0}
.sb-wall-legend{display:flex;gap:16px;font-size:12px;color:#9a9a9a}
/* weights avg */
.sb-grouped{padding:16px 24px 24px;display:flex;align-items:flex-end;gap:32px}
.sb-g-group{flex:1;display:flex;flex-direction:column;align-items:center;gap:10px}
.sb-g-bars{display:flex;align-items:flex-end;gap:10px;height:170px;width:100%;justify-content:center}
.sb-g-bar{width:64px;border-radius:6px 6px 0 0;position:relative}
.sb-g-val{position:absolute;top:-18px;left:50%;transform:translateX(-50%);font-size:11px;color:#9a9a9a;font-variant-numeric:tabular-nums;white-space:nowrap}
.sb-g-label{font-size:12px;color:#9a9a9a;text-align:center}
/* tasks */
.sb-tasks{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}
.sb-task{background:#1c1c1c;border:1px solid #2e2e2e;border-radius:12px;padding:24px;display:flex;flex-direction:column;gap:12px}
.sb-task-top{display:flex;align-items:center;justify-content:space-between;gap:8px}
.sb-pill{display:inline-block;padding:2px 8px;border-radius:9999px;font-size:12px;background:rgba(62,207,142,.14);color:#3ecf8e}
.sb-task-desc{font-size:14px;line-height:1.55;color:#c9c9c9;flex:1;margin:0}
.sb-task-flag{font-size:12px;color:#3ecf8e;border-top:1px solid #262626;padding-top:12px;font-family:ui-monospace,Menlo,monospace}
/* closed loop */
.sb-loop-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.sb-loop-list{margin:0;padding:8px 24px 24px;list-style:none}
.sb-loop-list li{position:relative;padding:12px 0 12px 20px;font-size:14px;line-height:1.55;color:#c9c9c9;border-bottom:1px solid #262626}
.sb-loop-list li:last-child{border-bottom:none}
.sb-loop-list li:before{position:absolute;left:0;top:12px;font-size:13px}
.sb-loop-list.sb-yes li:before{content:"✓";color:#3ecf8e}
.sb-loop-list.sb-no li:before{content:"✗";color:#ff6161}
/* failure */
.sb-fail-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}
.sb-fail-card{background:#1c1c1c;border:1px solid #2e2e2e;border-radius:12px;padding:24px;border-top:2px solid #3ecf8e}
.sb-fail-name{font-size:16px;font-weight:500;color:#fff}
.sb-fail-desc{font-size:13px;line-height:1.6;color:#9a9a9a;margin-top:8px}
.sb-fail-note{margin-top:16px;background:#1c1c1c;border:1px solid #2e2e2e;border-left:3px solid #ffdb13;border-radius:12px;padding:16px 20px;font-size:13px;line-height:1.6;color:#9a9a9a}
/* method */
.sb-method-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.sb-method-list{margin:0;padding:8px 24px 24px;list-style:none}
.sb-method-list li{position:relative;padding:12px 0 12px 20px;font-size:14px;line-height:1.55;color:#c9c9c9;border-bottom:1px solid #262626}
.sb-method-list li:last-child{border-bottom:none}
.sb-method-list li:before{content:"→";position:absolute;left:0;top:12px;font-size:13px;color:#3ecf8e}
.sb-axes{display:flex;flex-wrap:wrap;gap:8px;padding:16px 24px 24px}
.sb-axis{padding:6px 12px;border-radius:6px;background:#202020;border:1px solid #2e2e2e;font-size:13px;color:#c9c9c9;font-family:ui-monospace,Menlo,monospace}
.sb-code{margin:0;padding:20px 24px;font-size:13px;line-height:1.7;color:#c9c9c9;overflow-x:auto;white-space:pre;background:#171717}
/* footer */
.sb-footer{border-top:1px solid #2a2a2a;margin-top:32px;padding:40px 0 56px}
.sb-footer-inner{display:flex;flex-wrap:wrap;align-items:center;gap:16px;font-size:13px;color:#707070}
.sb-footer a{color:#9a9a9a}
.sb-footer a:hover{color:#fff}
@media (max-width:1024px){
  .sb-hero-grid{grid-template-columns:1fr}
  .sb-stats{grid-template-columns:repeat(3,1fr)}
  .sb-stat{border-bottom:1px solid #2e2e2e}
  .sb-labstats{grid-template-columns:repeat(2,1fr)}
  .sb-labstat{border-bottom:1px solid #2e2e2e}
  .sb-dims{grid-template-columns:repeat(2,1fr)}
  .sb-chart-grid{grid-template-columns:1fr}
  .sb-method-grid{grid-template-columns:1fr}
  .sb-loop-grid{grid-template-columns:1fr}
  .sb-path{flex-direction:column}
  .sb-path-arrow{justify-content:center;transform:rotate(90deg)}
}
@media (max-width:640px){
  .sb-title{font-size:34px;letter-spacing:-0.8px}
  .sb-stats{grid-template-columns:repeat(2,1fr)}
  .sb-labstats{grid-template-columns:1fr}
  .sb-dims{grid-template-columns:1fr}
  .sb-tasks{grid-template-columns:1fr}
  .sb-fail-grid{grid-template-columns:1fr}
  .sb-bar-label{width:120px}
  .sb-section{padding:40px 0}
}
`

export default function Supabase() {
  const maxN10 = bestN10
  const gMax = Math.max(...weightsAvg.map((r) => r.value))
  const top3 = leaderboard.slice(0, 3)
  return (
    <div className="style-supabase">
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" />
      <style>{css}</style>

      {/* Nav */}
      <nav className="sb-nav">
        <div className="sb-container sb-nav-inner">
          <span className="sb-brand">
            <span className="sb-mark">⌁</span>
            RoboChem Bench
          </span>
          <span className="sb-nav-spacer" />
          <Link to="/" className="sb-back">
            ← Back to Gallery
          </Link>
          <a href="#submit" className="sb-btn sb-btn-primary">
            Submit Your Agent
          </a>
        </div>
      </nav>

      {/* Hero */}
      <header className="sb-hero">
        <div className="sb-container sb-hero-grid">
          <div>
            <p className="sb-eyebrow">Open benchmark · 2026</p>
            <h1 className="sb-title">{paperMeta.title}</h1>
            <p className="sb-subtitle">{paperMeta.subtitle}</p>
            <p className="sb-authors">
              <b>{paperMeta.authors.join(', ')}</b>
              <br />
              {paperMeta.affiliation}
            </p>
            <div className="sb-cta-row">
              {paperMeta.links.map((l, i) => (
                <a
                  key={l.label}
                  href={l.href}
                  className={`sb-btn ${i === 0 ? 'sb-btn-primary' : 'sb-btn-outline'}`}
                  id={i === 3 ? 'submit' : undefined}
                >
                  {l.label}
                </a>
              ))}
            </div>
          </div>
          <div className="sb-term" aria-hidden>
            <div className="sb-term-head">
              <span className="sb-term-dot" />
              <span className="sb-term-dot" />
              <span className="sb-term-dot" />
              <span className="sb-term-title">robochem — sql</span>
            </div>
            <div className="sb-term-body">
              <span className="sb-t-c">-- top configurations by N10 executable yield</span>
              <br />
              <span className="sb-t-k">select</span> harness, model, n10
              <br />
              <span className="sb-t-k">from</span> leaderboard
              <br />
              <span className="sb-t-k">where</span> trials = <span className="sb-t-s">96</span>
              <br />
              <span className="sb-t-k">order by</span> n10 <span className="sb-t-k">desc</span>
              <br />
              <span className="sb-t-k">limit</span> <span className="sb-t-s">3</span>;
              <br />
              <br />
              <span className="sb-t-c">-- results</span>
              <br />
              {top3.map((r, i) => (
                <Fragment key={r.rank}>
                  {i > 0 && <br />}
                  {r.harness} × {r.model} <span className="sb-t-c">│</span> {r.org} <span className="sb-t-c">│</span>{' '}
                  <span className="sb-t-f">{r.n10.toFixed(1)}%</span>
                </Fragment>
              ))}
            </div>
          </div>
        </div>
      </header>

      {/* Stats */}
      <section className="sb-section" style={{ paddingTop: 0 }}>
        <div className="sb-container">
          <div className="sb-stats">
            {keyStats.map((s) => (
              <div className="sb-stat" key={s.label}>
                <div className="sb-stat-value">{s.value}</div>
                <div className="sb-stat-label">{s.label}</div>
                <div className="sb-stat-desc">{s.description}</div>
              </div>
            ))}
          </div>
          <div className="sb-labstats">
            {labStats.map((s) => (
              <div className="sb-labstat" key={s.label}>
                <div className="sb-labstat-value">{s.value}</div>
                <div className="sb-labstat-label">{s.label}</div>
                <div className="sb-labstat-desc">{s.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Abstract */}
      <section className="sb-section">
        <div className="sb-container">
          <div className="sb-section-head">
            <h2 className="sb-h2">Abstract</h2>
          </div>
          <div className="sb-abstract">
            <p>{abstractText}</p>
          </div>
        </div>
      </section>

      {/* Skills Library */}
      <section className="sb-section">
        <div className="sb-container">
          <div className="sb-section-head">
            <h2 className="sb-h2">The Skills Library</h2>
            <p className="sb-h2-sub">45 modular workstations, each exposed to agents as a machine-readable skill.</p>
          </div>
          <div className="sb-dims">
            {skillCategories.map((d, i) => (
              <div className="sb-dim" key={d.name}>
                <div className="sb-dim-idx">0{i + 1}</div>
                <div className="sb-dim-name">{d.name}</div>
                <div className="sb-dim-tag">{d.tagline}</div>
                <ul className="sb-dim-list">
                  {d.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Evaluation pathway */}
      <section className="sb-section">
        <div className="sb-container">
          <div className="sb-section-head">
            <h2 className="sb-h2">The Evaluation Pathway</h2>
            <p className="sb-h2-sub">Key nodes of the ten-endpoint N1→N10 pathway, from task receipt to physical execution.</p>
          </div>
          <div className="sb-path">
            {pathwayStages.map((stage, si) => (
              <Fragment key={stage}>
                {si > 0 && (
                  <span className="sb-path-arrow" aria-hidden>
                    →
                  </span>
                )}
                <div className="sb-path-stage" style={{ ['--sc' as string]: stageColors[si] }}>
                  <div className="sb-path-stage-name">{stage}</div>
                  {pathway
                    .filter((n) => n.stage === stage)
                    .map((n) => (
                      <div className={`sb-path-node ${n.node === 'N10' ? 'sb-final' : ''}`} key={n.node}>
                        <div className="sb-path-node-id">{n.node}</div>
                        <div className="sb-path-node-label">{n.label}</div>
                      </div>
                    ))}
                </div>
              </Fragment>
            ))}
          </div>
          <p className="sb-path-note">{pathwayNote}</p>
        </div>
      </section>

      {/* Leaderboard */}
      <section className="sb-section">
        <div className="sb-container">
          <div className="sb-section-head">
            <h2 className="sb-h2">Leaderboard</h2>
            <p className="sb-h2-sub">N10 executable yield (%). Best in green bold, second underlined.</p>
          </div>
          <div className="sb-panel">
            <div className="sb-panel-head">
              <span className="sb-panel-title">public.leaderboard</span>
              <span className="sb-panel-note">top 8 of 48 configurations</span>
            </div>
            <div className="sb-tablewrap">
              <table className="sb-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Configuration</th>
                    <th>Organization</th>
                    <th>Weights</th>
                    <th className="sb-num">Trials</th>
                    <th className="sb-num">Executable</th>
                    <th className="sb-num">N10 Yield</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((r) => (
                    <tr key={r.rank}>
                      <td className="sb-rank">{r.rank}</td>
                      <td className="sb-model">
                        {r.harness} × {r.model}
                      </td>
                      <td className="sb-org">{r.org}</td>
                      <td>
                        <span className={`sb-badge ${r.weights === 'open' ? 'sb-badge-open' : 'sb-badge-closed'}`}>
                          {r.weights === 'open' ? 'Open' : 'Closed'}
                        </span>
                      </td>
                      <td className="sb-num">{r.trials}</td>
                      <td className="sb-num">{r.executable}</td>
                      <td
                        className={`sb-num ${r.n10 === bestN10 ? 'sb-cell-best' : r.n10 === secondN10 ? 'sb-cell-second' : ''}`}
                      >
                        {r.n10.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="sb-caption">{leaderboardCaption}</div>
          </div>
        </div>
      </section>

      {/* Charts */}
      <section className="sb-section">
        <div className="sb-container">
          <div className="sb-section-head">
            <h2 className="sb-h2">Results at a Glance</h2>
            <p className="sb-h2-sub">Emerald bars mark open-weight configurations.</p>
          </div>

          <div className="sb-panel" style={{ marginBottom: 16 }}>
            <div className="sb-panel-head">
              <span className="sb-panel-title">N10 executable yield — top 8 configurations</span>
              <span className="sb-panel-note">expert-adjudicated (%)</span>
            </div>
            <div className="sb-bars">
              {leaderboard.map((r) => (
                <div className="sb-bar-row" key={r.rank}>
                  <span className="sb-bar-label" title={`${r.harness} × ${r.model}`}>
                    {r.harness} × {r.model}
                  </span>
                  <div className="sb-bar-track">
                    <div
                      className={`sb-bar-fill ${r.weights === 'open' ? '' : 'sb-muted'}`}
                      style={{ width: `${(r.n10 / maxN10) * 100}%` }}
                    />
                  </div>
                  <span className="sb-bar-value">{r.n10.toFixed(1)}</span>
                </div>
              ))}
            </div>
            <div className="sb-legend">
              <span className="sb-legend-item">
                <span className="sb-legend-dot" style={{ background: '#3ecf8e' }} /> Open
              </span>
              <span className="sb-legend-item">
                <span className="sb-legend-dot" style={{ background: '#3a3a3a' }} /> Closed
              </span>
            </div>
          </div>

          <div className="sb-chart-grid">
            <div className="sb-panel">
              <div className="sb-panel-head">
                <span className="sb-panel-title">The long-horizon wall</span>
                <span className="sb-panel-note">{longHorizon.totalExecutable} executable workflows</span>
              </div>
              <div className="sb-wall">
                <div className="sb-wall-nums">
                  <span className="sb-wall-big">{longHorizon.longest}</span>
                  <span className="sb-wall-big-sub">operations in the longest executable workflow — only {longHorizon.over30Ops} of {longHorizon.totalExecutable} exceeded 30</span>
                </div>
                <div className="sb-wall-grid" role="img" aria-label="148 of 151 executable workflows have at most 30 operations; 3 exceed 30">
                  {Array.from({ length: longHorizon.totalExecutable }, (_, i) => (
                    <span key={i} className={`sb-wall-cell ${i < longHorizon.over30Ops ? 'sb-over' : ''}`} />
                  ))}
                </div>
                <div className="sb-wall-legend">
                  <span className="sb-legend-item">
                    <span className="sb-legend-dot" style={{ background: '#ffdb13' }} /> &gt;30 operations ({longHorizon.over30Ops})
                  </span>
                  <span className="sb-legend-item">
                    <span className="sb-legend-dot" style={{ background: '#2a2a2a' }} /> ≤30 operations ({longHorizon.totalExecutable - longHorizon.over30Ops})
                  </span>
                </div>
                <p className="sb-wall-note">{longHorizon.note}</p>
              </div>
            </div>

            <div className="sb-panel">
              <div className="sb-panel-head">
                <span className="sb-panel-title">Open vs Closed weights — mean N10</span>
              </div>
              <div className="sb-grouped">
                {weightsAvg.map((row) => (
                  <div className="sb-g-group" key={row.group}>
                    <div className="sb-g-bars">
                      <div
                        className="sb-g-bar"
                        style={{
                          height: `${(row.value / gMax) * 100}%`,
                          background: row.group.startsWith('Open') ? '#3ecf8e' : '#644fc1',
                        }}
                      >
                        <span className="sb-g-val">{row.value.toFixed(1)}%</span>
                      </div>
                    </div>
                    <span className="sb-g-label">
                      {row.group} · n={row.n}
                    </span>
                  </div>
                ))}
              </div>
              <div className="sb-legend">
                <span className="sb-legend-item">
                  <span className="sb-legend-dot" style={{ background: '#3ecf8e' }} /> Open avg
                </span>
                <span className="sb-legend-item">
                  <span className="sb-legend-dot" style={{ background: '#644fc1' }} /> Closed avg
                </span>
              </div>
              <div className="sb-caption" style={{ borderTop: 'none' }}>{weightsAvgCaption}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Task domains */}
      <section className="sb-section">
        <div className="sb-container">
          <div className="sb-section-head">
            <h2 className="sb-h2">Task Domains</h2>
            <p className="sb-h2-sub">The 32-task research suite spans four catalysis domains.</p>
          </div>
          <div className="sb-tasks">
            {taskDomains.map((t) => (
              <div className="sb-task" key={t.domain}>
                <div className="sb-task-top">
                  <span className="sb-pill">{t.domain}</span>
                </div>
                <p className="sb-task-desc">{t.blurb}</p>
                {t.domain === 'Electrocatalysis' && <div className="sb-task-flag">↻ closed_loop = true</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closed-loop adaptation */}
      <section className="sb-section">
        <div className="sb-container">
          <div className="sb-section-head">
            <h2 className="sb-h2">Closed-Loop Adaptation</h2>
            <p className="sb-h2-sub">
              {closedLoop.agent} · {closedLoop.task} · {closedLoop.rounds} feedback rounds
            </p>
          </div>
          <div className="sb-loop-grid">
            <div className="sb-panel">
              <div className="sb-panel-head">
                <span className="sb-panel-title">Localized adaptation observed</span>
              </div>
              <ul className="sb-loop-list sb-yes">
                {closedLoop.adapted.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
            <div className="sb-panel">
              <div className="sb-panel-head">
                <span className="sb-panel-title">Strategic redirection not observed</span>
              </div>
              <ul className="sb-loop-list sb-no">
                {closedLoop.notObserved.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Failure modes */}
      <section className="sb-section">
        <div className="sb-container">
          <div className="sb-section-head">
            <h2 className="sb-h2">Failure Mode Analysis</h2>
            <p className="sb-h2-sub">Four recurring failure categories, identified by node-level adjudication.</p>
          </div>
          <div className="sb-fail-grid">
            {failureModes.map((f) => (
              <div className="sb-fail-card" key={f.name}>
                <div className="sb-fail-name">{f.name}</div>
                <div className="sb-fail-desc">{f.description}</div>
              </div>
            ))}
          </div>
          <div className="sb-fail-note">{failureNote}</div>
        </div>
      </section>

      {/* Methodology + BibTeX */}
      <section className="sb-section">
        <div className="sb-container">
          <div className="sb-section-head">
            <h2 className="sb-h2">Methodology & Citation</h2>
          </div>
          <div className="sb-method-grid">
            <div className="sb-panel">
              <div className="sb-panel-head">
                <span className="sb-panel-title">Scoring rubric — multi-axis R1–R6</span>
              </div>
              <div className="sb-axes">
                {scoringAxes.map((a) => (
                  <span className="sb-axis" key={a}>
                    {a}
                  </span>
                ))}
              </div>
              <div className="sb-panel-head" style={{ borderTop: '1px solid #2e2e2e' }}>
                <span className="sb-panel-title">Formulas</span>
              </div>
              <pre className="sb-code">{formulas.join('\n')}</pre>
            </div>
            <div className="sb-panel">
              <div className="sb-panel-head">
                <span className="sb-panel-title">Methodology notes</span>
              </div>
              <ul className="sb-method-list">
                {methodologyNotes.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>
            <div className="sb-panel" style={{ gridColumn: '1 / -1' }}>
              <div className="sb-panel-head">
                <span className="sb-panel-title">citation.bib</span>
                <span className="sb-panel-note">bibtex</span>
              </div>
              <pre className="sb-code">{bibtex}</pre>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="sb-footer">
        <div className="sb-container sb-footer-inner">
          <span className="sb-brand">
            <span className="sb-mark">⌁</span>
            RoboChem Bench
          </span>
          <span>Style preview · Supabase DESIGN.md · Content from arXiv:2607.23045</span>
          <span style={{ flex: 1 }} />
          <Link to="/">← Back to Gallery</Link>
        </div>
      </footer>
    </div>
  )
}
