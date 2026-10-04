import React, { useState } from "react";
import { EXPERIENCE_LEVEL_META } from "../../constants/experienceLevel";
import { POSTED_WITHIN_OPTIONS } from "../../constants/postedWithin";
import { useJobTags } from "../../hooks/useJobTags";
import Popover from "../shared/Popover";
import Select from "../shared/Select";
import Input from "../shared/Input";
import Button from "../shared/Button";
import Badge from "../shared/Badge";

function MoreFiltersPopover({ filters, updateFilter, onClose }) {
    const { tags: allTags } = useJobTags();
    const [stagedSalaryMin, setStagedSalaryMin] = useState(filters.salaryMin || "");
    const [stagedSalaryMax, setStagedSalaryMax] = useState(filters.salaryMax || "");

    const handleApplySalary = () => {
        updateFilter("salaryMin", stagedSalaryMin);
        updateFilter("salaryMax", stagedSalaryMax);
    };

    const toggleTag = (tag) => {
        const current = filters.tags || [];
        const next = current.includes(tag)
            ? current.filter((t) => t !== tag)
            : [...current, tag];
        updateFilter("tags", next);
    };

    return (
        <Popover isOpen={true} onClose={onClose} align="right" className="w-72 sm:w-80 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                <span className="font-display font-semibold text-ink text-sm">Advanced Filters</span>
                <button
                    onClick={onClose}
                    className="text-muted hover:text-ink text-sm p-1 rounded-lg hover:bg-surface-overlay"
                >
                    ✕
                </button>
            </div>

            <Select
                label="Experience Level"
                value={filters.experienceLevel || ""}
                onChange={(e) => updateFilter("experienceLevel", e.target.value)}
                className="h-9 text-xs sm:text-sm bg-surface-secondary"
            >
                <option value="">Any Experience</option>
                {Object.entries(EXPERIENCE_LEVEL_META).map(([value, meta]) => (
                    <option key={value} value={value}>{meta.label}</option>
                ))}
            </Select>

            <div>
                <label className="text-xs font-medium text-ink-secondary block mb-1.5">Salary Range (₹)</label>
                <div className="flex items-center gap-2">
                    <Input
                        type="number"
                        value={stagedSalaryMin}
                        onChange={(e) => setStagedSalaryMin(e.target.value)}
                        placeholder="Min"
                        className="h-9 text-xs bg-surface-secondary"
                    />
                    <span className="text-muted font-sans">–</span>
                    <Input
                        type="number"
                        value={stagedSalaryMax}
                        onChange={(e) => setStagedSalaryMax(e.target.value)}
                        placeholder="Max"
                        className="h-9 text-xs bg-surface-secondary"
                    />
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleApplySalary}
                    className="mt-2 text-xs text-cyan hover:text-cyan p-0 h-auto font-medium"
                >
                    Apply salary range
                </Button>
            </div>

            <Select
                label="Date Posted"
                value={filters.postedWithin || ""}
                onChange={(e) => updateFilter("postedWithin", e.target.value)}
                className="h-9 text-xs sm:text-sm bg-surface-secondary"
            >
                {POSTED_WITHIN_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </Select>

            {allTags.length > 0 && (
                <div>
                    <label className="text-xs font-medium text-ink-secondary block mb-1.5">Filter by Tags</label>
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto custom-scrollbar p-1">
                        {allTags.map((tag) => {
                            const isSelected = (filters.tags || []).includes(tag);
                            return (
                                <button
                                    key={tag}
                                    type="button"
                                    onClick={() => toggleTag(tag)}
                                    className="hover:cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-indigo/40 rounded-full"
                                >
                                    <Badge
                                        variant={isSelected ? "indigo" : "subtle"}
                                        size="sm"
                                    >
                                        #{tag}
                                    </Badge>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </Popover>
    );
}

export default MoreFiltersPopover;