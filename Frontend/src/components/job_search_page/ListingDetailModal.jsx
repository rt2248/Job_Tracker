import { useEffect } from "react";
import JobTypeBadge from "../shared/JobTypeBadge";
import WorkModeBadge from "./WorkModeBadge";
import ExperienceLevelBadge from "./ExperienceLevelBadge";
import { formatDate } from "../../utils/formatDate";
import { formatCompensation } from "../../utils/formatCompensation";

function ListingDetailModal({ listing, onClose }) {
    useEffect(() => {
        if (!listing) return;

        const handleKeyDown = (e) => {
            if (e.key === "Escape") onClose();
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [listing, onClose]);

    if (!listing) return null;

    const compensation = formatCompensation(listing);

    return (
        <div
            className="fixed inset-0 bg-canvas/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={onClose}
        >
            <div
                className="bg-surface border border-surface-2 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto p-6"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="font-display text-ink text-xl font-semibold">{listing.title}</h2>
                        <p className="text-muted-light text-sm mt-1">{listing.company} · {listing.location}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-muted-light hover:text-ink text-xl leading-none hover:cursor-pointer"
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>

                <div className="flex items-center gap-2 mt-4 flex-wrap">
                    <JobTypeBadge jobType={listing.jobType} />
                    <WorkModeBadge workMode={listing.workMode} />
                    <ExperienceLevelBadge experienceLevel={listing.experienceLevel} />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6 text-sm">
                    <div>
                        <p className="text-muted text-xs font-mono">Compensation</p>
                        <p className="text-ink mt-1">{compensation || "—"}</p>
                    </div>
                    <div>
                        <p className="text-muted text-xs font-mono">Posted</p>
                        <p className="text-ink mt-1">{formatDate(listing.postedDate)}</p>
                    </div>
                    <div className="col-span-2">
                        <p className="text-muted text-xs font-mono">Apply</p>
                        {listing.link ? (
                            <a
                                href={listing.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-cyan hover:underline mt-1 block truncate"
                            >
                                View posting & apply
                            </a>
                        ) : (
                            <p className="text-ink mt-1">—</p>
                        )}
                    </div>
                </div>

                {listing.description && (
                    <div className="mt-6">
                        <p className="text-muted text-xs font-mono">Description</p>
                        <p className="text-ink text-sm mt-1 leading-relaxed">{listing.description}</p>
                    </div>
                )}

                {listing.requirements && listing.requirements.length > 0 && (
                    <div className="mt-6">
                        <p className="text-muted text-xs font-mono">Requirements</p>
                        <ul className="text-ink text-sm mt-1 leading-relaxed list-disc list-inside">
                            {listing.requirements.map((req, i) => (
                                <li key={i}>{req}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {listing.tags && listing.tags.length > 0 && (
                    <div className="mt-6">
                        <p className="text-muted text-xs font-mono mb-2">Tags</p>
                        <div className="flex flex-wrap gap-1.5">
                            {listing.tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="px-2 py-0.5 rounded-full text-[11px] font-mono bg-surface-2 text-muted-light border border-surface-2"
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default ListingDetailModal;