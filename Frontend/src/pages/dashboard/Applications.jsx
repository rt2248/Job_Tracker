import React, { useState, useEffect, useMemo } from "react"
import { useSearchParams } from "react-router-dom"
import JobCard from "../../components/applications_page/JobCard"
import JobDetailModal from "../../components/shared/JobDetailModal"
import Input from "../../components/shared/Input"
import Select from "../../components/shared/Select"
import Button from "../../components/shared/Button"
import Badge from "../../components/shared/Badge"
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="font-display text-xl sm:text-2xl text-ink font-semibold tracking-tight">
                All Applications
              </h1>
              <p className="text-muted text-xs sm:text-sm mt-0.5 font-sans">
                Comprehensive record of your active and historical job applications.
              </p>
            </div>
            {jobs && jobs.length > 0 && (
              <Badge variant="indigo" size="md">
                {filteredJobs.length} {filteredJobs.length === 1 ? "Record" : "Records"}
              </Badge>
            )}
          </div>

          {/* Filtering & Search Toolbar */}
          {!isLoading && !error && jobs && jobs.length > 0 && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6 bg-surface/60 p-2.5 sm:p-3 rounded-xl border border-border-primary">
              <div className="flex-1 min-w-[200px]">
                <Input
                  placeholder="Filter applications by role or company..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 text-xs sm:text-sm bg-surface-secondary/90"
                />
              </div>
              <div className="w-full sm:w-48">
                <Select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  placeholder="All Statuses"
                  className="h-9 text-xs sm:text-sm bg-surface-secondary/90"
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
                  className="text-xs text-muted hover:text-ink shrink-0"
                >
                  Reset
                </Button>
              )}
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="w-8 h-8 rounded-full border-2 border-indigo border-t-transparent animate-spin mb-3" />
              <p className="text-muted text-sm font-sans">Loading applications...</p>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className="p-3 rounded-xl bg-red/10 border border-red/30 text-red mb-3">
                ⚠️ {error}
              </div>
              <p className="text-muted text-xs font-sans">Please check your network connection.</p>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && jobs.length === 0 && (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-surface/50 border border-border-primary rounded-2xl">
              <p className="text-ink font-display text-lg font-semibold mb-1">No Applications Yet</p>
              <p className="text-muted text-xs sm:text-sm max-w-sm">
                Start tracking your job search by adding applications to your pipeline.
              </p>
            </div>
          )}

          {/* No Filter Results State */}
          {!isLoading && !error && jobs.length > 0 && filteredJobs.length === 0 && (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-surface/50 border border-border-primary rounded-2xl">
              <p className="text-ink font-display text-base font-semibold mb-1">No Matching Applications</p>
              <p className="text-muted text-xs sm:text-sm mb-4">
                No applications match your current search or filter criteria.
              </p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSearchQuery("")
                  setStatusFilter("")
                }}
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