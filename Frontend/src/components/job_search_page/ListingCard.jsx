import JobTypeBadge from "../shared/JobTypeBadge";
import WorkModeBadge from "./WorkModeBadge";
import { formatCompensation } from "../../utils/formatCompensation";
import { formatRelativeDate } from "../../utils/formatRelativeDate";

function ListingCard({ listing, onClick }) {
    const compensation = formatCompensation(listing);

    return (
        <div
            onClick={onClick}
            className="bg-surface border border-surface-2 rounded-xl p-5 flex items-center justify-between gap-4 hover:border-indigo/50 transition-colors cursor-pointer"
        >
            <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display text-ink font-semibold truncate">{listing.title}</h3>
                    <JobTypeBadge jobType={listing.jobType} />
                    <WorkModeBadge workMode={listing.workMode} />
                </div>
                <p className="text-muted-light text-sm mt-0.5">
                    {listing.company} · {listing.location}
                </p>
            </div>

            <div className="text-xs text-muted font-mono text-right shrink-0 hidden sm:block">
                {compensation && <div className="text-muted-light">{compensation}</div>}
                <div>{formatRelativeDate(listing.postedDate)}</div>
            </div>
        </div>
    );
}

export default ListingCard;