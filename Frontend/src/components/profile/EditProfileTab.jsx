import React, { useState, useRef, useEffect, useCallback } from "react"
import Card, { CardHeader, CardTitle, CardContent } from "../shared/Card"
import Input from "../shared/Input"
import Button from "../shared/Button"
import Badge from "../shared/Badge"
import { useToast } from "../../hooks/useToast"
import { getApiUrl } from "../../utils/config"

const MAX_AVATAR_SIZE = 2 * 1024 * 1024 // 2 MB

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

  // Avatar upload & remove state
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)
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

  // Clean up avatar preview URL on unmount
  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview)
      }
    }
  }, [avatarPreview])

  // Handle avatar file selection
  const handleAvatarSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase()
    if (![".png", ".jpg", ".jpeg", ".webp"].includes(ext)) {
      toast.error("Only PNG, JPEG, and WebP images are permitted for avatars. SVG and GIF are not allowed.")
      if (avatarInputRef.current) avatarInputRef.current.value = ""
      return
    }

    if (file.size > MAX_AVATAR_SIZE) {
      toast.error("Avatar image exceeds the 2MB size limit.")
      if (avatarInputRef.current) avatarInputRef.current.value = ""
      return
    }

    if (file.size === 0) {
      toast.error("Selected file is empty.")
      if (avatarInputRef.current) avatarInputRef.current.value = ""
      return
    }

    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview)
    }

    const previewUrl = URL.createObjectURL(file)
    setAvatarFile(file)
    setAvatarPreview(previewUrl)
  }

  const handleCancelAvatarPreview = () => {
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview)
    }
    setAvatarFile(null)
    setAvatarPreview(null)
    if (avatarInputRef.current) avatarInputRef.current.value = ""
  }

  // Upload avatar to backend
  const handleUploadAvatar = async () => {
    if (!avatarFile) return
    const token = localStorage.getItem("token")
    if (!token) {
      toast.error("Authentication required. Please sign in again.")
      return
    }

    try {
      setIsUploadingAvatar(true)
      const formDataUpload = new FormData()
      formDataUpload.append("avatar", avatarFile)

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
        handleCancelAvatarPreview()
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

  const currentDisplayAvatar = avatarPreview || (formData.avatarUrl ? (formData.avatarUrl.startsWith("http") ? formData.avatarUrl : getApiUrl(formData.avatarUrl)) : null)

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex flex-col gap-6">
      {/* Unsaved Changes Banner */}
      {isDirty && (
        <div className="p-3.5 rounded-xl bg-amber/10 border border-amber/30 flex items-center justify-between gap-3 text-xs text-amber animate-fadeIn">
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
              className="text-amber border-amber/40 hover:bg-amber/15 text-xs h-7 px-2.5"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSaving}
              className="text-xs h-7 px-3 bg-amber hover:bg-amber-light text-neutral-950 font-semibold"
            >
              Save Now
            </Button>
          </div>
        </div>
      )}

      {/* 1. Avatar Section */}
      <Card className="bg-surface border-border-primary p-6 rounded-2xl shadow-sm">
        <CardHeader className="mb-4">
          <CardTitle className="text-lg font-display">Profile Picture</CardTitle>
          <p className="text-xs text-muted font-sans">
            Supported formats: PNG, JPEG, WebP (Max 2MB). SVG and GIF formats are not allowed.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-2xl bg-surface-secondary border border-border-primary flex items-center justify-center text-ink text-3xl font-display font-semibold select-none shadow-sm overflow-hidden shrink-0 relative">
              {currentDisplayAvatar ? (
                <img
                  src={currentDisplayAvatar}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{getInitials(formData.firstName, formData.lastName, initialData?.username)}</span>
              )}
            </div>

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
                {!avatarFile ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                  >
                    Change Avatar
                  </Button>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      isLoading={isUploadingAvatar}
                      onClick={handleUploadAvatar}
                    >
                      Save Picture
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={isUploadingAvatar}
                      onClick={handleCancelAvatarPreview}
                    >
                      Cancel
                    </Button>
                  </>
                )}

                {formData.avatarUrl && !avatarFile && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveAvatar}
                    disabled={isRemovingAvatar || isUploadingAvatar}
                    isLoading={isRemovingAvatar}
                    className="text-xs text-red hover:text-red hover:bg-red/10"
                  >
                    Remove Photo
                  </Button>
                )}
              </div>

              {avatarFile && (
                <p className="text-[11px] text-muted font-mono">
                  Selected: {avatarFile.name} ({(avatarFile.size / 1024).toFixed(1)} KB) &ndash; Click &quot;Save Picture&quot; to apply.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Identity Information */}
      <Card className="bg-surface border-border-primary p-6 rounded-2xl shadow-sm">
        <CardHeader className="mb-4">
          <CardTitle className="text-lg font-display">Personal Information</CardTitle>
          <p className="text-xs text-muted font-sans">
            Your legal or display name associated with your Job Tracker developer account.
          </p>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* 3. Professional Headline & Bio */}
      <Card className="bg-surface border-border-primary p-6 rounded-2xl shadow-sm">
        <CardHeader className="mb-4">
          <CardTitle className="text-lg font-display">Professional Profile</CardTitle>
          <p className="text-xs text-muted font-sans">
            Summarize your role, specialization, and engineering journey.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="headline-input" className="text-xs font-medium text-ink-secondary">Headline</label>
              <span className="text-[10px] font-mono text-muted">
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
            <label htmlFor="location-input" className="text-xs font-medium text-ink-secondary block mb-1.5">Location</label>
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
              <label htmlFor="bio-textarea" className="text-xs font-medium text-ink-secondary">Bio</label>
              <span className="text-[10px] font-mono text-muted">
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
              className="w-full px-3 py-2 text-sm bg-surface-secondary text-ink placeholder:text-muted rounded-lg border border-border-primary focus:border-indigo focus:ring-2 focus:ring-indigo/30 transition-all outline-none resize-y"
            />
          </div>
        </CardContent>
      </Card>

      {/* 4. Technical Skills */}
      <Card className="bg-surface border-border-primary p-6 rounded-2xl shadow-sm">
        <CardHeader className="mb-4">
          <CardTitle className="text-lg font-display">Technical Skills</CardTitle>
          <p className="text-xs text-muted font-sans">
            Add key technologies, languages, and frameworks in your toolbelt.
          </p>
        </CardHeader>
        <CardContent>
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
              className="shrink-0"
            >
              Add Skill
            </Button>
          </div>

          {formData.skills.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-2">
              {formData.skills.map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-surface-secondary text-ink border border-border-subtle"
                >
                  <span>{skill}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(skill)}
                    className="text-muted hover:text-ink cursor-pointer transition-colors"
                    title={`Remove ${skill}`}
                    aria-label={`Remove ${skill}`}
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted italic">No skills added yet.</p>
          )}
        </CardContent>
      </Card>

      {/* 5. Experience Entries */}
      <Card className="bg-surface border-border-primary p-6 rounded-2xl shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between gap-3 mb-4">
          <div>
            <CardTitle className="text-lg font-display">Professional Experience</CardTitle>
            <p className="text-xs text-muted font-sans">
              Add your relevant work history and technical achievements.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddExperience}
            className="shrink-0"
          >
            + Add Position
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.experience.length === 0 ? (
            <p className="text-xs text-muted italic">
              No experience items yet. Click &quot;+ Add Position&quot; to list your experience.
            </p>
          ) : (
            formData.experience.map((exp, idx) => (
              <div
                key={`exp-card-${idx}`}
                className="p-4 rounded-xl bg-surface-secondary/40 border border-border-subtle relative space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold text-muted">
                    Position #{idx + 1}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveExperience(idx)}
                    className="text-xs text-red hover:underline cursor-pointer"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                    className="rounded border-border-primary text-indigo focus:ring-indigo/30 cursor-pointer"
                  />
                  <label htmlFor={`current-role-${idx}`} className="text-xs text-ink-secondary cursor-pointer">
                    I currently work in this role
                  </label>
                </div>

                <div>
                  <label htmlFor={`exp-desc-${idx}`} className="text-xs font-medium text-ink-secondary block mb-1">
                    Role Description & Accomplishments
                  </label>
                  <textarea
                    id={`exp-desc-${idx}`}
                    value={exp.description || ""}
                    onChange={(e) => handleUpdateExperience(idx, "description", e.target.value)}
                    rows={2}
                    maxLength={2000}
                    placeholder="Summary of responsibilities, technologies utilized, and impact..."
                    className="w-full px-3 py-2 text-xs bg-surface-secondary text-ink placeholder:text-muted rounded-lg border border-border-primary focus:border-indigo focus:ring-2 focus:ring-indigo/30 transition-all outline-none"
                  />
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* 6. Portfolio & Social Links */}
      <Card className="bg-surface border-border-primary p-6 rounded-2xl shadow-sm">
        <CardHeader className="mb-4">
          <CardTitle className="text-lg font-display">Portfolio & Social Links</CardTitle>
          <p className="text-xs text-muted font-sans">
            Connect your personal portfolio, GitHub, LinkedIn, and social profiles.
          </p>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      {/* 7. Public Profile & Granular Visibility Settings */}
      <Card className="bg-surface border-border-primary p-6 rounded-2xl shadow-sm">
        <CardHeader className="mb-4">
          <CardTitle className="text-lg font-display">Public Profile & Privacy Controls</CardTitle>
          <p className="text-xs text-muted font-sans">
            Configure how your profile appears to public visitors and potential employers.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Master Public Toggle */}
          <div className="p-4 rounded-xl bg-surface-secondary/50 border border-border-subtle flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-ink font-display">Public Profile Mode</span>
                <Badge variant={formData.isPublicProfile ? "indigo" : "default"}>
                  {formData.isPublicProfile ? "Public Enabled" : "Private (Disabled)"}
                </Badge>
              </div>
              <p className="text-xs text-muted font-sans mt-0.5">
                When enabled, anonymous visitors can view your developer profile at your public link.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleFieldChange("isPublicProfile", !formData.isPublicProfile)}
              className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                formData.isPublicProfile ? "bg-indigo" : "bg-surface-secondary border border-border-primary"
              }`}
              role="switch"
              aria-checked={formData.isPublicProfile}
              aria-label="Toggle Public Profile Mode"
            >
              <span
                className={`w-4 h-4 rounded-full bg-white shadow-sm block transition-transform absolute top-1 ${
                  formData.isPublicProfile ? "left-7" : "left-1"
                }`}
              />
            </button>
          </div>

          {/* Granular Visibility Settings (active when public) */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold text-ink-secondary tracking-wide uppercase font-mono">
              Granular Field Visibility {formData.isPublicProfile ? "(Active)" : "(Applied when public)"}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
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
                    className="p-3 rounded-xl bg-surface-secondary/30 border border-border-subtle flex items-center justify-between gap-3 cursor-pointer hover:bg-surface-secondary/60 transition-colors"
                  >
                    <div>
                      <span className="font-medium text-ink block">{label}</span>
                      <span className="text-[11px] text-muted block mt-0.5">{desc}</span>
                    </div>
                    <button
                      type="button"
                      className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer shrink-0 ${
                        isChecked ? "bg-indigo" : "bg-surface-secondary border border-border-primary"
                      }`}
                      role="switch"
                      aria-checked={isChecked}
                      aria-label={`Toggle ${label} visibility`}
                    >
                      <span
                        className={`w-3.5 h-3.5 rounded-full bg-white shadow-sm block transition-transform absolute top-0.5 ${
                          isChecked ? "left-5" : "left-0.5"
                        }`}
                      />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Bar */}
      <div className="sticky bottom-4 z-20 p-4 rounded-2xl bg-surface/95 backdrop-blur-md border border-border-primary shadow-xl flex items-center justify-between gap-4">
        <div className="text-xs text-muted font-sans">
          {isDirty ? (
            <span className="text-amber font-medium flex items-center gap-1.5">
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
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSaving}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </form>
  )
}

export default EditProfileTab
