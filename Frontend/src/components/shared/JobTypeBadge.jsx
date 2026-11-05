import React from "react";
import { JOB_TYPE_META } from "../../constants/jobType";
import { cn } from "../../utils/cn";

const TEXT_COLORS = {
    cyan: "text-cyan",
    indigo: "text-cyan",
    violet: "text-red",
    amber: "text-amber",
    pink: "text-red",
};

function JobTypeBadge({ jobType, className }) {
    const meta = JOB_TYPE_META[jobType] || { label: jobType, color: "cyan" };
    const colorClass = TEXT_COLORS[meta.color] || "text-cyan";

    return (
        <span className={cn("text-xs sm:text-sm font-medium font-sans shrink-0", colorClass, className)}>
            {meta.label}
        </span>
    );
}

export default JobTypeBadge;
