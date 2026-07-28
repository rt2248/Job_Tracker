import { useState, useEffect, useRef } from 'react'

// ─── Design tokens ───────────────────────────────────────────────
const C = {
  bg: '#050913',
  surface: '#0d1424',
  surface2: '#111827',
  border: 'rgba(99,102,241,0.18)',
  borderHover: 'rgba(99,102,241,0.45)',
  indigo: '#6366f1',
  indigoLight: '#818cf8',
  indigoDim: 'rgba(99,102,241,0.12)',
  cyan: '#22d3ee',
  cyanDim: 'rgba(34,211,238,0.10)',
  text: '#f1f5f9',
  muted: '#64748b',
  mutedLight: '#94a3b8',
  green: '#10b981',
  amber: '#f59e0b',
  red: '#ef4444',
}

// ─── Workflow stages data ─────────────────────────────────────────
const STAGES = ['Applied', 'OA', 'Interview', 'Offer', 'Accepted']

const KANBAN_CARDS = {
  Applied: [
    { company: 'Stripe', role: 'Software Engineer', tag: 'Applied', color: C.muted },
    { company: 'Figma', role: 'Frontend Engineer', tag: 'Applied', color: C.muted },
  ],
  OA: [
    { company: 'Cloudflare', role: 'Systems Engineer', tag: 'OA', color: C.indigo },
  ],
  Interview: [
    { company: 'Vercel', role: 'Full Stack Engineer', tag: 'Interview', color: C.cyan },
    { company: 'Linear', role: 'Product Engineer', tag: 'Interview', color: C.cyan },
  ],
  Offer: [
    { company: 'Anthropic', role: 'ML Engineer', tag: 'Offer', color: C.amber },
  ],
  Accepted: [
    { company: 'Google', role: 'SWE Intern', tag: 'Accepted', color: C.green },
  ],
}

const FEATURES = [
  {
    icon: '⬡',
    label: 'Kanban Board',
    desc: 'Drag-and-drop applications through workflow stages. Visual clarity for every job in your pipeline.',
    accent: C.indigo,
    tag: 'WORKFLOW',
  },
  {
    icon: '◎',
    label: 'Automation Hooks',
    desc: 'Event-driven triggers fire on status changes. Pipe data into n8n, Zapier, or your own systems.',
    accent: C.cyan,
    tag: 'AUTOMATION',
  },
  {
    icon: '▣',
    label: 'Analytics Dashboard',
    desc: 'Track interview rates, offer conversions, and weekly trends. Turn rejections into data points.',
    accent: '#a78bfa',
    tag: 'INSIGHTS',
  },
  {
    icon: '◈',
    label: 'AI Integration',
    desc: 'Resume analysis, skill gap detection, and application improvement suggestions — pluggable and modular.',
    accent: C.green,
    tag: 'AI LAYER',
  },
  {
    icon: '◷',
    label: 'Deadline Tracking',
    desc: 'Never miss a deadline. Cron-based reminders and priority queuing surface urgency automatically.',
    accent: C.amber,
    tag: 'SCHEDULER',
  },
  {
    icon: '≡',
    label: 'Activity Timeline',
    desc: 'Full audit trail of every status change, edit, and comment. Know exactly what happened and when.',
    accent: '#f472b6',
    tag: 'AUDIT LOG',
  },
]

const STATS = [
  { value: '100+', label: 'Applications tracked' },
  { value: '6', label: 'Workflow stages' },
  { value: '12', label: 'Automation events' },
  { value: '3×', label: 'Faster than spreadsheets' },
]

const ACTIVITY = [
  { event: 'JOB_STATUS_UPDATED', company: 'Google', status: 'Interview', time: '2s ago', color: C.cyan },
  { event: 'DEADLINE_APPROACHING', company: 'Meta', status: 'Applied', time: '14m ago', color: C.amber },
  { event: 'JOB_CREATED', company: 'Stripe', status: 'Applied', time: '1h ago', color: C.indigo },
  { event: 'JOB_STATUS_UPDATED', company: 'Vercel', status: 'Offer', time: '3h ago', color: C.green },
]

