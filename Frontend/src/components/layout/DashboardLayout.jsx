import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import SideBar from "../dashboard_page/SideBar";
import TopBar from "../dashboard_page/TopBar";

const PAGE_TITLES = {
  "/dashboard": "Dashboard",
  "/jobsearch": "Job Search",
  "/applications": "Applications",
  "/network": "Network",
  "/profile": "Profile",
};

export default function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const toggleSidebar = () => setIsSidebarOpen((prev) => !prev);

  const title = PAGE_TITLES[location.pathname] || "Dashboard";

  return (
    <div className="flex h-screen overflow-hidden bg-canvas text-ink font-sans">
      <SideBar isSidebarOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar toggleSidebar={toggleSidebar} title={title} />
        <div key={location.pathname} className="flex-1 flex flex-col min-w-0 overflow-hidden animate-page-enter">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
