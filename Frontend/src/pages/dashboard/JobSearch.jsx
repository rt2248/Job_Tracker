import { useState } from "react"
import SideBar from "../../components/dashboard_page/SideBar"
import TopBar from "../../components/dashboard_page/TopBar"


const JobSearch = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)
    return (
        <div className="flex h-screen overflow-hidden bg-canvas">
            <SideBar isSidebarOpen={isSidebarOpen} />
            <div className="flex flex-col flex-1 min-w-0">
                <TopBar toggleSidebar={toggleSidebar} />
                <main>

                </main>
            </div>
        </div>
    )
}

export default JobSearch