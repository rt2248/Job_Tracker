import React from "react"
import Card from "../shared/Card"
import useAppTheme from "../../hooks/useAppTheme"
import { cn } from "../../utils/cn"

const ThemePreferenceCard = () => {
  const { theme, setTheme } = useAppTheme()

  return (
    <Card className="bg-surface border-border-primary rounded-2xl p-5 sm:p-6 shadow-sm">
      <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-border-subtle">
        <div className="w-8 h-8 rounded-lg bg-surface-secondary flex items-center justify-center text-ink border border-border-subtle">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.75"
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-semibold font-display text-ink">Appearance & Theme</h3>
          <p className="text-xs sm:text-sm text-muted font-sans mt-0.5">
            Customize your visual interface and choose your preferred appearance
          </p>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-surface-secondary/40 border border-border-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <span className="text-ink font-medium text-sm sm:text-base block">Interface Theme</span>
          <span className="text-muted text-xs sm:text-sm font-sans mt-1 block leading-relaxed">
            Choose between Pitch Black Obsidian (Dark) and Crisp Slate (Light) mode.
          </span>
        </div>

        <div
          className="inline-flex items-center p-1 rounded-xl bg-surface-secondary border border-border-primary gap-1 shrink-0 select-none"
          role="radiogroup"
          aria-label="Interface theme selection"
        >
          {/* Dark Mode Option */}
          <button
            type="button"
            role="radio"
            aria-checked={theme === "dark"}
            onClick={() => setTheme("dark")}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-sans font-medium transition-all duration-150 outline-none cursor-pointer border select-none",
              "focus-visible:ring-2 focus-visible:ring-cyan/40",
              theme === "dark"
                ? "bg-surface-elevated text-cyan font-semibold border-cyan/40 shadow-xs"
                : "text-muted hover:text-ink border-transparent hover:bg-surface-overlay/60"
            )}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.75"
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
            <span>Dark</span>
            {theme === "dark" && (
              <span className="w-1.5 h-1.5 rounded-full bg-cyan shrink-0" aria-hidden="true" />
            )}
          </button>

          {/* Light Mode Option */}
          <button
            type="button"
            role="radio"
            aria-checked={theme === "light"}
            onClick={() => setTheme("light")}
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-sans font-medium transition-all duration-150 outline-none cursor-pointer border select-none",
              "focus-visible:ring-2 focus-visible:ring-cyan/40",
              theme === "light"
                ? "bg-surface-elevated text-cyan font-semibold border-cyan/40 shadow-xs"
                : "text-muted hover:text-ink border-transparent hover:bg-surface-overlay/60"
            )}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.75"
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <span>Light</span>
            {theme === "light" && (
              <span className="w-1.5 h-1.5 rounded-full bg-cyan shrink-0" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </Card>
  )
}

export default ThemePreferenceCard
