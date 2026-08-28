import { useState } from 'react'
import type { ReactNode } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  Beaker,
  BookOpen,
  Check,
  ChevronDown,
  CircleHelp,
  Database,
  ExternalLink,
  FileText,
  FlaskConical,
  Github,
  Menu,
  Network,
  Scale,
  X,
} from 'lucide-react'
import {
  abstractText,
  bestNodeRates,
  bibtex,
  closedLoop,
  domains,
  failureModes,
  headlineStats,
  labStats,
  leaderboard,
  leaderboardCaption,
  longHorizon,
  methodology,
  paperMeta,
  pathway,
  pathwayGroups,
  pathwayNote,
  provenance,
  scoring,
  skillCategories,
  stageCounts,
} from '@/data/paperData'

const maxN10 = Math.max(...leaderboard.map((row) => row.n10))

const navItems = [
  { href: '#overview', label: 'Overview' },
  { href: '#benchmark', label: 'Benchmark' },
  { href: '#results', label: 'Results' },
  { href: '#closed-loop', label: 'Closed loop' },
  { href: '#methods', label: 'Methods' },
]

function SectionHeading({ eyebrow, title, children }: { eyebrow: string; title: string; children?: ReactNode }) {
  return (
    <div className="section-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
      </div>
      {children}
    </div>
  )
}

function ExternalButton({ href, label, primary = false, icon }: { href: string; label: string; primary?: boolean; icon: ReactNode }) {
  return (
    <a className={`button ${primary ? 'button-primary' : 'button-secondary'}`} href={href} target="_blank" rel="noreferrer">
      {icon}
      <span>{label}</span>
      <ExternalLink size={14} aria-hidden="true" />
    </a>
  )
}

