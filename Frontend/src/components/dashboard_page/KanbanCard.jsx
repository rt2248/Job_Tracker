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
                "group relative bg-surface-secondary/80 hover:bg-surface-elevated border border-border-primary hover:border-cyan/40",
                "rounded-xl p-3.5 transition-all duration-150 card-3d card-3d-hover hover:-translate-y-0.5 cursor-grab active:cursor-grabbing select-none",
                isDragging && "opacity-40 scale-95 border-dashed border-cyan ring-2 ring-cyan/20"
            )}
        >
            <h4 className="font-display text-ink text-base font-semibold truncate group-hover:text-cyan transition-colors">
                {job.role}
            </h4>

            <p className="text-muted text-sm font-sans mt-1 truncate flex items-center gap-1.5">
                <span className="truncate">{job.company}</span>
                <span className="text-border-primary/80">·</span>
                <JobTypeBadge jobType={job.jobType} />
            </p>

            <div className="mt-3 pt-2.5 border-t border-border-subtle/60 flex flex-wrap items-center justify-between gap-1.5 text-xs sm:text-sm">
                {compensation ? (
                    <span className="text-cyan font-mono font-medium truncate">
                        {compensation}
                    </span>
                ) : (
                    <span className="text-muted font-sans text-xs sm:text-sm truncate">
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