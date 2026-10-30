import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function NavBar({ theme, onToggleTheme }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 24)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-200">
      <nav
        className={`landing-nav w-full transition-all duration-200 ${
          scrolled || mobileMenuOpen
            ? 'bg-[var(--lp-nav)] backdrop-blur-md border-b border-[var(--lp-line)] shadow-lg shadow-black/20'
            : 'bg-transparent border-b border-transparent'
        }`}
        aria-label="Main Navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand Wordmark - Identity Preserved */}
          <Link
            to="/"
            className="flex items-center gap-2.5 group landing-brand"
            aria-label="Evolexa Home"
          >
            <div className="landing-mark w-7 h-7 rounded font-display font-black text-sm flex items-center justify-center tracking-tighter shadow-sm group-hover:scale-105 transition-transform">
              EX
            </div>
            <span className="font-display font-bold text-lg tracking-tight">
              Evolexa
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="landing-nav-links hidden md:flex items-center gap-8 text-sm font-medium">
            <a
              href="#pipeline"
              className="landing-nav-link text-white/70 hover:text-white transition-colors relative py-1 hover:after:w-full after:w-0 after:h-[1px] after:bg-white/40 after:absolute after:bottom-0 after:left-0 after:transition-all"
            >
              Pipeline
            </a>
            <a
              href="#discovery"
              className="landing-nav-link text-white/70 hover:text-white transition-colors relative py-1 hover:after:w-full after:w-0 after:h-[1px] after:bg-white/40 after:absolute after:bottom-0 after:left-0 after:transition-all"
            >
              Discovery
            </a>
            <a
              href="#workflow"
              className="landing-nav-link text-white/70 hover:text-white transition-colors relative py-1 hover:after:w-full after:w-0 after:h-[1px] after:bg-white/40 after:absolute after:bottom-0 after:left-0 after:transition-all"
            >
              Workflow
            </a>
            <a
              href="#capabilities"
              className="landing-nav-link text-white/70 hover:text-white transition-colors relative py-1 hover:after:w-full after:w-0 after:h-[1px] after:bg-white/40 after:absolute after:bottom-0 after:left-0 after:transition-all"
            >
              Capabilities
            </a>
          </div>

          {/* Desktop Auth Actions */}
          <div className="hidden md:flex items-center gap-3">
            <button type="button" onClick={onToggleTheme} className="landing-theme-toggle" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} aria-pressed={theme === 'light'}>
              <span aria-hidden="true">{theme === 'dark' ? '☼' : '◐'}</span><span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
            </button>
            <Link
              to="/login"
              className="landing-nav-link text-sm font-medium text-white/70 hover:text-white transition-colors px-3 py-1.5"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="metallic-btn-primary px-4 py-2 rounded-lg text-sm font-semibold shadow-md"
            >
              Start Free
            </Link>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="landing-menu-button md:hidden p-2 text-white/70 hover:text-white focus:outline-none focus:ring-1 focus:ring-white/40 rounded-lg"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation drawer"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu Drawer */}
        {mobileMenuOpen && (
          <div className="landing-mobile-menu md:hidden px-4 pt-4 pb-6 flex flex-col gap-4">
            <a
              href="#pipeline"
              onClick={() => setMobileMenuOpen(false)}
              className="landing-mobile-link text-base font-medium text-ink-secondary hover:text-white transition-colors py-1"
            >
              Pipeline
            </a>
            <a
              href="#discovery"
              onClick={() => setMobileMenuOpen(false)}
              className="landing-mobile-link text-base font-medium text-ink-secondary hover:text-white transition-colors py-1"
            >
              Discovery
            </a>
            <a
              href="#workflow"
              onClick={() => setMobileMenuOpen(false)}
              className="landing-mobile-link text-base font-medium text-ink-secondary hover:text-white transition-colors py-1"
            >
              Workflow
            </a>
            <a
              href="#capabilities"
              onClick={() => setMobileMenuOpen(false)}
              className="landing-mobile-link text-base font-medium text-ink-secondary hover:text-white transition-colors py-1"
            >
              Capabilities
            </a>

            <div className="pt-4 flex flex-col gap-3">
              <button type="button" onClick={onToggleTheme} className="landing-theme-toggle w-full justify-center" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} aria-pressed={theme === 'light'}>
                <span aria-hidden="true">{theme === 'dark' ? '☼' : '◐'}</span><span>Use {theme === 'dark' ? 'light' : 'dark'} theme</span>
              </button>
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="landing-mobile-action w-full text-center py-2.5 text-sm font-medium rounded"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="landing-mobile-primary w-full text-center py-2.5 text-sm font-semibold rounded"
              >
                Start Free
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}


