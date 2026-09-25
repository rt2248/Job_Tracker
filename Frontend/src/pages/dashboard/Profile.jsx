import { useState } from "react"
import SideBar from "../../components/dashboard_page/SideBar"
import TopBar from "../../components/dashboard_page/TopBar"

const Profile = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

  return (
    <div className="flex h-screen overflow-hidden bg-canvas text-ink font-body">
      <SideBar isSidebarOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar toggleSidebar={toggleSidebar} title="Profile" />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto flex flex-col gap-6">
            <div>
              <h1 className="font-display text-xl sm:text-2xl text-ink font-semibold mb-2">
                User Profile
              </h1>
              <p className="text-muted-light text-sm">
                Manage your account credentials, preferences, and resume attachments.
              </p>
            </div>

            {/* Profile Overview Card */}
            <div className="bg-surface border border-surface-2 rounded-2xl p-6 flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-indigo to-cyan flex items-center justify-center text-white text-2xl font-bold font-display shadow-lg shrink-0">
                PF
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-xl font-bold font-display text-ink">User Account</h2>
                <p className="text-muted-light font-mono text-sm mt-0.5">user@example.com</p>
                <div className="mt-3 flex flex-wrap justify-center sm:justify-start gap-2">
                  <span className="px-3 py-1 rounded-full text-xs font-mono bg-indigo/15 text-indigo-light border border-indigo/30">
                    Pro Plan
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-mono bg-green/15 text-green border border-green/30">
                    Active
                  </span>
                </div>
              </div>
              <button className="px-4 py-2 rounded-xl text-xs sm:text-sm font-medium border border-indigo/25 text-muted-light hover:text-ink hover:bg-indigo/10 transition-all shrink-0">
                Edit Profile
              </button>
            </div>

            {/* General Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
              <div className="bg-surface border border-surface-2 rounded-2xl p-6">
                <h3 className="text-base font-semibold font-display text-ink mb-4">Account Information</h3>
                <div className="flex flex-col gap-3.5 text-sm">
                  <div>
                    <span className="text-muted text-xs font-mono block">Full Name</span>
                    <span className="text-ink font-medium">User Account</span>
                  </div>
                  <div>
                    <span className="text-muted text-xs font-mono block">Username</span>
                    <span className="text-ink font-mono">user_123</span>
                  </div>
                  <div>
                    <span className="text-muted text-xs font-mono block">Primary Email</span>
                    <span className="text-ink font-mono">user@example.com</span>
                  </div>
                </div>
              </div>

              <div className="bg-surface border border-surface-2 rounded-2xl p-6">
                <h3 className="text-base font-semibold font-display text-ink mb-4">Resume & Documents</h3>
                <div className="flex flex-col gap-3">
                  <div className="p-3 rounded-xl bg-canvas border border-surface-2 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="text-cyan text-sm">📄</span>
                      <span className="text-xs font-mono text-ink truncate">Software_Engine_Resume_2025.pdf</span>
                    </div>
                    <span className="text-[11px] font-mono text-muted shrink-0">Default</span>
                  </div>
                  <button className="mt-2 w-full py-2.5 rounded-xl text-xs sm:text-sm font-semibold border border-dashed border-indigo/30 text-indigo-light hover:bg-indigo/10 transition-all flex items-center justify-center gap-2">
                    + Upload New Resume
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Profile
