import React, { useRef } from "react";
import { formatDate } from "../../utils/formatDate";
import { formatCompensation } from "../../utils/formatCompensation";
import JobTypeBadge from "../shared/JobTypeBadge";
import { cn } from "../../utils/cn";

function KanbanCard({ job, onClick, onDragStart, isDragging }) {
    const compensation = formatCompensation(job);
    const isDraggingRef = useRef(false);

    const handleDragStart = (e) => {
        isDraggingRef.current = true;
        e.dataTransfer.setData("application/json", JSON.stringify(job));
        e.dataTransfer.setData("text/plain", String(job.id));
        e.dataTransfer.effectAllowed = "move";
        if (onDragStart) onDragStart(job);
    };

    const handleDragEnd = () => {
        // Guard against triggering onClick immediately after drop
        setTimeout(() => {
            isDraggingRef.current = false;
        }, 100);
    };

    const handleClick = (e) => {
        if (isDraggingRef.current) return;
        if (onClick) onClick(e);
    };

    return (
        <div
            draggable
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onClick={handleClick}
            className={cn(
                "group relative bg-surface-secondary/80 hover:bg-surface-elevated border border-border-primary hover:border-indigo/40",
                "rounded-xl p-3.5 transition-all duration-150 shadow-sm hover:shadow-elevated cursor-grab active:cursor-grabbing select-none",
                isDragging && "opacity-40 scale-95 border-dashed border-indigo ring-2 ring-indigo/20"
            )}
        >
            <div className="flex items-start justify-between gap-2">
                <h4 className="font-display text-ink text-sm font-semibold truncate group-hover:text-indigo transition-colors">
                    {job.role}
                </h4>
                <JobTypeBadge jobType={job.jobType} />
            </div>

            <p className="text-muted text-xs font-sans mt-0.5 truncate">{job.company}</p>

            <div className="mt-3 pt-2.5 border-t border-border-subtle/60 flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
                {compensation ? (
                    <span className="text-cyan font-mono font-medium bg-cyan/10 px-2 py-0.5 rounded-md border border-cyan/20 truncate">
                        {compensation}
                    </span>
                ) : (
                    <span className="text-muted font-sans text-[11px] truncate">
                        {job.workMode || "Standard"}
                    </span>
                )}
                {job.deadline && (
                    <span className="text-muted font-mono shrink-0">
                        Due: {formatDate(job.deadline)}
                    </span>
                )}
            </div>
        </div>
    );
}

export default KanbanCard;