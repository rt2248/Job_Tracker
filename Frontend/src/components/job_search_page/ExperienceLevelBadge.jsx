import React from "react";
import { EXPERIENCE_LEVEL_META } from "../../constants/experienceLevel";
import Badge from "../shared/Badge";

function ExperienceLevelBadge({ experienceLevel }) {
    const meta = EXPERIENCE_LEVEL_META[experienceLevel] || { label: experienceLevel };

    return (
        <Badge variant="outline" size="sm">
            {meta.label}
        </Badge>
    );
}

export default ExperienceLevelBadge;