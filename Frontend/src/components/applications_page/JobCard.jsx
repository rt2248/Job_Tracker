import StatusBadge from "./StatusBadge";
import { formatDate } from "../../utils/formatDate";

function JobCard({ job }) {
    return (
        <div className="bg-surface border border-surface-2 rounded-xl p-5 flex items-center justify-between gap-4 hover:border-indigo/50 transition-colors">
            <div className="min-w-0">
                <h3 className="font-display text-ink font-semibold truncate">{job.role}</h3>
                <p className="text-muted-light text-sm mt-0.5">{job.company}</p>
            </div>

            <div className="flex items-center gap-6 shrink-0">
                <div className="text-xs text-muted font-mono text-right hidden sm:block">
                    <div>Applied: {formatDate(job.appliedDate)}</div>
                    <div>Deadline: {formatDate(job.deadline)}</div>
                </div>
                <StatusBadge status={job.status} />
            </div>
        </div>
    );
}

export default JobCard;