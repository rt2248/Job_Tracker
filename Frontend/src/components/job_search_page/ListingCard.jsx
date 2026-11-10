import React from "react";
import { useNavigate } from "react-router-dom";
import JobTypeBadge from "../shared/JobTypeBadge";
import WorkModeBadge from "./WorkModeBadge";
import Card from "../shared/Card";
import Button from "../shared/Button";
import AddToTrackerButton from "../shared/AddToTrackerButton";
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
            className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 cursor-pointer group bg-surface-secondary/80 hover:bg-surface-elevated border-border-primary hover:border-cyan/60"
        >
            <div className="min-w-0 w-full sm:w-auto">
                <h3 className="font-display text-ink font-semibold truncate text-lg sm:text-xl group-hover:text-cyan transition-colors">
                    {listing.title}
                </h3>
                <p className="text-muted text-sm sm:text-base font-sans mt-1.5 flex items-center gap-2 flex-wrap">
                    <span className="text-ink-secondary font-medium">{listing.company}</span>
                    {listing.location && <span>· {listing.location}</span>}
                    <span className="text-border-primary/80">·</span>
                    <JobTypeBadge jobType={listing.jobType} />
                    <span className="text-border-primary/80">·</span>
                    <WorkModeBadge workMode={listing.workMode} />
                </p>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2.5 shrink-0 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-border-subtle">
                <div className="text-xs sm:text-sm font-sans text-left sm:text-right">
                    {compensation && (
                        <div className="text-cyan font-mono font-medium text-sm sm:text-base">{compensation}</div>
                    )}
                    <div className="text-muted font-mono text-xs sm:text-sm">
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
                        className="text-sm px-3 py-1.5 text-ink-secondary hover:text-ink hover:border-cyan/60"
                    >
                        View in Tracker
                    </Button>
                ) : (
                    <AddToTrackerButton
                        inFlight={inFlight}
                        onClick={(e) => {
                            e.stopPropagation();
                            addToTracker(listing);
                        }}
                        className="text-sm px-3 py-1.5"
                    />
                )}
            </div>
        </Card>
    );
}

export default ListingCard;