import React, { useState } from "react"
import SideBar from "../../components/dashboard_page/SideBar"
import TopBar from "../../components/dashboard_page/TopBar"
import JobSearchFilterBar from "../../components/job_search_page/JobSearchFilter"
import ListingCard from "../../components/job_search_page/ListingCard"
import ListingDetailModal from "../../components/job_search_page/ListingDetailModal"
import Badge from "../../components/shared/Badge"
import Button from "../../components/shared/Button"
import { useJobListings } from "../../hooks/useJobListings"

const JobSearch = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

    const { filters, updateFilter, clearFilters, listings, isLoading, error } = useJobListings()
    const [selectedListing, setSelectedListing] = useState(null)

    return (
        <div className="flex h-screen overflow-hidden bg-canvas text-ink font-sans">
            <SideBar isSidebarOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            <div className="flex flex-col flex-1 min-w-0">
                <TopBar toggleSidebar={toggleSidebar} title="Job Search" />
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
                    
                    {/* Header Section */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                        <div>
                            <h1 className="font-display text-xl sm:text-2xl text-ink font-semibold tracking-tight">
                                Job Discovery
                            </h1>
                            <p className="text-muted text-xs sm:text-sm mt-0.5 font-sans">
                                Explore and filter available career opportunities.
                            </p>
                        </div>
                        {listings && listings.length > 0 && (
                            <Badge variant="cyan" size="md">
                                {listings.length} {listings.length === 1 ? "Listing" : "Listings"}
                            </Badge>
                        )}
                    </div>

                    {/* Filter Bar */}
                    <JobSearchFilterBar
                        filters={filters}
                        updateFilter={updateFilter}
                        clearFilters={clearFilters}
                    />

                    {/* Loading State */}
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center p-12 text-center">
                            <div className="w-8 h-8 rounded-full border-2 border-cyan border-t-transparent animate-spin mb-3" />
                            <p className="text-muted text-sm font-sans">Searching job listings...</p>
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
                    {!isLoading && !error && listings.length === 0 && (
                        <div className="flex flex-col items-center justify-center p-12 text-center bg-surface/50 border border-border-primary rounded-2xl">
                            <p className="text-ink font-display text-base font-semibold mb-1">No Matching Listings</p>
                            <p className="text-muted text-xs sm:text-sm mb-4">
                                No job listings match your search keywords or filter criteria.
                            </p>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={clearFilters}
                            >
                                Clear All Filters
                            </Button>
                        </div>
                    )}

                    {/* Job Listings List */}
                    {!isLoading && !error && listings.length > 0 && (
                        <div className="flex flex-col gap-3">
                            {listings.map((listing) => (
                                <ListingCard
                                    key={listing.id}
                                    listing={listing}
                                    onClick={() => setSelectedListing(listing)}
                                />
                            ))}
                        </div>
                    )}
                </main>
            </div>

            <ListingDetailModal listing={selectedListing} onClose={() => setSelectedListing(null)} />
        </div>
    )
}

export default JobSearch