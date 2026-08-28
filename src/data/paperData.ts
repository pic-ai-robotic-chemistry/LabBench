// Source-aligned content for the paper website.
// Primary sources: MS_Guo_Science.docx, Data_S3.xlsx and Data_S4.xlsx.

export interface PaperLink {
  label: string
  href: string
  kind: 'primary' | 'secondary'
}

export const paperMeta = {
  title: 'Stress-testing large language model agents in a robotic chemistry laboratory',
  subtitle:
    'A physical-world benchmark of scientific agency across machine-readable skills, workflow validation and expert-adjudicated execution.',
  authors: [
    'Lulu Guo',
    'Yingkai Sun',
    'Xiaobo Li',
    'Luyao Ge',
    'Ziming Wang',
    'Haitao Zheng',
    'Jingyu Li',
    'Huijuan Zhang',
    'Bingxu Chen',
    'Daobin Liu',
    'Yuebo Liu',
    'Jie Li',
    'Xiaohui Li',
    'Linjiang Chen',
    'Yi Luo',
    'Jun Jiang',
  ],
  affiliations: [
    'University of Science and Technology of China',
    'Center for Scientific Intelligence Innovation',
    'University of Birmingham',
  ],
  identifier: 'arXiv:2607.23045',
  links: [
    { label: 'Read the paper', href: 'https://arxiv.org/abs/2607.23045', kind: 'primary' },
    { label: 'LabBench repository', href: 'https://github.com/pic-ai-robotic-chemistry/LabBench', kind: 'secondary' },
  ] satisfies PaperLink[],
}

export interface Stat {
  value: string
  label: string
  detail: string
  tone?: 'dark' | 'green' | 'orange'
}

export const headlineStats: Stat[] = [
  { value: '4,608', label: 'retained trials', detail: '48 configurations × 32 tasks × 3 repeats', tone: 'dark' },
  { value: '151', label: 'executable workflows', detail: 'expert-adjudicated at N10', tone: 'green' },
  { value: '3.3%', label: 'end-to-end yield', detail: '151 / 4,608 assigned trials', tone: 'orange' },
  { value: '44', label: 'longest workflow', detail: 'workstation operations', tone: 'dark' },
]

export const labStats: Stat[] = [
  { value: '45', label: 'formal workstations', detail: 'machine-readable skill contracts' },
  { value: '62', label: 'operations', detail: 'distinct workstation operations' },
  { value: '433', label: 'constraints', detail: 'physical, state and system rules' },
  { value: '456', label: 'parameters', detail: 'typed and range-checked fields' },
  { value: '6.71 × 10⁶', label: 'device-combination families', detail: 'restricted design-space estimate' },
]

export const abstractText =
  'AI is evaluated through knowledge, reasoning and plan generation, yet scientific agency requires reliable physical action and adaptation to evidence. Here, we use a robotic chemistry laboratory as a physical-world testbed to make scientific agency measurable. Its 45 modular workstations exposed as machine-readable skills enabled 4,608 trials. Only 3.3% of trials produced expert-assessed executable workflows under laboratory constraints; even the best system achieved 28.1%. Long-horizon planning remained a challenge: only three executable workflows exceeded 30 operations, although the longest contained 44. Across five rounds, experimental feedback prompted local adjustments but no workflow-level replanning or analytical-method redesign. By making physical executability and evidence-driven replanning measurable, our study provides an evidence-based assessment of deployment readiness and a diagnostic framework to guide closed-loop improvements towards physically grounded autonomous research.'

export interface SkillCategory {
  name: string
  eyebrow: string
  description: string
  items: string[]
}

export const skillCategories: SkillCategory[] = [
  {
    name: 'System skills',
    eyebrow: 'Orchestration',
    description: 'The control plane keeps laboratory identity, task dispatch and workflow compilation explicit.',
    items: ['Lab-operation: access, task creation and result metadata', 'Workflow-generator: ordered JSON compilation', 'Audit trail: parameters, states and validation errors'],
  },
  {
    name: 'Synthesis skills',
    eyebrow: 'Material preparation',
    description: 'Agents select operations from typed contracts rather than issuing direct instrument commands.',
    items: ['Liquid handling and solid weighing', 'Centrifugation, purification and drying', 'Heating, stirring and redispersion'],
  },
  {
    name: 'Reaction & testing',
    eyebrow: 'Catalysis evaluation',
    description: 'The suite spans electro-, photo- and thermocatalytic testing with downstream analysis.',
    items: ['Electrocatalytic and photocatalytic stations', 'Thermocatalytic reaction stations', 'Gas chromatography and electrochemical readouts'],
  },
  {
    name: 'Characterization skills',
    eyebrow: 'Evidence return',
    description: 'Characterization stations expose sample-state requirements and machine-readable outputs.',
    items: ['XRD and FTIR spectroscopy', 'UV–Vis spectroscopy and microplate reading', 'Container identity and transfer-state continuity'],
  },
]

export interface PathwayNode {
  node: string
  label: string
  group: 'design' | 'validation' | 'execution'
  note: string
}

