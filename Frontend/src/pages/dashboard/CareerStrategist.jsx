import React, { useRef } from "react";
import useCareerStrategist from "../../hooks/useCareerStrategist";
import Button from "../../components/shared/Button";
import ThemeToggleButton from "../../components/shared/ThemeToggleButton";
import {
  FallbackNoticeBanner,
  CandidateSummaryCard,
  StrategicRecommendationsList,
  SkillGapCard,
  PipelineDiagnosticsCard,
  EvidenceGroundingCard,
  CareerStrategistEmptyState,
} from "../../components/career_strategist";

/**
 * Loading Skeleton Component.
 */
function AssessmentSkeleton() {
  return (
    <div className="space-y-6 animate-pulse" aria-busy="true" aria-label="Generating assessment...">
      <div className="p-4 rounded-xl bg-surface border border-border-primary flex items-center gap-4">
        <div className="w-8 h-8 rounded-lg bg-surface-secondary" />
        <div className="space-y-2 flex-1">
          <div className="h-4 bg-surface-secondary rounded w-1/3" />
          <div className="h-3 bg-surface-secondary rounded w-1/2" />
        </div>
      </div>

      <div className="p-6 rounded-xl bg-surface border border-border-primary space-y-4">
        <div className="h-5 bg-surface-secondary rounded w-1/4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="h-16 bg-surface-secondary rounded-lg" />
          <div className="h-16 bg-surface-secondary rounded-lg" />
        </div>
        <div className="h-20 bg-surface-secondary rounded-lg" />
      </div>

      <div className="space-y-4">
        <div className="h-5 bg-surface-secondary rounded w-1/4" />
        <div className="h-28 bg-surface-secondary rounded-xl" />
        <div className="h-28 bg-surface-secondary rounded-xl" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-44 bg-surface-secondary rounded-xl" />
        <div className="h-44 bg-surface-secondary rounded-xl" />
      </div>
    </div>
  );
}

/**
 * CareerStrategist - Main Page for AI-driven, evidence-grounded strategic diagnosis.
 */
export default function CareerStrategist() {
  const {
    assessment,
    validationAudit,
    fallbackActive,
    fallbackMetadata,
    correlationId,
    telemetry,
    isLoading,
    error,
    generateAssessment,
    cancel,
    reset: resetState,
  } = useCareerStrategist();

  const lastParamsRef = useRef({});

  const handleRunAssessment = (params) => {
    if (params && Object.keys(params).length > 0) {
      lastParamsRef.current = params;
    }
    generateAssessment(lastParamsRef.current);
  };

  const handleReset = () => {
    lastParamsRef.current = {};
    resetState();
  };

  return (
    <main
      className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 lg:p-8 pb-12 sm:pb-16 flex flex-col min-w-0"
      role="main"
      aria-label="Career Strategist Page"
    >
      {/* 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-8 sm:mb-10 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl">🧭</span>
            <h1 className="font-display text-2xl sm:text-3xl text-ink font-bold tracking-tight">
              Career Strategist
            </h1>
          </div>
          <p className="text-muted text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            AI-driven strategic diagnosis grounded in your active pipeline telemetry and verified skills.
            Bounded by deterministic zero-hallucination validation.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          {isLoading ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={cancel}
              className="text-xs"
              aria-label="Cancel in-flight assessment generation"
            >
              Cancel Generation
            </Button>
          ) : assessment ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="text-xs"
                title="Clear current assessment"
              >
                Reset
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleRunAssessment()}
                className="text-xs font-semibold"
              >
                Regenerate Assessment
              </Button>
            </>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleRunAssessment()}
              isLoading={isLoading}
              className="text-xs font-semibold"
            >
              Run Assessment
            </Button>
          )}

          <ThemeToggleButton />
        </div>
      </div>

      {/* 2. Error Banner */}
      {error && (
        <div
          role="alert"
          className="mb-6 p-4 rounded-xl bg-red/10 border border-red/30 text-ink flex items-start justify-between gap-4"
        >
          <div className="flex items-start gap-3">
            <span className="text-red font-bold text-base mt-0.5">✕</span>
            <div className="space-y-1">
              <h4 className="font-semibold text-xs sm:text-sm text-red">
                Assessment Failed ({error.code || "ERROR"})
              </h4>
              <p className="text-xs text-ink-secondary leading-relaxed">
                {error.message || "An unexpected error occurred during assessment generation."}
              </p>
              {error.correlationId && (
                <span className="text-[11px] font-mono text-muted block">
                  Correlation ID: {error.correlationId}
                </span>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleRunAssessment()}
            className="text-xs text-ink shrink-0"
          >
            Retry
          </Button>
        </div>
      )}

      {/* 3. Main Content Area */}
      <div className="space-y-6">
        {isLoading ? (
          <AssessmentSkeleton />
        ) : assessment ? (
          <>
            {/* Fallback Notice Banner */}
            <FallbackNoticeBanner
              fallbackActive={fallbackActive}
              fallbackMetadata={fallbackMetadata}
            />

            {/* Candidate Summary Card */}
            <CandidateSummaryCard
              candidateSummary={assessment.candidateSummary}
            />

            {/* Strategic Recommendations List */}
            <StrategicRecommendationsList
              recommendations={assessment.strategicRecommendations}
            />

            {/* Two-Column Grid: Skill Gap & Pipeline Diagnostics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SkillGapCard skillGapAnalysis={assessment.skillGapAnalysis} />
              <PipelineDiagnosticsCard
                pipelineDiagnostics={assessment.pipelineDiagnostics}
              />
            </div>

            {/* Evidence Grounding & Verification Audit */}
            <EvidenceGroundingCard
              evidenceGrounding={assessment.evidenceGrounding}
              validationAudit={validationAudit}
              telemetry={telemetry}
              correlationId={correlationId}
            />
          </>
        ) : (
          <CareerStrategistEmptyState
            onGenerate={handleRunAssessment}
            isLoading={isLoading}
          />
        )}
      </div>
    </main>
  );
}
