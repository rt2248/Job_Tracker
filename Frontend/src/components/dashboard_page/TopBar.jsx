import React from "react"
import dashboardIcon from "../../assets/icons/dashboard.svg"
import sidebarIcon from "../../assets/icons/sidebar.svg"
import notificationIcon from "../../assets/icons/notification.svg"

const TopBar = ({ toggleSidebar, title = "Dashboard" }) => {
    return (
        <header className="h-16 shrink-0 border-b border-border-primary bg-surface/80 backdrop-blur-md flex items-center justify-between px-3 sm:px-6 transition-all duration-200">
            <div className="flex flex-row items-center gap-2 sm:gap-3.5 min-w-0">
                <button
                    className="md:hidden h-9 w-9 p-1.5 hover:cursor-pointer hover:bg-surface-secondary rounded-lg border border-border-subtle transition-all flex items-center justify-center text-ink shrink-0 focus-visible:ring-2 focus-visible:ring-indigo/40 outline-none"
                    onClick={toggleSidebar}
                    aria-label="Toggle Sidebar"
                >
                    <img src={sidebarIcon} alt="" className="h-4 w-4 sm:h-5 sm:w-5 opacity-80" />
                </button>
                <div className="md:hidden h-5 w-[1px] bg-border-subtle shrink-0" />
                <div className="text-base sm:text-lg font-display font-semibold flex flex-row items-center gap-2.5 text-ink truncate">
                    <img src={dashboardIcon} alt="" className="h-4 w-4 sm:h-5 sm:w-5 shrink-0 opacity-70" />
                    <span className="truncate">{title}</span>
                </div>
            </div>
            <div className="flex flex-row items-center gap-2 sm:gap-3 shrink-0">
                <button
                    className="h-9 w-9 p-1.5 bg-surface-secondary border border-border-primary hover:bg-surface-overlay hover:border-border-accent/40 rounded-lg transition-all flex items-center justify-center hover:cursor-pointer focus-visible:ring-2 focus-visible:ring-indigo/40 outline-none"
                    aria-label="Notifications"
                >
                    <img src={notificationIcon} className="h-4 w-4 sm:h-5 sm:w-5 opacity-80" alt="" />
                </button>

            </div>
        </header>
    )
}

export default TopBar