export const pathwayGroups = [
  { key: 'design', label: 'I · Experimental design' },
  { key: 'validation', label: 'II · Machine validation & dispatch' },
  { key: 'execution', label: 'III · Physical execution' },
] as const

export const pathway: PathwayNode[] = [
  { node: 'N1', label: 'Tasks', group: 'design', note: 'valid task metadata' },
  { node: 'N2', label: 'Lab context', group: 'design', note: 'context evidence or allowed inference' },
  { node: 'N3', label: 'Get station', group: 'design', note: 'specific skill or allowed inference' },
  { node: 'N4', label: 'Generate experiment', group: 'design', note: 'stepwise plan or allowed inference' },
  { node: 'N5', label: 'Review skill', group: 'validation', note: 'recorded audit evidence' },
  { node: 'N6', label: 'Standard JSON', group: 'validation', note: 'valid JSON or allowed inference' },
  { node: 'N7', label: 'Workflow entry', group: 'validation', note: 'generator entry or attempt' },
  { node: 'N8', label: 'System review', group: 'validation', note: 'success or success_with_warning' },
  { node: 'N9', label: 'Lab dispatch', group: 'validation', note: 'verified final task_id' },
  { node: 'N10', label: 'Expert assessment', group: 'execution', note: 'physically executable under constraints' },
]

export const pathwayNote =
  'N9 is a verified dispatch: a numerical task identifier resolved through the laboratory task-query interface. N10 is a separate expert adjudication of the dispatched workflow. A trial that did not reach N9 was not eligible for manual assessment and contributes zero to the fixed-denominator N10 yield.'

export interface StageCount {
  label: string
  count: number
  denominator: number
  detail: string
  accent: 'dark' | 'blue' | 'orange' | 'green'
}

export const stageCounts: StageCount[] = [
  { label: 'Assigned trials', count: 4608, denominator: 4608, detail: 'all retained benchmark records', accent: 'dark' },
  { label: 'Final JSON plans', count: 2596, denominator: 4608, detail: 'materialized at a prescribed output path', accent: 'blue' },
  { label: 'Verified dispatches', count: 607, denominator: 4608, detail: 'N9 task IDs verified through the lab interface', accent: 'orange' },
  { label: 'Executable workflows', count: 151, denominator: 4608, detail: 'N10 expert labels; fixed denominator', accent: 'green' },
]

export type Weights = 'open' | 'closed'

export interface LeaderboardRow {
  rank: number
  harness: string
  model: string
  org: string
  weights: Weights
  trials: number
  dispatches: number
  executable: number
  n10: number
}

export const leaderboard: LeaderboardRow[] = [
  { rank: 1, harness: 'Claude Code', model: 'Opus 4.7', org: 'Anthropic', weights: 'closed', trials: 96, dispatches: 50, executable: 27, n10: 28.1 },
  { rank: 2, harness: 'Codex', model: 'GPT 5.5', org: 'OpenAI', weights: 'closed', trials: 96, dispatches: 45, executable: 19, n10: 19.8 },
  { rank: 3, harness: 'Hermes', model: 'GPT 5.5', org: 'OpenAI', weights: 'closed', trials: 96, dispatches: 33, executable: 16, n10: 16.7 },
  { rank: 4, harness: 'Hermes', model: 'Qwen3.7 Max', org: 'Alibaba', weights: 'closed', trials: 96, dispatches: 20, executable: 9, n10: 9.4 },
  { rank: 5, harness: 'OpenClaw', model: 'Gemini 3.5 Flash', org: 'Google', weights: 'closed', trials: 96, dispatches: 23, executable: 8, n10: 8.3 },
  { rank: 6, harness: 'OpenClaw', model: 'Qwen3.7 Max', org: 'Alibaba', weights: 'closed', trials: 96, dispatches: 41, executable: 7, n10: 7.3 },
  { rank: 7, harness: 'Hermes', model: 'GLM 5.1', org: 'Zhipu', weights: 'open', trials: 96, dispatches: 12, executable: 6, n10: 6.3 },
  { rank: 8, harness: 'Kilo Code', model: 'Gemini 3.5 Flash', org: 'Google', weights: 'closed', trials: 96, dispatches: 33, executable: 5, n10: 5.2 },
]

export const leaderboardCaption =
  'Top 8 of 48 observed harness–model configurations. Every configuration received the same 32 task prompts with three retained repeats per task, so the N10 denominator is fixed at 96.'

export interface NodeRate {
  node: string
  label: string
  count: number
  rate: number
}

export const bestNodeRates: NodeRate[] = [
  { node: 'N1', label: 'Tasks', count: 96, rate: 100 },
  { node: 'N2', label: 'Lab context', count: 96, rate: 100 },
  { node: 'N3', label: 'Get station', count: 96, rate: 100 },
  { node: 'N4', label: 'Generate exp', count: 96, rate: 100 },
  { node: 'N5', label: 'Review skill', count: 92, rate: 95.8 },
  { node: 'N6', label: 'Standard JSON', count: 96, rate: 100 },
  { node: 'N7', label: 'Workflow entry', count: 96, rate: 100 },
  { node: 'N8', label: 'System review', count: 69, rate: 71.9 },
  { node: 'N9', label: 'Lab dispatch', count: 50, rate: 52.1 },
  { node: 'N10', label: 'Expert assessment', count: 27, rate: 28.1 },
]

