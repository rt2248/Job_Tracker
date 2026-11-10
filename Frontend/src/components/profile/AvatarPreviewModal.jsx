import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export default function AvatarPreviewModal({
  isOpen,
  onClose,
  src,
  alt = "Profile picture",
  initials = "EV",
  displayName,
  username,
}) {
  const [imgError, setImgError] = useState(false);
  const closeButtonRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    setImgError(false);
  }, [src, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    previousFocusRef.current = document.activeElement;
    document.body.style.overflow = "hidden";

    const focusTimer = setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 0);

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose?.();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === "function") {
        previousFocusRef.current.focus();
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const showImage = Boolean(src) && !imgError;

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-8 animate-modal-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <button
        ref={closeButtonRef}
        type="button"
        onClick={onClose}
        aria-label="Close image preview"
        title="Close (Esc)"
        className="fixed top-4 right-4 sm:top-6 sm:right-6 z-10 w-10 h-10 rounded-full bg-surface text-ink hover:bg-surface-elevated border border-border-subtle flex items-center justify-center cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div
        role="dialog"
        aria-modal="true"
        aria-label={displayName ? `${displayName} profile picture preview` : "Profile picture preview"}
        className="flex flex-col items-center gap-4 max-w-full animate-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {showImage ? (
          <img
            src={src}
            alt={alt}
            onError={() => setImgError(true)}
            className="max-w-[min(88vw,480px)] max-h-[75vh] w-auto h-auto object-contain rounded-lg select-none"
          />
        ) : (
          <div
            className="w-56 h-56 sm:w-64 sm:h-64 rounded-full bg-surface-overlay text-ink flex items-center justify-center font-display font-bold text-6xl sm:text-7xl select-none"
            aria-label={`Avatar initials ${initials}`}
          >
            {initials}
          </div>
        )}

        {(displayName || username) && (
          <div className="text-center">
            {displayName && (
              <p className="font-display font-semibold text-white text-lg sm:text-xl tracking-tight">
                {displayName}
              </p>
            )}
            {username && (
              <p className="font-mono text-white/75 text-xs sm:text-sm mt-0.5">
                @{username}
              </p>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
