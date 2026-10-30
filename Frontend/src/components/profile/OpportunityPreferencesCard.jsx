import React from "react"
import Card from "../shared/Card"
import { cn } from "../../utils/cn"

const OpportunityPreferencesCard = ({ returnPromptsEnabled, onToggleReturnPrompts }) => {
  return (
    <Card className="bg-surface border-border-primary rounded-2xl p-5 sm:p-6 shadow-sm">
      <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-border-subtle">
        <div className="w-8 h-8 rounded-lg bg-surface-secondary flex items-center justify-center text-ink border border-border-subtle">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
        </div>
        <div>
          <h3 className="text-base font-semibold font-display text-ink">Opportunity Preferences</h3>
          <p className="text-[11px] text-muted font-sans">Discovery prompts and application tracking behaviors</p>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-surface-secondary/40 border border-border-subtle flex items-center justify-between gap-4">
        <div className="min-w-0">
          <span className="text-ink font-medium text-sm block">Return-triggered prompts</span>
          <span className="text-muted text-xs font-sans mt-0.5 block leading-relaxed">
            Ask to track opportunities when returning to Evolexa after viewing external job postings.
          </span>
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={returnPromptsEnabled}
          onClick={onToggleReturnPrompts}
          className={cn(
            "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo/40",
            returnPromptsEnabled ? "bg-indigo" : "bg-surface-secondary border border-border-primary"
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
    </Card>
  )
}

export default OpportunityPreferencesCard

