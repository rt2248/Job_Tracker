import { useState, useRef, useEffect } from "react";
import { EXPERIENCE_LEVEL_META } from "../../constants/experienceLevel";
import { POSTED_WITHIN_OPTIONS } from "../../constants/postedWithin";
import { useJobTags } from "../../hooks/useJobTags";

function MoreFiltersPopover({ filters, updateFilter, onClose }) {
    const { tags: allTags } = useJobTags();
    const [stagedSalaryMin, setStagedSalaryMin] = useState(filters.salaryMin);
    const [stagedSalaryMax, setStagedSalaryMax] = useState(filters.salaryMax);
    const popoverRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target)) {
                onClose();
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [onClose]);

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
        <div
            ref={popoverRef}
            className="absolute z-30 top-full mt-2 right-0 w-80 bg-surface border border-surface-2 rounded-xl p-4 shadow-xl flex flex-col gap-4"
        >
            <div>
                <label className="text-xs font-mono text-muted block mb-1">Experience Level</label>
                <select
                    value={filters.experienceLevel}
                    onChange={(e) => updateFilter("experienceLevel", e.target.value)}
                    className="w-full bg-canvas border border-surface-2 rounded-lg px-3 py-2 text-sm text-ink font-mono focus:outline-none focus:border-indigo/50"
                >
                    <option value="">Any</option>
                    {Object.entries(EXPERIENCE_LEVEL_META).map(([value, meta]) => (
                        <option key={value} value={value}>{meta.label}</option>
                    ))}
                </select>
            </div>

            <div>
                <label className="text-xs font-mono text-muted block mb-1">Salary Range (₹)</label>
                <div className="flex items-center gap-2">
                    <input
                        type="number"
                        value={stagedSalaryMin}
                        onChange={(e) => setStagedSalaryMin(e.target.value)}
                        placeholder="Min"
                        className="w-full bg-canvas border border-surface-2 rounded-lg px-3 py-2 text-sm text-ink font-mono focus:outline-none focus:border-indigo/50"
                    />
                    <span className="text-muted">–</span>
                    <input
                        type="number"
                        value={stagedSalaryMax}
                        onChange={(e) => setStagedSalaryMax(e.target.value)}
                        placeholder="Max"
                        className="w-full bg-canvas border border-surface-2 rounded-lg px-3 py-2 text-sm text-ink font-mono focus:outline-none focus:border-indigo/50"
                    />
                </div>
                <button
                    onClick={handleApplySalary}
                    className="mt-2 text-xs font-mono text-cyan hover:underline"
                >
                    Apply salary range
                </button>
            </div>

            <div>
                <label className="text-xs font-mono text-muted block mb-1">Date Posted</label>
                <select
                    value={filters.postedWithin}
                    onChange={(e) => updateFilter("postedWithin", e.target.value)}
                    className="w-full bg-canvas border border-surface-2 rounded-lg px-3 py-2 text-sm text-ink font-mono focus:outline-none focus:border-indigo/50"
                >
                    {POSTED_WITHIN_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                </select>
            </div>

            {allTags.length > 0 && (
                <div>
                    <label className="text-xs font-mono text-muted block mb-1">Tags</label>
                    <div className="flex flex-wrap gap-1.5">
                        {allTags.map((tag) => {
                            const isSelected = (filters.tags || []).includes(tag);
                            return (
                                <button
                                    key={tag}
                                    onClick={() => toggleTag(tag)}
                                    className={`px-2 py-0.5 rounded-full text-[11px] font-mono border transition-colors ${isSelected
                                            ? "bg-indigo/20 text-indigo border-indigo/50"
                                            : "bg-surface-2 text-muted-light border-surface-2 hover:border-indigo/30"
                                        }`}
                                >
                                    {tag}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

export default MoreFiltersPopover;