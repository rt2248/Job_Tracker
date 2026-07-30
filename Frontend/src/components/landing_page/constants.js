// ─── Accent color system ────────────────────────────────────────────
// Every accent used across the landing page (kanban tags, activity dots,
// feature cards, pipeline stages) is one of these fixed keys. Keeping the
// set of accents finite means every Tailwind class below is a literal
// string in this file, so Tailwind's build-time scanner can always find
// and generate it — dynamically constructing class names at runtime
// (e.g. `text-${accent}`) is unsafe with Tailwind and must be avoided.
export const ACCENTS = {
  muted: {
    borderSolid: 'border-muted',
    bgSolid: 'bg-muted',
    border50: 'border-muted/50',
    bg30: 'bg-muted/30',
    groupHoverGlow: 'group-hover:shadow-[0_0_20px_rgba(100,116,139,0.3)]',
    text: 'text-muted',
    dot: 'bg-muted',
    bgSoft: 'bg-muted/15',
    border30: 'border-muted/30',
    border40: 'border-muted/40',
    border60: 'border-muted/60',
    hoverBorder: 'hover:border-muted/40',
    hoverFrom: 'hover:from-muted/[0.03]',
    glow: 'shadow-[0_0_20px_rgba(100,116,139,0.3)]',
    dotGlow: 'shadow-[0_0_6px_#64748b]',
  },
  indigo: {
    borderSolid: 'border-indigo',
    bgSolid: 'bg-indigo',
    border50: 'border-indigo/50',
    bg30: 'bg-indigo/30',
    groupHoverGlow: 'group-hover:shadow-[0_0_20px_rgba(99,102,241,0.3)]',
    text: 'text-indigo-light',
    dot: 'bg-indigo',
    bgSoft: 'bg-indigo/15',
    border30: 'border-indigo/30',
    border40: 'border-indigo/40',
    border60: 'border-indigo/60',
    hoverBorder: 'hover:border-indigo/40',
    hoverFrom: 'hover:from-indigo/[0.03]',
    glow: 'shadow-[0_0_20px_rgba(99,102,241,0.3)]',
    dotGlow: 'shadow-[0_0_6px_#6366f1]',
  },
  cyan: {
    borderSolid: 'border-cyan',
    bgSolid: 'bg-cyan',
    border50: 'border-cyan/50',
    bg30: 'bg-cyan/30',
    groupHoverGlow: 'group-hover:shadow-[0_0_20px_rgba(34,211,238,0.3)]',
    text: 'text-cyan',
    dot: 'bg-cyan',
    bgSoft: 'bg-cyan/15',
    border30: 'border-cyan/30',
    border40: 'border-cyan/40',
    border60: 'border-cyan/60',
    hoverBorder: 'hover:border-cyan/40',
    hoverFrom: 'hover:from-cyan/[0.03]',
    glow: 'shadow-[0_0_20px_rgba(34,211,238,0.3)]',
    dotGlow: 'shadow-[0_0_6px_#22d3ee]',
  },
  amber: {
    borderSolid: 'border-amber',
    bgSolid: 'bg-amber',
    border50: 'border-amber/50',
    bg30: 'bg-amber/30',
    groupHoverGlow: 'group-hover:shadow-[0_0_20px_rgba(245,158,11,0.3)]',
    text: 'text-amber',
    dot: 'bg-amber',
    bgSoft: 'bg-amber/15',
    border30: 'border-amber/30',
    border40: 'border-amber/40',
    border60: 'border-amber/60',
    hoverBorder: 'hover:border-amber/40',
    hoverFrom: 'hover:from-amber/[0.03]',
    glow: 'shadow-[0_0_20px_rgba(245,158,11,0.3)]',
    dotGlow: 'shadow-[0_0_6px_#f59e0b]',
  },
  green: {
    borderSolid: 'border-green',
    bgSolid: 'bg-green',
    border50: 'border-green/50',
    bg30: 'bg-green/30',
    groupHoverGlow: 'group-hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]',
    text: 'text-green',
    dot: 'bg-green',
    bgSoft: 'bg-green/15',
    border30: 'border-green/30',
    border40: 'border-green/40',
    border60: 'border-green/60',
    hoverBorder: 'hover:border-green/40',
    hoverFrom: 'hover:from-green/[0.03]',
    glow: 'shadow-[0_0_20px_rgba(16,185,129,0.3)]',
    dotGlow: 'shadow-[0_0_6px_#10b981]',
  },
  violet: {
    borderSolid: 'border-violet',
    bgSolid: 'bg-violet',
    border50: 'border-violet/50',
    bg30: 'bg-violet/30',
    groupHoverGlow: 'group-hover:shadow-[0_0_20px_rgba(167,139,250,0.3)]',
    text: 'text-violet',
    dot: 'bg-violet',
    bgSoft: 'bg-violet/15',
    border30: 'border-violet/30',
    border40: 'border-violet/40',
    border60: 'border-violet/60',
    hoverBorder: 'hover:border-violet/40',
    hoverFrom: 'hover:from-violet/[0.03]',
    glow: 'shadow-[0_0_20px_rgba(167,139,250,0.3)]',
    dotGlow: 'shadow-[0_0_6px_#a78bfa]',
  },
  pink: {
    borderSolid: 'border-pink',
    bgSolid: 'bg-pink',
    border50: 'border-pink/50',
    bg30: 'bg-pink/30',
    groupHoverGlow: 'group-hover:shadow-[0_0_20px_rgba(244,114,182,0.3)]',
    text: 'text-pink',
    dot: 'bg-pink',
    bgSoft: 'bg-pink/15',
    border30: 'border-pink/30',
    border40: 'border-pink/40',
    border60: 'border-pink/60',
    hoverBorder: 'hover:border-pink/40',
    hoverFrom: 'hover:from-pink/[0.03]',
    glow: 'shadow-[0_0_20px_rgba(244,114,182,0.3)]',
    dotGlow: 'shadow-[0_0_6px_#f472b6]',
  },
}

