import React, { useMemo } from "react";
import { cn } from "../../utils/cn";

/**
 * PipelineConversionFunnel - Real-time stage conversion rate visualization
 *
 * Computes exact pass-through ratios across the 4 key pipeline funnel gates:
 * 1. Tracked (100% baseline)
 * 2. Applied / Submitted (% of Tracked)
 * 3. OA & Interview Evaluation (% of Applied)
 * 4. Offers & Accepted (% of Evaluation)
 *
 * Strictly derived from genuine application records. Never displays mock percentages.
 *
 * @param {Object} props
 * @param {Array} props.jobsList - Authenticated user application records
 * @param {string} [props.className]
 */
export default function PipelineConversionFunnel({ jobsList = [], embedded = false, className }) {
  const funnelData = useMemo(() => {
    const totalTracked = jobsList.length;

    // Submitted: Any application that passed beyond 'saved'
    const submitted = jobsList.filter((j) => j.status !== "saved").length;

    // Evaluation: Any application that reached OA, Interview, Offer, or Accepted
    const evaluation = jobsList.filter((j) =>
      ["oa", "interview", "offer", "accepted"].includes(j.status)
    ).length;

    // Offers: Any application that reached Offer or Accepted
    const offers = jobsList.filter((j) =>
      ["offer", "accepted"].includes(j.status)
    ).length;

    const rateSubmitted = totalTracked > 0 ? Math.round((submitted / totalTracked) * 100) : 0;
    const rateEvaluation = submitted > 0 ? Math.round((evaluation / submitted) * 100) : 0;
    const rateOffers = evaluation > 0 ? Math.round((offers / evaluation) * 100) : 0;

    return [
      {
        id: "tracked",
        label: "Tracked Opportunities",
        count: totalTracked,
        rate: 100,
        rateLabel: "100%",
        subtext: "Total pipeline volume",
        color: "bg-slate-500",
        barColor: "bg-slate-400",
      },
      {
        id: "submitted",
        label: "Applications Submitted",
        count: submitted,
        rate: rateSubmitted,
        rateLabel: totalTracked > 0 ? `${rateSubmitted}% of tracked` : "0%",
        subtext: "Saved opportunities converted to submissions",
        color: "bg-cyan",
        barColor: "bg-cyan",
      },
      {
        id: "evaluation",
        label: "Screening & Interviews",
        count: evaluation,
        rate: rateEvaluation,
        rateLabel: submitted > 0 ? `${rateEvaluation}% of applied` : "0%",
        subtext: "Applications advancing to OA or Interview",
        color: "bg-amber",
        barColor: "bg-amber",
      },
      {
        id: "offers",
        label: "Offers & Accepted",
        count: offers,
        rate: rateOffers,
        rateLabel: evaluation > 0 ? `${rateOffers}% of interviewed` : "0%",
        subtext: "Successful pipeline completions",
        color: "bg-emerald-500",
        barColor: "bg-emerald-500",
      },
    ];
  }, [jobsList]);

  return (
    <div
      role="region"
      aria-labelledby="conversion-funnel-heading"
      className={cn(
        embedded
          ? "flex flex-col"
          : "dashboard-panel rounded-xl p-4 sm:p-5 flex flex-col",
        className
      )}
    >
      {/* Header */}
      <div className="shrink-0 flex items-center justify-between gap-2 mb-4 pb-3.5 border-b border-border-subtle">
        <div className="flex items-center gap-2 min-w-0">
          <svg
            viewBox="0 0 20 20"
            className="w-4 h-4 text-cyan shrink-0"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <polygon points="2 3 18 3 12 11 12 17 8 15 8 11 2 3" />
          </svg>
          <h3
            id="conversion-funnel-heading"
            className="font-display text-sm sm:text-base font-bold text-ink tracking-tight"
          >
            Conversion Funnel
          </h3>
        </div>
        <span className="text-[13px] font-mono text-muted shrink-0 whitespace-nowrap">
          End-to-end yield
        </span>
      </div>

      {/* Funnel Steps */}
      <div className="flex flex-col space-y-5">
        {funnelData.map((step) => (
          <div key={step.id} className="space-y-2">
            <div className="flex items-center justify-between text-sm sm:text-[15px]">
              <span className="font-sans font-semibold text-ink flex items-center gap-1.5">
                <span className={cn("w-2 h-2 rounded-full shrink-0", step.color)} />
                {step.label}
              </span>
              <div className="flex items-center gap-2 font-mono">
                <span className="font-bold text-ink">{step.count}</span>
                <span className="text-muted text-xs sm:text-[13px]">
                  ({step.rateLabel})
                </span>
              </div>
            </div>

            {/* Progress track */}
            <div
              className="w-full h-2 rounded-full bg-surface-secondary overflow-hidden border border-border-subtle"
              role="progressbar"
              aria-valuenow={step.rate}
              aria-valuemin="0"
              aria-valuemax="100"
            >
              <div
                className={cn("h-full rounded-full transition-all duration-500", step.barColor)}
                style={{ width: `${Math.max(step.rate > 0 ? step.rate : 0, step.count > 0 ? 6 : 0)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="shrink-0 mt-5 pt-3.5 border-t border-border-subtle flex items-center justify-between gap-2 text-[13px] text-muted font-sans">
        <span>Derived from live application statuses</span>
        <span className="font-mono shrink-0">Real-time yields</span>
      </div>
    </div>
  );
}
