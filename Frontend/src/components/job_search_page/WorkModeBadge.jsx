import React from "react";
import { WORK_MODE_META } from "../../constants/workMode";
import { cn } from "../../utils/cn";

function WorkModeBadge({ workMode, className }) {
    const meta = WORK_MODE_META[workMode] || { label: workMode };

    return (
        <span className={cn("inline-flex items-center text-xs font-medium font-sans text-muted shrink-0", className)}>
            {meta.label}
        </span>
    );
}

export default WorkModeBadge;
