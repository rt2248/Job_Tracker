import { useState } from "react"
import SideBar from "../../components/dashboard_page/SideBar"
import TopBar from "../../components/dashboard_page/TopBar"

const Network = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

  return (
    <div className="flex h-screen overflow-hidden bg-canvas text-ink font-body">
      <SideBar isSidebarOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar toggleSidebar={toggleSidebar} title="Network" />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-5xl mx-auto">
            <h1 className="font-display text-xl sm:text-2xl text-ink font-semibold mb-2">
              Professional Network
            </h1>
            <p className="text-muted-light text-sm mb-6">
              Track contacts, referrals, and recruiters connected to your job search.
            </p>

            <div className="bg-surface border border-surface-2 rounded-2xl p-6 sm:p-8 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-2xl bg-indigo/10 border border-indigo/20 flex items-center justify-center text-indigo-light mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-ink font-display mb-2">No Contacts Added Yet</h2>
              <p className="text-muted-light text-xs sm:text-sm max-w-md mb-6 leading-relaxed">
                Connect with interviewers, recruiters, and referral contacts to manage your outreach effectively.
              </p>
              <button className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-br from-indigo to-[#4f46e5] text-white hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all">
                + Add New Contact
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Network
