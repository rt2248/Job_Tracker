import React, { useState } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import dashboardIcon from "../../assets/icons/dashboard.svg"
import logoutIcon from "../../assets/icons/logout.svg"
import profileIcon from "../../assets/icons/profile.svg"
import appsIcon from "../../assets/icons/apps.svg"
import networknodeIcon from "../../assets/icons/networknode.svg"
import searchIcon from "../../assets/icons/search.svg"
import LogoutModal from "./LogoutModal"
import { cn } from "../../utils/cn"
import { clearPromptStorageOnLogout } from "../../utils/promptStorage"

const navItems = [
    { title: "Dashboard", icon: dashboardIcon, link: "/dashboard" },
    { title: "Search Jobs", icon: searchIcon, link: "/jobsearch" },
    { title: "Applications", icon: appsIcon, link: "/applications" },
    { title: "Profile", icon: profileIcon, link: "/profile" },
    { title: "Network", icon: networknodeIcon, link: "/network" },
    { title: "Logout", icon: logoutIcon, link: "/login" },
]

const SideBar = ({ isSidebarOpen = true, onClose }) => {
    const navigate = useNavigate()
    const location = useLocation()
    const [showLogoutModal, setShowLogoutModal] = useState(false)

    const handleNavigation = (item) => {
        if (item.title === "Logout") {
            setShowLogoutModal(true)
            return
        }
        navigate(item.link)
        if (onClose) onClose()
    }

    const handleConfirmLogout = () => {
        clearPromptStorageOnLogout()
        localStorage.removeItem("token")
        setShowLogoutModal(false)
        navigate("/login")
    }

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
                className={cn(
                    "fixed md:static inset-y-0 left-0 z-50 flex flex-col justify-start items-center",
                    "bg-white text-neutral-900 border-r border-neutral-200/90 shadow-2xl transition-all duration-300 ease-in-out shrink-0",
                    "md:m-3 md:rounded-3xl md:border md:h-[calc(100vh-1.5rem)] md:shadow-lg",
                    isSidebarOpen
                        ? "w-64 translate-x-0"
                        : "-translate-x-full md:translate-x-0 md:w-16"
                )}
            >
                {/* Logo */}
                <div className="logo overflow-hidden flex items-center justify-between px-4 h-16 w-full border-b border-neutral-200 shrink-0">
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
                            onClick={onClose}
                            className="md:hidden text-neutral-500 hover:text-neutral-900 p-1.5 rounded-lg hover:bg-neutral-100 transition-colors"
                            aria-label="Close Sidebar"
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* Navigation Links List */}
                <nav className="links overflow-y-auto custom-scrollbar my-4 flex flex-col justify-start w-full gap-1 px-2.5">
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.link && item.title !== "Logout"
                        const isLogout = item.title === "Logout"

                        return (
                            <button
                                key={item.title}
                                onClick={() => handleNavigation(item)}
                                title={!isSidebarOpen ? item.title : undefined}
                                className={cn(
                                    "group py-2.5 px-3 flex items-center gap-3 text-sm font-sans rounded-xl text-left transition-all outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 hover:cursor-pointer",
                                    !isSidebarOpen && "md:justify-center md:px-0",
                                    isActive
                                        ? "bg-neutral-200/90 text-neutral-950 font-bold border-l-2 border-neutral-950 shadow-sm"
                                        : isLogout
                                            ? "text-neutral-600 font-medium hover:text-red-600 hover:bg-red-50 mt-6"
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

                {/* Footer User Info Indicator */}
                {isSidebarOpen && (
                    <div className="mt-auto w-full p-3 border-t border-neutral-200 shrink-0">
                        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-neutral-100/80 border border-neutral-200">
                            <div className="w-8 h-8 rounded-full bg-neutral-900 text-white text-xs font-bold flex items-center justify-center shrink-0 shadow-sm">
                                EX
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                                <span className="text-xs font-bold text-neutral-950 truncate">Evolexa User</span>
                                <span className="text-[11px] text-neutral-500 font-medium truncate">Job Tracker</span>
                            </div>
                        </div>
                    </div>
                )}
            </aside>

            <LogoutModal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                onConfirm={handleConfirmLogout}
            />
        </>
    )
}

export default SideBar
