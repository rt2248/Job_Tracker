import React, { createContext, useState, useCallback } from "react";
import Button from "../components/shared/Button";

const ToastContext = createContext(null);

let toastCount = 0;

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showToast = useCallback(({ message, variant = "info", action = null, duration = null }) => {
        const id = `toast-${++toastCount}`;
        const autoDuration = duration !== null ? duration : (action ? 7500 : 5000);

        setToasts((prev) => [...prev, { id, message, variant, action }]);

        if (autoDuration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, autoDuration);
        }

        return id;
    }, [removeToast]);

    const success = useCallback((message, options = {}) => {
        return showToast({ message, variant: "success", ...options });
    }, [showToast]);

    const info = useCallback((message, options = {}) => {
        return showToast({ message, variant: "info", ...options });
    }, [showToast]);

    const error = useCallback((message, options = {}) => {
        return showToast({ message, variant: "error", ...options });
    }, [showToast]);

    const value = {
        showToast,
        removeToast,
        success,
        info,
        error,
    };

    return (
        <ToastContext.Provider value={value}>
            {children}

            {/* Accessible Toast Container */}
            <div
                className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none px-4 sm:px-0"
                role="status"
                aria-live="polite"
            >
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className="pointer-events-auto flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-xl bg-surface/95 border border-border-primary shadow-elevated backdrop-blur-md transition-all duration-200 animate-slide-in-up"
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            {t.variant === "success" && (
                                <span className="w-6 h-6 rounded-lg bg-green/15 text-green flex items-center justify-center text-xs shrink-0 font-bold border border-green/30">
                                    ✓
                                </span>
                            )}
                            {t.variant === "info" && (
                                <span className="w-6 h-6 rounded-lg bg-indigo/15 text-indigo flex items-center justify-center text-xs shrink-0 font-bold border border-indigo/30">
                                    ℹ
                                </span>
                            )}
                            {t.variant === "error" && (
                                <span className="w-6 h-6 rounded-lg bg-red/15 text-red flex items-center justify-center text-xs shrink-0 font-bold border border-red/30">
                                    ✕
                                </span>
                            )}
                            <p className="text-xs sm:text-sm font-sans text-ink leading-snug">
                                {t.message}
                            </p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            {t.action && (
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => {
                                        t.action.onClick?.();
                                        removeToast(t.id);
                                    }}
                                    className="text-xs font-medium px-2.5 py-1 text-indigo hover:text-indigo-light"
                                >
                                    {t.action.label}
                                </Button>
                            )}
                            <button
                                type="button"
                                onClick={() => removeToast(t.id)}
                                className="text-muted hover:text-ink p-1 rounded-lg hover:bg-surface-secondary transition-colors text-xs"
                                aria-label="Dismiss notification"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export { ToastContext };
