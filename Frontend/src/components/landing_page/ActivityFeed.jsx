import { useState, useEffect } from 'react'
import { ACTIVITY, ACCENTS } from './constants'

const OPACITY = ['opacity-100', 'opacity-75', 'opacity-50', 'opacity-25']

export default function ActivityFeed() {
  const [items, setItems] = useState(ACTIVITY)

  useEffect(() => {
    const timer = setInterval(() => {
      setItems(prev => {
        const rotated = [...prev]
        const first = rotated.shift()
        return [...rotated, first]
      })
    }, 3000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="bg-surface border border-indigo/18 rounded-xl p-4 font-mono shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-1.5 h-1.5 rounded-full bg-green shadow-[0_0_8px_#10b981]" />
        <span className="text-[11px] text-muted tracking-[0.06em]">LIVE EVENTS</span>
      </div>
      <div className="flex flex-col gap-2.5 overflow-hidden h-40">
        {items.slice(0, 4).map((item, i) => {
          const accent = ACCENTS[item.accent]
          return (
            <div
              key={`${item.company}-${i}`}
              className={`flex items-start gap-2.5 transition-opacity duration-500 text-[11px] ${OPACITY[i]}`}
            >
              <div className={`w-1.5 h-1.5 rounded-full mt-[3px] shrink-0 ${accent.dot} ${i === 0 ? accent.dotGlow : ''}`} />
              <div>
                <div className={`font-medium tracking-[0.03em] ${accent.text}`}>{item.event}</div>
                <div className="text-muted-light mt-px">{item.company} → {item.status}</div>
                <div className="text-muted text-[10px] mt-px">{item.time}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
