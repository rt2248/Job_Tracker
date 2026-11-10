import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../shared/Card";
import { cn } from "../../utils/cn";

/**
 * SkillGapCard - Displays verified profile skills against critical missing skills,
 * paired with strategic bridging advice.
 *
 * @param {Object} props
 * @param {Object} props.skillGapAnalysis
 * @param {string} [props.className]
 */
export default function SkillGapCard({ skillGapAnalysis, className }) {
  if (!skillGapAnalysis) return null;

  const {
    verifiedCandidateSkills = [],
    criticalMissingSkills = [],
    skillBridgingAdvice,
  } = skillGapAnalysis;

  return (
    <Card className={cn("overflow-hidden border-border-primary", className)}>
      <CardHeader className="mb-3">
        <CardTitle className="text-base sm:text-lg flex items-center justify-between">
          <span>Skill Alignment & Gap Analysis</span>
          <span className="text-xs font-normal text-muted">
            {verifiedCandidateSkills.length} Verified · {criticalMissingSkills.length} Gaps
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Verified Candidate Skills */}
        <div>
          <span className="text-xs font-semibold text-muted uppercase tracking-wider block mb-2">
            Verified Profile Competencies:
          </span>
          {verifiedCandidateSkills.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {verifiedCandidateSkills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-cyan/10 text-cyan border border-cyan/30 inline-flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan" />
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted italic">No verified skills recorded in candidate profile.</p>
          )}
        </div>

        {/* Critical Missing Skills */}
        <div>
          <span className="text-xs font-semibold text-muted uppercase tracking-wider block mb-2">
            Critical Market Gaps (for Target Roles):
          </span>
          {criticalMissingSkills.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {criticalMissingSkills.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg text-xs font-medium bg-amber/10 text-amber border border-amber/30 inline-flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber" />
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-xs text-green font-medium">
              ✓ No critical skill gaps identified for your target positioning.
            </p>
          )}
        </div>

        {/* Skill Bridging Advice */}
        {skillBridgingAdvice && (
          <div className="p-3.5 rounded-lg bg-surface-secondary/70 border border-border-subtle">
            <span className="text-xs font-semibold text-ink uppercase tracking-wider block mb-1">
              Strategic Bridging Guidance:
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