// Raw RGB triples for the small number of spots that build a genuinely
// dynamic multi-stop gradient at runtime (e.g. the pipeline connector,
// which blends between whichever two stage colors are adjacent). These
// can't become static Tailwind classes since the pairing changes per
// render, so they stay as inline style, referencing this single source
// of truth rather than duplicating hex codes.
export const ACCENT_RGB = {
  muted: '100,116,139',
  indigo: '99,102,241',
  cyan: '34,211,238',
  amber: '245,158,11',
  green: '16,185,129',
  violet: '167,139,250',
  pink: '244,114,182',
}

// ─── Workflow stages data ─────────────────────────────────────────
export const STAGES = ['Applied', 'OA', 'Interview', 'Offer', 'Accepted']

export const STAGE_ACCENT = {
  Applied: 'muted',
  OA: 'indigo',
  Interview: 'cyan',
  Offer: 'amber',
  Accepted: 'green',
}

export const KANBAN_CARDS = {
  Applied: [
    { company: 'Stripe', role: 'Software Engineer', tag: 'Applied', accent: 'muted' },
    { company: 'Figma', role: 'Frontend Engineer', tag: 'Applied', accent: 'muted' },
  ],
  OA: [
    { company: 'Cloudflare', role: 'Systems Engineer', tag: 'OA', accent: 'indigo' },
  ],
  Interview: [
    { company: 'Vercel', role: 'Full Stack Engineer', tag: 'Interview', accent: 'cyan' },
    { company: 'Linear', role: 'Product Engineer', tag: 'Interview', accent: 'cyan' },
  ],
  Offer: [
    { company: 'Anthropic', role: 'ML Engineer', tag: 'Offer', accent: 'amber' },
  ],
  Accepted: [
    { company: 'Google', role: 'SWE Intern', tag: 'Accepted', accent: 'green' },
  ],
}

export const FEATURES = [
  {
    icon: '⬡',
    label: 'Kanban Board',
    desc: 'Drag-and-drop applications through workflow stages. Visual clarity for every job in your pipeline.',
    accent: 'indigo',
    tag: 'WORKFLOW',
  },
  {
    icon: '◎',
    label: 'Automation Hooks',
    desc: 'Event-driven triggers fire on status changes. Pipe data into n8n, Zapier, or your own systems.',
    accent: 'cyan',
    tag: 'AUTOMATION',
  },
  {
    icon: '▣',
    label: 'Analytics Dashboard',
    desc: 'Track interview rates, offer conversions, and weekly trends. Turn rejections into data points.',
    accent: 'violet',
    tag: 'INSIGHTS',
  },
  {
    icon: '◈',
    label: 'AI Integration',
    desc: 'Resume analysis, skill gap detection, and application improvement suggestions — pluggable and modular.',
    accent: 'green',
    tag: 'AI LAYER',
  },
  {
    icon: '◷',
    label: 'Deadline Tracking',
    desc: 'Never miss a deadline. Cron-based reminders and priority queuing surface urgency automatically.',
    accent: 'amber',
    tag: 'SCHEDULER',
  },
  {
    icon: '≡',
    label: 'Activity Timeline',
    desc: 'Full audit trail of every status change, edit, and comment. Know exactly what happened and when.',
    accent: 'pink',
    tag: 'AUDIT LOG',
  },
]

export const STATS = [
  { value: '100+', label: 'Applications tracked' },
  { value: '6', label: 'Workflow stages' },
  { value: '12', label: 'Automation events' },
  { value: '3×', label: 'Faster than spreadsheets' },
]

export const ACTIVITY = [
  { event: 'JOB_STATUS_UPDATED', company: 'Google', status: 'Interview', time: '2s ago', accent: 'cyan' },
  { event: 'DEADLINE_APPROACHING', company: 'Meta', status: 'Applied', time: '14m ago', accent: 'amber' },
  { event: 'JOB_CREATED', company: 'Stripe', status: 'Applied', time: '1h ago', accent: 'indigo' },
  { event: 'JOB_STATUS_UPDATED', company: 'Vercel', status: 'Offer', time: '3h ago', accent: 'green' },
]
