import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function NavBar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[100] flex items-center justify-between h-16 px-4 sm:px-8 lg:px-10 font-body transition-all duration-300 ease-in-out border-b ${
        scrolled || mobileMenuOpen ? 'bg-canvas/95 backdrop-blur-md border-indigo/18' : 'bg-transparent border-transparent'
      }`}
    >
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2.5 z-10">
        <div className="logo w-8 h-8 flex items-center justify-center shrink-0">
          <img src="https://www.logoai.com/oss/icons/2021/12/02/Q9pS-i3L1EHuO4S.png" alt="Logo" />
        </div>
        <span className="font-display font-bold text-base text-ink tracking-[-0.02em]">
          JobTracker
        </span>
      </Link>

      {/* Desktop Nav links */}
      <div className="hidden md:flex gap-8 items-center">
        {['Features', 'Workflow', 'Analytics', 'Docs'].map(link => (
          <a
            key={link}
            href={`#${link.toLowerCase()}`}
            className="text-muted-light text-[13px] font-medium no-underline transition-colors duration-200 hover:text-ink"
          >
            {link}
          </a>
        ))}
      </div>

      {/* Desktop CTA */}
      <div className="hidden md:flex gap-3 items-center">
        <Link to="/login" className="px-[18px] py-2 rounded-lg text-[13px] font-medium bg-transparent border border-indigo/18 text-muted-light cursor-pointer transition-all duration-200 font-body hover:border-indigo/45 hover:text-ink">
          Log in
        </Link>
        <Link to="/signup" className="px-[18px] py-2 rounded-lg text-[13px] font-semibold bg-gradient-to-br from-indigo to-[#4f46e5] border-none text-white cursor-pointer transition-shadow duration-200 font-body shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.8)]">
          Get started
        </Link>
      </div>

      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden p-2 rounded-lg text-muted-light hover:text-ink focus:outline-none z-10"
        aria-label="Toggle menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {mobileMenuOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 bg-canvas/98 border-b border-indigo/18 px-6 py-6 flex flex-col gap-5 shadow-2xl backdrop-blur-xl animate-modal-content">
          <div className="flex flex-col gap-4">
            {['Features', 'Workflow', 'Analytics', 'Docs'].map(link => (
              <a
                key={link}
                href={`#${link.toLowerCase()}`}
                onClick={() => setMobileMenuOpen(false)}
                className="text-muted-light text-base font-medium no-underline hover:text-ink transition-colors"
              >
                {link}
              </a>
            ))}
          </div>
          <div className="flex flex-col gap-3 pt-4 border-t border-indigo/15">
            <Link
              to="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 rounded-lg text-sm font-medium border border-indigo/20 text-muted-light hover:text-ink"
            >
              Log in
            </Link>
            <Link
              to="/signup"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full text-center py-2.5 rounded-lg text-sm font-semibold bg-gradient-to-br from-indigo to-[#4f46e5] text-white shadow-lg"
            >
              Get started
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}

