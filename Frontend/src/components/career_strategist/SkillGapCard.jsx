import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../shared/Card";
import { cn } from "../../utils/cn";

/**
 * SkillGapCard - Displays verified profile skills against target-role gaps,
 * cleanly distinguishing unavailable fallback assessments and incomplete inputs
 * from completed comparisons.
 *
 * @param {Object} props
 * @param {Object} props.skillGapAnalysis
 * @param {boolean} [props.fallbackActive=false]
 * @param {string} [props.pipelineHealth]
 * @param {string} [props.className]
 */
export default function SkillGapCard({
  skillGapAnalysis,
  fallbackActive = false,
  pipelineHealth,
  className,
}) {
  if (!skillGapAnalysis) return null;

  const {
    verifiedCandidateSkills = [],
    criticalMissingSkills = [],
    skillBridgingAdvice,
  } = skillGapAnalysis;

  const hasVerifiedSkills = Array.isArray(verifiedCandidateSkills) && verifiedCandidateSkills.length > 0;
  const hasMissingSkills = Array.isArray(criticalMissingSkills) && criticalMissingSkills.length > 0;

  let headerStatusText = `${verifiedCandidateSkills.length} Verified · ${criticalMissingSkills.length} Gaps`;
  if (!hasMissingSkills) {
    if (fallbackActive) {
      headerStatusText = `${verifiedCandidateSkills.length} Verified · Comparison Unavailable`;
    } else if (!hasVerifiedSkills) {
      headerStatusText = "0 Verified · Profile Incomplete";
    }
  }

  return (
    <Card className={cn("overflow-hidden border-border-primary", className)}>
      <CardHeader className="mb-4">
        <CardTitle className="text-base sm:text-lg flex flex-wrap items-center justify-between gap-2">
          <span>Skill Alignment &amp; Gap Analysis</span>
          <span className="text-xs font-mono font-normal text-muted">
            {headerStatusText}
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Verified Candidate Skills */}
        <div>
          <span className="text-xs font-semibold text-muted uppercase tracking-wider block mb-2.5">
            Verified Profile Competencies
          </span>
          {hasVerifiedSkills ? (
            <div className="flex flex-wrap gap-2">
              {verifiedCandidateSkills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-md text-xs font-medium bg-surface-secondary text-ink border border-border-subtle inline-flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan" aria-hidden="true" />
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs sm:text-sm text-muted">
              No declared technical skills were present in your profile for this run.
            </p>
          )}
        </div>

        {/* Target-Role Skill Gap Status */}
        <div className="pt-4 border-t border-border-subtle">
          <span className="text-xs font-semibold text-muted uppercase tracking-wider block mb-2.5">
            Target-Role Skill Gaps
          </span>

          {hasMissingSkills ? (
            <div className="flex flex-wrap gap-2">
              {criticalMissingSkills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-md text-xs font-medium bg-amber/10 text-amber border border-amber/30 inline-flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber" aria-hidden="true" />
                  {skill}
                </span>
              ))}
            </div>
          ) : fallbackActive ? (
            <div className="flex items-start gap-2.5 text-xs sm:text-sm text-ink-secondary leading-relaxed">
              <svg
                className="w-4 h-4 text-amber shrink-0 mt-0.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <div>
                <p className="font-semibold text-ink">
                  Skill-gap comparison unavailable in deterministic fallback
                </p>
                <p className="text-muted mt-0.5">
                  Offline heuristic mode verifies declared profile skills only and does not query external target-role skill requirements.
                </p>
              </div>
            </div>
          ) : !hasVerifiedSkills ? (
            <div className="flex items-start gap-2.5 text-xs sm:text-sm text-ink-secondary leading-relaxed">
              <svg
                className="w-4 h-4 text-muted shrink-0 mt-0.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <div>
                <p className="font-semibold text-ink">
                  Insufficient skill profile data for gap comparison
                </p>
                <p className="text-muted mt-0.5">
                  Add declared technical skills on your Profile page before comparing against target roles.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5 text-xs sm:text-sm text-ink-secondary leading-relaxed">
              <div className="flex items-start gap-2.5">
                <svg
                  className="w-4 h-4 text-cyan shrink-0 mt-0.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9 12l2 2 4-4" />
                </svg>
                <p>
                  No specific missing skills were flagged based on the declared profile skills and target roles submitted in this run.
                </p>
              </div>
              {pipelineHealth === "insufficient_data" && (
                <p className="text-xs text-muted pl-6">
                  Pipeline telemetry is currently limited; adding target roles and job history improves alignment specificity.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Skill Bridging Advice */}
        {skillBridgingAdvice && (
          <div className="pt-4 border-t border-border-subtle">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider block mb-1.5">
              Skill Bridging Guidance
            </span>
            <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
              {skillBridgingAdvice}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
