import React from "react"
import { cn } from "../../utils/cn"

const OpportunityPreferencesCard = ({ returnPromptsEnabled, onToggleReturnPrompts, className }) => {
  return (
    <section
      aria-label="Opportunity Preferences"
      className={cn(
        "bg-surface border border-border-primary rounded-xl p-6 sm:p-7 shadow-sm flex flex-col justify-between gap-5",
        className
      )}
    >
      <div className="flex items-center gap-3 pb-3 border-b border-border-subtle">
        <div className="w-8 h-8 rounded-lg bg-surface-secondary flex items-center justify-center text-cyan border border-border-subtle shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold font-display text-ink tracking-tight">Opportunity Preferences</h3>
          <p className="text-xs text-muted font-sans mt-0.5">Automated prompt triggers and capture behavior</p>
        </div>
      </div>

      <div className="p-4 rounded-lg bg-surface-secondary/40 border border-border-subtle flex items-center justify-between gap-4">
        <div className="min-w-0">
          <span className="text-ink font-semibold text-sm sm:text-base block">Return Prompts</span>
          <span className="text-muted text-xs sm:text-sm font-sans mt-0.5 block leading-relaxed">
            Prompt to track external opportunities when refocusing the Evolexa window.
          </span>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={returnPromptsEnabled}
          aria-label="Toggle return-triggered prompts"
          onClick={onToggleReturnPrompts}
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan/40",
            returnPromptsEnabled ? "bg-cyan" : "bg-surface-secondary border border-border-primary"
          )}
        >
          <span
            aria-hidden="true"
            className={cn(
              "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
              returnPromptsEnabled ? "translate-x-5" : "translate-x-0"
            )}
          />
        </button>
      </div>
    </section>
  )
}

export default OpportunityPreferencesCard
