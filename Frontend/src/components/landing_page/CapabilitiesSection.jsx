import React, { useState, useRef, useEffect } from 'react'
import gsap from 'gsap'

const CAPABILITIES = [
  {
    id: 'kanban',
    code: 'CAP-01',
    title: 'Stage-enforced Kanban pipeline',
    tagline: 'Deterministic State Transitions',
    desc: 'Organize applications across dedicated status columns with clear state transitions from Saved to Offer. Never lose track of a technical screen or follow-up deadline.',
    metrics: '7 Discrete Stages · 0 Dropped Leads',
    demo: (
      <div className="surface-metallic-card p-5 rounded-xl space-y-3">
        <div className="flex items-center justify-between text-[13px] font-mono text-ink-muted pb-2 border-b border-white/[0.06]">
          <span>PIPELINE COLUMN: INTERVIEW</span>
          <span className="text-amber-400 font-semibold">ROUND 2 SCHEDULED</span>
        </div>
        <div className="p-3.5 bg-[#0a0d14] rounded-lg border border-white/[0.08] flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-white">Stripe · Backend Systems</p>
            <p className="text-sm text-white/60">Distributed Architecture &amp; DB Scaling</p>
          </div>
          <span className="px-2.5 py-1 rounded bg-amber-500/10 text-amber-300 font-mono text-[13px] border border-amber-500/20 shrink-0">
            Advance →
          </span>
        </div>
        <div className="flex items-center justify-between text-[13px] font-mono text-white/50 pt-1">
          <span>INTERVIEWER: STAFF ARCHITECT</span>
          <span>TOMORROW, 2:00 PM</span>
        </div>
      </div>
    ),
  },
  {
    id: 'search',
    code: 'CAP-02',
    title: 'Indexed job search & verified bands',
    tagline: 'Real-time Developer Compensation',
    desc: 'Discover software engineering listings with verified salary ranges, seniority levels, and remote work modes directly indexed from engineering organizations.',
    metrics: '12,400+ Verified Bands · 100% Tech Roles',
    demo: (
      <div className="surface-metallic-card p-5 rounded-xl space-y-3">
        <div className="flex items-center justify-between text-[13px] font-mono text-ink-muted pb-2 border-b border-white/[0.06]">
          <span>INDEX QUERY: DISTRIBUTED SYSTEMS</span>
          <span className="text-emerald-400 font-semibold">MATCH FOUND</span>
        </div>
        <div className="p-3.5 bg-[#0a0d14] rounded-lg border border-white/[0.08] space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-white">Cloudflare · Infrastructure Lead</p>
            <span className="text-[13px] font-mono text-emerald-400 font-semibold">$190k - $240k</span>
          </div>
          <p className="text-sm text-white/60">Go, Rust, Kubernetes · Austin, TX (Remote)</p>
        </div>
        <div className="flex items-center justify-between text-[13px] font-mono text-white/50 pt-1">
          <span>INDEX: LIVE ATS FEED</span>
          <span>COMPENSATION VERIFIED</span>
        </div>
      </div>
    ),
  },
  {
    id: 'vault',
    code: 'CAP-03',
    title: 'Direct PDF resume vault & versioning',
    tagline: 'Profile Document Binding',
    desc: 'Link tailored resume PDFs directly to your account profile for streamlined submissions, instant preview, and role-specific attachment records.',
    metrics: 'SHA-256 Verified · Instant PDF Preview',
    demo: (
      <div className="surface-metallic-card p-5 rounded-xl space-y-3">
        <div className="flex items-center justify-between text-[13px] font-mono text-ink-muted pb-2 border-b border-white/[0.06]">
          <span>DOCUMENT STORAGE PROTOCOL</span>
          <span className="text-cyan-400 font-semibold">AES-256 VAULT</span>
        </div>
        <div className="p-3.5 bg-[#0a0d14] rounded-lg border border-white/[0.08] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded bg-white/[0.08] text-white font-mono text-[13px] font-bold flex items-center justify-center shrink-0 border border-white/10">
              PDF
            </div>
            <div className="min-w-0 truncate">
              <p className="text-sm font-bold text-white truncate">Staff_Frontend_Lead_2026.pdf</p>
              <p className="text-[13px] font-mono text-white/50">138 KB · Last updated 3d ago</p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded bg-white/[0.06] text-white/80 font-mono text-[13px] border border-white/10 shrink-0">
            Linked
          </span>
        </div>
        <div className="flex items-center justify-between text-[13px] font-mono text-white/50 pt-1">
          <span>ENCRYPTION: AT REST &amp; TRANSIT</span>
          <span>READY FOR 1-CLICK EXPORT</span>
        </div>
      </div>
    ),
  },
  {
    id: 'network',
    code: 'CAP-04',
    title: 'Recruiter & referral contact CRM',
    tagline: 'Contextual Relationship Threads',
    desc: 'Track hiring managers, engineering referrals, and interview follow-up schedules systematically connected to each active application.',
    metrics: 'Contact Logs · Follow-up Automation',
    demo: (
      <div className="surface-metallic-card p-5 rounded-xl space-y-3">
        <div className="flex items-center justify-between text-[13px] font-mono text-ink-muted pb-2 border-b border-white/[0.06]">
          <span>THREAD: LINEAR CORE PLATFORM</span>
          <span className="text-white font-semibold">CONTACT LOGGED</span>
        </div>
        <div className="p-3.5 bg-[#0a0d14] rounded-lg border border-white/[0.08] space-y-1.5">
          <p className="text-sm font-bold text-white">Sarah Jenkins · Senior Technical Recruiter</p>
          <p className="text-sm text-white/60">Follow-up confirmed for Mon 9:00 AM PST debrief</p>
        </div>
        <div className="flex items-center justify-between text-[13px] font-mono text-white/50 pt-1">
          <span>STATUS: RESPONSIVE</span>
          <span>REFERRAL: INTERNAL DEV REL</span>
        </div>
      </div>
    ),
  },
]

