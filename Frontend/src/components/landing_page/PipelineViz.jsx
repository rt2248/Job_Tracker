import { useState, useEffect } from 'react'
import { STAGES, STAGE_ACCENT, ACCENTS, ACCENT_RGB } from './constants'

export default function PipelineViz() {
  const [activeStage, setActiveStage] = useState(2)

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStage(s => (s + 1) % STAGES.length)
    }, 2000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="w-full overflow-x-auto p-4 sm:p-8 md:px-10 md:py-8 bg-surface border border-indigo/18 rounded-[20px] relative">
      <div className="flex items-center gap-0 min-w-[550px] md:min-w-0 relative">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_60%_80%_at_50%_50%,rgba(99,102,241,0.12),transparent)]" />
        {STAGES.map((stage, i) => {
          const isActive = i === activeStage
          const isPast = i < activeStage
          const accent = ACCENTS[STAGE_ACCENT[stage]]

          return (
            <div key={stage} className={`flex items-center ${i < STAGES.length - 1 ? 'flex-1' : ''}`}>
              <div
                onClick={() => setActiveStage(i)}
                className="flex flex-col items-center gap-2 cursor-pointer relative z-10"
              >
                {/* Node */}
                <div
                  className={`rounded-full flex items-center justify-center transition-all duration-[400ms] relative border-2 ${
                    isActive
                      ? `w-11 h-11 sm:w-[52px] sm:h-[52px] ${accent.bgSolid} ${accent.borderSolid} ${accent.glow}`
                      : isPast
                      ? `w-9 h-9 sm:w-10 sm:h-10 ${accent.bg30} ${accent.border50}`
                      : 'w-9 h-9 sm:w-10 sm:h-10 bg-surface-2 border-indigo/18'
                  }`}
                >
                  {isActive && (
                    <div className={`absolute -inset-1.5 rounded-full border animate-pulse-ring ${accent.border40}`} />
                  )}
                  <span className={isActive ? 'text-sm sm:text-base text-white' : isPast ? `text-xs sm:text-[13px] ${accent.text}` : 'text-xs sm:text-[13px] text-muted'}>
                    {isPast ? '✓' : i + 1}
                  </span>
                </div>
                {/* Label */}
                <span
                  className={`text-[11px] sm:text-xs font-display transition-all duration-300 whitespace-nowrap ${
                    isActive ? `font-bold ${accent.text}` : isPast ? 'font-medium text-muted-light' : 'font-medium text-muted'
                  }`}
                >
                  {stage}
                </span>
              </div>

              {/* Connector */}
              {i < STAGES.length - 1 && (
                <div
                  className="flex-1 h-0.5 mb-[22px] relative transition-all duration-[400ms]"
                  style={{
                    background: `linear-gradient(90deg, rgba(${ACCENT_RGB[STAGE_ACCENT[stage]]},${isPast ? 0.6 : 0.18}), rgba(${ACCENT_RGB[STAGE_ACCENT[STAGES[i + 1]]]},${i + 1 <= activeStage ? 0.6 : 0.18}))`,
                  }}
                >
                  {i === activeStage - 1 && (
                    <div
                      className={`absolute -top-[3px] left-1/2 w-2 h-2 rounded-full -translate-x-1/2 animate-float ${accent.bgSolid}`}
                      style={{ boxShadow: `0 0 8px rgba(${ACCENT_RGB[STAGE_ACCENT[stage]]},1)` }}
                    />
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
