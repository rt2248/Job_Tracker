import React from 'react'
import { Link } from 'react-router-dom'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-white/[0.08] bg-[#05070a] py-16 text-sm text-ink-muted relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Architectural Tile Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          
          {/* Tile 1: Statement */}
          <div className="md:col-span-5 p-6 rounded-xl surface-metallic-panel flex flex-col justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div aria-hidden="true" className="w-6 h-6 rounded bg-white text-black font-display font-black text-[11px] flex items-center justify-center">
                  EX
                </div>
                <span className="font-display font-bold text-base text-white tracking-tight">
                  Evolexa
                </span>
              </div>
              <p className="text-sm text-ink-secondary leading-relaxed font-sans">
                A focused place to organize job applications, role details, and follow-up notes.
              </p>
            </div>
            <div className="text-[13px] font-mono text-white/50">
              Keep your search organized from saved role to next conversation.
            </div>
          </div>

          {/* Tile 2: Application Destinations */}
          <div className="md:col-span-4 p-6 rounded-xl surface-metallic-panel">
            <h4 className="font-mono text-sm text-white/90 font-semibold mb-4">
              Application modules
            </h4>
            <div className="grid grid-cols-2 gap-2.5 text-sm">
              <Link to="/dashboard" className="text-ink-secondary hover:text-white transition-colors">
                Dashboard
              </Link>
              <Link to="/jobsearch" className="text-ink-secondary hover:text-white transition-colors">
                Search Jobs
              </Link>
              <Link to="/applications" className="text-ink-secondary hover:text-white transition-colors">
                Applications
              </Link>
              <Link to="/profile" className="text-ink-secondary hover:text-white transition-colors">
                User Profile
              </Link>
              <Link to="/network" className="text-ink-secondary hover:text-white transition-colors">
                Network CRM
              </Link>
            </div>
          </div>

          {/* Tile 3: Account & Access */}
          <div className="md:col-span-3 p-6 rounded-xl surface-metallic-panel flex flex-col justify-between">
            <div>
              <h4 className="font-mono text-sm text-white/90 font-semibold mb-4">
                Account &amp; access
              </h4>
              <div className="flex flex-col gap-2.5 text-sm">
                <Link to="/login" className="text-ink-secondary hover:text-white transition-colors">
                  Sign In to Dashboard
                </Link>
                <Link to="/signup" className="text-ink-secondary hover:text-white transition-colors">
                  Create New Account
                </Link>
              </div>
            </div>

            <div className="pt-4 text-[13px] font-mono text-emerald-400 font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
              <span>YOUR NEXT STEP STARTS HERE</span>
            </div>
          </div>

        </div>

        {/* Lower Row: Full-Width Brand Wordmark & Legal */}
        <div className="p-8 rounded-xl surface-metallic-card flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="font-display font-black text-2xl sm:text-3xl tracking-tighter text-white">
            EVOLEXA
          </div>
          <div className="space-y-1 text-right">
            <div className="text-[13px] font-mono text-ink-muted text-center md:text-right">
              © {year} Evolexa. A clearer view of your job search.
            </div>
            <div className="text-[13px] font-mono text-white/40 text-center md:text-right">
              
            </div>
          </div>
        </div>

      </div>
    </footer>
  )
}

