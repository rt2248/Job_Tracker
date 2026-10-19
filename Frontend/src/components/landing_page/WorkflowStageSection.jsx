import React, { useState } from 'react'

const STEPS = [
  {
    id: 'index',
    lead: 'First, index your target opportunities.',
    desc: 'Search tech roles with location comboboxes, verified compensation bands, and remote work filters.',
    badge: 'Discovery Engine',
  },
  {
    id: 'pipeline',
    lead: 'Next, transition stages with Kanban clarity.',
    desc: 'Move applications through Saved, Applied, Online Assessment, Interview, and Offer with stage enforcement.',
    badge: 'Kanban OS',
  },
  {
    id: 'vault',
    lead: 'Finally, vault resumes and recruiter contacts.',
    desc: 'Keep customized resume PDFs and interview contact records directly linked to each application.',
    badge: 'Document Vault',
  },
]

export default function WorkflowStageSection() {
  const [activeStepId, setActiveStepId] = useState('pipeline')

  return (
    <section id="workflow" className="py-20 md:py-28 bg-canvas">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="max-w-3xl mb-16">
          <h2
            data-reveal
            style={{ '--delay': 0 }}
            className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4"
          >
            How Evolexa coordinates your job hunt.
          </h2>
          <p
            data-reveal
            style={{ '--delay': 1 }}
            className="text-base sm:text-lg text-ink-secondary leading-relaxed font-sans"
          >
            A cohesive three-step system designed to eliminate lost application links, missed follow-ups, and spreadsheet chaos.
          </p>
        </div>

        {/* 2-Column Split Composition */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
          
          {/* Left Column: Interactive Step Statements */}
          <div className="lg:col-span-5 space-y-4">
            {STEPS.map((step, idx) => {
              const isActive = activeStepId === step.id
              return (
                <button
                  key={step.id}
                  data-reveal
                  style={{ '--delay': idx + 1 }}
                  type="button"
                  onClick={() => setActiveStepId(step.id)}
                  className={`w-full text-left p-6 rounded-xl transition-colors ${
                    isActive
                      ? 'bg-surface-primary text-white'
                      : 'bg-surface-secondary/40 text-ink-secondary hover:bg-surface-secondary/80'
                  }`}
                >
                  <span className="text-[13px] font-semibold text-ink-muted mb-2 block">
                    {step.badge}
                  </span>
                  <h3 className="font-display text-lg font-bold text-white mb-2 leading-snug">
                    {step.lead}
                  </h3>
                  <p className="text-base text-ink-secondary leading-relaxed font-sans">
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
              data-reveal
              style={{ '--delay': 2, minHeight: '380px' }}
              className="w-full bg-surface-primary rounded-xl p-6 sm:p-8 border border-surface-overlay"
            >
              {/* State 1: Discovery Engine Preview */}
              {activeStepId === 'index' && (
                <div className="space-y-4">
                  <div className="p-3 bg-surface-secondary rounded-lg flex items-center justify-between text-[13px] text-ink-muted">
                    <span>Job Search & Combobox Indexing</span>
                    <span className="text-emerald-400 font-medium">Active Filters Applied</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    <div className="p-3 bg-surface-secondary rounded-lg">
                      <span className="text-[13px] text-ink-muted block">Role Keyword</span>
                      <span className="text-sm font-semibold text-white">Systems Engineer</span>
                    </div>
                    <div className="p-3 bg-surface-secondary rounded-lg">
                      <span className="text-[13px] text-ink-muted block">Location Combobox</span>
                      <span className="text-sm font-semibold text-white">United States (Remote)</span>
                    </div>
                    <div className="p-3 bg-surface-secondary rounded-lg">
                      <span className="text-[13px] text-ink-muted block">Work Mode</span>
                      <span className="text-sm font-semibold text-white">Full-time</span>
                    </div>
                  </div>

                  <div className="mt-4 p-4 rounded-lg bg-surface-secondary space-y-2 border border-surface-overlay">
                    <div className="flex items-center justify-between text-[13px] text-ink-muted">
                      <span>Cloudflare · Systems Architecture</span>
                      <span className="text-emerald-400">$190k - $240k</span>
                    </div>
                    <p className="text-sm font-bold text-white">
                      Staff Infrastructure & Distributed Systems
                    </p>
                    <p className="text-[13px] text-ink-secondary">
                      Go, Rust, Kubernetes, Edge Networking. Matched to your tech profile.
                    </p>
                  </div>
                </div>
              )}

              {/* State 2: Kanban Pipeline Preview */}
              {activeStepId === 'pipeline' && (
                <div className="space-y-4">
                  <div className="p-3 bg-surface-secondary rounded-lg flex items-center justify-between text-[13px] text-ink-muted">
                    <span>Kanban Pipeline Transitions</span>
                    <span>3 Stage Buckets</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                    {/* Applied Column */}
                    <div className="p-3 rounded-lg bg-surface-secondary space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-white">
                        <span>Applied</span>
                        <span className="px-1.5 py-0.5 rounded bg-surface-primary text-[13px] text-ink-muted">2</span>
                      </div>
                      <div className="p-2.5 rounded bg-surface-primary border border-surface-overlay text-xs space-y-1">
                        <p className="font-bold text-white text-[13px]">Stripe</p>
                        <p className="text-ink-muted text-[13px]">Backend Architect</p>
                      </div>
                      <div className="p-2.5 rounded bg-surface-primary border border-surface-overlay text-xs space-y-1">
                        <p className="font-bold text-white text-[13px]">Figma</p>
                        <p className="text-ink-muted text-[13px]">Design Systems Lead</p>
                      </div>
                    </div>

                    {/* Interview Column */}
                    <div className="p-3 rounded-lg bg-surface-secondary space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-white">
                        <span>Interview</span>
                        <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[13px]">1</span>
                      </div>
                      <div className="p-2.5 rounded bg-surface-primary border border-amber-500/40 text-xs space-y-1">
                        <p className="font-bold text-white text-[13px]">Linear</p>
                        <p className="text-ink-muted text-[13px]">Round 2: Architecture</p>
                      </div>
                    </div>

                    {/* Offer Column */}
                    <div className="p-3 rounded-lg bg-surface-secondary space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-white">
                        <span>Offer</span>
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[13px]">1</span>
                      </div>
                      <div className="p-2.5 rounded bg-surface-primary border border-emerald-500/40 text-xs space-y-1">
                        <p className="font-bold text-white text-[13px]">Anthropic</p>
                        <p className="text-emerald-400 text-[13px]">Official Package</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* State 3: Document Vault & Recruiter CRM Preview */}
              {activeStepId === 'vault' && (
                <div className="space-y-4">
                  <div className="p-3 bg-surface-secondary rounded-lg flex items-center justify-between text-[13px] text-ink-muted">
                    <span>Document Vault & Contact Directory</span>
                    <span>Attached to Profile</span>
                  </div>

                  <div className="p-4 rounded-lg bg-surface-secondary space-y-3 border border-surface-overlay">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-bold text-white">Default Profile Resume</span>
                      <span className="text-[13px] text-emerald-400">PDF Linked</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-surface-primary rounded border border-surface-overlay">
                      <div className="w-8 h-8 rounded bg-surface-secondary text-white font-bold text-[13px] flex items-center justify-center shrink-0">
                        PDF
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-white">Systems_Engineer_Resume_2026.pdf</p>
                        <p className="text-[13px] text-ink-muted">Updated 3 days ago · 142 KB</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-surface-secondary space-y-2 border border-surface-overlay">
                    <div className="flex items-center justify-between text-[13px] text-ink-muted">
                      <span>Recruiter Contact CRM</span>
                      <span>Linear Engineering</span>
                    </div>
                    <p className="text-sm font-bold text-white">
                      Sarah Jenkins · Senior Technical Recruiter
                    </p>
                    <p className="text-[13px] text-ink-secondary">
                      Followed up on interview scheduling. Next contact date: Monday, 9:00 AM.
                    </p>
                  </div>
                </div>
              )}

              {/* Status Note */}
              <div className="mt-6 p-3 rounded-lg bg-surface-secondary flex items-center justify-between text-[13px] text-ink-muted">
                <span>Verified Evolexa System Capability</span>
                <span>Real-time state synchronization</span>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  )
}
