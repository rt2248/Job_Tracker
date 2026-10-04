import React from "react";
import JobTypeBadge from "../shared/JobTypeBadge";
import WorkModeBadge from "./WorkModeBadge";
import ExperienceLevelBadge from "./ExperienceLevelBadge";
import Modal, { ModalHeader, ModalTitle, ModalContent, ModalFooter } from "../shared/Modal";
import Button from "../shared/Button";
import Badge from "../shared/Badge";
import { formatDate } from "../../utils/formatDate";
import { formatCompensation } from "../../utils/formatCompensation";

function ListingDetailModal({ listing, onClose }) {
    if (!listing) return null;

    const compensation = formatCompensation(listing);

    return (
        <Modal isOpen={Boolean(listing)} onClose={onClose} size="lg">
            <ModalHeader onClose={onClose}>
                <ModalTitle>{listing.title}</ModalTitle>
                <p className="text-muted text-sm font-sans mt-0.5">
                    <span className="text-ink-secondary font-medium">{listing.company}</span>
                    {listing.location && <span> · {listing.location}</span>}
                </p>
            </ModalHeader>

            <ModalContent>
                <div className="flex items-center gap-2 mb-6 flex-wrap">
                    <JobTypeBadge jobType={listing.jobType} />
                    <WorkModeBadge workMode={listing.workMode} />
                    <ExperienceLevelBadge experienceLevel={listing.experienceLevel} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-surface-secondary/50 border border-border-subtle text-sm">
                    <div>
                        <p className="text-muted text-xs font-sans font-medium uppercase tracking-wider">Compensation</p>
                        <p className="text-cyan font-mono font-medium mt-1">{compensation || "—"}</p>
                    </div>
                    <div>
                        <p className="text-muted text-xs font-sans font-medium uppercase tracking-wider">Date Posted</p>
                        <p className="text-ink font-mono mt-1">{formatDate(listing.postedDate)}</p>
                    </div>
                </div>

                {listing.description && (
                    <div className="mt-5 p-4 rounded-xl bg-surface-secondary/30 border border-border-subtle">
                        <p className="text-muted text-xs font-sans font-medium uppercase tracking-wider mb-1.5">Job Description</p>
                        <p className="text-ink text-sm leading-relaxed font-sans whitespace-pre-wrap">{listing.description}</p>
                    </div>
                )}

                {listing.requirements && listing.requirements.length > 0 && (
                    <div className="mt-5 p-4 rounded-xl bg-surface-secondary/30 border border-border-subtle">
                        <p className="text-muted text-xs font-sans font-medium uppercase tracking-wider mb-2">Requirements</p>
                        <ul className="text-ink text-sm leading-relaxed font-sans space-y-1.5 list-disc list-inside">
                            {listing.requirements.map((req, i) => (
                                <li key={i} className="text-ink-secondary">{req}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {listing.tags && listing.tags.length > 0 && (
                    <div className="mt-5">
                        <p className="text-muted text-xs font-sans font-medium uppercase tracking-wider mb-2">Skills & Tags</p>
                        <div className="flex flex-wrap gap-1.5">
                            {listing.tags.map((tag) => (
                                <Badge key={tag} variant="subtle" size="sm">
                                    #{tag}
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}
            </ModalContent>

            <ModalFooter>
                <Button variant="secondary" onClick={onClose}>
                    Close
                </Button>
                {listing.link && (
                    <a
                        href={listing.link}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        <Button variant="primary">
                            View Posting & Apply ↗
                        </Button>
                    </a>
                )}
            </ModalFooter>
        </Modal>
    );
}

export default ListingDetailModal;