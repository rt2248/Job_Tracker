import { useState } from "react"
import SideBar from "../../components/dashboard_page/SideBar"
import TopBar from "../../components/dashboard_page/TopBar"

const Profile = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

  return (
    <div className="flex h-screen overflow-hidden">
      <SideBar isSidebarOpen={isSidebarOpen} />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar toggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-y-auto p-6">
          <h1 className="text-2xl font-bold">Profile Page</h1>
        </main>
      </div>
    </div>
  )
}

export default Profile
