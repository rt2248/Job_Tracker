import React from 'react'

const STEPS = [
  {
    step: '01',
    title: 'Discover & Index',
    desc: 'Search active tech opportunities with real-time location comboboxes and experience filters.',
    tag: 'SEARCH ENGINE',
  },
  {
    step: '02',
    title: 'Track Pipeline',
    desc: 'Enforce status transitions from Applied to Interview and Offer with interactive drag & drop.',
    tag: 'KANBAN SYSTEM',
  },
  {
    step: '03',
    title: 'Resume Attachments',
    desc: 'Keep target resume versions and application documents linked directly to your user profile.',
    tag: 'DOCUMENT VAULT',
  },
  {
    step: '04',
    title: 'Manage Network',
    desc: 'Log recruiters, referral contacts, and interview feedback to maximize your response rate.',
    tag: 'NETWORK CRM',
  },
]

export default function WorkflowSection() {
  return (
    <section id="workflow" className="py-20 lg:py-28 bg-canvas border-t border-border-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-elevated border border-border-primary text-xs font-mono font-semibold text-ink-secondary mb-4 uppercase tracking-wider">
            WORKFLOW RHYTHM
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-ink tracking-tight mb-4">
            How Evolexa powers your job search
          </h2>
          <p className="text-base sm:text-lg text-ink-secondary leading-relaxed font-sans">
            Replace chaotic spreadsheets with a structured, developer-focused application operating system.
          </p>
        </div>

        {/* 4-Step Process Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((s) => (
            <div
              key={s.step}
              className="p-6 rounded-2xl bg-surface-primary border border-border-primary flex flex-col justify-between transition-all duration-200 hover:border-border-accent/50 group"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <span className="text-2xl font-mono font-bold text-ink-muted group-hover:text-ink transition-colors">
                    {s.step}
                  </span>
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-surface-secondary border border-border-subtle text-ink-secondary">
                    {s.tag}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-ink font-display mb-2">{s.title}</h3>
                <p className="text-xs sm:text-sm text-ink-muted leading-relaxed font-sans">{s.desc}</p>
              </div>

              <div className="mt-8 pt-4 border-t border-border-subtle flex items-center justify-between text-xs text-ink-muted">
                <span>Phase {s.step}</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
