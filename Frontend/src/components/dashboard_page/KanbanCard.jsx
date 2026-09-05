import { formatDate } from "../../utils/formatDate";
import { formatCompensation } from "../../utils/formatCompensation";
import JobTypeBadge from "../shared/JobTypeBadge";

function KanbanCard({ job, onClick }) {
    const compensation = formatCompensation(job);

    return (
        <div
            onClick={onClick}
            className="bg-canvas border border-surface-2 rounded-lg p-3 hover:border-indigo/50 transition-colors cursor-pointer"
        >
            <div className="flex items-start justify-between gap-2">
                <h4 className="font-display text-ink text-sm font-semibold truncate">{job.role}</h4>
                <JobTypeBadge jobType={job.jobType} />
            </div>
            <p className="text-muted-light text-xs mt-0.5 truncate">{job.company}</p>
            {compensation && (
                <p className="text-muted-light text-[11px] font-mono mt-2">{compensation}</p>
            )}
            <p className="text-muted text-[11px] font-mono mt-0.5">Deadline: {formatDate(job.deadline)}</p>
        </div>
    );
}

export default KanbanCard;