import { useEffect } from "react";
import StatusBadge from "../applications_page/StatusBadge";
import JobTypeBadge from "./JobTypeBadge";
import { formatDate } from "../../utils/formatDate";
import { formatCompensation } from "../../utils/formatCompensation";

const WORK_MODE_LABELS = {
    remote: "Remote",
    onsite: "Onsite",
    hybrid: "Hybrid",
};

function JobDetailModal({ job, onClose }) {
    useEffect(() => {
        if (!job) return;

        const handleKeyDown = (e) => {
            if (e.key === "Escape") onClose();
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [job, onClose]);

    if (!job) return null;

    const compensation = formatCompensation(job);

    return (
        <div
            className="fixed inset-0 bg-canvas/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={onClose}
        >
            <div
                className="bg-surface border border-surface-2 rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="font-display text-ink text-xl font-semibold">{job.role}</h2>
                        <p className="text-muted-light text-sm mt-1">{job.company}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-muted-light hover:text-ink text-xl leading-none hover:cursor-pointer"
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>

                <div className="flex items-center gap-2 mt-4">
                    <StatusBadge status={job.status} />
                    <JobTypeBadge jobType={job.jobType} />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6 text-sm">
                    <div>
                        <p className="text-muted text-xs font-mono">Work Mode</p>
                        <p className="text-ink mt-1">{job.workMode ? WORK_MODE_LABELS[job.workMode] : "—"}</p>
                    </div>
                    <div>
                        <p className="text-muted text-xs font-mono">Compensation</p>
                        <p className="text-ink mt-1">{compensation || "—"}</p>
                    </div>
                    <div>
                        <p className="text-muted text-xs font-mono">Applied</p>
                        <p className="text-ink mt-1">{formatDate(job.appliedDate)}</p>
                    </div>
                    <div>
                        <p className="text-muted text-xs font-mono">Deadline</p>
                        <p className="text-ink mt-1">{formatDate(job.deadline)}</p>
                    </div>
                    <div>
                        <p className="text-muted text-xs font-mono">Resume Used</p>
                        <p className="text-ink mt-1">{job.resumeUsed || "—"}</p>
                    </div>
                    <div>
                        <p className="text-muted text-xs font-mono">Link</p>
                        {job.link ? (
                            <a
                                href={job.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-cyan hover:underline mt-1 block truncate"
                            >
                                View posting
                            </a>
                        ) : (
                            <p className="text-ink mt-1">—</p>
                        )}
                    </div>

                </div>

                {job.notes && (
                    <div className="mt-6">
                        <p className="text-muted text-xs font-mono">Notes</p>
                        <p className="text-ink text-sm mt-1 leading-relaxed">{job.notes}</p>
                    </div>
                )}
            </div>
        </div >
    );
}

export default JobDetailModal;