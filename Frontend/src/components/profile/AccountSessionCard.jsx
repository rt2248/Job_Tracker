import React from "react"
import Button from "../shared/Button"
import { cn } from "../../utils/cn"

const AccountSessionCard = ({ onRequestSignOut, className }) => {
  return (
    <section
      aria-label="Account Session"
      className={cn(
        "bg-surface border border-border-primary rounded-xl p-6 sm:p-7 shadow-sm flex flex-col justify-between gap-5",
        className
      )}
    >
      <div className="flex items-center gap-3 pb-3 border-b border-border-subtle">
        <div className="w-8 h-8 rounded-lg bg-surface-secondary flex items-center justify-center text-red border border-border-subtle shrink-0">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold font-display text-ink tracking-tight">Active Session</h3>
          <p className="text-xs text-muted font-sans mt-0.5">Session state and browser authentication</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-surface-secondary/40 border border-border-subtle">
        <div className="min-w-0">
          <span className="text-sm sm:text-base font-semibold text-ink block">Sign Out</span>
          <span className="text-xs sm:text-sm text-muted font-sans mt-0.5 block leading-relaxed">
            Terminate your active authenticated session on this browser device.
          </span>
        </div>

        <Button
          variant="destructive"
          size="sm"
          onClick={onRequestSignOut}
          className="shrink-0 text-xs sm:text-sm px-4 h-9 cursor-pointer"
        >
          Sign Out
        </Button>
      </div>
    </section>
  )
}

export default AccountSessionCard
