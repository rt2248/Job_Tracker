import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../shared/Button";
import { cn } from "../../utils/cn";
import { formatDate } from "../../utils/formatDate";

/**
 * NextBestActionCard - High-visibility primary attention workspace card
 *
 * Dynamically computes the single most impactful next step derived from real
 * application records, stale alerts, upcoming deadlines, and interview stages.
 * Never fabricates synthetic deadlines or mock recommendations.
 *
 * @param {Object} props
 * @param {Array} props.jobsList - Full authenticated user application records
 * @param {Object} props.staleAlerts - Stale application detection data from summary
 * @param {Array} props.ruleBasedInsights - Rule-based strategic insights
 * @param {Function} props.onSelectJob - Opens JobDetailModal for a specific job
 * @param {boolean} props.isLoading - Loading state indicator
 * @param {string} [props.className]
 */
export default function NextBestActionCard({
  jobsList = [],
  staleAlerts = { staleCount: 0, applications: [] },
  ruleBasedInsights = [],
  onSelectJob,
  isLoading = false,
  className,
}) {
  const navigate = useNavigate();

  // Compute prioritized actionable event
  const actionData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Highest Priority: Stale applications requiring follow-up (> 14 days inactive)
    const staleApps = staleAlerts?.applications || [];
    if (staleApps.length > 0) {
      const topStale = staleApps[0];
      const matchedJob = jobsList.find((j) => String(j.id) === String(topStale.id));
      const days = Math.round(topStale.daysInactive || 14);

      return {
        priority: "urgent",
        badge: "FOLLOW-UP RADAR",
        badgeColor: "bg-amber/15 text-amber border-amber/40",
        glowColor: "border-l-4 border-l-amber",
        title: `Follow up with ${topStale.company}`,
        subtitle: `${topStale.role} • ${days} days without status movement`,
        description: `This application has been resting in the "${topStale.status?.toUpperCase()}" stage for ${days} days. Sending a polite, professional check-in note to the recruiter or hiring manager keeps your candidacy top-of-mind.`,
        actionLabel: "Review Application",
        jobTarget: matchedJob || { id: topStale.id, company: topStale.company, role: topStale.role, status: topStale.status },
        extraCount: staleApps.length > 1 ? staleApps.length - 1 : 0,
        extraLabel: `+${staleApps.length - 1} more stale application${staleApps.length > 2 ? "s" : ""}`,
      };
    }

    // 2. Second Priority: Upcoming Deadlines within the next 7 days
    const upcomingDeadlines = jobsList
      .filter((j) => {
        if (!j.deadline) return false;
        const d = new Date(j.deadline);
        d.setHours(0, 0, 0, 0);
        return d >= today;
      })
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));

    if (upcomingDeadlines.length > 0) {
      const nearest = upcomingDeadlines[0];
      const targetDate = new Date(nearest.deadline);
      targetDate.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));

      const isToday = diffDays === 0;
      const isTomorrow = diffDays === 1;
      const timePhrase = isToday
        ? "Due Today"
        : isTomorrow
        ? "Due Tomorrow"
        : `Due in ${diffDays} days (${formatDate(nearest.deadline)})`;

      return {
        priority: "deadline",
        badge: isToday ? "DUE TODAY" : "UPCOMING DEADLINE",
        badgeColor: isToday ? "bg-red/15 text-red border-red/40" : "bg-cyan/15 text-cyan border-cyan/40",
        glowColor: isToday ? "border-l-4 border-l-red" : "border-l-4 border-l-cyan",
        title: `Submit application for ${nearest.company}`,
        subtitle: `${nearest.role} • ${timePhrase}`,
        description: `The deadline for ${nearest.role} at ${nearest.company} is approaching. Review your resume tailoring, complete any required screening prompts, and submit before the portal closes.`,
        actionLabel: "Complete Application",
        jobTarget: nearest,
        extraCount: upcomingDeadlines.length > 1 ? upcomingDeadlines.length - 1 : 0,
        extraLabel: `+${upcomingDeadlines.length - 1} more impending deadline${upcomingDeadlines.length > 2 ? "s" : ""}`,
      };
    }

    // 3. Third Priority: Active Interview or Assessment Stages in flight
    const activeInterviews = jobsList.filter((j) => ["interview", "oa"].includes(j.status));
    if (activeInterviews.length > 0) {
      const activeJob = activeInterviews[0];
      const stageName = activeJob.status === "interview" ? "Interview" : "Online Assessment";

      return {
        priority: "interview",
        badge: `${stageName.toUpperCase()} IN PROGRESS`,
        badgeColor: "bg-cyan/15 text-cyan border-cyan/40",
        glowColor: "border-l-4 border-l-cyan",
        title: `Prepare for ${activeJob.company} ${stageName}`,
        subtitle: `${activeJob.role} • Active Evaluation Stage`,
        description: `You have an active ${stageName.toLowerCase()} with ${activeJob.company}. Review the company's tech stack, rehearse your key system-design stories, and update your interview notes.`,
        actionLabel: "View Stage Notes",
        jobTarget: activeJob,
        extraCount: activeInterviews.length > 1 ? activeInterviews.length - 1 : 0,
        extraLabel: `+${activeInterviews.length - 1} other active evaluation${activeInterviews.length > 2 ? "s" : ""}`,
      };
    }

    // 4. Fourth Priority: Rule-based recommendation from Insights
    if (ruleBasedInsights.length > 0) {
      const topRule = ruleBasedInsights[0];
      return {
        priority: "insight",
        badge: "STRATEGIC RECOMMENDATION",
        badgeColor: "bg-surface-secondary text-ink border-border-primary",
        glowColor: "border-l-4 border-l-cyan",
        title: topRule.title,
        subtitle: "Evolexa Pipeline Intelligence",
        description: topRule.message,
        actionLabel: "Explore Opportunities",
        navigateTarget: "/search-jobs",
        jobTarget: null,
      };
    }

    // 5. Default Healthy / Empty Pipeline State
    if (jobsList.length === 0) {
      return {
        priority: "empty",
        badge: "GET STARTED",
        badgeColor: "bg-cyan/15 text-cyan border-cyan/40",
        glowColor: "border-l-4 border-l-cyan",
        title: "Build your career pipeline",
        subtitle: "Zero applications currently tracked",
        description: "Add job opportunities directly from the Job Search board or manually record your submissions to track deadlines, interview stages, and response velocity.",
        actionLabel: "Browse Jobs",
        navigateTarget: "/search-jobs",
        jobTarget: null,
      };
    }

    return {
      priority: "healthy",
      badge: "PIPELINE HEALTHY",
      badgeColor: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/40",
      glowColor: "border-l-4 border-l-emerald-500",
      title: "Pipeline is healthy & up-to-date",
      subtitle: `${jobsList.length} total opportunities actively organized`,
      description: "No stale applications or impending deadlines detected. Consider sourcing new high-match opportunities or networking to keep your career pipeline flowing.",
      actionLabel: "Search High-Fit Roles",
      navigateTarget: "/search-jobs",
      jobTarget: null,
    };
  }, [jobsList, staleAlerts, ruleBasedInsights]);

  const handleActionClick = () => {
    if (actionData.jobTarget && onSelectJob) {
      onSelectJob(actionData.jobTarget);
    } else if (actionData.navigateTarget) {
      navigate(actionData.navigateTarget);
    }
  };

  if (isLoading) {
    return (
      <div className={cn("p-6 rounded-2xl bg-surface border border-border-primary animate-pulse", className)}>
        <div className="h-4 w-28 bg-surface-secondary rounded mb-3" />
        <div className="h-6 w-64 bg-surface-secondary rounded mb-2" />
        <div className="h-4 w-full bg-surface-secondary rounded mb-4" />
        <div className="h-9 w-36 bg-surface-secondary rounded" />
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-labelledby="next-best-action-title"
      className={cn(
        "relative p-5 sm:p-6 rounded-2xl bg-surface/90 border border-border-primary shadow-sm overflow-hidden flex flex-col justify-between transition-all card-3d",
        actionData.glowColor,
        className
      )}
    >
      {/* Background radial accent glow */}
      <div
        className="absolute -right-12 -top-12 w-48 h-48 rounded-full bg-cyan/5 blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      <div>
        {/* Top Header Badge & Meta Row */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 mb-3">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold tracking-wider uppercase border",
                actionData.badgeColor
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 animate-pulse" />
              {actionData.badge}
            </span>
            <span className="text-xs font-sans text-muted font-medium hidden sm:inline">
              Recommended Next Action
            </span>
          </div>

          {actionData.extraCount > 0 && (
            <span className="text-xs font-mono text-muted bg-surface-secondary px-2.5 py-0.5 rounded-md border border-border-subtle">
              {actionData.extraLabel}
            </span>
          )}
        </div>

        {/* Action Title & Subtitle */}
        <h2
          id="next-best-action-title"
          className="font-display text-lg sm:text-xl font-bold text-ink tracking-tight"
        >
          {actionData.title}
        </h2>
        <p className="text-xs sm:text-sm font-sans font-medium text-cyan mt-0.5">
          {actionData.subtitle}
        </p>

        {/* Action Narrative / Context */}
        <p className="text-xs sm:text-sm text-muted font-sans leading-relaxed mt-2.5">
          {actionData.description}
        </p>
      </div>

      {/* Action Footer Button & Secondary Links */}
      <div className="mt-5 pt-4 border-t border-border-subtle flex flex-wrap items-center justify-between gap-3">
        <Button
          type="button"
          variant="primary"
          onClick={handleActionClick}
          className="text-xs sm:text-sm px-4 py-2 font-semibold shadow-sm hover:shadow"
        >
          <span>{actionData.actionLabel}</span>
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 ml-1.5" fill="none" stroke="currentColor">
            <path d="M6 3.5 L10.5 8 L6 12.5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Button>

        <button
          type="button"
          onClick={() => navigate("/applications")}
          className="text-xs sm:text-sm font-sans font-medium text-muted hover:text-ink transition-colors cursor-pointer"
        >
          View all applications →
        </button>
      </div>
    </div>
  );
}
