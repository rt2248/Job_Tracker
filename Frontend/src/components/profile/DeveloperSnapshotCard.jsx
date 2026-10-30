import React, { useState } from "react"
import Card, { CardHeader, CardTitle, CardContent } from "../shared/Card"
import Badge from "../shared/Badge"
import Button from "../shared/Button"
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
    <div className="flex flex-col gap-6">
      {/* Public Profile Status Banner */}
      <Card className="bg-surface border-border-primary p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-surface-secondary border border-border-subtle flex items-center justify-center shrink-0 text-ink">
            {profileData?.isPublicProfile ? (
              <svg className="w-5 h-5 text-indigo" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-ink font-display">
                Profile Visibility
              </span>
              <Badge variant={profileData?.isPublicProfile ? "indigo" : "default"}>
                {profileData?.isPublicProfile ? "Public Mode Active" : "Private"}
              </Badge>
            </div>
            <p className="text-xs text-muted mt-0.5 font-sans">
              {profileData?.isPublicProfile
                ? "Your developer profile is public and visible via public link with server-side privacy enforcement."
                : "Your profile is private and hidden from external visitors."}
            </p>
          </div>
        </div>

        {profileData?.isPublicProfile && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyPublicUrl}
            className="shrink-0 gap-1.5"
          >
            {copiedLink ? (
              <span className="text-green text-xs font-mono">Copied!</span>
            ) : (
              <>
                <svg className="w-3.5 h-3.5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>Copy Public Link</span>
              </>
            )}
          </Button>
        )}
      </Card>

      {/* Bio & Professional Summary */}
      <Card className="bg-surface border-border-primary p-6 rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between gap-2 mb-3">
          <CardTitle className="text-base sm:text-lg">About & Bio</CardTitle>
          <Button variant="ghost" size="sm" onClick={onNavigateToEdit} className="text-xs text-indigo hover:text-indigo-light">
            Edit
          </Button>
        </CardHeader>
        <CardContent>
          {profileData?.bio ? (
            <p className="text-sm text-ink-secondary leading-relaxed font-sans whitespace-pre-line">
              {profileData.bio}
            </p>
          ) : (
            <p className="text-xs text-muted italic font-sans">
              No developer bio provided yet. Click &quot;Edit&quot; to add a summary of your experience and interests.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Technical Skills */}
      <Card className="bg-surface border-border-primary p-6 rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between gap-2 mb-3">
          <CardTitle className="text-base sm:text-lg">Technical Stack & Skills</CardTitle>
          <Button variant="ghost" size="sm" onClick={onNavigateToEdit} className="text-xs text-indigo hover:text-indigo-light">
            Edit
          </Button>
        </CardHeader>
        <CardContent>
          {hasSkills ? (
            <div className="flex flex-wrap gap-2">
              {profileData.skills.map((skill) => (
                <Badge key={skill} variant="subtle" size="md" className="font-sans px-3 py-1">
                  {skill}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted italic font-sans">
              No skills added yet. Showcase your stack by adding technical skills in the Edit Profile tab.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Experience Timeline */}
      <Card className="bg-surface border-border-primary p-6 rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between gap-2 mb-3">
          <CardTitle className="text-base sm:text-lg">Experience</CardTitle>
          <Button variant="ghost" size="sm" onClick={onNavigateToEdit} className="text-xs text-indigo hover:text-indigo-light">
            Edit
          </Button>
        </CardHeader>
        <CardContent>
          {hasExperience ? (
            <div className="space-y-4">
              {profileData.experience.map((exp, idx) => (
                <div
                  key={`${exp.company}-${idx}`}
                  className="p-4 rounded-xl bg-surface-secondary/50 border border-border-subtle flex flex-col gap-1.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="font-bold text-ink text-sm font-display">
                      {exp.title}
                    </span>
                    <span className="text-[11px] font-mono text-muted">
                      {exp.startDate || "—"} &ndash; {exp.current ? "Present" : exp.endDate || "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-ink-secondary font-medium">
                    <span>{exp.company}</span>
                    {exp.location && (
                      <>
                        <span className="text-muted/60">&bull;</span>
                        <span className="text-muted text-[11px]">{exp.location}</span>
                      </>
                    )}
                  </div>
                  {exp.description && (
                    <p className="text-xs text-muted mt-1 leading-relaxed font-sans whitespace-pre-line">
                      {exp.description}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted italic font-sans">
              No experience items added. Highlight your roles and milestones by editing your profile.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Links & Portfolio */}
      <Card className="bg-surface border-border-primary p-6 rounded-2xl">
        <CardHeader className="flex flex-row items-center justify-between gap-2 mb-3">
          <CardTitle className="text-base sm:text-lg">Portfolio & Web Presence</CardTitle>
          <Button variant="ghost" size="sm" onClick={onNavigateToEdit} className="text-xs text-indigo hover:text-indigo-light">
            Edit
          </Button>
        </CardHeader>
        <CardContent>
          {hasLinks ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {socialLinks.portfolio && (
                <a
                  href={socialLinks.portfolio}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl bg-surface-secondary border border-border-subtle flex items-center justify-between text-xs text-ink hover:border-indigo/50 transition-colors group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-indigo font-bold font-mono">PORTFOLIO</span>
                    <span className="truncate text-muted group-hover:text-ink">{socialLinks.portfolio}</span>
                  </div>
                  <span className="text-muted group-hover:text-indigo shrink-0">&rarr;</span>
                </a>
              )}
              {socialLinks.github && (
                <a
                  href={socialLinks.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl bg-surface-secondary border border-border-subtle flex items-center justify-between text-xs text-ink hover:border-indigo/50 transition-colors group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-indigo font-bold font-mono">GITHUB</span>
                    <span className="truncate text-muted group-hover:text-ink">{socialLinks.github}</span>
                  </div>
                  <span className="text-muted group-hover:text-indigo shrink-0">&rarr;</span>
                </a>
              )}
              {socialLinks.linkedin && (
                <a
                  href={socialLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl bg-surface-secondary border border-border-subtle flex items-center justify-between text-xs text-ink hover:border-indigo/50 transition-colors group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-indigo font-bold font-mono">LINKEDIN</span>
                    <span className="truncate text-muted group-hover:text-ink">{socialLinks.linkedin}</span>
                  </div>
                  <span className="text-muted group-hover:text-indigo shrink-0">&rarr;</span>
                </a>
              )}
              {socialLinks.twitter && (
                <a
                  href={socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-xl bg-surface-secondary border border-border-subtle flex items-center justify-between text-xs text-ink hover:border-indigo/50 transition-colors group"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-indigo font-bold font-mono">TWITTER</span>
                    <span className="truncate text-muted group-hover:text-ink">{socialLinks.twitter}</span>
                  </div>
                  <span className="text-muted group-hover:text-indigo shrink-0">&rarr;</span>
                </a>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted italic font-sans">
              No portfolio or social links provided yet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default DeveloperSnapshotCard
