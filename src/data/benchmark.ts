// Stress-Testing LLM Agents in a Robotic Chemistry Laboratory — real paper content model.
// Source: arXiv:2607.23045. All 20 style pages render exactly this data; only visuals change.

export interface PaperMeta {
  title: string;
  subtitle: string;
  authors: string[];
  affiliation: string;
  links: { label: string; href: string }[];
}

export const paperMeta: PaperMeta = {
  title: 'Stress-Testing Large Language Model Agents in a Robotic Chemistry Laboratory',
  subtitle:
    'A robotic chemistry laboratory as a physical-world testbed for scientific agency — 45 modular workstations, 4,608 trials, one hard question: can AI actually do science?',
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
  affiliation: 'arXiv:2607.23045 · cs.AI / cs.RO · July 2026',
  links: [
    { label: 'Paper (arXiv)', href: 'https://arxiv.org/abs/2607.23045' },
    { label: 'Code (GitHub)', href: '#' },
    { label: 'Dataset', href: '#' },
    { label: 'Submit Your Agent', href: '#' },
  ],
};

export interface KeyStat {
  value: string;
  label: string;
  description: string;
}

export const keyStats: KeyStat[] = [
  { value: '45', label: 'Modular Workstations', description: 'Exposed as machine-readable skills' },
  { value: '48', label: 'Configurations', description: '6 agent harnesses × 9 frontier LLMs' },
  { value: '32', label: 'Research Tasks', description: 'Across 4 catalysis domains' },
  { value: '4,608', label: 'Total Trials', description: '3 independent trials per task' },
  { value: '3.3%', label: 'Executable Workflows', description: 'Expert-adjudicated at N10 — 151 in total' },
  { value: '28.1%', label: 'Best Configuration', description: 'Claude Code × Claude Opus 4.7' },
];

// Lab capability numbers (Figure 1)
export const labStats: KeyStat[] = [
  { value: '62', label: 'Operations', description: 'Distinct workstation operations' },
  { value: '433', label: 'Constraints', description: 'Physical & safety constraints' },
  { value: '456', label: 'Parameters', description: 'Machine-readable parameters' },
  { value: '6.71×10⁶', label: 'Combinations', description: 'Reachable workflow space' },
];

export const abstractText: string =
  'AI is evaluated through knowledge, reasoning and plan generation, yet scientific agency requires reliable physical action and adaptation to evidence. Here, we use a robotic chemistry laboratory as a physical-world testbed to make scientific agency measurable. Its 45 modular workstations exposed as machine-readable skills enabled 4,608 trials. Only 3.3% of trials produced expert-assessed executable workflows under laboratory constraints; even the best system achieved 28.1%. Long-horizon planning remained a challenge: only three executable workflows exceeded 30 operations, although the longest contained 44. Across five rounds, experimental feedback prompted local adjustments but no workflow-level replanning or analytical-method redesign. By making physical executability and evidence-driven replanning measurable, our study provides an evidence-based assessment of deployment readiness and a diagnostic framework to guide closed-loop improvements towards physically grounded autonomous research.';

// ── Skills Library (4 categories) ────────────────────────────────
export interface SkillCategory {
  name: string;
  tagline: string;
  bullets: string[];
}

export const skillCategories: SkillCategory[] = [
  {
    name: 'System skills',
    tagline: 'Lab operation & orchestration',
    bullets: [
      'Resource access and task dispatch',
      'Workflow compilation',
      'Parameter review and audit trail',
    ],
  },
  {
    name: 'Synthesis skills',
    tagline: 'Sample preparation',
    bullets: [
      'Liquid handling station · Solid weighing station',
      'Centrifugation station · Drying station',
    ],
  },
  {
    name: 'Reaction & testing skills',
    tagline: 'Catalysis evaluation',
    bullets: [
      'Electrocatalytic / Photocatalytic / Thermocatalytic stations',
      'Gas chromatography station',
    ],
  },
  {
    name: 'Characterization skills',
    tagline: 'Structural & optical analysis',
    bullets: ['XRD · UV–Vis spectroscopy', 'Microplate reader · FTIR spectroscopy'],
  },
];

// ── Ten-endpoint pathway N1–N10 (key nodes) ──────────────────────
export interface PathwayNode {
  node: string;
  label: string;
  stage: string;
}

export const pathwayStages: string[] = [
  'Experimental Design',
  'Workflow Validation',
  'Physical-Execution Boundary',
];

export const pathway: PathwayNode[] = [
  { node: 'N1', label: 'Task received', stage: 'Experimental Design' },
  { node: 'N3', label: 'Skills retrieval', stage: 'Experimental Design' },
  { node: 'N4', label: 'Plan construction', stage: 'Experimental Design' },
  { node: 'N6', label: 'Standard JSON serialization', stage: 'Experimental Design' },
  { node: 'N8', label: 'System review — safety & parameter audit', stage: 'Workflow Validation' },
  { node: 'N9', label: 'Lab dispatch to task queue', stage: 'Workflow Validation' },
  { node: 'N10', label: 'Expert-adjudicated executability', stage: 'Physical-Execution Boundary' },
];

