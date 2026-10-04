import React from 'react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="py-12 bg-canvas border-t border-border-primary text-xs text-ink-muted font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded bg-neutral-900 border border-neutral-700 flex items-center justify-center text-white font-display font-bold text-xs">
            EX
          </div>
          <span className="font-display font-bold text-sm text-ink tracking-tight">
            Evolexa
          </span>
          <span className="text-ink-muted text-[11px] ml-2">
            Smart Job Application Tracker
          </span>
        </div>

        {/* Links */}
        <div className="flex flex-wrap items-center justify-center gap-6">
          <Link to="/dashboard" className="hover:text-ink transition-colors">
            Dashboard
          </Link>
          <Link to="/jobsearch" className="hover:text-ink transition-colors">
            Search Jobs
          </Link>
          <Link to="/applications" className="hover:text-ink transition-colors">
            Applications
          </Link>
          <Link to="/profile" className="hover:text-ink transition-colors">
            Profile
          </Link>
          <Link to="/network" className="hover:text-ink transition-colors">
            Network
          </Link>
          <Link to="/login" className="hover:text-ink transition-colors">
            Sign In
          </Link>
          <Link to="/signup" className="hover:text-ink transition-colors">
            Sign Up
          </Link>
        </div>

        {/* Copyright */}
        <div className="font-mono text-[11px]">
          © {new Date().getFullYear()} Evolexa. All rights reserved.
        </div>

      </div>
    </footer>
  )
}