export default function Paper() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="paper-site">
      <header className="site-header">
        <div className="site-header-inner">
          <a className="wordmark" href="#overview" aria-label="LabBench paper home" onClick={() => setMenuOpen(false)}>
            <span className="wordmark-mark" aria-hidden="true"><span /></span>
            <span>LabBench</span>
            <span className="wordmark-suffix">/ paper</span>
          </a>
          <nav className={`site-nav ${menuOpen ? 'site-nav-open' : ''}`} aria-label="Paper sections">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>{item.label}</a>
            ))}
          </nav>
          <div className="header-actions">
            <a className="header-link" href={paperMeta.links[0].href} target="_blank" rel="noreferrer">arXiv <ArrowUpRight size={14} /></a>
            <a className="header-repo" href={paperMeta.links[1].href} target="_blank" rel="noreferrer"><Github size={15} /> Repository</a>
          </div>
          <button
            className="menu-toggle"
            type="button"
            aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
            title={menuOpen ? 'Close navigation' : 'Open navigation'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </header>

      <main>
        <section id="overview" className="hero-section">
          <div className="page-width hero-grid">
            <div className="hero-copy">
              <div className="eyebrow-row">
                <span className="status-dot" aria-hidden="true" />
                <span className="eyebrow">Research article · {paperMeta.identifier}</span>
              </div>
              <h1>{paperMeta.title}</h1>
              <p className="hero-subtitle">{paperMeta.subtitle}</p>
              <p className="author-line">{paperMeta.authors.join(' · ')}</p>
              <p className="affiliation-line">{paperMeta.affiliations.join(' · ')}</p>
              <div className="hero-actions">
                <ExternalButton href={paperMeta.links[0].href} label="Read the paper" primary icon={<FileText size={16} />} />
                <ExternalButton href={paperMeta.links[1].href} label="LabBench repository" icon={<Github size={16} />} />
              </div>
              <div className="hero-footnote">
                <span>Data checked against manuscript + Data S3 / S4</span>
                <span className="mono">27 AUG 2026</span>
              </div>
            </div>
            <div className="hero-readout" aria-label="Benchmark snapshot">
              <div className="readout-topline">
                <span className="mono">LABBENCH / BENCHMARK SNAPSHOT</span>
                <span className="readout-live"><span className="status-dot" /> verified</span>
              </div>
              <div className="readout-title">Assignment → expert gate</div>
              <div className="readout-value">3.3<span>%</span></div>
              <div className="readout-label">of assigned trials reached an executable workflow</div>
              <div className="readout-track"><span style={{ width: '3.3%' }} /></div>
              <div className="readout-rows">
                <div><span>assigned</span><strong>4,608</strong></div>
                <div><span>verified dispatch / N9</span><strong>607</strong></div>
                <div><span>expert executable / N10</span><strong>151</strong></div>
              </div>
              <div className="readout-note"><CircleHelp size={14} /> N10 uses a fixed denominator of 96 trials per configuration.</div>
            </div>
          </div>
          <div className="page-width hero-stats" aria-label="Headline results">
            {headlineStats.map((stat) => (
              <div className={`headline-stat tone-${stat.tone ?? 'dark'}`} key={stat.label}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
                <small>{stat.detail}</small>
              </div>
            ))}
          </div>
        </section>

        <section className="section section-tint">
          <div className="page-width abstract-grid">
            <div className="abstract-copy">
              <p className="eyebrow">Abstract</p>
              <p className="abstract-text">{abstractText}</p>
            </div>
            <aside className="finding-panel">
              <div className="finding-panel-head"><span className="mono">KEY FINDING</span><ArrowDownRight size={18} /></div>
              <p>Physical execution, rather than fluent planning alone, is the decisive boundary.</p>
              <div className="finding-rule" />
              <div className="finding-metric"><strong>28.1%</strong><span>best observed configuration<br />Claude Code × Opus 4.7</span></div>
              <div className="finding-metric"><strong>3 / 151</strong><span>executable workflows<br />exceeded 30 operations</span></div>
            </aside>
          </div>
        </section>

        <section id="benchmark" className="section">
          <div className="page-width">
            <SectionHeading eyebrow="01 · Platform" title="A lab exposed as contracts, not a black box">
              <p className="heading-note">45 formal workstations · 62 operations · 433 constraints · 456 parameters</p>
            </SectionHeading>
            <div className="platform-grid">
              <figure className="figure-frame figure-platform">
                <img src="/assets/main-figure-1.png" alt="Skills library and robotic chemistry laboratory architecture" />
                <figcaption><span>Fig. 1</span> Skills library, orchestration layer and robotic chemistry laboratory capability abstraction.</figcaption>
              </figure>
              <div className="skill-grid">
                {skillCategories.map((skill, index) => (
                  <article className="skill-item" key={skill.name}>
                    <div className="item-index">0{index + 1}</div>
                    <div>
                      <div className="item-meta">{skill.eyebrow}</div>
                      <h3>{skill.name}</h3>
                      <p>{skill.description}</p>
                      <ul>
                        {skill.items.map((item) => <li key={item}><Check size={14} />{item}</li>)}
                      </ul>
                    </div>
                  </article>
                ))}
              </div>
            </div>
            <div className="lab-stats-row">
              {labStats.map((stat) => (
                <div className="lab-stat" key={stat.label}>
                  <strong>{stat.value}</strong>
                  <span>{stat.label}</span>
                  <small>{stat.detail}</small>
                </div>
              ))}
            </div>
            <div className="design-space-note"><Scale size={16} /><span><strong>6.71 × 10⁶</strong> is a restricted device-combination estimate for the represented synthesis, post-processing, testing and characterization stages; it is not a count of validated executable workflows.</span></div>
          </div>
        </section>

        <section className="section section-tint">
          <div className="page-width">
            <SectionHeading eyebrow="02 · Evaluation pathway" title="Every plan crosses ten observable gates">
              <div className="legend-inline"><span className="legend-key key-design" /> design <span className="legend-key key-validation" /> validation <span className="legend-key key-execution" /> execution</div>
            </SectionHeading>
            <div className="pathway-grid">
              {pathwayGroups.map((group) => (
                <div className={`pathway-group pathway-${group.key}`} key={group.key}>
                  <div className="pathway-group-title"><span>{group.label}</span><span className="mono">{pathway.filter((node) => node.group === group.key).length} gates</span></div>
                  <div className="pathway-nodes">
                    {pathway.filter((node) => node.group === group.key).map((node) => (
                      <div className={`pathway-node ${node.node === 'N10' ? 'pathway-node-final' : ''}`} key={node.node}>
                        <span className="mono node-id">{node.node}</span>
                        <strong>{node.label}</strong>
                        <small>{node.note}</small>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="section-note pathway-note"><CircleHelp size={15} /> {pathwayNote}</p>
          </div>
        </section>

        <section id="results" className="section">
          <div className="page-width">
            <SectionHeading eyebrow="03 · Results" title="The fixed denominator makes the drop visible">
              <p className="heading-note">All rates below retain the 96-trial assignment denominator.</p>
            </SectionHeading>
            <div className="stage-grid">
              {stageCounts.map((stage) => (
                <div className="stage-card" key={stage.label}>
                  <div className="stage-card-top"><span>{stage.label}</span><strong>{stage.count.toLocaleString()}</strong></div>
                  <div className={`stage-bar stage-${stage.accent}`}><span style={{ width: `${(stage.count / stage.denominator) * 100}%` }} /></div>
                  <small>{stage.detail}</small>
                </div>
              ))}
            </div>

            <div className="results-split">
              <div className="result-panel">
                <div className="panel-heading"><div><p className="eyebrow">Fig. 3a · N10</p><h3>Top 8 configurations</h3></div><BarChart3 size={20} /></div>
                <div className="bar-chart">
                  {leaderboard.map((row) => (
                    <div className="bar-row" key={`${row.harness}-${row.model}`}>
                      <div className="bar-label"><span className="mono">{String(row.rank).padStart(2, '0')}</span><strong>{row.harness}</strong><span>{row.model}</span></div>
                      <div className="bar-track"><span className={row.rank === 1 ? 'bar-fill bar-fill-best' : 'bar-fill'} style={{ width: `${(row.n10 / maxN10) * 100}%` }} /></div>
                      <strong className="bar-value">{row.n10.toFixed(1)}%</strong>
                    </div>
                  ))}
                </div>
                <p className="panel-caption">N10 is expert-adjudicated executability, not a model-judge score. Open-weight rows are marked with a green key.</p>
              </div>
              <div className="result-panel node-panel">
                <div className="panel-heading"><div><p className="eyebrow">Fig. 3f · Node profile</p><h3>Best configuration, N1 → N10</h3></div><Network size={20} /></div>
                <div className="node-chart">
                  {bestNodeRates.map((node) => (
                    <div className="node-row" key={node.node}>
                      <span className="mono">{node.node}</span>
                      <div className="node-track"><span style={{ width: `${node.rate}%` }} /></div>
                      <span className="node-rate">{node.rate.toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
                <p className="panel-caption">Claude Code × Opus 4.7. N8 system review and N9 dispatch are the visible retention boundary before expert assessment.</p>
              </div>
            </div>

            <div className="table-heading"><div><p className="eyebrow">Fixed-denominator ranking</p><h3>Executable yield by observed configuration</h3></div><span className="table-chip">48 total · 8 shown</span></div>
            <div className="table-frame">
              <div className="table-scroll">
                <table>
                  <thead><tr><th>Rank</th><th>Harness × model</th><th>Organization</th><th>Weights</th><th>Dispatch / 96</th><th>N10 / 96</th><th>Yield</th></tr></thead>
                  <tbody>
                    {leaderboard.map((row) => (
                      <tr key={`table-${row.rank}`} className={row.rank === 1 ? 'row-best' : ''}>
                        <td className="mono">{String(row.rank).padStart(2, '0')}</td>
                        <td><strong>{row.harness}</strong><span className="table-model">{row.model}</span></td>
                        <td className="muted">{row.org}</td>
                        <td><span className={`weight-pill weight-${row.weights}`}>{row.weights === 'open' ? 'Open' : 'Closed'}</span></td>
                        <td className="mono">{row.dispatches} / {row.trials}</td>
                        <td className="mono">{row.executable} / {row.trials}</td>
                        <td className="yield-cell">{row.n10.toFixed(1)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="table-caption">{leaderboardCaption}</p>
            </div>

            <div className="figure-gallery">
              <figure className="figure-frame">
                <img src="/assets/main-figure-2.png" alt="Benchmark task and workflow validation schematic" loading="lazy" />
                <figcaption><span>Fig. 2</span> Task parsing, skill selection, workflow validation and dispatch boundary.</figcaption>
              </figure>
              <figure className="figure-frame">
                <img src="/assets/main-figure-3.png" alt="Scoring rubric and configuration results" loading="lazy" />
                <figcaption><span>Fig. 3</span> Scoring definitions and the observed harness–model configuration matrix.</figcaption>
              </figure>
            </div>
          </div>
        </section>

        <section className="section section-tint">
          <div className="page-width">
            <SectionHeading eyebrow="04 · Long horizon" title="Long plans meet a physical constraint wall">
              <p className="heading-note">151 workflows received an expert executability label.</p>
            </SectionHeading>
            <div className="horizon-grid">
              <div className="horizon-callout"><span className="mono">MAX WORKSTATION OPERATIONS</span><strong>{longHorizon.longest}</strong><p>Observed range {longHorizon.observedRange}. Only {longHorizon.over30Ops} executable workflows exceeded 30 operations.</p></div>
              <div className="horizon-visual"><div className="horizon-axis"><span>0</span><span>30</span><span>44 ops</span></div><div className="horizon-line"><span className="horizon-marker horizon-threshold" /><span className="horizon-marker horizon-end" /></div><div className="horizon-labels"><span>common executable plans</span><span>longest observed plan</span></div><p className="section-note">{longHorizon.note}</p></div>
            </div>
          </div>
        </section>

        <section className="section">
          <div className="page-width">
            <SectionHeading eyebrow="05 · Task suite" title="32 prompts across four catalysis domains">
              <p className="heading-note">Eight tasks per domain · every configuration saw the same prompt set.</p>
            </SectionHeading>
            <div className="domain-list">
              {domains.map((domain, index) => (
                <article className="domain-row" key={domain.name}>
                  <span className="domain-index mono">0{index + 1}</span>
                  <div className="domain-name"><Beaker size={17} /><h3>{domain.name}</h3></div>
                  <p>{domain.description}</p>
                  <strong>{domain.count}<small> tasks</small></strong>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="closed-loop" className="section section-tint">
          <div className="page-width">
            <SectionHeading eyebrow="06 · Closed-loop study" title="Feedback changed parameters locally, not the workflow strategy">
              <div className="closed-loop-meta"><span className="mono">{closedLoop.agent}</span><span>{closedLoop.task}</span></div>
            </SectionHeading>
            <div className="loop-layout">
              <div className="loop-chart-panel">
                <div className="panel-heading"><div><p className="eyebrow">Fig. 4 · Planning trajectory</p><h3>Five rounds, same process backbone</h3></div><FlaskConical size={20} /></div>
                <div className="loop-chart">
                  {closedLoop.rounds.map((round) => (
                    <div className="round-column" key={round.round}>
                      <div className="round-values"><strong>{round.nodes}</strong><span>nodes</span></div>
                      <div className="round-bar-wrap"><span className="round-bar" style={{ height: `${(round.nodes / 23) * 100}%` }} /></div>
                      <span className="mono round-label">{round.round}</span>
                      <small>{round.formulations} formulations</small>
                    </div>
                  ))}
                </div>
                <div className="loop-axis"><span>workflow nodes, excluding start/end</span><span>R1 → R5</span></div>
              </div>
              <div className="loop-status-panel">
                <p className="eyebrow">Round audit</p>
                <div className="round-status-list">
                  {closedLoop.rounds.map((round) => <div className="round-status" key={`status-${round.round}`}><span className="mono">{round.round}</span><p>{round.status}</p></div>)}
                </div>
              </div>
            </div>
            <div className="adaptation-grid">
              <div className="adaptation-panel adaptation-positive"><div className="adaptation-title"><Check size={17} /> Local adjustments observed</div><ul>{closedLoop.adapted.map((item) => <li key={item}>{item}</li>)}</ul></div>
              <div className="adaptation-panel adaptation-negative"><div className="adaptation-title"><ArrowDownRight size={17} /> Not observed</div><ul>{closedLoop.notObserved.map((item) => <li key={item}>{item}</li>)}</ul></div>
            </div>
            <figure className="figure-frame loop-figure"><img src="/assets/main-figure-4.png" alt="Five-round open-ended catalyst development trajectory" loading="lazy" /><figcaption><span>Fig. 4</span> Open-ended discovery task: planning scope, formulation changes and returned evidence across rounds.</figcaption></figure>
          </div>
        </section>

        <section className="section">
          <div className="page-width">
            <SectionHeading eyebrow="07 · Failure analysis" title="Where plausible science becomes non-executable">
              <p className="heading-note">The paper reports failure categories, not category-level percentages.</p>
            </SectionHeading>
            <div className="failure-list">
              {failureModes.map((failure, index) => (
                <article className="failure-row" key={failure.name}><span className="failure-index mono">0{index + 1}</span><div><h3>{failure.name}</h3><p>{failure.example}</p></div><ArrowUpRight size={17} /></article>
              ))}
            </div>
            <div className="failure-callout"><Database size={17} /><p><strong>N8 system review is the major bottleneck.</strong> Agents often produce scientifically plausible plans, but strict state, parameter and schema rules determine whether those plans can enter the physical workflow.</p></div>
          </div>
        </section>

        <section id="methods" className="section section-tint">
          <div className="page-width methods-grid">
            <div>
              <SectionHeading eyebrow="08 · Methods" title="How the benchmark was run" />
              <ol className="method-list">{methodology.map((item, index) => <li key={item}><span className="mono">{String(index + 1).padStart(2, '0')}</span><p>{item}</p></li>)}</ol>
              <div className="scoring-block"><div className="panel-heading"><div><p className="eyebrow">Scoring contract</p><h3>Fixed coefficients, explicit axes</h3></div><Scale size={20} /></div><div className="axis-grid">{scoring.axes.map(([key, label]) => <div key={key}><span className="mono">{key}</span><span>{label}</span></div>)}</div><pre>{`${scoring.semantic}\n${scoring.dispatch}`}</pre></div>
            </div>
            <div className="provenance-column">
              <SectionHeading eyebrow="Data provenance" title="Numbers are traceable to the supplied materials" />
              <div className="provenance-list">{provenance.map((item) => <div className="provenance-row" key={item.label}><span>{item.label}</span><strong>{item.value}</strong></div>)}</div>
              <details className="definitions"><summary>Read outcome definitions <ChevronDown size={16} /></summary><div><p><strong>Final JSON:</strong> a plan materialized at a prescribed output path.</p><p><strong>Verified dispatch / N9:</strong> at least one numerical task identifier resolved to a laboratory task record or associated evidence.</p><p><strong>Executable / N10:</strong> a verified-dispatch row independently adjudicated executable under the available laboratory constraints.</p><p>Trials without N9 were not eligible for manual assessment and contribute zero to the fixed-denominator N10 yield.</p></div></details>
              <div className="citation-block"><div className="panel-heading"><div><p className="eyebrow">Citation</p><h3>Use this record</h3></div><BookOpen size={20} /></div><pre>{bibtex}</pre></div>
            </div>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <div className="page-width footer-grid">
          <div><a className="wordmark" href="#overview"><span className="wordmark-mark" aria-hidden="true"><span /></span><span>LabBench</span><span className="wordmark-suffix">/ paper</span></a><p>A paper website for source-aligned review of physical scientific agency.</p></div>
          <div className="footer-links"><span className="eyebrow">Navigate</span>{navItems.map((item) => <a key={`footer-${item.href}`} href={item.href}>{item.label}</a>)}</div>
          <div className="footer-links"><span className="eyebrow">External</span><a href={paperMeta.links[0].href} target="_blank" rel="noreferrer">arXiv <ArrowUpRight size={14} /></a><a href={paperMeta.links[1].href} target="_blank" rel="noreferrer">GitHub <ArrowUpRight size={14} /></a></div>
        </div>
        <div className="page-width footer-bottom"><span>Stress-testing large language model agents in a robotic chemistry laboratory</span><span className="mono">ARXIV:2607.23045</span></div>
      </footer>
    </div>
  )
}
