import React, { useState, useRef, useEffect } from 'react'
import gsap from 'gsap'

const STEPS = [
  {
    id: 'index',
    stepNumber: '01',
    badge: 'Discovery Engine',
    lead: 'First, find opportunities worth tracking.',
    desc: 'Narrow your search by role, company, skills, and location. Save the opportunities you want to revisit.',
  },
  {
    id: 'pipeline',
    stepNumber: '02',
    badge: 'Kanban OS',
    lead: 'Next, keep each application stage in view.',
    desc: 'Keep each application moving through stages such as Saved, Applied, Interview, and Offer.',
  },
  {
    id: 'vault',
    stepNumber: '03',
    badge: 'Document Vault',
    lead: 'Finally, keep notes and follow-ups close.',
    desc: 'Keep role notes, useful links, and follow-up context close to the application they belong to.',
  },
]

export default function WorkflowStageSection() {
  const [activeStepId, setActiveStepId] = useState('pipeline')
  const sectionRef = useRef(null)
  const stepListRef = useRef(null)
  const stagePanelRef = useRef(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (stepListRef.current) {
              gsap.fromTo(
                stepListRef.current.children,
                { opacity: 0, y: 16 },
                { opacity: 1, y: 0, duration: 0.5, stagger: 0.12, ease: 'power2.out' }
              )
            }
            if (stagePanelRef.current) {
              gsap.fromTo(
                stagePanelRef.current,
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', delay: 0.15 }
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

  const handleStepChange = (id) => {
    if (id === activeStepId) return
    setActiveStepId(id)

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && stagePanelRef.current) {
      gsap.fromTo(
        stagePanelRef.current,
        { opacity: 0.4, y: 8 },
        { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }
      )
    }
  }

  return (
    <section ref={sectionRef} id="workflow" className="py-24 md:py-32 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="max-w-3xl mb-16">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-4 leading-tight">
            <span>How Evolexa coordinates </span>
            <span className="text-metallic-silver">your job hunt.</span>
          </h2>
          <p className="text-base sm:text-lg text-ink-secondary leading-relaxed font-sans max-w-xl">
            Find roles, keep application details together, and make follow-ups easier to remember.
          </p>
        </div>

        {/* 2-Column Split Composition */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          
          {/* Left Column: Interactive Step Statements */}
          <div ref={stepListRef} data-ui className="lg:col-span-5 space-y-3.5">
            {STEPS.map((step) => {
              const isActive = activeStepId === step.id
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => handleStepChange(step.id)}
                  className={`w-full text-left p-5 sm:p-6 rounded-xl transition-all relative overflow-hidden ${
                    isActive
                      ? 'surface-metallic-card border-white/20 shadow-xl'
                      : 'bg-[#0d1118] text-ink-secondary hover:bg-[#121722] border border-white/[0.04]'
                  }`}
                >
                  {/* Active Indicator Bar */}
                  {isActive && (
                    <div className="absolute top-0 bottom-0 left-0 w-1 bg-gradient-to-b from-white via-slate-300 to-indigo-400" />
                  )}

                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[13px] font-semibold text-white/70 tracking-wide">
                      {step.badge}
                    </span>
                    {isActive && (
                      <span className="text-[13px] font-medium text-emerald-400 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        Active
                      </span>
                    )}
                  </div>

                  <h3 className="font-display text-base sm:text-lg font-bold text-white mb-1.5 leading-snug">
                    {step.lead}
                  </h3>
                  <p className="text-sm sm:text-base text-ink-secondary leading-relaxed font-sans">
                    {step.desc}
                  </p>
                </button>
              )
            })}
          </div>

          {/* Right Column: Dynamic Coordinated Interface Fragment */}
          <div className="lg:col-span-7">
            <div
              data-ui
              className="w-full surface-metallic-panel rounded-2xl p-6 sm:p-8 relative overflow-hidden bg-[#0a0d14]"
            >
              {/* Top Sheen */}
              <div className="absolute top-0 left-0 right-0 h-[1px] metallic-sheen-line" />

              <div ref={stagePanelRef}>
                {/* State 1: Discovery Engine Preview */}
                {activeStepId === 'index' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-[13px] font-mono text-ink-muted pb-3 border-b border-white/[0.06]">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>SAMPLE ROLE SEARCH</span>
                      </div>
                      <span className="text-emerald-400 font-semibold">SEARCH FILTERS</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      <div className="p-3 bg-surface-secondary/80 rounded-xl border border-white/[0.06]">
                        <span className="text-[13px] font-mono text-ink-muted block">KEYWORD</span>
                        <span className="text-sm font-semibold text-white">Systems Engineer</span>
                      </div>
                      <div className="p-3 bg-surface-secondary/80 rounded-xl border border-white/[0.06]">
                        <span className="text-[13px] font-mono text-ink-muted block">LOCATION</span>
                        <span className="text-sm font-semibold text-white">US (Remote)</span>
                      </div>
                      <div className="p-3 bg-surface-secondary/80 rounded-xl border border-white/[0.06]">
                        <span className="text-[13px] font-mono text-ink-muted block">LOCATION</span>
                        <span className="text-sm font-semibold text-emerald-400">Remote</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl surface-metallic-card space-y-2">
                      <div className="flex items-center justify-between text-[13px] font-mono text-ink-muted">
                        <span className="text-white/80 font-semibold">Meridian Systems · Platform</span>
                        <span className="text-emerald-400">Remote</span>
                      </div>
                      <p className="text-sm font-bold text-white">
                        Platform Engineer
                      </p>
                      <p className="text-sm text-ink-secondary font-sans">
                        Go, Rust, Kubernetes · illustrative sample role
                      </p>
                    </div>
                  </div>
                )}

                {/* State 2: Kanban Pipeline Preview */}
                {activeStepId === 'pipeline' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-[13px] font-mono text-ink-muted pb-3 border-b border-white/[0.06]">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                        <span>APPLICATION STAGES</span>
                      </div>
                      <span className="text-white/50">EXAMPLE VIEW</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                      {/* Applied Column */}
                      <div className="p-3.5 rounded-xl bg-surface-secondary/80 border border-white/[0.06] space-y-2.5">
                        <div className="flex items-center justify-between text-[13px] font-mono font-bold text-white">
                          <span>Applied</span>
                          <span className="px-1.5 py-0.5 rounded bg-white/[0.06] text-[13px] text-white/70">2</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-[#0a0d14] border border-white/[0.06] text-[13px] space-y-1">
                          <p className="font-bold text-white">Northstar Labs</p>
                          <p className="text-white/50 text-[13px]">Backend Engineer</p>
                        </div>
                        <div className="p-2.5 rounded-lg bg-[#0a0d14] border border-white/[0.06] text-[13px] space-y-1">
                          <p className="font-bold text-white">Juniper Health</p>
                          <p className="text-white/50 text-[13px]">Product Engineer</p>
                        </div>
                      </div>

                      {/* Interview Column */}
                      <div className="p-3.5 rounded-xl bg-surface-secondary/80 border border-amber-500/20 space-y-2.5">
                        <div className="flex items-center justify-between text-[13px] font-mono font-bold text-white">
                          <span>Interview</span>
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[13px]">1</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-[#0a0d14] border border-amber-500/30 text-[13px] space-y-1 shadow-sm">
                          <p className="font-bold text-white">Fieldnote</p>
                          <p className="text-amber-300 text-[13px]">Round 2: Architecture</p>
                        </div>
                      </div>

                      {/* Offer Column */}
                      <div className="p-3.5 rounded-xl bg-surface-secondary/80 border border-emerald-500/20 space-y-2.5">
                        <div className="flex items-center justify-between text-[13px] font-mono font-bold text-white">
                          <span>Offer</span>
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[13px]">1</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-[#0a0d14] border border-emerald-500/30 text-[13px] space-y-1 shadow-sm">
                          <p className="font-bold text-white">Meridian Systems</p>
                          <p className="text-emerald-400 text-[13px]">Example offer</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* State 3: Document Vault & Recruiter CRM Preview */}
                {activeStepId === 'vault' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-[13px] font-mono text-ink-muted pb-3 border-b border-white/[0.06]">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                        <span>VAULT STORAGE &amp; RECRUITER THREADS</span>
                      </div>
                      <span className="text-emerald-400 font-semibold">LINKED TO PROFILE</span>
                    </div>

                    <div className="p-4 rounded-xl surface-metallic-card space-y-3">
                      <div className="flex items-center justify-between text-[13px] font-mono">
                        <span className="font-bold text-white">RESUME FOR THIS APPLICATION</span>
                        <span className="text-emerald-400">RESUME FILE</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-[#0a0d14] rounded-lg border border-white/[0.06]">
                        <div className="w-8 h-8 rounded bg-white/[0.08] text-white font-mono font-bold text-[13px] flex items-center justify-center shrink-0 border border-white/10">
                          PDF
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-white truncate">Staff_Systems_Engineer_2026.pdf</p>
                          <p className="text-[13px] font-mono text-white/50">Attached to this example application</p>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl surface-metallic-card space-y-2">
                      <div className="flex items-center justify-between text-[13px] font-mono text-ink-muted">
                        <span className="text-white font-semibold">Sarah Jenkins · Recruiting contact</span>
                        <span className="text-white/40">Fieldnote Corp</span>
                      </div>
                      <p className="text-sm text-ink-secondary font-sans">
                        A sample contact note kept with the application for interview preparation.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Status Note */}
              <div className="mt-6 pt-4 border-t border-white/[0.06] flex items-center justify-between text-[13px] font-mono text-white/50">
                <span>EXAMPLE WORKFLOW PREVIEW</span>
                <span>APPLICATION DETAILS IN ONE PLACE</span>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  )
}




