import React, { useState, useEffect, useMemo, useRef } from "react"
import KanbanColumn from "../../components/dashboard_page/KanbanColumn"
import JobDetailModal from "../../components/shared/JobDetailModal"
import Input from "../../components/shared/Input"
import Select from "../../components/shared/Select"
import Button from "../../components/shared/Button"
import ThemeToggleButton from "../../components/shared/ThemeToggleButton"
import DashboardInsightsSection from "../../components/dashboard_page/DashboardInsightsSection"
import DashboardMetricStrip from "../../components/dashboard_page/DashboardMetricStrip"
import NextBestActionCard from "../../components/dashboard_page/NextBestActionCard"
import UpcomingDeadlinesCard from "../../components/dashboard_page/UpcomingDeadlinesCard"
import PipelineJourneyBar from "../../components/dashboard_page/PipelineJourneyBar"
import { useJobs } from "../../hooks/useJobs"
import useInsights from "../../hooks/useInsights"
import { useToast } from "../../hooks/useToast"
import { getApiUrl } from "../../utils/config"
import { STATUS_ORDER } from "../../constants/jobStatus"

const Dashboard = () => {
  const { jobs: initialJobs, isLoading, error } = useJobs()
  const [jobsList, setJobsList] = useState(initialJobs || [])
  const [selectedJob, setSelectedJob] = useState(null)
  const [selectedStage, setSelectedStage] = useState(null)
  const boardScrollRef = useRef(null)
  const toast = useToast()

  // Shared Insights summary hook for Next Best Action, Metrics Sparkline & Analytics Deck
  const insightsState = useInsights({
    initialRange: "30d",
    staleDays: 14,
    summaryOnly: true,
  })
  const { summary, isLoading: isInsightsLoading, refetch: refetchInsights } = insightsState

  // Dashboard Search & Filtering State
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState("")

  // Sync loaded jobs into local state for interactive drag & drop moves
  useEffect(() => {
    if (initialJobs) {
      setJobsList(initialJobs)
    }
  }, [initialJobs])

  const handleStageSelect = (stage) => {
    setSelectedStage(stage)
    if (stage) {
      setTimeout(() => {
        const el = document.getElementById(`kanban-col-${stage}`)
        if (el) {
          el.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" })
        }
      }, 100)
    }
  }

  // Smooth horizontal keyboard navigation when the Pipeline Board region is focused
  const handleBoardKeyDown = (e) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return
    if (e.altKey || e.ctrlKey || e.metaKey) return

    const target = e.target
    if (
      target !== e.currentTarget &&
      target?.closest?.(
        "input, textarea, select, button, a, summary, [role='button'], [role='menuitem'], [role='option'], [contenteditable='true']"
      )
    ) {
      return
    }

    const container = boardScrollRef.current
    if (!container || container.scrollWidth <= container.clientWidth) return

    e.preventDefault()
    const firstCol = container.firstElementChild
    const step = firstCol ? firstCol.getBoundingClientRect().width + 20 : 340
    const direction = e.key === "ArrowRight" ? 1 : -1

    container.scrollBy({
      left: direction * step,
      behavior: window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches
        ? "auto"
        : "smooth",
    })
  }

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
        setJobsList(previousJobs)
        toast.error(data.message || "Failed to update application status")
        return
      }

      if (data.job) {
        setJobsList((prevJobs) =>
          prevJobs.map((j) => (String(j.id) === String(jobId) ? { ...j, ...data.job } : j))
        )
      }
      refetchInsights?.()
    } catch (err) {
      console.error("Error updating job status:", err)
      setJobsList(previousJobs)
      toast.error("Network error while updating status")
    }
  }

  return (
    <>
      <main className="flex-1 overflow-y-auto custom-scrollbar px-4 py-5 sm:px-6 sm:py-7 lg:px-8 lg:py-10 flex flex-col min-w-0">
        {/* Dashboard Header Section */}
        <header className="flex items-start justify-between gap-4 mb-10 shrink-0">
          <div>
            <span className="font-mono text-[13px] uppercase tracking-widest text-muted block mb-1.5">
              Workspace / Dashboard
            </span>
            <h1 className="font-display text-2xl sm:text-3xl text-ink font-bold tracking-tight">
              Application Pipeline
            </h1>
            <p className="text-sm sm:text-[15px] font-sans text-muted mt-1.5 flex items-center gap-2 flex-wrap">
              <span className="font-mono font-bold text-cyan">{metrics.active} active</span>
              <span>·</span>
              <span>
                <span className="font-mono font-semibold text-ink">{metrics.total}</span> tracked
              </span>
              <span>·</span>
              <span>
                <span className="font-mono font-semibold text-emerald-500">{metrics.offers}</span> offers
              </span>
            </p>
          </div>
          <ThemeToggleButton />
        </header>

        {/* Compact Stage Progression Filter Strip */}
        <PipelineJourneyBar
          jobsList={jobsList}
          selectedStage={selectedStage}
          onSelectStage={handleStageSelect}
          className="mb-10 shrink-0"
        />

        {/* Row 1: Compact KPI Metric Bento Strip */}
        <DashboardMetricStrip
          jobsList={jobsList}
          summary={summary}
          className="mb-16 shrink-0"
        />

        {/* Row 2: Insights & Analytical Velocity Deck (Asymmetric 7/5 Split) */}
        <DashboardInsightsSection
          jobsList={jobsList}
          insightsState={insightsState}
          className="shrink-0"
        />

        {/* Row 3: Priority Actions & Upcoming Cutoffs */}
        <section aria-label="Focus and Deadlines" className="mb-16 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-y-1.5 gap-x-1 mb-6 px-0.5">
            <div className="flex items-baseline gap-2.5 flex-wrap">
              <h2 className="font-display text-lg sm:text-xl text-ink font-bold tracking-tight">
                Focus &amp; Deadlines
              </h2>
              <span className="text-muted text-sm hidden sm:inline">·</span>
              <p className="text-muted text-sm sm:text-[15px] font-sans hidden sm:inline">
                Recommended next move and impending submission cutoffs
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-x-4 gap-y-8 items-stretch">
            <div className="lg:col-span-7 flex flex-col">
              <NextBestActionCard
                jobsList={jobsList}
                staleAlerts={summary?.staleAlerts}
                ruleBasedInsights={summary?.ruleBasedInsights}
                onSelectJob={setSelectedJob}
                isLoading={isLoading || isInsightsLoading}
                className="h-full"
              />
            </div>
            <div className="lg:col-span-5 flex flex-col">
              <UpcomingDeadlinesCard
                jobsList={jobsList}
                onSelectJob={setSelectedJob}
                isLoading={isLoading}
                className="h-full"
              />
            </div>
          </div>
        </section>

        {/* Row 4: Pipeline Board Toolbar & Interactive Drag-and-Drop Columns */}
        <section aria-label="Pipeline Board" className="flex flex-col flex-1 min-h-0">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-x-3 gap-y-3.5 mb-7 shrink-0">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5">
              <h2 className="font-display text-lg sm:text-xl text-ink font-bold tracking-tight">
                Pipeline Board
              </h2>
              <span className="text-[13px] sm:text-sm font-mono text-muted">
                {filteredJobs.length === jobsList.length
                  ? `${jobsList.length} applications`
                  : `${filteredJobs.length} of ${jobsList.length} shown`}
              </span>
              <span className="text-muted/60 text-sm hidden sm:inline" aria-hidden="true">
                ·
              </span>
              <span
                className="inline-flex items-center gap-1.5 text-[13px] sm:text-sm font-sans text-ink-secondary"
                aria-label="Use Left and Right Arrow keys to navigate stages"
              >
                <span className="inline-flex items-center gap-1" aria-hidden="true">
                  <kbd className="inline-flex items-center justify-center w-[22px] h-[22px] rounded border border-border-subtle bg-surface-secondary text-ink">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.1" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                  </kbd>
                  <kbd className="inline-flex items-center justify-center w-[22px] h-[22px] rounded border border-border-subtle bg-surface-secondary text-ink">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.1" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </kbd>
                </span>
                <span>Navigate stages</span>
              </span>
            </div>

            {/* Clean Inline Search & Filter Controls */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-x-2.5 gap-y-3 flex-wrap">
              <div className="w-full sm:w-64">
                <Input
                  placeholder="Search role or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 text-sm bg-surface-secondary/90"
                />
              </div>
              <div className="w-full sm:w-44">
                <Select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  placeholder="All Job Types"
                  className="h-9 text-sm bg-surface-secondary/90"
                >
                  <option value="">All Job Types</option>
                  <option value="fulltime">Full Time</option>
                  <option value="parttime">Part Time</option>
                  <option value="internship">Internship</option>
                  <option value="contract">Contract</option>
                </Select>
              </div>

              {selectedStage && (
                <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-surface-secondary border border-cyan/40 text-[13px] font-sans shrink-0">
                  <span className="text-muted">Stage:</span>
                  <span className="font-semibold text-cyan capitalize">{selectedStage}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedStage(null)}
                    className="text-muted hover:text-ink cursor-pointer inline-flex items-center"
                    aria-label="Clear focused stage"
                    title="Clear focused stage"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}

              {(searchQuery || selectedType || selectedStage) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("")
                    setSelectedType("")
                    setSelectedStage(null)
                  }}
                  className="text-xs sm:text-sm text-muted hover:text-ink shrink-0 h-9"
                >
                  Reset All Filters
                </Button>
              )}
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-8 h-8 rounded-full border-2 border-cyan border-t-transparent animate-spin mb-3" />
              <p className="text-muted text-base font-sans">Loading application pipeline...</p>
            </div>
          )}

          {/* Error State (Zero Emojis - Clean SVG Warning Icon) */}
          {error && !isLoading && (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="p-3.5 rounded-xl bg-red/10 border border-red/50 text-red text-sm sm:text-base mb-3 inline-flex items-center gap-2">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                <span>{error}</span>
              </div>
              <p className="text-muted text-sm font-sans">Please refresh the page or check your connection.</p>
            </div>
          )}

          {/* Kanban Board Area */}
          {!isLoading && !error && (
            <div
              ref={boardScrollRef}
              tabIndex={0}
              role="region"
              aria-label="Pipeline Board stages, use Left and Right Arrow keys to navigate horizontally"
              onKeyDown={handleBoardKeyDown}
              className="flex gap-4 sm:gap-5 overflow-x-auto flex-1 pb-4 pipeline-board-scrollbar snap-x min-w-0 min-h-[480px] rounded-xl focus:outline-none focus-visible:ring-1 focus-visible:ring-cyan/60"
            >
              {STATUS_ORDER.map((status) => (
                <div key={status} className="snap-start shrink-0">
                  <KanbanColumn
                    status={status}
                    jobs={jobsByStatus[status] || []}
                    onCardClick={setSelectedJob}
                    onDropCard={handleDropCard}
                    isHighlighted={selectedStage === status}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <JobDetailModal job={selectedJob} onClose={() => setSelectedJob(null)} />
    </>
  )
}

export default Dashboard
