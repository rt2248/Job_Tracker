import { useState, useEffect } from 'react'

export default function NavBar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[100] flex items-center justify-between h-16 px-10 font-body transition-all duration-300 ease-in-out border-b ${
        scrolled ? 'bg-canvas/92 backdrop-blur-md border-indigo/18' : 'bg-transparent border-transparent'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div className="logo w-8 h-8 flex items-center justify-center">
          <img src="https://www.logoai.com/oss/icons/2021/12/02/Q9pS-i3L1EHuO4S.png" alt="Logo" />
        </div>
        <span className="font-display font-bold text-base text-ink tracking-[-0.02em]">
          JobTracker
        </span>
      </div>

      {/* Nav links */}
      <div className="flex gap-8 items-center">
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

      {/* CTA */}
      <div className="flex gap-3">
        <button className="px-[18px] py-2 rounded-lg text-[13px] font-medium bg-transparent border border-indigo/18 text-muted-light cursor-pointer transition-all duration-200 font-body hover:border-indigo/45 hover:text-ink">
          Log in
        </button>
        <button className="px-[18px] py-2 rounded-lg text-[13px] font-semibold bg-gradient-to-br from-indigo to-[#4f46e5] border-none text-white cursor-pointer transition-shadow duration-200 font-body shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:shadow-[0_0_30px_rgba(99,102,241,0.8)]">
          Get started
        </button>
      </div>
    </nav>
  )
}
