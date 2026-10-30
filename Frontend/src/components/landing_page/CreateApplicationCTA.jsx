import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import gsap from 'gsap'

const QUICK_COMPANIES = [
  { name: 'Northstar Labs', role: 'Backend Engineer', status: 'interview' },
  { name: 'Fieldnote', role: 'Product Engineer', status: 'applied' },
  { name: 'Meridian Systems', role: 'Platform Engineer', status: 'saved' },
  { name: 'Juniper Health', role: 'Software Engineer', status: 'offer' },
]

export default function CreateApplicationCTA() {
  const navigate = useNavigate()
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [status, setStatus] = useState('applied')
  const sectionRef = useRef(null)
  const formRef = useRef(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (formRef.current) {
              gsap.fromTo(
                formRef.current,
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

  const handleSubmit = (e) => {
    e.preventDefault()
    // Pre-populate intent into sessionStorage and navigate smoothly to signup
    sessionStorage.setItem('pending_intent', JSON.stringify({ company, role, status }))
    navigate('/signup')
  }

  const handleQuickPick = (item) => {
    setCompany(item.name)
    setRole(item.role)
    setStatus(item.status)
  }

  return (
    <section ref={sectionRef} className="py-24 md:py-32 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Asymmetric 2-Column Pitch */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left: Direct Value Pitch */}
          <div className="lg:col-span-6 space-y-6">
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
              <span>Ready to take control of </span>
              <span className="text-metallic-silver">your pipeline?</span>
            </h2>

            <p className="text-base sm:text-lg text-ink-secondary leading-relaxed font-sans max-w-xl">
              Add a company, role, and current stage. Evolexa carries those details into signup so you can begin with an application already in view.
            </p>

            {/* Quick-fill Pills */}
            <div className="pt-2">
              <span className="text-[13px] font-mono text-ink-muted block mb-2">
                EXAMPLE DETAILS:
              </span>
              <div className="flex flex-wrap gap-2">
                {QUICK_COMPANIES.map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => handleQuickPick(item)}
                    className="px-3 py-1.5 rounded-lg text-[13px] font-mono bg-surface-secondary/70 text-ink-secondary hover:text-white hover:bg-surface-elevated border border-white/[0.04] transition-all"
                  >
                    + {item.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-4 text-[13px] font-mono text-ink-muted border-t border-white/[0.06] flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>START WITH ONE APPLICATION</span>
              <span>·</span>
              <span>KEEP THE NEXT STEP VISIBLE</span>
              <span>·</span>
              <span>ADD DETAILS BEFORE SIGNUP</span>
            </div>
          </div>

          {/* Right: The Product's First Screen Already Open (data-ui) */}
          <div className="lg:col-span-6">
            <form
              ref={formRef}
              data-ui
              onSubmit={handleSubmit}
              className="w-full max-w-lg mx-auto surface-metallic-panel rounded-2xl p-6 sm:p-8 space-y-5 relative overflow-hidden bg-[#0a0d14]"
            >
              {/* Top Sheen */}
              <div className="absolute top-0 left-0 right-0 h-[1px] metallic-sheen-line" />

              <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                <div>
                  <h3 className="font-display text-base font-bold text-white tracking-tight">
                    Track your first application
                  </h3>
                  <p className="text-sm text-ink-secondary font-sans mt-0.5">
                    Choose a starting point, then continue to signup.
                  </p>
                </div>
                <span className="font-mono text-[13px] px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  READY
                </span>
              </div>

              {/* Company Input */}
              <div className="space-y-1.5">
                <label htmlFor="cta-company" className="flex items-center justify-between text-[13px] font-mono text-ink-secondary">
                  <span>TARGET COMPANY</span>
                  <span className="text-white/40">NAME</span>
                </label>
                <input
                  id="cta-company"
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  required
                  placeholder="e.g. Northstar Labs, Fieldnote"
                  className="w-full px-4 py-3 rounded-xl bg-[#0a0d14] text-white border border-white/[0.09] focus:border-white/30 focus:outline-none text-sm placeholder-ink-muted font-sans shadow-inner transition-colors"
                />
              </div>

              {/* Role Input */}
              <div className="space-y-1.5">
                <label htmlFor="cta-role" className="flex items-center justify-between text-[13px] font-mono text-ink-secondary">
                  <span>ROLE TITLE</span>
                  <span className="text-white/40">POSITION</span>
                </label>
                <input
                  id="cta-role"
                  type="text"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  required
                  placeholder="e.g. Senior Software Engineer"
                  className="w-full px-4 py-3 rounded-xl bg-[#0a0d14] text-white border border-white/[0.09] focus:border-white/30 focus:outline-none text-sm placeholder-ink-muted font-sans shadow-inner transition-colors"
                />
              </div>

              {/* Status Selector */}
              <div className="space-y-1.5">
                <label htmlFor="cta-status" className="flex items-center justify-between text-[13px] font-mono text-ink-secondary">
                  <span>INITIAL STAGE</span>
                  <span className="text-white/40">STAGE</span>
                </label>
                <select
                  id="cta-status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-[#0a0d14] text-white border border-white/[0.09] focus:border-white/30 focus:outline-none text-sm font-sans shadow-inner transition-colors"
                >
                  <option value="saved">Saved (Wishlist · Stage 01)</option>
                  <option value="applied">Applied (Submitted · Stage 02)</option>
                  <option value="oa">Online Assessment (Stage 03)</option>
                  <option value="interview">Interview Scheduled (Stage 04)</option>
                  <option value="offer">Offer Received (Stage 06)</option>
                </select>
              </div>

              {/* Submit CTA */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="metallic-btn-primary w-full py-3.5 px-5 rounded-xl text-sm font-semibold inline-flex items-center justify-center gap-2 shadow-lg"
                >
                  <span>Create Application &amp; Start Free</span>
                  <span className="font-mono text-sm opacity-70">→</span>
                </button>
              </div>

              <div className="text-center">
                <span className="text-[13px] font-mono text-white/40">
                  EXAMPLE FORM · CONTINUE TO SIGNUP
                </span>
              </div>
            </form>
          </div>

        </div>

      </div>
    </section>
  )
}