export const pathwayNote: string =
  'Ten-endpoint pathway N1–N10; key nodes shown. Passing N9 means a plan is syntactically valid and respects basic constraints — only N10 certifies it is scientifically and physically executable by the robots.';

// ── Leaderboard: top 8 of 48 configurations by N10 executable yield ──
export type Weights = 'open' | 'closed';

export interface LeaderboardRow {
  rank: number;
  harness: string;
  model: string;
  org: string;
  weights: Weights;
  trials: number;
  executable: number;
  n10: number; // executable yield %
}

export const leaderboard: LeaderboardRow[] = [
  { rank: 1, harness: 'Claude Code', model: 'Claude Opus 4.7', org: 'Anthropic', weights: 'closed', trials: 96, executable: 27, n10: 28.1 },
  { rank: 2, harness: 'Codex', model: 'GPT 5.5', org: 'OpenAI', weights: 'closed', trials: 96, executable: 19, n10: 19.8 },
  { rank: 3, harness: 'Hermes', model: 'GPT 5.5', org: 'OpenAI', weights: 'closed', trials: 96, executable: 15, n10: 15.7 },
  { rank: 4, harness: 'Hermes', model: 'Qwen3.7 Max', org: 'Alibaba', weights: 'closed', trials: 96, executable: 9, n10: 9.4 },
  { rank: 5, harness: 'OpenClaw', model: 'Gemini 3.5 Flash', org: 'Google', weights: 'closed', trials: 96, executable: 8, n10: 8.3 },
  { rank: 6, harness: 'OpenClaw', model: 'Qwen3.7 Max', org: 'Alibaba', weights: 'closed', trials: 96, executable: 7, n10: 7.3 },
  { rank: 7, harness: 'Hermes', model: 'GLM 5.1', org: 'Zhipu', weights: 'open', trials: 96, executable: 6, n10: 6.3 },
  { rank: 8, harness: 'Kimi Code', model: 'Gemini 3.5 Flash', org: 'Google', weights: 'closed', trials: 96, executable: 5, n10: 5.2 },
];

export const leaderboardCaption: string =
  'Top 8 of 48 configurations by N10 executable yield. Each configuration ran 32 tasks × 3 trials = 96 trials.';

// ── Open-weight vs closed-weight mean N10 (derived from top-8 above) ──
export interface WeightsAvgRow {
  group: string;
  value: number;
  n: number;
}

export const weightsAvg: WeightsAvgRow[] = [
  { group: 'Closed-weight models', value: 13.4, n: 7 },
  { group: 'Open-weight models', value: 6.3, n: 1 },
];

export const weightsAvgCaption: string = 'Mean N10 yield across the top-8 configurations shown.';

// ── The long-horizon wall ────────────────────────────────────────
export interface LongHorizon {
  totalExecutable: number;
  over30Ops: number;
  longest: number;
  note: string;
}

export const longHorizon: LongHorizon = {
  totalExecutable: 151,
  over30Ops: 3,
  longest: 44,
  note: 'Only three executable workflows exceeded 30 operations; the longest contained 44. As workflows grow longer, the probability of a physical constraint violation rises sharply.',
};

// ── Task domains (32-task suite) ─────────────────────────────────
export interface TaskDomain {
  domain: string;
  blurb: string;
}

export const taskDomains: TaskDomain[] = [
  {
    domain: 'Electrocatalysis',
    blurb:
      'Home of the closed-loop study: five feedback rounds optimizing a catalyst for urea oxidation (Codex × GPT 5.5).',
  },
  { domain: 'Electrode Materials', blurb: 'Part of the 32-task research suite spanning the full catalysis workflow.' },
  { domain: 'Photocatalysis', blurb: 'Part of the 32-task research suite spanning the full catalysis workflow.' },
  { domain: 'Thermal Catalysis', blurb: 'Part of the 32-task research suite spanning the full catalysis workflow.' },
];

// ── Closed-loop adaptation findings ──────────────────────────────
export interface ClosedLoop {
  agent: string;
  task: string;
  rounds: number;
  adapted: string[];
  notObserved: string[];
}

export const closedLoop: ClosedLoop = {
  agent: 'Codex × GPT 5.5',
  task: 'Optimize a catalyst for urea oxidation',
  rounds: 5,
  adapted: ['Metal concentrations', 'Reaction times', 'Centrifugation speed & drying time'],
  notObserved: ['Workflow-level replanning', 'Analytical-method redesign', 'New reagents (e.g., electrode binders)'],
};

// ── Failure modes (no percentages — the paper categorizes, not quantifies) ──
export interface FailureMode {
  name: string;
  description: string;
}

export const failureModes: FailureMode[] = [
  {
    name: 'Context Grounding Errors',
    description:
      'Failing to recognize the current state of a sample — e.g., weighing a liquid sample as if it were a solid.',
  },
  {
    name: 'Parameter Boundary Violations',
    description:
      'Proposing volumes or temperatures beyond hardware limits — e.g., a single transfer must stay ≤ 1 ml and vessel contents ≤ 3 ml.',
  },
  {
    name: 'Operational Sequence Gaps',
    description:
      'Skipping essential steps — e.g., adding liquid before uncapping a bottle, or omitting probe cleaning.',
  },
  {
    name: 'System Integration Failures',
    description:
      'Scientifically sound plans that fail the strict schema requirements of the laboratory automation software.',
  },
];

