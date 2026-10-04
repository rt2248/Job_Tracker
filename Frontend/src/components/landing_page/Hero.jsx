import React from 'react'
import { Link } from 'react-router-dom'
import ProductPreview from './ProductPreview'

export default function Hero() {
  return (
    <section className="relative pt-28 pb-16 lg:pt-36 lg:pb-24 overflow-hidden bg-canvas">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        
        {/* Top Product Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-elevated border border-border-primary mb-8 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-mono font-medium text-ink-secondary tracking-wider uppercase">
            STAGE-BASED APPLICATION SYSTEM
          </span>
        </div>

        {/* Main Headline */}
        <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-extrabold text-ink tracking-tight leading-[1.08] max-w-5xl mx-auto mb-6">
          The intelligent job application OS for modern developers.
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg lg:text-xl text-ink-secondary max-w-3xl mx-auto leading-relaxed mb-10 font-sans">
          Streamline your career pipeline with Kanban workflows, job search indexing, resume attachment management, and recruiter contact tracking.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link
            to="/signup"
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl text-sm font-semibold bg-white text-black hover:bg-neutral-200 transition-all shadow-md text-center"
          >
            Start Tracking Free →
          </Link>
          <Link
            to="/login"
            className="w-full sm:w-auto px-7 py-3.5 rounded-xl text-sm font-medium bg-surface-secondary text-ink border border-border-primary hover:bg-surface-overlay transition-all text-center"
          >
            Sign In to Dashboard
          </Link>
        </div>

        {/* Live Product UI Hero Showcase */}
        <div className="max-w-6xl mx-auto">
          <div className="text-xs font-mono text-ink-muted uppercase tracking-widest mb-3 text-left pl-1">
            LIVE PRODUCT UI PREVIEW
          </div>
          <ProductPreview />
        </div>

      </div>

    </section>
  )
}
