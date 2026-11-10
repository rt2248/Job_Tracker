import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../shared/Card";
import { cn } from "../../utils/cn";

/**
 * EvidenceGroundingCard - Discloses cited numerical telemetry, data limitations,
 * and deterministic validation audit status.
 *
 * Demonstrates the AI validation boundary guarantees: zero ungrounded assertions.
 *
 * @param {Object} props
 * @param {Object} props.evidenceGrounding
 * @param {Object} [props.validationAudit]
 * @param {Object} [props.telemetry]
 * @param {string} [props.correlationId]
 * @param {string} [props.className]
 */
export default function EvidenceGroundingCard({
  evidenceGrounding,
  validationAudit,
  telemetry,
  correlationId,
  className,
}) {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  if (!evidenceGrounding) return null;

  const { citedMetrics = [], dataLimitationsNoted } = evidenceGrounding;
  const isValid = validationAudit ? validationAudit.isValid : true;
  const citationCount = validationAudit?.evidenceCitationCount ?? citedMetrics.length;

  // Normalize dataLimitationsNoted: handle string (backend DTO contract) and array gracefully
  const limitationsList = Array.isArray(dataLimitationsNoted)
    ? dataLimitationsNoted
    : typeof dataLimitationsNoted === "string" && dataLimitationsNoted.trim().length > 0
    ? [dataLimitationsNoted.trim()]
    : [];

  return (
    <Card className={cn("overflow-hidden border-border-primary", className)}>
      <CardHeader className="mb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-base sm:text-lg flex items-center gap-2">
            <span>Evidence Grounding & Verification Audit</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border",
                isValid
                  ? "bg-green/10 text-green border-green/30"
                  : "bg-amber/10 text-amber border-amber/30"
              )}
            >
              <span className={cn("w-1.5 h-1.5 rounded-full", isValid ? "bg-green" : "bg-amber")} />
              {isValid ? "100% Grounded" : "Audit Discrepancies"}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Cited Metrics */}
        <div>
          <span className="text-xs font-semibold text-muted uppercase tracking-wider block mb-2">
            Ground-Truth Metric Citations ({citationCount}):
          </span>
          {citedMetrics.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {citedMetrics.map((metric, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-surface-secondary/70 border border-border-subtle flex items-start gap-2 text-xs text-ink"
                >
                  <span className="text-cyan font-bold">✓</span>
                  <span className="flex-1 font-mono text-xs">{metric}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-muted italic">No numerical telemetry citations required for this diagnosis.</p>
          )}
        </div>

        {/* Data Limitations */}
        {limitationsList.length > 0 && (
          <div>
            <span className="text-xs font-semibold text-muted uppercase tracking-wider block mb-2">
              Telemetry Limitations Noted:
            </span>
            <ul className="space-y-1.5">
              {limitationsList.map((limitation, idx) => (
                <li
                  key={idx}
                  className="text-xs text-ink-secondary flex items-start gap-2"
                >
                  <span className="text-amber font-bold">⚠</span>
                  <span>{limitation}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Technical Audit Accordion */}
        <div className="pt-2 border-t border-border-subtle">
          <button
            type="button"
            onClick={() => setShowTechnicalDetails((prev) => !prev)}
            className="text-xs text-cyan hover:underline font-medium flex items-center gap-1.5"
          >
            <span>{showTechnicalDetails ? "Hide" : "View"} Verification Audit Metadata</span>
            <span className="text-[10px]">{showTechnicalDetails ? "▲" : "▼"}</span>
          </button>

          {showTechnicalDetails && (
            <div className="mt-3 p-3 rounded-lg bg-canvas border border-border-subtle space-y-2 font-mono text-xs text-muted">
              <div className="flex justify-between">
                <span>Validation Status:</span>
                <span className="text-ink font-semibold">{validationAudit?.status || "VALID"}</span>
              </div>
              <div className="flex justify-between">
                <span>Unsupported Claims Neutralized:</span>
                <span className="text-ink">
                  {validationAudit?.unsupportedClaimsNeutralized ? "Yes" : "None detected"}
                </span>
              </div>
              {telemetry?.durationMs && (
                <div className="flex justify-between">
                  <span>Execution Duration:</span>
                  <span className="text-ink">{telemetry.durationMs} ms</span>
                </div>
              )}
              {correlationId && (
                <div className="flex justify-between overflow-hidden text-ellipsis">
                  <span>Correlation ID:</span>
                  <span className="text-ink truncate max-w-[220px]">{correlationId}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
