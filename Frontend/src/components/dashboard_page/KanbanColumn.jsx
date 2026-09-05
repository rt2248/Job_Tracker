import { STATUS_META } from "../../constants/jobStatus";
import KanbanCard from "./KanbanCard";

const HEADER_ACCENT_CLASSES = {
    muted: "border-t-muted",
    amber: "border-t-amber",
    violet: "border-t-violet",
    cyan: "border-t-cyan",
    green: "border-t-green",
    red: "border-t-red",
};

function KanbanColumn({ status, jobs, onCardClick }) {
    const meta = STATUS_META[status] || { label: status, color: "muted" };
    const accentClass = HEADER_ACCENT_CLASSES[meta.color];

    return (
        <div className={`bg-surface border border-surface-2 border-t-2 ${accentClass} rounded-xl w-72 shrink-0 flex flex-col max-h-full`}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-surface-2">
                <h3 className="font-display text-ink text-sm font-semibold">{meta.label}</h3>
                <span className="text-muted-light text-xs font-mono bg-canvas px-2 py-0.5 rounded-full">{jobs.length}</span>
            </div>

            <div className="flex flex-col gap-2 p-3 overflow-y-auto">
                {jobs.length === 0 ? (
                    <p className="text-muted text-xs font-mono text-center py-4">No jobs</p>
                ) : (
                    jobs.map((job) => (
                        <KanbanCard key={job.id} job={job} onClick={() => onCardClick(job)} />
                    ))
                )}
            </div>
        </div>
    );
}

export default KanbanColumn;