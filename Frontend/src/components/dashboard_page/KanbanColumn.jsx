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

function KanbanColumn({ status, jobs = [], onCardClick, onDropCard, draggingCardId }) {
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
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
                "bg-surface/90 border border-border-primary border-t-2 rounded-2xl w-[280px] sm:w-80 shrink-0 flex flex-col max-h-full transition-all duration-200 card-3d",
                accentClass,
                isDragOver && "bg-surface-elevated border-cyan/60 ring-2 ring-cyan/30 scale-[1.01]"
            )}
        >
            {/* Column Header */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-border-subtle bg-surface-secondary/40 rounded-t-2xl">
                <div className="flex items-center gap-2">
                    <span className={cn(
                        "w-2 h-2 rounded-full",
                        status === "saved" && "bg-slate-400",
                        status === "applied" && "bg-cyan",
                        status === "oa" && "bg-amber",
                        status === "interview" && "bg-red",
                        status === "offer" && "bg-yellow",
                        status === "accepted" && "bg-green",
                        status === "rejected" && "bg-red"
                    )} />
                    <h3 className="font-display text-ink text-base font-semibold tracking-tight flex items-center gap-1.5">
                        {meta.label}
                        <span className="font-mono text-sm font-normal text-muted">
                            ({jobs.length})
                        </span>
                    </h3>
                </div>
            </div>

            {/* Column Cards Container */}
            <div className="flex flex-col gap-2.5 p-3 overflow-y-auto custom-scrollbar flex-1 min-h-[150px]">
                {jobs.length === 0 ? (
                    <div className={cn(
                        "flex flex-col items-center justify-center py-8 px-4 rounded-xl border border-dashed text-center transition-all my-auto",
                        isDragOver ? "border-cyan/60 bg-cyan/10 text-cyan" : "border-border-subtle/80 text-muted/60"
                    )}>
                        <p className="text-sm font-sans font-medium">
                            {isDragOver ? "Drop application here" : "No applications"}
                        </p>
                        <p className="text-xs sm:text-sm text-muted/60 mt-1 font-sans">
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