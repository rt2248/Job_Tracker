import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function NavBar() {
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
    <header className="fixed top-0 left-0 right-0 z-50 transition-colors duration-200">
      <nav
        className={`w-full transition-colors duration-200 ${
          scrolled || mobileMenuOpen
            ? 'bg-canvas/95 backdrop-blur-md'
            : 'bg-transparent'
        }`}
        aria-label="Main Navigation"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Brand Wordmark */}
          <Link
            to="/"
            className="flex items-center gap-2.5 text-ink hover:text-white transition-opacity"
            aria-label="Evolexa Home"
          >
            <div className="w-7 h-7 rounded bg-white text-black font-display font-black text-sm flex items-center justify-center tracking-tighter">
              EX
            </div>
            <span className="font-display font-bold text-lg text-white tracking-tight">
              Evolexa
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a
              href="#pipeline"
              className="text-ink-secondary hover:text-white transition-colors"
            >
              Pipeline
            </a>
            <a
              href="#discovery"
              className="text-ink-secondary hover:text-white transition-colors"
            >
              Discovery
            </a>
            <a
              href="#workflow"
              className="text-ink-secondary hover:text-white transition-colors"
            >
              Workflow
            </a>
            <a
              href="#capabilities"
              className="text-ink-secondary hover:text-white transition-colors"
            >
              Capabilities
            </a>
          </div>

          {/* Desktop Auth Actions */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/login"
              className="text-sm font-medium text-ink-secondary hover:text-white transition-colors px-2 py-1"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="px-4 py-2 rounded text-sm font-semibold bg-white text-black hover:bg-neutral-200 transition-colors"
            >
              Start Free
            </Link>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-ink-secondary hover:text-white focus:outline-none focus:ring-1 focus:ring-white"
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
          <div className="md:hidden bg-surface-primary px-4 pt-4 pb-6 flex flex-col gap-4">
            <a
              href="#pipeline"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-ink-secondary hover:text-white transition-colors py-1"
            >
              Pipeline
            </a>
            <a
              href="#discovery"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-ink-secondary hover:text-white transition-colors py-1"
            >
              Discovery
            </a>
            <a
              href="#workflow"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-ink-secondary hover:text-white transition-colors py-1"
            >
              Workflow
            </a>
            <a
              href="#capabilities"
              onClick={() => setMobileMenuOpen(false)}
              className="text-base font-medium text-ink-secondary hover:text-white transition-colors py-1"
            >
              Capabilities
            </a>

            <div className="pt-4 flex flex-col gap-3">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 text-sm font-medium text-white bg-surface-secondary hover:bg-surface-elevated rounded"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 text-sm font-semibold bg-white text-black hover:bg-neutral-200 rounded"
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
