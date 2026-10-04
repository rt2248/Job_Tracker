import React from 'react'
import { Link } from 'react-router-dom'

export default function AutomationCTA() {
  return (
    <section className="py-20 lg:py-28 bg-canvas border-t border-border-subtle">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="p-8 sm:p-12 lg:p-16 rounded-3xl bg-surface-primary border border-border-primary text-center relative overflow-hidden shadow-2xl">
          
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-elevated border border-border-primary mb-6">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-mono font-medium text-ink-secondary uppercase tracking-wider">
              READY TO TRACK YOUR PIPELINE?
            </span>
          </div>

          <h2 className="font-display text-3xl sm:text-5xl font-extrabold text-ink tracking-tight mb-4 max-w-2xl mx-auto">
            Take control of your job search today.
          </h2>

          <p className="text-base sm:text-lg text-ink-secondary leading-relaxed max-w-xl mx-auto mb-10 font-sans">
            Join developers using Evolexa to track job applications, organize interviews, attach resumes, and land their next role.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/signup"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-sm font-semibold bg-white text-black hover:bg-neutral-200 transition-all shadow-md text-center"
            >
              Get Started Free →
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl text-sm font-medium bg-surface-secondary text-ink border border-border-primary hover:bg-surface-overlay transition-all text-center"
            >
              Sign In to Account
            </Link>
          </div>

        </div>

      </div>
    </section>
  )
}
