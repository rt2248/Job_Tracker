import PipelineViz from './PipelineViz'
import EventBadge from './EventBadge'

export default function WorkflowSection() {
  return (
    <section id="workflow" className="px-[60px] py-[120px] max-w-[1280px] mx-auto">
      <div className="text-center mb-14">
        <div className="inline-flex items-center gap-2 px-3.5 py-[5px] rounded-full bg-cyan/[0.07] border border-cyan/30 text-[11px] font-semibold text-cyan font-mono tracking-[0.1em] mb-5">
          WORKFLOW ENGINE
        </div>
        <h2 className="font-display text-[clamp(28px,4vw,48px)] font-extrabold tracking-[-0.03em] text-ink mb-4">
          State machine, not spreadsheet
        </h2>
        <p className="text-base text-muted-light max-w-[520px] mx-auto leading-[1.65] font-body">
          Each job application progresses through enforced transitions. No random status changes — structured, controlled, auditable.
        </p>
      </div>
      <PipelineViz />
      <div className="flex justify-center mt-8">
        <EventBadge event="LIVE" />
      </div>
    </section>
  )
}
