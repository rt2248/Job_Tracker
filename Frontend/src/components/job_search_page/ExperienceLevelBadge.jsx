import React from "react";
import { EXPERIENCE_LEVEL_META } from "../../constants/experienceLevel";
import { cn } from "../../utils/cn";

function ExperienceLevelBadge({ experienceLevel, className }) {
    const meta = EXPERIENCE_LEVEL_META[experienceLevel] || { label: experienceLevel };

    return (
        <span className={cn("inline-flex items-center text-xs sm:text-sm font-medium font-sans text-ink-secondary shrink-0", className)}>
            {meta.label}
        </span>
    );
}

export default ExperienceLevelBadge;
