import { ACCENTS } from './constants'

export default function FeatureCard({ feature, index }) {
  const accent = ACCENTS[feature.accent]

  return (
    <div
      style={{ animationDelay: `${index * 0.08}s` }}
      className={`group px-7 pt-7 pb-6 rounded-2xl bg-surface border border-indigo/18 transition-all duration-300 ease-in-out cursor-default
        shadow-[0_4px_20px_rgba(0,0,0,0.2)] animate-slide-in-up
        hover:-translate-y-1 hover:bg-gradient-to-br hover:to-surface hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)]
        ${accent.hoverBorder} ${accent.hoverFrom}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl transition-all duration-300 ${accent.bgSoft} border ${accent.border30} ${accent.text} ${accent.groupHoverGlow}`}>
          {feature.icon}
        </div>
        <span className={`text-[9px] font-bold tracking-[0.12em] px-2 py-[3px] rounded-md font-mono border ${accent.text} ${accent.bgSoft} ${accent.border30}`}>
          {feature.tag}
        </span>
      </div>
      <h3 className="font-display text-lg font-bold text-ink mb-2.5 tracking-[-0.02em]">
        {feature.label}
      </h3>
      <p className="text-sm leading-[1.65] text-muted-light m-0 font-body">
        {feature.desc}
      </p>
    </div>
  )
}
