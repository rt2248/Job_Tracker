import React from "react"
import { cn } from "../../utils/cn"
import { getApiUrl } from "../../utils/config"

const getInitials = (user) => {
  if (!user) return "EV"
  const first = user.firstName?.[0] || ""
  const last = user.lastName?.[0] || ""
  if (first || last) return (first + last).toUpperCase()
  return user.username?.slice(0, 2).toUpperCase() || "EV"
}

const NAV_OPTIONS = [
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

const SidebarProfilePopover = ({
  popoverRef,
  userData,
  isLoadingUser,
  currentPath,
  currentTab = "overview",
  onSelectTab,
  className,
}) => {
  const fullName = userData
    ? [userData.firstName, userData.middleName, userData.lastName].filter(Boolean).join(" ") || userData.username || "Evolexa User"
    : "Evolexa User"

  const userEmail = userData?.email || (userData?.username ? `@${userData.username}` : "Job Tracker")

  const avatarSrc = userData?.avatarUrl
    ? (userData.avatarUrl.startsWith("http") ? userData.avatarUrl : getApiUrl(userData.avatarUrl))
    : null

  return (
    <div
      ref={popoverRef}
      role="menu"
      aria-label="Profile navigation popover menu"
      className={cn(
        "absolute bottom-[calc(100%+0.625rem)] left-2.5 right-2.5 z-50",
        "bg-white text-neutral-900 rounded-2xl border border-neutral-200/90 shadow-2xl p-2.5",
        "flex flex-col gap-1.5 select-none transition-all duration-150 animate-in fade-in zoom-in-95",
        className
      )}
      style={{ minWidth: "220px" }}
    >
      {/* A. Profile Identity Section */}
      <div className="flex items-center gap-2.5 p-1.5 min-w-0">
        <div className="w-9 h-9 rounded-full bg-neutral-900 text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-xs overflow-hidden relative ring-2 ring-neutral-900/10">
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt={fullName}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none"
                const fallback = e.currentTarget.parentElement?.querySelector(".sidebar-popover-avatar-fallback")
                if (fallback) fallback.classList.remove("hidden")
              }}
            />
          ) : null}
          <span className={`sidebar-popover-avatar-fallback ${avatarSrc ? "hidden" : "block"}`}>
            {getInitials(userData)}
          </span>
        </div>

        <div className="flex flex-col min-w-0 flex-1">
          {isLoadingUser ? (
            <div className="flex flex-col gap-1 py-0.5">
              <div className="h-3.5 w-20 bg-neutral-200 rounded animate-pulse" />
              <div className="h-2.5 w-28 bg-neutral-100 rounded animate-pulse" />
            </div>
          ) : (
            <>
              <span className="text-xs font-bold font-display text-neutral-950 truncate tracking-tight">
                {fullName}
              </span>
              <span className="text-[11px] text-neutral-500 font-medium truncate font-sans" title={userEmail}>
                {userEmail}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Subtle Divider */}
      <div className="border-t border-neutral-200/80 my-0.5" />

      {/* B. Navigation Options (compact menu list) */}
      <div className="flex flex-col gap-0.5 w-full" role="none">
        {NAV_OPTIONS.map((item) => {
          const isActive = currentPath === "/profile" && currentTab === item.id

          return (
            <button
              key={item.id}
              role="menuitem"
              type="button"
              onClick={() => onSelectTab(item.id)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "group flex items-center gap-2 px-2 py-1.5 rounded-lg text-left text-xs font-medium transition-all duration-150 outline-none cursor-pointer border select-none min-h-[30px]",
                "focus-visible:ring-2 focus-visible:ring-neutral-400",
                isActive
                  ? "bg-neutral-900 text-white font-semibold border-neutral-900 shadow-xs"
                  : "text-neutral-700 hover:text-neutral-950 hover:bg-neutral-100/90 border-transparent"
              )}
            >
              <span
                className={cn(
                  "p-0.5 rounded-md shrink-0 transition-colors",
                  isActive
                    ? "text-white"
                    : "text-neutral-500 group-hover:text-neutral-950"
                )}
              >
                {item.icon}
              </span>

              <span className="truncate flex-1 tracking-tight font-sans text-xs">
                {item.label}
              </span>

              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" aria-hidden="true" />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default SidebarProfilePopover
