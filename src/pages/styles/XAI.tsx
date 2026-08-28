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

const stageColors = ['#4a4d52', '#7d8187', '#ffffff']

const css = `
.style-xai{font-family:'Inter',system-ui,-apple-system,sans-serif;background:#0a0a0a;color:#fff;min-height:100dvh;-webkit-font-smoothing:antialiased;font-weight:400}
.style-xai a{text-decoration:none;color:inherit}
.style-xai b,.style-xai strong{font-weight:400}
.xa-container{max-width:1200px;margin:0 auto;padding:0 24px}
.xa-mono{font-family:'Geist Mono',ui-monospace,SFMono-Regular,Menlo,Monaco,monospace;text-transform:uppercase;letter-spacing:1.4px}
/* nav */
.xa-nav{position:sticky;top:0;z-index:50;background:rgba(10,10,10,.85);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid #212327}
.xa-nav-inner{height:60px;display:flex;align-items:center;gap:16px}
.xa-brand{font-size:14px;color:#fff;letter-spacing:.2px}
.xa-brand .xa-x{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border:1px solid rgba(255,255,255,.25);border-radius:9999px;margin-right:10px;font-family:'Geist Mono',ui-monospace,monospace;font-size:11px}
.xa-nav-spacer{flex:1}
.xa-back{font-size:14px;color:#7d8187;transition:color .15s}
.xa-back:hover{color:#fff}
.xa-pill{display:inline-flex;align-items:center;gap:8px;padding:8px 16px;border-radius:9999px;font-size:14px;line-height:20px;border:1px solid rgba(255,255,255,.25);background:transparent;color:#fff;cursor:pointer;transition:border-color .15s,background .15s;white-space:nowrap}
.xa-pill:hover{border-color:rgba(255,255,255,.55)}
.style-xai .xa-pill-solid{background:#fff;color:#0a0a0a;border-color:#fff}
.style-xai .xa-pill-solid:hover{background:#fafaf7}
.xa-pill-sm{padding:4px 12px;font-size:13px}
/* hero */
.xa-hero{padding:96px 0 64px;border-bottom:1px solid #212327;position:relative;overflow:hidden}
.xa-hero-glow{position:absolute;top:-220px;left:50%;transform:translateX(-50%);width:900px;height:440px;pointer-events:none;background:radial-gradient(ellipse at center,rgba(255,122,23,.07),rgba(124,58,237,.05) 45%,transparent 70%)}
.xa-eyebrow{font-size:14px;color:#fff;margin-bottom:24px}
.xa-eyebrow .xa-dim{color:#7d8187}
.xa-title{font-size:72px;line-height:1.0;letter-spacing:-1.8px;color:#fff;margin:0;max-width:960px;font-weight:400}
.xa-subtitle{margin-top:28px;font-size:18px;line-height:28px;color:#dadbdf;max-width:680px}
.xa-authors{margin-top:20px;font-size:14px;line-height:24px;color:#7d8187;max-width:760px}
.xa-cta-row{display:flex;flex-wrap:wrap;gap:12px;margin-top:36px}
/* sections */
.xa-section{padding:64px 0;border-bottom:1px solid #212327}
.xa-section-head{margin-bottom:40px}
.xa-eyebrow-sm{font-size:12px;color:#7d8187;letter-spacing:1.2px;display:block;margin-bottom:12px}
.xa-h2{font-size:48px;line-height:1.05;letter-spacing:-1.2px;color:#fff;margin:0;font-weight:400}
.xa-h2-sub{margin-top:12px;font-size:16px;line-height:24px;color:#7d8187;max-width:640px}
/* stats */
.xa-stats{display:grid;grid-template-columns:repeat(6,1fr);border-top:1px solid #212327}
.xa-stat{padding:28px 16px 28px 0;border-right:1px solid #212327;padding-left:20px}
.xa-stat:first-child{padding-left:0}
.xa-stat:last-child{border-right:none}
.xa-stat-value{font-size:40px;line-height:1;letter-spacing:-1px;color:#fff;font-variant-numeric:tabular-nums}
.xa-stat-label{margin-top:10px;font-size:12px;color:#dadbdf;font-family:'Geist Mono',ui-monospace,monospace;text-transform:uppercase;letter-spacing:1.2px}
.xa-stat-desc{margin-top:6px;font-size:12px;line-height:16px;color:#7d8187}
.xa-labstats{display:grid;grid-template-columns:repeat(4,1fr);border-top:1px solid #212327;margin-top:0}
.xa-labstat{padding:20px 16px 20px 0;border-right:1px solid #212327;padding-left:20px}
.xa-labstat:first-child{padding-left:0}
.xa-labstat:last-child{border-right:none}
.xa-labstat-value{font-size:24px;line-height:1;letter-spacing:-0.6px;color:#dadbdf;font-variant-numeric:tabular-nums}
.xa-labstat-label{margin-top:8px;font-size:11px;color:#dadbdf;font-family:'Geist Mono',ui-monospace,monospace;text-transform:uppercase;letter-spacing:1.2px}
.xa-labstat-desc{margin-top:4px;font-size:11px;line-height:15px;color:#7d8187}
/* abstract */
.xa-abstract{max-width:860px}
.xa-abstract p{margin:0;font-size:20px;line-height:32px;letter-spacing:-0.2px;color:#dadbdf}
/* dims */
.xa-dims{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}
.xa-dim{background:#191919;border:1px solid #212327;border-radius:8px;padding:24px}
.xa-dim-idx{font-size:12px;color:#7d8187;font-family:'Geist Mono',ui-monospace,monospace;letter-spacing:1.2px}
.xa-dim-name{margin-top:12px;font-size:20px;line-height:28px;color:#fff;letter-spacing:-0.2px}
.xa-dim-tag{margin-top:4px;font-size:12px;color:#7d8187}
.xa-dim-list{margin:16px 0 0;padding:0;list-style:none}
.xa-dim-list li{position:relative;padding-left:18px;font-size:14px;line-height:20px;color:#dadbdf;margin-top:10px}
.xa-dim-list li:before{content:"—";position:absolute;left:0;top:0;color:#7d8187}
/* pathway */
.xa-path{display:flex;align-items:stretch;gap:14px;flex-wrap:wrap}
.xa-path-stage{flex:1;min-width:240px;background:#191919;border:1px solid #212327;border-radius:8px;padding:20px}
.xa-path-stage-name{font-size:11px;color:var(--sc);font-family:'Geist Mono',ui-monospace,monospace;text-transform:uppercase;letter-spacing:1.2px;margin-bottom:6px}
.xa-path-node{background:#1a1c20;border:1px solid #212327;border-left:2px solid var(--sc);border-radius:8px;padding:10px 12px;margin-top:10px}
.xa-path-node-id{font-family:'Geist Mono',ui-monospace,monospace;font-size:11px;color:var(--sc);letter-spacing:1px}
.xa-path-node-label{margin-top:2px;font-size:13px;line-height:18px;color:#dadbdf}
.xa-path-node.xa-final{border-color:#fff;border-left-color:#fff;background:rgba(255,255,255,.06);box-shadow:0 0 0 1px rgba(255,255,255,.35)}
.xa-path-node.xa-final .xa-path-node-id{color:#fff}
.xa-path-arrow{display:flex;align-items:center;font-size:18px;color:#4a4d52}
.xa-path-note{margin-top:16px;font-size:13px;line-height:20px;color:#7d8187;max-width:860px}
/* leaderboard */
.xa-panel{background:#191919;border:1px solid #212327;border-radius:8px;overflow:hidden}
.xa-panel-head{display:flex;align-items:center;gap:12px;padding:16px 24px;border-bottom:1px solid #212327}
.xa-panel-title{font-size:12px;color:#fff;font-family:'Geist Mono',ui-monospace,monospace;text-transform:uppercase;letter-spacing:1.2px}
.xa-panel-note{margin-left:auto;font-size:12px;color:#7d8187;font-family:'Geist Mono',ui-monospace,monospace;letter-spacing:1.2px;text-transform:uppercase}
.xa-tablewrap{overflow-x:auto}
.xa-table{width:100%;border-collapse:collapse;min-width:860px}
.xa-table th{padding:12px 16px;text-align:left;font-size:12px;font-weight:400;color:#7d8187;font-family:'Geist Mono',ui-monospace,monospace;text-transform:uppercase;letter-spacing:1.2px;border-bottom:1px solid #212327;white-space:nowrap;background:#1a1c20}
.xa-table th.xa-num,.xa-table td.xa-num{text-align:right;font-variant-numeric:tabular-nums}
.xa-table td{padding:12px 16px;font-size:14px;line-height:20px;color:#dadbdf;border-bottom:1px solid #212327;white-space:nowrap}
.xa-table tbody tr:hover{background:#1a1c20}
.xa-table tbody tr:last-child td{border-bottom:none}
.xa-rank{color:#7d8187;font-variant-numeric:tabular-nums}
.xa-model{color:#fff}
.xa-org{color:#7d8187}
.xa-badge{display:inline-block;padding:3px 12px;border-radius:9999px;font-size:12px;line-height:16px;border:1px solid rgba(255,255,255,.25);color:#fff}
.xa-badge-closed{color:#7d8187;border-color:#212327}
.xa-cell-best{color:#fff;background:rgba(255,255,255,.06)}
.xa-cell-second{color:#fff;text-decoration:underline;text-underline-offset:4px;text-decoration-color:#7d8187}
.xa-caption{padding:14px 24px 18px;font-size:12px;line-height:18px;color:#7d8187;border-top:1px solid #212327;font-family:'Geist Mono',ui-monospace,monospace;letter-spacing:.4px}
/* charts */
.xa-bars{padding:8px 24px 24px}
.xa-bar-row{display:flex;align-items:center;gap:16px;padding:5px 0}
.xa-bar-label{width:220px;text-align:right;font-size:13px;color:#7d8187;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.xa-bar-track{flex:1;height:14px;background:#1a1c20;border-radius:9999px;overflow:hidden}
.xa-bar-fill{height:100%;border-radius:9999px;background:#fff}
.xa-bar-fill.xa-dim-bar{background:#363a3f}
.xa-bar-value{width:48px;font-size:13px;color:#dadbdf;font-variant-numeric:tabular-nums}
.xa-legend{display:flex;flex-wrap:wrap;gap:16px;padding:0 24px 20px;font-size:12px;color:#7d8187;font-family:'Geist Mono',ui-monospace,monospace;text-transform:uppercase;letter-spacing:1.2px}
.xa-legend-item{display:flex;align-items:center;gap:8px}
.xa-legend-dot{width:10px;height:10px;border-radius:9999px}
.xa-chart-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
/* long-horizon wall */
.xa-wall{padding:20px 24px 24px;display:flex;flex-direction:column;gap:16px}
.xa-wall-nums{display:flex;align-items:baseline;gap:24px;flex-wrap:wrap}
.xa-wall-big{font-size:56px;line-height:1;letter-spacing:-2px;color:#fff;font-variant-numeric:tabular-nums}
.xa-wall-big-sub{font-size:13px;line-height:18px;color:#7d8187;max-width:220px}
.xa-wall-grid{display:flex;flex-wrap:wrap;gap:3px}
.xa-wall-cell{width:9px;height:9px;border-radius:9999px;background:#1a1c20;border:1px solid #212327}
.xa-wall-cell.xa-over{background:#fff;border-color:#fff}
.xa-wall-note{font-size:13px;line-height:20px;color:#7d8187;margin:0}
.xa-wall-legend{display:flex;gap:16px;font-size:12px;color:#7d8187;font-family:'Geist Mono',ui-monospace,monospace;text-transform:uppercase;letter-spacing:1.2px}
/* weights avg */
.xa-grouped{padding:16px 24px 24px;display:flex;align-items:flex-end;gap:32px}
.xa-g-group{flex:1;display:flex;flex-direction:column;align-items:center;gap:12px}
.xa-g-bars{display:flex;align-items:flex-end;gap:12px;height:170px;width:100%;justify-content:center}
.xa-g-bar{width:64px;border-radius:9999px 9999px 0 0;position:relative}
.xa-g-val{position:absolute;top:-18px;left:50%;transform:translateX(-50%);font-size:11px;color:#7d8187;font-variant-numeric:tabular-nums;white-space:nowrap}
.xa-g-label{font-size:11px;color:#7d8187;font-family:'Geist Mono',ui-monospace,monospace;text-transform:uppercase;letter-spacing:1.2px;text-align:center}
/* tasks */
.xa-tasks{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}
.xa-task{background:#191919;border:1px solid #212327;border-radius:8px;padding:24px;display:flex;flex-direction:column;gap:14px}
.xa-task-top{display:flex;align-items:center;justify-content:space-between;gap:8px}
.xa-task-desc{font-size:14px;line-height:22px;color:#dadbdf;flex:1;margin:0}
.xa-task-flag{font-size:12px;color:#fff;border-top:1px solid #212327;padding-top:14px;font-family:'Geist Mono',ui-monospace,monospace;text-transform:uppercase;letter-spacing:1.2px}
/* closed loop */
.xa-loop-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.xa-loop-list{margin:0;padding:8px 24px 24px;list-style:none}
.xa-loop-list li{position:relative;padding:14px 0 14px 22px;font-size:14px;line-height:22px;color:#dadbdf;border-bottom:1px solid #212327}
.xa-loop-list li:last-child{border-bottom:none}
.xa-loop-list li:before{position:absolute;left:0;top:14px;font-size:13px}
.xa-loop-list.xa-yes li:before{content:"✓";color:#fff}
.xa-loop-list.xa-no li:before{content:"✗";color:#7d8187}
/* failure */
.xa-fail-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}
.xa-fail-card{background:#191919;border:1px solid #212327;border-radius:8px;padding:24px}
.xa-fail-name{font-size:16px;color:#fff}
.xa-fail-desc{font-size:13px;line-height:20px;color:#7d8187;margin-top:8px}
.xa-fail-note{margin-top:16px;background:#191919;border:1px solid #212327;border-left:2px solid #fff;border-radius:8px;padding:16px 20px;font-size:13px;line-height:20px;color:#7d8187}
/* method */
.xa-method-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.xa-method-list{margin:0;padding:8px 24px 24px;list-style:none}
.xa-method-list li{position:relative;padding:14px 0 14px 20px;font-size:14px;line-height:22px;color:#dadbdf;border-bottom:1px solid #212327}
.xa-method-list li:last-child{border-bottom:none}
.xa-method-list li:before{content:"—";position:absolute;left:0;top:14px;color:#7d8187}
.xa-axes{display:flex;flex-wrap:wrap;gap:8px;padding:16px 24px 24px}
.xa-axis{padding:6px 12px;border-radius:9999px;background:#1a1c20;border:1px solid #212327;font-size:12px;color:#dadbdf;font-family:'Geist Mono',ui-monospace,monospace;letter-spacing:.4px}
.xa-code{margin:0;padding:20px 24px;font-family:'Geist Mono',ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;line-height:1.8;color:#dadbdf;overflow-x:auto;white-space:pre;background:#0a0a0a}
/* footer */
.xa-footer{padding:48px 0 64px}
.xa-footer-inner{display:flex;flex-wrap:wrap;align-items:center;gap:16px;font-size:14px;color:#7d8187}
.xa-footer a{color:#dadbdf}
.xa-footer a:hover{color:#fff}
@media (max-width:1024px){
  .xa-stats{grid-template-columns:repeat(3,1fr)}
  .xa-stat{border-bottom:1px solid #212327}
  .xa-labstats{grid-template-columns:repeat(2,1fr)}
  .xa-labstat{border-bottom:1px solid #212327}
  .xa-chart-grid{grid-template-columns:1fr}
  .xa-method-grid{grid-template-columns:1fr}
  .xa-loop-grid{grid-template-columns:1fr}
  .xa-path{flex-direction:column}
  .xa-path-arrow{justify-content:center;transform:rotate(90deg)}
}
@media (max-width:640px){
  .xa-title{font-size:44px;letter-spacing:-1px}
  .xa-h2{font-size:32px;letter-spacing:-0.8px}
  .xa-stats{grid-template-columns:repeat(2,1fr)}
  .xa-labstats{grid-template-columns:1fr}
  .xa-dims{grid-template-columns:1fr}
  .xa-tasks{grid-template-columns:1fr}
  .xa-fail-grid{grid-template-columns:1fr}
  .xa-bar-label{width:120px}
  .xa-section{padding:44px 0}
  .xa-hero{padding:64px 0 48px}
}
`

