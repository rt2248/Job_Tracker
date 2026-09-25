import { useState } from "react"
import SideBar from "../../components/dashboard_page/SideBar"
import TopBar from "../../components/dashboard_page/TopBar"
import JobSearchFilterBar from "../../components/job_search_page/JobSearchFilter"
import ListingCard from "../../components/job_search_page/ListingCard"
import ListingDetailModal from "../../components/job_search_page/ListingDetailModal"
import { useJobListings } from "../../hooks/useJobListings"

const JobSearch = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true)
    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen)

    const { filters, updateFilter, clearFilters, listings, isLoading, error } = useJobListings()
    const [selectedListing, setSelectedListing] = useState(null)

    return (
        <div className="flex h-screen overflow-hidden bg-canvas text-ink font-body">
            <SideBar isSidebarOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
            <div className="flex flex-col flex-1 min-w-0">
                <TopBar toggleSidebar={toggleSidebar} title="Job Search" />
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                    <h1 className="font-display text-xl sm:text-2xl text-ink font-semibold mb-4 sm:mb-6">
                        Job Search
                    </h1>

                    <JobSearchFilterBar
                        filters={filters}
                        updateFilter={updateFilter}
                        clearFilters={clearFilters}
                    />

                    {isLoading && (
                        <p className="text-muted-light font-mono text-sm">Loading listings...</p>
                    )}

                    {error && (
                        <p className="text-red font-mono text-sm">Error: {error}</p>
                    )}

                    {!isLoading && !error && listings.length === 0 && (
                        <p className="text-muted-light font-mono text-sm">No listings match your filters.</p>
                    )}

                    {!isLoading && !error && listings.length > 0 && (
                        <div className="flex flex-col gap-3">
                            {listings.map((listing) => (
                                <ListingCard key={listing.id} listing={listing} onClick={() => setSelectedListing(listing)} />
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