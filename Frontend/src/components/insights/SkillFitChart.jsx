import React, { useState, useMemo } from "react";
import { cn } from "../../utils/cn";
import RadialProgress from "./RadialProgress";
import EmptyStateVisual from "./EmptyStateVisual";
import StatusBadge from "../applications_page/StatusBadge";

/**
 * Helper to determine color variant from match percentage
 */
function getMatchVariant(percentage) {
  if (typeof percentage !== "number" || Number.isNaN(percentage)) return "default";
  if (percentage >= 70) return "green";
  if (percentage >= 40) return "amber";
  return "red";
}

/**
 * SkillFitChart - Reusable Skill Fit Analysis Visualization Component
 *
 * Visualizes candidate qualification alignment for listing-linked applications.
 * Accurately displays matched skills, missing skills, qualitative requirements,
 * and unrecognized technical terms while adhering strictly to backend semantics.
 *
 * @param {Object} props
 * @param {Object} props.skillFitData - Data from GET /api/insights/skill-fit
 * @param {string} [props.className]
 */
export default function SkillFitChart({
  skillFitData,
  className,
}) {
  const [selectedJobId, setSelectedJobId] = useState(null);

  // Average match score across evaluated jobs
  const averageMatch = useMemo(() => {
    const list = skillFitData?.jobFitSummaries;
    if (!Array.isArray(list) || list.length === 0) return null;
    const valid = list.filter((j) => typeof j.matchPercentage === "number");
    if (valid.length === 0) return null;
    const sum = valid.reduce((acc, cur) => acc + cur.matchPercentage, 0);
    return Math.round(sum / valid.length);
  }, [skillFitData?.jobFitSummaries]);

  const userDeclaredSkills = skillFitData?.userDeclaredSkills || [];
  const coverage = skillFitData?.coverage || {
    totalTrackedJobs: 0,
    listingLinkedJobs: 0,
    unlinkedJobs: 0,
    coveragePercentage: 0,
  };
  const jobFitSummaries = skillFitData?.jobFitSummaries || [];
  const disclaimer =
    skillFitData?.disclaimer ||
    "Skill match is an automated estimate based on recognizable keywords in job listings and does not replace a full evaluation of candidate qualifications.";

  if (!skillFitData) {
    return (
      <div className={cn("bg-surface border border-border-primary rounded-xl p-6", className)}>
        <EmptyStateVisual iconType="skills" title="Skill-Fit Data Unavailable" description="No skill match metrics could be retrieved." />
      </div>
    );
  }

  const hasLinkedJobs = coverage.listingLinkedJobs > 0 && jobFitSummaries.length > 0;

  return (
    <div
      className={cn(
        "bg-surface border border-border-primary rounded-xl p-4 sm:p-6 transition-all",
        className
      )}
      role="region"
      aria-label="Skill-fit analysis"
    >
      {/* Header */}
      <div className="mb-6 sm:mb-7">
        <h3 className="font-display text-ink text-lg sm:text-xl font-semibold leading-tight">
          Skill-Fit Analysis
        </h3>
        <p className="text-sm text-muted mt-1">
          Automated keyword matching across {coverage.listingLinkedJobs} of {coverage.totalTrackedJobs} evaluated opportunities against your declared profile skills
        </p>
      </div>

      {/* Declared Profile Skills Pills */}
      <div className="mb-8 sm:mb-9 p-3 sm:p-4 rounded-xl bg-surface-secondary/40 border border-border-subtle">
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <span className="text-sm sm:text-base font-sans font-semibold text-ink flex items-center gap-1.5">
            <svg viewBox="0 0 14 14" className="w-3.5 h-3.5 text-cyan shrink-0" fill="none">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Your Declared Skills ({userDeclaredSkills.length})
          </span>
          <span className="text-xs sm:text-sm text-muted">Configured in Profile</span>
        </div>

        {userDeclaredSkills.length > 0 ? (
          <div className="flex flex-wrap gap-2" role="list" aria-label="User profile skills list">
            {userDeclaredSkills.map((skill) => (
              <span
                key={skill}
                role="listitem"
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs sm:text-sm font-sans font-medium bg-surface border border-border-primary text-ink-secondary"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-cyan shrink-0" aria-hidden="true" />
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted italic">
            No profile skills declared yet. Add skills in your Profile to enable keyword matching.
          </p>
        )}
      </div>

      {/* Coverage Bar & Transparency Caveat */}
      <div className="mb-8 sm:mb-9 p-3 rounded-lg bg-surface-secondary/20 border border-border-subtle/80 flex flex-col gap-2.5">
        <div className="flex items-center justify-between text-sm">
          <span className="text-ink font-medium">Evaluation Coverage</span>
          <span className="font-mono text-muted text-xs sm:text-sm">
            {coverage.listingLinkedJobs} linked / {coverage.unlinkedJobs} manual
          </span>
        </div>

        {/* Proportional Mini Bar */}
        <div className="w-full h-2 rounded-full overflow-hidden bg-surface border border-border-subtle flex">
          <div
            className="h-full bg-cyan transition-all duration-500"
            style={{ width: `${Math.min(100, coverage.coveragePercentage)}%` }}
            title={`Listing-Linked: ${coverage.listingLinkedJobs}`}
          />
          <div
            className="h-full bg-slate-500/40 transition-all duration-500"
            style={{ width: `${Math.max(0, 100 - coverage.coveragePercentage)}%` }}
            title={`Manually Tracked: ${coverage.unlinkedJobs}`}
          />
        </div>

        <div className="flex items-start gap-1.5 text-xs sm:text-sm text-muted leading-relaxed mt-1">
          <svg viewBox="0 0 12 12" className="w-3.5 h-3.5 text-muted shrink-0 mt-0.5" fill="none">
            <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1" />
            <path d="M6 5v4M6 3.5h.01" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
          </svg>
          <span>{coverage.note || "Only jobs linked to the Job Search board have structured skill requirements."}</span>
        </div>
      </div>

      {/* Main Content Area */}
      {!hasLinkedJobs ? (
        <EmptyStateVisual
          iconType="skills"
          title="No Listing-Linked Applications"
          description="Skill-fit analysis requires structured listing requirements. Applications tracked manually cannot be evaluated automatically. Save or apply to listings from the Job Search board to view match metrics."
          className="py-10"
        />
      ) : (
        <div className="space-y-6 sm:space-y-7">
          {/* Average Match Overview Card */}
          {averageMatch !== null && (
            <div className="flex items-center justify-between p-3.5 sm:p-4 rounded-xl bg-surface-secondary/50 border border-border-subtle">
              <div>
                <h4 className="font-display text-base sm:text-lg font-semibold text-ink">
                  Average Opportunity Fit
                </h4>
                <p className="text-sm text-muted mt-1">
                  Mean match score across all {jobFitSummaries.length} evaluated listings
                </p>
              </div>

              <div className="flex items-center gap-3">
                <RadialProgress
                  value={averageMatch}
                  size={58}
                  strokeWidth={5}
                  variant={getMatchVariant(averageMatch)}
                  sublabel="AVG"
                />
              </div>
            </div>
          )}

          {/* Evaluated Listings Cards */}
          <div className="space-y-3.5 sm:space-y-4" role="list" aria-label="Evaluated job listings">
            {jobFitSummaries.map((job) => {
              const isSelected = selectedJobId === job.jobId;
              const variant = getMatchVariant(job.matchPercentage);

              return (
                <div
                  key={job.jobId}
                  role="listitem"
                  tabIndex={0}
                  onClick={() => setSelectedJobId(isSelected ? null : job.jobId)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setSelectedJobId(isSelected ? null : job.jobId);
                    }
                  }}
                  className={cn(
                    "p-4 rounded-xl border transition-all cursor-pointer select-none",
                    "bg-surface-secondary/30 border-border-primary/80 hover:border-border-accent/40",
                    isSelected && "border-border-accent/50 bg-surface-secondary/70 ring-1 ring-border-accent/30 shadow-sm"
                  )}
                >
                  {/* Job Row Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 mb-2.5 border-b border-border-subtle/80">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-display text-base sm:text-lg font-semibold text-ink truncate">
                          {job.role}
                        </h4>
                        <span className="text-muted text-xs sm:text-sm font-sans">•</span>
                        <span className="text-ink-secondary text-sm font-sans font-medium">
                          {job.company}
                        </span>
                        <StatusBadge status={job.status} className="ml-1 text-xs sm:text-sm" />
                      </div>
                      <p className="text-sm text-muted mt-1">
                        {job.identifiableSkills.length} recognizable technical requirements
                      </p>
                    </div>

                    {/* Radial Progress Match Score */}
                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                      <RadialProgress
                        value={job.matchPercentage}
                        size={52}
                        strokeWidth={4.5}
                        variant={variant}
                      />
                    </div>
                  </div>

                  {/* Skills Breakdown Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4 pt-3.5 text-sm">
                    {/* 1. Matched Skills */}
                    <div className="p-2.5 rounded-lg bg-surface/60 border border-border-subtle/80">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-ink flex items-center gap-1.5 text-xs sm:text-sm">
                          <svg viewBox="0 0 12 12" className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" fill="none">
                            <path d="M2.5 6.5 L4.5 8.5 L9.5 3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                          Matched Skills ({job.matchedSkills.length})
                        </span>
                      </div>

                      {job.matchedSkills.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {job.matchedSkills.map((s) => (
                            <span
                              key={s}
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs sm:text-sm font-sans font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25"
                            >
                              ✓ {s}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs sm:text-sm text-muted italic">No overlapping skills detected</span>
                      )}
                    </div>

                    {/* 2. Missing Identifiable Skills */}
                    <div className="p-2.5 rounded-lg bg-surface/60 border border-border-subtle/80">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="font-semibold text-ink flex items-center gap-1.5 text-xs sm:text-sm">
                          <svg viewBox="0 0 12 12" className="w-3.5 h-3.5 text-red shrink-0" fill="none">
                            <path d="M3 3 L9 9 M9 3 L3 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                          </svg>
                          Missing Curated Skills ({job.missingSkills.length})
                        </span>
                      </div>

                      {job.missingSkills.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {job.missingSkills.map((s) => (
                            <span
                              key={s}
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs sm:text-sm font-sans font-medium bg-red/10 text-red border border-red/25"
                            >
                              − {s}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs sm:text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                          All recognizable skills present in profile!
                        </span>
                      )}
                    </div>

                    {/* 3. Qualitative Requirements */}
                    {job.qualitativeRequirements && job.qualitativeRequirements.length > 0 && (
                      <div className="p-2.5 rounded-lg bg-surface/60 border border-border-subtle/80 md:col-span-2">
                        <span className="font-semibold text-ink-secondary text-xs sm:text-sm block mb-1.5 flex items-center gap-1">
                          <svg viewBox="0 0 12 12" className="w-3.5 h-3.5 text-muted shrink-0" fill="none">
                            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.25" />
                            <path d="M6 5v3.5M6 3.5h.01" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
                          </svg>
                          Qualitative / Role Requirements ({job.qualitativeRequirements.length})
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {job.qualitativeRequirements.map((req, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2.5 py-0.5 rounded text-xs sm:text-sm font-sans bg-surface-secondary text-muted border border-border-subtle"
                            >
                              {req}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 4. Unrecognized Technical Terms */}
                    {job.unrecognizedTerms && job.unrecognizedTerms.length > 0 && (
                      <div className="p-2.5 rounded-lg bg-surface/60 border border-border-subtle/80 md:col-span-2">
                        <span className="font-semibold text-ink-secondary text-xs sm:text-sm block mb-1.5 flex items-center gap-1">
                          <svg viewBox="0 0 12 12" className="w-3.5 h-3.5 text-amber shrink-0" fill="none">
                            <polygon points="6,1 11,10 1,10" stroke="currentColor" strokeWidth="1.25" />
                            <path d="M6 5v2.5M6 9h.01" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
                          </svg>
                          Terms Outside Curated Vocabulary ({job.unrecognizedTerms.length})
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {job.unrecognizedTerms.map((term, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2.5 py-0.5 rounded text-xs sm:text-sm font-sans bg-surface-secondary text-amber/90 border border-amber/30 border-dashed"
                              title="Term detected in listing requirements but not present in curated skill vocabulary"
                            >
                              {term}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Mandatory Suitability Disclaimer Banner */}
      <div className="mt-5 pt-3 border-t border-border-subtle/70 flex items-start gap-2 text-xs sm:text-sm text-muted leading-relaxed">
        <svg viewBox="0 0 14 14" className="w-3.5 h-3.5 text-muted shrink-0 mt-0.5" fill="none">
          <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.25" />
          <path d="M7 6v4M7 4h.01" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" />
        </svg>
        <span>{disclaimer}</span>
      </div>
    </div>
  );
}
