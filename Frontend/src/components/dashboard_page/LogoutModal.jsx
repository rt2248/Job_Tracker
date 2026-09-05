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
            <div className="relative w-full max-w-md p-6 overflow-hidden bg-surface/95 rounded-2xl border border-indigo/20 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),0_0_25px_rgba(99,102,241,0.12)] bg-[radial-gradient(100%_100%_at_50%_0%,rgba(99,102,241,0.12)_0%,transparent_75%)] animate-modal-content">

                {/* Close X Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-light hover:text-ink hover:bg-indigo/10 transition-all duration-200 focus:outline-none"
                    aria-label="Close modal"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Header Icon */}
                <div className="flex flex-col items-center text-center">
                    <div className="relative mb-4 flex items-center justify-center w-14 h-14 rounded-2xl bg-red/10 border border-red/25 text-red shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red rounded-full animate-ping opacity-75" />
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red rounded-full" />
                    </div>

                    {/* Title */}
                    <h3 id="logout-modal-title" className="text-xl font-bold font-display text-ink tracking-tight">
                        Logging Out?
                    </h3>

                    {/* Description */}
                    <p className="mt-2 text-sm font-body text-muted-light leading-relaxed max-w-sm">
                        Are you sure you want to end your current session? You will need to log back in to access your applications and dashboard.
                    </p>
                </div>

                {/* Actions */}
                <div className="mt-6 flex items-center justify-around gap-3 pt-4 border-t border-ink/10">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2.5 rounded-xl border border-ink/15 text-muted-light font-body font-medium text-sm hover:text-ink hover:bg-ink/5 hover:border-ink/30 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo/40"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red/90 to-red hover:from-red hover:to-red/90 text-white font-body font-semibold text-sm shadow-lg shadow-red/25 hover:shadow-red/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red/50 flex items-center gap-2"
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
