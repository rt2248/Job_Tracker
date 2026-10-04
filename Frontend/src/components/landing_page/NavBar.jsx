import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function NavBar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 h-16 transition-all duration-200 border-b ${
        scrolled || mobileMenuOpen
          ? 'bg-canvas/90 backdrop-blur-md border-border-primary'
          : 'bg-transparent border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-neutral-700 flex items-center justify-center text-white font-display font-bold text-sm shadow-sm transition-transform group-hover:scale-105">
            EX
          </div>
          <span className="font-display font-bold text-lg text-ink tracking-tight">
            Evolexa
          </span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          <a
            href="#features"
            className="text-xs font-medium text-ink-secondary hover:text-ink transition-colors"
          >
            Features
          </a>
          <a
            href="#workflow"
            className="text-xs font-medium text-ink-secondary hover:text-ink transition-colors"
          >
            Workflow
          </a>
          <a
            href="#preview"
            className="text-xs font-medium text-ink-secondary hover:text-ink transition-colors"
          >
            Product UI
          </a>
          <a
            href="#capabilities"
            className="text-xs font-medium text-ink-secondary hover:text-ink transition-colors"
          >
            Capabilities
          </a>
        </div>

        {/* Desktop CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            to="/login"
            className="px-4 py-2 text-xs font-medium text-ink-secondary hover:text-ink transition-colors"
          >
            Log in
          </Link>
          <Link
            to="/signup"
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-white text-black hover:bg-neutral-200 transition-all shadow-sm"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Menu Toggle Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-ink-secondary hover:text-ink focus:outline-none"
          aria-label="Toggle Navigation Menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="md:hidden bg-surface-primary border-b border-border-primary px-4 py-6 flex flex-col gap-4 shadow-xl">
          <a
            href="#features"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-medium text-ink-secondary hover:text-ink transition-colors"
          >
            Features
          </a>
          <a
            href="#workflow"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-medium text-ink-secondary hover:text-ink transition-colors"
          >
            Workflow
          </a>
          <a
            href="#preview"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-medium text-ink-secondary hover:text-ink transition-colors"
          >
            Product UI
          </a>
          <a
            href="#capabilities"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-medium text-ink-secondary hover:text-ink transition-colors"
          >
            Capabilities
          </a>
          
          <div className="pt-4 border-t border-border-subtle flex flex-col gap-2.5">
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 text-xs font-medium border border-border-primary rounded-lg text-ink hover:bg-surface-secondary"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 text-xs font-semibold bg-white text-black rounded-lg hover:bg-neutral-200"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
