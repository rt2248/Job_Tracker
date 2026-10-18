import React from "react";
import { useNavigate } from "react-router-dom";
import JobTypeBadge from "../shared/JobTypeBadge";
import WorkModeBadge from "./WorkModeBadge";
import Card from "../shared/Card";
import Button from "../shared/Button";
import { useTrackListing } from "../../hooks/useTrackListing";
import { formatCompensation } from "../../utils/formatCompensation";
import { formatRelativeDate } from "../../utils/formatRelativeDate";

function ListingCard({ listing, onClick }) {
    const compensation = formatCompensation(listing);
    const { isTracked, getJobId, addToTracker, isInFlight } = useTrackListing();
    const navigate = useNavigate();

    const tracked = isTracked(listing.id);
    const inFlight = isInFlight(listing.id);

    return (
        <Card
            hoverable
            onClick={onClick}
            className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 cursor-pointer group bg-surface-secondary/80 hover:bg-surface-elevated border-border-primary hover:border-indigo/40"
        >
            <div className="min-w-0 w-full sm:w-auto">
                <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display text-ink font-semibold truncate text-base sm:text-lg group-hover:text-indigo transition-colors">
                        {listing.title}
                    </h3>
                    <JobTypeBadge jobType={listing.jobType} />
                    <WorkModeBadge workMode={listing.workMode} />
                </div>
                <p className="text-muted text-xs sm:text-sm font-sans mt-1">
                    <span className="text-ink-secondary font-medium">{listing.company}</span>
                    {listing.location && <span> · {listing.location}</span>}
                </p>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2.5 shrink-0 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-border-subtle">
                <div className="text-xs font-sans text-left sm:text-right">
                    {compensation && (
                        <div className="text-cyan font-mono font-medium text-xs sm:text-sm">{compensation}</div>
                    )}
                    <div className="text-muted font-mono text-[11px] sm:text-xs">
                        {formatRelativeDate(listing.postedDate)}
                    </div>
                </div>

                {tracked ? (
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={(e) => {
                            e.stopPropagation();
                            const jobId = getJobId(listing.id);
                            navigate(jobId ? `/applications?job=${jobId}` : "/applications");
                        }}
                        className="text-xs px-2.5 py-1 text-slate-300 hover:text-ink hover:border-indigo/40"
                    >
                        View in Tracker
                    </Button>
                ) : (
                    <Button
                        variant="primary"
                        size="sm"
                        disabled={inFlight}
                        onClick={(e) => {
                            e.stopPropagation();
                            addToTracker(listing);
                        }}
                        className="text-xs px-2.5 py-1 flex items-center gap-1.5"
                    >
                        {inFlight ? (
                            <>
                                <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                                Adding...
                            </>
                        ) : (
                            "+ Add to Tracker"
                        )}
                    </Button>
                )}
            </div>
        </Card>
    );
}

export default ListingCard;