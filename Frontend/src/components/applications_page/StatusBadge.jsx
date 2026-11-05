import React from "react";
import { STATUS_META } from "../../constants/jobStatus";
import { cn } from "../../utils/cn";

const STATUS_TEXT_COLORS = {
    saved: "text-muted",
    applied: "text-cyan",
    oa: "text-amber",
    interview: "text-red",
    offer: "text-yellow",
    accepted: "text-green",
    rejected: "text-red",
    muted: "text-muted",
};

const STATUS_DOT_COLORS = {
    saved: "bg-slate-400",
    applied: "bg-cyan",
    oa: "bg-amber",
    interview: "bg-red",
    offer: "bg-yellow",
    accepted: "bg-green",
    rejected: "bg-red",
    muted: "bg-slate-400",
};

function StatusBadge({ status, className }) {
    const meta = STATUS_META[status] || { label: status, color: "muted" };
    const textColor = STATUS_TEXT_COLORS[status] || STATUS_TEXT_COLORS[meta.color] || "text-muted";
    const dotColor = STATUS_DOT_COLORS[status] || STATUS_DOT_COLORS[meta.color] || "bg-current";

    return (
        <span className={cn("inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium font-sans shrink-0", textColor, className)}>
            <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColor)} aria-hidden="true" />
            {meta.label}
        </span>
    );
}

export default StatusBadge;