export interface Domain {
  name: string
  count: number
  description: string
}

export const domains: Domain[] = [
  { name: 'Electrocatalysis', count: 8, description: 'Oxygen evolution, hydrogen evolution, urea oxidation and ethanol oxidation.' },
  { name: 'Electrode materials & testing', count: 8, description: 'Cyclic voltammetry, impedance spectroscopy and ion-storage measurements.' },
  { name: 'Photocatalysis', count: 8, description: 'Hydrogen, hydrogen peroxide and selective oxidation studies.' },
  { name: 'Thermal catalysis', count: 8, description: 'Selective hydrogenation and associated synthesis, analysis and controls.' },
]

export const longHorizon = {
  totalExecutable: 151,
  over30Ops: 3,
  longest: 44,
  observedRange: '3–44',
  note: 'Only three executable workflows exceeded 30 workstation operations. Workflow length counts workstation nodes and excludes process-control start/end nodes.',
}

export interface ClosedLoopRound {
  round: string
  nodes: number
  formulations: number
  status: string
}

export const closedLoop = {
  agent: 'Codex × GPT 5.5',
  task: 'Open-ended catalyst development for urea oxidation',
  rounds: [
    { round: 'R1', nodes: 21, formulations: 6, status: 'Data returned; researcher noted insufficient recovered product for reliable testing' },
    { round: 'R2', nodes: 23, formulations: 4, status: 'Downstream characterization and electrochemical traces returned' },
    { round: 'R3', nodes: 23, formulations: 6, status: 'Linked UV–Vis and electrochemical evidence assembled' },
    { round: 'R4', nodes: 23, formulations: 5, status: 'Main and linked supplementary results returned' },
    { round: 'R5', nodes: 23, formulations: 5, status: 'Dispatch succeeded; task was not started at audit time' },
  ] satisfies ClosedLoopRound[],
  adapted: ['Metal concentrations and dosing', 'Reaction times', 'Centrifugation speed, drying and redispersion'],
  notObserved: ['Workflow-level replanning', 'Analytical-method redesign', 'New reagent or electrode-binder strategy'],
}

export interface FailureMode {
  name: string
  example: string
}

export const failureModes: FailureMode[] = [
  { name: 'Context grounding', example: 'The plan treats a liquid sample as a solid or loses track of a container state.' },
  { name: 'Parameter boundaries', example: 'Volumes, temperatures or vessel contents exceed a workstation contract.' },
  { name: 'Sequence continuity', example: 'A required uncapping, transfer, cleaning or intermediate state is skipped.' },
  { name: 'Schema integration', example: 'The scientific idea is plausible but the materialized JSON cannot pass strict service validation.' },
]

export const scoring = {
  semantic: 'S₁₋₃ = 0.50 R1 + 0.25 R2 + 0.25 R3',
  dispatch: 'Hdispatch = 0.30 R1 + 0.15 R2 + 0.15 R3 + 0.20 D + 0.10 E + 0.10 T',
  axes: [
    ['R1', 'Physical executability'],
    ['R2', 'Problem coverage & completeness'],
    ['R3', 'Visible scientific reasonableness'],
    ['D', 'Verified dispatch'],
    ['E', 'Computational efficiency'],
    ['T', 'Repeat stability'],
  ],
}

export const methodology = [
  'Six agent harnesses paired with nine named frontier models; the study reports observed harness–model pairings, not independent factorial effects.',
  'Thirty-two fixed prompts covered four catalysis domains. Each observed configuration received three repeat trials per task.',
  'Trials were limited to 30 minutes and ran in automatic tool-permission mode; orchestration, network or API failures were rerun from the initial prompt.',
  'N10 was independently adjudicated by domain experts among the 607 verified-dispatch rows: 151 executable and 456 non-executable.',
  'A started task would require affirmative start evidence; a completed experiment would require terminal status and returned data. This benchmark measures neither by default.',
]

export const provenance = [
  { label: 'Manuscript', value: 'MS_Guo_Science.docx · Results and Methods' },
  { label: 'Figure 3 data', value: 'Data_S4.xlsx · Pass Count Matrix / Top8 Node Rates' },
  { label: 'Figure 4 data', value: 'Data_S3.xlsx · F4_Planning_Parameters and linked sheets' },
  { label: 'Audit date', value: 'Numbers transcribed and cross-checked 27 Aug 2026' },
]

export const bibtex = `@article{guo2026stresstesting,
  title={Stress-testing large language model agents in a robotic chemistry laboratory},
  author={Guo, Lulu and Sun, Yingkai and Li, Xiaobo and others},
  year={2026},
  eprint={2607.23045},
  archivePrefix={arXiv},
  primaryClass={cs.AI}
}`
