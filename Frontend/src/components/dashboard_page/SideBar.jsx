import dashboard from "../../assets/icons/dashboard.svg"
import logout from "../../assets/icons/logout.svg"
import profile from "../../assets/icons/profile.svg"
import apps from "../../assets/icons/apps.svg"
import networknode from "../../assets/icons/networknode.svg"

const SideBar = ({ isSidebarOpen = true }) => {
    return (
        <div className={`h-[100vh] ${isSidebarOpen ? 'w-[15vw]' : 'w-[3vw] min-w-[60px]'} shrink-0 bg-surface/50 flex flex-col justify-start items-center border-r border-r-ink/10 bg-[radial-gradient(120%_100%_at_0%_0%,rgba(99,102,241,0.13)_0%,transparent_55%),linear-gradient(135deg,theme(colors.surface)_0%,theme(colors.canvas)_85%)] transition-all duration-300 ease-in-out`}>

            <div className="logo flex items-center justify-center h-[8vh] w-full text-3xl font-bold bg-gradient-to-br from-cyan to-ink bg-clip-text text-transparent tracking-tight font-display border-b border-b-ink/10 whitespace-nowrap overflow-hidden">
                {isSidebarOpen ? "JobTracker" : "JT"}
            </div>

            <div className="links my-6 flex flex-col justify-start w-full gap-1">
                {/* Dashboard Button */}
                <button
                    title={!isSidebarOpen ? "Dashboard" : undefined}
                    className={`py-2 px-2 mx-2 flex items-center gap-2 text-md font-mono hover:bg-indigo/15 hover:cursor-pointer rounded-xl text-left transition-all ease-linear ${!isSidebarOpen ? 'justify-center px-0' : 'px-4'
                        }`}
                >
                    <img src={dashboard} alt="Dashboard" className="h-5 w-5 shrink-0" />
                    {isSidebarOpen && <span className="whitespace-nowrap transition-all duration-300">Dashboard</span>}
                </button>

                {/* Profile Button */}
                <button
                    title={!isSidebarOpen ? "Profile" : undefined}
                    className={`py-2 px-2 mx-2 flex items-center gap-2 text-md font-mono hover:bg-indigo/15 hover:cursor-pointer rounded-xl text-left transition-all ease-linear ${!isSidebarOpen ? 'justify-center px-0' : 'px-4'
                        }`}
                >
                    <img src={profile} alt="Profile" className="h-5 w-5 shrink-0" />
                    {isSidebarOpen && <span className="whitespace-nowrap transition-all duration-300">Profile</span>}
                </button>

                {/* Applications Button */}
                <button
                    title={!isSidebarOpen ? "Applications" : undefined}
                    className={`py-2 px-2 mx-2 flex items-center gap-2 text-md font-mono hover:bg-indigo/15 hover:cursor-pointer rounded-xl text-left transition-all ease-linear ${!isSidebarOpen ? 'justify-center px-0' : 'px-4'
                        }`}
                >
                    <img src={apps} alt="Applications" className="h-5 w-5 shrink-0" />
                    {isSidebarOpen && <span className="whitespace-nowrap transition-all duration-300">Applications</span>}
                </button>

                {/* Network Button */}
                <button
                    title={!isSidebarOpen ? "Network" : undefined}
                    className={`py-2 px-2 mx-2 flex items-center gap-2 text-md font-mono hover:bg-indigo/15 hover:cursor-pointer rounded-xl text-left transition-all ease-linear ${!isSidebarOpen ? 'justify-center px-0' : 'px-4'
                        }`}
                >
                    <img src={networknode} alt="Network" className="h-5 w-5 shrink-0" />
                    {isSidebarOpen && <span className="whitespace-nowrap transition-all duration-300">Network</span>}
                </button>

                {/* Logout Button */}
                <button
                    title={!isSidebarOpen ? "Logout" : undefined}
                    className={`py-2 px-2 mx-2 flex items-center gap-2 text-md font-mono hover:bg-indigo/15 hover:cursor-pointer rounded-xl text-left transition-all ease-linear ${!isSidebarOpen ? 'justify-center px-0' : 'px-4'
                        }`}
                >
                    <img src={logout} alt="Logout" className="h-5 w-5 shrink-0" />
                    {isSidebarOpen && <span className="whitespace-nowrap transition-all duration-300">Logout</span>}
                </button>
            </div>

        </div>
    )
}

export default SideBar