export default function XAI() {
  const maxN10 = bestN10
  const gMax = Math.max(...weightsAvg.map((r) => r.value))
  return (
    <div className="style-xai">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@400;500&family=Inter:wght@400&display=swap"
      />
      <style>{css}</style>

      {/* Nav */}
      <nav className="xa-nav">
        <div className="xa-container xa-nav-inner">
          <span className="xa-brand">
            <span className="xa-x">R</span>
            RoboChem Bench
          </span>
          <span className="xa-nav-spacer" />
          <Link to="/" className="xa-back">
            ← Back to Gallery
          </Link>
          <a href="#submit" className="xa-pill xa-pill-sm">
            Submit Your Agent
          </a>
        </div>
      </nav>

      {/* Hero */}
      <header className="xa-hero">
        <div className="xa-hero-glow" aria-hidden />
        <div className="xa-container" style={{ position: 'relative' }}>
          <p className="xa-eyebrow xa-mono">
            Benchmark <span className="xa-dim">/ Robotic Chemistry / 2026</span>
          </p>
          <h1 className="xa-title">{paperMeta.title}</h1>
          <p className="xa-subtitle">{paperMeta.subtitle}</p>
          <p className="xa-authors">
            {paperMeta.authors.join(', ')}
            <br />
            {paperMeta.affiliation}
          </p>
          <div className="xa-cta-row">
            {paperMeta.links.map((l, i) => (
              <a
                key={l.label}
                href={l.href}
                className={`xa-pill ${i === 0 ? 'xa-pill-solid' : ''}`}
                id={i === 3 ? 'submit' : undefined}
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </header>

      {/* Stats */}
      <section className="xa-section">
        <div className="xa-container">
          <div className="xa-stats">
            {keyStats.map((s) => (
              <div className="xa-stat" key={s.label}>
                <div className="xa-stat-value">{s.value}</div>
                <div className="xa-stat-label">{s.label}</div>
                <div className="xa-stat-desc">{s.description}</div>
              </div>
            ))}
          </div>
          <div className="xa-labstats">
            {labStats.map((s) => (
              <div className="xa-labstat" key={s.label}>
                <div className="xa-labstat-value">{s.value}</div>
                <div className="xa-labstat-label">{s.label}</div>
                <div className="xa-labstat-desc">{s.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Abstract */}
      <section className="xa-section">
        <div className="xa-container">
          <span className="xa-eyebrow-sm xa-mono">Abstract</span>
          <div className="xa-abstract">
            <p>{abstractText}</p>
          </div>
        </div>
      </section>

      {/* Skills Library */}
      <section className="xa-section">
        <div className="xa-container">
          <div className="xa-section-head">
            <span className="xa-eyebrow-sm xa-mono">Skills library</span>
            <h2 className="xa-h2">45 workstations, one skills library</h2>
            <p className="xa-h2-sub">Every workstation is exposed to agents as a machine-readable skill.</p>
          </div>
          <div className="xa-dims">
            {skillCategories.map((d, i) => (
              <div className="xa-dim" key={d.name}>
                <div className="xa-dim-idx">0{i + 1}</div>
                <div className="xa-dim-name">{d.name}</div>
                <div className="xa-dim-tag">{d.tagline}</div>
                <ul className="xa-dim-list">
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
      <section className="xa-section">
        <div className="xa-container">
          <div className="xa-section-head">
            <span className="xa-eyebrow-sm xa-mono">Evaluation pathway</span>
            <h2 className="xa-h2">N1 → N10</h2>
            <p className="xa-h2-sub">Key nodes of the ten-endpoint pathway. Only N10 certifies physical executability.</p>
          </div>
          <div className="xa-path">
            {pathwayStages.map((stage, si) => (
              <Fragment key={stage}>
                {si > 0 && (
                  <span className="xa-path-arrow" aria-hidden>
                    →
                  </span>
                )}
                <div className="xa-path-stage" style={{ ['--sc' as string]: stageColors[si] }}>
                  <div className="xa-path-stage-name">{stage}</div>
                  {pathway
                    .filter((n) => n.stage === stage)
                    .map((n) => (
                      <div className={`xa-path-node ${n.node === 'N10' ? 'xa-final' : ''}`} key={n.node}>
                        <div className="xa-path-node-id">{n.node}</div>
                        <div className="xa-path-node-label">{n.label}</div>
                      </div>
                    ))}
                </div>
              </Fragment>
            ))}
          </div>
          <p className="xa-path-note">{pathwayNote}</p>
        </div>
      </section>

      {/* Leaderboard */}
      <section className="xa-section">
        <div className="xa-container">
          <div className="xa-section-head">
            <span className="xa-eyebrow-sm xa-mono">Leaderboard</span>
            <h2 className="xa-h2">Top 8 configurations, ranked</h2>
            <p className="xa-h2-sub">N10 executable yield (%). Best highlighted, second underlined.</p>
          </div>
          <div className="xa-panel">
            <div className="xa-panel-head">
              <span className="xa-panel-title">overall_standings</span>
              <span className="xa-panel-note">top 8 of 48 · 96 trials each</span>
            </div>
            <div className="xa-tablewrap">
              <table className="xa-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Configuration</th>
                    <th>Organization</th>
                    <th>Weights</th>
                    <th className="xa-num">Trials</th>
                    <th className="xa-num">Executable</th>
                    <th className="xa-num">N10 Yield</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((r) => (
                    <tr key={r.rank}>
                      <td className="xa-rank">{r.rank}</td>
                      <td className="xa-model">
                        {r.harness} × {r.model}
                      </td>
                      <td className="xa-org">{r.org}</td>
                      <td>
                        <span className={`xa-badge ${r.weights === 'open' ? '' : 'xa-badge-closed'}`}>
                          {r.weights === 'open' ? 'Open' : 'Closed'}
                        </span>
                      </td>
                      <td className="xa-num">{r.trials}</td>
                      <td className="xa-num">{r.executable}</td>
                      <td
                        className={`xa-num ${r.n10 === bestN10 ? 'xa-cell-best' : r.n10 === secondN10 ? 'xa-cell-second' : ''}`}
                      >
                        {r.n10.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="xa-caption">{leaderboardCaption}</div>
          </div>
        </div>
      </section>

      {/* Charts */}
      <section className="xa-section">
        <div className="xa-container">
          <div className="xa-section-head">
            <span className="xa-eyebrow-sm xa-mono">Results</span>
            <h2 className="xa-h2">Results at a glance</h2>
          </div>

          <div className="xa-panel" style={{ marginBottom: 16 }}>
            <div className="xa-panel-head">
              <span className="xa-panel-title">n10_yield / top 8 configurations</span>
              <span className="xa-panel-note">expert-adjudicated %</span>
            </div>
            <div className="xa-bars">
              {leaderboard.map((r) => (
                <div className="xa-bar-row" key={r.rank}>
                  <span className="xa-bar-label" title={`${r.harness} × ${r.model}`}>
                    {r.harness} × {r.model}
                  </span>
                  <div className="xa-bar-track">
                    <div
                      className={`xa-bar-fill ${r.weights === 'open' ? '' : 'xa-dim-bar'}`}
                      style={{ width: `${(r.n10 / maxN10) * 100}%` }}
                    />
                  </div>
                  <span className="xa-bar-value">{r.n10.toFixed(1)}</span>
                </div>
              ))}
            </div>
            <div className="xa-legend">
              <span className="xa-legend-item">
                <span className="xa-legend-dot" style={{ background: '#fff' }} /> Open
              </span>
              <span className="xa-legend-item">
                <span className="xa-legend-dot" style={{ background: '#363a3f' }} /> Closed
              </span>
            </div>
          </div>

          <div className="xa-chart-grid">
            <div className="xa-panel">
              <div className="xa-panel-head">
                <span className="xa-panel-title">the_long_horizon_wall</span>
                <span className="xa-panel-note">{longHorizon.totalExecutable} executable workflows</span>
              </div>
              <div className="xa-wall">
                <div className="xa-wall-nums">
                  <span className="xa-wall-big">{longHorizon.longest}</span>
                  <span className="xa-wall-big-sub">operations in the longest executable workflow — only {longHorizon.over30Ops} of {longHorizon.totalExecutable} exceeded 30</span>
                </div>
                <div className="xa-wall-grid" role="img" aria-label="148 of 151 executable workflows have at most 30 operations; 3 exceed 30">
                  {Array.from({ length: longHorizon.totalExecutable }, (_, i) => (
                    <span key={i} className={`xa-wall-cell ${i < longHorizon.over30Ops ? 'xa-over' : ''}`} />
                  ))}
                </div>
                <div className="xa-wall-legend">
                  <span className="xa-legend-item">
                    <span className="xa-legend-dot" style={{ background: '#fff' }} /> &gt;30 ops ({longHorizon.over30Ops})
                  </span>
                  <span className="xa-legend-item">
                    <span className="xa-legend-dot" style={{ background: '#1a1c20', border: '1px solid #212327' }} /> ≤30 ops ({longHorizon.totalExecutable - longHorizon.over30Ops})
                  </span>
                </div>
                <p className="xa-wall-note">{longHorizon.note}</p>
              </div>
            </div>

            <div className="xa-panel">
              <div className="xa-panel-head">
                <span className="xa-panel-title">open_vs_closed / mean n10</span>
              </div>
              <div className="xa-grouped">
                {weightsAvg.map((row) => (
                  <div className="xa-g-group" key={row.group}>
                    <div className="xa-g-bars">
                      <div
                        className="xa-g-bar"
                        style={{
                          height: `${(row.value / gMax) * 100}%`,
                          background: row.group.startsWith('Open') ? '#ffffff' : '#363a3f',
                          border: row.group.startsWith('Open') ? undefined : '1px solid #7d8187',
                        }}
                      >
                        <span className="xa-g-val">{row.value.toFixed(1)}%</span>
                      </div>
                    </div>
                    <span className="xa-g-label">
                      {row.group} · n={row.n}
                    </span>
                  </div>
                ))}
              </div>
              <div className="xa-legend">
                <span className="xa-legend-item">
                  <span className="xa-legend-dot" style={{ background: '#fff' }} /> Open avg
                </span>
                <span className="xa-legend-item">
                  <span className="xa-legend-dot" style={{ background: '#363a3f', border: '1px solid #7d8187' }} /> Closed avg
                </span>
              </div>
              <div className="xa-caption" style={{ borderTop: 'none' }}>{weightsAvgCaption}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Task domains */}
      <section className="xa-section">
        <div className="xa-container">
          <div className="xa-section-head">
            <span className="xa-eyebrow-sm xa-mono">Tasks</span>
            <h2 className="xa-h2">Four task domains</h2>
            <p className="xa-h2-sub">The 32-task research suite spans four catalysis domains.</p>
          </div>
          <div className="xa-tasks">
            {taskDomains.map((t) => (
              <div className="xa-task" key={t.domain}>
                <div className="xa-task-top">
                  <span className="xa-badge">{t.domain}</span>
                </div>
                <p className="xa-task-desc">{t.blurb}</p>
                {t.domain === 'Electrocatalysis' && <div className="xa-task-flag">↻ closed-loop study domain</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closed-loop adaptation */}
      <section className="xa-section">
        <div className="xa-container">
          <div className="xa-section-head">
            <span className="xa-eyebrow-sm xa-mono">Closed-loop adaptation</span>
            <h2 className="xa-h2">Local fixes, no re-planning</h2>
            <p className="xa-h2-sub">
              {closedLoop.agent} · {closedLoop.task} · {closedLoop.rounds} feedback rounds
            </p>
          </div>
          <div className="xa-loop-grid">
            <div className="xa-panel">
              <div className="xa-panel-head">
                <span className="xa-panel-title">localized_adaptation_observed</span>
              </div>
              <ul className="xa-loop-list xa-yes">
                {closedLoop.adapted.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
            <div className="xa-panel">
              <div className="xa-panel-head">
                <span className="xa-panel-title">strategic_redirection_not_observed</span>
              </div>
              <ul className="xa-loop-list xa-no">
                {closedLoop.notObserved.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Failure modes */}
      <section className="xa-section">
        <div className="xa-container">
          <div className="xa-section-head">
            <span className="xa-eyebrow-sm xa-mono">Failure analysis</span>
            <h2 className="xa-h2">How agents fail</h2>
            <p className="xa-h2-sub">Four recurring failure categories, identified by node-level adjudication.</p>
          </div>
          <div className="xa-fail-grid">
            {failureModes.map((f) => (
              <div className="xa-fail-card" key={f.name}>
                <div className="xa-fail-name">{f.name}</div>
                <div className="xa-fail-desc">{f.description}</div>
              </div>
            ))}
          </div>
          <div className="xa-fail-note">{failureNote}</div>
        </div>
      </section>

      {/* Methodology + BibTeX */}
      <section className="xa-section">
        <div className="xa-container">
          <div className="xa-section-head">
            <span className="xa-eyebrow-sm xa-mono">Methodology & citation</span>
            <h2 className="xa-h2">How we measured</h2>
          </div>
          <div className="xa-method-grid">
            <div className="xa-panel">
              <div className="xa-panel-head">
                <span className="xa-panel-title">scoring_rubric / r1–r6</span>
              </div>
              <div className="xa-axes">
                {scoringAxes.map((a) => (
                  <span className="xa-axis" key={a}>
                    {a}
                  </span>
                ))}
              </div>
              <div className="xa-panel-head" style={{ borderTop: '1px solid #212327' }}>
                <span className="xa-panel-title">formulas</span>
              </div>
              <pre className="xa-code">{formulas.join('\n')}</pre>
            </div>
            <div className="xa-panel">
              <div className="xa-panel-head">
                <span className="xa-panel-title">methodology_notes</span>
              </div>
              <ul className="xa-method-list">
                {methodologyNotes.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>
            <div className="xa-panel" style={{ gridColumn: '1 / -1' }}>
              <div className="xa-panel-head">
                <span className="xa-panel-title">citation.bib</span>
                <span className="xa-panel-note">bibtex</span>
              </div>
              <pre className="xa-code">{bibtex}</pre>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="xa-footer">
        <div className="xa-container xa-footer-inner">
          <span className="xa-brand">
            <span className="xa-x">R</span>
            RoboChem Bench
          </span>
          <span>Style preview · xAI DESIGN.md · Content from arXiv:2607.23045</span>
          <span style={{ flex: 1 }} />
          <Link to="/">← Back to Gallery</Link>
        </div>
      </footer>
    </div>
  )
}
