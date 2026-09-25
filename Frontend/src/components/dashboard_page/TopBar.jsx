import dashboard from "../../assets/icons/dashboard.svg"
import sidebar from "../../assets/icons/sidebar.svg"
import notification from "../../assets/icons/notification.svg"

const TopBar = ({ toggleSidebar, title = "Dashboard" }) => {
    return (
        <header className="h-16 shrink-0 border-b border-b-ink/10 bg-surface/50 backdrop-blur-md flex items-center justify-between px-3 sm:px-6 transition-all duration-300 ease-in-out">
            <div className="flex flex-row items-center gap-2 sm:gap-3">
                <button
                    className="h-9 w-9 p-1.5 hover:cursor-pointer hover:bg-indigo/15 rounded-lg transition-all flex items-center justify-center text-ink shrink-0"
                    onClick={toggleSidebar}
                    aria-label="Toggle Sidebar"
                >
                    <img src={sidebar} alt="Toggle Sidebar" className="h-5 w-5" />
                </button>
                <div className="h-5 w-[1px] bg-ink/20 shrink-0" />
                <div className="text-base sm:text-lg font-mono flex flex-row items-center gap-2 font-medium text-ink truncate">
                    <img src={dashboard} alt="" className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
                    <span className="truncate">{title}</span>
                </div>
            </div>
            <div className="flex flex-row items-center gap-2 sm:gap-3 shrink-0">
                <button
                    className="h-9 w-9 p-1.5 bg-indigo/10 border border-ink/15 hover:cursor-pointer hover:bg-indigo/20 hover:border-ink/30 rounded-lg transition-all flex items-center justify-center"
                    aria-label="Notifications"
                >
                    <img src={notification} className="h-5 w-5" alt="Notifications" />
                </button>
                <div className="flex justify-center items-center h-9 w-9 bg-gradient-to-br from-indigo to-cyan text-white text-xs font-semibold rounded-full shadow-md">
                    PF
                </div>
            </div>
        </header>
    )
}

export default TopBar