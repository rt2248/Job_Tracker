import React, { useState, useEffect, useRef, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import Card from "../../components/shared/Card"
import Button from "../../components/shared/Button"
import Badge from "../../components/shared/Badge"
import LogoutModal from "../../components/dashboard_page/LogoutModal"
import { useSettings } from "../../hooks/useSettings"
import { useToast } from "../../hooks/useToast"
import { clearPromptStorageOnLogout } from "../../utils/promptStorage"
import { getApiUrl } from "../../utils/config"
import { formatDate } from "../../utils/formatDate"
import { cn } from "../../utils/cn"

const formatFileSize = (bytes) => {
  if (!bytes && bytes !== 0) return "—"
  if (bytes === 0) return "0 KB"
  const kb = bytes / 1024
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`
  }
  return `${(kb / 1024).toFixed(2)} MB`
}

const getInitials = (user) => {
  if (!user) return "EV"
  const first = user.firstName?.[0] || ""
  const last = user.lastName?.[0] || ""
  if (first || last) return (first + last).toUpperCase()
  return user.username?.slice(0, 2).toUpperCase() || "EV"
}

const Profile = () => {
  const navigate = useNavigate()
  const toast = useToast()
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const { returnPromptsEnabled, setReturnPromptsEnabled } = useSettings()

  // User profile state
  const [userData, setUserData] = useState(null)
  const [isLoadingUser, setIsLoadingUser] = useState(true)

  // Copy feedback states
  const [copiedEmail, setCopiedEmail] = useState(false)
  const [copiedUsername, setCopiedUsername] = useState(false)
  const [copiedId, setCopiedId] = useState(false)

  // Resume section state
  const [resume, setResume] = useState(null)
  const [isLoadingResume, setIsLoadingResume] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [isViewing, setIsViewing] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const fileInputRef = useRef(null)

  // 1. Fetch authenticated user data from backend
  const fetchUserData = useCallback(async () => {
    const token = localStorage.getItem("token")
    if (!token) {
      setIsLoadingUser(false)
      return
    }

    try {
      setIsLoadingUser(true)
      const res = await fetch(getApiUrl("/api/auth/me"), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (res.ok) {
        const data = await res.json()
        setUserData(data.user)
      } else {
        // Fallback: decode JWT token payload if endpoint is unavailable
        try {
          const payload = JSON.parse(atob(token.split(".")[1]))
          setUserData({
            id: payload.userId,
            email: payload.email,
            username: payload.email?.split("@")[0] || "user",
            firstName: "User",
            lastName: "Account",
          })
        } catch {
          // Keep null
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
        headers: {
          Authorization: `Bearer ${token}`,
        },
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
    fetchUserData()
    fetchResume()
  }, [fetchUserData, fetchResume])

  // Copy helpers
  const handleCopyEmail = async (text) => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopiedEmail(true)
      toast.success("Email copied to clipboard")
      setTimeout(() => setCopiedEmail(false), 2500)
    } catch (err) {
      console.error("Failed to copy email", err)
    }
  }

  const handleCopyUsername = async (text) => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopiedUsername(true)
      toast.success("Username copied to clipboard")
      setTimeout(() => setCopiedUsername(false), 2500)
    } catch (err) {
      console.error("Failed to copy username", err)
    }
  }

  const handleCopyId = async (text) => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(true)
      toast.success("Account ID copied to clipboard")
      setTimeout(() => setCopiedId(false), 2500)
    } catch (err) {
      console.error("Failed to copy ID", err)
    }
  }

  // File upload and resume handling
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 1. Extension check
    const isPdf = file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf"
    if (!isPdf) {
      toast.error("Only PDF files are supported.")
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }

    // 2. Size check (5 MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size exceeds the 5 MB limit.")
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }

    if (file.size === 0) {
      toast.error("Selected file is empty.")
      if (fileInputRef.current) fileInputRef.current.value = ""
      return
    }

    setSelectedFile(file)
  }

  const handleCancelSelected = () => {
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    const token = localStorage.getItem("token")
    if (!token) {
      toast.error("Authentication required. Please sign in again.")
      return
    }

    try {
      setIsUploading(true)
      const formData = new FormData()
      formData.append("resume", selectedFile)

      const res = await fetch(getApiUrl("/api/resume"), {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      const data = await res.json()

      if (res.ok) {
        toast.success(data.message || (resume ? "Resume replaced successfully" : "Resume uploaded successfully"))
        setResume(data.resume)
        setSelectedFile(null)
        if (fileInputRef.current) fileInputRef.current.value = ""
      } else {
        toast.error(data.message || "Failed to upload resume.")
      }
    } catch (err) {
      console.error("Upload error:", err)
      toast.error("An error occurred while uploading. Please try again.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleViewResume = async () => {
    const token = localStorage.getItem("token")
    if (!token) {
      toast.error("Authentication required. Please sign in again.")
      return
    }

    try {
      setIsViewing(true)
      const res = await fetch(getApiUrl("/api/resume/file"), {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        let msg = "Failed to load resume"
        try {
          const errData = await res.json()
          if (errData.message) msg = errData.message
        } catch {
          // fallback
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

      setTimeout(() => {
        URL.revokeObjectURL(blobUrl)
      }, 60000)
    } catch (err) {
      console.error("View resume error:", err)
      toast.error("Could not retrieve resume. Please try again.")
    } finally {
      setIsViewing(false)
    }
  }

  const handleConfirmLogout = () => {
    clearPromptStorageOnLogout()
    localStorage.removeItem("token")
    setShowLogoutModal(false)
    navigate("/login")
  }

  const fullName = userData
    ? [userData.firstName, userData.middleName, userData.lastName].filter(Boolean).join(" ") || "User Account"
    : "User Account"

  return (
    <>
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
        <div className="max-w-6xl mx-auto flex flex-col gap-6 sm:gap-8">

          {/* ================= HERO HEADER ================= */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-border-primary/40">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface-secondary border border-border-primary/80 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-ink" />
                <span className="text-[11px] font-mono uppercase tracking-wider text-muted">Identity Hub</span>
              </div>
              <h1 className="font-display text-2xl sm:text-3xl md:text-4xl text-ink font-bold tracking-tight">
                Profile & Account
              </h1>
              <p className="text-muted text-xs sm:text-sm mt-1 font-sans max-w-2xl">
                Manage your developer credentials, verified contact info, resume attachments, and platform preferences.
              </p>
            </div>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowLogoutModal(true)}
              className="shrink-0 text-xs sm:text-sm flex items-center gap-2 self-start sm:self-auto cursor-pointer focus-visible:ring-red/40"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Log Out
            </Button>
          </div>

          {/* ================= MAIN CONTENT SPLIT (Codexa 2-Column Pattern) ================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">

            {/* ========== LEFT COLUMN: DEVELOPER IDENTITY CARD (~40%) ========== */}
            <div className="lg:col-span-5 xl:col-span-4 self-start">
              <Card className="bg-surface/90 border-border-primary rounded-3xl p-6 sm:p-7 flex flex-col items-center text-center shadow-sm relative overflow-hidden">
                
                {/* Avatar with Initials */}
                <div className="relative group w-24 h-24 sm:w-28 sm:h-28 rounded-3xl p-1 bg-surface-secondary border border-border-primary shadow-sm flex items-center justify-center transition-transform duration-300 hover:scale-105">
                  <div className="w-full h-full rounded-[22px] bg-surface flex items-center justify-center text-ink text-2xl sm:text-3xl font-display font-bold border border-border-subtle select-none">
                    {getInitials(userData)}
                  </div>
                  <div className="absolute -bottom-1.5 -right-1.5 bg-surface border border-border-primary rounded-full p-1.5 text-muted shadow-sm">
                    <svg className="w-3.5 h-3.5 text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>

                {/* Name & Handle */}
                <div className="mt-5 w-full">
                  <h2 className="text-xl sm:text-2xl font-bold font-display text-ink tracking-tight truncate">
                    {isLoadingUser ? (
                      <span className="inline-block w-36 h-6 bg-surface-secondary rounded animate-pulse" />
                    ) : (
                      fullName
                    )}
                  </h2>
                  <div className="flex items-center justify-center gap-1.5 text-xs font-mono text-muted mt-1">
                    <span>@{userData?.username || "username"}</span>
                    <span className="text-ink" title="Verified Member">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </span>
                  </div>
                </div>

                {/* Email with Quick Copy Pill */}
                <div className="w-full mt-4 px-3.5 py-2.5 rounded-2xl bg-surface-secondary/70 border border-border-primary flex items-center justify-between gap-2.5 text-xs hover:border-ink/20 transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <svg className="w-4 h-4 text-muted shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className="font-mono text-ink truncate">{userData?.email || "—"}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyEmail(userData?.email)}
                    title="Copy Email"
                    className="p-1 rounded-lg hover:bg-surface text-muted hover:text-ink transition-colors shrink-0 cursor-pointer"
                  >
                    {copiedEmail ? (
                      <svg className="w-3.5 h-3.5 text-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    )}
                  </button>
                </div>

                {/* Subtle Divider */}
                <div className="w-full h-px bg-border-subtle my-5" />

                {/* Quick Attributes List */}
                <div className="w-full flex flex-col gap-2.5 text-left text-xs font-sans">
                  
                  {/* Account Status */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-secondary/50 border border-border-primary/50">
                    <span className="text-muted flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-green" />
                      Account Status
                    </span>
                    <Badge variant="emerald" size="sm" className="font-medium">
                      Active
                    </Badge>
                  </div>

                  {/* Plan Tier */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-secondary/50 border border-border-primary/50">
                    <span className="text-muted flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                      </svg>
                      Membership
                    </span>
                    <Badge variant="subtle" size="sm" className="font-medium">
                      Pro Tier
                    </Badge>
                  </div>

                  {/* Member Since */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-secondary/50 border border-border-primary/50">
                    <span className="text-muted flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Member Since
                    </span>
                    <span className="font-mono text-ink font-medium">
                      {formatDate(userData?.createdAt)}
                    </span>
                  </div>

                  {/* Attached Resume Quick Status */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-surface-secondary/50 border border-border-primary/50">
                    <span className="text-muted flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      Resume
                    </span>
                    <span className="font-mono text-ink text-[11px] truncate max-w-[120px]">
                      {resume ? resume.filename : "Not attached"}
                    </span>
                  </div>

                </div>

              </Card>
            </div>

            {/* ========== RIGHT COLUMN: ORGANIZED SECTIONS (~60%) ========== */}
            <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">

              {/* SECTION 1: ACCOUNT CREDENTIALS */}
              <Card className="bg-surface/90 border-border-primary rounded-3xl p-5 sm:p-7 shadow-sm">
                <div className="flex items-center justify-between mb-5 pb-3 border-b border-border-subtle">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-surface-secondary flex items-center justify-center text-ink border border-border-subtle">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-base font-semibold font-display text-ink">Account Credentials</h3>
                      <p className="text-[11px] text-muted font-sans">Primary identity and login details</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-sans">
                  
                  {/* Full Name */}
                  <div className="p-3.5 rounded-2xl bg-surface-secondary/40 border border-border-primary/60 flex flex-col justify-between">
                    <span className="text-[11px] font-mono text-muted uppercase tracking-wider block">Full Name</span>
                    <span className="text-ink font-medium mt-1 block truncate">
                      {isLoadingUser ? "Loading..." : fullName}
                    </span>
                  </div>

                  {/* Username */}
                  <div className="p-3.5 rounded-2xl bg-surface-secondary/40 border border-border-primary/60 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-muted uppercase tracking-wider">Username</span>
                      <button
                        type="button"
                        onClick={() => handleCopyUsername(userData?.username)}
                        className="text-muted hover:text-ink text-xs cursor-pointer"
                        title="Copy username"
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
                    <span className="text-ink font-mono font-medium mt-1 block truncate">
                      @{userData?.username || "—"}
                    </span>
                  </div>

                  {/* Primary Email */}
                  <div className="p-3.5 rounded-2xl bg-surface-secondary/40 border border-border-primary/60 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-muted uppercase tracking-wider">Primary Email</span>
                      <button
                        type="button"
                        onClick={() => handleCopyEmail(userData?.email)}
                        className="text-muted hover:text-ink text-xs cursor-pointer"
                        title="Copy email"
                      >
                        {copiedEmail ? (
                          <span className="text-green text-[10px] font-mono">Copied</span>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <span className="text-ink font-mono mt-1 block truncate">
                      {userData?.email || "—"}
                    </span>
                  </div>

                  {/* Account ID */}
                  <div className="p-3.5 rounded-2xl bg-surface-secondary/40 border border-border-primary/60 flex flex-col justify-between">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-muted uppercase tracking-wider">Account ID</span>
                      <button
                        type="button"
                        onClick={() => handleCopyId(userData?.id)}
                        className="text-muted hover:text-ink text-xs cursor-pointer"
                        title="Copy ID"
                      >
                        {copiedId ? (
                          <span className="text-green text-[10px] font-mono">Copied</span>
                        ) : (
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <span className="text-muted font-mono text-xs mt-1 block truncate" title={userData?.id}>
                      {userData?.id ? `${userData.id.slice(0, 16)}...` : "—"}
                    </span>
                  </div>

                </div>
              </Card>

              {/* SECTION 2: RESUME & ATTACHMENTS (Real Functional Feature) */}
              <Card className="bg-surface/90 border-border-primary rounded-3xl p-5 sm:p-7 shadow-sm">
                <div className="flex items-center justify-between mb-5 pb-3 border-b border-border-subtle">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-surface-secondary flex items-center justify-center text-ink border border-border-subtle">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-base font-semibold font-display text-ink">Resume & Attachments</h3>
                      <p className="text-[11px] text-muted font-sans">Attached resume for opportunity tracking and applications</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-muted bg-surface-secondary px-2.5 py-1 rounded-full border border-border-primary/50">
                    PDF • Max 5MB
                  </span>
                </div>

                {isLoadingResume ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="flex items-center gap-2.5 text-xs text-muted font-sans">
                      <svg className="animate-spin h-4 w-4 text-ink" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Loading resume details...</span>
                    </div>
                  </div>
                ) : resume ? (
                  <div className="flex flex-col gap-3">
                    {/* Active Resume Row */}
                    <div className="p-4 rounded-2xl bg-surface-secondary/70 border border-border-primary flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-surface flex items-center justify-center text-ink shrink-0 border border-border-subtle shadow-sm">
                          <svg className="w-5 h-5 text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs sm:text-sm font-mono text-ink font-medium truncate" title={resume.filename}>
                            {resume.filename}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-muted font-sans mt-0.5">
                            <span>{formatFileSize(resume.size)}</span>
                            <span>•</span>
                            <span>Uploaded {formatDate(resume.uploadedAt)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={handleViewResume}
                          isLoading={isViewing}
                          disabled={isUploading}
                          className="h-8 text-xs px-3"
                          title="View resume in new tab"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          View
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isUploading || isViewing}
                          className="h-8 text-xs px-3"
                        >
                          Replace
                        </Button>
                      </div>
                    </div>

                    {/* Staged Replacement Banner */}
                    {selectedFile && (
                      <div className="p-3.5 rounded-2xl border border-dashed border-border-primary bg-surface/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
                        <div className="min-w-0">
                          <span className="text-[11px] uppercase tracking-wider text-muted font-mono block">Selected Replacement</span>
                          <p className="text-xs font-mono text-ink font-medium truncate mt-0.5" title={selectedFile.name}>
                            {selectedFile.name} <span className="text-muted font-sans font-normal">({formatFileSize(selectedFile.size)})</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={handleUpload}
                            isLoading={isUploading}
                            className="h-8 text-xs"
                          >
                            Confirm Replace
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancelSelected}
                            disabled={isUploading}
                            className="h-8 text-xs text-muted hover:text-ink"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {selectedFile ? (
                      <div className="p-4 rounded-2xl border border-dashed border-border-primary bg-surface/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
                        <div className="min-w-0">
                          <span className="text-[11px] uppercase tracking-wider text-muted font-mono block">Selected Resume</span>
                          <p className="text-xs font-mono text-ink font-medium truncate mt-0.5" title={selectedFile.name}>
                            {selectedFile.name} <span className="text-muted font-sans font-normal">({formatFileSize(selectedFile.size)})</span>
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={handleUpload}
                            isLoading={isUploading}
                            className="h-8 text-xs"
                          >
                            Upload Resume
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancelSelected}
                            disabled={isUploading}
                            className="h-8 text-xs text-muted hover:text-ink"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-7 rounded-2xl border border-dashed border-border-primary bg-surface-secondary/20 flex flex-col items-center justify-center text-center">
                        <div className="w-11 h-11 rounded-2xl bg-surface-secondary border border-border-subtle flex items-center justify-center text-muted mb-3 shadow-inner">
                          <svg className="w-5 h-5 text-ink" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                        </div>
                        <p className="text-sm font-semibold text-ink">No resume uploaded</p>
                        <p className="text-xs text-muted mt-0.5 max-w-sm font-sans">
                          Upload your resume in PDF format (up to 5 MB) to attach when tracking opportunities.
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          className="mt-4 text-xs font-medium"
                        >
                          + Upload Resume
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={handleFileSelect}
                />
              </Card>

              {/* SECTION 3: OPPORTUNITY PREFERENCES */}
              <Card className="bg-surface/90 border-border-primary rounded-3xl p-5 sm:p-7 shadow-sm">
                <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-border-subtle">
                  <div className="w-8 h-8 rounded-xl bg-surface-secondary flex items-center justify-center text-ink border border-border-subtle">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold font-display text-ink">Opportunity Preferences</h3>
                    <p className="text-[11px] text-muted font-sans">Discovery prompts and application tracking behaviors</p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-surface-secondary/40 border border-border-primary/60 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <span className="text-ink font-medium text-sm block">Return-triggered prompts</span>
                    <span className="text-muted text-xs font-sans mt-0.5 block leading-relaxed">
                      Ask to track opportunities when returning to Evolexa after viewing external job postings.
                    </span>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={returnPromptsEnabled}
                    onClick={() => setReturnPromptsEnabled(!returnPromptsEnabled)}
                    className={cn(
                      "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo/40",
                      returnPromptsEnabled ? "bg-indigo" : "bg-surface-secondary border border-border-primary"
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out",
                        returnPromptsEnabled ? "translate-x-5" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>
              </Card>

              {/* SECTION 4: ACCOUNT SESSION ACTIONS */}
              <Card className="bg-surface/90 border-border-primary rounded-3xl p-5 sm:p-7 shadow-sm">
                <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-border-subtle">
                  <div className="w-8 h-8 rounded-xl bg-surface-secondary flex items-center justify-center text-red border border-border-subtle">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-semibold font-display text-ink">Account Session</h3>
                    <p className="text-[11px] text-muted font-sans">Active authentication session and device security</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-surface-secondary/40 border border-border-primary/60">
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-ink block">Sign Out of Evolexa</span>
                    <span className="text-xs text-muted font-sans mt-0.5 block">
                      Safely terminate your active authenticated session on this browser.
                    </span>
                  </div>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowLogoutModal(true)}
                    className="shrink-0 text-xs px-4"
                  >
                    Sign Out
                  </Button>
                </div>
              </Card>

            </div>

          </div>

        </div>
      </main>

      <LogoutModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
      />
    </>
  )
}

export default Profile
