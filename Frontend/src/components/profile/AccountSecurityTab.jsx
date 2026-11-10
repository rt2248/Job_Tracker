import React, { useState } from "react"
import Button from "../shared/Button"
import OpportunityPreferencesCard from "./OpportunityPreferencesCard"
import ThemePreferenceCard from "./ThemePreferenceCard"
import ChangePasswordModal from "./ChangePasswordModal"
import { formatDate } from "../../utils/formatDate"
import { useToast } from "../../hooks/useToast"

export default function AccountSecurityTab({
  userData,
  returnPromptsEnabled,
  onToggleReturnPrompts,
  onRequestSignOut,
  onPasswordChanged,
}) {
  const toast = useToast()
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [copiedId, setCopiedId] = useState(false)
  const [copiedEmail, setCopiedEmail] = useState(false)

  const copyToClipboard = async (text, setCopiedState, msg) => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopiedState(true)
      toast.success(msg)
      setTimeout(() => setCopiedState(false), 2000)
    } catch {
      toast.error("Could not copy")
    }
  }

  const passwordChangedText = userData?.passwordChangedAt
    ? formatDate(userData.passwordChangedAt)
    : "Not recorded yet"

  return (
    <div className="flex flex-col gap-8 sm:gap-10">
      {/* 1. Security Overview Banner */}
      <section
        aria-label="Security Overview"
        className="bg-surface border border-border-primary rounded-xl p-6 sm:p-7 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-lg bg-surface-secondary border border-border-subtle flex items-center justify-center shrink-0 text-cyan">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold font-display text-ink tracking-tight">
                Account Security Status
              </h2>
              <span className="px-2 py-0.5 rounded text-[11px] font-sans font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Protected
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted font-sans mt-0.5">
              Active session authentication, token-version verification, and server authorization enabled.
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowPasswordModal(true)}
          className="shrink-0 text-xs sm:text-sm self-start sm:self-auto gap-1.5 h-9 px-3.5"
        >
          <svg className="w-3.5 h-3.5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          Change Password
        </Button>
      </section>

      {/* 2. Account Credentials & Master Records Ledger (Clean divided layout without nested boxed cards) */}
      <section
        aria-label="Account Credentials"
        className="bg-surface border border-border-primary rounded-xl p-6 sm:p-8 shadow-sm flex flex-col gap-6"
      >
        <div className="pb-3 border-b border-border-subtle">
          <h3 className="text-xl sm:text-2xl font-bold font-display text-ink tracking-tight">
            Account Information
          </h3>
          <p className="text-xs sm:text-sm text-muted font-sans mt-0.5">
            Registered authentication identifiers and credential timestamps.
          </p>
        </div>

        <div className="divide-y divide-border-subtle font-sans text-xs sm:text-sm">
          {/* Email Address */}
          <div className="py-3.5 flex items-center justify-between gap-4">
            <span className="text-muted font-medium w-40 shrink-0">Email Address</span>
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-mono text-ink font-semibold truncate" title={userData?.email}>
                {userData?.email || "—"}
              </span>
              {userData?.email && (
                <button
                  type="button"
                  onClick={() => copyToClipboard(userData.email, setCopiedEmail, "Email copied")}
                  className="text-muted hover:text-ink cursor-pointer p-1 shrink-0"
                  title="Copy email"
                  aria-label="Copy email"
                >
                  {copiedEmail ? (
                    <span className="text-emerald-500 font-mono text-xs font-semibold">Copied</span>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Username */}
          <div className="py-3.5 flex items-center justify-between gap-4">
            <span className="text-muted font-medium w-40 shrink-0">Username</span>
            <span className="font-mono text-ink font-semibold">
              @{userData?.username || "—"}
            </span>
          </div>

          {/* Account ID */}
          <div className="py-3.5 flex items-center justify-between gap-4">
            <span className="text-muted font-medium w-40 shrink-0">Account ID</span>
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-mono text-ink font-semibold truncate" title={userData?.id}>
                {userData?.id || "—"}
              </span>
              {userData?.id && (
                <button
                  type="button"
                  onClick={() => copyToClipboard(userData.id, setCopiedId, "Account ID copied")}
                  className="text-muted hover:text-ink cursor-pointer p-1 shrink-0"
                  title="Copy Account ID"
                  aria-label="Copy Account ID"
                >
                  {copiedId ? (
                    <span className="text-emerald-500 font-mono text-xs font-semibold">Copied</span>
                  ) : (
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Member Since */}
          <div className="py-3.5 flex items-center justify-between gap-4">
            <span className="text-muted font-medium w-40 shrink-0">Registration Date</span>
            <span className="font-mono text-ink font-semibold">
              {formatDate(userData?.createdAt)}
            </span>
          </div>

          {/* Password Last Changed */}
          <div className="py-3.5 flex items-center justify-between gap-4">
            <span className="text-muted font-medium w-40 shrink-0">Password Updated</span>
            <span className="font-mono text-ink font-semibold">
              {passwordChangedText}
            </span>
          </div>

          {/* Verification Status */}
          <div className="py-3.5 flex items-center justify-between gap-4">
            <span className="text-muted font-medium w-40 shrink-0">Status</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Active & Verified
            </span>
          </div>
        </div>
      </section>

      {/* 3. Credentials & 2FA Controls */}
      <section
        aria-label="Security Controls"
        className="bg-surface border border-border-primary rounded-xl p-6 sm:p-8 shadow-sm flex flex-col gap-6"
      >
        <div className="pb-3 border-b border-border-subtle">
          <h3 className="text-xl sm:text-2xl font-bold font-display text-ink tracking-tight">
            Credentials & Authentication
          </h3>
          <p className="text-xs sm:text-sm text-muted font-sans mt-0.5">
            Password management and authentication security features.
          </p>
        </div>

        <div className="space-y-4">
          {/* Functional Password Row */}
          <div className="p-4 rounded-lg bg-surface-secondary/40 border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-surface border border-border-subtle flex items-center justify-center shrink-0 text-cyan">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <span className="font-semibold text-sm sm:text-base text-ink block">Account Password</span>
                <p className="text-xs sm:text-sm text-muted font-sans mt-0.5">
                  Last updated: <span className="font-mono text-ink-secondary">{passwordChangedText}</span>
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowPasswordModal(true)}
              className="shrink-0 self-start sm:self-center text-xs sm:text-sm h-9 px-3.5"
            >
              Change Password
            </Button>
          </div>

          {/* Two-Factor Authentication Info Row */}
          <div className="p-4 rounded-lg bg-surface-secondary/25 border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3 opacity-80">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-surface border border-border-subtle flex items-center justify-center shrink-0 text-muted">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm sm:text-base text-ink block">Two-Factor Authentication (2FA)</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-surface-elevated text-muted border border-border-subtle">
                    Planned v2.2
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-muted font-sans mt-0.5">
                  TOTP authenticator app and recovery codes scheduled for an upcoming platform release.
                </p>
              </div>
            </div>
            <span className="self-start sm:self-center text-xs font-mono font-medium text-muted bg-surface-secondary px-2.5 py-1 rounded border border-border-subtle">
              Future Update
            </span>
          </div>
        </div>
      </section>

      {/* 4. Preferences & Session Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        <OpportunityPreferencesCard
          returnPromptsEnabled={returnPromptsEnabled}
          onToggleReturnPrompts={onToggleReturnPrompts}
          className="h-full"
        />

        <ThemePreferenceCard className="h-full" />
      </div>

      {/* 5. Active Session Control */}
      <section
        aria-label="Active Authentication Session"
        className="bg-surface border border-border-primary rounded-xl p-6 sm:p-7 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-surface-secondary border border-border-subtle flex items-center justify-center shrink-0 text-muted">
            <svg className="w-4 h-4 text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-bold font-display text-ink tracking-tight">Active Session</h3>
            <p className="text-xs sm:text-sm text-muted font-sans mt-0.5">
              Authenticated session active for <span className="font-mono text-ink font-semibold">{userData?.email}</span>.
            </p>
          </div>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={onRequestSignOut}
          className="shrink-0 text-xs sm:text-sm h-9 px-4 cursor-pointer"
        >
          Sign Out
        </Button>
      </section>

      {/* Change Password Modal Dialog */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onPasswordChanged={onPasswordChanged}
      />
    </div>
  )
}
