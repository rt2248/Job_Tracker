import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'

const DEMO_STAGES = [
  {
    key: 'applied',
    label: 'Applied',
    statusClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    timeline: 'Submitted via senior engineering referral',
    date: 'Oct 14',
    stepNumber: '02/07',
    nextAction: 'Technical screen confirmation pending',
  },
  {
    key: 'interview',
    label: 'Interview',
    statusClass: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    timeline: 'Round 2: Distributed Architecture Deep Dive',
    date: 'Tomorrow, 2:00 PM',
    stepNumber: '04/07',
    nextAction: 'System design whiteboard with Staff Architect',
  },
  {
    key: 'offer',
    label: 'Offer',
    statusClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    timeline: 'Base $210,000 + $75,000 Annual Equity Grant',
    date: 'Formal Offer Issued',
    stepNumber: '06/07',
    nextAction: 'Benefits package & start date review',
  },
]

export default function Hero() {
  const [activeStageKey, setActiveStageKey] = useState('interview')
  const heroRef = useRef(null)
  const cardContentRef = useRef(null)

  const currentStage = DEMO_STAGES.find((s) => s.key === activeStageKey) || DEMO_STAGES[1]

  // GSAP Entrance Timeline & Motion
  useEffect(() => {
    const isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (isReduced) return

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

      tl.from('.hero-telemetry-chip', {
        opacity: 0,
        y: -12,
        duration: 0.6,
      })
      .from('.hero-headline', {
        opacity: 0,
        y: 28,
        duration: 0.85,
      }, '-=0.35')
      .from('.hero-subtext', {
        opacity: 0,
        y: 20,
        duration: 0.7,
      }, '-=0.45')
      .from('.hero-cta-group', {
        opacity: 0,
        y: 16,
        duration: 0.6,
      }, '-=0.4')
      .from('.hero-metrics-bar', {
        opacity: 0,
        y: 12,
        duration: 0.5,
      }, '-=0.3')
      .from('.hero-card-stage', {
        opacity: 0,
        x: 32,
        duration: 0.9,
      }, '-=0.8')
    }, heroRef)

    return () => ctx.revert()
  }, [])

  // Smooth stage change animation
  const handleStageSelect = (stageKey) => {
    if (stageKey === activeStageKey) return
    setActiveStageKey(stageKey)

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && cardContentRef.current) {
      gsap.fromTo(
        cardContentRef.current,
        { opacity: 0.4, y: 6 },
        { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }
      )
    }
  }

  return (
    <section ref={heroRef} id="pipeline" className="relative pt-32 pb-24 md:pt-40 md:pb-32 overflow-hidden">
      {/* Ambient Metallic Background Illumination */}
      <div 
        aria-hidden="true" 
        className="pointer-events-none absolute top-10 left-1/2 -translate-x-1/2 w-[1000px] h-[450px] bg-gradient-to-b from-indigo-950/20 via-slate-900/10 to-transparent blur-[120px] -z-10"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Composition Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Headline and Arguments */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Main Headline with Metallic Finish */}
            <h1 className="hero-headline font-display text-4xl sm:text-5xl lg:text-[62px] font-extrabold tracking-tight leading-[1.06]">
              <span className="text-white block">Track applications</span>
              <span className="text-metallic-silver block">through every stage.</span>
            </h1>

            {/* Value Statement */}
            <p className="hero-subtext text-base sm:text-lg text-ink-secondary leading-relaxed max-w-xl font-sans">
              Evolexa replaces chaotic spreadsheets with stage-enforced Kanban pipelines, indexed engineering roles, and linked resume document management.
            </p>

            {/* CTAs */}
            <div className="hero-cta-group flex flex-wrap items-center gap-4 pt-2">
              <Link
                to="/signup"
                className="metallic-btn-primary px-6 py-3.5 rounded-lg text-sm font-semibold inline-flex items-center gap-2 shadow-lg"
              >
                <span>Start Tracking Free</span>
                <span className="text-sm opacity-70">→</span>
              </Link>
              <Link
                to="/login"
                className="metallic-btn-secondary px-6 py-3.5 rounded-lg text-sm font-medium inline-flex items-center gap-2"
              >
                <span>Sign In to Dashboard</span>
              </Link>
            </div>

            {/* Factual Value Metrics */}
            <div className="hero-metrics-bar pt-4 text-sm text-ink-muted flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-white/[0.06]">
              <div className="flex items-center gap-1.5">
                <span className="text-white font-semibold">7</span>
                <span className="text-ink-secondary">pipeline stages</span>
              </div>
              <span className="text-white/20">·</span>
              <div className="flex items-center gap-1.5">
                <span className="text-emerald-400 font-semibold">$190k–$275k</span>
                <span className="text-ink-secondary">salary bands</span>
              </div>
              <span className="text-white/20">·</span>
              <div className="flex items-center gap-1.5">
                <span className="text-white font-semibold">Private</span>
                <span className="text-ink-secondary">document vault</span>
              </div>
            </div>
          </div>

          {/* Right Column: Layered Metallic Cartography & Live Interactive Fragment */}
          <div className="lg:col-span-6 hero-card-stage">
            <div className="relative w-full max-w-xl mx-auto">
              
              {/* Subtle Ambient Glow Behind Fragment */}
              <div 
                aria-hidden="true" 
                className="absolute -inset-1.5 bg-gradient-to-r from-white/10 via-slate-600/10 to-indigo-500/10 rounded-2xl blur-xl opacity-60"
              />

              {/* Main Card Container */}
              <div 
                data-ui
                className="relative rounded-2xl bg-[#0e121a] border border-white/[0.12] shadow-2xl overflow-hidden"
              >
                {/* Metallic Top Sheen Line */}
                <div className="h-[1px] w-full metallic-sheen-line" />

                {/* Card Header with Brushed Trajectory Header */}
                <div className="relative h-28 w-full overflow-hidden border-b border-white/[0.08] bg-[#090c12]">
                  <img
                    src="/images/career_trajectory_map.jpg"
                    alt="Precision navigation coordinate lines etched into brushed metallic titanium"
                    className="w-full h-full object-cover opacity-60 mix-blend-screen scale-105"
                    loading="eager"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0e121a] via-transparent to-black/40" />
                  
                  {/* Real-time Telemetry Coordinates Overlay */}
                  <div className="absolute top-3 left-4 right-4 flex items-center justify-between text-[13px] font-mono text-white/80">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>SAN FRANCISCO · 37.7749° N</span>
                    </div>
                    <span className="text-white/50">OPP_ROUTE #8942</span>
                  </div>

                  <div className="absolute bottom-2.5 left-4 right-4 flex items-end justify-between">
                    <div>
                      <h3 className="font-display text-base font-bold text-white tracking-tight">
                        Staff Frontend Engineer
                      </h3>
                      <p className="text-[13px] text-white/70 font-sans">
                        Linear · Core Platform Engineering
                      </p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded text-[13px] font-mono font-semibold border ${currentStage.statusClass}`}>
                      {currentStage.label}
                    </span>
                  </div>
                </div>

                {/* Card Body & Dynamic Interactive Stages */}
                <div className="p-5 sm:p-6 space-y-4">
                  
                  {/* Interactive Stage Advancer */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[13px] font-medium text-ink-secondary">
                        Advance application stage:
                      </span>
                      <span className="font-mono text-[13px] text-white/60">
                        {currentStage.stepNumber}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2">
                      {DEMO_STAGES.map((s) => {
                        const isSelected = activeStageKey === s.key
                        return (
                          <button
                            key={s.key}
                            type="button"
                            onClick={() => handleStageSelect(s.key)}
                            className={`py-2 px-3 rounded-lg text-[13px] font-medium transition-all text-center ${
                              isSelected
                                ? 'bg-white text-black font-semibold shadow-md'
                                : 'bg-surface-secondary/80 text-ink-secondary hover:text-white hover:bg-surface-elevated border border-white/[0.04]'
                            }`}
                          >
                            {s.label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Dynamic Status Timeline Box with Transition */}
                  <div 
                    ref={cardContentRef}
                    className="p-4 rounded-xl bg-surface-secondary/90 border border-white/[0.06] space-y-2.5"
                  >
                    <div className="flex items-center justify-between text-[13px] font-mono text-ink-muted">
                      <span>MILESTONE DETAILS</span>
                      <span className="text-white font-medium">{currentStage.date}</span>
                    </div>
                    
                    <p className="text-sm font-semibold text-white font-sans">
                      {currentStage.timeline}
                    </p>

                    <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[13px] text-ink-secondary">
                      <span className="font-mono text-[13px] text-white/50">NEXT:</span>
                      <span className="font-sans text-[13px] text-white/90">{currentStage.nextAction}</span>
                    </div>
                  </div>

                  {/* Card Telemetry Footer */}
                  <div className="pt-2 flex items-center justify-between text-[13px] font-mono text-ink-muted border-t border-white/[0.06]">
                    <div className="flex items-center gap-1.5">
                      <span className="text-emerald-400 font-semibold">$190k - $235k</span>
                      <span className="text-white/50">Base Band</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-white/[0.06] text-[13px]">Remote</span>
                      <span className="px-2 py-0.5 rounded bg-white/[0.06] text-[13px]">Full-time</span>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  )
}

