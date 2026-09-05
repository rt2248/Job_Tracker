import { useState } from "react"
import SideBar from "../../components/dashboard_page/SideBar"
import TopBar from "../../components/dashboard_page/TopBar"
import KanbanColumn from "../../components/dashboard_page/KanbanColumn"
import JobDetailModal from "../../components/shared/JobDetailModal"
import { useJobs } from "../../hooks/useJobs"
import { STATUS_ORDER } from "../../constants/jobStatus"

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

  const { jobs, isLoading, error } = useJobs()
  const [selectedJob, setSelectedJob] = useState(null)

  const jobsByStatus = STATUS_ORDER.reduce((acc, status) => {
    acc[status] = jobs.filter((job) => job.status === status)
    return acc
  }, {})

  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      <SideBar isSidebarOpen={isSidebarOpen} />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar toggleSidebar={toggleSidebar} />
        <main className="flex-1 overflow-hidden p-6 flex flex-col">
          <h1 className="font-display text-2xl text-ink font-semibold mb-6 shrink-0">
            Dashboard
          </h1>

          {isLoading && (
            <p className="text-muted-light font-mono text-sm">Loading jobs...</p>
          )}

          {error && (
            <p className="text-red font-mono text-sm">Error: {error}</p>
          )}

          {!isLoading && !error && (
            <div className="flex gap-4 overflow-x-auto flex-1 pb-2">
              {STATUS_ORDER.map((status) => (
                <KanbanColumn
                  key={status}
                  status={status}
                  jobs={jobsByStatus[status]}
                  onCardClick={setSelectedJob}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      <JobDetailModal job={selectedJob} onClose={() => setSelectedJob(null)} />
    </div>
  )
}

export default Dashboard