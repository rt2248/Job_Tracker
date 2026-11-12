import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../shared/Card";
import Badge from "../shared/Badge";
import { cn } from "../../utils/cn";

const hasOwn = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);

function isValidLatencyMs(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

/**
 * Resolves telemetry inference latency with strict new-field precedence.
 *
 * Invariants:
 * - If `latencyMs` property is present, it is authoritative (valid renders `<n> ms`,
 *   invalid renders an explicit Unavailable state without falling back to `durationMs`).
 * - Legacy `durationMs` is consulted strictly when `latencyMs` property is genuinely absent.
 * - Both fields require a finite non-negative number (>= 0, accepting 0 ms).
 */
function resolveLatencyState(telemetry) {
  if (!telemetry || typeof telemetry !== "object" || Array.isArray(telemetry)) {
    return { kind: "none", value: null, label: null };
  }

  if (hasOwn(telemetry, "latencyMs")) {
    if (isValidLatencyMs(telemetry.latencyMs)) {
      return { kind: "valid", value: telemetry.latencyMs, label: `${telemetry.latencyMs} ms` };
    }
    return { kind: "unavailable", value: null, label: "Unavailable" };
  }

  if (hasOwn(telemetry, "durationMs")) {
    if (isValidLatencyMs(telemetry.durationMs)) {
      return { kind: "valid", value: telemetry.durationMs, label: `${telemetry.durationMs} ms` };
    }
    return { kind: "unavailable", value: null, label: "Unavailable" };
  }

  return { kind: "none", value: null, label: null };
}

/**
 * Resolves authoritative verification status from backend validationAudit DTO.
 *
 * Backend emits `{ schemaValid, evidenceGrounded, discrepancies }`.
 * Legacy test fixtures may emit `{ isValid, status, evidenceCitationCount }`.
 *
 * Invariants:
 * - If either `schemaValid` or `evidenceGrounded` property is present, new-format
 *   semantics are strictly authoritative and legacy `isValid` is never consulted.
 * - Explicit failure (`false`) in either boolean or non-empty `discrepancies`
 *   reports `Audit Discrepancies Found`.
 * - Verified requires both booleans strictly `true` and `discrepancies` array empty.
 * - Missing, malformed, or partial new-format audit objects fail closed as unavailable/incomplete.
 * - Legacy `isValid` compatibility applies strictly when both new-format booleans are absent.
 */
function resolveAuditState(validationAudit) {
  if (!validationAudit || typeof validationAudit !== "object" || Array.isArray(validationAudit)) {
    return {
      status: "unavailable",
      label: "Audit Status Unavailable",
      discrepancyCount: 0,
      discrepancies: [],
    };
  }

  const hasDiscrepancies = Array.isArray(validationAudit.discrepancies);
  const discrepancies = hasDiscrepancies ? validationAudit.discrepancies : [];

  const hasSchemaValidProp = hasOwn(validationAudit, "schemaValid");
  const hasEvidenceGroundedProp = hasOwn(validationAudit, "evidenceGrounded");
  const isNewFormatPresent = hasSchemaValidProp || hasEvidenceGroundedProp;

  // Fail closed immediately on any explicit failure signal
  if (
    validationAudit.schemaValid === false ||
    validationAudit.evidenceGrounded === false ||
    discrepancies.length > 0
  ) {
    return {
      status: "discrepancies",
      label: "Audit Discrepancies Found",
      discrepancyCount: discrepancies.length,
      discrepancies,
    };
  }

  // New-format contract is authoritative whenever either boolean property is present
  if (isNewFormatPresent) {
    const hasSchemaValidBool = typeof validationAudit.schemaValid === "boolean";
    const hasEvidenceGroundedBool = typeof validationAudit.evidenceGrounded === "boolean";

    if (
      hasSchemaValidBool &&
      hasEvidenceGroundedBool &&
      validationAudit.schemaValid === true &&
      validationAudit.evidenceGrounded === true &&
      hasDiscrepancies
    ) {
      return {
        status: "verified",
        label: "Schema & Evidence Verified",
        discrepancyCount: 0,
        discrepancies: [],
      };
    }

    return {
      status: "unavailable",
      label: "Audit Incomplete",
      discrepancyCount: discrepancies.length,
      discrepancies,
    };
  }

  // Legacy format fallback strictly when both new-format booleans are genuinely absent
  if (typeof validationAudit.isValid === "boolean") {
    return validationAudit.isValid
      ? {
          status: "verified",
          label: "Schema & Evidence Verified",
          discrepancyCount: 0,
          discrepancies: [],
        }
      : {
          status: "discrepancies",
          label: "Audit Discrepancies Found",
          discrepancyCount: discrepancies.length,
          discrepancies,
        };
  }

  return {
    status: "unavailable",
    label: "Audit Status Unavailable",
    discrepancyCount: 0,
    discrepancies: [],
  };
}

/**
 * EvidenceGroundingCard - Clearly separates verified candidate inputs and
 * telemetry-backed metric citations from limitations and AI synthesis boundaries.
 *
 * @param {Object} props
 * @param {Object} props.evidenceGrounding
 * @param {Object} [props.validationAudit]
 * @param {Object} [props.telemetry]
 * @param {string} [props.correlationId]
 * @param {string[]} [props.verifiedCandidateSkills]
 * @param {boolean} [props.fallbackActive=false]
 * @param {string} [props.pipelineHealth]
 * @param {boolean} [props.defaultShowTechnicalDetails=false]
 * @param {string} [props.className]
 */
export default function EvidenceGroundingCard({
  evidenceGrounding,
  validationAudit,
  telemetry,
  correlationId,
  verifiedCandidateSkills,
  fallbackActive = false,
  pipelineHealth,
  defaultShowTechnicalDetails = false,
  className,
}) {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(Boolean(defaultShowTechnicalDetails));

  if (!evidenceGrounding) return null;

  const { citedMetrics = [], dataLimitationsNoted } = evidenceGrounding;
  const auditState = resolveAuditState(validationAudit);
  const citationCount =
    typeof validationAudit?.evidenceCitationCount === "number"
      ? validationAudit.evidenceCitationCount
      : citedMetrics.length;

  // Normalize dataLimitationsNoted safely across string or legacy array
  const limitationsList = Array.isArray(dataLimitationsNoted)
    ? dataLimitationsNoted.filter((item) => typeof item === "string" && item.trim().length > 0)
    : typeof dataLimitationsNoted === "string" && dataLimitationsNoted.trim().length > 0
    ? [dataLimitationsNoted.trim()]
    : [];

  const latencyState = resolveLatencyState(telemetry);

  const isInsufficientOrFallback =
    Boolean(fallbackActive) ||
    pipelineHealth === "insufficient_data" ||
    pipelineHealth === "inconsistent_data";

  const statusVariant =
    auditState.status === "verified"
      ? "emerald"
      : auditState.status === "discrepancies"
      ? "amber"
      : "subtle";

  return (
    <Card className={cn("overflow-hidden border-border-primary", className)}>
      <CardHeader className="mb-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-base sm:text-lg">
            Evidence &amp; Verification Audit
          </CardTitle>
          <Badge dot variant={statusVariant} size="sm" className="font-semibold">
            {auditState.label}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="divide-y divide-border-subtle">
        {/* 1. Verified Candidate Skills */}
        <div className="pb-4 space-y-2">
          <span className="text-xs font-semibold text-muted uppercase tracking-wider block">
            Verified Candidate Skills
          </span>
          {Array.isArray(verifiedCandidateSkills) ? (
            verifiedCandidateSkills.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {verifiedCandidateSkills.map((skill, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-md text-xs font-medium bg-surface-secondary border border-border-subtle text-ink"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs sm:text-sm text-muted">
                No declared profile skills were verified for this assessment.
              </p>
            )
          ) : (
            <p className="text-xs sm:text-sm text-muted">
              Verified skill details are displayed in the Skill Alignment section.
            </p>
          )}
        </div>

        {/* 2. Evidence-Backed Cited Metrics */}
        <div className="py-4 space-y-2.5">
          <span className="text-xs font-semibold text-muted uppercase tracking-wider block">
            Telemetry-Backed Metric Citations ({citationCount})
          </span>
          {citedMetrics.length > 0 ? (
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
              {citedMetrics.map((metric, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 text-xs sm:text-sm text-ink"
                >
                  <svg
                    className="w-4 h-4 text-cyan shrink-0 mt-0.5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="font-mono text-xs leading-relaxed pt-0.5">{metric}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs sm:text-sm text-muted">
              No pipeline telemetry metrics were cited in this assessment.
            </p>
          )}
        </div>

        {/* 3. Missing Evidence & Data Limitations */}
        <div className="py-4 space-y-2.5">
          <span className="text-xs font-semibold text-muted uppercase tracking-wider block">
            Missing Evidence &amp; Data Limitations
          </span>
          {limitationsList.length > 0 ? (
            <ul className="space-y-2">
              {limitationsList.map((limitation, idx) => (
                <li
                  key={idx}
                  className="text-xs sm:text-sm text-ink-secondary flex items-start gap-2.5 leading-relaxed"
                >
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
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  <span>{limitation}</span>
                </li>
              ))}
            </ul>
          ) : isInsufficientOrFallback ? (
            <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
              {fallbackActive
                ? "This run used offline deterministic heuristics rather than AI synthesis; external role-skill comparisons and historical trend inferences are limited."
                : "Pipeline history or profile evidence is currently limited; velocity and outcome trends cannot be established reliably."}
            </p>
          ) : (
            <p className="text-xs sm:text-sm text-muted">
              No missing-data limitations were flagged for the submitted profile and telemetry inputs.
            </p>
          )}
        </div>

        {/* 4. Synthesis vs. Verification Boundary */}
        <div className="py-4 space-y-2">
          <span className="text-xs font-semibold text-muted uppercase tracking-wider block">
            Synthesis &amp; Fact Boundary
          </span>
          <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
            {fallbackActive
              ? "Verified profile skills and cited numbers come directly from recorded user inputs. Diagnostic summaries and recommendations were generated locally using deterministic heuristics."
              : "Verified skills and cited telemetry numbers reflect submitted records checked by deterministic backend rules. Diagnostic summaries and recommendations are AI-generated strategic interpretations, not independently verified facts."}
          </p>
        </div>

        {/* Technical Audit Accordion */}
        <div className="pt-4">
          <button
            type="button"
            onClick={() => setShowTechnicalDetails((prev) => !prev)}
            className="text-xs text-cyan hover:underline font-medium flex items-center gap-1.5"
            aria-expanded={showTechnicalDetails}
          >
            <span>{showTechnicalDetails ? "Hide" : "View"} Technical Verification Metadata</span>
            <svg
              className={cn("w-3.5 h-3.5 transition-transform duration-200", showTechnicalDetails && "rotate-180")}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {showTechnicalDetails && (
            <div className="mt-3 p-3.5 rounded-md bg-surface-secondary border border-border-subtle space-y-2 font-mono text-xs text-muted">
              <div className="flex justify-between gap-4">
                <span>Audit Outcome:</span>
                <span className="text-ink font-semibold">{auditState.label}</span>
              </div>
              {typeof validationAudit?.schemaValid === "boolean" && (
                <div className="flex justify-between gap-4">
                  <span>Schema Valid:</span>
                  <span className="text-ink">{validationAudit.schemaValid ? "Yes" : "No"}</span>
                </div>
              )}
              {typeof validationAudit?.evidenceGrounded === "boolean" && (
                <div className="flex justify-between gap-4">
                  <span>Evidence Grounded:</span>
                  <span className="text-ink">{validationAudit.evidenceGrounded ? "Yes" : "No"}</span>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <span>Audit Discrepancies:</span>
                <span className="text-ink">{auditState.discrepancyCount}</span>
              </div>
              {auditState.discrepancies.length > 0 && (
                <ul className="pt-1 border-t border-border-subtle space-y-1 text-amber">
                  {auditState.discrepancies.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              )}
              {telemetry?.providerId && (
                <div className="flex justify-between gap-4">
                  <span>Provider:</span>
                  <span className="text-ink">{telemetry.providerId}</span>
                </div>
              )}
              {telemetry?.modelIdentifier && (
                <div className="flex justify-between gap-4">
                  <span>Model:</span>
                  <span className="text-ink">{telemetry.modelIdentifier}</span>
                </div>
              )}
              {latencyState.kind !== "none" && (
                <div className="flex justify-between gap-4">
                  <span>Inference Latency:</span>
                  <span className={latencyState.kind === "unavailable" ? "text-amber" : "text-ink"}>
                    {latencyState.label}
                  </span>
                </div>
              )}
              {typeof telemetry?.totalTokens === "number" && (
                <div className="flex justify-between gap-4">
                  <span>Token Usage:</span>
                  <span className="text-ink">{telemetry.totalTokens} tokens</span>
                </div>
              )}
              {correlationId && (
                <div className="flex justify-between gap-4 overflow-hidden">
                  <span>Correlation ID:</span>
                  <span className="text-ink truncate max-w-[260px]">{correlationId}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
