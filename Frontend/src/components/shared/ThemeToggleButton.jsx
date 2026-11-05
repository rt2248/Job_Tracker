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
        "group relative inline-flex items-center justify-center w-10 h-10 rounded-xl",
        "bg-transparent border-none shrink-0",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/50",
        "cursor-pointer select-none",
        className
      )}
    >
      <div className="relative w-[22px] h-[22px] flex items-center justify-center transition-transform duration-200 ease-out group-hover:scale-110 motion-reduce:transform-none">
        {/* Sun Icon (visible in dark mode, transitions out when entering light mode) */}
        <svg
          className={cn(
            "absolute inset-0 w-[22px] h-[22px] text-amber-400 group-hover:text-amber-300",
            "stroke-[1.75] group-hover:stroke-[2.25]",
            "transition-all duration-300 ease-in-out motion-reduce:transition-none motion-reduce:transform-none",
            isDark
              ? "rotate-0 scale-100 opacity-100"
              : "rotate-90 scale-0 opacity-0 pointer-events-none"
          )}
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

        {/* Moon Icon (visible in light mode, transitions out when entering dark mode) */}
        <svg
          className={cn(
            "absolute inset-0 w-[22px] h-[22px] text-slate-700 group-hover:text-slate-900",
            "stroke-[1.75] group-hover:stroke-[2.25]",
            "transition-all duration-300 ease-in-out motion-reduce:transition-none motion-reduce:transform-none",
            isDark
              ? "-rotate-90 scale-0 opacity-0 pointer-events-none"
              : "rotate-0 scale-100 opacity-100"
          )}
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
      </div>
    </button>
  );
}
