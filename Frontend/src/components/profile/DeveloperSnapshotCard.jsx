import React, { useState } from "react"
import Button from "../shared/Button"
import { cn } from "../../utils/cn"
import { useToast } from "../../hooks/useToast"
import { getApiUrl } from "../../utils/config"

const DeveloperSnapshotCard = ({ profileData, onNavigateToEdit }) => {
  const toast = useToast()
  const [copiedLink, setCopiedLink] = useState(false)

  const hasSkills = Array.isArray(profileData?.skills) && profileData.skills.length > 0
  const hasExperience = Array.isArray(profileData?.experience) && profileData.experience.length > 0
  const socialLinks = profileData?.socialLinks || {}
  const hasLinks = Boolean(
    socialLinks.portfolio ||
    socialLinks.github ||
    socialLinks.linkedin ||
    socialLinks.twitter
  )

  const publicUrl = profileData?.username
    ? getApiUrl(`/api/profile/${profileData.username}`)
    : ""

  const handleCopyPublicUrl = async () => {
    if (!publicUrl) return
    try {
      await navigator.clipboard.writeText(publicUrl)
      setCopiedLink(true)
      toast.success("Public profile link copied to clipboard")
      setTimeout(() => setCopiedLink(false), 2000)
    } catch {
      toast.error("Could not copy link")
    }
  }

  return (
    <section
      aria-label="Professional Information"
      className="bg-surface border border-border-primary rounded-xl p-6 sm:p-8 shadow-sm flex flex-col gap-8"
    >
      {/* 1. Profile Visibility Strip */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-surface-secondary/40 border border-border-subtle">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-surface flex items-center justify-center shrink-0 border border-border-subtle text-ink">
            {profileData?.isPublicProfile ? (
              <svg className="w-4 h-4 text-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            ) : (
              <svg className="w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-ink font-display">
                Profile Visibility
              </span>
              <span className="text-muted/60">·</span>
              <span className={cn(
                "text-xs font-mono font-semibold flex items-center gap-1.5",
                profileData?.isPublicProfile ? "text-cyan" : "text-muted"
              )}>
                <span className={cn("w-1.5 h-1.5 rounded-full", profileData?.isPublicProfile ? "bg-cyan" : "bg-muted")} />
                {profileData?.isPublicProfile ? "Public Profile" : "Private"}
              </span>
            </div>
            <p className="text-xs text-muted mt-0.5 font-sans">
              {profileData?.isPublicProfile
                ? "Your developer profile is public and accessible via shareable link."
                : "Your profile is private and hidden from external viewers."}
            </p>
          </div>
        </div>

        {profileData?.isPublicProfile && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyPublicUrl}
            className="shrink-0 gap-1.5 text-xs self-start sm:self-auto h-8 px-3"
          >
            {copiedLink ? (
              <span className="text-emerald-500 font-mono text-xs font-semibold">Copied!</span>
            ) : (
              <>
                <svg className="w-3.5 h-3.5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Copy Public Link</span>
              </>
            )}
          </Button>
        )}
      </div>

      {/* 2. Technical Stack & Skills */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h3 className="text-lg sm:text-xl font-bold font-display text-ink tracking-tight">
              Technical Stack & Skills
            </h3>
            {hasSkills && (
              <span className="text-xs font-mono font-semibold text-muted bg-surface-secondary px-2 py-0.5 rounded">
                {profileData.skills.length}
              </span>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onNavigateToEdit} className="text-xs text-cyan hover:text-cyan/80 h-7 px-2">
            Edit
          </Button>
        </div>

        {hasSkills ? (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {profileData.skills.map((skill) => (
              <span
                key={skill}
                className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium bg-surface-secondary text-ink border border-border-subtle/80"
              >
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted italic font-sans">
            No skills added yet. Add your technical stack in the Edit Profile tab.
          </p>
        )}
      </div>

      <div className="border-t border-border-subtle" />

      {/* 4. Experience Timeline (Clean divided layout without nested boxed cards) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg sm:text-xl font-bold font-display text-ink tracking-tight">
            Work History & Roles
          </h3>
          <Button variant="ghost" size="sm" onClick={onNavigateToEdit} className="text-xs text-cyan hover:text-cyan/80 h-7 px-2">
            Edit
          </Button>
        </div>

        {hasExperience ? (
          <div className="divide-y divide-border-subtle">
            {profileData.experience.map((exp, idx) => (
              <div
                key={`${exp.company}-${idx}`}
                className="py-4 first:pt-0 last:pb-0 flex flex-col gap-1.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="font-bold text-ink text-base font-display">
                      {exp.title}
                    </span>
                    <span className="text-muted/60">at</span>
                    <span className="font-semibold text-ink-secondary text-sm">
                      {exp.company}
                    </span>
                    {exp.location && (
                      <span className="text-xs text-muted font-sans">({exp.location})</span>
                    )}
                  </div>
                  <span className="text-xs font-mono text-cyan font-medium shrink-0">
                    {exp.startDate || "—"} &ndash; {exp.current ? "Present" : exp.endDate || "—"}
                  </span>
                </div>

                {exp.description && (
                  <p className="text-xs sm:text-sm text-muted mt-1 leading-relaxed font-sans whitespace-pre-line">
                    {exp.description}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted italic font-sans">
            No career roles added yet. Highlight your experience in the Edit Profile tab.
          </p>
        )}
      </div>

      <div className="border-t border-border-subtle" />

      {/* 5. Web Presence & Portfolio */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-lg sm:text-xl font-bold font-display text-ink tracking-tight">
            Web Presence & Links
          </h3>
          <Button variant="ghost" size="sm" onClick={onNavigateToEdit} className="text-xs text-cyan hover:text-cyan/80 h-7 px-2">
            Edit
          </Button>
        </div>

        {hasLinks ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {socialLinks.portfolio && (
              <a
                href={socialLinks.portfolio}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-lg bg-surface-secondary/50 border border-border-subtle flex items-center justify-between text-xs sm:text-sm text-ink hover:border-cyan/50 hover:bg-surface-secondary transition-colors group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-cyan font-bold font-mono text-xs">PORTFOLIO</span>
                  <span className="truncate text-muted group-hover:text-ink font-sans">{socialLinks.portfolio}</span>
                </div>
                <svg className="w-3.5 h-3.5 text-muted group-hover:text-cyan shrink-0 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
            {socialLinks.github && (
              <a
                href={socialLinks.github}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-lg bg-surface-secondary/50 border border-border-subtle flex items-center justify-between text-xs sm:text-sm text-ink hover:border-cyan/50 hover:bg-surface-secondary transition-colors group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-cyan font-bold font-mono text-xs">GITHUB</span>
                  <span className="truncate text-muted group-hover:text-ink font-sans">{socialLinks.github}</span>
                </div>
                <svg className="w-3.5 h-3.5 text-muted group-hover:text-cyan shrink-0 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
            {socialLinks.linkedin && (
              <a
                href={socialLinks.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-lg bg-surface-secondary/50 border border-border-subtle flex items-center justify-between text-xs sm:text-sm text-ink hover:border-cyan/50 hover:bg-surface-secondary transition-colors group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-cyan font-bold font-mono text-xs">LINKEDIN</span>
                  <span className="truncate text-muted group-hover:text-ink font-sans">{socialLinks.linkedin}</span>
                </div>
                <svg className="w-3.5 h-3.5 text-muted group-hover:text-cyan shrink-0 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
            {socialLinks.twitter && (
              <a
                href={socialLinks.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 rounded-lg bg-surface-secondary/50 border border-border-subtle flex items-center justify-between text-xs sm:text-sm text-ink hover:border-cyan/50 hover:bg-surface-secondary transition-colors group"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-cyan font-bold font-mono text-xs">TWITTER</span>
                  <span className="truncate text-muted group-hover:text-ink font-sans">{socialLinks.twitter}</span>
                </div>
                <svg className="w-3.5 h-3.5 text-muted group-hover:text-cyan shrink-0 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            )}
          </div>
        ) : (
          <p className="text-sm text-muted italic font-sans">
            No portfolio or social links provided yet.
          </p>
        )}
      </div>
    </section>
  )
}

export default DeveloperSnapshotCard
