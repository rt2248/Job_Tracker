import { useState, useEffect, useRef } from 'react'

export default function StatBadge({ value, label, delay }) {
  const [show, setShow] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setShow(true) },
      { threshold: 0.5 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`text-center px-8 py-6 transition-all duration-[600ms] ease-in-out ${
        show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'
      }`}
    >
      <div className="font-display text-5xl font-extrabold tracking-[-0.04em] text-ink bg-gradient-to-br from-ink to-indigo-light bg-clip-text text-transparent">
        {value}
      </div>
      <div className="text-[13px] text-muted mt-1 font-body">{label}</div>
    </div>
  )
}
