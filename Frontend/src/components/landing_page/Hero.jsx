import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'

const DEMO_STAGES = [
  {
    key: 'applied',
    label: 'Applied',
    tone: 'border-indigo-400/30 bg-indigo-400/10 text-indigo-200',
    company: 'Northstar Labs',
    role: 'Product Designer',
    update: 'Application submitted',
    nextAction: 'Check in with the hiring team',
    step: '02',
  },
  {
    key: 'interview',
    label: 'Interview',
    tone: 'border-cyan-300/30 bg-cyan-300/10 text-cyan-100',
    company: 'Northstar Labs',
    role: 'Product Designer',
    update: 'First conversation scheduled',
    nextAction: 'Prepare notes for your conversation',
    step: '04',
  },
  {
    key: 'offer',
    label: 'Offer',
    tone: 'border-emerald-300/30 bg-emerald-300/10 text-emerald-100',
    company: 'Northstar Labs',
    role: 'Product Designer',
    update: 'Offer received',
    nextAction: 'Review the offer details',
    step: '06',
  },
]

const PIPELINE_STAGES = ['Saved', 'Applied', 'Interview', 'Offer']

export default function Hero() {
  const [activeStageKey, setActiveStageKey] = useState('interview')
  const heroRef = useRef(null)
  const cardContentRef = useRef(null)
  const stageTweenRef = useRef(null)

  const currentStage = DEMO_STAGES.find((stage) => stage.key === activeStageKey) || DEMO_STAGES[1]

  useEffect(() => {
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (motionQuery.matches) return undefined

    const context = gsap.context(() => {
      const timeline = gsap.timeline({ defaults: { ease: 'power3.out' } })

      timeline
        .fromTo('.hero-copy', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.65 })
        .fromTo('.hero-preview', { opacity: 0, y: 22 }, { opacity: 1, y: 0, duration: 0.75 }, '-=0.35')
    }, heroRef)

    return () => {
      context.revert()
      stageTweenRef.current?.kill()
    }
  }, [])

  const handleStageSelect = (stageKey) => {
    if (stageKey === activeStageKey) return
    setActiveStageKey(stageKey)

    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches && cardContentRef.current) {
      stageTweenRef.current?.kill()
      stageTweenRef.current = gsap.fromTo(
        cardContentRef.current,
        { opacity: 0.55, y: 5 },
        { opacity: 1, y: 0, duration: 0.28, ease: 'power2.out' }
      )
    }
  }

  return (
    <section ref={heroRef} id="pipeline" className="relative isolate overflow-hidden pt-28 pb-16 sm:pt-32 sm:pb-20 lg:pt-40 lg:pb-28">
      <div aria-hidden="true" className="pointer-events-none absolute -top-40 left-[42%] -z-10 h-[520px] w-[760px] -translate-x-1/2 rounded-full bg-indigo-500/[0.09] blur-[120px]" />
      <div aria-hidden="true" className="pointer-events-none absolute right-[-12rem] top-[22rem] -z-10 h-[360px] w-[360px] rounded-full bg-cyan-400/[0.045] blur-[110px]" />

      <div className="mx-auto grid w-full max-w-7xl min-w-0 grid-cols-1 items-center gap-12 px-4 sm:px-6 md:gap-14 lg:grid-cols-12 lg:gap-10 lg:px-8">
        <div className="hero-copy min-w-0 space-y-6 lg:col-span-5 lg:space-y-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.09] bg-white/[0.025] px-3 py-1.5 text-xs font-medium tracking-wide text-ink-secondary">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan" aria-hidden="true" />
            A calmer way to run your job search
          </div>

          <div className="space-y-5">
            <h1 className="font-display text-[2.7rem] font-semibold leading-[1.02] tracking-[-0.045em] text-white sm:text-6xl lg:text-[4.2rem] xl:text-[4.6rem]">
              Keep every opportunity <span className="text-metallic-silver">moving.</span>
            </h1>
            <p className="max-w-lg text-base leading-7 text-ink-secondary sm:text-lg sm:leading-8">
              Find roles, keep each application organized, and know what to do next.
            </p>
          </div>

          <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:flex-wrap sm:items-center">
            <Link
              to="/signup"
              className="metallic-btn-primary inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold shadow-lg shadow-black/20 transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/70 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas motion-reduce:transform-none motion-reduce:transition-none"
            >
              Start tracking free <span aria-hidden="true">→</span>
            </Link>
            <Link
              to="/login"
              className="metallic-btn-secondary inline-flex min-h-12 items-center justify-center rounded-xl px-5 py-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/70 focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
            >
              Sign in
            </Link>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-white/[0.08] pt-5 text-sm text-ink-muted">
            <span className="inline-flex items-center gap-2"><span className="h-1 w-1 rounded-full bg-indigo" aria-hidden="true" />Application pipeline</span>
            <span className="inline-flex items-center gap-2"><span className="h-1 w-1 rounded-full bg-cyan" aria-hidden="true" />Job discovery</span>
            <span className="inline-flex items-center gap-2"><span className="h-1 w-1 rounded-full bg-white/50" aria-hidden="true" />Resume organization</span>
          </div>
        </div>

        <div className="hero-preview relative min-w-0 lg:col-span-7">
          <div aria-hidden="true" className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-indigo-400/[0.12] via-transparent to-cyan-300/[0.08] blur-2xl" />
          <div data-ui className="relative overflow-hidden rounded-2xl border border-white/[0.12] bg-[#0b0e14] shadow-[0_32px_100px_-38px_rgba(0,0,0,0.9)] sm:rounded-3xl">
            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/40 to-transparent" />

            <div className="flex items-center justify-between gap-4 border-b border-white/[0.07] px-4 py-4 sm:px-6 sm:py-5">
              <div className="min-w-0">
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-ink-muted">Your applications</p>
                <h2 className="mt-1 truncate font-display text-lg font-semibold tracking-tight text-white sm:text-xl">The next step, in view.</h2>
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-sm font-semibold text-white" aria-hidden="true">E</div>
            </div>

            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-4 gap-2 sm:gap-3" aria-label="Application pipeline stages">
                {PIPELINE_STAGES.map((stage, index) => {
                  const activeIndex = PIPELINE_STAGES.indexOf(currentStage.label)
                  const isCurrent = stage === currentStage.label
                  const isComplete = index < activeIndex
                  return (
                    <div key={stage} className="min-w-0">
                      <div className={`mb-2 h-1 rounded-full ${isCurrent ? 'bg-cyan' : isComplete ? 'bg-indigo-400/80' : 'bg-white/[0.09]'}`} />
                      <p className={`truncate text-[10px] sm:text-xs ${isCurrent ? 'font-semibold text-white' : isComplete ? 'text-ink-secondary' : 'text-ink-muted'}`}>{stage}</p>
                    </div>
                  )
                })}
              </div>

              <div className="mt-5 rounded-2xl border border-white/[0.09] bg-gradient-to-br from-white/[0.055] to-white/[0.02] p-4 sm:mt-6 sm:p-5">
                <div className="flex min-w-0 items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-white sm:text-base">{currentStage.role}</p>
                    <p className="mt-1 truncate text-sm text-ink-secondary">{currentStage.company}</p>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium ${currentStage.tone}`}>
                    {currentStage.label}
                  </span>
                </div>

                <div className="my-4 h-px bg-white/[0.07]" />

                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-ink-muted">
                    <span>Recent update</span>
                    <span className="font-mono">Stage {currentStage.step} of 07</span>
                  </div>
                  <p className="text-sm font-medium text-white">{currentStage.update}</p>
                </div>

                <div ref={cardContentRef} className="mt-4 flex items-start gap-3 rounded-xl border border-cyan-200/10 bg-cyan-300/[0.055] p-3.5 sm:p-4" aria-live="polite">
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cyan-200/10 text-xs text-cyan-100" aria-hidden="true">→</span>
                  <div className="min-w-0">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-100/70">Your next step</p>
                    <p className="mt-1 text-sm leading-5 text-white">{currentStage.nextAction}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2 sm:mt-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-ink-muted">Preview an application stage</p>
                <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="Choose an example application stage">
                  {DEMO_STAGES.map((stage) => {
                    const isSelected = activeStageKey === stage.key
                    return (
                      <button
                        key={stage.key}
                        type="button"
                        onClick={() => handleStageSelect(stage.key)}
                        aria-pressed={isSelected}
                        className={`min-h-9 rounded-lg border px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/70 motion-reduce:transition-none ${isSelected ? 'border-white/20 bg-white text-[#080a0f]' : 'border-white/[0.08] bg-white/[0.025] text-ink-secondary hover:border-white/20 hover:text-white'}`}
                      >
                        {stage.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          <div aria-hidden="true" className="absolute -bottom-5 -left-3 hidden rounded-xl border border-white/10 bg-[#11151e]/95 px-4 py-3 shadow-xl backdrop-blur-sm sm:block md:-left-7">
            <p className="text-[10px] uppercase tracking-[0.16em] text-ink-muted">One clear view</p>
            <p className="mt-1 text-sm font-medium text-white">From saved to offer</p>
          </div>
        </div>
      </div>
    </section>
  )
}


