import JobTypeBadge from "../shared/JobTypeBadge";
import WorkModeBadge from "./WorkModeBadge";
import { formatCompensation } from "../../utils/formatCompensation";
import { formatRelativeDate } from "../../utils/formatRelativeDate";

function ListingCard({ listing, onClick }) {
    const compensation = formatCompensation(listing);

    return (
        <div
            onClick={onClick}
            className="bg-surface border border-surface-2 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 hover:border-indigo/50 transition-colors cursor-pointer"
        >
            <div className="min-w-0 w-full sm:w-auto">
                <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display text-ink font-semibold truncate text-base sm:text-lg">{listing.title}</h3>
                    <JobTypeBadge jobType={listing.jobType} />
                    <WorkModeBadge workMode={listing.workMode} />
                </div>
                <p className="text-muted-light text-xs sm:text-sm mt-0.5">
                    {listing.company} · {listing.location}
                </p>
            </div>

            <div className="text-xs text-muted font-mono text-left sm:text-right shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-surface-2 flex sm:flex-col justify-between items-center sm:items-end">
                {compensation && <div className="text-muted-light font-medium">{compensation}</div>}
                <div className="text-[11px] sm:text-xs">{formatRelativeDate(listing.postedDate)}</div>
            </div>
        </div>
    );
}

export default ListingCard;