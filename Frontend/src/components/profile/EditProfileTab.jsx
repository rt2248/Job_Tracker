import React, { useState, useRef, useEffect, useCallback, useMemo } from "react"
import Input from "../shared/Input"
import Button from "../shared/Button"
import UserAvatar from "../shared/UserAvatar"
import AvatarPreviewModal from "./AvatarPreviewModal"
import AvatarCropModal from "./AvatarCropModal"
import { cn } from "../../utils/cn"
import { useToast } from "../../hooks/useToast"
import { getApiUrl } from "../../utils/config"
import { calculateProfileCompleteness } from "../../utils/profileCompleteness"
import { validateAvatarFile } from "../../utils/imageCrop"

const getInitials = (first, last, username) => {
  const f = first?.[0] || ""
  const l = last?.[0] || ""
  if (f || l) return (f + l).toUpperCase()
  return username?.slice(0, 2).toUpperCase() || "EV"
}

const EditProfileTab = ({
  initialData,
  onSaveProfile,
  onCancelEdits,
  isSaving,
  isDirty,
  setIsDirty,
  onAvatarUploaded,
}) => {
  const toast = useToast()

  // Form State
  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    headline: "",
    bio: "",
    location: "",
    avatarUrl: "",
    portfolioUrl: "",
    githubUrl: "",
    linkedinUrl: "",
    twitterUrl: "",
    skills: [],
    experience: [],
    isPublicProfile: false,
    visibilitySettings: {
      email: false,
      resume: false,
      location: false,
      headline: true,
      bio: true,
      avatar: true,
      portfolio: true,
      socialLinks: true,
      skills: true,
      experience: true,
    },
  })

  // Skill input state
  const [skillInput, setSkillInput] = useState("")

  // Avatar preview, crop & remove state
  const [cropSession, setCropSession] = useState(null)
  const [showAvatarPreview, setShowAvatarPreview] = useState(false)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [isRemovingAvatar, setIsRemovingAvatar] = useState(false)
  const avatarInputRef = useRef(null)
  const hasInitializedRef = useRef(false)
  const initialDataRef = useRef(initialData)
  initialDataRef.current = initialData

  // Initialize form from saved profile once, without wiping out unsaved changes on subsequent avatar updates
  useEffect(() => {
    if (!initialData) return

    if (!hasInitializedRef.current) {
      const social = initialData.socialLinks || {}
      const vis = initialData.visibilitySettings || {}

      setFormData({
        firstName: initialData.firstName || "",
        middleName: initialData.middleName || "",
        lastName: initialData.lastName || "",
        headline: initialData.headline || "",
        bio: initialData.bio || "",
        location: initialData.location || "",
        avatarUrl: initialData.avatarUrl || "",
        portfolioUrl: social.portfolio || initialData.portfolioUrl || "",
        githubUrl: social.github || initialData.githubUrl || "",
        linkedinUrl: social.linkedin || initialData.linkedinUrl || "",
        twitterUrl: social.twitter || initialData.twitterUrl || "",
        skills: Array.isArray(initialData.skills) ? [...initialData.skills] : [],
        experience: Array.isArray(initialData.experience)
          ? initialData.experience.map((e) => ({ ...e }))
          : [],
        isPublicProfile: Boolean(initialData.isPublicProfile),
        visibilitySettings: {
          email: Boolean(vis.email),
          resume: Boolean(vis.resume),
          location: Boolean(vis.location),
          headline: vis.headline !== undefined ? Boolean(vis.headline) : true,
          bio: vis.bio !== undefined ? Boolean(vis.bio) : true,
          avatar: vis.avatar !== undefined ? Boolean(vis.avatar) : true,
          portfolio: vis.portfolio !== undefined ? Boolean(vis.portfolio) : true,
          socialLinks: vis.socialLinks !== undefined ? Boolean(vis.socialLinks) : true,
          skills: vis.skills !== undefined ? Boolean(vis.skills) : true,
          experience: vis.experience !== undefined ? Boolean(vis.experience) : true,
        },
      })
      setIsDirty(false)
      hasInitializedRef.current = true
    } else {
      // If initialData.avatarUrl changed externally (e.g. upload/delete committed), synchronize avatarUrl only
      setFormData((prev) => {
        if (prev.avatarUrl !== (initialData.avatarUrl || "")) {
          return { ...prev, avatarUrl: initialData.avatarUrl || "" }
        }
        return prev
      })
    }
  }, [initialData, setIsDirty])

  // Check dirty state against initialData
  const checkDirtyState = useCallback((current) => {
    const baseData = initialDataRef.current
    if (!baseData) return false

    const initialSocial = baseData.socialLinks || {}
    const initialVis = baseData.visibilitySettings || {}

    const isDifferent =
      (current.firstName || "") !== (baseData.firstName || "") ||
      (current.middleName || "") !== (baseData.middleName || "") ||
      (current.lastName || "") !== (baseData.lastName || "") ||
      (current.headline || "") !== (baseData.headline || "") ||
      (current.bio || "") !== (baseData.bio || "") ||
      (current.location || "") !== (baseData.location || "") ||
      (current.portfolioUrl || "") !== (initialSocial.portfolio || baseData.portfolioUrl || "") ||
      (current.githubUrl || "") !== (initialSocial.github || baseData.githubUrl || "") ||
      (current.linkedinUrl || "") !== (initialSocial.linkedin || baseData.linkedinUrl || "") ||
      (current.twitterUrl || "") !== (initialSocial.twitter || baseData.twitterUrl || "") ||
      Boolean(current.isPublicProfile) !== Boolean(baseData.isPublicProfile) ||
      JSON.stringify(current.skills) !== JSON.stringify(baseData.skills || []) ||
      JSON.stringify(current.experience) !== JSON.stringify(baseData.experience || []) ||
      JSON.stringify(current.visibilitySettings) !== JSON.stringify({
        email: Boolean(initialVis.email),
        resume: Boolean(initialVis.resume),
        location: Boolean(initialVis.location),
        headline: initialVis.headline !== undefined ? Boolean(initialVis.headline) : true,
        bio: initialVis.bio !== undefined ? Boolean(initialVis.bio) : true,
        avatar: initialVis.avatar !== undefined ? Boolean(initialVis.avatar) : true,
        portfolio: initialVis.portfolio !== undefined ? Boolean(initialVis.portfolio) : true,
        socialLinks: initialVis.socialLinks !== undefined ? Boolean(initialVis.socialLinks) : true,
        skills: initialVis.skills !== undefined ? Boolean(initialVis.skills) : true,
        experience: initialVis.experience !== undefined ? Boolean(initialVis.experience) : true,
      })

    setIsDirty(isDifferent)
  }, [setIsDirty])

  // Clean up crop session object URL on change or unmount
  useEffect(() => {
    const activeUrl = cropSession?.url
    return () => {
      if (activeUrl) {
        URL.revokeObjectURL(activeUrl)
      }
    }
  }, [cropSession])

  // Handle avatar file selection: validate upfront and open Instagram/Discord-style crop workspace
  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0]
    if (avatarInputRef.current) avatarInputRef.current.value = ""
    if (!file) return

    const validation = validateAvatarFile(file)
    if (!validation.valid) {
      toast.error(validation.error)
      return
    }

    const previewUrl = URL.createObjectURL(file)
    setCropSession({
      url: previewUrl,
      fileName: file.name,
      preferredMimeType: file.type,
    })
  }

  const handleCancelCrop = useCallback(() => {
    if (isUploadingAvatar) return
    setCropSession(null)
  }, [isUploadingAvatar])

  // Upload cropped avatar file to existing backend endpoint
  const handleConfirmCropUpload = async (croppedFile) => {
    if (!croppedFile || isUploadingAvatar) return
    const token = localStorage.getItem("token")
    if (!token) {
      toast.error("Authentication required. Please sign in again.")
      return
    }

    try {
      setIsUploadingAvatar(true)
      const formDataUpload = new FormData()
      formDataUpload.append("avatar", croppedFile)

      const res = await fetch(getApiUrl("/api/profile/avatar"), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formDataUpload,
      })

      const data = await res.json().catch(() => ({}))

      if (res.ok) {
        toast.success(data.message || "Avatar uploaded successfully!")
        setFormData((prev) => ({ ...prev, avatarUrl: data.avatarUrl }))
        onAvatarUploaded?.(data.avatarUrl)
        setCropSession(null)
      } else {
        toast.error(data.message || "Failed to upload avatar.")
      }
    } catch (err) {
      console.error("Avatar upload error:", err)
      toast.error("An error occurred while uploading avatar. Please try again.")
    } finally {
      setIsUploadingAvatar(false)
    }
  }

  // Remove avatar from backend immediately (commits immediately like upload, preserving unsaved form inputs)
  const handleRemoveAvatar = async () => {
    const token = localStorage.getItem("token")
    if (!token) {
      toast.error("Authentication required. Please sign in again.")
      return
    }

    try {
      setIsRemovingAvatar(true)
      const res = await fetch(getApiUrl("/api/profile/avatar"), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await res.json().catch(() => ({}))

      if (res.ok) {
        toast.success(data.message || "Avatar removed successfully.")
        setFormData((prev) => ({ ...prev, avatarUrl: "" }))
        onAvatarUploaded?.(null)
      } else {
        toast.error(data.message || "Failed to remove avatar.")
      }
    } catch (err) {
      console.error("Avatar remove error:", err)
      toast.error("An error occurred while removing avatar. Please try again.")
    } finally {
      setIsRemovingAvatar(false)
    }
  }

  // Field change handler
  const handleFieldChange = (field, value) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value }
      checkDirtyState(next)
      return next
    })
  }

  // Visibility toggle handler
  const handleVisibilityToggle = (key) => {
    setFormData((prev) => {
      const next = {
        ...prev,
        visibilitySettings: {
          ...prev.visibilitySettings,
          [key]: !prev.visibilitySettings[key],
        },
      }
      checkDirtyState(next)
      return next
    })
  }

  // Skills handlers
  const handleAddSkill = () => {
    const trimmed = skillInput.trim()
    if (!trimmed) return

    if (formData.skills.includes(trimmed)) {
      toast.info("This skill is already in your list.")
      return
    }

    if (formData.skills.length >= 100) {
      toast.error("Maximum 100 skills supported.")
      return
    }

    const nextSkills = [...formData.skills, trimmed]
    setSkillInput("")
    handleFieldChange("skills", nextSkills)
  }

  const handleRemoveSkill = (skillToRemove) => {
    const nextSkills = formData.skills.filter((s) => s !== skillToRemove)
    handleFieldChange("skills", nextSkills)
  }

  // Experience handlers
  const handleAddExperience = () => {
    if (formData.experience.length >= 50) {
      toast.error("Maximum 50 experience entries supported.")
      return
    }

    const newExp = {
      company: "",
      title: "",
      location: "",
      startDate: "",
      endDate: "",
      current: false,
      description: "",
    }
    handleFieldChange("experience", [...formData.experience, newExp])
  }

  const handleUpdateExperience = (index, field, value) => {
    const updated = formData.experience.map((exp, i) => {
      if (i !== index) return exp
      const nextExp = { ...exp, [field]: value }
      if (field === "current" && value === true) {
        nextExp.endDate = ""
      }
      return nextExp
    })
    handleFieldChange("experience", updated)
  }

  const handleRemoveExperience = (index) => {
    const filtered = formData.experience.filter((_, i) => i !== index)
    handleFieldChange("experience", filtered)
  }

  // Form Submission
  const handleSubmit = (e) => {
    e.preventDefault()

    if (!formData.firstName.trim()) {
      toast.error("First name is required.")
      return
    }
    if (!formData.lastName.trim()) {
      toast.error("Last name is required.")
      return
    }

    // Prepare payload matching Stage 3 backend allowlist
    const payload = {
      firstName: formData.firstName.trim(),
      middleName: formData.middleName ? formData.middleName.trim() : null,
      lastName: formData.lastName.trim(),
      headline: formData.headline ? formData.headline.trim() : null,
      bio: formData.bio ? formData.bio.trim() : null,
      location: formData.location ? formData.location.trim() : null,
      portfolioUrl: formData.portfolioUrl ? formData.portfolioUrl.trim() : null,
      githubUrl: formData.githubUrl ? formData.githubUrl.trim() : null,
      linkedinUrl: formData.linkedinUrl ? formData.linkedinUrl.trim() : null,
      twitterUrl: formData.twitterUrl ? formData.twitterUrl.trim() : null,
      skills: formData.skills,
      experience: formData.experience,
      isPublicProfile: formData.isPublicProfile,
      visibilitySettings: formData.visibilitySettings,
    }

    onSaveProfile(payload)
  }

  const currentDisplayAvatar = formData.avatarUrl
    ? (formData.avatarUrl.startsWith("http") ? formData.avatarUrl : getApiUrl(formData.avatarUrl))
    : null
  const displayFullName = [formData.firstName, formData.lastName].filter(Boolean).join(" ") || "Your Profile"
  const avatarInitials = getInitials(formData.firstName, formData.lastName, initialData?.username)

  const completeness = useMemo(() => {
    return calculateProfileCompleteness(
      {
        ...initialData,
        ...formData,
      },
      initialData?.resume
    )
  }, [initialData, formData])

  return (
    <>
      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex flex-col gap-6">
      {/* Unsaved Changes Banner */}
      {isDirty && (
        <div className="p-3.5 rounded-xl bg-amber/10 border border-amber/50 flex items-center justify-between gap-3 text-xs sm:text-sm text-amber animate-fadeIn">
          <div className="flex items-center gap-2 font-medium">
            <span className="w-2 h-2 rounded-full bg-amber animate-pulse" />
            <span>You have unsaved changes in your profile.</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancelEdits}
              disabled={isSaving}
              className="text-amber border-amber/50 hover:bg-amber/15 text-xs sm:text-sm h-8 px-3"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSaving}
              className="text-xs sm:text-sm h-8 px-3.5 bg-amber hover:bg-amber-light text-neutral-950 font-semibold"
            >
              Save Now
            </Button>
          </div>
        </div>
      )}

      {/* Top Professional Identity Summary Panel */}
      <section className="bg-surface border border-border-primary p-6 sm:p-7 rounded-xl shadow-sm">
        <div className="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 min-w-0">
            <UserAvatar
              src={currentDisplayAvatar}
              alt={displayFullName}
              initials={avatarInitials}
              sizeClass="w-16 h-16 sm:w-20 sm:h-20"
              textSizeClass="text-2xl sm:text-3xl"
              onClick={() => setShowAvatarPreview(true)}
              ariaLabel="View profile picture"
              title="Click to view profile picture"
            />
            <div className="min-w-0">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-bold font-display text-ink tracking-tight truncate">
                  {[formData.firstName, formData.lastName].filter(Boolean).join(" ") || "Your Profile"}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-cyan/15 text-cyan border border-cyan/40">
                  {completeness.score}% Complete
                </span>
              </div>
              <p className="text-xs sm:text-sm font-medium text-ink-secondary mt-1 truncate max-w-lg">
                {formData.headline || "Add a professional headline below to highlight your specialty"}
              </p>
              {formData.location && (
                <p className="text-xs text-muted mt-1 flex items-center justify-center sm:justify-start gap-1.5">
                  <svg className="w-3.5 h-3.5 text-muted shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{formData.location}</span>
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSaving}
              className="text-xs sm:text-sm h-9 px-4 font-semibold"
            >
              Save Changes
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onCancelEdits}
              disabled={isSaving}
              className="text-xs sm:text-sm h-9 px-3.5"
            >
              Cancel
            </Button>
          </div>
        </div>

        {/* Live Completion Bar */}
        <div className="mt-4 pt-3.5 border-t border-border-subtle flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs font-sans">
            <span className="text-muted font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan" />
              Live Profile Completion
            </span>
            <span className="font-mono font-bold text-ink">
              {completeness.completedCount} of {completeness.totalCount} items complete
            </span>
          </div>
          <div className="w-full bg-surface-secondary rounded-full h-1.5 overflow-hidden border border-border-subtle">
            <div
              className="bg-cyan h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.max(4, completeness.score)}%` }}
            />
          </div>
        </div>
      </section>

      {/* 1. Avatar Section */}
      <section id="edit-section-avatar" className="bg-surface border border-border-primary p-6 sm:p-8 rounded-xl shadow-sm flex flex-col gap-5 scroll-mt-20">
        <div className="pb-3 border-b border-border-subtle">
          <h3 className="text-xl sm:text-2xl font-bold font-display text-ink tracking-tight">Profile Photo</h3>
          <p className="text-xs sm:text-sm text-muted font-sans mt-0.5">
            Supported formats: PNG, JPEG, WebP (Max 2MB).
          </p>
        </div>
        <div>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <UserAvatar
              src={currentDisplayAvatar}
              alt={displayFullName}
              initials={avatarInitials}
              sizeClass="w-24 h-24"
              textSizeClass="text-3xl"
              onClick={() => setShowAvatarPreview(true)}
              ariaLabel="View profile picture"
              title="Click to view profile picture"
            />

            <div className="flex flex-col gap-3 w-full sm:w-auto">
              <input
                ref={avatarInputRef}
                type="file"
                accept=".png,.jpg,.jpeg,.webp"
                onChange={handleAvatarSelect}
                className="hidden"
                id="avatar-upload-input"
              />

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={isUploadingAvatar || isRemovingAvatar}
                  className="h-9 text-xs sm:text-sm px-3.5"
                >
                  Change Avatar
                </Button>

                {formData.avatarUrl && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveAvatar}
                    disabled={isRemovingAvatar || isUploadingAvatar}
                    isLoading={isRemovingAvatar}
                    className="text-xs sm:text-sm text-red hover:text-red hover:bg-red/10 h-9 px-3"
                  >
                    Remove Photo
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Identity Information */}
      <section id="edit-section-personal" className="bg-surface border border-border-primary p-6 sm:p-8 rounded-xl shadow-sm flex flex-col gap-5 scroll-mt-20">
        <div className="pb-3 border-b border-border-subtle">
          <h3 className="text-xl sm:text-2xl font-bold font-display text-ink tracking-tight">Personal Information</h3>
          <p className="text-xs sm:text-sm text-muted font-sans mt-0.5">
            Your legal or display name associated with your developer profile.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="First Name *"
            value={formData.firstName}
            onChange={(e) => handleFieldChange("firstName", e.target.value)}
            placeholder="e.g. Jane"
            required
          />
          <Input
            label="Middle Name"
            value={formData.middleName}
            onChange={(e) => handleFieldChange("middleName", e.target.value)}
            placeholder="Optional"
          />
          <Input
            label="Last Name *"
            value={formData.lastName}
            onChange={(e) => handleFieldChange("lastName", e.target.value)}
            placeholder="e.g. Doe"
            required
          />
        </div>
      </section>

      {/* 3. Professional Profile */}
      <section id="edit-section-profile" className="bg-surface border border-border-primary p-6 sm:p-8 rounded-xl shadow-sm flex flex-col gap-5 scroll-mt-20">
        <div className="pb-3 border-b border-border-subtle">
          <h3 className="text-xl sm:text-2xl font-bold font-display text-ink tracking-tight">Professional Profile</h3>
          <p className="text-xs sm:text-sm text-muted font-sans mt-0.5">
            Headline, specialization, and developer background.
          </p>
        </div>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="headline-input" className="text-xs sm:text-sm font-medium text-ink-secondary">Headline</label>
              <span className="text-xs font-mono text-muted">
                {formData.headline.length}/150
              </span>
            </div>
            <Input
              id="headline-input"
              value={formData.headline}
              onChange={(e) => handleFieldChange("headline", e.target.value)}
              placeholder="e.g. Senior Full Stack Engineer | React, Node.js & Distributed Systems"
              maxLength={150}
            />
          </div>

          <div>
            <label htmlFor="location-input" className="text-xs sm:text-sm font-medium text-ink-secondary block mb-1.5">Location</label>
            <Input
              id="location-input"
              value={formData.location}
              onChange={(e) => handleFieldChange("location", e.target.value)}
              placeholder="e.g. San Francisco, CA or Remote"
              maxLength={150}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="bio-textarea" className="text-xs sm:text-sm font-medium text-ink-secondary">Bio Summary</label>
              <span className="text-xs font-mono text-muted">
                {formData.bio.length}/2000
              </span>
            </div>
            <textarea
              id="bio-textarea"
              value={formData.bio}
              onChange={(e) => handleFieldChange("bio", e.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="Write a brief overview of your background, technical interests, and projects..."
              className="w-full px-3 py-2 text-sm bg-surface-secondary text-ink placeholder:text-muted rounded-lg border border-border-primary focus:border-cyan focus:ring-2 focus:ring-cyan/30 transition-all outline-none resize-y"
            />
          </div>
        </div>
      </section>

      {/* 4. Technical Skills */}
      <section id="edit-section-skills" className="bg-surface border border-border-primary p-6 sm:p-8 rounded-xl shadow-sm flex flex-col gap-5 scroll-mt-20">
        <div className="pb-3 border-b border-border-subtle">
          <h3 className="text-xl sm:text-2xl font-bold font-display text-ink tracking-tight">Technical Skills</h3>
          <p className="text-xs sm:text-sm text-muted font-sans mt-0.5">
            Add key technologies, languages, and frameworks in your toolbelt.
          </p>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Input
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  handleAddSkill()
                }
              }}
              placeholder="Type a skill (e.g. TypeScript, React, Docker)..."
              className="flex-1"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={handleAddSkill}
              className="shrink-0 text-xs sm:text-sm h-9 px-3.5"
            >
              Add Skill
            </Button>
          </div>

          {formData.skills.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {formData.skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs sm:text-sm font-medium bg-surface-secondary text-ink border border-border-subtle"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="text-muted hover:text-ink cursor-pointer transition-colors p-0.5"
                    title={`Remove ${skill}`}
                    aria-label={`Remove ${skill}`}
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted italic font-sans">No skills added yet.</p>
          )}
        </div>
      </section>

      {/* 5. Experience Entries */}
      <section id="edit-section-experience" className="bg-surface border border-border-subtle p-6 sm:p-7 rounded-xl shadow-xs scroll-mt-20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-border-subtle">
          <div>
            <h3 className="text-lg sm:text-xl font-display font-bold text-ink">Professional Experience</h3>
            <p className="text-sm text-muted font-sans mt-0.5">
              Add your relevant work history and technical achievements.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddExperience}
            className="shrink-0 text-xs sm:text-sm self-start sm:self-auto"
          >
            + Add Position
          </Button>
        </div>

        <div className="space-y-4">
          {formData.experience.length === 0 ? (
            <p className="text-sm text-muted italic font-sans py-4 text-center">
              No experience items yet. Click &quot;+ Add Position&quot; to list your experience.
            </p>
          ) : (
            formData.experience.map((exp, idx) => (
              <div
                key={`exp-card-${idx}`}
                className="p-5 rounded-lg bg-surface-secondary/40 border border-border-subtle relative space-y-4"
              >
                <div className="flex items-center justify-between pb-2 border-b border-border-subtle/60">
                  <span className="text-xs sm:text-sm font-mono font-semibold text-ink">
                    Position #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveExperience(idx)}
                    className="text-xs sm:text-sm text-red hover:text-red/80 font-medium cursor-pointer transition-colors"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Company Name *"
                    value={exp.company}
                    onChange={(e) => handleUpdateExperience(idx, "company", e.target.value)}
                    placeholder="e.g. Acme Tech"
                    required
                  />
                  <Input
                    label="Job Title *"
                    value={exp.title}
                    onChange={(e) => handleUpdateExperience(idx, "title", e.target.value)}
                    placeholder="e.g. Staff Software Engineer"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="Location"
                    value={exp.location || ""}
                    onChange={(e) => handleUpdateExperience(idx, "location", e.target.value)}
                    placeholder="e.g. New York, NY"
                  />
                  <Input
                    label="Start Date"
                    value={exp.startDate || ""}
                    onChange={(e) => handleUpdateExperience(idx, "startDate", e.target.value)}
                    placeholder="YYYY-MM (e.g. 2021-06)"
                  />
                  <Input
                    label="End Date"
                    value={exp.endDate || ""}
                    disabled={exp.current}
                    onChange={(e) => handleUpdateExperience(idx, "endDate", e.target.value)}
                    placeholder={exp.current ? "Present" : "YYYY-MM"}
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id={`current-role-${idx}`}
                    checked={Boolean(exp.current)}
                    onChange={(e) => handleUpdateExperience(idx, "current", e.target.checked)}
                    className="rounded border-border-primary text-cyan focus:ring-cyan/30 cursor-pointer"
                  />
                  <label htmlFor={`current-role-${idx}`} className="text-xs sm:text-sm text-ink-secondary cursor-pointer select-none">
                    I currently work in this role
                  </label>
                </div>

                <div>
                  <label htmlFor={`exp-desc-${idx}`} className="text-xs sm:text-sm font-medium text-ink-secondary block mb-1.5 font-sans">
                    Role Description & Accomplishments
                  </label>
                  <textarea
                    id={`exp-desc-${idx}`}
                    value={exp.description || ""}
                    onChange={(e) => handleUpdateExperience(idx, "description", e.target.value)}
                    rows={3}
                    maxLength={2000}
                    placeholder="Summary of responsibilities, technologies utilized, and impact..."
                    className="w-full px-3 py-2 text-sm bg-surface-secondary text-ink placeholder:text-muted rounded-lg border border-border-primary focus:border-cyan focus:ring-2 focus:ring-cyan/30 transition-all outline-none font-sans"
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* 6. Portfolio & Social Links */}
      <section id="edit-section-links" className="bg-surface border border-border-subtle p-6 sm:p-7 rounded-xl shadow-xs scroll-mt-20">
        <div className="mb-6 pb-4 border-b border-border-subtle">
          <h3 className="text-lg sm:text-xl font-display font-bold text-ink">Portfolio & Social Links</h3>
          <p className="text-sm text-muted font-sans mt-0.5">
            Connect your personal portfolio, GitHub, LinkedIn, and social profiles.
          </p>
        </div>
        <div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Portfolio URL"
              value={formData.portfolioUrl}
              onChange={(e) => handleFieldChange("portfolioUrl", e.target.value)}
              placeholder="https://yourportfolio.dev"
            />
            <Input
              label="GitHub Profile URL"
              value={formData.githubUrl}
              onChange={(e) => handleFieldChange("githubUrl", e.target.value)}
              placeholder="https://github.com/yourusername"
            />
            <Input
              label="LinkedIn URL"
              value={formData.linkedinUrl}
              onChange={(e) => handleFieldChange("linkedinUrl", e.target.value)}
              placeholder="https://linkedin.com/in/yourusername"
            />
            <Input
              label="Twitter / X Profile URL"
              value={formData.twitterUrl}
              onChange={(e) => handleFieldChange("twitterUrl", e.target.value)}
              placeholder="https://twitter.com/yourhandle"
            />
          </div>
        </div>
      </section>

      {/* 7. Public Profile & Granular Visibility Settings */}
      <section id="edit-section-privacy" className="bg-surface border border-border-subtle p-6 sm:p-7 rounded-xl shadow-xs scroll-mt-20">
        <div className="mb-6 pb-4 border-b border-border-subtle">
          <h3 className="text-lg sm:text-xl font-display font-bold text-ink">Public Profile & Privacy Controls</h3>
          <p className="text-sm text-muted font-sans mt-0.5">
            Configure how your profile appears to public visitors and potential employers.
          </p>
        </div>
        <div className="space-y-6">
          {/* Master Public Toggle */}
          <div className="p-4 sm:p-5 rounded-lg bg-surface-secondary/40 border border-border-subtle flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-ink font-display">Public Profile Mode</span>
                <span className="text-border-primary/80">·</span>
                <span className={cn(
                  "text-xs sm:text-sm font-sans font-medium flex items-center gap-1.5",
                  formData.isPublicProfile ? "text-cyan" : "text-muted"
                )}>
                  <span className={cn("w-1.5 h-1.5 rounded-full", formData.isPublicProfile ? "bg-cyan" : "bg-muted")} />
                  {formData.isPublicProfile ? "Enabled" : "Disabled"}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-muted font-sans mt-1">
                When enabled, anonymous visitors can view your developer profile at your public link.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleFieldChange("isPublicProfile", !formData.isPublicProfile)}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                formData.isPublicProfile ? "bg-cyan" : "bg-surface-secondary border border-border-primary"
              }`}
              role="switch"
              aria-checked={formData.isPublicProfile}
              aria-label="Toggle Public Profile Mode"
            >
              <span
                className={`w-4 h-4 rounded-full bg-white shadow-xs block transition-transform absolute top-1 ${
                  formData.isPublicProfile ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>

          {/* Granular Visibility Settings (active when public) */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-muted tracking-wider uppercase font-mono">
              Granular Field Visibility {formData.isPublicProfile ? "(Active)" : "(Applied when public)"}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              {[
                { key: "headline", label: "Headline", desc: "Show professional title/headline" },
                { key: "bio", label: "Bio Summary", desc: "Show developer background text" },
                { key: "avatar", label: "Avatar Photo", desc: "Show profile image to public visitors" },
                { key: "location", label: "Location", desc: "Show physical city/country (Privacy-First default: Off)" },
                { key: "portfolio", label: "Portfolio Link", desc: "Show portfolio website URL" },
                { key: "socialLinks", label: "Social Handles", desc: "Show GitHub, LinkedIn, Twitter" },
                { key: "skills", label: "Technical Skills", desc: "Show skill badges list" },
                { key: "experience", label: "Experience Timeline", desc: "Show career history entries" },
                { key: "email", label: "Email Address", desc: "Show direct email (Privacy-First default: Off)" },
                { key: "resume", label: "Resume Attachment", desc: "Show resume metadata (Privacy-First default: Off)" },
              ].map(({ key, label, desc }) => {
                const isChecked = Boolean(formData.visibilitySettings[key])
                return (
                  <div
                    key={key}
                    onClick={() => handleVisibilityToggle(key)}
                    className="p-3.5 rounded-lg bg-surface-secondary/30 border border-border-subtle flex items-center justify-between gap-3 cursor-pointer hover:bg-surface-secondary/60 transition-colors"
                  >
                    <div>
                      <span className="font-semibold text-sm text-ink block font-sans">{label}</span>
                      <span className="text-xs text-muted block mt-0.5 font-sans">{desc}</span>
                    </div>
                    <button
                      type="button"
                      className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                        isChecked ? "bg-cyan" : "bg-surface-secondary border border-border-primary"
                      }`}
                      role="switch"
                      aria-checked={isChecked}
                      aria-label={`Toggle ${label} visibility`}
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded-full bg-white shadow-xs block transition-transform absolute top-0.5 ${
                          isChecked ? "left-5" : "left-0.5"
                        }`}
                      />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Action Bar */}
      <div className="sticky bottom-4 z-20 p-4 rounded-xl bg-surface/95 backdrop-blur-md border border-border-primary shadow-lg flex items-center justify-between gap-4">
        <div className="text-xs sm:text-sm font-sans">
          {isDirty ? (
            <span className="text-amber font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber animate-pulse" />
              Unsaved changes pending
            </span>
          ) : (
            <span className="text-muted">All profile changes saved.</span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onCancelEdits}
            disabled={isSaving}
            className="text-sm font-medium px-4 py-2"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSaving}
            className="text-sm font-semibold px-5 py-2"
          >
            Save Changes
          </Button>
        </div>
      </div>
    </form>

    <AvatarPreviewModal
      isOpen={showAvatarPreview}
      onClose={() => setShowAvatarPreview(false)}
      src={currentDisplayAvatar}
      alt={displayFullName}
      initials={avatarInitials}
      displayName={displayFullName}
      username={initialData?.username}
    />

    <AvatarCropModal
      isOpen={Boolean(cropSession)}
      imageUrl={cropSession?.url}
      fileName={cropSession?.fileName}
      preferredMimeType={cropSession?.preferredMimeType}
      isUploading={isUploadingAvatar}
      onCancel={handleCancelCrop}
      onConfirm={handleConfirmCropUpload}
    />
  </>
  )
}

export default EditProfileTab
