import React from "react";
import JobTypeBadge from "../shared/JobTypeBadge";
import WorkModeBadge from "./WorkModeBadge";
import Card from "../shared/Card";
import { formatCompensation } from "../../utils/formatCompensation";
import { formatRelativeDate } from "../../utils/formatRelativeDate";

function ListingCard({ listing, onClick }) {
    const compensation = formatCompensation(listing);

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

            <div className="text-xs font-sans text-left sm:text-right shrink-0 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-border-subtle flex sm:flex-col justify-between items-center sm:items-end gap-1">
                {compensation && (
                    <div className="text-cyan font-mono font-medium text-xs sm:text-sm">{compensation}</div>
                )}
                <div className="text-muted font-mono text-[11px] sm:text-xs">
                    {formatRelativeDate(listing.postedDate)}
                </div>
            </div>
        </Card>
    );
}

export default ListingCard;