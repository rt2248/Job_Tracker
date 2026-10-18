import React, { useState, useEffect, useMemo } from "react"
import SideBar from "../../components/dashboard_page/SideBar"
import TopBar from "../../components/dashboard_page/TopBar"
import KanbanColumn from "../../components/dashboard_page/KanbanColumn"
import JobDetailModal from "../../components/shared/JobDetailModal"
import Card from "../../components/shared/Card"
import Input from "../../components/shared/Input"
import Select from "../../components/shared/Select"
import Button from "../../components/shared/Button"
import Badge from "../../components/shared/Badge"
import { useJobs } from "../../hooks/useJobs"
import { useToast } from "../../hooks/useToast"
import { getApiUrl } from "../../utils/config"
import { STATUS_ORDER } from "../../constants/jobStatus"

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

  const { jobs: initialJobs, isLoading, error } = useJobs()
  const [jobsList, setJobsList] = useState([])
  const [selectedJob, setSelectedJob] = useState(null)
  const toast = useToast()
  
  // Dashboard Search & Filtering State
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState("")

  // Sync loaded jobs into local state for interactive drag & drop moves
  useEffect(() => {
    if (initialJobs) {
      setJobsList(initialJobs)
    }
  }, [initialJobs])

  // Filter jobs dynamically by search query & job type
  const filteredJobs = useMemo(() => {
    return jobsList.filter((job) => {
      const matchesSearch =
        !searchQuery ||
        job.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.company?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesType = !selectedType || job.jobType === selectedType

      return matchesSearch && matchesType
    })
  }, [jobsList, searchQuery, selectedType])

  // Group filtered jobs by status column
  const jobsByStatus = useMemo(() => {
    return STATUS_ORDER.reduce((acc, status) => {
      acc[status] = filteredJobs.filter((job) => job.status === status)
      return acc
    }, {})
  }, [filteredJobs])

  // Calculate real summary metrics from current application data
  const metrics = useMemo(() => {
    const total = jobsList.length
    const active = jobsList.filter((j) => ["applied", "oa", "interview"].includes(j.status)).length
    const interviews = jobsList.filter((j) => j.status === "interview").length
    const offers = jobsList.filter((j) => ["offer", "accepted"].includes(j.status)).length

    return { total, active, interviews, offers }
  }, [jobsList])

  // Interactive Drag & Drop status update handler with backend persistence
  const handleDropCard = async (targetStatus, jobId) => {
    if (!jobId || !targetStatus) return

    const currentJob = jobsList.find((j) => String(j.id) === String(jobId))
    if (!currentJob || currentJob.status === targetStatus) return

    const previousJobs = [...jobsList]

    // Optimistic update
    setJobsList((prevJobs) =>
      prevJobs.map((j) =>
        String(j.id) === String(jobId)
          ? {
              ...j,
              status: targetStatus,
              appliedDate:
                j.status === "saved" && targetStatus === "applied" && !j.appliedDate
                  ? new Date().toISOString().split("T")[0]
                  : j.appliedDate,
            }
          : j
      )
    )

    const token = localStorage.getItem("token")
    if (!token) return

    try {
      const response = await fetch(getApiUrl(`/api/jobs/${jobId}/status`), {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: targetStatus }),
      })

      const data = await response.json()

      if (!response.ok) {
        // Rollback on failure
        setJobsList(previousJobs)
        toast.error(data.message || "Failed to update application status")
        return
      }

      if (data.job) {
        setJobsList((prevJobs) =>
          prevJobs.map((j) => (String(j.id) === String(jobId) ? { ...j, ...data.job } : j))
        )
      }
    } catch (err) {
      console.error("Error updating job status:", err)
      setJobsList(previousJobs)
      toast.error("Network error while updating status")
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-canvas text-ink font-sans">
      <SideBar isSidebarOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex flex-col flex-1 min-w-0">
        <TopBar toggleSidebar={toggleSidebar} title="Dashboard" />
        <main className="flex-1 overflow-hidden p-4 sm:p-6 lg:p-8 flex flex-col min-w-0">
          
          {/* Dashboard Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 shrink-0">
            <div>
              <h1 className="font-display text-xl sm:text-2xl text-ink font-semibold tracking-tight">
                Application Pipeline
              </h1>
              <p className="text-muted text-xs sm:text-sm mt-0.5 font-sans">
                Track, manage, and move your career opportunities through each stage.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="indigo" size="md">
                {metrics.active} Active Applications
              </Badge>
            </div>
          </div>

          {/* Metric Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 shrink-0">
            <Card className="p-3.5 sm:p-4 bg-surface/80 border-border-primary">
              <div className="flex items-center justify-between">
                <span className="text-muted text-xs font-sans font-medium uppercase tracking-wider">Total Applications</span>
                <span className="w-2 h-2 rounded-full bg-indigo" />
              </div>
              <p className="font-mono text-2xl sm:text-3xl font-bold text-ink mt-2">{metrics.total}</p>
            </Card>

            <Card className="p-3.5 sm:p-4 bg-surface/80 border-border-primary">
              <div className="flex items-center justify-between">
                <span className="text-muted text-xs font-sans font-medium uppercase tracking-wider">In Pipeline</span>
                <span className="w-2 h-2 rounded-full bg-amber" />
              </div>
              <p className="font-mono text-2xl sm:text-3xl font-bold text-ink mt-2">{metrics.active}</p>
            </Card>

            <Card className="p-3.5 sm:p-4 bg-surface/80 border-border-primary">
              <div className="flex items-center justify-between">
                <span className="text-muted text-xs font-sans font-medium uppercase tracking-wider">Interviews</span>
                <span className="w-2 h-2 rounded-full bg-violet" />
              </div>
              <p className="font-mono text-2xl sm:text-3xl font-bold text-ink mt-2">{metrics.interviews}</p>
            </Card>

            <Card className="p-3.5 sm:p-4 bg-surface/80 border-border-primary">
              <div className="flex items-center justify-between">
                <span className="text-muted text-xs font-sans font-medium uppercase tracking-wider">Offers & Accepted</span>
                <span className="w-2 h-2 rounded-full bg-green" />
              </div>
              <p className="font-mono text-2xl sm:text-3xl font-bold text-cyan mt-2">{metrics.offers}</p>
            </Card>
          </div>

          {/* Controls Bar: Search & Filter */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6 shrink-0 bg-surface/60 p-2.5 sm:p-3 rounded-xl border border-border-primary">
            <div className="flex-1 min-w-[200px]">
              <Input
                placeholder="Search pipeline by role or company..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 text-xs sm:text-sm bg-surface-secondary/90"
              />
            </div>
            <div className="w-full sm:w-48">
              <Select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                placeholder="All Job Types"
                className="h-9 text-xs sm:text-sm bg-surface-secondary/90"
              >
                <option value="">All Job Types</option>
                <option value="fulltime">Full Time</option>
                <option value="parttime">Part Time</option>
                <option value="internship">Internship</option>
                <option value="contract">Contract</option>
              </Select>
            </div>
            {(searchQuery || selectedType) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery("")
                  setSelectedType("")
                }}
                className="text-xs text-muted hover:text-ink shrink-0"
              >
                Reset Filters
              </Button>
            )}
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-8 h-8 rounded-full border-2 border-indigo border-t-transparent animate-spin mb-3" />
              <p className="text-muted text-sm font-sans">Loading application pipeline...</p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="p-3 rounded-xl bg-red/10 border border-red/30 text-red mb-3">
                ⚠️ {error}
              </div>
              <p className="text-muted text-xs font-sans">Please refresh the page or check your connection.</p>
            </div>
          )}

          {/* Kanban Board Area */}
          {!isLoading && !error && (
            <div className="flex gap-4 sm:gap-5 overflow-x-auto flex-1 pb-4 custom-scrollbar snap-x min-w-0">
              {STATUS_ORDER.map((status) => (
                <div key={status} className="snap-start shrink-0">
                  <KanbanColumn
                    status={status}
                    jobs={jobsByStatus[status] || []}
                    onCardClick={setSelectedJob}
                    onDropCard={handleDropCard}
                  />
                </div>
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