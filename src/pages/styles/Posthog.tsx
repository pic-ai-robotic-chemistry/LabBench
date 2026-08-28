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

const failColors = ['#cd4239', '#f7a501', '#2c84e0', '#7c44a6']
const stageColors = ['#2c84e0', '#f7a501', '#cd4239']

function Hedgehog({ size = 44 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      <path
        d="M6 34 L10 24 L13 28 L15 20 L19 25 L21 16 L25 22 L28 14 L32 21 L35 15 L38 23 L42 20 L44 30 Q46 40 36 42 L16 44 Q6 44 6 34 Z"
        fill="#b17816"
      />
      <ellipse cx="14" cy="36" rx="9" ry="7" fill="#f7a501" />
      <circle cx="10.5" cy="34" r="1.6" fill="#23251d" />
      <circle cx="6.5" cy="37.5" r="1.8" fill="#23251d" />
    </svg>
  )
}

const css = `
.style-posthog{font-family:'IBM Plex Sans',-apple-system,system-ui,sans-serif;background:#1b1d17;color:#e8e9e0;min-height:100dvh;-webkit-font-smoothing:antialiased}
.style-posthog a{text-decoration:none;color:inherit}
.ph-container{max-width:1280px;margin:0 auto;padding:0 24px}
/* nav */
.ph-nav{position:sticky;top:0;z-index:50;background:#1b1d17;border-bottom:1px solid #33352c}
.ph-nav-inner{height:56px;display:flex;align-items:center;gap:16px}
.ph-brand{display:flex;align-items:center;gap:10px;font-size:16px;font-weight:700;color:#fff}
.ph-nav-spacer{flex:1}
.ph-back{font-size:14px;font-weight:600;color:#a9ab9e;transition:color .15s}
.ph-back:hover{color:#fff}
.ph-btn{display:inline-flex;align-items:center;gap:8px;padding:8px 16px;min-height:40px;border-radius:6px;font-size:14px;font-weight:700;line-height:1.5;border:1px solid transparent;cursor:pointer;transition:background .15s,border-color .15s;white-space:nowrap}
.ph-btn-primary{background:#f7a501;color:#23251d}
.ph-btn-primary:hover{background:#dd9001}
.ph-btn-secondary{background:#2b2d25;color:#fff;border-color:#3c3e35}
.ph-btn-secondary:hover{border-color:#f7a501}
/* hero */
.ph-hero{padding:80px 0 56px;border-bottom:1px solid #33352c;position:relative;overflow:hidden}
.ph-hero-grid{display:grid;grid-template-columns:1fr 280px;gap:48px;align-items:center}
.ph-eyebrow{font-size:12px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:#f7a501;margin-bottom:16px}
.ph-title{font-size:36px;font-weight:700;line-height:1.3;color:#fff;margin:0;letter-spacing:-0.5px}
.ph-subtitle{margin-top:16px;font-size:18px;line-height:1.5;color:#b9bbae;max-width:720px}
.ph-authors{margin-top:16px;font-size:13px;line-height:1.6;color:#84867b;max-width:720px}
.ph-authors b{color:#b9bbae;font-weight:600}
.ph-cta-row{display:flex;flex-wrap:wrap;gap:12px;margin-top:28px}
.ph-hero-hog{display:flex;flex-direction:column;align-items:center;gap:12px}
.ph-hog-bubble{background:#2b2d25;border:1px solid #3c3e35;border-radius:6px;padding:12px 16px;font-size:13px;font-weight:600;color:#e8e9e0;position:relative;text-align:center}
.ph-hog-bubble:after{content:"";position:absolute;bottom:-7px;left:50%;transform:translateX(-50%) rotate(45deg);width:12px;height:12px;background:#2b2d25;border-right:1px solid #3c3e35;border-bottom:1px solid #3c3e35}
/* sections */
.ph-section{padding:56px 0;border-bottom:1px solid #33352c}
.ph-section-head{margin-bottom:28px}
.ph-eyebrow-sm{font-size:12px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:#84867b;display:block;margin-bottom:8px}
.ph-h2{font-size:24px;font-weight:800;line-height:1.33;letter-spacing:-0.6px;color:#fff;margin:0}
.ph-h2-sub{margin-top:8px;font-size:15px;line-height:1.7;color:#84867b;max-width:680px}
/* stats */
.ph-stats{display:grid;grid-template-columns:repeat(6,1fr);gap:12px}
.ph-stat{background:#23251d;border:1px solid #3c3e35;border-radius:6px;padding:20px}
.ph-stat-value{font-size:32px;font-weight:800;letter-spacing:-0.6px;color:#f7a501;font-variant-numeric:tabular-nums;line-height:1.1}
.ph-stat-label{margin-top:8px;font-size:13px;font-weight:600;color:#fff}
.ph-stat-desc{margin-top:4px;font-size:12px;line-height:1.5;color:#84867b}
.ph-labstats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:12px}
.ph-labstat{background:#23251d;border:1px solid #3c3e35;border-radius:6px;padding:14px 16px}
.ph-labstat-value{font-size:20px;font-weight:800;letter-spacing:-0.4px;color:#4ec99b;font-variant-numeric:tabular-nums;line-height:1.1}
.ph-labstat-label{margin-top:6px;font-size:12px;font-weight:600;color:#fff}
.ph-labstat-desc{margin-top:2px;font-size:11px;line-height:1.4;color:#84867b}
/* abstract */
.ph-abstract{background:#23251d;border:1px solid #3c3e35;border-left:4px solid #f7a501;border-radius:6px;padding:24px;position:relative}
.ph-abstract p{margin:0;font-size:16px;line-height:1.7;color:#e8e9e0;max-width:920px}
.ph-abstract .ph-hog-inline{position:absolute;right:20px;top:-18px}
/* dims */
.ph-dims{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.ph-dim{background:#23251d;border:1px solid #3c3e35;border-radius:6px;padding:24px}
.ph-dim-name{font-size:18px;font-weight:600;color:#fff;line-height:1.4}
.ph-dim-tag{margin-top:4px;font-size:12px;color:#84867b}
.ph-dim-list{margin:14px 0 0;padding:0;list-style:none}
.ph-dim-list li{position:relative;padding-left:18px;font-size:14px;line-height:1.5;color:#b9bbae;margin-top:8px}
.ph-dim-list li:before{content:"→";position:absolute;left:0;top:0;font-size:13px;color:#f7a501}
/* pathway */
.ph-path{display:flex;align-items:stretch;gap:12px;flex-wrap:wrap}
.ph-path-stage{flex:1;min-width:240px;background:#23251d;border:1px solid #3c3e35;border-top:4px solid var(--sc);border-radius:6px;padding:20px}
.ph-path-stage-name{font-size:12px;font-weight:700;letter-spacing:.6px;text-transform:uppercase;color:var(--sc);margin-bottom:6px}
.ph-path-node{background:#2b2d25;border:1px solid #3c3e35;border-left:3px solid var(--sc);border-radius:6px;padding:10px 12px;margin-top:10px}
.ph-path-node-id{font-family:'Source Code Pro',ui-monospace,monospace;font-size:11px;font-weight:700;color:var(--sc);letter-spacing:.4px}
.ph-path-node-label{margin-top:2px;font-size:13px;line-height:1.45;color:#d7d8cc}
.ph-path-node.ph-final{border-color:#cd4239;border-left-color:#cd4239;background:rgba(205,66,57,.1);box-shadow:0 0 0 1px rgba(205,66,57,.4)}
.ph-path-arrow{display:flex;align-items:center;font-size:18px;font-weight:700;color:#4a4c42}
.ph-path-note{margin-top:16px;font-size:13px;line-height:1.6;color:#84867b;max-width:860px}
/* leaderboard */
.ph-panel{background:#23251d;border:1px solid #3c3e35;border-radius:6px;overflow:hidden}
.ph-panel-head{display:flex;align-items:center;gap:12px;padding:14px 24px;border-bottom:1px solid #3c3e35}
.ph-panel-title{font-size:14px;font-weight:700;color:#fff}
.ph-panel-note{margin-left:auto;font-size:12px;font-weight:500;color:#84867b}
.ph-tablewrap{overflow-x:auto}
.ph-table{width:100%;border-collapse:collapse;min-width:860px}
.ph-table th{padding:10px 16px;text-align:left;font-size:12px;font-weight:700;color:#84867b;text-transform:uppercase;letter-spacing:.6px;border-bottom:1px solid #3c3e35;white-space:nowrap}
.ph-table th.ph-num,.ph-table td.ph-num{text-align:right;font-variant-numeric:tabular-nums}
.ph-table td{padding:9px 16px;font-size:14px;color:#d7d8cc;border-bottom:1px solid #2e3028;white-space:nowrap}
.ph-table tbody tr:hover{background:#282a22}
.ph-table tbody tr:last-child td{border-bottom:none}
.ph-rank{color:#84867b;font-variant-numeric:tabular-nums;font-weight:600}
.ph-model{color:#fff;font-weight:600}
.ph-org{color:#a9ab9e}
.ph-badge{display:inline-block;padding:2px 8px;border-radius:9999px;font-size:12px;font-weight:600}
.ph-badge-open{background:rgba(44,140,102,.25);color:#4ec99b}
.ph-badge-closed{background:#2b2d25;color:#a9ab9e;border:1px solid #3c3e35}
.ph-cell-best{color:#f7a501;font-weight:700}
.ph-cell-second{color:#fff;text-decoration:underline;text-underline-offset:3px;text-decoration-color:#f7a501}
.ph-caption{padding:12px 24px 16px;font-size:12px;line-height:1.5;color:#84867b;border-top:1px solid #3c3e35}
/* charts */
.ph-bars{padding:8px 24px 24px}
.ph-bar-row{display:flex;align-items:center;gap:16px;padding:4px 0}
.ph-bar-label{width:220px;text-align:right;font-size:13px;color:#a9ab9e;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ph-bar-track{flex:1;height:16px;background:#1b1d17;border:1px solid #33352c;border-radius:4px;overflow:hidden}
.ph-bar-fill{height:100%;border-radius:3px}
.ph-bar-value{width:48px;font-size:13px;font-weight:600;color:#d7d8cc;font-variant-numeric:tabular-nums}
.ph-legend{display:flex;flex-wrap:wrap;gap:16px;padding:0 24px 20px;font-size:12px;font-weight:500;color:#a9ab9e}
.ph-legend-item{display:flex;align-items:center;gap:6px}
.ph-legend-dot{width:10px;height:10px;border-radius:3px}
.ph-chart-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
/* long-horizon wall */
.ph-wall{padding:20px 24px 24px;display:flex;flex-direction:column;gap:16px}
.ph-wall-nums{display:flex;align-items:baseline;gap:24px;flex-wrap:wrap}
.ph-wall-big{font-size:52px;font-weight:800;letter-spacing:-1.5px;line-height:1;color:#f7a501;font-variant-numeric:tabular-nums}
.ph-wall-big-sub{font-size:13px;color:#a9ab9e;max-width:220px;line-height:1.5}
.ph-wall-grid{display:flex;flex-wrap:wrap;gap:3px}
.ph-wall-cell{width:9px;height:9px;border-radius:2px;background:#33352c}
.ph-wall-cell.ph-over{background:#f7a501}
.ph-wall-note{font-size:13px;line-height:1.6;color:#84867b;margin:0}
.ph-wall-legend{display:flex;gap:16px;font-size:12px;font-weight:500;color:#a9ab9e}
/* weights avg */
.ph-grouped{padding:16px 24px 24px;display:flex;align-items:flex-end;gap:32px}
.ph-g-group{flex:1;display:flex;flex-direction:column;align-items:center;gap:10px}
.ph-g-bars{display:flex;align-items:flex-end;gap:10px;height:170px;width:100%;justify-content:center}
.ph-g-bar{width:64px;border-radius:4px 4px 0 0;position:relative}
.ph-g-val{position:absolute;top:-18px;left:50%;transform:translateX(-50%);font-size:11px;font-weight:600;color:#a9ab9e;font-variant-numeric:tabular-nums;white-space:nowrap}
.ph-g-label{font-size:12px;font-weight:600;color:#a9ab9e;text-align:center}
/* tasks */
.ph-tasks{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}
.ph-task{background:#23251d;border:1px solid #3c3e35;border-radius:6px;padding:24px;display:flex;flex-direction:column;gap:12px;position:relative}
.ph-task-top{display:flex;align-items:center;justify-content:space-between;gap:8px}
.ph-domain{font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:#f7a501}
.ph-task-desc{font-size:15px;line-height:1.6;color:#d7d8cc;flex:1;margin:0}
.ph-task-flag{font-size:13px;font-weight:600;color:#4ec99b;border-top:1px solid #2e3028;padding-top:12px}
/* closed loop */
.ph-loop-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.ph-loop-list{margin:0;padding:8px 24px 20px;list-style:none}
.ph-loop-list li{position:relative;padding:12px 0 12px 22px;font-size:15px;line-height:1.6;color:#d7d8cc;border-bottom:1px solid #2e3028}
.ph-loop-list li:last-child{border-bottom:none}
.ph-loop-list li:before{position:absolute;left:0;top:12px;font-size:13px;font-weight:700}
.ph-loop-list.ph-yes li:before{content:"✓";color:#4ec99b}
.ph-loop-list.ph-no li:before{content:"✗";color:#cd4239}
/* failure */
.ph-fail{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.ph-fail-card{background:#23251d;border:1px solid #3c3e35;border-radius:6px;padding:20px 24px;border-top:4px solid var(--fc)}
.ph-fail-name{font-size:16px;font-weight:700;color:#fff}
.ph-fail-desc{margin-top:6px;font-size:13px;line-height:1.5;color:#84867b}
.ph-fail-note{margin-top:16px;background:#23251d;border:1px solid #3c3e35;border-left:4px solid #f7a501;border-radius:6px;padding:16px 20px;font-size:13px;line-height:1.6;color:#a9ab9e}
/* method */
.ph-method-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
.ph-method-list{margin:0;padding:8px 24px 20px;list-style:none}
.ph-method-list li{position:relative;padding:12px 0 12px 22px;font-size:15px;line-height:1.6;color:#d7d8cc;border-bottom:1px solid #2e3028}
.ph-method-list li:last-child{border-bottom:none}
.ph-method-list li:before{content:"✓";position:absolute;left:0;top:12px;font-size:13px;font-weight:700;color:#4ec99b}
.ph-axes{display:flex;flex-wrap:wrap;gap:8px;padding:16px 24px 20px}
.ph-axis{padding:6px 12px;border-radius:6px;background:#2b2d25;border:1px solid #3c3e35;font-size:13px;font-weight:600;color:#d7d8cc;font-family:'Source Code Pro',ui-monospace,monospace}
.ph-code{margin:0;padding:16px 20px;font-family:'Source Code Pro',ui-monospace,Menlo,monospace;font-size:14px;line-height:1.6;color:#eeefe9;overflow-x:auto;white-space:pre;background:#15170f}
/* footer */
.ph-footer{padding:40px 0 48px}
.ph-footer-inner{display:flex;flex-wrap:wrap;align-items:center;gap:16px;font-size:13px;color:#84867b}
.ph-footer a{color:#b9bbae;font-weight:600}
.ph-footer a:hover{color:#f7a501}
@media (max-width:1024px){
  .ph-stats{grid-template-columns:repeat(3,1fr)}
  .ph-labstats{grid-template-columns:repeat(2,1fr)}
  .ph-dims{grid-template-columns:repeat(2,1fr)}
  .ph-chart-grid{grid-template-columns:1fr}
  .ph-method-grid{grid-template-columns:1fr}
  .ph-loop-grid{grid-template-columns:1fr}
  .ph-hero-grid{grid-template-columns:1fr}
  .ph-hero-hog{flex-direction:row;justify-content:flex-start}
  .ph-path{flex-direction:column}
  .ph-path-arrow{justify-content:center;transform:rotate(90deg)}
}
@media (max-width:640px){
  .ph-title{font-size:28px}
  .ph-stats{grid-template-columns:repeat(2,1fr)}
  .ph-labstats{grid-template-columns:1fr}
  .ph-dims{grid-template-columns:1fr}
  .ph-tasks{grid-template-columns:1fr}
  .ph-fail{grid-template-columns:1fr}
  .ph-bar-label{width:120px}
  .ph-section{padding:40px 0}
  .ph-hero{padding:56px 0 40px}
}
`

