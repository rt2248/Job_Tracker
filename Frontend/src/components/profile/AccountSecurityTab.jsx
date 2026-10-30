import React, { useState } from "react"
import Card, { CardHeader, CardTitle, CardContent } from "../shared/Card"
import Badge from "../shared/Badge"
import Button from "../shared/Button"
import OpportunityPreferencesCard from "./OpportunityPreferencesCard"
import ChangePasswordModal from "./ChangePasswordModal"
import { formatDate } from "../../utils/formatDate"

const AccountSecurityTab = ({
  userData,
  returnPromptsEnabled,
  onToggleReturnPrompts,
  onRequestSignOut,
  onPasswordChanged,
}) => {
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  const passwordChangedText = userData?.passwordChangedAt
    ? formatDate(userData.passwordChangedAt)
    : "Not recorded yet"

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      {/* 1. Account Information Card */}
      <Card className="bg-surface border-border-primary p-6 rounded-2xl shadow-sm">
        <CardHeader className="mb-4">
          <CardTitle className="text-lg sm:text-xl font-display">Account Information</CardTitle>
          <p className="text-xs sm:text-sm text-muted font-sans">
            Core authentication credentials, identity, and account timestamps.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs font-sans">
            <div className="p-3.5 rounded-xl bg-surface-secondary/70 border border-border-subtle flex flex-col gap-1">
              <span className="text-muted font-medium">Email Address</span>
              <span className="font-mono text-ink font-semibold truncate text-sm" title={userData?.email}>
                {userData?.email || "—"}
              </span>
              <span className="text-[10px] text-muted font-sans mt-0.5">
                Email changes require verification infrastructure
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-secondary/70 border border-border-subtle flex flex-col gap-1">
              <span className="text-muted font-medium">Username</span>
              <span className="font-mono text-ink font-semibold truncate text-sm">
                @{userData?.username || "—"}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-secondary/70 border border-border-subtle flex flex-col gap-1">
              <span className="text-muted font-medium">Account ID</span>
              <span className="font-mono text-muted text-[11px] truncate" title={userData?.id}>
                {userData?.id || "—"}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-secondary/70 border border-border-subtle flex flex-col gap-1">
              <span className="text-muted font-medium">Member Since</span>
              <span className="font-mono text-ink text-xs">
                {formatDate(userData?.createdAt)}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-surface-secondary/70 border border-border-subtle flex flex-col gap-1">
              <span className="text-muted font-medium">Password Last Changed</span>
              <span className="font-mono text-ink text-xs">
                {passwordChangedText}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Platform & Opportunity Preferences */}
      <OpportunityPreferencesCard
        returnPromptsEnabled={returnPromptsEnabled}
        onToggleReturnPrompts={onToggleReturnPrompts}
      />

      {/* 3. Credentials & Security Management */}
      <Card className="bg-surface border-border-primary p-6 rounded-2xl shadow-sm">
        <CardHeader className="mb-4">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-lg font-display">Security & Credentials</CardTitle>
            <Badge variant="subtle" size="sm">
              Stage 5.1 Active
            </Badge>
          </div>
          <p className="text-xs text-muted font-sans mt-0.5">
            Manage your master account credentials and session security.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Functional Change Password Card */}
            <div className="p-4 rounded-xl bg-surface-secondary/40 border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-surface-secondary border border-border-subtle flex items-center justify-center shrink-0 text-muted">
                  <svg className="w-4 h-4 text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs sm:text-sm text-ink">Account Password</span>
                    <Badge variant="outline" size="sm" className="text-[10px]">
                      Protected
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted font-sans mt-0.5">
                    Last updated: <span className="font-mono text-ink-secondary">{passwordChangedText}</span>
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowPasswordModal(true)}
                className="shrink-0 self-start sm:self-center"
              >
                Change Password
              </Button>
            </div>

            {/* Two-Factor Authentication Placeholder (Strictly Planned for Stage 5.2) */}
            <div className="p-4 rounded-xl bg-surface-secondary/25 border border-border-subtle/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 opacity-80">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-surface-secondary border border-border-subtle flex items-center justify-center shrink-0 text-muted">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-xs text-ink">Two-Factor Authentication (2FA)</span>
                    <Badge variant="subtle" size="sm" className="text-[10px]">
                      Stage 5.2 Roadmap
                    </Badge>
                  </div>
                  <p className="text-[11px] text-muted font-sans mt-0.5">
                    TOTP multi-factor authentication and recovery codes are planned for the Stage 5.2 security release.
                  </p>
                </div>
              </div>
              <Badge variant="outline" size="sm" className="self-start sm:self-center text-muted">
                Planned
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Active Session & Logout */}
      <Card className="bg-surface border-border-primary p-6 rounded-2xl shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold font-display text-ink">Active Session</h3>
            <p className="text-xs text-muted font-sans mt-0.5">
              Signed in as <span className="font-mono text-ink font-semibold">{userData?.email}</span>.
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={onRequestSignOut}
            className="shrink-0"
          >
            Sign Out
          </Button>
        </div>
      </Card>

      {/* Change Password Modal Dialog */}
      <ChangePasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onPasswordChanged={onPasswordChanged}
      />
    </div>
  )
}

export default AccountSecurityTab
