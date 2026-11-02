import React from "react";
import useAppTheme from "../../hooks/useAppTheme";
import { cn } from "../../utils/cn";

export default function ThemeToggleButton({ className }) {
  const { theme, toggleTheme } = useAppTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={cn(
        "relative inline-flex items-center justify-center w-9 h-9 rounded-xl",
        "text-muted hover:text-ink transition-all duration-150 shrink-0",
        "bg-transparent hover:bg-surface-secondary/80",
        "border border-transparent hover:border-border-subtle",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/50",
        "cursor-pointer select-none",
        className
      )}
    >
      {isDark ? (
        <svg
          className="w-4.5 h-4.5 text-amber-400 hover:text-amber-300 transition-colors"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.75"
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      ) : (
        <svg
          className="w-4.5 h-4.5 text-slate-700 hover:text-slate-900 transition-colors"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.75"
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      )}
    </button>
  );
}
