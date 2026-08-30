import { STATUS_META } from "../../constants/jobStatus";

const BADGE_CLASSES = {
    muted: "bg-muted/10 text-muted-light border border-muted/30",
    amber: "bg-amber/10 text-amber border border-amber/30",
    violet: "bg-violet/10 text-violet border border-violet/30",
    cyan: "bg-cyan/10 text-cyan border border-cyan/30",
    green: "bg-green/10 text-green border border-green/30",
    red: "bg-red/10 text-red border border-red/30",
};

function StatusBadge({ status }) {
    const meta = STATUS_META[status] || { label: status, color: "muted" };
    const classes = BADGE_CLASSES[meta.color];

    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium font-mono ${classes}`}>
            {meta.label}
        </span>
    );
}

export default StatusBadge;