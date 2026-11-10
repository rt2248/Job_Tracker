import React, { useState } from "react"
import Button from "../shared/Button"
import UserAvatar from "../shared/UserAvatar"
import AvatarPreviewModal from "./AvatarPreviewModal"
import { formatDate } from "../../utils/formatDate"
import { useToast } from "../../hooks/useToast"
import { getApiUrl } from "../../utils/config"
import { cn } from "../../utils/cn"

const getInitials = (user) => {
  if (!user) return "EV"
  const first = user.firstName?.[0] || ""
  const last = user.lastName?.[0] || ""
  if (first || last) return (first + last).toUpperCase()
  return user.username?.slice(0, 2).toUpperCase() || "EV"
}

export default function ProfileIdentityCard({
  userData,
  isLoadingUser,
  onNavigateToEdit,
  className,
}) {
  const toast = useToast()
  const [copiedEmail, setCopiedEmail] = useState(false)
  const [copiedUsername, setCopiedUsername] = useState(false)
  const [copiedId, setCopiedId] = useState(false)
  const [showAvatarPreview, setShowAvatarPreview] = useState(false)

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
    ? [userData.firstName, userData.middleName, userData.lastName].filter(Boolean).join(" ") || "Developer Account"
    : "Developer Account"

  const avatarSrc = userData?.avatarUrl
    ? (userData.avatarUrl.startsWith("http") ? userData.avatarUrl : getApiUrl(userData.avatarUrl))
    : null

  return (
    <>
      <section
        aria-label="Profile Identity"
        className={cn(
          "bg-surface border border-border-primary rounded-xl p-5 sm:p-6 shadow-sm flex flex-col gap-4",
          className
        )}
      >
        {/* Top Identity Header (Discord-inspired vertical identity layout) */}
        <div className="flex flex-col items-start gap-3">
          {/* Standalone Borderless Avatar with Preview Lightbox */}
          <UserAvatar
            src={avatarSrc}
            alt={fullName}
            initials={getInitials(userData)}
            sizeClass="w-20 h-20"
            textSizeClass="text-2xl sm:text-3xl"
            onClick={() => setShowAvatarPreview(true)}
            ariaLabel={`View ${fullName} profile picture`}
            title="Click to view profile picture"
            statusIndicator={
              <span
                className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-surface flex items-center justify-center pointer-events-none"
                title="Active Account Status"
                aria-label="Active Account Status"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </span>
            }
          />

          <div className="w-full min-w-0 space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold font-display text-ink tracking-tight break-words">
              {isLoadingUser ? (
                <span className="inline-block w-44 h-7 bg-surface-secondary rounded animate-pulse" />
              ) : (
                fullName
              )}
            </h2>

            {/* Username Tag */}
            <div className="flex items-center gap-1.5 text-sm font-mono text-muted">
              <span className="truncate">@{userData?.username || "username"}</span>
              <button
                type="button"
                onClick={() => copyToClipboard(userData?.username, setCopiedUsername, "Username copied")}
                className="text-muted hover:text-ink cursor-pointer p-0.5 shrink-0"
                title="Copy username"
                aria-label="Copy username"
              >
                {copiedUsername ? (
                  <span className="text-emerald-500 text-xs font-mono font-semibold">Copied</span>
                ) : (
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                )}
              </button>
            </div>

            {/* Professional Headline */}
            {userData?.headline ? (
              <p className="text-sm font-medium text-ink-secondary font-sans leading-snug pt-0.5">
                {userData.headline}
              </p>
            ) : (
              <p className="text-sm text-muted italic font-sans pt-0.5">
                No professional headline set yet.
              </p>
            )}
          </div>

          {/* Primary Action */}
          {onNavigateToEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={onNavigateToEdit}
              className="w-full justify-center text-sm gap-2 h-9 mt-0.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
              Edit Profile
            </Button>
          )}
        </div>

        <div className="border-t border-border-subtle" />

        {/* Vertical Identity Metadata Sections */}
        <div className="flex flex-col gap-3 text-sm font-sans">
          {/* Bio / About */}
          <div className="space-y-0.5">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-muted block">
              Bio
            </span>
            {userData?.bio ? (
              <p className="text-sm text-ink-secondary leading-relaxed whitespace-pre-line break-words">
                {userData.bio}
              </p>
            ) : (
              <p className="text-sm text-muted italic">
                No developer bio provided yet.
              </p>
            )}
          </div>

          {/* Location & Member Since */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3">
            {userData?.location && (
              <div className="space-y-0.5 min-w-0">
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-muted block">
                  Location
                </span>
                <div className="flex items-center gap-1.5 text-sm text-ink truncate">
                  <svg className="w-3.5 h-3.5 text-muted shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="truncate">{userData.location}</span>
                </div>
              </div>
            )}

            <div className="space-y-0.5 min-w-0">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-muted block">
                Member Since
              </span>
              <span className="font-mono text-sm text-ink font-medium block truncate">
                {formatDate(userData?.createdAt)}
              </span>
            </div>
          </div>

          <div className="border-t border-border-subtle" />

          {/* Contact & Account Ledger */}
          <div className="space-y-2.5">
            {/* Email Address */}
            <div className="space-y-0.5">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-muted block">
                Email
              </span>
              <div className="flex items-center justify-between gap-2 min-w-0">
                <span className="font-mono text-sm text-ink truncate font-medium" title={userData?.email}>
                  {userData?.email || "—"}
                </span>
                {userData?.email && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(userData.email, setCopiedEmail, "Email copied")}
                    className="text-muted hover:text-ink cursor-pointer shrink-0 p-1"
                    title="Copy Email"
                    aria-label="Copy Email"
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

            {/* Account ID */}
            <div className="space-y-0.5">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-muted block">
                Account ID
              </span>
              <div className="flex items-center justify-between gap-2 min-w-0">
                <span className="font-mono text-sm text-ink truncate font-medium" title={userData?.id}>
                  {userData?.id ? `${userData.id.slice(0, 12)}...` : "—"}
                </span>
                {userData?.id && (
                  <button
                    type="button"
                    onClick={() => copyToClipboard(userData.id, setCopiedId, "Account ID copied")}
                    className="text-muted hover:text-ink cursor-pointer shrink-0 p-1"
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
          </div>
        </div>
      </section>

      <AvatarPreviewModal
        isOpen={showAvatarPreview}
        onClose={() => setShowAvatarPreview(false)}
        src={avatarSrc}
        alt={fullName}
        initials={getInitials(userData)}
        displayName={fullName}
        username={userData?.username}
      />
    </>
  )
}