export default function Posthog() {
  const maxN10 = bestN10
  const gMax = Math.max(...weightsAvg.map((r) => r.value))
  return (
    <div className="style-posthog">
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700;800&family=Source+Code+Pro:wght@400;500&display=swap"
      />
      <style>{css}</style>

      {/* Nav */}
      <nav className="ph-nav">
        <div className="ph-container ph-nav-inner">
          <span className="ph-brand">
            <Hedgehog size={26} />
            RoboChem Bench
          </span>
          <span className="ph-nav-spacer" />
          <Link to="/" className="ph-back">
            ← Back to Gallery
          </Link>
          <a href="#submit" className="ph-btn ph-btn-primary">
            Submit Your Agent
          </a>
        </div>
      </nav>

      {/* Hero */}
      <header className="ph-hero">
        <div className="ph-container ph-hero-grid">
          <div>
            <p className="ph-eyebrow">Benchmark · Robotic Chemistry Lab · 2026</p>
            <h1 className="ph-title">{paperMeta.title}</h1>
            <p className="ph-subtitle">{paperMeta.subtitle}</p>
            <p className="ph-authors">
              <b>{paperMeta.authors.join(', ')}</b>
              <br />
              {paperMeta.affiliation}
            </p>
            <div className="ph-cta-row">
              {paperMeta.links.map((l, i) => (
                <a
                  key={l.label}
                  href={l.href}
                  className={`ph-btn ${i === 0 ? 'ph-btn-primary' : 'ph-btn-secondary'}`}
                  id={i === 3 ? 'submit' : undefined}
                >
                  {l.label}
                </a>
              ))}
            </div>
          </div>
          <div className="ph-hero-hog" aria-hidden>
            <div className="ph-hog-bubble">Can AI actually do science? Let's measure it.</div>
            <Hedgehog size={120} />
          </div>
        </div>
      </header>

      {/* Stats */}
      <section className="ph-section">
        <div className="ph-container">
          <div className="ph-stats">
            {keyStats.map((s) => (
              <div className="ph-stat" key={s.label}>
                <div className="ph-stat-value">{s.value}</div>
                <div className="ph-stat-label">{s.label}</div>
                <div className="ph-stat-desc">{s.description}</div>
              </div>
            ))}
          </div>
          <div className="ph-labstats">
            {labStats.map((s) => (
              <div className="ph-labstat" key={s.label}>
                <div className="ph-labstat-value">{s.value}</div>
                <div className="ph-labstat-label">{s.label}</div>
                <div className="ph-labstat-desc">{s.description}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Abstract */}
      <section className="ph-section">
        <div className="ph-container">
          <div className="ph-section-head">
            <span className="ph-eyebrow-sm">Abstract</span>
            <h2 className="ph-h2">Making scientific agency measurable</h2>
          </div>
          <div className="ph-abstract">
            <span className="ph-hog-inline" aria-hidden>
              <Hedgehog size={40} />
            </span>
            <p>{abstractText}</p>
          </div>
        </div>
      </section>

      {/* Skills Library */}
      <section className="ph-section">
        <div className="ph-container">
          <div className="ph-section-head">
            <span className="ph-eyebrow-sm">Skills library</span>
            <h2 className="ph-h2">45 workstations, one skills library</h2>
            <p className="ph-h2-sub">Every workstation is exposed to agents as a machine-readable skill.</p>
          </div>
          <div className="ph-dims">
            {skillCategories.map((d) => (
              <div className="ph-dim" key={d.name}>
                <div className="ph-dim-name">{d.name}</div>
                <div className="ph-dim-tag">{d.tagline}</div>
                <ul className="ph-dim-list">
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
      <section className="ph-section">
        <div className="ph-container">
          <div className="ph-section-head">
            <span className="ph-eyebrow-sm">Evaluation pathway</span>
            <h2 className="ph-h2">The N1 → N10 pipeline</h2>
            <p className="ph-h2-sub">Key nodes of the ten-endpoint pathway. N10 is the ultimate metric.</p>
          </div>
          <div className="ph-path">
            {pathwayStages.map((stage, si) => (
              <Fragment key={stage}>
                {si > 0 && (
                  <span className="ph-path-arrow" aria-hidden>
                    →
                  </span>
                )}
                <div className="ph-path-stage" style={{ ['--sc' as string]: stageColors[si] }}>
                  <div className="ph-path-stage-name">{stage}</div>
                  {pathway
                    .filter((n) => n.stage === stage)
                    .map((n) => (
                      <div className={`ph-path-node ${n.node === 'N10' ? 'ph-final' : ''}`} key={n.node}>
                        <div className="ph-path-node-id">{n.node}</div>
                        <div className="ph-path-node-label">{n.label}</div>
                      </div>
                    ))}
                </div>
              </Fragment>
            ))}
          </div>
          <p className="ph-path-note">{pathwayNote}</p>
        </div>
      </section>

      {/* Leaderboard */}
      <section className="ph-section">
        <div className="ph-container">
          <div className="ph-section-head">
            <span className="ph-eyebrow-sm">Leaderboard</span>
            <h2 className="ph-h2">Top 8 configurations, ranked by N10 yield</h2>
            <p className="ph-h2-sub">N10 executable yield (%). Best in yellow bold, second underlined.</p>
          </div>
          <div className="ph-panel">
            <div className="ph-panel-head">
              <span className="ph-panel-title">Overall standings</span>
              <span className="ph-panel-note">Top 8 of 48 configurations</span>
            </div>
            <div className="ph-tablewrap">
              <table className="ph-table">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Configuration</th>
                    <th>Organization</th>
                    <th>Weights</th>
                    <th className="ph-num">Trials</th>
                    <th className="ph-num">Executable</th>
                    <th className="ph-num">N10 Yield</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((r) => (
                    <tr key={r.rank}>
                      <td className="ph-rank">{r.rank}</td>
                      <td className="ph-model">
                        {r.harness} × {r.model}
                      </td>
                      <td className="ph-org">{r.org}</td>
                      <td>
                        <span className={`ph-badge ${r.weights === 'open' ? 'ph-badge-open' : 'ph-badge-closed'}`}>
                          {r.weights === 'open' ? 'Open' : 'Closed'}
                        </span>
                      </td>
                      <td className="ph-num">{r.trials}</td>
                      <td className="ph-num">{r.executable}</td>
                      <td
                        className={`ph-num ${r.n10 === bestN10 ? 'ph-cell-best' : r.n10 === secondN10 ? 'ph-cell-second' : ''}`}
                      >
                        {r.n10.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="ph-caption">{leaderboardCaption}</div>
          </div>
        </div>
      </section>

      {/* Charts */}
      <section className="ph-section">
        <div className="ph-container">
          <div className="ph-section-head">
            <span className="ph-eyebrow-sm">Results</span>
            <h2 className="ph-h2">The data, visualized</h2>
            <p className="ph-h2-sub">Open-weight systems in green, closed in olive.</p>
          </div>

          <div className="ph-panel" style={{ marginBottom: 16 }}>
            <div className="ph-panel-head">
              <span className="ph-panel-title">N10 executable yield — top 8 configurations</span>
              <span className="ph-panel-note">Expert-adjudicated (%)</span>
            </div>
            <div className="ph-bars">
              {leaderboard.map((r) => (
                <div className="ph-bar-row" key={r.rank}>
                  <span className="ph-bar-label" title={`${r.harness} × ${r.model}`}>
                    {r.harness} × {r.model}
                  </span>
                  <div className="ph-bar-track">
                    <div
                      className="ph-bar-fill"
                      style={{
                        width: `${(r.n10 / maxN10) * 100}%`,
                        background: r.weights === 'open' ? '#2c8c66' : r.rank === 1 ? '#f7a501' : '#4a4c42',
                      }}
                    />
                  </div>
                  <span className="ph-bar-value">{r.n10.toFixed(1)}</span>
                </div>
              ))}
            </div>
            <div className="ph-legend">
              <span className="ph-legend-item">
                <span className="ph-legend-dot" style={{ background: '#f7a501' }} /> Best overall
              </span>
              <span className="ph-legend-item">
                <span className="ph-legend-dot" style={{ background: '#4a4c42' }} /> Closed
              </span>
              <span className="ph-legend-item">
                <span className="ph-legend-dot" style={{ background: '#2c8c66' }} /> Open
              </span>
            </div>
          </div>

          <div className="ph-chart-grid">
            <div className="ph-panel">
              <div className="ph-panel-head">
                <span className="ph-panel-title">The long-horizon wall</span>
                <span className="ph-panel-note">{longHorizon.totalExecutable} executable workflows</span>
              </div>
              <div className="ph-wall">
                <div className="ph-wall-nums">
                  <span className="ph-wall-big">{longHorizon.longest}</span>
                  <span className="ph-wall-big-sub">operations in the longest executable workflow — only {longHorizon.over30Ops} of {longHorizon.totalExecutable} exceeded 30</span>
                </div>
                <div className="ph-wall-grid" role="img" aria-label="148 of 151 executable workflows have at most 30 operations; 3 exceed 30">
                  {Array.from({ length: longHorizon.totalExecutable }, (_, i) => (
                    <span key={i} className={`ph-wall-cell ${i < longHorizon.over30Ops ? 'ph-over' : ''}`} />
                  ))}
                </div>
                <div className="ph-wall-legend">
                  <span className="ph-legend-item">
                    <span className="ph-legend-dot" style={{ background: '#f7a501' }} /> &gt;30 operations ({longHorizon.over30Ops})
                  </span>
                  <span className="ph-legend-item">
                    <span className="ph-legend-dot" style={{ background: '#33352c' }} /> ≤30 operations ({longHorizon.totalExecutable - longHorizon.over30Ops})
                  </span>
                </div>
                <p className="ph-wall-note">{longHorizon.note}</p>
              </div>
            </div>

            <div className="ph-panel">
              <div className="ph-panel-head">
                <span className="ph-panel-title">Open vs Closed weights — mean N10</span>
              </div>
              <div className="ph-grouped">
                {weightsAvg.map((row) => (
                  <div className="ph-g-group" key={row.group}>
                    <div className="ph-g-bars">
                      <div
                        className="ph-g-bar"
                        style={{
                          height: `${(row.value / gMax) * 100}%`,
                          background: row.group.startsWith('Open') ? '#2c8c66' : '#f7a501',
                        }}
                      >
                        <span className="ph-g-val">{row.value.toFixed(1)}%</span>
                      </div>
                    </div>
                    <span className="ph-g-label">
                      {row.group} · n={row.n}
                    </span>
                  </div>
                ))}
              </div>
              <div className="ph-legend">
                <span className="ph-legend-item">
                  <span className="ph-legend-dot" style={{ background: '#2c8c66' }} /> Open avg
                </span>
                <span className="ph-legend-item">
                  <span className="ph-legend-dot" style={{ background: '#f7a501' }} /> Closed avg
                </span>
              </div>
              <div className="ph-caption" style={{ borderTop: 'none' }}>{weightsAvgCaption}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Task domains */}
      <section className="ph-section">
        <div className="ph-container">
          <div className="ph-section-head">
            <span className="ph-eyebrow-sm">Tasks</span>
            <h2 className="ph-h2">Four task domains, 32 tasks</h2>
          </div>
          <div className="ph-tasks">
            {taskDomains.map((t) => (
              <div className="ph-task" key={t.domain}>
                <div className="ph-task-top">
                  <span className="ph-domain">{t.domain}</span>
                </div>
                <p className="ph-task-desc">{t.blurb}</p>
                {t.domain === 'Electrocatalysis' && <div className="ph-task-flag">↻ Closed-loop study domain</div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Closed-loop adaptation */}
      <section className="ph-section">
        <div className="ph-container">
          <div className="ph-section-head">
            <span className="ph-eyebrow-sm">Closed-loop adaptation</span>
            <h2 className="ph-h2">Agents tweak knobs, they don't rethink</h2>
            <p className="ph-h2-sub">
              {closedLoop.agent} · {closedLoop.task} · {closedLoop.rounds} feedback rounds
            </p>
          </div>
          <div className="ph-loop-grid">
            <div className="ph-panel">
              <div className="ph-panel-head">
                <span className="ph-panel-title">Localized adaptation observed</span>
              </div>
              <ul className="ph-loop-list ph-yes">
                {closedLoop.adapted.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
            <div className="ph-panel">
              <div className="ph-panel-head">
                <span className="ph-panel-title">Strategic redirection not observed</span>
              </div>
              <ul className="ph-loop-list ph-no">
                {closedLoop.notObserved.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Failure modes */}
      <section className="ph-section">
        <div className="ph-container">
          <div className="ph-section-head">
            <span className="ph-eyebrow-sm">Failure analysis</span>
            <h2 className="ph-h2">Where agents break</h2>
            <p className="ph-h2-sub">Four recurring failure categories, identified by node-level adjudication.</p>
          </div>
          <div className="ph-fail">
            {failureModes.map((f, i) => (
              <div className="ph-fail-card" key={f.name} style={{ ['--fc' as string]: failColors[i] }}>
                <span className="ph-fail-name">{f.name}</span>
                <p className="ph-fail-desc">{f.description}</p>
              </div>
            ))}
          </div>
          <div className="ph-fail-note">{failureNote}</div>
        </div>
      </section>

      {/* Methodology + BibTeX */}
      <section className="ph-section">
        <div className="ph-container">
          <div className="ph-section-head">
            <span className="ph-eyebrow-sm">Methodology & citation</span>
            <h2 className="ph-h2">How we measured it</h2>
          </div>
          <div className="ph-method-grid">
            <div className="ph-panel">
              <div className="ph-panel-head">
                <span className="ph-panel-title">Scoring rubric — multi-axis R1–R6</span>
              </div>
              <div className="ph-axes">
                {scoringAxes.map((a) => (
                  <span className="ph-axis" key={a}>
                    {a}
                  </span>
                ))}
              </div>
              <div className="ph-panel-head" style={{ borderTop: '1px solid #3c3e35' }}>
                <span className="ph-panel-title">Formulas</span>
              </div>
              <pre className="ph-code">{formulas.join('\n')}</pre>
            </div>
            <div className="ph-panel">
              <div className="ph-panel-head">
                <span className="ph-panel-title">Methodology notes</span>
              </div>
              <ul className="ph-method-list">
                {methodologyNotes.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </div>
            <div className="ph-panel" style={{ gridColumn: '1 / -1' }}>
              <div className="ph-panel-head">
                <span className="ph-panel-title">citation.bib</span>
                <span className="ph-panel-note">BibTeX</span>
              </div>
              <pre className="ph-code">{bibtex}</pre>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="ph-footer">
        <div className="ph-container ph-footer-inner">
          <span className="ph-brand">
            <Hedgehog size={24} />
            RoboChem Bench
          </span>
          <span>Style preview · PostHog DESIGN.md · Content from arXiv:2607.23045</span>
          <span style={{ flex: 1 }} />
          <Link to="/">← Back to Gallery</Link>
        </div>
      </footer>
    </div>
  )
}
