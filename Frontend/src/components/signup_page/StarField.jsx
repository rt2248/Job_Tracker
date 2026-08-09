// Fixed, hand-placed positions rather than Math.random() at render time —
// randomizing on every render would make dots jump around on re-renders
// and wouldn't be reproducible. Size and opacity are each a small finite
// set, so they stay literal Tailwind classes; only position is a genuinely
// continuous per-dot value, so it stays inline — same reasoning as
// StatBadge's transitionDelay.
const STARS = [
  { top: '6%', left: '14%', size: 'w-0.5 h-0.5', opacity: 'bg-ink/20' },
  { top: '5%', left: '36%', size: 'w-0.5 h-0.5', opacity: 'bg-ink/20' },
  { top: '6%', left: '54%', size: 'w-0.5 h-0.5', opacity: 'bg-ink/20' },
  { top: '9%', left: '48%', size: 'w-1 h-1', opacity: 'bg-ink/30' },
  { top: '9%', left: '78%', size: 'w-1 h-1', opacity: 'bg-ink/30' },
  { top: '13%', left: '45%', size: 'w-0.5 h-0.5', opacity: 'bg-ink/15' },
  { top: '17%', left: '25%', size: 'w-1 h-1', opacity: 'bg-ink/25' },
  { top: '21%', left: '88%', size: 'w-0.5 h-0.5', opacity: 'bg-ink/20' },
  { top: '24%', left: '60%', size: 'w-1 h-1', opacity: 'bg-ink/15' },
  { top: '28%', left: '8%', size: 'w-0.5 h-0.5', opacity: 'bg-ink/30' },
  { top: '32%', left: '35%', size: 'w-1 h-1', opacity: 'bg-ink/20' },
  { top: '37%', left: '70%', size: 'w-0.5 h-0.5', opacity: 'bg-ink/15' },
  { top: '41%', left: '18%', size: 'w-0.5 h-0.5', opacity: 'bg-ink/25' },
  { top: '45%', left: '92%', size: 'w-0.5 h-0.5', opacity: 'bg-ink/20' },
  { top: '49%', left: '52%', size: 'w-1 h-1', opacity: 'bg-ink/30' },
  { top: '53%', left: '30%', size: 'w-0.5 h-0.5', opacity: 'bg-ink/15' },
  { top: '57%', left: '82%', size: 'w-1 h-1', opacity: 'bg-ink/20' },
  { top: '61%', left: '5%', size: 'w-1 h-1', opacity: 'bg-ink/25' },
  { top: '65%', left: '65%', size: 'w-0.5 h-0.5', opacity: 'bg-ink/15' },
  { top: '69%', left: '40%', size: 'w-1 h-1', opacity: 'bg-ink/20' },
  { top: '73%', left: '95%', size: 'w-0.5 h-0.5', opacity: 'bg-ink/30' },
  { top: '77%', left: '22%', size: 'w-1 h-1', opacity: 'bg-ink/15' },
  { top: '81%', left: '58%', size: 'w-0.5 h-0.5', opacity: 'bg-ink/20' },
  { top: '89%', left: '75%', size: 'w-0.5 h-0.5', opacity: 'bg-ink/15' },
  { top: '4%', left: '55%', size: 'w-0.5 h-0.5', opacity: 'bg-ink/15' },
]

export default function StarField() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {STARS.map((star, i) => (
        <span
          key={i}
          className={`absolute rounded-full ${star.size} ${star.opacity}`}
          style={{ top: star.top, left: star.left }}
        />
      ))}
    </div>
  )
}