import React, { useState } from "react"
import JobSearchFilterBar from "../../components/job_search_page/JobSearchFilter"
import ListingCard from "../../components/job_search_page/ListingCard"
import ListingDetailModal from "../../components/job_search_page/ListingDetailModal"
import Button from "../../components/shared/Button"
import ThemeToggleButton from "../../components/shared/ThemeToggleButton"
import { useJobListings } from "../../hooks/useJobListings"

const JobSearch = () => {
    const { filters, updateFilter, clearFilters, listings, isLoading, error } = useJobListings()
    const [selectedListing, setSelectedListing] = useState(null)

    return (
        <>
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar">
                    
                    {/* Header Section */}
                    <div className="flex items-start justify-between gap-4 mb-6">
                        <div>
                            <h1 className="font-display text-2xl sm:text-3xl text-ink font-bold tracking-tight">
                                Job Discovery
                            </h1>
                            {listings && listings.length > 0 && (
                                <p className="font-mono text-sm sm:text-base font-bold text-cyan mt-1">
                                    {listings.length} {listings.length === 1 ? "listing" : "listings"}
                                </p>
                            )}
                            <p className="text-muted text-sm sm:text-base mt-1.5 font-sans leading-relaxed">
                                Explore and filter available career opportunities.
                            </p>
                        </div>
                        <ThemeToggleButton />
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
                            <p className="text-muted text-base font-sans">Searching job listings...</p>
                        </div>
                    )}

                    {/* Error State */}
                    {error && !isLoading && (
                        <div className="flex flex-col items-center justify-center p-12 text-center">
                            <div className="p-3 rounded-xl bg-red/10 border border-red/30 text-red text-sm sm:text-base mb-3">
                                ⚠️ {error}
                            </div>
                            <p className="text-muted text-sm font-sans">Please check your network connection.</p>
                        </div>
                    )}

                    {/* Empty State */}
                    {!isLoading && !error && listings.length === 0 && (
                        <div className="flex flex-col items-center justify-center p-12 text-center bg-surface/50 border border-border-primary rounded-2xl">
                            <p className="text-ink font-display text-lg font-semibold mb-1">No Matching Listings</p>
                            <p className="text-muted text-sm sm:text-base mb-4">
                                No job listings match your search keywords or filter criteria.
                            </p>
                            <Button
                                variant="secondary"
                                size="sm"
                                onClick={clearFilters}
                                className="text-sm px-4 py-2"
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

            <ListingDetailModal listing={selectedListing} onClose={() => setSelectedListing(null)} />
        </>
    )
}

export default JobSearch