import { useState } from "react"
import { useNavigate } from "react-router-dom"
import dashboard from "../../assets/icons/dashboard.svg"
import logout from "../../assets/icons/logout.svg"
import profile from "../../assets/icons/profile.svg"
import apps from "../../assets/icons/apps.svg"
import networknode from "../../assets/icons/networknode.svg"
import search from "../../assets/icons/search.svg"
import LogoutModal from "./LogoutModal"

const navItems = [
    { title: "Dashboard", icon: dashboard, link: "/dashboard" },
    { title: "Search Jobs", icon: search, link: "/jobsearch" },
    { title: "Applications", icon: apps, link: "/applications" },
    { title: "Profile", icon: profile, link: "/profile" },
    { title: "Network", icon: networknode, link: "/network" },
    { title: "Logout", icon: logout, link: "/login" },
]

const SideBar = ({ isSidebarOpen = true, onClose }) => {
    const navigate = useNavigate()
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
                    className="md:hidden fixed inset-0 bg-canvas/80 backdrop-blur-sm z-40"
                    aria-hidden="true"
                />
            )}

            {/* Sidebar Container */}
            <aside
                className={`fixed md:static inset-y-0 left-0 z-50 flex flex-col justify-start items-center border-r border-r-ink/10 bg-surface/95 md:bg-surface/50 backdrop-blur-md transition-all duration-300 ease-in-out shrink-0 bg-[radial-gradient(120%_100%_at_0%_0%,rgba(99,102,241,0.13)_0%,transparent_55%),linear-gradient(135deg,theme(colors.surface)_0%,theme(colors.canvas)_85%)] ${
                    isSidebarOpen
                        ? 'w-64 translate-x-0'
                        : '-translate-x-full md:translate-x-0 md:w-16'
                }`}
            >
                {/* Header / Logo */}
                <div className="logo overflow-hidden flex items-center justify-between px-4 h-16 w-full font-bold bg-gradient-to-br from-cyan to-ink bg-clip-text text-transparent tracking-tight font-display border-b border-b-ink/10 shrink-0">
                    <span className="text-xl sm:text-2xl truncate">
                        {isSidebarOpen ? "JobTracker" : "JT"}
                    </span>
                    {onClose && (
                        <button
                            onClick={onClose}
                            className="md:hidden text-muted-light hover:text-ink p-1 rounded-lg"
                            aria-label="Close Sidebar"
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* Nav Links */}
                <div className="links overflow-y-auto my-4 flex flex-col justify-start w-full gap-1 px-2">
                    {navItems.map((item) => (
                        <button
                            key={item.title}
                            onClick={() => handleNavigation(item)}
                            title={!isSidebarOpen ? item.title : undefined}
                            className={`py-2.5 px-3 flex items-center gap-3 text-sm font-mono hover:bg-indigo/15 hover:cursor-pointer rounded-xl text-left transition-all ${
                                !isSidebarOpen ? 'md:justify-center md:px-0' : ''
                            }`}
                        >
                            <img src={item.icon} alt={item.title} className="h-5 w-5 shrink-0" />
                            {isSidebarOpen && <span className="whitespace-nowrap truncate">{item.title}</span>}
                        </button>
                    ))}
                </div>
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

