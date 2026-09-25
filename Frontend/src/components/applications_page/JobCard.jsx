import StatusBadge from "./StatusBadge";
import JobTypeBadge from "../shared/JobTypeBadge";
import { formatDate } from "../../utils/formatDate";
import { formatCompensation } from "../../utils/formatCompensation";

function JobCard({ job, onClick }) {
    const compensation = formatCompensation(job);

    return (
        <div
            onClick={onClick}
            className="bg-surface border border-surface-2 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 hover:border-indigo/50 transition-colors cursor-pointer"
        >
            <div className="min-w-0 w-full sm:w-auto">
                <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-display text-ink font-semibold truncate text-base sm:text-lg">{job.role}</h3>
                    <JobTypeBadge jobType={job.jobType} />
                </div>
                <p className="text-muted-light text-xs sm:text-sm mt-0.5">{job.company}</p>
            </div>

            <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-surface-2">
                <div className="text-xs text-muted font-mono text-left sm:text-right">
                    {compensation && <div className="text-muted-light font-medium">{compensation}</div>}
                    <div className="text-[11px] sm:text-xs">Applied: {formatDate(job.appliedDate)}</div>
                </div>
                <StatusBadge status={job.status} />
            </div>
        </div>
    );
}

export default JobCard;