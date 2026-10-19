import React from 'react'

const CAPABILITIES = [
  {
    title: 'Stage-enforced Kanban pipeline',
    desc: 'Organize applications across dedicated status columns with clear state transitions from Saved to Offer.',
    demo: (
      <div className="p-4 bg-surface-secondary rounded-lg space-y-2 border border-surface-overlay">
        <div className="flex items-center justify-between text-[13px] text-ink-muted">
          <span>Active Column Status</span>
          <span className="text-amber-300 font-medium">Interview Stage</span>
        </div>
        <div className="p-3 bg-surface-primary rounded border border-surface-overlay flex items-center justify-between">
          <div>
            <p className="text-[13px] font-bold text-white">Stripe · Backend Engineer</p>
            <p className="text-[13px] text-ink-secondary">Technical Screen Completed</p>
          </div>
          <span className="text-[13px] px-2 py-0.5 rounded bg-surface-secondary text-white font-medium">
            Advance →
          </span>
        </div>
      </div>
    ),
  },
  {
    title: 'Indexed job search and combobox filters',
    desc: 'Discover software engineering listings with verified salary ranges, seniority levels, and remote work modes.',
    demo: (
      <div className="p-4 bg-surface-secondary rounded-lg space-y-2 border border-surface-overlay">
        <div className="flex items-center justify-between text-[13px] text-ink-muted">
          <span>Search Engine Query</span>
          <span className="text-emerald-400 font-medium">Matched (12)</span>
        </div>
        <div className="p-3 bg-surface-primary rounded border border-surface-overlay space-y-1">
          <p className="text-[13px] font-bold text-white">Distributed Systems · Go/Rust</p>
          <p className="text-[13px] text-ink-muted">San Francisco, CA · Remote · $190k - $240k</p>
        </div>
      </div>
    ),
  },
  {
    title: 'Document vault and resume attachment',
    desc: 'Link tailored resume PDFs directly to your account profile for streamlined submissions and quick viewing.',
    demo: (
      <div className="p-4 bg-surface-secondary rounded-lg space-y-2 border border-surface-overlay">
        <div className="flex items-center justify-between text-[13px] text-ink-muted">
          <span>Profile Document Attachment</span>
          <span className="text-white font-medium">PDF Verified</span>
        </div>
        <div className="p-3 bg-surface-primary rounded border border-surface-overlay flex items-center justify-between">
          <div>
            <p className="text-[13px] font-bold text-white">Frontend_Lead_Resume.pdf</p>
            <p className="text-[13px] text-ink-muted">PDF Document · 138 KB</p>
          </div>
          <span className="text-[13px] text-ink-secondary">Linked</span>
        </div>
      </div>
    ),
  },
  {
    title: 'Recruiter and referral contact CRM',
    desc: 'Track hiring managers, referral contacts, and interview follow-up schedules connected to each target company.',
    demo: (
      <div className="p-4 bg-surface-secondary rounded-lg space-y-2 border border-surface-overlay">
        <div className="flex items-center justify-between text-[13px] text-ink-muted">
          <span>Company Network Thread</span>
          <span className="text-white font-medium">Contact Logged</span>
        </div>
        <div className="p-3 bg-surface-primary rounded border border-surface-overlay space-y-1">
          <p className="text-[13px] font-bold text-white">Sarah Jenkins · Technical Recruiting</p>
          <p className="text-[13px] text-ink-secondary">Linear · Follow-up scheduled for Monday</p>
        </div>
      </div>
    ),
  },
]

export default function CapabilitiesSection() {
  return (
    <section id="capabilities" className="py-20 md:py-28 bg-canvas-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="max-w-3xl mb-16">
          <h2
            data-reveal
            style={{ '--delay': 0 }}
            className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4"
          >
            Built for developer career management.
          </h2>
          <p
            data-reveal
            style={{ '--delay': 1 }}
            className="text-base sm:text-lg text-ink-secondary leading-relaxed font-sans"
          >
            Every capability in Evolexa solves a real pain point in the technical job search lifecycle.
          </p>
        </div>

        {/* 4 Asymmetric Demonstration Modules */}
        <div className="space-y-8 max-w-5xl">
          {CAPABILITIES.map((cap, idx) => (
            <div
              key={cap.title}
              data-reveal
              style={{ '--delay': idx }}
              className="p-6 sm:p-8 rounded-xl bg-surface-primary grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-center"
            >
              {/* Left Demonstration Fragment */}
              <div data-ui className="md:col-span-6 w-full">
                {cap.demo}
              </div>

              {/* Right Statement and Description */}
              <div className="md:col-span-6 space-y-2">
                <h3 className="font-display text-xl font-bold text-white">
                  {cap.title}
                </h3>
                <p className="text-base text-ink-secondary leading-relaxed font-sans">
                  {cap.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