export const failureNote: string =
  'Node-level analysis shows the N8 system review stage is the major bottleneck: agents produce plausible-sounding science but struggle with the formal logic machine-executable systems require.';

// ── Scoring & methodology ────────────────────────────────────────
export const scoringAxes: string[] = [
  'R1 physical executability',
  'R2 problem coverage',
  'R3 scientific reasonableness',
  'D dispatch success',
  'E efficiency',
  'T stability',
];

export const formulas: string[] = [
  'S_semantic = 0.50·R1 + 0.25·R2 + 0.25·R3',
  'S_dispatch = 0.30·R1 + 0.15·R2 + 0.15·R3 + 0.20·D + 0.10·E + 0.10·T',
  'N10 = count of executable labels / 96',
];

export const methodologyNotes: string[] = [
  '48 configurations = 6 agent harnesses × 9 frontier LLMs',
  '32 research tasks × 3 independent trials = 4,608 attempts',
  'N10 adjudicated by an expert panel under real laboratory constraints',
  'Five feedback rounds in the closed-loop study prompted local adjustments only',
];

export const bibtex: string = `@misc{guo2026stresstestinglargelanguagemodel,
  title={Stress-testing large language model agents in a robotic chemistry laboratory},
  author={Lulu Guo and Yingkai Sun and Xiaobo Li and Luyao Ge and Ziming Wang and Haitao Zheng and Jingyu Li and Huijuan Zhang and Bingxu Chen and Daobin Liu and Yuebo Liu and Jie Li and Xiaohui Li and Linjiang Chen and Yi Luo and Jun Jiang},
  year={2026},
  eprint={2607.23045},
  archivePrefix={arXiv},
  primaryClass={cs.AI},
  url={https://arxiv.org/abs/2607.23045}
}`;

// ── Style gallery registry (unchanged) ───────────────────────────
export interface StyleEntry {
  slug: string;
  name: string;
  brand: string;
  vibe: string;
  theme: 'light' | 'dark';
}

export const styleList: StyleEntry[] = [
  { slug: 'claude', name: 'Claude', brand: 'Anthropic', vibe: '温暖赭石编辑风', theme: 'light' },
  { slug: 'notion', name: 'Notion', brand: 'Notion', vibe: '暖色极简衬线', theme: 'light' },
  { slug: 'apple', name: 'Apple', brand: 'Apple', vibe: '高级留白', theme: 'light' },
  { slug: 'stripe', name: 'Stripe', brand: 'Stripe', vibe: '优雅渐变', theme: 'light' },
  { slug: 'linear', name: 'Linear', brand: 'Linear', vibe: '极致简约紫点缀', theme: 'light' },
  { slug: 'mintlify', name: 'Mintlify', brand: 'Mintlify', vibe: '文档阅读优化', theme: 'light' },
  { slug: 'wired', name: 'WIRED', brand: 'Condé Nast', vibe: '纸白大报编辑风', theme: 'light' },
  { slug: 'cal', name: 'Cal.com', brand: 'Cal.com', vibe: '干净中性开发者风', theme: 'light' },
  { slug: 'vercel', name: 'Vercel', brand: 'Vercel', vibe: '黑白极简几何', theme: 'light' },
  { slug: 'ibm', name: 'IBM', brand: 'IBM', vibe: 'Carbon 企业蓝', theme: 'light' },
  { slug: 'clickhouse', name: 'ClickHouse', brand: 'ClickHouse', vibe: '黄色技术文档风', theme: 'light' },
  { slug: 'airtable', name: 'Airtable', brand: 'Airtable', vibe: '彩色结构化数据', theme: 'light' },
  { slug: 'cohere', name: 'Cohere', brand: 'Cohere', vibe: '数据仪表盘渐变', theme: 'light' },
  { slug: 'together', name: 'Together AI', brand: 'Together AI', vibe: '蓝图技术风', theme: 'dark' },
  { slug: 'cursor', name: 'Cursor', brand: 'Anysphere', vibe: '深色 AI 编辑器', theme: 'dark' },
  { slug: 'raycast', name: 'Raycast', brand: 'Raycast', vibe: '深色玻璃质感', theme: 'dark' },
  { slug: 'supabase', name: 'Supabase', brand: 'Supabase', vibe: '深翡翠代码风', theme: 'dark' },
  { slug: 'nvidia', name: 'NVIDIA', brand: 'NVIDIA', vibe: '绿黑科技力量', theme: 'dark' },
  { slug: 'xai', name: 'xAI', brand: 'xAI', vibe: 'stark 单色未来主义', theme: 'dark' },
  { slug: 'posthog', name: 'PostHog', brand: 'PostHog', vibe: '深色数据密集 playful', theme: 'dark' },
];

export const siteMeta = {
  benchmarkName: 'Robotic Chemistry Lab Stress-Test',
  shortName: 'RoboChem Bench',
};
