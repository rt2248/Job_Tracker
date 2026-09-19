import { useState } from "react";
import LocationCombobox from "./LocationCombobox";
import MoreFiltersPopover from "./MoreFiltersPopover";
import { JOB_TYPE_META } from "../../constants/jobType";
import { WORK_MODE_META } from "../../constants/workMode";

const LISTING_JOB_TYPES = ["internship", "fulltime", "parttime", "contract"];

function JobSearchFilterBar({ filters, updateFilter, clearFilters }) {
    const [isMoreFiltersOpen, setIsMoreFiltersOpen] = useState(false);

    return (
        <div className="flex flex-col gap-3 mb-6 shrink-0">
            <div className="flex flex-wrap items-center gap-3">
                <input
                    type="text"
                    value={filters.search}
                    onChange={(e) => updateFilter("search", e.target.value)}
                    placeholder="Search by title or company..."
                    className="flex-1 min-w-[200px] bg-surface border border-surface-2 rounded-lg px-3 py-2 text-sm text-ink placeholder:text-muted font-mono focus:outline-none focus:border-indigo/50"
                />

                <select
                    value={filters.type}
                    onChange={(e) => updateFilter("type", e.target.value)}
                    className="bg-surface border border-surface-2 rounded-lg px-3 py-2 text-sm text-ink font-mono focus:outline-none focus:border-indigo/50"
                >
                    <option value="">All Types</option>
                    {LISTING_JOB_TYPES.map((type) => (
                        <option key={type} value={type}>{JOB_TYPE_META[type].label}</option>
                    ))}
                </select>

                <LocationCombobox
                    value={filters.location}
                    onChange={(loc) => updateFilter("location", loc)}
                />

                <select
                    value={filters.workMode}
                    onChange={(e) => updateFilter("workMode", e.target.value)}
                    className="bg-surface border border-surface-2 rounded-lg px-3 py-2 text-sm text-ink font-mono focus:outline-none focus:border-indigo/50"
                >
                    <option value="">All Modes</option>
                    {Object.entries(WORK_MODE_META).map(([value, meta]) => (
                        <option key={value} value={value}>{meta.label}</option>
                    ))}
                </select>

                <div className="relative">
                    <button
                        onClick={() => setIsMoreFiltersOpen((prev) => !prev)}
                        className="bg-surface border border-surface-2 rounded-lg px-3 py-2 text-sm text-ink font-mono hover:border-indigo/50 hover:cursor-pointer"
                    >
                        More Filters
                    </button>
                    {isMoreFiltersOpen && (
                        <MoreFiltersPopover
                            filters={filters}
                            updateFilter={updateFilter}
                            onClose={() => setIsMoreFiltersOpen(false)}
                        />
                    )}
                </div>

                <button
                    onClick={clearFilters}
                    className="text-sm text-muted hover:text-ink font-mono hover:cursor-pointer"
                >
                    Clear
                </button>
            </div>
        </div>
    );
}

export default JobSearchFilterBar;