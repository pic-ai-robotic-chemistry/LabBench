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

const dimAccent = ['#57c1ff', '#59d499', '#ffc533', '#ff6161']
const stageColors = ['#57c1ff', '#ffc533', '#ff6161']

const css = `
.style-raycast{font-family:'Inter',system-ui,-apple-system,sans-serif;font-feature-settings:"calt","kern","liga","ss03";background:#07080a;color:#cdcdcd;min-height:100dvh;-webkit-font-smoothing:antialiased;text-rendering:optimizeLegibility}
.style-raycast a{text-decoration:none;color:inherit}
.rc-container{max-width:1240px;margin:0 auto;padding:0 24px}
/* nav */
.rc-nav{position:sticky;top:0;z-index:50;background:rgba(7,8,10,.82);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-bottom:1px solid #242728}
.rc-nav-inner{height:56px;display:flex;align-items:center;gap:16px}
.rc-brand{display:flex;align-items:center;gap:10px;font-size:14px;font-weight:500;color:#fff;letter-spacing:.2px}
.rc-logo{width:20px;height:20px;border-radius:6px;background:linear-gradient(135deg,#ff5757,#a1131a);display:flex;align-items:center;justify-content:center;font-size:11px;color:#fff;font-weight:600}
.rc-nav-spacer{flex:1}
.rc-back{font-size:14px;font-weight:500;color:#9c9c9d;transition:color .15s}
.rc-back:hover{color:#fff}
.rc-keycap{display:inline-flex;align-items:center;height:20px;padding:1px 6px;border-radius:4px;background:linear-gradient(180deg,#121212,#0d0d0d);border:1px solid #242728;font-size:12px;color:#9c9c9d}
.rc-btn{display:inline-flex;align-items:center;gap:8px;height:36px;padding:8px 16px;border-radius:8px;font-size:14px;font-weight:500;letter-spacing:.2px;border:1px solid transparent;cursor:pointer;transition:background .15s,border-color .15s}
.rc-btn-primary{background:#fff;color:#000}
.rc-btn-primary:hover{background:#e8e8e8}
.rc-btn-tertiary{background:#101111;color:#fff;border-color:#242728}
.rc-btn-tertiary:hover{border-color:rgba(255,255,255,.16)}
.rc-btn-sm{height:32px;padding:6px 14px}
/* hero */
.rc-hero{position:relative;padding:120px 0 72px;overflow:hidden}
.rc-stripes{position:absolute;top:-30px;left:0;right:0;height:260px;pointer-events:none;overflow:hidden;-webkit-mask-image:linear-gradient(180deg,#000,transparent);mask-image:linear-gradient(180deg,#000,transparent)}
.rc-stripe{position:absolute;left:-15%;width:130%;height:26px;border-radius:999px;background:linear-gradient(90deg,#ff5757,#a1131a);transform:rotate(-7deg);filter:blur(1px)}
.rc-eyebrow{font-size:12px;font-weight:500;letter-spacing:1.6px;text-transform:uppercase;color:#6a6b6c;margin-bottom:20px}
.rc-title{font-size:56px;font-weight:600;line-height:1.1;letter-spacing:0;color:#f4f4f6;max-width:840px;margin:0}
.rc-title .rc-dim{color:#9c9c9d}
.rc-subtitle{margin-top:24px;font-size:18px;line-height:1.6;color:#9c9c9d;max-width:680px}
.rc-authors{margin-top:20px;font-size:13px;line-height:1.6;color:#6a6b6c;max-width:760px}
.rc-authors b{color:#9c9c9d;font-weight:500}
.rc-cta-row{display:flex;flex-wrap:wrap;gap:12px;margin-top:36px}
/* sections */
.rc-section{padding:48px 0}
.rc-section-head{margin-bottom:32px}
.rc-h2{font-size:24px;font-weight:500;line-height:1.4;letter-spacing:.2px;color:#f4f4f6;margin:0}
.rc-h2-sub{margin-top:6px;font-size:14px;color:#6a6b6c}
/* stats */
.rc-stats{display:grid;grid-template-columns:repeat(6,1fr);gap:16px}
.rc-stat{background:#0d0d0d;border:1px solid #242728;border-radius:10px;padding:24px}
.rc-stat-value{font-size:30px;font-weight:600;color:#f4f4f6;line-height:1.1;font-variant-numeric:tabular-nums}
.rc-stat-label{margin-top:8px;font-size:13px;font-weight:500;color:#cdcdcd;letter-spacing:.1px}
.rc-stat-desc{margin-top:4px;font-size:12px;line-height:1.5;color:#6a6b6c}
.rc-labstats{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-top:16px}
.rc-labstat{background:#0d0d0d;border:1px solid #242728;border-radius:10px;padding:16px 20px}
.rc-labstat-value{font-size:20px;font-weight:600;color:#57c1ff;line-height:1.1;font-variant-numeric:tabular-nums}
.rc-labstat-label{margin-top:6px;font-size:12px;font-weight:500;color:#cdcdcd;letter-spacing:.1px}
.rc-labstat-desc{margin-top:2px;font-size:11px;line-height:1.4;color:#6a6b6c}
/* abstract */
.rc-abstract{background:#0d0d0d;border:1px solid #242728;border-radius:10px;padding:32px;position:relative}
.rc-abstract:before{content:"";position:absolute;left:0;top:32px;bottom:32px;width:3px;border-radius:2px;background:linear-gradient(180deg,#ff5757,#a1131a)}
.rc-abstract p{margin:0;font-size:18px;line-height:1.7;color:#d3d3d4;max-width:900px}
.rc-abstract-tag{display:inline-block;margin-bottom:16px;padding:2px 8px;border-radius:4px;background:rgba(87,193,255,.15);color:#57c1ff;font-size:12px;letter-spacing:.4px}
/* dimension cards */
.rc-dims{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.rc-dim-card{background:#0d0d0d;border:1px solid #242728;border-radius:10px;padding:24px;transition:border-color .15s}
.rc-dim-card:hover{border-color:rgba(255,255,255,.16)}
.rc-dim-icon{width:32px;height:32px;border-radius:8px;background:#121212;border:1px solid #242728;display:flex;align-items:center;justify-content:center;margin-bottom:16px}
.rc-dim-dot{width:10px;height:10px;border-radius:3px}
.rc-dim-name{font-size:18px;font-weight:500;color:#fff;letter-spacing:.2px}
.rc-dim-tag{margin-top:4px;font-size:12px;color:#6a6b6c;line-height:1.5}
.rc-dim-list{margin:16px 0 0;padding:0;list-style:none}
.rc-dim-list li{position:relative;padding-left:18px;font-size:14px;line-height:1.6;color:#9c9c9d;margin-top:8px}
.rc-dim-list li:before{content:"✓";position:absolute;left:0;top:0;font-size:12px;color:#434345}
/* pathway */
.rc-path{display:flex;align-items:stretch;gap:14px;flex-wrap:wrap}
.rc-path-stage{flex:1;min-width:240px;background:#0d0d0d;border:1px solid #242728;border-radius:10px;padding:18px}
.rc-path-stage-name{font-size:11px;font-weight:500;letter-spacing:1.2px;text-transform:uppercase;color:var(--sc);margin-bottom:6px}
.rc-path-node{background:#101111;border:1px solid #242728;border-left:3px solid var(--sc);border-radius:8px;padding:10px 12px;margin-top:10px}
.rc-path-node-id{font-family:'JetBrains Mono',ui-monospace,monospace;font-size:11px;color:var(--sc);letter-spacing:.4px}
.rc-path-node-label{margin-top:2px;font-size:13px;line-height:1.4;color:#cdcdcd}
.rc-path-node.rc-final{border-color:#ff6161;border-left-color:#ff6161;background:rgba(255,97,97,.08);box-shadow:0 0 0 1px rgba(255,97,97,.28)}
.rc-path-arrow{display:flex;align-items:center;font-size:18px;color:#434345}
.rc-path-note{margin-top:16px;font-size:13px;line-height:1.6;color:#6a6b6c;max-width:860px}
/* leaderboard */
.rc-panel{background:#0d0d0d;border:1px solid #242728;border-radius:10px;overflow:hidden}
.rc-panel-head{display:flex;align-items:center;gap:12px;padding:16px 24px;border-bottom:1px solid #242728}
.rc-panel-title{font-size:14px;font-weight:500;color:#fff;letter-spacing:.2px}
.rc-panel-note{margin-left:auto;font-size:12px;color:#6a6b6c}
.rc-tablewrap{overflow-x:auto}
.rc-table{width:100%;border-collapse:collapse;min-width:860px}
.rc-table th{padding:10px 16px;text-align:left;font-size:12px;font-weight:500;letter-spacing:.4px;color:#6a6b6c;border-bottom:1px solid #242728;white-space:nowrap}
.rc-table th.rc-num,.rc-table td.rc-num{text-align:right;font-variant-numeric:tabular-nums}
.rc-table td{padding:10px 16px;font-size:14px;color:#cdcdcd;border-bottom:1px solid #242728;white-space:nowrap}
.rc-table tbody tr{transition:background .12s}
.rc-table tbody tr:hover{background:#121212}
.rc-table tbody tr:last-child td{border-bottom:none}
.rc-rank{color:#6a6b6c;font-variant-numeric:tabular-nums}
.rc-model{color:#fff;font-weight:500}
.rc-org{color:#9c9c9d}
.rc-badge{display:inline-block;padding:2px 8px;border-radius:4px;font-size:12px;letter-spacing:.4px}
.rc-badge-open{background:rgba(89,212,153,.15);color:#59d499}
.rc-badge-closed{background:#101111;color:rgba(255,255,255,.72);border:1px solid #242728}
.rc-cell-best{color:#fff;font-weight:600}
.rc-cell-second{color:#d3d3d4;text-decoration:underline;text-underline-offset:3px;text-decoration-color:#434345}
.rc-caption{padding:14px 24px 18px;font-size:12px;line-height:1.5;color:#6a6b6c;border-top:1px solid #242728}
/* charts */
.rc-bars{padding:8px 24px 24px}
.rc-bar-row{display:flex;align-items:center;gap:16px;padding:5px 0}
.rc-bar-label{width:220px;text-align:right;font-size:13px;color:#9c9c9d;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.rc-bar-track{flex:1;height:18px;background:#101111;border-radius:4px;overflow:hidden}
.rc-bar-fill{height:100%;border-radius:4px}
.rc-bar-value{width:48px;font-size:13px;color:#cdcdcd;font-variant-numeric:tabular-nums}
.rc-legend{display:flex;flex-wrap:wrap;gap:16px;padding:0 24px 20px;font-size:12px;color:#9c9c9d}
.rc-legend-item{display:flex;align-items:center;gap:6px}
.rc-legend-dot{width:10px;height:10px;border-radius:3px}
.rc-chart-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
/* long-horizon wall */
.rc-wall{padding:20px 24px 24px;display:flex;flex-direction:column;gap:16px}
.rc-wall-nums{display:flex;align-items:baseline;gap:24px;flex-wrap:wrap}
.rc-wall-big{font-size:52px;font-weight:600;line-height:1;color:#ff6161;font-variant-numeric:tabular-nums}
.rc-wall-big-sub{font-size:13px;color:#9c9c9d;max-width:200px;line-height:1.5}
.rc-wall-grid{display:flex;flex-wrap:wrap;gap:3px}
.rc-wall-cell{width:9px;height:9px;border-radius:2px;background:#242728}
.rc-wall-cell.rc-over{background:#ff6161}
.rc-wall-note{font-size:13px;line-height:1.6;color:#6a6b6c;margin:0}
.rc-wall-legend{display:flex;gap:16px;font-size:12px;color:#9c9c9d}
/* weights avg */
.rc-grouped{padding:16px 24px 24px;display:flex;align-items:flex-end;gap:32px}
.rc-g-group{flex:1;display:flex;flex-direction:column;align-items:center;gap:10px}
.rc-g-bars{display:flex;align-items:flex-end;gap:10px;height:170px;width:100%;justify-content:center}
.rc-g-bar{width:64px;border-radius:4px 4px 0 0;position:relative}
.rc-g-val{position:absolute;top:-18px;left:50%;transform:translateX(-50%);font-size:11px;color:#9c9c9d;font-variant-numeric:tabular-nums;white-space:nowrap}
.rc-g-label{font-size:12px;color:#9c9c9d;letter-spacing:.4px;text-align:center}
/* tasks */
.rc-tasks{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.rc-task{background:#0d0d0d;border:1px solid #242728;border-radius:10px;padding:24px;display:flex;flex-direction:column;gap:12px;transition:border-color .15s}
.rc-task:hover{border-color:rgba(255,255,255,.16)}
.rc-task-top{display:flex;align-items:center;justify-content:space-between;gap:8px}
.rc-task-desc{font-size:14px;line-height:1.6;color:#cdcdcd;flex:1}
.rc-task-flag{font-size:12px;color:#57c1ff;border-top:1px solid #242728;padding-top:12px}
/* closed loop */
.rc-loop-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.rc-loop-list{margin:0;padding:8px 24px 24px;list-style:none}
.rc-loop-list li{position:relative;padding:12px 0 12px 24px;font-size:14px;line-height:1.6;color:#cdcdcd;border-bottom:1px solid #242728}
.rc-loop-list li:last-child{border-bottom:none}
.rc-loop-list li:before{position:absolute;left:0;top:14px;font-size:13px}
.rc-loop-list.rc-yes li:before{content:"✓";color:#59d499}
.rc-loop-list.rc-no li:before{content:"✗";color:#ff6161}
/* failure modes */
.rc-fail-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}
.rc-fail-card{background:#0d0d0d;border:1px solid #242728;border-radius:10px;padding:24px;border-top:2px solid #ff6161}
.rc-fail-name{font-size:16px;font-weight:500;color:#fff}
.rc-fail-desc{font-size:13px;line-height:1.6;color:#9c9c9d;margin-top:8px}
.rc-fail-note{margin-top:16px;background:#0d0d0d;border:1px solid #242728;border-left:3px solid #ffc533;border-radius:10px;padding:16px 20px;font-size:13px;line-height:1.6;color:#9c9c9d}
/* methodology */
.rc-method-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.rc-method-list{margin:0;padding:8px 24px 24px;list-style:none}
.rc-method-list li{position:relative;padding:12px 0 12px 24px;font-size:14px;line-height:1.6;color:#cdcdcd;border-bottom:1px solid #242728}
.rc-method-list li:last-child{border-bottom:none}
.rc-method-list li:before{content:"✓";position:absolute;left:0;top:14px;font-size:13px;color:#59d499}
.rc-axes{display:flex;flex-wrap:wrap;gap:8px;padding:16px 24px 24px}
.rc-axis{padding:6px 12px;border-radius:6px;background:#101111;border:1px solid #242728;font-size:13px;color:#cdcdcd;font-family:'JetBrains Mono',ui-monospace,monospace}
.rc-code{margin:0;padding:20px 24px;font-family:'JetBrains Mono',ui-monospace,Menlo,monospace;font-size:13px;line-height:1.7;color:#d3d3d4;overflow-x:auto;white-space:pre}
.rc-code-head{display:flex;align-items:center;gap:6px;padding:12px 16px;border-bottom:1px solid #242728}
.rc-dot{width:10px;height:10px;border-radius:50%}
.rc-code-title{margin-left:8px;font-size:12px;color:#6a6b6c;font-family:'JetBrains Mono',ui-monospace,monospace}
/* footer */
.rc-footer{border-top:1px solid #242728;margin-top:48px;padding:40px 0 48px}
.rc-footer-inner{display:flex;flex-wrap:wrap;align-items:center;gap:16px;font-size:13px;color:#6a6b6c}
.rc-footer a{color:#9c9c9d}
.rc-footer a:hover{color:#fff}
@media (max-width:1024px){
  .rc-stats{grid-template-columns:repeat(3,1fr)}
  .rc-labstats{grid-template-columns:repeat(2,1fr)}
  .rc-dims{grid-template-columns:repeat(2,1fr)}
  .rc-tasks{grid-template-columns:repeat(2,1fr)}
  .rc-chart-grid{grid-template-columns:1fr}
  .rc-method-grid{grid-template-columns:1fr}
  .rc-loop-grid{grid-template-columns:1fr}
  .rc-path{flex-direction:column}
  .rc-path-arrow{justify-content:center;transform:rotate(90deg)}
}
@media (max-width:640px){
  .rc-hero{padding:88px 0 56px}
  .rc-title{font-size:34px}
  .rc-stats{grid-template-columns:repeat(2,1fr)}
  .rc-labstats{grid-template-columns:1fr}
  .rc-dims{grid-template-columns:1fr}
  .rc-tasks{grid-template-columns:1fr}
  .rc-fail-grid{grid-template-columns:1fr}
  .rc-bar-label{width:120px}
  .rc-section{padding:36px 0}
}
`

