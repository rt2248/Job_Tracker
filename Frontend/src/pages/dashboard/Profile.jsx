import React, { useState } from "react"
import SideBar from "../../components/dashboard_page/SideBar"
import TopBar from "../../components/dashboard_page/TopBar"
import Card from "../../components/shared/Card"
import Button from "../../components/shared/Button"
import Badge from "../../components/shared/Badge"

const Profile = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

  return (
    <div className="flex h-screen overflow-hidden bg-canvas text-ink font-sans">
      <SideBar isSidebarOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar toggleSidebar={toggleSidebar} title="Profile" />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
          <div className="max-w-4xl mx-auto flex flex-col gap-6">
            
            {/* Header Section */}
            <div>
              <h1 className="font-display text-xl sm:text-2xl text-ink font-semibold tracking-tight">
                User Profile
              </h1>
              <p className="text-muted text-xs sm:text-sm mt-0.5 font-sans">
                Manage your account credentials, preferences, and resume attachments.
              </p>
            </div>

            {/* Profile Overview Card */}
            <Card className="bg-surface/80 border-border-primary rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo to-cyan flex items-center justify-center text-white text-2xl font-bold font-display shadow-md border border-indigo/30 shrink-0">
                PF
              </div>
              <div className="flex-1 text-center sm:text-left min-w-0">
                <h2 className="text-xl font-bold font-display text-ink truncate">User Account</h2>
                <p className="text-muted font-mono text-xs sm:text-sm mt-0.5 truncate">user@example.com</p>
                <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-2">
                  <Badge variant="indigo" size="sm">
                    Pro Plan
                  </Badge>
                  <Badge variant="emerald" size="sm">
                    Active
                  </Badge>
                </div>
              </div>
              <Button variant="secondary" size="sm" className="shrink-0">
                Edit Profile
              </Button>
            </Card>

            {/* General Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              
              {/* Account Information Card */}
              <Card className="bg-surface/80 border-border-primary p-5 sm:p-6">
                <h3 className="text-base font-semibold font-display text-ink mb-4">
                  Account Information
                </h3>
                <div className="flex flex-col gap-3.5 text-sm font-sans">
                  <div>
                    <span className="text-muted text-xs uppercase tracking-wider block font-medium">Full Name</span>
                    <span className="text-ink font-medium mt-0.5 block">User Account</span>
                  </div>
                  <div className="pt-3 border-t border-border-subtle">
                    <span className="text-muted text-xs uppercase tracking-wider block font-medium">Username</span>
                    <span className="text-ink font-mono mt-0.5 block">user_123</span>
                  </div>
                  <div className="pt-3 border-t border-border-subtle">
                    <span className="text-muted text-xs uppercase tracking-wider block font-medium">Primary Email</span>
                    <span className="text-ink font-mono mt-0.5 block">user@example.com</span>
                  </div>
                </div>
              </Card>

              {/* Resume & Documents Card */}
              <Card className="bg-surface/80 border-border-primary p-5 sm:p-6">
                <h3 className="text-base font-semibold font-display text-ink mb-4">
                  Resume & Documents
                </h3>
                <div className="flex flex-col gap-3">
                  <div className="p-3.5 rounded-xl bg-surface-secondary/70 border border-border-primary flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-cyan text-sm">📄</span>
                      <span className="text-xs font-mono text-ink truncate">Software_Engine_Resume_2025.pdf</span>
                    </div>
                    <Badge variant="subtle" size="sm" className="shrink-0">Default</Badge>
                  </div>
                  
                  <Button
                    variant="outline"
                    className="mt-2 w-full py-2.5 border-dashed border-indigo/40 text-indigo hover:bg-indigo/10 transition-colors"
                  >
                    + Upload New Resume
                  </Button>
                </div>
              </Card>

            </div>

          </div>
        </main>
      </div>
    </div>
  )
}

export default Profile
