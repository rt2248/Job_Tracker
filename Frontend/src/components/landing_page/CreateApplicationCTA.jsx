import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function CreateApplicationCTA() {
  const navigate = useNavigate()
  const [company, setCompany] = useState('Stripe')
  const [role, setRole] = useState('Senior Backend Engineer')
  const [status, setStatus] = useState('applied')

  const handleSubmit = (e) => {
    e.preventDefault()
    // Direct client-side transition to signup
    navigate('/signup')
  }

  return (
    <section className="py-20 md:py-28 bg-canvas">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          
          {/* Left: Closing Argument */}
          <div className="lg:col-span-6 space-y-6">
            <h2
              data-reveal
              style={{ '--delay': 0 }}
              className="font-display text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight"
            >
              Take control of your career pipeline.
            </h2>
            <p
              data-reveal
              style={{ '--delay': 1 }}
              className="text-base sm:text-lg text-ink-secondary leading-relaxed max-w-xl font-sans"
            >
              Enter your active target role and begin organizing your applications, interviews, and offers in one unified workspace.
            </p>
            <div
              data-reveal
              style={{ '--delay': 2 }}
              className="text-[13px] text-ink-muted"
            >
              Free forever for individual engineers · No credit card required
            </div>
          </div>

          {/* Right: The Product's First Screen Already Open (data-ui) */}
          <div className="lg:col-span-6">
            <form
              data-ui
              data-reveal
              style={{ '--delay': 2 }}
              onSubmit={handleSubmit}
              className="w-full max-w-md mx-auto bg-surface-primary rounded-xl p-6 sm:p-8 border border-surface-overlay space-y-5"
            >
              <div>
                <h3 className="font-display text-lg font-bold text-white mb-1">
                  Track your first application
                </h3>
                <p className="text-[13px] text-ink-muted">
                  Create a new job entry to launch your dashboard.
                </p>
              </div>

              {/* Company Input */}
              <div className="space-y-1.5">
                <label htmlFor="cta-company" className="block text-[13px] font-medium text-ink-secondary">
                  Target Company
                </label>
                <input
                  id="cta-company"
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  required
                  placeholder="e.g. Stripe, Linear, Datadog"
                  className="w-full px-3.5 py-2.5 rounded bg-surface-secondary text-white border border-surface-overlay focus:border-white focus:outline-none text-sm placeholder-ink-muted"
                />
              </div>

              {/* Role Input */}
              <div className="space-y-1.5">
                <label htmlFor="cta-role" className="block text-[13px] font-medium text-ink-secondary">
                  Role Title
                </label>
                <input
                  id="cta-role"
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                  placeholder="e.g. Senior Software Engineer"
                  className="w-full px-3.5 py-2.5 rounded bg-surface-secondary text-white border border-surface-overlay focus:border-white focus:outline-none text-sm placeholder-ink-muted"
                />
              </div>

              {/* Status Selector */}
              <div className="space-y-1.5">
                <label htmlFor="cta-status" className="block text-[13px] font-medium text-ink-secondary">
                  Initial Status
                </label>
                <select
                  id="cta-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded bg-surface-secondary text-white border border-surface-overlay focus:border-white focus:outline-none text-sm"
                >
                  <option value="saved">Saved (Wishlist)</option>
                  <option value="applied">Applied</option>
                  <option value="oa">Online Assessment</option>
                  <option value="interview">Interview Scheduled</option>
                  <option value="offer">Offer Received</option>
                </select>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                className="w-full py-3 px-4 rounded text-sm font-semibold bg-white text-black hover:bg-neutral-200 transition-colors text-center"
              >
                Create Application & Start Free →
              </button>
            </form>
          </div>

        </div>

      </div>
    </section>
  )
}
