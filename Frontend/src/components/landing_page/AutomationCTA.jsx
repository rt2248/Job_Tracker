export default function AutomationCTA() {
  return (
    <section className="mx-auto mb-[120px] max-w-[1160px] rounded-3xl border border-indigo/18 p-20 relative overflow-hidden bg-gradient-to-br from-surface via-indigo/[0.08] to-surface">
      {/* BG decoration */}
      <div className="absolute -right-[60px] -top-[60px] w-[360px] h-[360px] rounded-full pointer-events-none bg-[radial-gradient(circle,rgba(99,102,241,0.078)_0%,transparent_70%)]" />
      <div className="absolute -left-10 -bottom-10 w-60 h-60 rounded-full pointer-events-none bg-[radial-gradient(circle,rgba(34,211,238,0.063)_0%,transparent_70%)]" />

      <div className="grid grid-cols-[1fr_auto] gap-[60px] items-center relative z-[1]">
        <div>
          <h2 className="font-display text-[clamp(28px,3vw,44px)] font-extrabold tracking-[-0.03em] text-ink mb-4">
            Part of a larger<br />
            <span className="bg-gradient-to-br from-indigo to-cyan bg-clip-text text-transparent">
              automation ecosystem.
            </span>
          </h2>
          <p className="text-base text-muted-light leading-[1.7] mb-8 max-w-[500px]">
            JobTracker is a plug-in module in a broader workflow automation platform. Trigger resume analysis, send deadline alerts, fire webhooks — all connected.
          </p>
          <div className="flex gap-3">
            <button className="px-[26px] py-[13px] rounded-[10px] text-sm font-semibold bg-gradient-to-br from-indigo to-[#4338ca] border-none text-white cursor-pointer font-body transition-shadow duration-200 shadow-[0_0_30px_rgba(99,102,241,0.3)] hover:shadow-[0_0_50px_rgba(99,102,241,0.5)]">
              Get started free
            </button>
            <button className="px-[26px] py-[13px] rounded-[10px] text-sm font-medium bg-transparent border border-indigo/18 text-muted-light cursor-pointer font-body transition-all duration-200 hover:border-indigo/45 hover:text-ink">
              Read the docs →
            </button>
          </div>
        </div>

        {/* Code snippet */}
        <div className="bg-[#020817] rounded-[14px] border border-indigo/18 px-7 py-6 font-mono text-xs leading-[1.7] min-w-[300px] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          <div className="flex gap-1.5 mb-4">
            {['bg-red', 'bg-amber', 'bg-green'].map(colorClass => (
              <div key={colorClass} className={`w-2.5 h-2.5 rounded-full opacity-60 ${colorClass}`} />
            ))}
          </div>
          <div className="text-muted">{'// Automation event payload'}</div>
          <div className="text-muted-light">{'{'}</div>
          <div className="pl-5">
            <div><span className="text-cyan">"event"</span><span className="text-muted-light">: </span><span className="text-[#a3e635]">"JOB_STATUS_UPDATED"</span><span className="text-muted-light">,</span></div>
            <div><span className="text-cyan">"data"</span><span className="text-muted-light">: {'{'}</span></div>
            <div className="pl-5">
              <div><span className="text-indigo-light">"company"</span><span className="text-muted-light">: </span><span className="text-[#a3e635]">"Anthropic"</span><span className="text-muted-light">,</span></div>
              <div><span className="text-indigo-light">"status"</span><span className="text-muted-light">: </span><span className="text-[#a3e635]">"Offer"</span><span className="text-muted-light">,</span></div>
              <div><span className="text-indigo-light">"timestamp"</span><span className="text-muted-light">: </span><span className="text-amber">"2025-01-28T..."</span></div>
            </div>
            <div className="text-muted-light">{'}'}</div>
          </div>
          <div className="text-muted-light">{'}'}</div>
        </div>
      </div>
    </section>
  )
}
