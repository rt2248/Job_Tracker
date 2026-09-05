import { useState } from "react"
import { useNavigate } from "react-router-dom"
import dashboard from "../../assets/icons/dashboard.svg"
import logout from "../../assets/icons/logout.svg"
import profile from "../../assets/icons/profile.svg"
import apps from "../../assets/icons/apps.svg"
import networknode from "../../assets/icons/networknode.svg"
import LogoutModal from "./LogoutModal"

const navItems = [
    { title: "Dashboard", icon: dashboard, link: "/dashboard" },
    { title: "Profile", icon: profile, link: "/profile" },
    { title: "Applications", icon: apps, link: "/applications" },
    { title: "Network", icon: networknode, link: "/network" },
    { title: "Logout", icon: logout, link: "/login" },
]

const SideBar = ({ isSidebarOpen = true }) => {
    const navigate = useNavigate()
    const [showLogoutModal, setShowLogoutModal] = useState(false)

    const handleNavigation = (item) => {
        if (item.title === "Logout") {
            setShowLogoutModal(true)
            return
        }
        navigate(item.link)
    }

    const handleConfirmLogout = () => {
        localStorage.removeItem("token")
        setShowLogoutModal(false)
        navigate("/login")
    }

    return (
        <>
            <div className={`h-[100vh] ${isSidebarOpen ? 'w-[15vw]' : 'w-[3vw] min-w-[60px]'} shrink-0 bg-surface/50 flex flex-col justify-start items-center border-r border-r-ink/10 bg-[radial-gradient(120%_100%_at_0%_0%,rgba(99,102,241,0.13)_0%,transparent_55%),linear-gradient(135deg,theme(colors.surface)_0%,theme(colors.canvas)_85%)] transition-all duration-300 ease-in-out`}>

                <div className="logo overflow-x-hidden flex items-center justify-center h-[8vh] w-full text-3xl font-bold bg-gradient-to-br from-cyan to-ink bg-clip-text text-transparent tracking-tight font-display border-b border-b-ink/10 whitespace-nowrap">
                    {isSidebarOpen ? "JobTracker" : "JT"}
                </div>

                <div className="links overflow-x-hidden my-6 flex flex-col justify-start w-full gap-1">
                    {navItems.map((item) => (
                        <button
                            key={item.title}
                            onClick={() => handleNavigation(item)}
                            title={!isSidebarOpen ? item.title : undefined}
                            className={`py-2 px-2 mx-2 flex items-center gap-2 text-md font-mono hover:bg-indigo/15 hover:cursor-pointer rounded-xl text-left transition-all ease-linear ${!isSidebarOpen ? 'justify-center px-0' : 'px-4'
                                }`}
                        >
                            <img src={item.icon} alt={item.title} className="h-5 w-5 shrink-0" />
                            {isSidebarOpen && <span className="whitespace-nowrap transition-all duration-300">{item.title}</span>}
                        </button>
                    ))}
                </div>

            </div>

            <LogoutModal
                isOpen={showLogoutModal}
                onClose={() => setShowLogoutModal(false)}
                onConfirm={handleConfirmLogout}
            />
        </>
    )
}

export default SideBar

