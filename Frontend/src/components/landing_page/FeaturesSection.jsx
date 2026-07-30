import { FEATURES } from './constants'
import FeatureCard from './FeatureCard'

export default function FeaturesSection() {
  return (
    <section id="features" className="px-[60px] pt-10 pb-[120px] max-w-[1280px] mx-auto">
      <div className="text-center mb-14">
        <div className="inline-flex items-center gap-2 px-3.5 py-[5px] rounded-full bg-indigo/12 border border-indigo/30 text-[11px] font-semibold text-indigo-light font-mono tracking-[0.1em] mb-5">
          CAPABILITIES
        </div>
        <h2 className="font-display text-[clamp(28px,4vw,48px)] font-extrabold tracking-[-0.03em] text-ink mb-4">
          Built for the serious applicant
        </h2>
        <p className="text-base text-muted-light max-w-[520px] mx-auto leading-[1.65] font-body">
          Every feature is designed to compose with external systems — not just store data, but drive workflows.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        {FEATURES.map((f, i) => <FeatureCard key={f.label} feature={f} index={i} />)}
      </div>
    </section>
  )
}
