import { useState } from "react"
import SideBar from "../components/dashboard_page/SideBar"
import TopBar from "../components/dashboard_page/TopBar"

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  return (
    <div className="flex">
      <SideBar isSidebarOpen={isSidebarOpen} />
      <TopBar toggleSidebar={toggleSidebar} />
    </div>
  )
}

export default Dashboard
