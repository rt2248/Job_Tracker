import React from "react";
import { useNavigate } from "react-router-dom";
import JobTypeBadge from "../shared/JobTypeBadge";
import WorkModeBadge from "./WorkModeBadge";
import ExperienceLevelBadge from "./ExperienceLevelBadge";
import Modal, { ModalHeader, ModalTitle, ModalContent, ModalFooter } from "../shared/Modal";
import Button from "../shared/Button";
import { useTrackListing } from "../../hooks/useTrackListing";
import { recordExternalListingClick } from "../../utils/promptStorage";
import { formatDate } from "../../utils/formatDate";
import { formatCompensation } from "../../utils/formatCompensation";

function ListingDetailModal({ listing, onClose }) {
    const { isTracked, getJobId, addToTracker, isInFlight } = useTrackListing();
    const navigate = useNavigate();

    if (!listing) return null;

    const compensation = formatCompensation(listing);
    const tracked = isTracked(listing.id);
    const inFlight = isInFlight(listing.id);

    return (
        <Modal isOpen={Boolean(listing)} onClose={onClose} size="lg">
            <ModalHeader onClose={onClose}>
                <ModalTitle>{listing.title}</ModalTitle>
                <p className="text-muted text-sm sm:text-base font-sans mt-1.5 flex items-center gap-2 flex-wrap">
                    <span className="text-ink-secondary font-medium">{listing.company}</span>
                    {listing.location && <span>· {listing.location}</span>}
                    <span className="text-border-primary/80">·</span>
                    <JobTypeBadge jobType={listing.jobType} />
                    <span className="text-border-primary/80">·</span>
                    <WorkModeBadge workMode={listing.workMode} />
                    <span className="text-border-primary/80">·</span>
                    <ExperienceLevelBadge experienceLevel={listing.experienceLevel} />
                </p>
            </ModalHeader>

            <ModalContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-surface-secondary/50 border border-border-subtle text-sm">
                    <div>
                        <p className="text-muted text-xs sm:text-sm font-sans font-semibold uppercase tracking-wider">Compensation</p>
                        <p className="text-cyan font-mono font-bold text-base sm:text-lg mt-1">{compensation || "—"}</p>
                    </div>
                    <div>
                        <p className="text-muted text-xs sm:text-sm font-sans font-semibold uppercase tracking-wider">Date Posted</p>
                        <p className="text-ink font-mono font-bold text-base sm:text-lg mt-1">{formatDate(listing.postedDate)}</p>
                    </div>
                </div>

                {listing.description && (
                    <div className="mt-5 p-4 rounded-xl bg-surface-secondary/30 border border-border-subtle">
                        <p className="text-muted text-xs sm:text-sm font-sans font-semibold uppercase tracking-wider mb-1.5">Job Description</p>
                        <p className="text-ink text-sm sm:text-base leading-relaxed font-sans whitespace-pre-wrap">{listing.description}</p>
                    </div>
                )}

                {listing.requirements && listing.requirements.length > 0 && (
                    <div className="mt-5 p-4 rounded-xl bg-surface-secondary/30 border border-border-subtle">
                        <p className="text-muted text-xs sm:text-sm font-sans font-semibold uppercase tracking-wider mb-2">Requirements</p>
                        <ul className="text-ink text-sm sm:text-base leading-relaxed font-sans space-y-1.5 list-disc list-inside">
                            {listing.requirements.map((req, i) => (
                                <li key={i} className="text-ink-secondary">{req}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {listing.tags && listing.tags.length > 0 && (
                    <div className="mt-5">
                        <p className="text-muted text-xs sm:text-sm font-sans font-semibold uppercase tracking-wider mb-2">Skills & Tags</p>
                        <div className="flex flex-wrap gap-2 text-xs sm:text-sm font-sans font-medium">
                            {listing.tags.map((tag) => (
                                <span key={tag} className="text-cyan/80">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </ModalContent>

            <ModalFooter>
                <Button variant="secondary" onClick={onClose}>
                    Close
                </Button>
                {tracked ? (
                    <Button
                        variant="secondary"
                        onClick={() => {
                            onClose();
                            const jobId = getJobId(listing.id);
                            navigate(jobId ? `/applications?job=${jobId}` : "/applications");
                        }}
                        className="text-ink-secondary hover:text-ink"
                    >
                        View in Tracker
                    </Button>
                ) : (
                    <Button
                        variant="outline"
                        disabled={inFlight}
                        onClick={() => addToTracker(listing)}
                        className="border-cyan/40 text-cyan hover:bg-cyan/10 flex items-center gap-1.5"
                    >
                        {inFlight ? (
                            <>
                                <span className="w-3.5 h-3.5 rounded-full border-2 border-cyan border-t-transparent animate-spin" />
                                Adding...
                            </>
                        ) : (
                            "+ Add to Tracker"
                        )}
                    </Button>
                )}
                {listing.link && (
                    <a
                        href={listing.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => recordExternalListingClick(listing)}
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