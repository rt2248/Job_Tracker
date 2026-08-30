import { useState } from "react"
import SideBar from "../../components/dashboard_page/SideBar"
import TopBar from "../../components/dashboard_page/TopBar"
import JobCard from "../../components/applications_page/JobCard"
import { useJobs } from "../../hooks/useJobs"

const Applications = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

  const { jobs, isLoading, error } = useJobs()

  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      <SideBar isSidebarOpen={isSidebarOpen} />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar toggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-y-auto p-6">
          <h1 className="font-display text-2xl text-ink font-semibold mb-6">
            Applications
          </h1>

          {isLoading && (
            <p className="text-muted-light font-mono text-sm">Loading jobs...</p>
          )}

          {error && (
            <p className="text-red font-mono text-sm">Error: {error}</p>
          )}

          {!isLoading && !error && jobs.length === 0 && (
            <p className="text-muted-light font-mono text-sm">No applications yet.</p>
          )}

          {!isLoading && !error && jobs.length > 0 && (
            <div className="flex flex-col gap-3">
              {jobs.map((job) => (
                <JobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default Applications