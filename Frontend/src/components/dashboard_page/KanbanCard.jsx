import { formatDate } from "../../utils/formatDate";

function KanbanCard({ job }) {
    return (
        <div className="bg-canvas border border-surface-2 rounded-lg p-3 hover:border-indigo/50 transition-colors cursor-pointer">
            <h4 className="font-display text-ink text-sm font-semibold truncate">{job.role}</h4>
            <p className="text-muted-light text-xs mt-0.5 truncate">{job.company}</p>
            <p className="text-muted text-[11px] font-mono mt-2">Deadline: {formatDate(job.deadline)}</p>
        </div>
    );
}

export default KanbanCard;