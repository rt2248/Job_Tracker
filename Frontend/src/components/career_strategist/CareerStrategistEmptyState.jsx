import React, { useState } from "react";
import Button from "../shared/Button";
import { cn } from "../../utils/cn";

/**
 * CareerStrategistEmptyState - Welcome screen allowing candidate to configure
 * optional assessment parameters or run an instant assessment using their existing profile.
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
        "rounded-2xl bg-surface border border-border-primary p-6 sm:p-10 text-center max-w-3xl mx-auto space-y-6 shadow-sm",
        className
      )}
    >
      {/* Icon / Emblem */}
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan/20 to-indigo/20 border border-cyan/40 text-cyan flex items-center justify-center mx-auto text-2xl shadow-inner">
        🧭
      </div>

      {/* Heading & Value Proposition */}
      <div className="space-y-2 max-w-xl mx-auto">
        <h2 className="font-display font-bold text-ink text-xl sm:text-2xl tracking-tight">
          AI Career Strategy & Pipeline Diagnostics
        </h2>
        <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
          Evolexa Career Strategist analyzes your active job search pipeline telemetry and
          cross-references verified profile competencies against target roles to deliver
          strictly grounded, prioritized strategic recommendations.
        </p>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2">
        <div className="p-3.5 rounded-xl bg-surface-secondary/70 border border-border-subtle">
          <div className="text-cyan text-base mb-1">📊</div>
          <h4 className="text-xs font-semibold text-ink mb-1">Pipeline Velocity</h4>
          <p className="text-[11px] text-muted leading-relaxed">
            Identifies application bottlenecks, conversion drop-offs, and stale submissions.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-surface-secondary/70 border border-border-subtle">
          <div className="text-indigo text-base mb-1">🎯</div>
          <h4 className="text-xs font-semibold text-ink mb-1">Skill Gap Analysis</h4>
          <p className="text-[11px] text-muted leading-relaxed">
            Audits declared skills against market demands for your target job categories.
          </p>
        </div>

        <div className="p-3.5 rounded-xl bg-surface-secondary/70 border border-border-subtle">
          <div className="text-green text-base mb-1">🛡️</div>
          <h4 className="text-xs font-semibold text-ink mb-1">Zero Hallucinations</h4>
          <p className="text-[11px] text-muted leading-relaxed">
            Every metric claim is strictly bounded by deterministic evidence validators.
          </p>
        </div>
      </div>

      {/* Optional Parameters Accordion */}
      <div className="pt-2 border-t border-border-subtle text-left">
        <button
          type="button"
          onClick={() => setShowOptions((prev) => !prev)}
          className="text-xs text-muted hover:text-ink font-medium flex items-center gap-1.5 mx-auto"
        >
          <span>{showOptions ? "Hide" : "Customize"} Assessment Parameters (Optional)</span>
          <span className="text-[10px]">{showOptions ? "▲" : "▼"}</span>
        </button>

        {showOptions && (
          <div className="mt-4 p-4 rounded-xl bg-surface-secondary/50 border border-border-subtle space-y-4 text-left">
            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Target Roles (comma-separated):
              </label>
              <input
                type="text"
                placeholder="e.g. Senior Backend Engineer, Full-Stack Lead"
                value={targetRolesInput}
                onChange={(e) => setTargetRolesInput(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg bg-surface border border-border-primary text-ink placeholder:text-muted focus:outline-none focus:border-cyan"
              />
              <span className="text-[11px] text-muted mt-0.5 block">
                Leave blank to automatically derive from your profile headline and bio.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Years of Professional Experience:
              </label>
              <input
                type="number"
                min="0"
                max="70"
                placeholder="e.g. 5"
                value={yearsOfExperienceInput}
                onChange={(e) => setYearsOfExperienceInput(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg bg-surface border border-border-primary text-ink placeholder:text-muted focus:outline-none focus:border-cyan max-w-[120px]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink mb-1">
                Specific Strategic Focus / Questions (Max 1,000 characters):
              </label>
              <textarea
                rows="3"
                maxLength={1000}
                placeholder="e.g. I am transitioning from monolithic architectures to cloud-native microservices; what should I prioritize?"
                value={userNotesInput}
                onChange={(e) => setUserNotesInput(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-lg bg-surface border border-border-primary text-ink placeholder:text-muted focus:outline-none focus:border-cyan resize-none"
              />
              <span className="text-[11px] text-muted mt-0.5 block text-right">
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
          className="w-full sm:w-auto px-8 font-semibold shadow-md"
        >
          {isLoading ? "Analyzing Profile & Pipeline..." : "Generate Career Assessment"}
        </Button>
        <p className="text-[11px] text-muted mt-2">
          Assessment takes ~3–6 seconds. Uses privacy-minimized telemetry only.
        </p>
      </div>
    </div>
  );
}
