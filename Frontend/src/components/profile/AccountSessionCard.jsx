import React from "react"
import Card from "../shared/Card"
import Button from "../shared/Button"

const AccountSessionCard = ({ onRequestSignOut }) => {
  return (
    <Card className="bg-surface border-border-primary rounded-2xl p-5 sm:p-6 shadow-sm">
      <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-border-subtle">
        <div className="w-8 h-8 rounded-lg bg-surface-secondary flex items-center justify-center text-red border border-border-subtle">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </div>
        <div>
          <h3 className="text-base font-semibold font-display text-ink">Account Session</h3>
          <p className="text-[11px] text-muted font-sans">Active authentication session and device security</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-surface-secondary/40 border border-border-subtle">
        <div className="min-w-0">
          <span className="text-sm font-medium text-ink block">Sign Out of Evolexa</span>
          <span className="text-xs text-muted font-sans mt-0.5 block">
            Safely terminate your active authenticated session on this browser.
          </span>
        </div>

        <Button
          variant="destructive"
          size="sm"
          onClick={onRequestSignOut}
          className="shrink-0 text-xs px-4 cursor-pointer"
        >
          Sign Out
        </Button>
      </div>
    </Card>
  )
}

export default AccountSessionCard

