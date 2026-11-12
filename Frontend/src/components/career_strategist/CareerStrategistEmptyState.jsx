import React, { useState } from "react";
import Button from "../shared/Button";
import { cn } from "../../utils/cn";

/**
 * CareerStrategistEmptyState - Entry view allowing candidate to configure
 * optional assessment parameters or run an assessment using their existing profile.
 *
 * @param {Object} props
 * @param {Function} props.onGenerate - Callback when candidate triggers generation
 * @param {boolean} props.isLoading - Whether request is in flight
 * @param {string} [props.className]
 */
export default function CareerStrategistEmptyState({
  onGenerate,
  isLoading,
  className,
}) {
  const [showOptions, setShowOptions] = useState(false);
  const [targetRolesInput, setTargetRolesInput] = useState("");
  const [yearsOfExperienceInput, setYearsOfExperienceInput] = useState("");
  const [userNotesInput, setUserNotesInput] = useState("");

  const handleGenerate = () => {
    const params = {};

    if (targetRolesInput.trim()) {
      params.targetRoles = targetRolesInput
        .split(",")
        .map((r) => r.trim())
        .filter(Boolean);
    }

    if (yearsOfExperienceInput !== "") {
      const parsedYears = Number(yearsOfExperienceInput);
      if (!Number.isNaN(parsedYears) && parsedYears >= 0 && parsedYears <= 70) {
        params.yearsOfExperience = parsedYears;
      }
    }

    if (userNotesInput.trim()) {
      params.userNotes = userNotesInput.trim().slice(0, 1000);
    }

    onGenerate(params);
  };

  return (
    <div
      className={cn(
        "rounded-xl bg-surface border border-border-primary p-6 sm:p-10 text-center max-w-3xl mx-auto space-y-6",
        className
      )}
    >
      {/* Compass Vector Emblem (Zero Emoji) */}
      <div className="w-12 h-12 rounded-lg bg-surface-secondary border border-border-subtle text-cyan flex items-center justify-center mx-auto">
        <svg
          className="w-6 h-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
      </div>

      {/* Direct Functional Heading */}
      <div className="space-y-2 max-w-xl mx-auto">
        <h2 className="font-display font-bold text-ink text-xl sm:text-2xl tracking-tight">
          Career Pipeline &amp; Skill Assessment
        </h2>
        <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
          Evaluates tracked application telemetry alongside declared profile skills and target roles to produce grounded, prioritized recommendations.
        </p>
      </div>

      {/* Clean Divided Feature Summary Row (No nested bordered sub-cards or emojis) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border-subtle text-left border-t border-border-subtle pt-5">
        <div className="pb-3 sm:pb-0 sm:pr-4 space-y-1">
          <h4 className="text-xs font-semibold text-cyan uppercase tracking-wider">
            Pipeline Velocity
          </h4>
          <p className="text-xs text-muted leading-relaxed">
            Reviews application bottlenecks, stage conversion, and stale submissions.
          </p>
        </div>

        <div className="py-3 sm:py-0 sm:px-4 space-y-1">
          <h4 className="text-xs font-semibold text-indigo uppercase tracking-wider">
            Skill Alignment
          </h4>
          <p className="text-xs text-muted leading-relaxed">
            Compares declared skills against requirements for your target job roles.
          </p>
        </div>

        <div className="pt-3 sm:pt-0 sm:pl-4 space-y-1">
          <h4 className="text-xs font-semibold text-green uppercase tracking-wider">
            Evidence Audit
          </h4>
          <p className="text-xs text-muted leading-relaxed">
            Checks cited metrics and skill claims against deterministic validators.
          </p>
        </div>
      </div>

      {/* Optional Parameters Accordion */}
      <div className="pt-4 border-t border-border-subtle text-left">
        <button
          type="button"
          onClick={() => setShowOptions((prev) => !prev)}
          className="text-xs text-muted hover:text-ink font-medium flex items-center gap-1.5 mx-auto"
          aria-expanded={showOptions}
        >
          <span>{showOptions ? "Hide" : "Customize"} Assessment Parameters (Optional)</span>
          <svg
            className={cn("w-3.5 h-3.5 transition-transform duration-200", showOptions && "rotate-180")}
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

        {showOptions && (
          <div className="mt-4 p-4 rounded-md bg-surface-secondary border border-border-subtle space-y-4 text-left">
            <div>
              <label htmlFor="cs-target-roles" className="block text-xs font-semibold text-ink mb-1.5">
                Target Roles (comma-separated)
              </label>
              <input
                id="cs-target-roles"
                type="text"
                placeholder="e.g. Senior Backend Engineer, Full-Stack Lead"
                value={targetRolesInput}
                onChange={(e) => setTargetRolesInput(e.target.value)}
                className="w-full text-xs sm:text-sm px-3 py-2 rounded-md bg-surface border border-border-primary text-ink placeholder:text-muted focus:outline-none focus:border-cyan"
              />
              <span className="text-xs text-muted mt-1 block">
                Leave blank to derive from your profile headline and bio.
              </span>
            </div>

            <div>
              <label htmlFor="cs-yoe" className="block text-xs font-semibold text-ink mb-1.5">
                Years of Professional Experience
              </label>
              <input
                id="cs-yoe"
                type="number"
                min="0"
                max="70"
                placeholder="e.g. 5"
                value={yearsOfExperienceInput}
                onChange={(e) => setYearsOfExperienceInput(e.target.value)}
                className="w-full text-xs sm:text-sm px-3 py-2 rounded-md bg-surface border border-border-primary text-ink placeholder:text-muted focus:outline-none focus:border-cyan max-w-[140px]"
              />
            </div>

            <div>
              <label htmlFor="cs-notes" className="block text-xs font-semibold text-ink mb-1.5">
                Strategic Focus / Notes (Max 1,000 characters)
              </label>
              <textarea
                id="cs-notes"
                rows="3"
                maxLength={1000}
                placeholder="e.g. Transitioning from monolithic backend services to cloud-native architecture; what should I prioritize?"
                value={userNotesInput}
                onChange={(e) => setUserNotesInput(e.target.value)}
                className="w-full text-xs sm:text-sm px-3 py-2 rounded-md bg-surface border border-border-primary text-ink placeholder:text-muted focus:outline-none focus:border-cyan resize-none"
              />
              <span className="text-xs font-mono text-muted mt-1 block text-right">
                {userNotesInput.length}/1000
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Action Trigger */}
      <div className="pt-2">
        <Button
          variant="primary"
          size="lg"
          onClick={handleGenerate}
          isLoading={isLoading}
          className="w-full sm:w-auto px-8 font-semibold"
        >
          {isLoading ? "Analyzing Profile & Pipeline..." : "Generate Career Assessment"}
        </Button>
        <p className="text-xs text-muted mt-2.5">
          Uses privacy-minimized profile attributes and pipeline telemetry only.
        </p>
      </div>
    </div>
  );
}