export default function Raycast() {
  const maxN10 = bestN10
  const gMax = Math.max(...weightsAvg.map((r) => r.value))
  return (
    <div className="style-raycast">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
      />
      <style>{css}</style>

      {/* Nav */}
      <nav className="rc-nav">
        <div className="rc-container rc-nav-inner">
          <span className="rc-brand">
            <span className="rc-logo">⌘</span>
            RoboChem Bench
          </span>
          <span className="rc-keycap">⌘ K</span>
          <span className="rc-nav-spacer" />
          <Link to="/" className="rc-back">
            ← Back to Gallery
          </Link>
          <a href="#submit" className="rc-btn rc-btn-primary rc-btn-sm">
            Submit Your Agent
          </a>
        </div>
      </nav>

      {/* Hero */}
      <header className="rc-hero">
        <div className="rc-stripes" aria-hidden>
          <span className="rc-stripe" style={{ top: 24, opacity: 0.5 }} />
          <span className="rc-stripe" style={{ top: 74, opacity: 0.28, width: '110%' }} />
          <span className="rc-stripe" style={{ top: 122, opacity: 0.14, width: '95%' }} />
        </div>
        <div className="rc-container" style={{ position: 'relative' }}>
          <p className="rc-eyebrow">Benchmark · Robotic Chemistry Laboratory · 2026</p>
          <h1 className="rc-title">{paperMeta.title}</h1>
          <p className="rc-subtitle">{paperMeta.subtitle}</p>
          <p className="rc-authors">
            <b>{paperMeta.authors.join(', ')}</b>
            <br />
            {paperMeta.affiliation}
          </p>
          <div className="rc-cta-row">
            {paperMeta.links.map((l, i) => (
              <a
                key={l.label}
                href={l.href}
                className={`rc-btn ${i === 0 ? 'rc-btn-primary' : 'rc-btn-tertiary'}`}
                id={i === 3 ? 'submit' : undefined}
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </header>

      {/* Stats band */}
      <section className="rc-section" style={{ paddingTop: 0 }}>
        <div className="rc-container">
          <div className="rc-stats">
            {keyStats.map((s) => (
              <div className="rc-stat" key={s.label}>
                <div className="rc-stat-value">{s.value}</div>
                <div className="rc-stat-label">{s.label}</div>
                <div className="rc-stat-desc">{s.description}</div>
              </div>
            ))}
          </div>
          <div className="rc-labstats">
            {labStats.map((s) => (
              <div className="rc-labstat" key={s.label}>
                <div className="rc-labstat-value">{s.value}</div>
                <div className="rc-labstat-label">{s.label}</div>
                <div className="rc-labstat-desc">{s.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Abstract */}
      <section className="rc-section">
        <div className="rc-container">
          <div className="rc-abstract">
            <span className="rc-abstract-tag">Abstract</span>
            <p>{abstractText}</p>
          </div>
        </div>
      </section>

      {/* Skills Library */}
      <section className="rc-section">
        <div className="rc-container">
          <div className="rc-section-head">
            <h2 className="rc-h2">45 Workstations, One Skills Library</h2>
            <p className="rc-h2-sub">Every workstation is exposed to agents as a machine-readable skill, grouped into four categories.</p>
          </div>
          <div className="rc-dims">
            {skillCategories.map((d, i) => (
              <div className="rc-dim-card" key={d.name}>
                <div className="rc-dim-icon">
                  <span className="rc-dim-dot" style={{ background: dimAccent[i] }} />
                </div>
                <div className="rc-dim-name">{d.name}</div>
                <div className="rc-dim-tag">{d.tagline}</div>
                <ul className="rc-dim-list">
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
      <section className="rc-section">
        <div className="rc-container">
          <div className="rc-section-head">
            <h2 className="rc-h2">The Evaluation Pathway</h2>
            <p className="rc-h2-sub">From task receipt to physical execution — key nodes of the ten-endpoint N1→N10 pathway.</p>
          </div>
          <div className="rc-path">
            {pathwayStages.map((stage, si) => (
              <Fragment key={stage}>
                {si > 0 && (
                  <span className="rc-path-arrow" aria-hidden>
                    →
                  </span>
                )}
                <div
                  className="rc-path-stage"
                  style={{ ['--sc' as string]: stageColors[si] }}
                >
                  <div className="rc-path-stage-name">{stage}</div>
                  {pathway
                    .filter((n) => n.stage === stage)
                    .map((n) => (
                      <div className={`rc-path-node ${n.node === 'N10' ? 'rc-final' : ''}`} key={n.node}>
                        <div className="rc-path-node-id">{n.node}</div>
                        <div className="rc-path-node-label">{n.label}</div>
                      </div>
                    ))}
                </div>
              </Fragment>
            ))}
          </div>
          <p className="rc-path-note">{pathwayNote}</p>
        </div>
      </section>

      {/* Leaderboard */}
      <section className="rc-section">
        <div className="rc-container">
          <div className="rc-section-head">
            <h2 className="rc-h2">Leaderboard</h2>
            <p className="rc-h2-sub">N10 executable yield across the top 8 of 48 configurations. Best in bold, second underlined.</p>
          </div>
          <div className="rc-panel">
            <div className="rc-panel-head">
              <span className="rc-panel-title">Overall standings</span>
              <span className="rc-panel-note">8 configurations · 4,608 trials total</span>
            </div>
            <div className="rc-tablewrap">
              <table className="rc-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Configuration</th>
                    <th>Organization</th>
                    <th>Weights</th>
                    <th className="rc-num">Trials</th>
                    <th className="rc-num">Executable</th>
                    <th className="rc-num">N10 Yield</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((r) => (
                    <tr key={r.rank}>
                      <td className="rc-rank">{r.rank}</td>
                      <td className="rc-model">
                        {r.harness} × {r.model}
                      </td>
                      <td className="rc-org">{r.org}</td>
                      <td>
                        <span className={`rc-badge ${r.weights === 'open' ? 'rc-badge-open' : 'rc-badge-closed'}`}>
                          {r.weights === 'open' ? 'Open' : 'Closed'}
                        </span>
                      </td>
                      <td className="rc-num">{r.trials}</td>
                      <td className="rc-num">{r.executable}</td>
                      <td
                        className={`rc-num ${r.n10 === bestN10 ? 'rc-cell-best' : r.n10 === secondN10 ? 'rc-cell-second' : ''}`}
                      >
                        {r.n10.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="rc-caption">{leaderboardCaption}</div>
          </div>
        </div>
      </section>

      {/* Charts */}
      <section className="rc-section">
        <div className="rc-container">
          <div className="rc-section-head">
            <h2 className="rc-h2">Results at a Glance</h2>
            <p className="rc-h2-sub">Hand-rendered charts. Open-weight configurations highlighted in green.</p>
          </div>

          <div className="rc-panel" style={{ marginBottom: 16 }}>
            <div className="rc-panel-head">
              <span className="rc-panel-title">N10 executable yield — top 8 configurations</span>
              <span className="rc-panel-note">Expert-adjudicated (%)</span>
            </div>
            <div className="rc-bars">
              {leaderboard.map((r) => (
                <div className="rc-bar-row" key={r.rank}>
                  <span className="rc-bar-label" title={`${r.harness} × ${r.model}`}>
                    {r.harness} × {r.model}
                  </span>
                  <div className="rc-bar-track">
                    <div
                      className="rc-bar-fill"
                      style={{
                        width: `${(r.n10 / maxN10) * 100}%`,
                        background: r.weights === 'open' ? '#59d499' : r.rank === 1 ? '#57c1ff' : '#434345',
                      }}
                    />
                  </div>
                  <span className="rc-bar-value">{r.n10.toFixed(1)}</span>
                </div>
              ))}
            </div>
            <div className="rc-legend">
              <span className="rc-legend-item">
                <span className="rc-legend-dot" style={{ background: '#57c1ff' }} /> Best closed
              </span>
              <span className="rc-legend-item">
                <span className="rc-legend-dot" style={{ background: '#434345' }} /> Closed
              </span>
              <span className="rc-legend-item">
                <span className="rc-legend-dot" style={{ background: '#59d499' }} /> Open
              </span>
            </div>
          </div>

          <div className="rc-chart-grid">
            <div className="rc-panel">
              <div className="rc-panel-head">
                <span className="rc-panel-title">The long-horizon wall</span>
                <span className="rc-panel-note">{longHorizon.totalExecutable} executable workflows</span>
              </div>
              <div className="rc-wall">
                <div className="rc-wall-nums">
                  <span className="rc-wall-big">{longHorizon.longest}</span>
                  <span className="rc-wall-big-sub">operations in the longest executable workflow — and only {longHorizon.over30Ops} of {longHorizon.totalExecutable} exceeded 30</span>
                </div>
                <div className="rc-wall-grid" role="img" aria-label="148 of 151 executable workflows have at most 30 operations; 3 exceed 30">
                  {Array.from({ length: longHorizon.totalExecutable }, (_, i) => (
                    <span key={i} className={`rc-wall-cell ${i < longHorizon.over30Ops ? 'rc-over' : ''}`} />
                  ))}
                </div>
                <div className="rc-wall-legend">
                  <span className="rc-legend-item">
                    <span className="rc-legend-dot" style={{ background: '#ff6161' }} /> &gt;30 operations ({longHorizon.over30Ops})
                  </span>
                  <span className="rc-legend-item">
                    <span className="rc-legend-dot" style={{ background: '#242728' }} /> ≤30 operations ({longHorizon.totalExecutable - longHorizon.over30Ops})
                  </span>
                </div>
                <p className="rc-wall-note">{longHorizon.note}</p>
              </div>
            </div>

            <div className="rc-panel">
              <div className="rc-panel-head">
                <span className="rc-panel-title">Open vs Closed weights — mean N10</span>
              </div>
              <div className="rc-grouped">
                {weightsAvg.map((row) => (
                  <div className="rc-g-group" key={row.group}>
                    <div className="rc-g-bars">
                      <div
                        className="rc-g-bar"
                        style={{
                          height: `${(row.value / gMax) * 100}%`,
                          background: row.group.startsWith('Open') ? '#59d499' : '#57c1ff',
                        }}
                      >
                        <span className="rc-g-val">{row.value.toFixed(1)}%</span>
                      </div>
                    </div>
                    <span className="rc-g-label">
                      {row.group} · n={row.n}
                    </span>
                  </div>
                ))}
              </div>
              <div className="rc-caption" style={{ borderTop: 'none' }}>{weightsAvgCaption}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Task domains */}
      <section className="rc-section">
        <div className="rc-container">
          <div className="rc-section-head">
            <h2 className="rc-h2">Task Domains</h2>
            <p className="rc-h2-sub">The 32-task research suite spans four catalysis domains.</p>
          </div>
          <div className="rc-tasks">
            {taskDomains.map((t) => (
              <div className="rc-task" key={t.domain}>
                <div className="rc-task-top">
                  <span className="rc-badge" style={{ background: 'rgba(87,193,255,.15)', color: '#57c1ff' }}>
                    {t.domain}
                  </span>
                </div>
                <p className="rc-task-desc">{t.blurb}</p>
                {t.domain === 'Electrocatalysis' && <div className="rc-task-flag">↻ Closed-loop study domain</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closed-loop adaptation */}
      <section className="rc-section">
        <div className="rc-container">
          <div className="rc-section-head">
            <h2 className="rc-h2">Closed-Loop Adaptation</h2>
            <p className="rc-h2-sub">
              {closedLoop.agent} · {closedLoop.task} · {closedLoop.rounds} feedback rounds
            </p>
          </div>
          <div className="rc-loop-grid">
            <div className="rc-panel">
              <div className="rc-panel-head">
                <span className="rc-panel-title">Localized adaptation observed</span>
              </div>
              <ul className="rc-loop-list rc-yes">
                {closedLoop.adapted.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
            <div className="rc-panel">
              <div className="rc-panel-head">
                <span className="rc-panel-title">Strategic redirection not observed</span>
              </div>
              <ul className="rc-loop-list rc-no">
                {closedLoop.notObserved.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Failure modes */}
      <section className="rc-section">
        <div className="rc-container">
          <div className="rc-section-head">
            <h2 className="rc-h2">Failure Mode Analysis</h2>
            <p className="rc-h2-sub">Four recurring failure categories, identified by node-level adjudication.</p>
          </div>
          <div className="rc-fail-grid">
            {failureModes.map((f) => (
              <div className="rc-fail-card" key={f.name}>
                <div className="rc-fail-name">{f.name}</div>
                <div className="rc-fail-desc">{f.description}</div>
              </div>
            ))}
          </div>
          <div className="rc-fail-note">{failureNote}</div>
        </div>
      </section>

      {/* Methodology + BibTeX */}
      <section className="rc-section">
        <div className="rc-container">
          <div className="rc-section-head">
            <h2 className="rc-h2">Methodology & Citation</h2>
          </div>
          <div className="rc-method-grid">
            <div className="rc-panel">
              <div className="rc-panel-head">
                <span className="rc-panel-title">Scoring rubric — multi-axis R1–R6</span>
              </div>
              <div className="rc-axes">
                {scoringAxes.map((a) => (
                  <span className="rc-axis" key={a}>
                    {a}
                  </span>
                ))}
              </div>
              <div className="rc-code-head" style={{ borderTop: '1px solid #242728' }}>
                <span className="rc-code-title" style={{ marginLeft: 0 }}>
                  formulas
                </span>
              </div>
              <pre className="rc-code">{formulas.join('\n')}</pre>
            </div>
            <div className="rc-panel">
              <div className="rc-panel-head">
                <span className="rc-panel-title">Methodology notes</span>
              </div>
              <ul className="rc-method-list">
                {methodologyNotes.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>
            <div className="rc-panel" style={{ gridColumn: '1 / -1' }}>
              <div className="rc-code-head">
                <span className="rc-dot" style={{ background: '#ff6161' }} />
                <span className="rc-dot" style={{ background: '#ffc533' }} />
                <span className="rc-dot" style={{ background: '#59d499' }} />
                <span className="rc-code-title">citation.bib</span>
              </div>
              <pre className="rc-code">{bibtex}</pre>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="rc-footer">
        <div className="rc-container rc-footer-inner">
          <span className="rc-brand">
            <span className="rc-logo">⌘</span>
            RoboChem Bench
          </span>
          <span>Style preview · Raycast DESIGN.md · Content from arXiv:2607.23045</span>
          <span style={{ flex: 1 }} />
          <Link to="/">← Back to Gallery</Link>
        </div>
      </footer>
    </div>
  )
}
