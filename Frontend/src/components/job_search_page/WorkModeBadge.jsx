import React from "react";
import { WORK_MODE_META } from "../../constants/workMode";
import Badge from "../shared/Badge";

function WorkModeBadge({ workMode }) {
    const meta = WORK_MODE_META[workMode] || { label: workMode };

    return (
        <Badge variant="subtle" size="sm">
            {meta.label}
        </Badge>
    );
}

export default WorkModeBadge;