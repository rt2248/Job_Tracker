import { useEffect } from "react"

const LogoutModal = ({ isOpen, onClose, onConfirm }) => {
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape" && isOpen) {
                onClose()
            }
        }

        if (isOpen) {
            document.body.style.overflow = "hidden"
            window.addEventListener("keydown", handleKeyDown)
        }

        return () => {
            document.body.style.overflow = "unset"
            window.removeEventListener("keydown", handleKeyDown)
        }
    }, [isOpen, onClose])

    if (!isOpen) return null

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-canvas/80 backdrop-blur-md animate-modal-backdrop"
            onClick={(e) => {
                if (e.target === e.currentTarget) onClose()
            }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="logout-modal-title"
        >
            {/* Modal Card */}
            <div className="relative w-full max-w-md p-6 overflow-hidden bg-surface rounded-2xl border border-border-primary shadow-2xl animate-modal-content">

                {/* Close X Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 rounded-lg text-muted hover:text-ink hover:bg-surface-secondary transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan/40 cursor-pointer"
                    aria-label="Close modal"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Header Icon */}
                <div className="flex flex-col items-center text-center">
                    <div className="mb-4 flex items-center justify-center w-14 h-14 rounded-2xl bg-surface-secondary border border-border-primary text-ink">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                    </div>

                    {/* Title */}
                    <h3 id="logout-modal-title" className="text-xl font-bold font-display text-ink tracking-tight">
                        Logging Out?
                    </h3>

                    {/* Description */}
                    <p className="mt-2 text-sm font-body text-muted leading-relaxed max-w-sm">
                        Are you sure you want to end your current session? You will need to log back in to access your applications and dashboard.
                    </p>
                </div>

                {/* Actions */}
                <div className="mt-6 flex items-center justify-around gap-3 pt-4 border-t border-border-subtle">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2.5 rounded-xl bg-surface-secondary border border-border-primary text-ink font-body font-medium text-sm hover:bg-surface-elevated transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan/40 cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="px-5 py-2.5 rounded-xl bg-red/15 hover:bg-red/25 border border-red/30 text-red font-body font-semibold text-sm hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-red/40 flex items-center gap-2 cursor-pointer"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Log Out
                    </button>
                </div>
            </div>
        </div>
    )
}

export default LogoutModal
