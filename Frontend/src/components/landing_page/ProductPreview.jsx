import React, { useState } from 'react'
import Badge from '../shared/Badge'
import Card from '../shared/Card'

const INITIAL_CARDS = [
  { id: '1', title: 'Senior Software Engineer', company: 'Stripe', location: 'San Francisco, CA (Remote)', status: 'Applied', type: 'Full-time', salary: '$180k - $220k', date: '2d ago' },
  { id: '2', title: 'Frontend Developer', company: 'Linear', location: 'New York, NY (Hybrid)', status: 'Interview', type: 'Full-time', salary: '$160k - $195k', date: '1d ago' },
  { id: '3', title: 'Staff Systems Engineer', company: 'Cloudflare', location: 'Austin, TX (Remote)', status: 'OA', type: 'Full-time', salary: '$190k - $240k', date: '3d ago' },
  { id: '4', title: 'ML Platform Engineer', company: 'Anthropic', location: 'San Francisco, CA', status: 'Offer', type: 'Full-time', salary: '$210k - $260k', date: 'Just now' },
  { id: '5', title: 'Full Stack Engineer', company: 'Vercel', location: 'Remote', status: 'Applied', type: 'Full-time', salary: '$170k - $210k', date: '4d ago' },
  { id: '6', title: 'Backend Engineer', company: 'GitHub', location: 'Remote', status: 'Rejected', type: 'Full-time', salary: '$175k - $215k', date: '1w ago' },
]

const COLUMNS = [
  { key: 'Applied', title: 'Applied', count: 2, variant: 'indigo' },
  { key: 'OA', title: 'OA / Test', count: 1, variant: 'indigo' },
  { key: 'Interview', title: 'Interview', count: 1, variant: 'amber' },
  { key: 'Offer', title: 'Offer', count: 1, variant: 'emerald' },
  { key: 'Rejected', title: 'Closed', count: 1, variant: 'rose' },
]

export default function ProductPreview() {
  const [selectedColumn, setSelectedColumn] = useState('All')

  const filteredCards = selectedColumn === 'All'
    ? INITIAL_CARDS
    : INITIAL_CARDS.filter(c => c.status === selectedColumn || (selectedColumn === 'Rejected' && c.status === 'Rejected'))

  return (
    <div className="w-full rounded-2xl bg-surface-primary border border-border-primary shadow-2xl overflow-hidden text-left">
      
      {/* Mock Header / App Bar */}
      <div className="px-4 sm:px-6 py-3.5 bg-surface-secondary/80 border-b border-border-subtle flex flex-wrap items-center justify-between gap-3">
        
        {/* Left window dots + Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-full bg-neutral-700" />
            <div className="w-3 h-3 rounded-full bg-neutral-700" />
            <div className="w-3 h-3 rounded-full bg-neutral-700" />
          </div>
          <span className="text-xs font-mono text-ink-muted hidden sm:inline-block">
            evolexa.app / dashboard
          </span>
        </div>

        {/* Filter Toolbar */}
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar py-0.5">
          <button
            type="button"
            onClick={() => setSelectedColumn('All')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              selectedColumn === 'All'
                ? 'bg-white text-black font-semibold'
                : 'text-ink-secondary hover:text-ink hover:bg-surface-overlay'
            }`}
          >
            All (6)
          </button>
          {COLUMNS.map(col => (
            <button
              key={col.key}
              type="button"
              onClick={() => setSelectedColumn(col.key)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                selectedColumn === col.key
                  ? 'bg-white text-black font-semibold'
                  : 'text-ink-secondary hover:text-ink hover:bg-surface-overlay'
              }`}
            >
              {col.title}
            </button>
          ))}
        </div>

        {/* Search Mock */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-primary border border-border-subtle text-xs text-ink-muted">
          <span>🔍</span>
          <span>Filter pipeline...</span>
        </div>
      </div>

      {/* Grid Pipeline Display */}
      <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCards.map(job => (
          <Card key={job.id} hoverable className="bg-surface-secondary/70 border-border-primary flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h4 className="text-sm font-bold text-ink font-display line-clamp-1">{job.title}</h4>
                  <p className="text-xs text-ink-secondary font-medium mt-0.5">{job.company}</p>
                </div>
                <Badge
                  variant={
                    job.status === 'Offer'
                      ? 'emerald'
                      : job.status === 'Interview'
                      ? 'amber'
                      : job.status === 'Rejected'
                      ? 'rose'
                      : 'indigo'
                  }
                  size="sm"
                  className="shrink-0"
                >
                  {job.status}
                </Badge>
              </div>

              <p className="text-xs text-ink-muted line-clamp-1">{job.location}</p>
            </div>

            <div className="pt-3 border-t border-border-subtle flex items-center justify-between text-[11px] font-mono text-ink-muted">
              <span>{job.salary}</span>
              <span>{job.date}</span>
            </div>
          </Card>
        ))}
      </div>

    </div>
  )
}
