import React, { useState, useMemo, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'

const PRESET_QUERIES = [
  'Distributed Systems',
  'Frontend',
  'Platform',
  'Anthropic',
  'Stripe',
]

const SAMPLE_LISTINGS = [
  {
    id: 's-1',
    role: 'Staff Infrastructure Engineer',
    company: 'Stripe',
    location: 'Remote (US/Canada)',
    salary: '$210,000 - $265,000',
    tags: ['Go', 'Kubernetes', 'High-throughput'],
    level: 'Staff',
  },
  {
    id: 's-2',
    role: 'Senior Frontend Architect',
    company: 'Linear',
    location: 'San Francisco, CA / Remote',
    salary: '$185,000 - $230,000',
    tags: ['React', 'TypeScript', 'WebAudio'],
    level: 'Senior',
  },
  {
    id: 's-3',
    role: 'Distributed Systems Core Lead',
    company: 'Cloudflare',
    location: 'Austin, TX / Remote',
    salary: '$195,000 - $245,000',
    tags: ['Rust', 'eBPF', 'Networking'],
    level: 'Lead',
  },
  {
    id: 's-4',
    role: 'Member of Technical Staff (Platform)',
    company: 'Anthropic',
    location: 'San Francisco, CA',
    salary: '$220,000 - $290,000',
    tags: ['Python', 'Distributed Training', 'GPU'],
    level: 'Staff',
  },
  {
    id: 's-5',
    role: 'Full Stack Performance Specialist',
    company: 'Datadog',
    location: 'New York, NY / Remote',
    salary: '$175,000 - $220,000',
    tags: ['TypeScript', 'Go', 'Observability'],
    level: 'Senior',
  },
]

export default function LiveSearchShowcase() {
  const [query, setQuery] = useState('')
  const sectionRef = useRef(null)
  const panelRef = useRef(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (panelRef.current) {
              gsap.fromTo(
                panelRef.current,
                { opacity: 0, y: 24 },
                { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
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

  const filtered = useMemo(() => {
    if (!query.trim()) return SAMPLE_LISTINGS.slice(0, 3)
    const q = query.toLowerCase()
    return SAMPLE_LISTINGS.filter(
      (item) =>
        item.role.toLowerCase().includes(q) ||
        item.company.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q))
    )
  }, [query])

  return (
    <section ref={sectionRef} id="discovery" className="py-24 md:py-32 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="max-w-3xl mb-12">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-4 leading-tight">
            <span>Explore live engineering </span>
            <span className="text-metallic-silver">opportunities.</span>
          </h2>
          <p className="text-base sm:text-lg text-ink-secondary leading-relaxed font-sans max-w-xl">
            Search active developer roles with verified compensation ranges, work mode requirements, and direct one-click pipeline tracking.
          </p>
        </div>

        {/* Live Search Interface Fragment */}
        <div
          ref={panelRef}
          data-ui
          className="w-full max-w-4xl surface-metallic-panel rounded-2xl p-6 sm:p-8 relative overflow-hidden bg-[#0a0d14]"
        >
          {/* Top Sheen */}
          <div className="absolute top-0 left-0 right-0 h-[1px] metallic-sheen-line" />

          {/* Interactive Search Input */}
          <div className="relative mb-6">
            <label htmlFor="landing-job-search" className="flex items-center justify-between text-[13px] font-mono text-ink-muted mb-2">
              <span>FILTER ROLES BY TITLE, TECHNOLOGY, OR COMPANY:</span>
              <span className="text-white/40">LIVE_GREP</span>
            </label>
            <div className="flex items-center gap-3 px-4 py-3 bg-[#0a0d14] rounded-xl border border-white/[0.09] focus-within:border-white/30 transition-all shadow-inner">
              <svg
                className="w-5 h-5 text-white/50 shrink-0"
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
                placeholder="Type role keyword, tech stack, or company name..."
                className="w-full bg-transparent text-white placeholder-ink-muted text-sm sm:text-base focus:outline-none font-sans"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="text-[13px] font-mono text-ink-muted hover:text-white px-2.5 py-1 rounded bg-white/[0.06] transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Quick Query Pills */}
          <div className="flex flex-wrap items-center gap-2 mb-8">
            <span className="text-[13px] text-ink-muted mr-1">
              Sample queries:
            </span>
            {PRESET_QUERIES.map((preset) => {
              const isActive = query.toLowerCase() === preset.toLowerCase()
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setQuery(preset)}
                  className={`px-3 py-1.5 rounded-lg text-[13px] transition-all ${
                    isActive
                      ? 'bg-white text-black font-semibold shadow-md'
                      : 'bg-surface-secondary/70 text-ink-secondary hover:text-white hover:bg-surface-elevated border border-white/[0.04]'
                  }`}
                >
                  {preset}
                </button>
              )
            })}
          </div>

          {/* Live Matching Results List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-[13px] text-ink-muted pb-2 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Matching listings ({filtered.length})</span>
              </div>
              <span className="text-white/50">Direct Discovery View</span>
            </div>

            {filtered.length > 0 ? (
              filtered.map((item) => (
                <div
                  key={item.id}
                  className="surface-metallic-card p-4 sm:p-5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-display text-base font-bold text-white tracking-tight">
                        {item.role}
                      </h3>
                      <span className="text-[13px] px-2 py-0.5 rounded bg-white/[0.06] text-white/80 border border-white/[0.06]">
                        {item.level}
                      </span>
                    </div>
                    <p className="text-sm text-ink-secondary">
                      <span className="font-semibold text-white/90">{item.company}</span>
                      <span className="text-white/40"> · </span>
                      <span>{item.location}</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {item.tags.map((tag) => (
                        <span key={tag} className="text-[13px] px-2 py-0.5 rounded bg-white/[0.04] text-white/70">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/[0.04]">
                    <div className="text-left sm:text-right">
                      <div className="text-sm font-semibold text-emerald-400">
                        {item.salary}
                      </div>
                      <div className="text-[13px] text-white/50">
                        Verified Band
                      </div>
                    </div>
                    <Link
                      to="/signup"
                      className="metallic-btn-primary px-4 py-2 rounded-lg text-[13px] font-semibold transition-all inline-flex items-center gap-1.5"
                    >
                      <span>Track</span>
                      <span className="opacity-60">→</span>
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 rounded-xl bg-surface-secondary/50 border border-white/[0.06] text-center space-y-2">
                <p className="text-sm font-semibold text-white">No active listings match "{query}"</p>
                <p className="text-sm text-ink-secondary">Try searching for "Distributed Systems", "Frontend", or "Anthropic".</p>
              </div>
            )}
          </div>

        </div>

      </div>
    </section>
  )
}
