import AnimatedOrbs from './AnimatedOrbs'
import GridLines from './GridLines'
import TypingHeadline from './TypingHeadline'
import MiniKanban from './MiniKanban'
import ActivityFeed from './ActivityFeed'

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      <AnimatedOrbs />
      <GridLines />

      <div className="w-full max-w-[1280px] mx-auto px-[60px] py-20 relative z-[1]">
        <div className="grid grid-cols-2 gap-20 items-center">

          {/* Left: Copy */}
          <div>
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo/12 border border-indigo/40 mb-7 animate-slide-in-up">
              <div className="w-1.5 h-1.5 rounded-full bg-green shadow-[0_0_8px_#10b981]" />
              <span className="text-xs font-medium text-indigo-light font-mono tracking-[0.04em]">
                Automation-ready workflow system
              </span>
            </div>

            {/* Headline */}
            <h1 className="font-display text-[clamp(40px,5vw,68px)] font-black leading-[1.05] tracking-[-0.04em] text-ink mb-6 [animation:slide-in-up_0.5s_ease_0.1s_both]">
              Track every<br />
              <TypingHeadline /><br />
              <span className="bg-gradient-to-br from-indigo to-cyan bg-clip-text text-transparent">intelligently.</span>
            </h1>

            {/* Sub */}
            <p className="text-[17px] leading-[1.7] text-muted-light mb-9 max-w-[480px] font-body font-normal [animation:slide-in-up_0.5s_ease_0.2s_both]">
              A workflow-driven job tracker inspired by Jira. Each application is an issue moving through enforced state transitions — with automation hooks, AI analysis, and analytics built in.
            </p>

            {/* CTAs */}
            <div className="flex gap-3.5 flex-wrap [animation:slide-in-up_0.5s_ease_0.3s_both]">
              <button className="px-7 py-3.5 rounded-[10px] text-[15px] font-semibold bg-gradient-to-br from-indigo to-[#4338ca] border-none text-white cursor-pointer flex items-center gap-2 font-body shadow-[0_0_30px_rgba(99,102,241,0.4)] transition-shadow duration-200 hover:shadow-[0_0_50px_rgba(99,102,241,0.6)]">
                Start tracking free
                <span className="text-base">→</span>
              </button>
              <button className="px-7 py-3.5 rounded-[10px] text-[15px] font-medium bg-transparent border border-indigo/18 text-muted-light cursor-pointer flex items-center gap-2 font-body transition-all duration-200 hover:border-indigo/45 hover:text-ink">
                <span className="text-base">▶</span> Watch demo
              </button>
            </div>

            {/* Tech badges */}
            <div className="flex gap-2.5 mt-9 flex-wrap [animation:slide-in-up_0.5s_ease_0.4s_both]">
              {['React', 'Node.js', 'PostgreSQL', 'n8n-ready'].map(tech => (
                <span key={tech} className="text-[11px] font-medium tracking-[0.04em] text-muted bg-white/[0.04] border border-indigo/18 px-2.5 py-1 rounded-md font-mono">
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Right: Kanban preview + activity feed */}
          <div className="flex flex-col gap-4 [animation:slide-in-right_0.6s_ease_0.2s_both]">
            <MiniKanban />
            <ActivityFeed />
          </div>
        </div>
      </div>
    </section>
  )
}
