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

const stageColors = ['#3f8500', '#76b900', '#bff230']

const css = `
.style-nvidia{font-family:'Inter',Arial,Helvetica,sans-serif;background:#000;color:#fff;min-height:100dvh;-webkit-font-smoothing:antialiased}
.style-nvidia a{text-decoration:none;color:inherit}
.nv-container{max-width:1280px;margin:0 auto;padding:0 24px}
/* utility bar + nav */
.nv-util{background:#000;border-bottom:1px solid #1a1a1a}
.nv-util-inner{height:32px;display:flex;align-items:center;justify-content:flex-end;gap:20px;font-size:12px;color:rgba(255,255,255,.7)}
.nv-nav{background:#000;border-bottom:1px solid #1a1a1a;position:sticky;top:0;z-index:50}
.nv-nav-inner{height:64px;display:flex;align-items:center;gap:24px}
.nv-brand{display:flex;align-items:center;gap:10px;font-size:16px;font-weight:700;color:#fff;letter-spacing:.5px;text-transform:uppercase}
.nv-eye{width:26px;height:18px;border:2px solid #76b900;border-radius:2px;position:relative}
.nv-eye:after{content:"";position:absolute;left:5px;top:3px;width:8px;height:8px;background:#76b900}
.nv-nav-spacer{flex:1}
.nv-back{font-size:14px;font-weight:700;color:#fff;transition:color .15s}
.nv-back:hover{color:#76b900}
.nv-btn{display:inline-flex;align-items:center;justify-content:center;padding:11px 24px;min-height:44px;border-radius:2px;font-size:16px;font-weight:700;line-height:1.25;border:1px solid transparent;cursor:pointer;transition:background .15s,color .15s}
.nv-btn-primary{background:#76b900;color:#000}
.nv-btn-primary:hover{background:#5a8d00}
.nv-btn-outline-dark{background:transparent;color:#fff;border-color:#fff}
.nv-btn-outline-dark:hover{border-color:#76b900;color:#76b900}
.nv-btn-sm{min-height:36px;padding:8px 16px;font-size:14.4px}
/* hero */
.nv-hero{position:relative;background:#000;padding:80px 0 72px;overflow:hidden;border-bottom:1px solid #1a1a1a}
.nv-hero-glow{position:absolute;right:-160px;top:-160px;width:560px;height:560px;pointer-events:none;background:radial-gradient(circle,rgba(118,185,0,.16),transparent 65%)}
.nv-eyebrow{font-size:14px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#76b900;margin-bottom:16px}
.nv-title{font-size:48px;font-weight:700;line-height:1.25;color:#fff;margin:0;max-width:880px}
.nv-subtitle{margin-top:20px;font-size:22px;font-weight:400;line-height:1.5;color:rgba(255,255,255,.7);max-width:760px}
.nv-authors{margin-top:20px;font-size:14px;line-height:1.6;color:#757575;max-width:760px}
.nv-authors b{color:#a7a7a7;font-weight:700}
.nv-cta-row{display:flex;flex-wrap:wrap;gap:12px;margin-top:32px}
/* sections */
.nv-section{padding:64px 0;border-bottom:1px solid #1a1a1a}
.nv-section-head{margin-bottom:32px;position:relative;padding-left:24px}
.nv-section-head:before{content:"";position:absolute;left:0;top:2px;width:12px;height:12px;background:#76b900}
.nv-h2{font-size:36px;font-weight:700;line-height:1.25;color:#fff;margin:0}
.nv-h2-sub{margin-top:8px;font-size:16px;color:#757575;max-width:680px}
/* stats */
.nv-stats{display:grid;grid-template-columns:repeat(6,1fr);gap:16px}
.nv-stat{position:relative;background:#0d0d0d;border:1px solid #2a2a2a;border-radius:2px;padding:24px}
.nv-stat:before{content:"";position:absolute;left:-1px;top:-1px;width:12px;height:12px;background:#76b900}
.nv-stat-value{font-size:36px;font-weight:700;color:#76b900;line-height:1.1;font-variant-numeric:tabular-nums}
.nv-stat-label{margin-top:8px;font-size:14px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.4px}
.nv-stat-desc{margin-top:4px;font-size:12px;line-height:1.4;color:#757575}
.nv-labstats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:16px}
.nv-labstat{background:#0d0d0d;border:1px solid #2a2a2a;border-radius:2px;padding:16px 20px}
.nv-labstat-value{font-size:22px;font-weight:700;color:#fff;line-height:1.1;font-variant-numeric:tabular-nums}
.nv-labstat-label{margin-top:6px;font-size:12px;font-weight:700;color:#a7a7a7;text-transform:uppercase;letter-spacing:.4px}
.nv-labstat-desc{margin-top:2px;font-size:11px;line-height:1.4;color:#757575}
/* abstract */
.nv-abstract{display:grid;grid-template-columns:1fr 2fr;gap:32px;align-items:start}
.nv-abstract-tag{font-size:14px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#76b900}
.nv-abstract p{margin:0;font-size:22px;line-height:1.6;color:#e6e6e6}
/* dims */
.nv-dims{display:grid;grid-template-columns:repeat(4,1fr);gap:24px}
.nv-dim{position:relative;background:#0d0d0d;border:1px solid #2a2a2a;border-radius:2px;padding:32px 24px}
.nv-dim:before{content:"";position:absolute;right:-1px;bottom:-1px;width:12px;height:12px;background:#76b900}
.nv-dim-idx{font-size:12px;font-weight:700;color:#76b900;letter-spacing:1px;text-transform:uppercase}
.nv-dim-name{margin-top:10px;font-size:20px;font-weight:700;color:#fff;line-height:1.25}
.nv-dim-tag{margin-top:4px;font-size:12px;color:#757575}
.nv-dim-list{margin:16px 0 0;padding:0;list-style:none}
.nv-dim-list li{position:relative;padding-left:16px;font-size:15px;line-height:1.6;color:#a7a7a7;margin-top:8px}
.nv-dim-list li:before{content:"";position:absolute;left:0;top:9px;width:8px;height:8px;background:#76b900}
/* pathway */
.nv-path{display:flex;align-items:stretch;gap:16px;flex-wrap:wrap}
.nv-path-stage{flex:1;min-width:240px;position:relative;background:#0d0d0d;border:1px solid #2a2a2a;border-radius:2px;padding:24px}
.nv-path-stage:before{content:"";position:absolute;left:-1px;top:-1px;width:12px;height:12px;background:var(--sc)}
.nv-path-stage-name{font-size:12px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:var(--sc);margin-bottom:6px}
.nv-path-node{background:#141414;border:1px solid #2a2a2a;border-left:4px solid var(--sc);border-radius:2px;padding:10px 12px;margin-top:10px}
.nv-path-node-id{font-family:ui-monospace,Menlo,monospace;font-size:11px;font-weight:700;color:var(--sc);letter-spacing:.6px}
.nv-path-node-label{margin-top:2px;font-size:13px;line-height:1.45;color:#e6e6e6}
.nv-path-node.nv-final{border-color:#76b900;border-left-color:#76b900;background:rgba(118,185,0,.1);box-shadow:0 0 0 1px #76b900}
.nv-path-arrow{display:flex;align-items:center;font-size:20px;font-weight:700;color:#3a3a3a}
.nv-path-note{margin-top:16px;font-size:13px;line-height:1.6;color:#757575;max-width:860px}
/* leaderboard */
.nv-panel{background:#0d0d0d;border:1px solid #2a2a2a;border-radius:2px;overflow:hidden;position:relative}
.nv-panel:before{content:"";position:absolute;left:-1px;top:-1px;width:12px;height:12px;background:#76b900;z-index:2}
.nv-panel-head{display:flex;align-items:center;gap:12px;padding:16px 24px 16px 32px;border-bottom:1px solid #2a2a2a}
.nv-panel-title{font-size:16px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.4px}
.nv-panel-note{margin-left:auto;font-size:12px;color:#757575}
.nv-tablewrap{overflow-x:auto}
.nv-table{width:100%;border-collapse:collapse;min-width:860px}
.nv-table th{padding:12px 16px;text-align:left;font-size:11px;font-weight:700;color:#757575;text-transform:uppercase;letter-spacing:.6px;border-bottom:1px solid #2a2a2a;white-space:nowrap}
.nv-table th.nv-num,.nv-table td.nv-num{text-align:right;font-variant-numeric:tabular-nums}
.nv-table td{padding:11px 16px;font-size:15px;color:#e6e6e6;border-bottom:1px solid #1f1f1f;white-space:nowrap}
.nv-table tbody tr:hover{background:#141414}
.nv-table tbody tr:last-child td{border-bottom:none}
.nv-rank{color:#757575;font-variant-numeric:tabular-nums}
.nv-model{color:#fff;font-weight:700}
.nv-org{color:#a7a7a7}
.nv-badge{display:inline-block;padding:4px 10px;border-radius:2px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.6px}
.nv-badge-open{background:#76b900;color:#000}
.nv-badge-closed{background:#1a1a1a;color:#a7a7a7;border:1px solid #2a2a2a}
.nv-cell-best{color:#76b900;font-weight:700}
.nv-cell-second{color:#fff;text-decoration:underline;text-underline-offset:3px;text-decoration-color:#76b900}
.nv-caption{padding:14px 24px 18px 32px;font-size:12px;line-height:1.5;color:#757575;border-top:1px solid #2a2a2a}
/* charts */
.nv-bars{padding:8px 24px 24px 32px}
.nv-bar-row{display:flex;align-items:center;gap:16px;padding:5px 0}
.nv-bar-label{width:220px;text-align:right;font-size:14px;color:#a7a7a7;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.nv-bar-track{flex:1;height:16px;background:#1a1a1a;overflow:hidden}
.nv-bar-fill{height:100%;background:#76b900}
.nv-bar-fill.nv-closed{background:#3a3a3a}
.nv-bar-value{width:48px;font-size:14px;font-weight:700;color:#fff;font-variant-numeric:tabular-nums}
.nv-legend{display:flex;flex-wrap:wrap;gap:16px;padding:0 24px 20px 32px;font-size:12px;color:#a7a7a7}
.nv-legend-item{display:flex;align-items:center;gap:6px}
.nv-legend-dot{width:10px;height:10px}
.nv-chart-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px}
/* long-horizon wall */
.nv-wall{padding:20px 24px 24px 32px;display:flex;flex-direction:column;gap:16px}
.nv-wall-nums{display:flex;align-items:baseline;gap:24px;flex-wrap:wrap}
.nv-wall-big{font-size:56px;font-weight:700;line-height:1;color:#76b900;font-variant-numeric:tabular-nums}
.nv-wall-big-sub{font-size:13px;color:#a7a7a7;max-width:220px;line-height:1.5}
.nv-wall-grid{display:flex;flex-wrap:wrap;gap:3px}
.nv-wall-cell{width:9px;height:9px;background:#2a2a2a}
.nv-wall-cell.nv-over{background:#76b900}
.nv-wall-note{font-size:13px;line-height:1.6;color:#757575;margin:0}
.nv-wall-legend{display:flex;gap:16px;font-size:12px;color:#a7a7a7}
/* weights avg */
.nv-grouped{padding:16px 24px 24px;display:flex;align-items:flex-end;gap:32px}
.nv-g-group{flex:1;display:flex;flex-direction:column;align-items:center;gap:10px}
.nv-g-bars{display:flex;align-items:flex-end;gap:10px;height:170px;width:100%;justify-content:center}
.nv-g-bar{width:64px;position:relative}
.nv-g-val{position:absolute;top:-18px;left:50%;transform:translateX(-50%);font-size:11px;font-weight:700;color:#a7a7a7;font-variant-numeric:tabular-nums;white-space:nowrap}
.nv-g-label{font-size:12px;font-weight:700;color:#a7a7a7;text-transform:uppercase;letter-spacing:.6px;text-align:center}
/* tasks */
.nv-tasks{display:grid;grid-template-columns:repeat(4,1fr);gap:24px}
.nv-task{position:relative;background:#0d0d0d;border:1px solid #2a2a2a;border-radius:2px;padding:24px;display:flex;flex-direction:column;gap:12px}
.nv-task:before{content:"";position:absolute;left:-1px;top:-1px;width:12px;height:12px;background:#76b900}
.nv-task-top{display:flex;align-items:center;justify-content:space-between;gap:8px}
.nv-task-desc{font-size:15px;line-height:1.6;color:#e6e6e6;flex:1;margin:0}
.nv-task-flag{font-size:12px;font-weight:700;color:#76b900;border-top:1px solid #2a2a2a;padding-top:12px;text-transform:uppercase;letter-spacing:.6px}
/* closed loop */
.nv-loop-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px}
.nv-loop-list{margin:0;padding:8px 24px 24px 32px;list-style:none}
.nv-loop-list li{position:relative;padding:12px 0 12px 20px;font-size:15px;line-height:1.6;color:#e6e6e6;border-bottom:1px solid #1f1f1f}
.nv-loop-list li:last-child{border-bottom:none}
.nv-loop-list li:before{position:absolute;left:0;top:12px;font-size:13px;font-weight:700}
.nv-loop-list.nv-yes li:before{content:"✓";color:#76b900}
.nv-loop-list.nv-no li:before{content:"✗";color:#a7a7a7}
/* failure */
.nv-fail-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:24px}
.nv-fail-card{position:relative;background:#0d0d0d;border:1px solid #2a2a2a;border-radius:2px;padding:24px}
.nv-fail-card:before{content:"";position:absolute;left:-1px;top:-1px;width:12px;height:12px;background:#76b900}
.nv-fail-name{font-size:16px;font-weight:700;color:#fff;text-transform:uppercase;letter-spacing:.4px}
.nv-fail-desc{font-size:13px;line-height:1.6;color:#a7a7a7;margin-top:8px}
.nv-fail-note{margin-top:24px;background:#0d0d0d;border:1px solid #2a2a2a;border-left:4px solid #76b900;border-radius:2px;padding:16px 20px;font-size:13px;line-height:1.6;color:#a7a7a7}
/* method */
.nv-method-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px}
.nv-method-list{margin:0;padding:8px 24px 24px 32px;list-style:none}
.nv-method-list li{position:relative;padding:12px 0 12px 20px;font-size:15px;line-height:1.6;color:#e6e6e6;border-bottom:1px solid #1f1f1f}
.nv-method-list li:last-child{border-bottom:none}
.nv-method-list li:before{content:"";position:absolute;left:0;top:20px;width:8px;height:8px;background:#76b900}
.nv-axes{display:flex;flex-wrap:wrap;gap:8px;padding:16px 24px 24px 32px}
.nv-axis{padding:6px 12px;background:#141414;border:1px solid #2a2a2a;font-size:13px;font-weight:700;color:#e6e6e6;font-family:ui-monospace,Menlo,monospace}
.nv-code{margin:0;padding:20px 24px 24px 32px;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:13px;line-height:1.7;color:#bff230;overflow-x:auto;white-space:pre;background:#000}
/* footer */
.nv-footer{background:#000;padding:56px 0 48px}
.nv-footer-inner{display:flex;flex-wrap:wrap;align-items:center;gap:16px;font-size:14px;color:rgba(255,255,255,.7);border-top:1px solid #1a1a1a;padding-top:32px}
.nv-footer a{color:#fff;font-weight:700}
.nv-footer a:hover{color:#76b900}
@media (max-width:1024px){
  .nv-stats{grid-template-columns:repeat(3,1fr)}
  .nv-labstats{grid-template-columns:repeat(2,1fr)}
  .nv-dims{grid-template-columns:repeat(2,1fr)}
  .nv-tasks{grid-template-columns:repeat(2,1fr)}
  .nv-chart-grid{grid-template-columns:1fr}
  .nv-method-grid{grid-template-columns:1fr}
  .nv-loop-grid{grid-template-columns:1fr}
  .nv-abstract{grid-template-columns:1fr;gap:12px}
  .nv-path{flex-direction:column}
  .nv-path-arrow{justify-content:center;transform:rotate(90deg)}
}
@media (max-width:640px){
  .nv-title{font-size:32px}
  .nv-subtitle{font-size:18px}
  .nv-stats{grid-template-columns:repeat(2,1fr)}
  .nv-labstats{grid-template-columns:1fr}
  .nv-dims{grid-template-columns:1fr}
  .nv-tasks{grid-template-columns:1fr}
  .nv-fail-grid{grid-template-columns:1fr}
  .nv-bar-label{width:120px}
  .nv-section{padding:40px 0}
  .nv-hero{padding:56px 0}
}
`

