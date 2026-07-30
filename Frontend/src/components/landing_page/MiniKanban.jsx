import { useState } from 'react'
import { STAGES, KANBAN_CARDS, ACCENTS } from './constants'

export default function MiniKanban() {
  const cols = STAGES.slice(0, 4)
  const [activeCard, setActiveCard] = useState(null)

  return (
    <div className="flex gap-2 p-4 bg-surface border border-indigo/18 rounded-2xl font-body overflow-hidden min-w-0 shadow-[0_0_0_1px_rgba(99,102,241,0.18),0_40px_80px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.04)]">
      {cols.map(col => {
        const cards = KANBAN_CARDS[col]
        return (
          <div key={col} className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2 px-1.5 py-1">
              <span className="text-[10px] font-semibold text-muted tracking-[0.08em] uppercase font-mono">{col}</span>
              <span className="text-[10px] font-semibold bg-indigo/12 text-indigo-light rounded-[10px] px-1.5 py-px">{cards.length}</span>
            </div>
            <div className="flex flex-col gap-1.5">
              {cards.map((card, i) => {
                const key = `${col}-${i}`
                const isActive = activeCard === key
                const accent = ACCENTS[card.accent]
                return (
                  <div
                    key={i}
                    onMouseEnter={() => setActiveCard(key)}
                    onMouseLeave={() => setActiveCard(null)}
                    className={`px-2.5 py-2 rounded-lg cursor-pointer transition-all duration-200 border ${
                      isActive
                        ? `bg-surface-2 ${accent.border60} -translate-y-0.5 shadow-[0_4px_12px_rgba(0,0,0,0.3)]`
                        : 'bg-white/[0.03] border-indigo/18'
                    }`}
                  >
                    <div className="text-[11px] font-semibold text-ink mb-[3px] whitespace-nowrap overflow-hidden text-ellipsis">
                      {card.company}
                    </div>
                    <div className="text-[10px] text-muted whitespace-nowrap overflow-hidden text-ellipsis">
                      {card.role}
                    </div>
                    <div className={`mt-1.5 inline-block text-[9px] font-semibold tracking-[0.06em] font-mono px-1.5 py-0.5 rounded ${accent.text} ${accent.bgSoft}`}>
                      {card.tag}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
