import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../shared/Button";
import { cn } from "../../utils/cn";
import { formatDate } from "../../utils/formatDate";

/**
 * NextBestActionCard - Primary tactical attention card with crisp focal elevation.
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

  const actionData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Stale applications requiring follow-up (> 14 days inactive)
    const staleApps = staleAlerts?.applications || [];
    if (staleApps.length > 0) {
      const topStale = staleApps[0];
      const matchedJob = jobsList.find((j) => String(j.id) === String(topStale.id));
      const days = Math.round(topStale.daysInactive || 14);

      return {
        priority: "urgent",
        badge: "FOLLOW-UP RADAR",
        accentText: "text-amber",
        accentDot: "bg-amber",
        accentRail: "border-l-[3px] border-l-amber",
        title: `Follow up with ${topStale.company}`,
        subtitle: `${topStale.role} · ${days} days without status movement`,
        description: `This application has been resting in the "${topStale.status?.toUpperCase()}" stage for ${days} days. Sending a polite, professional check-in note to the recruiter or hiring manager keeps your candidacy top-of-mind.`,
        actionLabel: "Review Application",
        jobTarget: matchedJob || { id: topStale.id, company: topStale.company, role: topStale.role, status: topStale.status },
        extraCount: staleApps.length > 1 ? staleApps.length - 1 : 0,
        extraLabel: `+${staleApps.length - 1} more stale application${staleApps.length > 2 ? "s" : ""}`,
      };
    }

    // 2. Upcoming Deadlines
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
        accentText: isToday ? "text-red" : "text-cyan",
        accentDot: isToday ? "bg-red" : "bg-cyan",
        accentRail: isToday ? "border-l-[3px] border-l-red" : "border-l-[3px] border-l-cyan",
        title: `Submit application for ${nearest.company}`,
        subtitle: `${nearest.role} · ${timePhrase}`,
        description: `The deadline for ${nearest.role} at ${nearest.company} is approaching. Review your resume tailoring, complete any required screening prompts, and submit before the portal closes.`,
        actionLabel: "Complete Application",
        jobTarget: nearest,
        extraCount: upcomingDeadlines.length > 1 ? upcomingDeadlines.length - 1 : 0,
        extraLabel: `+${upcomingDeadlines.length - 1} more impending deadline${upcomingDeadlines.length > 2 ? "s" : ""}`,
      };
    }

    // 3. Active Interview or Assessment Stages
    const activeInterviews = jobsList.filter((j) => ["interview", "oa"].includes(j.status));
    if (activeInterviews.length > 0) {
      const activeJob = activeInterviews[0];
      const stageName = activeJob.status === "interview" ? "Interview" : "Online Assessment";

      return {
        priority: "interview",
        badge: `${stageName.toUpperCase()} IN PROGRESS`,
        accentText: "text-cyan",
        accentDot: "bg-cyan",
        accentRail: "border-l-[3px] border-l-cyan",
        title: `Prepare for ${activeJob.company} ${stageName}`,
        subtitle: `${activeJob.role} · Active Evaluation Stage`,
        description: `You have an active ${stageName.toLowerCase()} with ${activeJob.company}. Review the company's tech stack, rehearse your key system-design stories, and update your interview notes.`,
        actionLabel: "View Stage Notes",
        jobTarget: activeJob,
        extraCount: activeInterviews.length > 1 ? activeInterviews.length - 1 : 0,
        extraLabel: `+${activeInterviews.length - 1} other active evaluation${activeInterviews.length > 2 ? "s" : ""}`,
      };
    }

    // 4. Rule-based recommendation
    if (ruleBasedInsights.length > 0) {
      const topRule = ruleBasedInsights[0];
      return {
        priority: "insight",
        badge: "STRATEGIC RECOMMENDATION",
        accentText: "text-cyan",
        accentDot: "bg-cyan",
        accentRail: "border-l-[3px] border-l-cyan",
        title: topRule.title,
        subtitle: "Evolexa Pipeline Intelligence",
        description: topRule.message,
        actionLabel: "Explore Opportunities",
        navigateTarget: "/jobsearch",
        jobTarget: null,
      };
    }

    // 5. Empty State
    if (jobsList.length === 0) {
      return {
        priority: "empty",
        badge: "GET STARTED",
        accentText: "text-cyan",
        accentDot: "bg-cyan",
        accentRail: "border-l-[3px] border-l-cyan",
        title: "Build your career pipeline",
        subtitle: "Zero applications currently tracked",
        description: "Add job opportunities directly from Job Search or record your submissions to track deadlines, interview stages, and response velocity.",
        actionLabel: "Browse Jobs",
        navigateTarget: "/jobsearch",
        jobTarget: null,
      };
    }

    // 6. Healthy Default
    return {
      priority: "healthy",
      badge: "PIPELINE HEALTHY",
      accentText: "text-emerald-600 dark:text-emerald-400",
      accentDot: "bg-emerald-500",
      accentRail: "border-l-[3px] border-l-emerald-500",
      title: "Pipeline is healthy & up-to-date",
      subtitle: `${jobsList.length} total opportunities actively organized`,
      description: "No stale applications or impending deadlines detected. Consider sourcing new high-match opportunities or networking to keep your career pipeline flowing.",
      actionLabel: "Search High-Fit Roles",
      navigateTarget: "/jobsearch",
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
      <div className={cn("p-6 rounded-xl dashboard-panel-focal animate-pulse", className)}>
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
        "px-5 py-6 sm:px-6 sm:py-7 rounded-xl dashboard-panel-focal flex flex-col justify-between transition-all",
        actionData.accentRail,
        className
      )}
    >
      <div>
        {/* Status Indicator & Context Row */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2">
            <span className={cn("w-2 h-2 rounded-full shrink-0", actionData.accentDot)} aria-hidden="true" />
            <span className={cn("text-[13px] font-mono font-bold tracking-wider uppercase", actionData.accentText)}>
              {actionData.badge}
            </span>
            <span className="text-muted/60 hidden sm:inline">·</span>
            <span className="text-[13px] font-sans text-muted font-medium hidden sm:inline">
              Recommended Next Action
            </span>
          </div>

          {actionData.extraCount > 0 && (
            <span className="text-[13px] font-mono font-medium text-muted">
              {actionData.extraLabel}
            </span>
          )}
        </div>

        {/* Title & Subtitle */}
        <h3
          id="next-best-action-title"
          className="font-display text-xl sm:text-2xl font-bold text-ink tracking-tight"
        >
          {actionData.title}
        </h3>
        <p className="text-[15px] font-sans font-medium text-cyan mt-1.5">
          {actionData.subtitle}
        </p>

        {/* Action Context Narrative */}
        <p className="text-sm sm:text-[15px] text-muted font-sans leading-relaxed mt-3.5 max-w-2xl">
          {actionData.description}
        </p>
      </div>

      {/* Footer CTA Row */}
      <div className="mt-6 pt-5 border-t border-border-subtle flex flex-wrap items-center justify-between gap-3">
        <Button
          type="button"
          variant="primary"
          onClick={handleActionClick}
          className="text-sm px-4 py-2 font-semibold"
        >
          <span>{actionData.actionLabel}</span>
          <svg viewBox="0 0 16 16" className="w-3.5 h-3.5 ml-1.5" fill="none" stroke="currentColor" aria-hidden="true">
            <path d="M6 3.5 L10.5 8 L6 12.5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Button>

        <button
          type="button"
          onClick={() => navigate("/applications")}
          className="text-sm font-sans font-semibold text-muted hover:text-ink transition-colors cursor-pointer"
        >
          View all applications →
        </button>
      </div>
    </div>
  );
}
