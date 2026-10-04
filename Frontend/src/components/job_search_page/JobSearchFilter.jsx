import React, { useState } from "react";
import LocationCombobox from "./LocationCombobox";
import MoreFiltersPopover from "./MoreFiltersPopover";
import Input from "../shared/Input";
import Select from "../shared/Select";
import Button from "../shared/Button";
import { JOB_TYPE_META } from "../../constants/jobType";
import { WORK_MODE_META } from "../../constants/workMode";

const LISTING_JOB_TYPES = ["internship", "fulltime", "parttime", "contract"];

function JobSearchFilterBar({ filters, updateFilter, clearFilters }) {
    const [isMoreFiltersOpen, setIsMoreFiltersOpen] = useState(false);

    return (
        <div className="flex flex-col gap-3 mb-6 shrink-0 bg-surface/60 p-2.5 sm:p-3 rounded-xl border border-border-primary">
            <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-stretch sm:items-center gap-3">
                <div className="flex-1 min-w-[200px] w-full">
                    <Input
                        type="text"
                        value={filters.search}
                        onChange={(e) => updateFilter("search", e.target.value)}
                        placeholder="Search jobs by title or company..."
                        className="h-9 text-xs sm:text-sm bg-surface-secondary/90"
                    />
                </div>

                <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-3 w-full sm:w-auto">
                    <div className="w-full sm:w-36">
                        <Select
                            value={filters.type}
                            onChange={(e) => updateFilter("type", e.target.value)}
                            placeholder="All Types"
                            className="h-9 text-xs sm:text-sm bg-surface-secondary/90"
                        >
                            <option value="">All Types</option>
                            {LISTING_JOB_TYPES.map((type) => (
                                <option key={type} value={type}>{JOB_TYPE_META[type].label}</option>
                            ))}
                        </Select>
                    </div>

                    <div className="w-full sm:w-36">
                        <Select
                            value={filters.workMode}
                            onChange={(e) => updateFilter("workMode", e.target.value)}
                            placeholder="All Modes"
                            className="h-9 text-xs sm:text-sm bg-surface-secondary/90"
                        >
                            <option value="">All Modes</option>
                            {Object.entries(WORK_MODE_META).map(([value, meta]) => (
                                <option key={value} value={value}>{meta.label}</option>
                            ))}
                        </Select>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <LocationCombobox
                        value={filters.location}
                        onChange={(loc) => updateFilter("location", loc)}
                    />

                    <div className="relative shrink-0">
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setIsMoreFiltersOpen((prev) => !prev)}
                            className="h-9 text-xs sm:text-sm"
                        >
                            More Filters
                        </Button>
                        {isMoreFiltersOpen && (
                            <MoreFiltersPopover
                                filters={filters}
                                updateFilter={updateFilter}
                                onClose={() => setIsMoreFiltersOpen(false)}
                            />
                        )}
                    </div>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="h-9 text-xs text-muted hover:text-ink shrink-0"
                    >
                        Clear
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default JobSearchFilterBar;