export default function CapabilitiesSection() {
  const [activeCapId, setActiveCapId] = useState('kanban')
  const sectionRef = useRef(null)
  const capListRef = useRef(null)
  const demoRef = useRef(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (capListRef.current) {
              gsap.fromTo(
                capListRef.current.children,
                { opacity: 0, y: 16 },
                { opacity: 1, y: 0, duration: 0.5, stagger: 0.1, ease: 'power2.out' }
              )
            }
            if (demoRef.current) {
              gsap.fromTo(
                demoRef.current,
                { opacity: 0, y: 18 },
                { opacity: 1, y: 0, duration: 0.55, ease: 'power2.out', delay: 0.15 }
              )
            }
            observer.disconnect()
          }
        })
      },
      { threshold: 0.15 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  const activeCap = CAPABILITIES.find((c) => c.id === activeCapId) || CAPABILITIES[0]

  const handleSelectCap = (id) => {
    if (id === activeCapId) return
    setActiveCapId(id)

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && demoRef.current) {
      gsap.fromTo(
        demoRef.current,
        { opacity: 0.4, y: 8 },
        { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }
      )
    }
  }

  return (
    <section ref={sectionRef} id="capabilities" className="py-24 md:py-32 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="max-w-3xl mb-16">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-4 leading-tight">
            <span>Built for developer </span>
            <span className="text-metallic-silver">career management.</span>
          </h2>
          <p className="text-base sm:text-lg text-ink-secondary leading-relaxed font-sans max-w-xl">
            Every capability in Evolexa solves a real pain point in the technical job search lifecycle—engineered for zero ambiguity.
          </p>
        </div>

        {/* Dynamic Asymmetric Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          
          {/* Left Column: Interactive Capability Selector List */}
          <div ref={capListRef} data-ui className="lg:col-span-5 space-y-3">
            {CAPABILITIES.map((cap) => {
              const isActive = activeCapId === cap.id
              return (
                <button
                  key={cap.id}
                  type="button"
                  onClick={() => handleSelectCap(cap.id)}
                  className={`w-full text-left p-5 rounded-xl transition-all relative overflow-hidden ${
                    isActive
                      ? 'surface-metallic-card border-white/20 shadow-xl'
                      : 'bg-[#0d1118] text-ink-secondary hover:bg-[#121722] border border-white/[0.04]'
                  }`}
                >
                  {/* Active Indicator Bar */}
                  {isActive && (
                    <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-white via-slate-300 to-emerald-400" />
                  )}

                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-mono text-[13px] text-white/50">
                      {cap.code} // {cap.tagline}
                    </span>
                    {isActive && (
                      <span className="font-mono text-[13px] text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        SELECTED
                      </span>
                    )}
                  </div>

                  <h3 className="font-display text-base sm:text-lg font-bold text-white mb-1">
                    {cap.title}
                  </h3>
                  <p className="text-sm sm:text-base text-ink-secondary font-sans leading-relaxed">
                    {cap.desc}
                  </p>
                </button>
              )
            })}
          </div>

          {/* Right Column: Visual Telemetry Cockpit & Live Demonstration */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Telemetry Instrument Header Card */}
            <div data-ui className="surface-metallic-panel rounded-2xl overflow-hidden relative bg-[#0a0d14]">
              <div className="h-44 sm:h-52 w-full relative overflow-hidden bg-[#090c12]">
                <img
                  src="/images/career_telemetry_dial.jpg"
                  alt="Precision metallic telemetry console with radar sweep and coordinate plotting dials"
                  className="w-full h-full object-cover opacity-75 mix-blend-screen scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0e121a] via-[#0e121a]/40 to-transparent" />
                
                {/* Real-time Telemetry Tag */}
                <div className="absolute top-3 left-4 right-4 flex items-center justify-between text-[13px] font-mono text-white/80">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    <span>HUD_TELEMETRY: {activeCap.code}</span>
                  </div>
                  <span className="text-white/40">{activeCap.metrics}</span>
                </div>

                <div className="absolute bottom-3 left-4 right-4">
                  <h4 className="font-display text-lg font-bold text-white">
                    {activeCap.title}
                  </h4>
                  <p className="text-sm text-white/60 font-mono">
                    {activeCap.tagline}
                  </p>
                </div>
              </div>

              {/* Dynamic Interactive Demo Body */}
              <div ref={demoRef} className="p-6 bg-[#0e121a]">
                {activeCap.demo}
              </div>

              {/* Card Footer Telemetry */}
              <div className="px-6 py-3.5 bg-surface-secondary/70 border-t border-white/[0.06] flex items-center justify-between text-[13px] font-mono text-white/50">
                <span>MODULE VERIFICATION: COMPLETE</span>
                <span>ZERO CONFIGURATION REQUIRED</span>
              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  )
}
