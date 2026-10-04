import React from 'react'
import { Link } from 'react-router-dom'
import Card from '../shared/Card'
import Badge from '../shared/Badge'

export default function ProductShowcase() {
  return (
    <section id="preview" className="py-20 lg:py-28 bg-canvas border-t border-border-subtle">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20 lg:space-y-32">
        
        {/* Showcase Item 1: Kanban Pipeline */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-5 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-elevated border border-border-primary text-xs font-mono font-semibold text-ink-secondary">
              KANBAN ENGINE
            </div>
            <h3 className="font-display text-2xl sm:text-4xl font-extrabold text-ink tracking-tight">
              Visual pipeline with enforced status transitions.
            </h3>
            <p className="text-sm sm:text-base text-ink-secondary leading-relaxed font-sans">
              Keep every active job application organized across customizable columns. Easily transition cards from Wishlist and Applied to Interview and Offer with real-time status updates.
            </p>
            <div className="pt-2">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 text-xs font-mono font-bold text-ink hover:underline"
              >
                OPEN DASHBOARD PREVIEW →
              </Link>
            </div>
          </div>

          <div className="lg:col-span-7 rounded-2xl bg-surface-primary border border-border-primary p-5 shadow-xl">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-border-subtle text-xs font-mono text-ink-muted">
              <span>PIPELINE VIEW</span>
              <span>4 ACTIVE APPLICATIONS</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-surface-secondary/80 border border-border-primary space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink">Applied</span>
                  <Badge variant="indigo" size="sm">2</Badge>
                </div>
                <div className="p-2.5 rounded-lg bg-surface-primary border border-border-subtle text-xs space-y-1">
                  <div className="font-bold text-ink">Stripe</div>
                  <div className="text-[11px] text-ink-muted">Senior Software Engineer</div>
                </div>
                <div className="p-2.5 rounded-lg bg-surface-primary border border-border-subtle text-xs space-y-1">
                  <div className="font-bold text-ink">Figma</div>
                  <div className="text-[11px] text-ink-muted">Frontend Engineer</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-surface-secondary/80 border border-border-primary space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink">Interview</span>
                  <Badge variant="amber" size="sm">1</Badge>
                </div>
                <div className="p-2.5 rounded-lg bg-surface-primary border border-border-subtle text-xs space-y-1">
                  <div className="font-bold text-ink">Linear</div>
                  <div className="text-[11px] text-ink-muted">Product Engineer</div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-surface-secondary/80 border border-border-primary space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-ink">Offer</span>
                  <Badge variant="emerald" size="sm">1</Badge>
                </div>
                <div className="p-2.5 rounded-lg bg-surface-primary border border-border-subtle text-xs space-y-1">
                  <div className="font-bold text-ink">Anthropic</div>
                  <div className="text-[11px] text-ink-muted">ML Engineer</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Showcase Item 2: Job Discovery & Filtering */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center lg:flex-row-reverse">
          <div className="lg:col-span-7 rounded-2xl bg-surface-primary border border-border-primary p-5 shadow-xl order-2 lg:order-1">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-border-subtle text-xs font-mono text-ink-muted">
              <span>JOB SEARCH INDEX</span>
              <span>FILTERED RESULTS</span>
            </div>
            <div className="space-y-3">
              <Card className="bg-surface-secondary/80 border-border-primary p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-ink font-display">Systems Engineer</h4>
                  <p className="text-xs text-ink-secondary mt-0.5">Cloudflare • Remote</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="subtle" size="sm">Full-time</Badge>
                  <Badge variant="emerald" size="sm">$190k - $240k</Badge>
                </div>
              </Card>

              <Card className="bg-surface-secondary/80 border-border-primary p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-ink font-display">Staff Infrastructure Lead</h4>
                  <p className="text-xs text-ink-secondary mt-0.5">Datadog • New York, NY</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="subtle" size="sm">Hybrid</Badge>
                  <Badge variant="emerald" size="sm">$210k - $270k</Badge>
                </div>
              </Card>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-5 order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-elevated border border-border-primary text-xs font-mono font-semibold text-ink-secondary">
              SEARCH & DISCOVERY
            </div>
            <h3 className="font-display text-2xl sm:text-4xl font-extrabold text-ink tracking-tight">
              Instant search and location-aware filtering.
            </h3>
            <p className="text-sm sm:text-base text-ink-secondary leading-relaxed font-sans">
              Discover engineering roles with real-time location comboboxes, work mode badges, and experience level filters built directly into your workspace.
            </p>
            <div className="pt-2">
              <Link
                to="/jobsearch"
                className="inline-flex items-center gap-2 text-xs font-mono font-bold text-ink hover:underline"
              >
                EXPLORE SEARCH MODULE →
              </Link>
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}
