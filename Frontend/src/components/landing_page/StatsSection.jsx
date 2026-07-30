import { STATS } from './constants'
import StatBadge from './StatBadge'

export default function StatsSection() {
  return (
    <section className="border-t border-b border-indigo/18 bg-[rgba(13,20,36,0.5)]">
      <div className="max-w-[1280px] mx-auto px-[60px] grid grid-cols-4 relative">
        {STATS.map((s, i) => (
          <div key={i} className={i < 3 ? 'border-r border-indigo/18' : ''}>
            <StatBadge value={s.value} label={s.label} delay={i * 100} />
          </div>
        ))}
      </div>
    </section>
  )
}
