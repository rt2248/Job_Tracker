import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'

const ALL_LISTINGS = [
  {
    id: 'l1',
    role: 'Distributed Systems Engineer',
    company: 'Cloudflare',
    location: 'Austin, TX · Remote',
    salary: '$190,000 - $240,000',
    type: 'Full-time',
    level: 'Senior',
  },
  {
    id: 'l2',
    role: 'Staff Frontend Engineer',
    company: 'Linear',
    location: 'San Francisco, CA · Hybrid',
    salary: '$180,000 - $225,000',
    type: 'Full-time',
    level: 'Staff',
  },
  {
    id: 'l3',
    role: 'Infrastructure Platform Lead',
    company: 'Datadog',
    location: 'New York, NY · On-site',
    salary: '$210,000 - $265,000',
    type: 'Full-time',
    level: 'Lead',
  },
  {
    id: 'l4',
    role: 'ML Inference Systems Engineer',
    company: 'Anthropic',
    location: 'San Francisco, CA · Remote',
    salary: '$220,000 - $275,000',
    type: 'Full-time',
    level: 'Senior',
  },
  {
    id: 'l5',
    role: 'Backend API Architect',
    company: 'Stripe',
    location: 'Seattle, WA · Remote',
    salary: '$195,000 - $245,000',
    type: 'Full-time',
    level: 'Staff',
  },
]

const PRESET_QUERIES = [
  'Distributed Systems',
  'Frontend Engineer',
  'Infrastructure',
  'Anthropic',
]

export default function LiveSearchShowcase() {
  const [query, setQuery] = useState('Distributed Systems')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return ALL_LISTINGS.slice(0, 3)
    const matches = ALL_LISTINGS.filter(
      (job) =>
        job.role.toLowerCase().includes(q) ||
        job.company.toLowerCase().includes(q) ||
        job.location.toLowerCase().includes(q)
    )
    return matches.length > 0 ? matches : ALL_LISTINGS.slice(0, 2)
  }, [query])

  return (
    <section id="discovery" className="py-20 md:py-28 bg-canvas-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <h2
            data-reveal
            style={{ '--delay': 0 }}
            className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-4"
          >
            Index and search verified engineering listings.
          </h2>
          <p
            data-reveal
            style={{ '--delay': 1 }}
            className="text-base sm:text-lg text-ink-secondary leading-relaxed font-sans"
          >
            Search active developer roles with verified compensation ranges, work mode requirements, and direct one-click pipeline tracking.
          </p>
        </div>

        {/* Live Search Interface Fragment */}
        <div
          data-ui
          data-reveal
          style={{ '--delay': 2 }}
          className="w-full max-w-4xl bg-surface-primary rounded-xl p-6 sm:p-8 border border-surface-overlay"
        >
          {/* Interactive Search Input */}
          <div className="relative mb-6">
            <label htmlFor="landing-job-search" className="block text-[13px] font-medium text-ink-muted mb-2">
              Filter roles by title, technology, or company name:
            </label>
            <div className="flex items-center gap-3 px-4 py-3 bg-surface-secondary rounded-lg border border-surface-overlay focus-within:border-white">
              <svg
                className="w-5 h-5 text-ink-muted shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                id="landing-job-search"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type to filter opportunities..."
                className="w-full bg-transparent text-white placeholder-ink-muted text-base focus:outline-none"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="text-[13px] text-ink-muted hover:text-white px-2 py-1"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Quick Query Pills */}
          <div className="flex flex-wrap items-center gap-2 mb-8">
            <span className="text-[13px] text-ink-muted font-medium mr-1">
              Sample queries:
            </span>
            {PRESET_QUERIES.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setQuery(preset)}
                className={`px-3 py-1.5 rounded text-[13px] transition-colors ${
                  query.toLowerCase() === preset.toLowerCase()
                    ? 'bg-white text-black font-semibold'
                    : 'bg-surface-secondary text-ink-secondary hover:text-white hover:bg-surface-elevated'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>

          {/* Live Matching Results List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[13px] text-ink-muted pb-2">
              <span>Matching Listings ({filtered.length})</span>
              <span>Direct Discovery View</span>
            </div>

            {filtered.map((item, idx) => (
              <div
                key={item.id}
                data-reveal
                style={{ '--delay': idx + 1 }}
                className="p-4 rounded-lg bg-surface-secondary hover:bg-surface-elevated transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-surface-overlay"
              >
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-base font-bold text-white">
                      {item.role}
                    </h3>
                    <span className="text-[13px] px-2 py-0.5 rounded bg-surface-primary text-ink-secondary">
                      {item.level}
                    </span>
                  </div>
                  <p className="text-[13px] text-ink-secondary">
                    {item.company} · {item.location}
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                  <span className="text-[13px] text-emerald-400 font-medium">
                    {item.salary}
                  </span>
                  <Link
                    to="/signup"
                    className="px-3 py-1.5 rounded text-[13px] font-semibold bg-white text-black hover:bg-neutral-200 transition-colors"
                  >
                    Track Job
                  </Link>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </section>
  )
}
