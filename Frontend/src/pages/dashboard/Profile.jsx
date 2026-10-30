import React, { useState, useEffect, useRef, useCallback } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import LogoutModal from "../../components/dashboard_page/LogoutModal"
import DeleteResumeModal from "../../components/profile/DeleteResumeModal"
import UnsavedChangesModal from "../../components/profile/UnsavedChangesModal"
import ProfileOverviewTab from "../../components/profile/ProfileOverviewTab"
import EditProfileTab from "../../components/profile/EditProfileTab"
import AccountSecurityTab from "../../components/profile/AccountSecurityTab"
import { useSettings } from "../../hooks/useSettings"
import { useToast } from "../../hooks/useToast"
import { clearPromptStorageOnLogout } from "../../utils/promptStorage"
import { getApiUrl } from "../../utils/config"
import { cn } from "../../utils/cn"

const PROFILE_NAV_ITEMS = [
  {
    id: "overview",
    label: "Overview",
    icon: (
      <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    id: "edit",
    label: "Edit Profile",
    icon: (
      <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
  {
    id: "account",
    label: "Account & Security",
    icon: (
      <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
]

const TAB_ORDER = {
  overview: 0,
  edit: 1,
  account: 2,
}

const ProfileHeader = () => (
  <div className="pb-4 border-b border-border-subtle">
    <h1 className="font-display text-2xl sm:text-3xl text-ink font-bold tracking-tight">
      Profile & Account
    </h1>
    <p className="text-muted text-xs sm:text-sm mt-1 font-sans">
      Manage your developer identity, professional portfolio, resume, and security preferences.
    </p>
  </div>
)

const Profile = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const toast = useToast()

  // Workspace Navigation & Unsaved Changes
  const tabFromUrl = searchParams.get("tab")
  const initialTab = ["overview", "edit", "account"].includes(tabFromUrl) ? tabFromUrl : "overview"
  const [activeTab, setActiveTab] = useState(initialTab)
  const [slideDirection, setSlideDirection] = useState("forward")
  const [isDirty, setIsDirty] = useState(false)
  const [pendingTab, setPendingTab] = useState(null)
  const [showUnsavedModal, setShowUnsavedModal] = useState(false)

  // Modals state
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [showDeleteResumeModal, setShowDeleteResumeModal] = useState(false)
  const { returnPromptsEnabled, setReturnPromptsEnabled } = useSettings()

  // User profile state
  const [userData, setUserData] = useState(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)
  const [isSavingProfile, setIsSavingProfile] = useState(false)

  // Resume section state
  const [resume, setResume] = useState(null)
  const [isLoadingResume, setIsLoadingResume] = useState(true)
  const [isUploadingResume, setIsUploadingResume] = useState(false)
  const [isViewingResume, setIsViewingResume] = useState(false)
  const [isDeletingResume, setIsDeletingResume] = useState(false)
  const [selectedResumeFile, setSelectedResumeFile] = useState(null)
  const resumeFileInputRef = useRef(null)

  // 1. Fetch authenticated user profile data
  const fetchProfileData = useCallback(async () => {
    const token = localStorage.getItem("token")
    if (!token) {
      setIsLoadingUser(false)
      return
    }

    try {
      setIsLoadingUser(true)
      const res = await fetch(getApiUrl("/api/profile/me"), {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const data = await res.json()
        setUserData(data.profile)
        if (data.profile?.resume) {
          setResume(data.profile.resume)
        }
      } else {
        // Fallback to /api/auth/me if needed
        const authRes = await fetch(getApiUrl("/api/auth/me"), {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (authRes.ok) {
          const authData = await authRes.json()
          setUserData(authData.user)
        }
      }
    } catch (err) {
      console.error("Error fetching user profile data:", err)
    } finally {
      setIsLoadingUser(false)
    }
  }, [])

  // 2. Fetch authenticated user's resume metadata
  const fetchResume = useCallback(async () => {
    const token = localStorage.getItem("token")
    if (!token) {
      setIsLoadingResume(false)
      return
    }

    try {
      setIsLoadingResume(true)
      const res = await fetch(getApiUrl("/api/resume"), {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setResume(data.resume || null)
      } else {
        console.error("Failed to fetch resume metadata")
      }
    } catch (err) {
      console.error("Error fetching resume:", err)
    } finally {
      setIsLoadingResume(false)
    }
  }, [])

  useEffect(() => {
    fetchProfileData()
    fetchResume()
  }, [fetchProfileData, fetchResume])

  // Sync tab with URL query parameter
  useEffect(() => {
    if (tabFromUrl && ["overview", "edit", "account"].includes(tabFromUrl) && tabFromUrl !== activeTab) {
      if (activeTab === "edit" && isDirty) {
        setPendingTab(tabFromUrl)
        setShowUnsavedModal(true)
        return
      }
      const nextOrder = TAB_ORDER[tabFromUrl] ?? 0
      const currentOrder = TAB_ORDER[activeTab] ?? 0
      setSlideDirection(nextOrder >= currentOrder ? "forward" : "backward")
      setActiveTab(tabFromUrl)
    }
  }, [tabFromUrl, activeTab, isDirty])

  // Tab change with dirty state guard
  const handleTabChange = (targetTab) => {
    if (activeTab === targetTab) return

    if (activeTab === "edit" && isDirty) {
      setPendingTab(targetTab)
      setShowUnsavedModal(true)
      return
    }

    const nextOrder = TAB_ORDER[targetTab] ?? 0
    const currentOrder = TAB_ORDER[activeTab] ?? 0
    setSlideDirection(nextOrder >= currentOrder ? "forward" : "backward")
    setActiveTab(targetTab)
    setSearchParams({ tab: targetTab }, { replace: true })
  }

  const handleConfirmDiscard = () => {
    setIsDirty(false)
    setShowUnsavedModal(false)
    const target = pendingTab || "overview"
    const nextOrder = TAB_ORDER[target] ?? 0
    const currentOrder = TAB_ORDER[activeTab] ?? 0
    setSlideDirection(nextOrder >= currentOrder ? "forward" : "backward")
    setActiveTab(target)
    setSearchParams({ tab: target }, { replace: true })
    setPendingTab(null)
  }

  const handleCancelDiscard = () => {
    setPendingTab(null)
    setShowUnsavedModal(false)
    setSearchParams({ tab: activeTab }, { replace: true })
  }

  // Save profile changes (PUT /api/profile/me)
  const handleSaveProfile = async (payload) => {
    const token = localStorage.getItem("token")
    if (!token) {
      toast.error("Authentication required. Please sign in again.")
      return
    }

    try {
      setIsSavingProfile(true)
      const res = await fetch(getApiUrl("/api/profile/me"), {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      const data = await res.json().catch(() => ({}))

      if (res.ok) {
        toast.success(data.message || "Profile updated successfully!")
        setUserData(data.profile)
        if (data.profile?.resume) {
          setResume(data.profile.resume)
        }
        setIsDirty(false)
        const nextOrder = TAB_ORDER["overview"] ?? 0
        const currentOrder = TAB_ORDER[activeTab] ?? 0
        setSlideDirection(nextOrder >= currentOrder ? "forward" : "backward")
        setActiveTab("overview")
      } else {
        toast.error(data.message || "Failed to update profile.")
      }
    } catch (err) {
      console.error("Error updating profile:", err)
      toast.error("An error occurred while saving your profile. Please try again.")
    } finally {
      setIsSavingProfile(false)
    }
  }

  const handleCancelEdits = () => {
    if (isDirty) {
      setPendingTab("overview")
      setShowUnsavedModal(true)
    } else {
      setActiveTab("overview")
    }
  }

  // Resume file selection & upload handlers
  const handleResumeFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const isPdf = file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf"
    if (!isPdf) {
      toast.error("Only PDF files are supported.")
      if (resumeFileInputRef.current) resumeFileInputRef.current.value = ""
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size exceeds the 5 MB limit.")
      if (resumeFileInputRef.current) resumeFileInputRef.current.value = ""
      return
    }

    if (file.size === 0) {
      toast.error("Selected file is empty.")
      if (resumeFileInputRef.current) resumeFileInputRef.current.value = ""
      return
    }

    setSelectedResumeFile(file)
  }

  const handleCancelSelectedResume = () => {
    setSelectedResumeFile(null)
    if (resumeFileInputRef.current) resumeFileInputRef.current.value = ""
  }

  const handleUploadResume = async () => {
    if (!selectedResumeFile) return
    const token = localStorage.getItem("token")
    if (!token) {
      toast.error("Authentication required. Please sign in again.")
      return
    }

    try {
      setIsUploadingResume(true)
      const formData = new FormData()
      formData.append("resume", selectedResumeFile)

      const res = await fetch(getApiUrl("/api/resume"), {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      })

      const data = await res.json().catch(() => ({}))

      if (res.ok) {
        toast.success(data.message || (resume ? "Resume replaced successfully" : "Resume uploaded successfully"))
        setResume(data.resume)
        setSelectedResumeFile(null)
        if (resumeFileInputRef.current) resumeFileInputRef.current.value = ""
      } else {
        toast.error(data.message || "Failed to upload resume.")
      }
    } catch (err) {
      console.error("Upload error:", err)
      toast.error("An error occurred while uploading. Please try again.")
    } finally {
      setIsUploadingResume(false)
    }
  }

  const handleViewResume = async () => {
    const token = localStorage.getItem("token")
    if (!token) {
      toast.error("Authentication required. Please sign in again.")
      return
    }

    try {
      setIsViewingResume(true)
      const res = await fetch(getApiUrl("/api/resume/file"), {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        let msg = "Failed to load resume"
        try {
          const errData = await res.json()
          if (errData.message) msg = errData.message
        } catch {
          // Fallback
        }
        toast.error(msg)
        return
      }

      const blob = await res.blob()
      const pdfBlob = new Blob([blob], { type: "application/pdf" })
      const blobUrl = URL.createObjectURL(pdfBlob)

      const win = window.open(blobUrl, "_blank")
      if (!win) {
        toast.info("Pop-up blocked. Please allow pop-ups to view the resume.")
      }

      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000)
    } catch (err) {
      console.error("View resume error:", err)
      toast.error("Could not retrieve resume. Please try again.")
    } finally {
      setIsViewingResume(false)
    }
  }

  const handleDeleteResume = async () => {
    const token = localStorage.getItem("token")
    if (!token) {
      toast.error("Authentication required. Please sign in again.")
      setShowDeleteResumeModal(false)
      return
    }

    try {
      setIsDeletingResume(true)
      const res = await fetch(getApiUrl("/api/resume"), {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      const data = await res.json().catch(() => ({}))

      if (res.ok) {
        toast.success(data.message || "Resume removed successfully.")
        setResume(null)
        setSelectedResumeFile(null)
        if (resumeFileInputRef.current) resumeFileInputRef.current.value = ""
        setShowDeleteResumeModal(false)
      } else {
        toast.error(data.message || "Failed to remove resume.")
      }
    } catch (err) {
      console.error("Delete resume error:", err)
      toast.error("An error occurred while removing the resume. Please try again.")
    } finally {
      setIsDeletingResume(false)
    }
  }

  const handleConfirmLogout = () => {
    clearPromptStorageOnLogout()
    localStorage.removeItem("token")
    setShowLogoutModal(false)
    navigate("/login")
  }

  return (
    <>
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
        <div className="max-w-5xl mx-auto flex flex-col gap-4 sm:gap-6">
          <ProfileHeader />

          {/* Compact Profile Navigation Cards */}
          <div
            className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5 w-full"
            role="tablist"
            aria-label="Profile navigation sections"
          >
            {PROFILE_NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id

              return (
                <button
                  key={item.id}
                  role="tab"
                  id={`profile-tab-${item.id}`}
                  aria-selected={isActive}
                  aria-controls={`profile-panel-${item.id}`}
                  type="button"
                  onClick={() => handleTabChange(item.id)}
                  className={cn(
                    "group flex items-center gap-2.5 px-3 py-2 sm:py-2.5 rounded-xl text-left transition-all duration-150 outline-none cursor-pointer border select-none min-h-[40px]",
                    "focus-visible:ring-2 focus-visible:ring-indigo/40",
                    isActive
                      ? "bg-surface-elevated text-ink font-semibold border-border-accent/60 shadow-xs ring-1 ring-border-accent/30"
                      : "bg-surface-secondary/40 text-muted hover:text-ink hover:bg-surface-secondary/70 border-border-subtle"
                  )}
                >
                  <span
                    className={cn(
                      "p-1.5 rounded-lg shrink-0 transition-colors",
                      isActive
                        ? "bg-indigo/15 text-indigo-light"
                        : "bg-surface-secondary/80 text-muted group-hover:text-ink"
                    )}
                  >
                    {item.icon}
                  </span>

                  <span className="text-xs sm:text-sm font-medium tracking-tight truncate flex-1 leading-tight font-sans">
                    {item.label}
                  </span>

                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo shrink-0" aria-hidden="true" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Tab Content with Directional Sliding Transition */}
          <div className="w-full overflow-hidden">
            <div
              key={activeTab}
              className={
                slideDirection === "forward"
                  ? "animate-profile-slide-forward"
                  : "animate-profile-slide-backward"
              }
            >
              {/* 1. Overview Tab */}
              {activeTab === "overview" && (
                <div id="profile-panel-overview" role="tabpanel" aria-labelledby="profile-tab-overview">
                  <ProfileOverviewTab
                    userData={userData}
                    isLoadingUser={isLoadingUser}
                    resume={resume}
                    isLoadingResume={isLoadingResume}
                    isUploadingResume={isUploadingResume}
                    isViewingResume={isViewingResume}
                    isDeletingResume={isDeletingResume}
                    selectedResumeFile={selectedResumeFile}
                    onSelectResumeFile={handleResumeFileSelect}
                    onCancelSelectedResume={handleCancelSelectedResume}
                    onUploadResume={handleUploadResume}
                    onViewResume={handleViewResume}
                    onRequestDeleteResume={() => setShowDeleteResumeModal(true)}
                    resumeFileInputRef={resumeFileInputRef}
                    returnPromptsEnabled={returnPromptsEnabled}
                    onToggleReturnPrompts={() => setReturnPromptsEnabled(!returnPromptsEnabled)}
                    onRequestSignOut={() => setShowLogoutModal(true)}
                    onNavigateToEdit={() => handleTabChange("edit")}
                  />
                </div>
              )}

              {/* 2. Edit Profile Tab */}
              {activeTab === "edit" && (
                <div id="profile-panel-edit" role="tabpanel" aria-labelledby="profile-tab-edit">
                  <EditProfileTab
                    initialData={userData}
                    onSaveProfile={handleSaveProfile}
                    onCancelEdits={handleCancelEdits}
                    isSaving={isSavingProfile}
                    isDirty={isDirty}
                    setIsDirty={setIsDirty}
                    onAvatarUploaded={(newUrl) => {
                      setUserData((prev) => ({ ...prev, avatarUrl: newUrl }))
                    }}
                  />
                </div>
              )}

              {/* 3. Account & Security Tab */}
              {activeTab === "account" && (
                <div id="profile-panel-account" role="tabpanel" aria-labelledby="profile-tab-account">
                  <AccountSecurityTab
                    userData={userData}
                    returnPromptsEnabled={returnPromptsEnabled}
                    onToggleReturnPrompts={() => setReturnPromptsEnabled(!returnPromptsEnabled)}
                    onRequestSignOut={() => setShowLogoutModal(true)}
                    onPasswordChanged={(newTimestamp) => {
                      setUserData((prev) => ({
                        ...prev,
                        passwordChangedAt: newTimestamp,
                      }))
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Delete Resume Modal */}
      <DeleteResumeModal
        isOpen={showDeleteResumeModal}
        onClose={() => setShowDeleteResumeModal(false)}
        onConfirm={handleDeleteResume}
        isDeleting={isDeletingResume}
        filename={resume?.filename}
      />

      {/* Unsaved Changes Confirmation Modal */}
      <UnsavedChangesModal
        isOpen={showUnsavedModal}
        onConfirmDiscard={handleConfirmDiscard}
        onCancel={handleCancelDiscard}
      />

      {/* Logout Modal */}
      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
      />
    </>
  )
}

export default Profile