// ─── Sub-components ───────────────────────────────────────────────

function NavBar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 40px',
        height: 64,
        background: scrolled ? 'rgba(5,9,19,0.92)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: scrolled ? `1px solid ${C.border}` : '1px solid transparent',
        transition: 'all 0.3s ease',
        fontFamily: 'Inter, sans-serif',
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: `linear-gradient(135deg, ${C.indigo}, ${C.cyan})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 14, fontWeight: 700, color: '#fff',
          fontFamily: 'JetBrains Mono, monospace',
        }}>JT</div>
        <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 16, color: C.text, letterSpacing: '-0.02em' }}>
          JobTracker
        </span>
      </div>

      {/* Nav links */}
      <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
        {['Features', 'Workflow', 'Analytics', 'Docs'].map(link => (
          <a key={link} href={`#${link.toLowerCase()}`} style={{
            color: C.mutedLight, fontSize: 13, fontWeight: 500, textDecoration: 'none',
            transition: 'color 0.2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.color = C.text)}
            onMouseLeave={e => (e.currentTarget.style.color = C.mutedLight)}
          >{link}</a>
        ))}
      </div>

      {/* CTA */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button style={{
          padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 500,
          background: 'transparent', border: `1px solid ${C.border}`,
          color: C.mutedLight, cursor: 'pointer', transition: 'all 0.2s',
          fontFamily: 'Inter, sans-serif',
        }}
          onMouseEnter={e => { (e.currentTarget.style.borderColor = C.borderHover); (e.currentTarget.style.color = C.text) }}
          onMouseLeave={e => { (e.currentTarget.style.borderColor = C.border); (e.currentTarget.style.color = C.mutedLight) }}
        >Log in</button>
        <button style={{
          padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
          background: `linear-gradient(135deg, ${C.indigo}, #4f46e5)`,
          border: 'none', color: '#fff', cursor: 'pointer',
          transition: 'all 0.2s', fontFamily: 'Inter, sans-serif',
          boxShadow: `0 0 20px ${C.indigo}40`,
        }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 0 30px ${C.indigo}80`)}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = `0 0 20px ${C.indigo}40`)}
        >Get started</button>
      </div>
    </nav>
  )
}

function AnimatedOrbs() {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <div style={{
        position: 'absolute', width: 600, height: 600, borderRadius: '50%',
        background: `radial-gradient(circle, ${C.indigo}18 0%, transparent 70%)`,
        top: -200, left: -100,
        animation: 'orb-1 18s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', width: 500, height: 500, borderRadius: '50%',
        background: `radial-gradient(circle, ${C.cyan}12 0%, transparent 70%)`,
        top: 100, right: -150,
        animation: 'orb-2 22s ease-in-out infinite',
      }} />
      <div style={{
        position: 'absolute', width: 400, height: 400, borderRadius: '50%',
        background: `radial-gradient(circle, #a78bfa14 0%, transparent 70%)`,
        bottom: -100, left: '40%',
        animation: 'orb-3 16s ease-in-out infinite',
      }} />
    </div>
  )
}

function GridLines() {
  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none',
      backgroundImage: `
        linear-gradient(${C.border} 1px, transparent 1px),
        linear-gradient(90deg, ${C.border} 1px, transparent 1px)
      `,
      backgroundSize: '80px 80px',
      maskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, #000 60%, transparent 100%)',
      WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, #000 60%, transparent 100%)',
    }} />
  )
}

function TypingHeadline() {
  const words = ['Applications', 'Interviews', 'Offers', 'Career']
  const [wordIndex, setWordIndex] = useState(0)
  const [displayed, setDisplayed] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const current = words[wordIndex]
    let timeout

    if (!deleting && displayed.length < current.length) {
      timeout = setTimeout(() => setDisplayed(current.slice(0, displayed.length + 1)), 80)
    } else if (!deleting && displayed.length === current.length) {
      timeout = setTimeout(() => setDeleting(true), 1800)
    } else if (deleting && displayed.length > 0) {
      timeout = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 40)
    } else if (deleting && displayed.length === 0) {
      setDeleting(false)
      setWordIndex(i => (i + 1) % words.length)
    }

    return () => clearTimeout(timeout)
  }, [displayed, deleting, wordIndex])

  return (
    <span style={{ color: C.indigoLight }}>
      {displayed}
      <span style={{
        display: 'inline-block', width: 3, height: '0.85em',
        background: C.indigo, marginLeft: 2, verticalAlign: 'middle',
        animation: 'blink 1s step-end infinite',
      }} />
    </span>
  )
}

