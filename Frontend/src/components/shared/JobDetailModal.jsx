import React from "react";
import StatusBadge from "../applications_page/StatusBadge";
import JobTypeBadge from "./JobTypeBadge";
import Modal, { ModalHeader, ModalTitle, ModalContent, ModalFooter } from "./Modal";
import Button from "./Button";
import { formatDate } from "../../utils/formatDate";
import { formatCompensation } from "../../utils/formatCompensation";

const WORK_MODE_LABELS = {
    remote: "Remote",
    onsite: "Onsite",
    hybrid: "Hybrid",
};

function JobDetailModal({ job, onClose }) {
    if (!job) return null;

    const compensation = formatCompensation(job);

    return (
        <Modal isOpen={Boolean(job)} onClose={onClose} size="lg">
            <ModalHeader onClose={onClose}>
                <ModalTitle>{job.role}</ModalTitle>
                <p className="text-muted text-sm font-sans mt-0.5">{job.company}</p>
            </ModalHeader>

            <ModalContent>
                <div className="flex items-center gap-2 mb-6 flex-wrap">
                    <StatusBadge status={job.status} />
                    <JobTypeBadge jobType={job.jobType} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-surface-secondary/50 border border-border-subtle text-sm">
                    <div>
                        <p className="text-muted text-xs font-sans font-medium uppercase tracking-wider">Work Mode</p>
                        <p className="text-ink font-medium mt-1">{job.workMode ? WORK_MODE_LABELS[job.workMode] : "—"}</p>
                    </div>
                    <div>
                        <p className="text-muted text-xs font-sans font-medium uppercase tracking-wider">Compensation</p>
                        <p className="text-cyan font-mono font-medium mt-1">{compensation || "—"}</p>
                    </div>
                    <div>
                        <p className="text-muted text-xs font-sans font-medium uppercase tracking-wider">Applied Date</p>
                        <p className="text-ink mt-1">{job.status === "saved" ? "Not applied yet" : formatDate(job.appliedDate)}</p>
                    </div>
                    <div>
                        <p className="text-muted text-xs font-sans font-medium uppercase tracking-wider">Deadline</p>
                        <p className="text-ink font-mono mt-1">{formatDate(job.deadline)}</p>
                    </div>
                    <div>
                        <p className="text-muted text-xs font-sans font-medium uppercase tracking-wider">Resume Version</p>
                        <p className="text-ink font-medium mt-1">{job.resumeUsed || "—"}</p>
                    </div>
                    <div>
                        <p className="text-muted text-xs font-sans font-medium uppercase tracking-wider">Job Link</p>
                        {job.link ? (
                            <a
                                href={job.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-cyan hover:underline mt-1 inline-flex items-center gap-1 font-medium truncate"
                            >
                                View posting ↗
                            </a>
                        ) : (
                            <p className="text-ink mt-1">—</p>
                        )}
                    </div>
                </div>

                {job.notes && (
                    <div className="mt-5 p-4 rounded-xl bg-surface-secondary/30 border border-border-subtle">
                        <p className="text-muted text-xs font-sans font-medium uppercase tracking-wider">Notes & Comments</p>
                        <p className="text-ink text-sm mt-1.5 leading-relaxed font-sans whitespace-pre-wrap">{job.notes}</p>
                    </div>
                )}
            </ModalContent>

            <ModalFooter>
                <Button variant="secondary" onClick={onClose}>
                    Close
                </Button>
            </ModalFooter>
        </Modal>
    );
}

export default JobDetailModal;