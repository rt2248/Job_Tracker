import React, { useState } from 'react'
import { Link } from 'react-router-dom'

const DEMO_STAGES = [
  { key: 'applied', label: 'Applied', timeline: 'Submitted via referral', date: 'Oct 14' },
  { key: 'interview', label: 'Interview', timeline: 'Round 2: Architecture Deep Dive', date: 'Tomorrow, 2:00 PM' },
  { key: 'offer', label: 'Offer', timeline: 'Base $210k + $75k Equity Grant', date: 'Formal Letter' },
]

export default function Hero() {
  const [activeStageKey, setActiveStageKey] = useState('interview')
  const currentStage = DEMO_STAGES.find((s) => s.key === activeStageKey) || DEMO_STAGES[1]

  return (
    <section id="pipeline" className="pt-28 pb-20 md:pt-36 md:pb-28 bg-canvas">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Composition Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Headline and Arguments */}
          <div className="lg:col-span-6 space-y-6">
            <h1
              data-reveal
              style={{ '--delay': 0 }}
              className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-[1.08]"
            >
              Track applications through every stage.
            </h1>

            <p
              data-reveal
              style={{ '--delay': 1 }}
              className="text-base sm:text-lg text-ink-secondary leading-relaxed max-w-xl font-sans"
            >
              Evolexa replaces chaotic spreadsheets with stage-enforced Kanban pipelines, indexed engineering roles, and linked resume document management.
            </p>

            {/* CTAs */}
            <div
              data-reveal
              style={{ '--delay': 2 }}
              className="flex flex-wrap items-center gap-4 pt-2"
            >
              <Link
                to="/signup"
                className="px-6 py-3.5 rounded text-sm font-semibold bg-white text-black hover:bg-neutral-200 transition-colors"
              >
                Start Tracking Free
              </Link>
              <Link
                to="/login"
                className="px-6 py-3.5 rounded text-sm font-medium bg-surface-secondary text-white hover:bg-surface-elevated transition-colors"
              >
                Sign In to Dashboard
              </Link>
            </div>

            {/* Factual Value Checklist */}
            <div
              data-reveal
              style={{ '--delay': 3 }}
              className="pt-4 text-[13px] text-ink-muted flex flex-wrap gap-x-6 gap-y-2"
            >
              <span>7 Workflow Stages</span>
              <span>·</span>
              <span>Verified Salary Bands</span>
              <span>·</span>
              <span>Direct Resume Vaulting</span>
            </div>
          </div>

          {/* Right Column: Live Interactive Product Fragment */}
          <div className="lg:col-span-6">
            <div
              data-ui
              data-reveal
              style={{ '--delay': 2, minHeight: '320px' }}
              className="w-full max-w-lg mx-auto bg-surface-primary rounded-xl p-6 border border-surface-overlay"
            >
              {/* Top Bar of the Job Card */}
              <div className="p-4 rounded-lg bg-surface-secondary mb-4 flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-display text-lg font-bold text-white">
                    Staff Frontend Engineer
                  </h3>
                  <p className="text-sm text-ink-secondary mt-0.5">
                    Linear · San Francisco, CA (Remote)
                  </p>
                </div>
                <span
                  className={`px-2.5 py-1 rounded text-[13px] font-semibold ${
                    activeStageKey === 'offer'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : activeStageKey === 'interview'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-surface-primary text-ink-secondary'
                  }`}
                >
                  {currentStage.label}
                </span>
              </div>

              {/* Stage Switcher Buttons */}
              <div className="mb-4">
                <p className="text-[13px] text-ink-muted mb-2 font-medium">
                  Advance application stage:
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {DEMO_STAGES.map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => setActiveStageKey(s.key)}
                      className={`py-2 px-3 rounded text-[13px] font-medium text-center transition-colors ${
                        activeStageKey === s.key
                          ? 'bg-white text-black font-semibold'
                          : 'bg-surface-secondary text-ink-secondary hover:text-white hover:bg-surface-elevated'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Status Timeline Box */}
              <div className="p-4 rounded-lg bg-surface-secondary space-y-2 mb-4">
                <div className="flex items-center justify-between text-[13px] text-ink-muted">
                  <span>Current Milestone</span>
                  <span>{currentStage.date}</span>
                </div>
                <p className="text-sm font-medium text-white">
                  {currentStage.timeline}
                </p>
              </div>

              {/* Card Footer Metadata */}
              <div className="p-3 rounded-lg bg-surface-secondary flex items-center justify-between text-[13px] text-ink-muted">
                <span>Compensation: $190,000 - $235,000</span>
                <span>Full-time</span>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  )
}
