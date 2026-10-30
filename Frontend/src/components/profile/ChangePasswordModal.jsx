import React, { useState, useEffect } from "react"
import { Modal, ModalHeader, ModalTitle, ModalContent, ModalFooter } from "../shared/Modal"
import Button from "../shared/Button"
import visibilityIcon from "../../assets/icons/visibility.svg"
import visibilityOffIcon from "../../assets/icons/visibilityoff.svg"
import { useToast } from "../../hooks/useToast"
import { getApiUrl } from "../../utils/config"

const PasswordInput = ({
  id,
  label,
  value,
  onChange,
  placeholder,
  error,
  disabled,
  autoComplete,
}) => {
  const [show, setShow] = useState(false)

  return (
    <div className="flex flex-col gap-1 w-full">
      <label htmlFor={id} className="text-xs font-medium text-ink-secondary">
        {label}
      </label>
      <div className="relative w-full">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          className={`w-full px-3 py-2 pr-10 text-xs sm:text-sm bg-surface-secondary text-ink placeholder:text-muted rounded-xl border ${
            error ? "border-red" : "border-border-primary"
          } focus:border-indigo focus:ring-2 focus:ring-indigo/20 transition-all outline-none font-mono`}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShow((prev) => !prev)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted hover:text-ink cursor-pointer transition-opacity"
          aria-label={show ? "Hide password" : "Show password"}
        >
          <img
            src={show ? visibilityOffIcon : visibilityIcon}
            alt=""
            className="w-4 h-4 opacity-70 hover:opacity-100 transition-opacity"
          />
        </button>
      </div>
      {error && <span className="text-[11px] text-red font-sans mt-0.5">{error}</span>}
    </div>
  )
}

const RequirementItem = ({ met, label }) => (
  <div className="flex items-center gap-1.5 text-[11px] transition-colors">
    <span
      className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 transition-colors ${
        met ? "bg-green/15 text-green border border-green/30" : "bg-surface-secondary text-muted border border-border-subtle"
      }`}
    >
      {met ? "✓" : "•"}
    </span>
    <span className={met ? "text-ink font-medium" : "text-muted"}>{label}</span>
  </div>
)

const ChangePasswordModal = ({ isOpen, onClose, onPasswordChanged }) => {
  const toast = useToast()

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  const [currentError, setCurrentError] = useState("")
  const [generalError, setGeneralError] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset form when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setCurrentError("")
      setGeneralError("")
    }
  }, [isOpen])

  // Real-time requirements checklist
  const criteria = {
    length: newPassword.length >= 8 && newPassword.length <= 128,
    lower: /[a-z]/.test(newPassword),
    upper: /[A-Z]/.test(newPassword),
    number: /\d/.test(newPassword),
    special: /[^A-Za-z0-9]/.test(newPassword),
    match: newPassword.length > 0 && newPassword === confirmPassword,
    different: newPassword.length > 0 && currentPassword.length > 0 && newPassword !== currentPassword,
  }

  const allMet =
    criteria.length &&
    criteria.lower &&
    criteria.upper &&
    criteria.number &&
    criteria.special &&
    criteria.match &&
    currentPassword.length > 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    setCurrentError("")
    setGeneralError("")

    if (!currentPassword) {
      setCurrentError("Please enter your current password.")
      return
    }

    if (!criteria.length) {
      setGeneralError("Password must be between 8 and 128 characters.")
      return
    }

    if (!criteria.lower || !criteria.upper || !criteria.number || !criteria.special) {
      setGeneralError("Please satisfy all password complexity requirements.")
      return
    }

    if (newPassword !== confirmPassword) {
      setGeneralError("New password and confirmation do not match.")
      return
    }

    if (currentPassword === newPassword) {
      setGeneralError("New password cannot be identical to the current password.")
      return
    }

    const token = localStorage.getItem("token")
    if (!token) {
      toast.error("Authentication expired. Please sign in again.")
      onClose()
      return
    }

    try {
      setIsSubmitting(true)
      const res = await fetch(getApiUrl("/api/auth/change-password"), {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      })

      const data = await res.json().catch(() => ({}))

      if (res.ok) {
        // Atomic session update: replace stored JWT with newly issued token
        if (data.token) {
          localStorage.setItem("token", data.token)
        }

        toast.success(data.message || "Password updated successfully. Other sessions have been revoked.")
        onPasswordChanged?.(data.passwordChangedAt)
        onClose()
      } else if (res.status === 401) {
        setCurrentError(data.message || "Incorrect current password.")
      } else if (res.status === 429) {
        setGeneralError(data.message || "Too many password change attempts. Please try again later.")
      } else {
        setGeneralError(data.message || "Failed to update password. Please check your entries.")
      }
    } catch (err) {
      console.error("Change password error:", err)
      setGeneralError("An unexpected network error occurred. Please verify your connection and try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" closeOnOverlayClick={!isSubmitting}>
      <form onSubmit={handleSubmit}>
        <ModalHeader className="border-b border-border-subtle pb-4">
          <div>
            <ModalTitle className="text-lg font-display text-ink">Change Account Password</ModalTitle>
            <p className="text-xs text-muted font-sans mt-0.5">
              Enter your current password and choose a secure new password. Changing your password will invalidate all previous sessions.
            </p>
          </div>
        </ModalHeader>

        <ModalContent className="py-4 space-y-4">
          {generalError && (
            <div className="p-3 rounded-xl bg-red/10 border border-red/30 text-xs text-red font-sans animate-fadeIn">
              {generalError}
            </div>
          )}

          <PasswordInput
            id="change-current-pw"
            label="Current Password"
            value={currentPassword}
            onChange={(e) => {
              setCurrentPassword(e.target.value)
              if (currentError) setCurrentError("")
            }}
            placeholder="Enter current password"
            error={currentError}
            disabled={isSubmitting}
            autoComplete="current-password"
          />

          <PasswordInput
            id="change-new-pw"
            label="New Password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new strong password"
            disabled={isSubmitting}
            autoComplete="new-password"
          />

          <PasswordInput
            id="change-confirm-pw"
            label="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-enter new password"
            disabled={isSubmitting}
            autoComplete="new-password"
          />

          {/* Real-time policy criteria */}
          <div className="p-3.5 rounded-xl bg-surface-secondary/40 border border-border-subtle space-y-2">
            <span className="text-[11px] font-semibold text-ink-secondary tracking-wide uppercase font-mono block">
              Password Requirements
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
              <RequirementItem met={criteria.length} label="8 to 128 characters" />
              <RequirementItem met={criteria.upper} label="One uppercase letter (A-Z)" />
              <RequirementItem met={criteria.lower} label="One lowercase letter (a-z)" />
              <RequirementItem met={criteria.number} label="One digit (0-9)" />
              <RequirementItem met={criteria.special} label="One special character" />
              <RequirementItem
                met={criteria.match}
                label={confirmPassword.length > 0 && !criteria.match ? "Passwords do not match" : "Passwords match"}
              />
            </div>
          </div>
        </ModalContent>

        <ModalFooter className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            disabled={isSubmitting || !allMet}
          >
            Update Password
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  )
}

export default ChangePasswordModal
