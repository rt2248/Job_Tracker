import { STATUS_META } from "../../constants/jobStatus";
import Badge from "../shared/Badge";

const STATUS_VARIANT_MAP = {
    saved: "wishlist",
    applied: "applied",
    oa: "amber",
    interview: "interview",
    offer: "offer",
    accepted: "emerald",
    rejected: "rejected",
    muted: "default",
};


function StatusBadge({ status }) {
    const meta = STATUS_META[status] || { label: status, color: "muted" };
    const variant = STATUS_VARIANT_MAP[status] || STATUS_VARIANT_MAP[meta.color] || "default";

    return (
        <Badge variant={variant} size="sm" dot>
            {meta.label}
        </Badge>
    );
}

export default StatusBadge;