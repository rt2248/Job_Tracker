import { useState, useEffect } from 'react'

export default function EventBadge() {
  const [visible, setVisible] = useState(true)
  const EVENTS = [
    'JOB_CREATED', 'STATUS_UPDATED', 'DEADLINE_APPROACHING', 'OFFER_RECEIVED', 'AI_ANALYSIS_DONE'
  ]
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false)
      setTimeout(() => {
        setCurrent(c => (c + 1) % EVENTS.length)
        setVisible(true)
      }, 300)
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  return (
    <div
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan/10 border border-cyan/40 font-mono text-xs font-medium transition-opacity duration-300 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <span className="text-cyan">event:</span>
      <span className="text-ink">{EVENTS[current]}</span>
    </div>
  )
}
