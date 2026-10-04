import React from 'react'

const CAPABILITIES = [
  {
    title: 'Stage-Enforced Kanban',
    desc: 'Drag and drop applications across status columns with accurate state updates and drag click-guards.',
    tag: 'PIPELINE',
  },
  {
    title: 'Resume Document Vault',
    desc: 'Attach default resume PDFs to your user profile for quick application submissions.',
    tag: 'DOCUMENTS',
  },
  {
    title: 'Network Contact CRM',
    desc: 'Keep track of recruiters, hiring managers, and referral contacts connected to your target companies.',
    tag: 'NETWORKING',
  },
  {
    title: 'Job Search & Combobox',
    desc: 'Filter active engineering listings by location, work mode, and experience requirements.',
    tag: 'DISCOVERY',
  },
  {
    title: 'Application Metrics',
    desc: 'View real-time application totals, interview counts, and offer metrics at a glance.',
    tag: 'ANALYTICS',
  },
  {
    title: 'Responsive Shell Architecture',
    desc: 'Enjoy a sleek white-panel floating sidebar and high-contrast dark workspace on any screen size.',
    tag: 'SYSTEM',
  },
]

export default function CapabilitiesSection() {
  return (
    <section id="capabilities" className="py-20 lg:py-28 bg-canvas border-t border-border-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-elevated border border-border-primary text-xs font-mono font-semibold text-ink-secondary mb-4 uppercase tracking-wider">
            PRODUCT CAPABILITIES
          </div>
          <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-ink tracking-tight mb-4">
            Built for serious job seekers
          </h2>
          <p className="text-base sm:text-lg text-ink-secondary leading-relaxed font-sans">
            Every feature in Evolexa is designed to increase applicant organization, speed up tracking, and improve response rates.
          </p>
        </div>

        {/* 6-Grid Capabilities Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CAPABILITIES.map((cap) => (
            <div
              key={cap.title}
              className="p-6 rounded-2xl bg-surface-primary border border-border-primary flex flex-col justify-between transition-all duration-200 hover:border-border-accent/40 group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-surface-secondary border border-border-subtle text-ink-secondary">
                    {cap.tag}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-ink font-display mb-2">{cap.title}</h3>
                <p className="text-xs sm:text-sm text-ink-muted leading-relaxed font-sans">{cap.desc}</p>
              </div>

              <div className="mt-6 pt-4 border-t border-border-subtle text-xs font-mono text-ink-muted group-hover:text-ink transition-colors flex items-center justify-between">
                <span>Verified feature</span>
                <span>✓</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
