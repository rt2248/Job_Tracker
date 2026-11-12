import React, { useState } from "react";
import { STATUS_META } from "../../constants/jobStatus";
import KanbanCard from "./KanbanCard";
import { cn } from "../../utils/cn";

const HEADER_ACCENT_CLASSES = {
    slate: "border-t-slate-500",
    indigo: "border-t-cyan",
    muted: "border-t-cyan",
    amber: "border-t-amber",
    violet: "border-t-red",
    cyan: "border-t-cyan",
    green: "border-t-green",
    red: "border-t-red",
};

function KanbanColumn({ status, jobs = [], onCardClick, onDropCard, draggingCardId, isHighlighted = false }) {
    const [isDragOver, setIsDragOver] = useState(false);
    const meta = STATUS_META[status] || { label: status, color: "muted" };
    const accentClass = HEADER_ACCENT_CLASSES[meta.color] || "border-t-cyan";

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (!isDragOver) setIsDragOver(true);
    };

    const handleDragLeave = (e) => {
        // Only trigger if leaving the column container
        if (!e.currentTarget.contains(e.relatedTarget)) {
            setIsDragOver(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        if (onDropCard) {
            let jobData = null;
            try {
                const raw = e.dataTransfer.getData("application/json");
                if (raw) jobData = JSON.parse(raw);
            } catch (err) {
                console.error("Failed to parse drag payload: ", err);
            }
            const jobId = e.dataTransfer.getData("text/plain");
            onDropCard(status, jobId, jobData);
        }
    };

    return (
        <div
            id={`kanban-col-${status}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
                "dashboard-well border-t-[3px] rounded-xl w-[280px] sm:w-80 shrink-0 flex flex-col max-h-full transition-all duration-200",
                accentClass,
                isDragOver && "bg-surface-elevated border-cyan/70 ring-2 ring-cyan/30 scale-[1.01]",
                isHighlighted && "ring-2 ring-cyan border-cyan shadow-md"
            )}
        >
            {/* Column Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-border-subtle/80 bg-surface/65 rounded-t-lg">
                <div className="flex items-center gap-2">
                    <span
                        aria-hidden="true"
                        className={cn(
                            "w-2 h-2 rounded-full shrink-0",
                            status === "saved" && "bg-slate-400",
                            status === "applied" && "bg-cyan",
                            status === "oa" && "bg-amber",
                            status === "interview" && "bg-red",
                            status === "offer" && "bg-yellow-500",
                            status === "accepted" && "bg-emerald-500",
                            status === "rejected" && "bg-red"
                        )}
                    />
                    <h3 className="font-display text-ink text-sm sm:text-base font-bold tracking-tight">
                        {meta.label}
                    </h3>
                </div>
                <span className="font-mono text-[13px] font-bold text-muted tabular-nums">
                    {jobs.length}
                </span>
            </div>

            {/* Column Cards Container */}
            <div className="flex flex-col gap-3 px-3 py-3.5 overflow-y-auto custom-scrollbar flex-1 min-h-[150px]">
                {jobs.length === 0 ? (
                    <div className={cn(
                        "flex flex-col items-center justify-center py-8 px-4 rounded-lg border border-dashed text-center transition-all my-auto",
                        isDragOver ? "border-cyan/60 bg-cyan/10 text-cyan" : "border-border-subtle text-muted/70"
                    )}>
                        <p className="text-sm font-sans font-medium">
                            {isDragOver ? "Drop application here" : "No applications"}
                        </p>
                        <p className="text-[13px] sm:text-sm text-muted/60 mt-1.5 font-sans">
                            {isDragOver ? "Release mouse to move" : "Drag cards to change status"}
                        </p>
                    </div>
                ) : (
                    jobs.map((job) => (
                        <KanbanCard
                            key={job.id}
                            job={job}
                            isDragging={draggingCardId === job.id}
                            onClick={() => onCardClick(job)}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

export default KanbanColumn;