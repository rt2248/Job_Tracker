import React, { useState, useEffect, useMemo } from "react"
import { useSearchParams } from "react-router-dom"
import JobCard from "../../components/applications_page/JobCard"
import JobDetailModal from "../../components/shared/JobDetailModal"
import Input from "../../components/shared/Input"
import Select from "../../components/shared/Select"
import Button from "../../components/shared/Button"
import ThemeToggleButton from "../../components/shared/ThemeToggleButton"
import { useJobs } from "../../hooks/useJobs"

const Applications = () => {

  const [searchParams, setSearchParams] = useSearchParams()
  const jobParam = searchParams.get("job")

  const { jobs, isLoading, error, refetch } = useJobs()
  const [selectedJob, setSelectedJob] = useState(null)
  const [hasRefetchedForParam, setHasRefetchedForParam] = useState(false)

  // Handle ?job=<id> deep linking parameter
  useEffect(() => {
    if (!jobParam) {
      setHasRefetchedForParam(false)
      return
    }

    if (!isLoading && jobs) {
      const matched = jobs.find((j) => String(j.id) === String(jobParam))
      if (matched) {
        setSelectedJob(matched)
        const updated = new URLSearchParams(searchParams)
        updated.delete("job")
        setSearchParams(updated, { replace: true })
        setHasRefetchedForParam(false)
      } else if (!hasRefetchedForParam) {
        // Newly added job might not yet be in list; refetch once
        setHasRefetchedForParam(true)
        refetch()
      }
    }
  }, [jobParam, jobs, isLoading, hasRefetchedForParam, refetch, searchParams, setSearchParams])

  // Search & Filtering State
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("")

  // Filter jobs dynamically by role/company search and status
  const filteredJobs = useMemo(() => {
    return (jobs || []).filter((job) => {
      const matchesSearch =
        !searchQuery ||
        job.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.company?.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesStatus = !statusFilter || job.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [jobs, searchQuery, statusFilter])

  return (
    <>
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
          
          {/* Header Section */}
          <div className="flex items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl text-ink font-bold tracking-tight">
                All Applications
              </h1>
              {jobs && jobs.length > 0 && (
                <p className="font-mono text-sm sm:text-base font-bold text-cyan mt-1">
                  {filteredJobs.length} {filteredJobs.length === 1 ? "record" : "records"}
                </p>
              )}
              <p className="text-muted text-sm sm:text-base mt-1.5 font-sans leading-relaxed">
                Comprehensive record of your active and historical job applications.
              </p>
            </div>
            <ThemeToggleButton />
          </div>

          {/* Filtering & Search Toolbar */}
          {!isLoading && !error && jobs && jobs.length > 0 && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6 bg-surface/60 p-2.5 sm:p-3 rounded-xl border border-border-primary card-3d">
              <div className="flex-1 min-w-[200px]">
                <Input
                  placeholder="Filter applications by role or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 text-sm bg-surface-secondary/90"
                />
              </div>
              <div className="w-full sm:w-48">
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  placeholder="All Statuses"
                  className="h-10 text-sm bg-surface-secondary/90"
                >
                  <option value="">All Statuses</option>
                  <option value="saved">Saved</option>
                  <option value="applied">Applied</option>
                  <option value="oa">Online Assessment</option>
                  <option value="interview">Interview</option>
                  <option value="offer">Offer</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </Select>
              </div>
              {(searchQuery || statusFilter) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("")
                    setStatusFilter("")
                  }}
                  className="text-sm text-muted hover:text-ink shrink-0"
                >
                  Reset
                </Button>
              )}
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="w-8 h-8 rounded-full border-2 border-cyan border-t-transparent animate-spin mb-3" />
              <p className="text-muted text-base font-sans">Loading applications...</p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="p-3 rounded-xl bg-red/10 border border-red/50 text-red text-sm sm:text-base mb-3">
                ⚠️ {error}
              </div>
              <p className="text-muted text-sm font-sans">Please check your network connection.</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && jobs.length === 0 && (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-surface/50 border border-border-primary rounded-2xl">
              <p className="text-ink font-display text-xl font-semibold mb-1">No Applications Yet</p>
              <p className="text-muted text-sm sm:text-base max-w-sm">
                Start tracking your job search by adding applications to your pipeline.
              </p>
            </div>
          )}

          {/* No Filter Results State */}
          {!isLoading && !error && jobs.length > 0 && filteredJobs.length === 0 && (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-surface/50 border border-border-primary rounded-2xl">
              <p className="text-ink font-display text-lg font-semibold mb-1">No Matching Applications</p>
              <p className="text-muted text-sm sm:text-base mb-4">
                No applications match your current search or filter criteria.
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSearchQuery("")
                  setStatusFilter("")
                }}
                className="text-sm px-4 py-2"
              >
                Clear Filters
              </Button>
            </div>
          )}

          {/* Applications List */}
          {!isLoading && !error && filteredJobs.length > 0 && (
            <div className="flex flex-col gap-3">
              {filteredJobs.map((job) => (
                <JobCard key={job.id} job={job} onClick={() => setSelectedJob(job)} />
              ))}
            </div>
          )}
        </main>

      <JobDetailModal job={selectedJob} onClose={() => setSelectedJob(null)} />
    </>
  )
}

export default Applications