function MiniKanban() {
  const cols = STAGES.slice(0, 4)
  const [activeCard, setActiveCard] = useState(null)

  return (
    <div style={{
      display: 'flex', gap: 8, padding: 16,
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 16,
      boxShadow: `0 0 0 1px ${C.border}, 0 40px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.04)`,
      fontFamily: 'Inter, sans-serif',
      overflow: 'hidden',
      minWidth: 0,
    }}>
      {cols.map(col => {
        const cards = KANBAN_CARDS[col]
        return (
          <div key={col} style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: 8, padding: '4px 6px',
            }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: C.muted, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace' }}>{col}</span>
              <span style={{
                fontSize: 10, fontWeight: 600,
                background: C.indigoDim, color: C.indigoLight,
                borderRadius: 10, padding: '1px 6px',
              }}>{cards.length}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {cards.map((card, i) => (
                <div key={i}
                  onMouseEnter={() => setActiveCard(`${col}-${i}`)}
                  onMouseLeave={() => setActiveCard(null)}
                  style={{
                    padding: '8px 10px', borderRadius: 8,
                    background: activeCard === `${col}-${i}` ? C.surface2 : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${activeCard === `${col}-${i}` ? card.color + '60' : C.border}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    transform: activeCard === `${col}-${i}` ? 'translateY(-2px)' : 'none',
                    boxShadow: activeCard === `${col}-${i}` ? `0 4px 12px rgba(0,0,0,0.3)` : 'none',
                  }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.text, marginBottom: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{card.company}</div>
                  <div style={{ fontSize: 10, color: C.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{card.role}</div>
                  <div style={{
                    marginTop: 6, display: 'inline-block',
                    fontSize: 9, fontWeight: 600, letterSpacing: '0.06em',
                    color: card.color, background: `${card.color}15`,
                    padding: '2px 6px', borderRadius: 4, fontFamily: 'JetBrains Mono, monospace',
                  }}>{card.tag}</div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ActivityFeed() {
  const [items, setItems] = useState(ACTIVITY)

  useEffect(() => {
    const timer = setInterval(() => {
      setItems(prev => {
        const rotated = [...prev]
        const first = rotated.shift()
        return [...rotated, first]
      })
    }, 3000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 12,
      padding: 16,
      fontFamily: 'JetBrains Mono, monospace',
      boxShadow: `0 20px 60px rgba(0,0,0,0.5)`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.green, boxShadow: `0 0 8px ${C.green}` }} />
        <span style={{ fontSize: 11, color: C.muted, letterSpacing: '0.06em' }}>LIVE EVENTS</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflow: 'hidden', height: 160 }}>
        {items.slice(0, 4).map((item, i) => (
          <div key={`${item.company}-${i}`}
            style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              opacity: i === 0 ? 1 : i === 1 ? 0.75 : i === 2 ? 0.5 : 0.25,
              transition: 'opacity 0.5s ease',
              fontSize: 11,
            }}>
            <div style={{
              width: 6, height: 6, borderRadius: '50%',
              background: item.color, marginTop: 3, flexShrink: 0,
              boxShadow: i === 0 ? `0 0 6px ${item.color}` : 'none',
            }} />
            <div>
              <div style={{ color: item.color, fontWeight: 500, letterSpacing: '0.03em' }}>{item.event}</div>
              <div style={{ color: C.mutedLight, marginTop: 1 }}>{item.company} → {item.status}</div>
              <div style={{ color: C.muted, fontSize: 10, marginTop: 1 }}>{item.time}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function FeatureCard({ feature, index }) {
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: '28px 28px 24px',
        borderRadius: 16,
        background: hovered ? `linear-gradient(135deg, ${feature.accent}08, ${C.surface})` : C.surface,
        border: `1px solid ${hovered ? feature.accent + '40' : C.border}`,
        transition: 'all 0.3s ease',
        cursor: 'default',
        transform: hovered ? 'translateY(-4px)' : 'none',
        boxShadow: hovered ? `0 12px 40px rgba(0,0,0,0.4), 0 0 0 1px ${feature.accent}20` : `0 4px 20px rgba(0,0,0,0.2)`,
        animation: `slide-in-up 0.5s ease both`,
        animationDelay: `${index * 0.08}s`,
      }}
    >
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16,
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: `${feature.accent}16`,
          border: `1px solid ${feature.accent}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, color: feature.accent,
          transition: 'all 0.3s',
          boxShadow: hovered ? `0 0 20px ${feature.accent}30` : 'none',
        }}>{feature.icon}</div>
        <span style={{
          fontSize: 9, fontWeight: 700, letterSpacing: '0.12em',
          color: feature.accent, background: `${feature.accent}14`,
          border: `1px solid ${feature.accent}30`,
          padding: '3px 8px', borderRadius: 6,
          fontFamily: 'JetBrains Mono, monospace',
        }}>{feature.tag}</span>
      </div>
      <h3 style={{
        fontFamily: 'Outfit, sans-serif',
        fontSize: 18, fontWeight: 700, color: C.text,
        margin: '0 0 10px', letterSpacing: '-0.02em',
      }}>{feature.label}</h3>
      <p style={{
        fontSize: 14, lineHeight: 1.65, color: C.mutedLight,
        margin: 0, fontFamily: 'Inter, sans-serif',
      }}>{feature.desc}</p>
    </div>
  )
}

function PipelineViz() {
  const [activeStage, setActiveStage] = useState(2)

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStage(s => (s + 1) % STAGES.length)
    }, 2000)
    return () => clearInterval(timer)
  }, [])

  const stageColors = {
    Applied: C.muted,
    OA: C.indigo,
    Interview: C.cyan,
    Offer: C.amber,
    Accepted: C.green,
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 0,
      padding: '32px 40px',
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 20,
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse 60% 80% at 50% 50%, ${C.indigoDim}, transparent)`,
        pointerEvents: 'none',
      }} />
      {STAGES.map((stage, i) => {
        const isActive = i === activeStage
        const isPast = i < activeStage
        const color = stageColors[stage]
        return (
          <div key={stage} style={{ display: 'flex', alignItems: 'center', flex: i < STAGES.length - 1 ? 1 : undefined }}>
            <div
              onClick={() => setActiveStage(i)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                cursor: 'pointer', position: 'relative', zIndex: 1,
              }}>
              {/* Node */}
              <div style={{
                width: isActive ? 52 : 40, height: isActive ? 52 : 40,
                borderRadius: '50%',
                background: isActive ? color : isPast ? `${color}30` : C.surface2,
                border: `2px solid ${isActive ? color : isPast ? `${color}50` : C.border}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.4s ease',
                boxShadow: isActive ? `0 0 24px ${color}60, 0 0 48px ${color}20` : 'none',
                position: 'relative',
              }}>
                {isActive && (
                  <div style={{
                    position: 'absolute', inset: -6, borderRadius: '50%',
                    border: `1px solid ${color}40`,
                    animation: 'pulse-ring 2s ease-out infinite',
                  }} />
                )}
                <span style={{ fontSize: isActive ? 16 : 13, color: isActive ? '#fff' : isPast ? color : C.muted }}>
                  {isPast ? '✓' : i + 1}
                </span>
              </div>
              {/* Label */}
              <span style={{
                fontSize: 12, fontWeight: isActive ? 700 : 500,
                color: isActive ? color : isPast ? C.mutedLight : C.muted,
                fontFamily: 'Outfit, sans-serif',
                transition: 'all 0.3s',
                whiteSpace: 'nowrap',
              }}>{stage}</span>
            </div>
            {/* Connector */}
            {i < STAGES.length - 1 && (
              <div style={{
                flex: 1, height: 2, marginBottom: 22, position: 'relative',
                background: `linear-gradient(90deg, ${isPast ? stageColors[STAGES[i]] + '60' : C.border}, ${i + 1 <= activeStage ? stageColors[STAGES[i + 1]] + '60' : C.border})`,
                transition: 'all 0.4s',
              }}>
                {i === activeStage - 1 && (
                  <div style={{
                    position: 'absolute', top: -3, left: '50%',
                    width: 8, height: 8, borderRadius: '50%',
                    background: stageColors[STAGES[i]],
                    boxShadow: `0 0 8px ${stageColors[STAGES[i]]}`,
                    transform: 'translateX(-50%)',
                    animation: 'float 2s ease-in-out infinite',
                  }} />
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function StatBadge({ value, label, delay }) {
  const [show, setShow] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setShow(true) },
      { threshold: 0.5 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} style={{
      textAlign: 'center', padding: '24px 32px',
      opacity: show ? 1 : 0, transform: show ? 'translateY(0)' : 'translateY(20px)',
      transition: `all 0.6s ease ${delay}ms`,
    }}>
      <div style={{
        fontFamily: 'Outfit, sans-serif', fontSize: 48, fontWeight: 800,
        letterSpacing: '-0.04em', color: C.text,
        background: `linear-gradient(135deg, ${C.text}, ${C.indigoLight})`,
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
      }}>{value}</div>
      <div style={{ fontSize: 13, color: C.muted, marginTop: 4, fontFamily: 'Inter, sans-serif' }}>{label}</div>
    </div>
  )
}

function EventBadge({ event }) {
  const [visible, setVisible] = useState(true)
  const EVENTS = [
    'JOB_CREATED', 'STATUS_UPDATED', 'DEADLINE_APPROACHING', 'OFFER_RECEIVED', 'AI_ANALYSIS_DONE'
  ]
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setCurrent(c => (c + 1) % EVENTS.length)
        setVisible(true)
      }, 300)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: '8px 16px', borderRadius: 100,
      background: C.cyanDim, border: `1px solid ${C.cyan}40`,
      fontFamily: 'JetBrains Mono, monospace',
      fontSize: 12, fontWeight: 500,
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.3s ease',
    }}>
      <span style={{ color: C.cyan }}>event:</span>
      <span style={{ color: C.text }}>{EVENTS[current]}</span>
    </div>
  )
}

// ─── Main app ──────────────────────────────────────────────────────
export default function App() {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handler = (e) => setMousePos({ x: e.clientX, y: e.clientY })
    window.addEventListener('mousemove', handler)
    return () => window.removeEventListener('mousemove', handler)
  }, [])

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.text, fontFamily: 'Inter, sans-serif', overflowX: 'hidden' }}>
      {/* Cursor glow */}
      <div style={{
        position: 'fixed', pointerEvents: 'none', zIndex: 0,
        width: 400, height: 400, borderRadius: '50%',
        background: `radial-gradient(circle, ${C.indigo}08 0%, transparent 70%)`,
        transform: `translate(${mousePos.x - 200}px, ${mousePos.y - 200}px)`,
        transition: 'transform 0.15s ease',
      }} />

      <NavBar />

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section style={{ position: 'relative', minHeight: '100vh', display: 'flex', alignItems: 'center', paddingTop: 80, overflow: 'hidden' }}>
        <AnimatedOrbs />
        <GridLines />

        <div style={{ width: '100%', maxWidth: 1280, margin: '0 auto', padding: '80px 60px', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>

            {/* Left: Copy */}
            <div>
              {/* Badge */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '6px 14px', borderRadius: 100,
                background: C.indigoDim, border: `1px solid ${C.indigo}40`,
                marginBottom: 28,
                animation: 'slide-in-up 0.5s ease both',
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.green, boxShadow: `0 0 8px ${C.green}` }} />
                <span style={{ fontSize: 12, fontWeight: 500, color: C.indigoLight, fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.04em' }}>
                  Automation-ready workflow system
                </span>
              </div>

              {/* Headline */}
              <h1 style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: 'clamp(40px, 5vw, 68px)',
                fontWeight: 900,
                lineHeight: 1.05,
                letterSpacing: '-0.04em',
                color: C.text,
                margin: '0 0 24px',
                animation: 'slide-in-up 0.5s ease 0.1s both',
              }}>
                Track every<br />
                <TypingHeadline /><br />
                <span style={{
                  background: `linear-gradient(135deg, ${C.indigo}, ${C.cyan})`,
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>intelligently.</span>
              </h1>

              {/* Sub */}
              <p style={{
                fontSize: 17, lineHeight: 1.7, color: C.mutedLight,
                margin: '0 0 36px', maxWidth: 480,
                fontFamily: 'Inter, sans-serif', fontWeight: 400,
                animation: 'slide-in-up 0.5s ease 0.2s both',
              }}>
                A workflow-driven job tracker inspired by Jira. Each application is an issue moving through enforced state transitions — with automation hooks, AI analysis, and analytics built in.
              </p>

              {/* CTAs */}
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', animation: 'slide-in-up 0.5s ease 0.3s both' }}>
                <button
                  style={{
                    padding: '14px 28px', borderRadius: 10, fontSize: 15, fontWeight: 600,
                    background: `linear-gradient(135deg, ${C.indigo}, #4338ca)`,
                    border: 'none', color: '#fff', cursor: 'pointer',
                    boxShadow: `0 0 30px ${C.indigo}40`,
                    transition: 'all 0.2s', fontFamily: 'Inter, sans-serif',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 0 50px ${C.indigo}60`)}
                  onMouseLeave={e => (e.currentTarget.style.boxShadow = `0 0 30px ${C.indigo}40`)}
                >
                  Start tracking free
                  <span style={{ fontSize: 16 }}>→</span>
                </button>
                <button style={{
                  padding: '14px 28px', borderRadius: 10, fontSize: 15, fontWeight: 500,
                  background: 'transparent', border: `1px solid ${C.border}`,
                  color: C.mutedLight, cursor: 'pointer', transition: 'all 0.2s',
                  fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 8,
                }}
                  onMouseEnter={e => { (e.currentTarget.style.borderColor = C.borderHover); (e.currentTarget.style.color = C.text) }}
                  onMouseLeave={e => { (e.currentTarget.style.borderColor = C.border); (e.currentTarget.style.color = C.mutedLight) }}
                >
                  <span style={{ fontSize: 16 }}>▶</span> Watch demo
                </button>
              </div>

              {/* Tech badges */}
              <div style={{ display: 'flex', gap: 10, marginTop: 36, flexWrap: 'wrap', animation: 'slide-in-up 0.5s ease 0.4s both' }}>
                {['React', 'Node.js', 'PostgreSQL', 'n8n-ready'].map(tech => (
                  <span key={tech} style={{
                    fontSize: 11, fontWeight: 500, letterSpacing: '0.04em',
                    color: C.muted, background: 'rgba(255,255,255,0.04)',
                    border: `1px solid ${C.border}`,
                    padding: '4px 10px', borderRadius: 6,
                    fontFamily: 'JetBrains Mono, monospace',
                  }}>{tech}</span>
                ))}
              </div>
            </div>

            {/* Right: Kanban preview + activity feed */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'slide-in-right 0.6s ease 0.2s both' }}>
              <MiniKanban />
              <ActivityFeed />
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ─────────────────────────────────────────────── */}
      <section style={{
        borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`,
        background: 'rgba(13,20,36,0.5)',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 60px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', position: 'relative' }}>
          {STATS.map((s, i) => (
            <div key={i} style={{ borderRight: i < 3 ? `1px solid ${C.border}` : 'none' }}>
              <StatBadge value={s.value} label={s.label} delay={i * 100} />
            </div>
          ))}
        </div>
      </section>

      {/* ── Workflow Pipeline ─────────────────────────────────── */}
      <section id="workflow" style={{ padding: '120px 60px', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '5px 14px', borderRadius: 100,
            background: `${C.cyan}12`, border: `1px solid ${C.cyan}30`,
            fontSize: 11, fontWeight: 600, color: C.cyan,
            fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em',
            marginBottom: 20,
          }}>WORKFLOW ENGINE</div>
          <h2 style={{
            fontFamily: 'Outfit, sans-serif', fontSize: 'clamp(28px, 4vw, 48px)',
            fontWeight: 800, letterSpacing: '-0.03em', color: C.text, margin: '0 0 16px',
          }}>
            State machine, not spreadsheet
          </h2>
          <p style={{ fontSize: 16, color: C.mutedLight, maxWidth: 520, margin: '0 auto', lineHeight: 1.65, fontFamily: 'Inter, sans-serif' }}>
            Each job application progresses through enforced transitions. No random status changes — structured, controlled, auditable.
          </p>
        </div>
        <PipelineViz />
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 32 }}>
          <EventBadge event="LIVE" />
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
      <section id="features" style={{ padding: '40px 60px 120px', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '5px 14px', borderRadius: 100,
            background: C.indigoDim, border: `1px solid ${C.indigo}30`,
            fontSize: 11, fontWeight: 600, color: C.indigoLight,
            fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em',
            marginBottom: 20,
          }}>CAPABILITIES</div>
          <h2 style={{
            fontFamily: 'Outfit, sans-serif', fontSize: 'clamp(28px, 4vw, 48px)',
            fontWeight: 800, letterSpacing: '-0.03em', color: C.text, margin: '0 0 16px',
          }}>
            Built for the serious applicant
          </h2>
          <p style={{ fontSize: 16, color: C.mutedLight, maxWidth: 520, margin: '0 auto', lineHeight: 1.65, fontFamily: 'Inter, sans-serif' }}>
            Every feature is designed to compose with external systems — not just store data, but drive workflows.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {FEATURES.map((f, i) => <FeatureCard key={f.label} feature={f} index={i} />)}
        </div>
      </section>

      {/* ── Automation CTA ────────────────────────────────────── */}
      <section style={{
        margin: '0 60px 120px', borderRadius: 24,
        background: `linear-gradient(135deg, ${C.surface} 0%, rgba(99,102,241,0.08) 50%, ${C.surface} 100%)`,
        border: `1px solid ${C.border}`,
        padding: '80px 80px',
        position: 'relative', overflow: 'hidden',
        maxWidth: 1160, marginLeft: 'auto', marginRight: 'auto',
      }}>
        {/* BG decoration */}
        <div style={{
          position: 'absolute', right: -60, top: -60,
          width: 360, height: 360, borderRadius: '50%',
          background: `radial-gradient(circle, ${C.indigo}14, transparent 70%)`,
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', left: -40, bottom: -40,
          width: 240, height: 240, borderRadius: '50%',
          background: `radial-gradient(circle, ${C.cyan}10, transparent 70%)`,
          pointerEvents: 'none',
        }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 60, alignItems: 'center', position: 'relative', zIndex: 1 }}>
          <div>
            <h2 style={{
              fontFamily: 'Outfit, sans-serif', fontSize: 'clamp(28px, 3vw, 44px)',
              fontWeight: 800, letterSpacing: '-0.03em', color: C.text,
              margin: '0 0 16px',
            }}>
              Part of a larger<br />
              <span style={{ background: `linear-gradient(135deg, ${C.indigo}, ${C.cyan})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                automation ecosystem.
              </span>
            </h2>
            <p style={{ fontSize: 16, color: C.mutedLight, lineHeight: 1.7, margin: '0 0 32px', maxWidth: 500 }}>
              JobTracker is a plug-in module in a broader workflow automation platform. Trigger resume analysis, send deadline alerts, fire webhooks — all connected.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button style={{
                padding: '13px 26px', borderRadius: 10, fontSize: 14, fontWeight: 600,
                background: `linear-gradient(135deg, ${C.indigo}, #4338ca)`,
                border: 'none', color: '#fff', cursor: 'pointer',
                boxShadow: `0 0 30px ${C.indigo}30`,
                transition: 'all 0.2s', fontFamily: 'Inter, sans-serif',
              }}
                onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 0 50px ${C.indigo}50`)}
                onMouseLeave={e => (e.currentTarget.style.boxShadow = `0 0 30px ${C.indigo}30`)}
              >
                Get started free
              </button>
              <button style={{
                padding: '13px 26px', borderRadius: 10, fontSize: 14, fontWeight: 500,
                background: 'transparent', border: `1px solid ${C.border}`,
                color: C.mutedLight, cursor: 'pointer', transition: 'all 0.2s',
                fontFamily: 'Inter, sans-serif',
              }}
                onMouseEnter={e => { (e.currentTarget.style.borderColor = C.borderHover); (e.currentTarget.style.color = C.text) }}
                onMouseLeave={e => { (e.currentTarget.style.borderColor = C.border); (e.currentTarget.style.color = C.mutedLight) }}
              >
                Read the docs →
              </button>
            </div>
          </div>

          {/* Code snippet */}
          <div style={{
            background: '#020817', borderRadius: 14,
            border: `1px solid ${C.border}`, padding: '24px 28px',
            fontFamily: 'JetBrains Mono, monospace', fontSize: 12,
            lineHeight: 1.7, minWidth: 300,
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.05)`,
          }}>
            <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
              {['#ef4444', '#f59e0b', '#10b981'].map(c => (
                <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c, opacity: 0.6 }} />
              ))}
            </div>
            <div style={{ color: C.muted }}>{'// Automation event payload'}</div>
            <div style={{ color: C.mutedLight }}>{'{'}</div>
            <div style={{ paddingLeft: 20 }}>
              <div><span style={{ color: C.cyan }}>"event"</span><span style={{ color: C.mutedLight }}>: </span><span style={{ color: '#a3e635' }}>"JOB_STATUS_UPDATED"</span><span style={{ color: C.mutedLight }}>,</span></div>
              <div><span style={{ color: C.cyan }}>"data"</span><span style={{ color: C.mutedLight }}>: {'{'}</span></div>
              <div style={{ paddingLeft: 20 }}>
                <div><span style={{ color: C.indigoLight }}>"company"</span><span style={{ color: C.mutedLight }}>: </span><span style={{ color: '#a3e635' }}>"Anthropic"</span><span style={{ color: C.mutedLight }}>,</span></div>
                <div><span style={{ color: C.indigoLight }}>"status"</span><span style={{ color: C.mutedLight }}>: </span><span style={{ color: '#a3e635' }}>"Offer"</span><span style={{ color: C.mutedLight }}>,</span></div>
                <div><span style={{ color: C.indigoLight }}>"timestamp"</span><span style={{ color: C.mutedLight }}>: </span><span style={{ color: C.amber }}>"2025-01-28T..."</span></div>
              </div>
              <div style={{ color: C.mutedLight }}>{'}'}</div>
            </div>
            <div style={{ color: C.mutedLight }}>{'}'}</div>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer style={{
        borderTop: `1px solid ${C.border}`,
        padding: '40px 60px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        maxWidth: '100%',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7,
            background: `linear-gradient(135deg, ${C.indigo}, ${C.cyan})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, color: '#fff',
            fontFamily: 'JetBrains Mono, monospace',
          }}>JT</div>
          <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: 14, color: C.mutedLight }}>
            JobTracker — Workflow-powered job tracking
          </span>
        </div>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          {['Privacy', 'Terms', 'GitHub', 'API docs'].map(l => (
            <a key={l} href="#" style={{
              fontSize: 12, color: C.muted, textDecoration: 'none',
              fontFamily: 'Inter, sans-serif', transition: 'color 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.color = C.mutedLight)}
              onMouseLeave={e => (e.currentTarget.style.color = C.muted)}
            >{l}</a>
          ))}
        </div>
      </footer>
    </div>
  )
}
