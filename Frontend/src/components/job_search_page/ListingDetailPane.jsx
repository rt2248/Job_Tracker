import React from "react";
import { useNavigate } from "react-router-dom";
import JobTypeBadge from "../shared/JobTypeBadge";
import WorkModeBadge from "./WorkModeBadge";
import ExperienceLevelBadge from "./ExperienceLevelBadge";
import MatchScoreBadge from "./MatchScoreBadge";
import Button from "../shared/Button";
import { useTrackListing } from "../../hooks/useTrackListing";
import { recordExternalListingClick } from "../../utils/promptStorage";
import { formatDate } from "../../utils/formatDate";
import { formatCompensation } from "../../utils/formatCompensation";
import arrowBack from "../../assets/icons/navigation/arrow-back.svg";
import { cn } from "../../utils/cn";

export default function ListingDetailPane({ listing, onBack, className }) {
    const { isTracked, getJobId, addToTracker, isInFlight } = useTrackListing();
    const navigate = useNavigate();

    if (!listing) {
        return (
            <div className={cn("h-full flex flex-col items-center justify-center p-8 text-center bg-surface-secondary/40 border border-border-primary rounded-xl", className)}>
                <div className="w-12 h-12 rounded-xl bg-surface-elevated border border-border-subtle flex items-center justify-center text-muted mb-4 font-mono text-lg font-bold">
                    EX
                </div>
                <h3 className="font-display text-lg sm:text-xl font-bold text-ink mb-1.5">
                    Select a Job Opportunity
                </h3>
                <p className="text-muted text-sm sm:text-base font-sans max-w-sm leading-relaxed">
                    Choose a listing from the collection to inspect full role requirements, compensation, and compatibility breakdown.
                </p>
            </div>
        );
    }

    const compensation = formatCompensation(listing);
    const tracked = isTracked(listing.id);
    const inFlight = isInFlight(listing.id);
    const matchExplanation = listing.matchExplanation;
    const hasMatchData = listing.score !== undefined && listing.score !== null && listing.tier !== "ONBOARDING_BASELINE";

    return (
        <article className={cn("flex flex-col h-full bg-surface-secondary/60 border border-border-primary rounded-xl overflow-hidden card-3d", className)}>
            {/* Scrollable Content Region */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 lg:p-7 custom-scrollbar space-y-6">
                
                {/* Mobile Back Control */}
                {onBack && (
                    <div className="lg:hidden pb-3 border-b border-border-subtle">
                        <button
                            type="button"
                            onClick={onBack}
                            className="inline-flex items-center gap-2 text-sm font-medium text-ink-secondary hover:text-ink cursor-pointer transition-colors"
                            aria-label="Back to job listings list"
                        >
                            <img src={arrowBack} className="w-4 h-4 opacity-80" alt="" aria-hidden="true" />
                            <span>Back to listings</span>
                        </button>
                    </div>
                )}

                {/* Job Header */}
                <div>
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                        <h1 className="font-display text-xl sm:text-2xl lg:text-3xl font-bold text-ink tracking-tight leading-snug">
                            {listing.title}
                        </h1>
                        {hasMatchData && (
                            <MatchScoreBadge score={listing.score} tier={listing.tier} showTier size="md" />
                        )}
                    </div>

                    <p className="text-muted text-sm sm:text-base font-sans mt-2 flex items-center gap-2 flex-wrap">
                        <span className="text-ink font-semibold">{listing.company}</span>
                        {listing.location && <span>· {listing.location}</span>}
                        <span className="text-border-primary/80" aria-hidden="true">·</span>
                        <JobTypeBadge jobType={listing.jobType || listing.employmentType} />
                        <span className="text-border-primary/80" aria-hidden="true">·</span>
                        <WorkModeBadge workMode={listing.workMode} />
                        {listing.experienceLevel && (
                            <>
                                <span className="text-border-primary/80" aria-hidden="true">·</span>
                                <ExperienceLevelBadge experienceLevel={listing.experienceLevel} />
                            </>
                        )}
                    </p>
                </div>

                {/* Match Compatibility Breakdown (For You View) */}
                {hasMatchData && matchExplanation && (
                    <div className="p-4 sm:p-5 rounded-xl bg-surface-elevated/70 border border-cyan/30 text-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-border-subtle pb-2.5">
                            <h2 className="font-display font-bold text-ink text-base tracking-tight flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-cyan" aria-hidden="true" />
                                Candidate Compatibility Breakdown
                            </h2>
                            {listing.evidence && (
                                <span className="text-muted font-mono text-xs">
                                    Coverage: {Math.round((listing.evidence.applicableCoverage || 0) * 100)}%
                                </span>
                            )}
                        </div>

                        {/* Skills Breakdown */}
                        <div>
                            <p className="text-muted text-xs font-sans font-semibold uppercase tracking-wider mb-2">
                                Skills Alignment
                            </p>
                            <div className="flex flex-wrap gap-2 text-xs font-sans">
                                {matchExplanation.matchedSkills?.map((s) => (
                                    <span key={s} className="px-2.5 py-1 rounded-md bg-cyan/15 text-cyan border border-cyan/30 font-medium">
                                        ✓ #{s}
                                    </span>
                                ))}
                                {matchExplanation.transferableMatches?.map((t) => (
                                    <span key={t.requiredSkill} className="px-2.5 py-1 rounded-md bg-indigo/15 text-indigo-300 border border-indigo/30 font-medium">
                                        ⇄ #{t.requiredSkill} <span className="text-muted text-[11px]">(via {t.transferableFrom})</span>
                                    </span>
                                ))}
                                {matchExplanation.missingSkills?.map((m) => (
                                    <span key={m} className="px-2.5 py-1 rounded-md bg-surface-overlay text-muted border border-border-subtle">
                                        #{m}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Seniority & Alignment Summary */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border-subtle/60 text-xs">
                            <div>
                                <span className="text-muted block mb-0.5">Seniority Compatibility</span>
                                <span className="text-ink font-medium capitalize">
                                    {matchExplanation.seniority?.candidateLevel
                                        ? `${matchExplanation.seniority.candidateLevel} candidate vs ${matchExplanation.seniority.listingLevel || "unspecified"} listing`
                                        : "Not evaluated"}
                                </span>
                            </div>
                            <div>
                                <span className="text-muted block mb-0.5">Location Alignment</span>
                                <span className="text-ink font-medium">
                                    {matchExplanation.locationFit === "REMOTE_EXCLUDED"
                                        ? "Remote listing (Location invariant)"
                                        : matchExplanation.locationFit === "MATCH"
                                        ? "Metropolitan region match"
                                        : matchExplanation.locationFit === "MISMATCH"
                                        ? "Different metropolitan region"
                                        : "Unevaluated"}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Key Metrics: Compensation & Posted Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-surface-secondary/70 border border-border-subtle text-sm">
                    <div>
                        <p className="text-muted text-xs font-sans font-semibold uppercase tracking-wider">
                            Compensation
                        </p>
                        <p className="text-cyan font-mono font-bold text-base sm:text-lg mt-1">
                            {compensation || "Undisclosed"}
                        </p>
                    </div>
                    <div>
                        <p className="text-muted text-xs font-sans font-semibold uppercase tracking-wider">
                            Date Posted
                        </p>
                        <p className="text-ink font-mono font-bold text-base sm:text-lg mt-1">
                            {formatDate(listing.postedDate)}
                        </p>
                    </div>
                </div>

                {/* Description */}
                {listing.description && (
                    <div className="p-4 sm:p-5 rounded-xl bg-surface-secondary/40 border border-border-subtle">
                        <h2 className="text-muted text-xs font-sans font-semibold uppercase tracking-wider mb-2">
                            Job Description
                        </h2>
                        <p className="text-ink text-sm sm:text-base leading-relaxed font-sans whitespace-pre-wrap">
                            {listing.description}
                        </p>
                    </div>
                )}

                {/* Requirements */}
                {listing.requirements && listing.requirements.length > 0 && (
                    <div className="p-4 sm:p-5 rounded-xl bg-surface-secondary/40 border border-border-subtle">
                        <h2 className="text-muted text-xs font-sans font-semibold uppercase tracking-wider mb-2.5">
                            Role Requirements
                        </h2>
                        <ul className="text-ink text-sm sm:text-base leading-relaxed font-sans space-y-2 list-disc list-inside">
                            {listing.requirements.map((req, i) => (
                                <li key={i} className="text-ink-secondary">
                                    {req}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Tags */}
                {listing.tags && listing.tags.length > 0 && (
                    <div>
                        <h2 className="text-muted text-xs font-sans font-semibold uppercase tracking-wider mb-2">
                            Skills & Topic Tags
                        </h2>
                        <div className="flex flex-wrap gap-2 text-xs sm:text-sm font-sans font-medium">
                            {listing.tags.map((tag) => (
                                <span key={tag} className="px-2.5 py-1 rounded-md bg-surface-elevated text-cyan/90 border border-border-subtle font-mono">
                                    #{tag}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Sticky Action Footer */}
            <div className="p-4 sm:p-5 border-t border-border-primary bg-surface/90 backdrop-blur-sm flex items-center justify-between gap-3 shrink-0">
                <div>
                    {tracked ? (
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                                const jobId = getJobId(listing.id);
                                navigate(jobId ? `/applications?job=${jobId}` : "/applications");
                            }}
                            className="text-ink-secondary hover:text-ink text-sm px-3.5 py-2"
                        >
                            View in Tracker
                        </Button>
                    ) : (
                        <Button
                            variant="outline"
                            size="sm"
                            disabled={inFlight}
                            onClick={() => addToTracker(listing)}
                            className="border-cyan/60 text-cyan hover:bg-cyan/10 flex items-center gap-1.5 text-sm px-3.5 py-2"
                        >
                            {inFlight ? (
                                <>
                                    <span className="w-3.5 h-3.5 rounded-full border-2 border-cyan border-t-transparent animate-spin" aria-hidden="true" />
                                    <span>Adding...</span>
                                </>
                            ) : (
                                "+ Add to Tracker"
                            )}
                        </Button>
                    )}
                </div>

                {listing.link && (
                    <a
                        href={listing.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => recordExternalListingClick(listing)}
                    >
                        <Button variant="primary" size="sm" className="text-sm px-4 py-2 font-semibold">
                            View Posting & Apply ↗
                        </Button>
                    </a>
                )}
            </div>
        </article>
    );
}
