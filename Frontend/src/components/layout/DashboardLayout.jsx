import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import SideBar from "../dashboard_page/SideBar";
import useAppTheme from "../../hooks/useAppTheme";

export default function DashboardLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();
  const { theme } = useAppTheme();

  return (
    <div className="flex h-screen overflow-hidden bg-canvas text-ink font-sans" data-theme={theme}>
      <SideBar
        isSidebarOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onExpand={() => setIsSidebarOpen(true)}
        onCollapse={() => setIsSidebarOpen(false)}
      />
      <div className="flex flex-col flex-1 min-w-0 h-screen md:h-[calc(100vh-1.5rem)] md:my-3 md:mr-3 md:ml-[88px] md:rounded-3xl md:border md:border-border-primary bg-surface md:dashboard-window overflow-hidden">

        <div key={location.pathname} className="flex-1 flex flex-col min-w-0 overflow-hidden animate-page-enter">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
