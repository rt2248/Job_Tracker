import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../shared/Card";
import { cn } from "../../utils/cn";

/**
 * PipelineDiagnosticsCard - Surfaces application volume metrics, velocity, and staleness diagnostics.
 *
 * @param {Object} props
 * @param {Object} props.pipelineDiagnostics
 * @param {string} [props.className]
 */
export default function PipelineDiagnosticsCard({ pipelineDiagnostics, className }) {
  if (!pipelineDiagnostics) return null;

  const {
    volumeAssessment,
    stageProgressionVelocity,
    staleApplicationRisk,
  } = pipelineDiagnostics;

  return (
    <Card className={cn("overflow-hidden border-border-primary", className)}>
      <CardHeader className="mb-3">
        <CardTitle className="text-base sm:text-lg flex items-center gap-2">
          <span>Pipeline Telemetry Diagnostics</span>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-3.5">
        {/* Volume Assessment */}
        <div className="p-3.5 rounded-lg bg-surface-secondary/60 border border-border-subtle">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-cyan" />
            <span className="text-xs font-semibold text-ink uppercase tracking-wider">
              Application Volume
            </span>
          </div>
          <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
            {volumeAssessment || "No volume assessment available."}
          </p>
        </div>

        {/* Stage Progression Velocity */}
        <div className="p-3.5 rounded-lg bg-surface-secondary/60 border border-border-subtle">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo" />
            <span className="text-xs font-semibold text-ink uppercase tracking-wider">
              Stage Velocity
            </span>
          </div>
          <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
            {stageProgressionVelocity || "No velocity data available."}
          </p>
        </div>

        {/* Stale Application Risk */}
        <div className="p-3.5 rounded-lg bg-surface-secondary/60 border border-border-subtle">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-amber" />
            <span className="text-xs font-semibold text-ink uppercase tracking-wider">
              Staleness & Pipeline Hygiene
            </span>
          </div>
          <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
            {staleApplicationRisk || "No stale risk reported."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
