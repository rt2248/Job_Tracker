import dashboard from "../../assets/icons/dashboard.svg"
import logout from "../../assets/icons/logout.svg"
import profile from "../../assets/icons/profile.svg"
import apps from "../../assets/icons/apps.svg"
import networknode from "../../assets/icons/networknode.svg"
const SideBar = ({ isSidebarOpen = true }) => {
    const navItems = [
        { name: "Dashboard", icon: dashboard },
        { name: "Profile", icon: profile },
        { name: "Applications", icon: apps },
        { name: "Network", icon: networknode },
        { name: "Logout", icon: logout },
    ]

    return (
        <div className={`h-[100vh] ${isSidebarOpen ? 'w-[17vw]' : 'w-[5vw] min-w-[60px]'} bg-surface/50 flex flex-col justify-start items-center border-r border-r-ink/10 bg-[radial-gradient(120%_100%_at_0%_0%,rgba(99,102,241,0.13)_0%,transparent_55%),linear-gradient(135deg,theme(colors.surface)_0%,theme(colors.canvas)_85%)] transition-all duration-300 ease-in-out`}>

            <div className="flex items-center justify-center logo h-[8vh] w-full text-3xl font-bold bg-gradient-to-br from-cyan to-ink bg-clip-text text-transparent tracking-tight font-display border-b border-b-ink/10 whitespace-nowrap overflow-hidden">
                {isSidebarOpen ? "JobTracker" : "JT"}
            </div>

            <div className="links my-6 flex flex-col justify-start w-full gap-1">
                {navItems.map((item) => (
                    <button
                        key={item.name}
                        title={!isSidebarOpen ? item.name : undefined}
                        className={`py-2 px-4 flex items-center gap-2 mx-2 text-sm font-mono hover:bg-indigo/15 hover:cursor-pointer rounded-xl text-left transition-all ease-linear ${
                            !isSidebarOpen ? 'justify-center px-0' : ''
                        }`}
                    >
                        <img src={item.icon} alt={item.name} className="h-4 w-4 shrink-0" />
                        {isSidebarOpen && (
                            <span className="whitespace-nowrap transition-all duration-200">
                                {item.name}
                            </span>
                        )}
                    </button>
                ))}
            </div>

        </div>
    )
}

export default SideBar