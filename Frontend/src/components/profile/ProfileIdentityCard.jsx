import React, { useState } from "react"
import Card from "../shared/Card"
import Badge from "../shared/Badge"
import { formatDate } from "../../utils/formatDate"
import { useToast } from "../../hooks/useToast"
import { getApiUrl } from "../../utils/config"

const getInitials = (user) => {
  if (!user) return "EV"
  const first = user.firstName?.[0] || ""
  const last = user.lastName?.[0] || ""
  if (first || last) return (first + last).toUpperCase()
  return user.username?.slice(0, 2).toUpperCase() || "EV"
}

const CopyField = ({ label, icon, value, displayValue, copied, onCopy, title }) => (
  <div className="py-2.5 flex items-center justify-between gap-2">
    <span className="text-muted flex items-center gap-2 shrink-0">
      {icon}
      {label}
    </span>
    <div className="flex items-center gap-1.5 min-w-0">
      <span className="font-mono text-ink truncate text-[11px]" title={title || value}>
        {displayValue || value || "—"}
      </span>
      <button
        type="button"
        onClick={() => onCopy(value)}
        className="p-1 text-muted hover:text-ink cursor-pointer shrink-0 transition-colors"
        title={`Copy ${label}`}
        aria-label={`Copy ${label}`}
      >
        {copied ? (
          <span className="text-green text-[10px] font-mono">Copied</span>
        ) : (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        )}
      </button>
    </div>
  </div>
)

const ProfileIdentityCard = ({ userData, isLoadingUser }) => {
  const toast = useToast()
  const [copiedEmail, setCopiedEmail] = useState(false)
  const [copiedUsername, setCopiedUsername] = useState(false)
  const [copiedId, setCopiedId] = useState(false)

  const copyToClipboard = async (text, setCopiedState, successMessage) => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopiedState(true)
      toast.success(successMessage)
      setTimeout(() => setCopiedState(false), 2000)
    } catch (err) {
      console.error("Clipboard copy failed:", err)
    }
  }

  const fullName = userData
    ? [userData.firstName, userData.middleName, userData.lastName].filter(Boolean).join(" ") || "User Account"
    : "User Account"

  const avatarSrc = userData?.avatarUrl
    ? (userData.avatarUrl.startsWith("http") ? userData.avatarUrl : getApiUrl(userData.avatarUrl))
    : null

  return (
    <Card className="bg-surface border-border-primary rounded-2xl p-6 flex flex-col items-center text-center shadow-sm">
      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-surface-secondary border border-border-primary flex items-center justify-center text-ink text-2xl sm:text-3xl font-display font-semibold select-none shadow-sm overflow-hidden relative">
        {avatarSrc ? (
          <img
            src={avatarSrc}
            alt={fullName}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none"
              const fb = e.currentTarget.parentElement?.querySelector(".avatar-fallback")
              if (fb) fb.classList.remove("hidden")
            }}
          />
        ) : null}
        <span className={`avatar-fallback ${avatarSrc ? "hidden" : "block"}`}>
          {getInitials(userData)}
        </span>
      </div>

      <div className="mt-4 w-full">
        <h2 className="text-xl font-bold font-display text-ink tracking-tight truncate">
          {isLoadingUser ? (
            <span className="inline-block w-36 h-6 bg-surface-secondary rounded animate-pulse" />
          ) : (
            fullName
          )}
        </h2>

        {userData?.headline && (
          <p className="text-xs text-ink-secondary mt-1 font-sans line-clamp-2">
            {userData.headline}
          </p>
        )}

        {userData?.location && (
          <div className="flex items-center justify-center gap-1 text-[11px] text-muted mt-1 font-sans">
            <svg className="w-3.5 h-3.5 text-muted/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{userData.location}</span>
          </div>
        )}

        <div className="flex items-center justify-center gap-1.5 text-xs font-mono text-muted mt-1.5">
          <span>@{userData?.username || "username"}</span>
          <button
            type="button"
            onClick={() => copyToClipboard(userData?.username, setCopiedUsername, "Username copied to clipboard")}
            className="text-muted hover:text-ink cursor-pointer ml-1"
            title="Copy username"
            aria-label="Copy username"
          >
            {copiedUsername ? (
              <span className="text-green text-[10px] font-mono">Copied</span>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div className="w-full mt-6 pt-4 border-t border-border-subtle flex flex-col divide-y divide-border-subtle text-left text-xs font-sans">
        <CopyField
          label="Email"
          icon={
            <svg className="w-4 h-4 text-muted/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          }
          value={userData?.email}
          copied={copiedEmail}
          onCopy={(val) => copyToClipboard(val, setCopiedEmail, "Email copied to clipboard")}
        />

        <CopyField
          label="Account ID"
          icon={
            <svg className="w-4 h-4 text-muted/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
          }
          value={userData?.id}
          displayValue={userData?.id ? `${userData.id.slice(0, 8)}...` : "—"}
          title={userData?.id}
          copied={copiedId}
          onCopy={(val) => copyToClipboard(val, setCopiedId, "Account ID copied to clipboard")}
        />

        <div className="py-2.5 flex items-center justify-between gap-2">
          <span className="text-muted flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green" />
            Account Status
          </span>
          <Badge variant="emerald" size="sm" className="font-medium">
            Active
          </Badge>
        </div>

        <div className="py-2.5 flex items-center justify-between gap-2">
          <span className="text-muted flex items-center gap-2">
            <svg className="w-4 h-4 text-muted/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Member Since
          </span>
          <span className="font-mono text-ink font-medium text-[11px]">
            {formatDate(userData?.createdAt)}
          </span>
        </div>
      </div>
    </Card>
  )
}

export default ProfileIdentityCard