export default function Nvidia() {
  const maxN10 = bestN10
  const gMax = Math.max(...weightsAvg.map((r) => r.value))
  return (
    <div className="style-nvidia">
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" />
      <style>{css}</style>

      {/* Utility bar */}
      <div className="nv-util">
        <div className="nv-container nv-util-inner">
          <span>Benchmark Preview</span>
          <span>EN</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="nv-nav">
        <div className="nv-container nv-nav-inner">
          <span className="nv-brand">
            <span className="nv-eye" />
            RoboChem Bench
          </span>
          <span className="nv-nav-spacer" />
          <Link to="/" className="nv-back">
            ← Back to Gallery
          </Link>
          <a href="#submit" className="nv-btn nv-btn-primary nv-btn-sm">
            Submit Your Agent
          </a>
        </div>
      </nav>

      {/* Hero */}
      <header className="nv-hero">
        <div className="nv-hero-glow" aria-hidden />
        <div className="nv-container" style={{ position: 'relative' }}>
          <p className="nv-eyebrow">Benchmark · Robotic Chemistry</p>
          <h1 className="nv-title">{paperMeta.title}</h1>
          <p className="nv-subtitle">{paperMeta.subtitle}</p>
          <p className="nv-authors">
            <b>{paperMeta.authors.join(', ')}</b>
            <br />
            {paperMeta.affiliation}
          </p>
          <div className="nv-cta-row">
            {paperMeta.links.map((l, i) => (
              <a
                key={l.label}
                href={l.href}
                className={`nv-btn ${i === 0 ? 'nv-btn-primary' : 'nv-btn-outline-dark'}`}
                id={i === 3 ? 'submit' : undefined}
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </header>

      {/* Stats */}
      <section className="nv-section">
        <div className="nv-container">
          <div className="nv-stats">
            {keyStats.map((s) => (
              <div className="nv-stat" key={s.label}>
                <div className="nv-stat-value">{s.value}</div>
                <div className="nv-stat-label">{s.label}</div>
                <div className="nv-stat-desc">{s.description}</div>
              </div>
            ))}
          </div>
          <div className="nv-labstats">
            {labStats.map((s) => (
              <div className="nv-labstat" key={s.label}>
                <div className="nv-labstat-value">{s.value}</div>
                <div className="nv-labstat-label">{s.label}</div>
                <div className="nv-labstat-desc">{s.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Abstract */}
      <section className="nv-section">
        <div className="nv-container nv-abstract">
          <span className="nv-abstract-tag">Abstract</span>
          <p>{abstractText}</p>
        </div>
      </section>

      {/* Skills Library */}
      <section className="nv-section">
        <div className="nv-container">
          <div className="nv-section-head">
            <h2 className="nv-h2">The Skills Library</h2>
            <p className="nv-h2-sub">45 modular workstations, exposed to agents as machine-readable skills in four categories.</p>
          </div>
          <div className="nv-dims">
            {skillCategories.map((d, i) => (
              <div className="nv-dim" key={d.name}>
                <div className="nv-dim-idx">Category 0{i + 1}</div>
                <div className="nv-dim-name">{d.name}</div>
                <div className="nv-dim-tag">{d.tagline}</div>
                <ul className="nv-dim-list">
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
      <section className="nv-section">
        <div className="nv-container">
          <div className="nv-section-head">
            <h2 className="nv-h2">The Evaluation Pathway</h2>
            <p className="nv-h2-sub">Key nodes of the ten-endpoint N1→N10 pathway. N10 is the ultimate metric.</p>
          </div>
          <div className="nv-path">
            {pathwayStages.map((stage, si) => (
              <Fragment key={stage}>
                {si > 0 && (
                  <span className="nv-path-arrow" aria-hidden>
                    →
                  </span>
                )}
                <div className="nv-path-stage" style={{ ['--sc' as string]: stageColors[si] }}>
                  <div className="nv-path-stage-name">{stage}</div>
                  {pathway
                    .filter((n) => n.stage === stage)
                    .map((n) => (
                      <div className={`nv-path-node ${n.node === 'N10' ? 'nv-final' : ''}`} key={n.node}>
                        <div className="nv-path-node-id">{n.node}</div>
                        <div className="nv-path-node-label">{n.label}</div>
                      </div>
                    ))}
                </div>
              </Fragment>
            ))}
          </div>
          <p className="nv-path-note">{pathwayNote}</p>
        </div>
      </section>

      {/* Leaderboard */}
      <section className="nv-section">
        <div className="nv-container">
          <div className="nv-section-head">
            <h2 className="nv-h2">Leaderboard</h2>
            <p className="nv-h2-sub">N10 executable yield. Best in green bold, second underlined.</p>
          </div>
          <div className="nv-panel">
            <div className="nv-panel-head">
              <span className="nv-panel-title">Overall standings</span>
              <span className="nv-panel-note">Top 8 of 48 configurations</span>
            </div>
            <div className="nv-tablewrap">
              <table className="nv-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Configuration</th>
                    <th>Organization</th>
                    <th>Weights</th>
                    <th className="nv-num">Trials</th>
                    <th className="nv-num">Executable</th>
                    <th className="nv-num">N10 Yield</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((r) => (
                    <tr key={r.rank}>
                      <td className="nv-rank">{r.rank}</td>
                      <td className="nv-model">
                        {r.harness} × {r.model}
                      </td>
                      <td className="nv-org">{r.org}</td>
                      <td>
                        <span className={`nv-badge ${r.weights === 'open' ? 'nv-badge-open' : 'nv-badge-closed'}`}>
                          {r.weights === 'open' ? 'Open' : 'Closed'}
                        </span>
                      </td>
                      <td className="nv-num">{r.trials}</td>
                      <td className="nv-num">{r.executable}</td>
                      <td
                        className={`nv-num ${r.n10 === bestN10 ? 'nv-cell-best' : r.n10 === secondN10 ? 'nv-cell-second' : ''}`}
                      >
                        {r.n10.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="nv-caption">{leaderboardCaption}</div>
          </div>
        </div>
      </section>

      {/* Charts */}
      <section className="nv-section">
        <div className="nv-container">
          <div className="nv-section-head">
            <h2 className="nv-h2">Results at a Glance</h2>
            <p className="nv-h2-sub">Green marks open-weight configurations and NVIDIA-brand highlights.</p>
          </div>

          <div className="nv-panel" style={{ marginBottom: 24 }}>
            <div className="nv-panel-head">
              <span className="nv-panel-title">N10 executable yield — top 8 configurations</span>
              <span className="nv-panel-note">Expert-adjudicated (%)</span>
            </div>
            <div className="nv-bars">
              {leaderboard.map((r) => (
                <div className="nv-bar-row" key={r.rank}>
                  <span className="nv-bar-label" title={`${r.harness} × ${r.model}`}>
                    {r.harness} × {r.model}
                  </span>
                  <div className="nv-bar-track">
                    <div
                      className={`nv-bar-fill ${r.weights === 'open' ? '' : 'nv-closed'}`}
                      style={{ width: `${(r.n10 / maxN10) * 100}%` }}
                    />
                  </div>
                  <span className="nv-bar-value">{r.n10.toFixed(1)}</span>
                </div>
              ))}
            </div>
            <div className="nv-legend">
              <span className="nv-legend-item">
                <span className="nv-legend-dot" style={{ background: '#76b900' }} /> Open
              </span>
              <span className="nv-legend-item">
                <span className="nv-legend-dot" style={{ background: '#3a3a3a' }} /> Closed
              </span>
            </div>
          </div>

          <div className="nv-chart-grid">
            <div className="nv-panel">
              <div className="nv-panel-head">
                <span className="nv-panel-title">The long-horizon wall</span>
                <span className="nv-panel-note">{longHorizon.totalExecutable} executable workflows</span>
              </div>
              <div className="nv-wall">
                <div className="nv-wall-nums">
                  <span className="nv-wall-big">{longHorizon.longest}</span>
                  <span className="nv-wall-big-sub">operations in the longest executable workflow — only {longHorizon.over30Ops} of {longHorizon.totalExecutable} exceeded 30</span>
                </div>
                <div className="nv-wall-grid" role="img" aria-label="148 of 151 executable workflows have at most 30 operations; 3 exceed 30">
                  {Array.from({ length: longHorizon.totalExecutable }, (_, i) => (
                    <span key={i} className={`nv-wall-cell ${i < longHorizon.over30Ops ? 'nv-over' : ''}`} />
                  ))}
                </div>
                <div className="nv-wall-legend">
                  <span className="nv-legend-item">
                    <span className="nv-legend-dot" style={{ background: '#76b900' }} /> &gt;30 operations ({longHorizon.over30Ops})
                  </span>
                  <span className="nv-legend-item">
                    <span className="nv-legend-dot" style={{ background: '#2a2a2a' }} /> ≤30 operations ({longHorizon.totalExecutable - longHorizon.over30Ops})
                  </span>
                </div>
                <p className="nv-wall-note">{longHorizon.note}</p>
              </div>
            </div>

            <div className="nv-panel">
              <div className="nv-panel-head">
                <span className="nv-panel-title">Open vs Closed weights — mean N10</span>
              </div>
              <div className="nv-grouped">
                {weightsAvg.map((row) => (
                  <div className="nv-g-group" key={row.group}>
                    <div className="nv-g-bars">
                      <div
                        className="nv-g-bar"
                        style={{
                          height: `${(row.value / gMax) * 100}%`,
                          background: row.group.startsWith('Open') ? '#76b900' : '#ffffff',
                        }}
                      >
                        <span className="nv-g-val">{row.value.toFixed(1)}%</span>
                      </div>
                    </div>
                    <span className="nv-g-label">
                      {row.group} · n={row.n}
                    </span>
                  </div>
                ))}
              </div>
              <div className="nv-legend">
                <span className="nv-legend-item">
                  <span className="nv-legend-dot" style={{ background: '#76b900' }} /> Open avg
                </span>
                <span className="nv-legend-item">
                  <span className="nv-legend-dot" style={{ background: '#ffffff' }} /> Closed avg
                </span>
              </div>
              <div className="nv-caption" style={{ borderTop: 'none' }}>{weightsAvgCaption}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Task domains */}
      <section className="nv-section">
        <div className="nv-container">
          <div className="nv-section-head">
            <h2 className="nv-h2">Task Domains</h2>
            <p className="nv-h2-sub">The 32-task research suite spans four catalysis domains.</p>
          </div>
          <div className="nv-tasks">
            {taskDomains.map((t) => (
              <div className="nv-task" key={t.domain}>
                <div className="nv-task-top">
                  <span className="nv-badge nv-badge-open">{t.domain}</span>
                </div>
                <p className="nv-task-desc">{t.blurb}</p>
                {t.domain === 'Electrocatalysis' && <div className="nv-task-flag">↻ Closed-loop study domain</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closed-loop adaptation */}
      <section className="nv-section">
        <div className="nv-container">
          <div className="nv-section-head">
            <h2 className="nv-h2">Closed-Loop Adaptation</h2>
            <p className="nv-h2-sub">
              {closedLoop.agent} · {closedLoop.task} · {closedLoop.rounds} feedback rounds
            </p>
          </div>
          <div className="nv-loop-grid">
            <div className="nv-panel">
              <div className="nv-panel-head">
                <span className="nv-panel-title">Localized adaptation observed</span>
              </div>
              <ul className="nv-loop-list nv-yes">
                {closedLoop.adapted.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
            <div className="nv-panel">
              <div className="nv-panel-head">
                <span className="nv-panel-title">Strategic redirection not observed</span>
              </div>
              <ul className="nv-loop-list nv-no">
                {closedLoop.notObserved.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Failure modes */}
      <section className="nv-section">
        <div className="nv-container">
          <div className="nv-section-head">
            <h2 className="nv-h2">Failure Mode Analysis</h2>
            <p className="nv-h2-sub">Four recurring failure categories, identified by node-level adjudication.</p>
          </div>
          <div className="nv-fail-grid">
            {failureModes.map((f) => (
              <div className="nv-fail-card" key={f.name}>
                <div className="nv-fail-name">{f.name}</div>
                <div className="nv-fail-desc">{f.description}</div>
              </div>
            ))}
          </div>
          <div className="nv-fail-note">{failureNote}</div>
        </div>
      </section>

      {/* Methodology + BibTeX */}
      <section className="nv-section">
        <div className="nv-container">
          <div className="nv-section-head">
            <h2 className="nv-h2">Methodology & Citation</h2>
          </div>
          <div className="nv-method-grid">
            <div className="nv-panel">
              <div className="nv-panel-head">
                <span className="nv-panel-title">Scoring rubric — R1–R6</span>
              </div>
              <div className="nv-axes">
                {scoringAxes.map((a) => (
                  <span className="nv-axis" key={a}>
                    {a}
                  </span>
                ))}
              </div>
              <div className="nv-panel-head" style={{ borderTop: '1px solid #2a2a2a' }}>
                <span className="nv-panel-title">Formulas</span>
              </div>
              <pre className="nv-code">{formulas.join('\n')}</pre>
            </div>
            <div className="nv-panel">
              <div className="nv-panel-head">
                <span className="nv-panel-title">Methodology notes</span>
              </div>
              <ul className="nv-method-list">
                {methodologyNotes.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>
            <div className="nv-panel" style={{ gridColumn: '1 / -1' }}>
              <div className="nv-panel-head">
                <span className="nv-panel-title">citation.bib</span>
                <span className="nv-panel-note">BibTeX</span>
              </div>
              <pre className="nv-code">{bibtex}</pre>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="nv-footer">
        <div className="nv-container nv-footer-inner">
          <span className="nv-brand">
            <span className="nv-eye" />
            RoboChem Bench
          </span>
          <span>Style preview · NVIDIA DESIGN.md · Content from arXiv:2607.23045</span>
          <span style={{ flex: 1 }} />
          <Link to="/">← Back to Gallery</Link>
        </div>
      </footer>
    </div>
  )
}
