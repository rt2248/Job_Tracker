import React, { useRef, useEffect, useState, useCallback } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import dashboardIcon from "../../assets/icons/dashboard.svg"
import appsIcon from "../../assets/icons/apps.svg"
import networknodeIcon from "../../assets/icons/networknode.svg"
import searchIcon from "../../assets/icons/search.svg"
import SidebarProfilePopover from "./SidebarProfilePopover"
import { getApiUrl } from "../../utils/config"
import { cn } from "../../utils/cn"

const navItems = [
    { title: "Dashboard", icon: dashboardIcon, link: "/dashboard" },
    { title: "Search Jobs", icon: searchIcon, link: "/jobsearch" },
    { title: "Applications", icon: appsIcon, link: "/applications" },
    { title: "Network", icon: networknodeIcon, link: "/network" },
]

const getInitials = (user) => {
    if (!user) return "EX"
    const first = user.firstName?.[0] || ""
    const last = user.lastName?.[0] || ""
    if (first || last) return (first + last).toUpperCase()
    return user.username?.slice(0, 2).toUpperCase() || "EX"
}

const SideBar = ({
    isSidebarOpen = false,
    onClose,
    onExpand,
    onCollapse,
}) => {
    const navigate = useNavigate()
    const location = useLocation()
    const asideRef = useRef(null)
    const enterTimerRef = useRef(null)
    const leaveTimerRef = useRef(null)

    // User profile state & expandable popover menu state
    const [userData, setUserData] = useState(null)
    const [isLoadingUser, setIsLoadingUser] = useState(true)
    const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false)
    const profileMenuRef = useRef(null)
    const profileButtonRef = useRef(null)

    // Fetch authenticated profile details for avatar & display identity
    useEffect(() => {
        const fetchUserData = async () => {
            const token = localStorage.getItem("token")
            if (!token) {
                setIsLoadingUser(false)
                return
            }

            try {
                setIsLoadingUser(true)
                const res = await fetch(getApiUrl("/api/profile/me"), {
                    headers: { Authorization: `Bearer ${token}` },
                })
                if (res.ok) {
                    const data = await res.json()
                    setUserData(data.profile)
                } else {
                    const authRes = await fetch(getApiUrl("/api/auth/me"), {
                        headers: { Authorization: `Bearer ${token}` },
                    })
                    if (authRes.ok) {
                        const authData = await authRes.json()
                        setUserData(authData.user)
                    }
                }
            } catch (err) {
                console.error("Failed to fetch user data for sidebar:", err)
            } finally {
                setIsLoadingUser(false)
            }
        }

        fetchUserData()

        const handleProfileUpdate = (e) => {
            if (e.detail) {
                setUserData((prev) => ({ ...prev, ...e.detail }))
            }
        }
        window.addEventListener("profile:updated", handleProfileUpdate)
        return () => window.removeEventListener("profile:updated", handleProfileUpdate)
    }, [])

    // Outside click & Escape listeners for the profile popover menu
    useEffect(() => {
        if (!isProfileMenuOpen) return

        const handlePointerDownOutside = (e) => {
            if (
                profileMenuRef.current &&
                !profileMenuRef.current.contains(e.target) &&
                profileButtonRef.current &&
                !profileButtonRef.current.contains(e.target)
            ) {
                setIsProfileMenuOpen(false)
            }
        }

        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                setIsProfileMenuOpen(false)
                profileButtonRef.current?.focus()
            }
        }

        document.addEventListener("pointerdown", handlePointerDownOutside)
        document.addEventListener("keydown", handleKeyDown)
        return () => {
            document.removeEventListener("pointerdown", handlePointerDownOutside)
            document.removeEventListener("keydown", handleKeyDown)
        }
    }, [isProfileMenuOpen])

    const clearTimers = useCallback(() => {
        if (enterTimerRef.current) {
            clearTimeout(enterTimerRef.current)
            enterTimerRef.current = null
        }
        if (leaveTimerRef.current) {
            clearTimeout(leaveTimerRef.current)
            leaveTimerRef.current = null
        }
    }, [])

    const handlePointerEnter = useCallback((e) => {
        // Only respond to mouse pointers to prevent synthetic touch events from sticking
        if (e.pointerType && e.pointerType !== "mouse") return

        // Cancel pending leave timer if any
        if (leaveTimerRef.current) {
            clearTimeout(leaveTimerRef.current)
            leaveTimerRef.current = null
        }

        if (isSidebarOpen) return

        if (!enterTimerRef.current) {
            enterTimerRef.current = setTimeout(() => {
                onExpand?.()
                enterTimerRef.current = null
            }, 120)
        }
    }, [isSidebarOpen, onExpand])

    const handlePointerLeave = useCallback((e) => {
        // Only respond to mouse pointers
        if (e.pointerType && e.pointerType !== "mouse") return

        // Cancel pending enter timer if any
        if (enterTimerRef.current) {
            clearTimeout(enterTimerRef.current)
            enterTimerRef.current = null
        }

        if (!isSidebarOpen) return
        if (isProfileMenuOpen) return

        if (!leaveTimerRef.current) {
            leaveTimerRef.current = setTimeout(() => {
                onCollapse?.()
                leaveTimerRef.current = null
            }, 200)
        }
    }, [isSidebarOpen, isProfileMenuOpen, onCollapse])

    // Expand when keyboard focus moves into the sidebar
    const handleFocus = useCallback(() => {
        clearTimers()
        if (!isSidebarOpen) {
            onExpand?.()
        }
    }, [clearTimers, isSidebarOpen, onExpand])

    // Collapse when keyboard focus leaves the sidebar entirely
    const handleBlur = useCallback((e) => {
        if (!asideRef.current?.contains(e.relatedTarget) && !isProfileMenuOpen) {
            clearTimers()
            if (isSidebarOpen) {
                onCollapse?.()
            }
        }
    }, [clearTimers, isSidebarOpen, isProfileMenuOpen, onCollapse])

    // Collapse when tapping or clicking outside the expanded sidebar
    useEffect(() => {
        if (!isSidebarOpen) return

        const handleOutsidePointer = (e) => {
            if (isProfileMenuOpen) return
            if (asideRef.current && !asideRef.current.contains(e.target)) {
                clearTimers()
                onCollapse?.()
                onClose?.()
            }
        }

        document.addEventListener("pointerdown", handleOutsidePointer)
        return () => {
            document.removeEventListener("pointerdown", handleOutsidePointer)
        }
    }, [isSidebarOpen, isProfileMenuOpen, onCollapse, onClose, clearTimers])

    // Clean up timers on unmount
    useEffect(() => {
        return () => {
            clearTimers()
        }
    }, [clearTimers])

    const handleNavigation = (item) => {
        navigate(item.link)
        // On mobile view (< 768px), close the drawer overlay
        if (typeof window !== "undefined" && window.innerWidth < 768) {
            if (onClose) onClose()
        }
    }

    const toggleProfileMenu = (e) => {
        e.stopPropagation()
        if (!isProfileMenuOpen) {
            if (!isSidebarOpen) {
                onExpand?.()
            }
            setIsProfileMenuOpen(true)
        } else {
            setIsProfileMenuOpen(false)
        }
    }

    const currentTab = location.pathname === "/profile"
        ? (new URLSearchParams(location.search).get("tab") || "overview")
        : "overview"

    const handleProfileSelectTab = (tabId) => {
        setIsProfileMenuOpen(false)
        if (location.pathname === "/profile" && currentTab === tabId) {
            return
        }
        navigate(`/profile?tab=${tabId}`)
        if (typeof window !== "undefined" && window.innerWidth < 768) {
            if (onClose) onClose()
        }
    }

    const fullName = userData
        ? [userData.firstName, userData.middleName, userData.lastName].filter(Boolean).join(" ") || userData.username || "Evolexa User"
        : "Evolexa User"

    const userEmail = userData?.email || (userData?.username ? `@${userData.username}` : "Job Tracker")

    const avatarSrc = userData?.avatarUrl
        ? (userData.avatarUrl.startsWith("http") ? userData.avatarUrl : getApiUrl(userData.avatarUrl))
        : null

    return (
        <>
            {/* Mobile Backdrop Overlay */}
            {isSidebarOpen && (
                <div
                    onClick={onClose}
                    className="md:hidden fixed inset-0 bg-canvas/80 backdrop-blur-sm z-40 transition-opacity"
                    aria-hidden="true"
                />
            )}

            {/* Sidebar Shell Container */}
            <aside
                ref={asideRef}
                onPointerEnter={handlePointerEnter}
                onPointerLeave={handlePointerLeave}
                onFocus={handleFocus}
                onBlur={handleBlur}
                aria-label="Sidebar Navigation"
                aria-expanded={isSidebarOpen}
                className={cn(
                    "fixed inset-y-0 left-0 z-50 flex flex-col justify-start items-center",
                    "bg-white text-neutral-900 border-r border-neutral-200/90 transition-all duration-300 ease-in-out shrink-0 select-none",
                    "md:m-3 md:rounded-3xl md:border md:border-neutral-200/90 md:h-[calc(100vh-1.5rem)]",
                    isSidebarOpen
                        ? "w-64 translate-x-0 shadow-2xl md:shadow-2xl"
                        : "-translate-x-full md:translate-x-0 md:w-16 shadow-2xl md:shadow-lg"
                )}
            >
                {/* Logo */}
                <div className="logo overflow-hidden flex items-center justify-between px-4 h-16 w-full border-b border-neutral-200 shrink-0 md:rounded-t-3xl">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-neutral-900 text-white flex items-center justify-center shrink-0 shadow-sm">
                            <span className="font-display font-bold text-sm">ET</span>
                        </div>
                        {isSidebarOpen && (
                            <span className="font-display font-bold text-xl text-neutral-950 tracking-tight truncate">
                                Evolexa
                            </span>
                        )}
                    </div>
                    {onClose && (
                        <button
                            type="button"
                            onClick={onClose}
                            className="md:hidden text-neutral-500 hover:text-neutral-900 p-1.5 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
                            aria-label="Close Sidebar"
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* Navigation Links List */}
                <nav
                    className="links overflow-y-auto custom-scrollbar my-4 flex flex-col justify-start w-full gap-1 px-2.5"
                    aria-label="Main Navigation"
                >
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.link

                        return (
                            <button
                                key={item.title}
                                type="button"
                                onClick={() => handleNavigation(item)}
                                title={!isSidebarOpen ? item.title : undefined}
                                aria-label={item.title}
                                className={cn(
                                    "group py-2.5 px-3 flex items-center gap-3 text-sm font-sans rounded-xl text-left transition-all outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 hover:cursor-pointer",
                                    !isSidebarOpen && "md:justify-center md:px-0",
                                    isActive
                                        ? "bg-neutral-200/90 text-neutral-950 font-bold border-l-2 border-neutral-950 shadow-sm"
                                        : "text-neutral-700 font-medium hover:text-neutral-950 hover:bg-neutral-100/80"
                                )}
                            >
                                <img
                                    src={item.icon}
                                    alt=""
                                    className={cn(
                                        "h-5 w-5 shrink-0 transition-opacity brightness-0",
                                        isActive ? "opacity-100" : "opacity-65 group-hover:opacity-100"
                                    )}
                                />
                                {isSidebarOpen && (
                                    <span className="whitespace-nowrap truncate">{item.title}</span>
                                )}
                            </button>
                        )
                    })}
                </nav>

                {/* Footer User Info Indicator & Profile Popover Trigger */}
                <div className="relative mt-auto w-full p-2.5 border-t border-neutral-200/90 shrink-0 md:rounded-b-3xl">
                    {/* Expandable Profile Popover */}
                    {isProfileMenuOpen && (
                        <SidebarProfilePopover
                            popoverRef={profileMenuRef}
                            userData={userData}
                            isLoadingUser={isLoadingUser}
                            currentPath={location.pathname}
                            currentTab={currentTab}
                            onSelectTab={handleProfileSelectTab}
                        />
                    )}

                    {/* Bottom-most profile/avatar trigger button */}
                    <button
                        ref={profileButtonRef}
                        type="button"
                        onClick={toggleProfileMenu}
                        aria-haspopup="menu"
                        aria-expanded={isProfileMenuOpen}
                        aria-label="User Profile & Account Menu"
                        title={!isSidebarOpen ? fullName : undefined}
                        className={cn(
                            "w-full flex items-center rounded-xl transition-all duration-150 outline-none cursor-pointer focus-visible:ring-2 focus-visible:ring-neutral-400 select-none",
                            isSidebarOpen
                                ? "gap-2.5 p-2 bg-neutral-100/80 hover:bg-neutral-200/70 border border-neutral-200 text-left"
                                : "justify-center p-1.5 hover:bg-neutral-100/80 border border-transparent",
                            isProfileMenuOpen && "bg-neutral-200/90 border-neutral-300 ring-1 ring-neutral-400/30"
                        )}
                    >
                        <div className="w-8 h-8 rounded-full bg-neutral-900 text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-sm overflow-hidden relative">
                            {avatarSrc ? (
                                <img
                                    src={avatarSrc}
                                    alt={fullName}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.currentTarget.style.display = "none"
                                        const fb = e.currentTarget.parentElement?.querySelector(".sidebar-footer-avatar-fallback")
                                        if (fb) fb.classList.remove("hidden")
                                    }}
                                />
                            ) : null}
                            <span className={`sidebar-footer-avatar-fallback ${avatarSrc ? "hidden" : "block"}`}>
                                {getInitials(userData)}
                            </span>
                        </div>

                        {isSidebarOpen && (
                            <>
                                <div className="flex flex-col min-w-0 flex-1">
                                    <span className="text-xs font-bold text-neutral-950 truncate">
                                        {fullName}
                                    </span>
                                    <span className="text-[11px] text-neutral-500 font-medium truncate font-sans" title={userEmail}>
                                        {userEmail}
                                    </span>
                                </div>

                                <svg
                                    className={cn(
                                        "w-4 h-4 text-neutral-400 transition-transform duration-200 shrink-0",
                                        isProfileMenuOpen ? "rotate-180 text-neutral-800" : ""
                                    )}
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    aria-hidden="true"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                                </svg>
                            </>
                        )}
                    </button>
                </div>
            </aside>
        </>
    )
}

export default SideBar
