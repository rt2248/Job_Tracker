const STATUS_STYLES = {
    applied: { label: "Applied", classes: "bg-muted/10 text-muted-light border border-muted/30" },
    oa: { label: "Online Assessment", classes: "bg-amber/10 text-amber border border-amber/30" },
    interview: { label: "Interview", classes: "bg-violet/10 text-violet border border-violet/30" },
    offer: { label: "Offer", classes: "bg-cyan/10 text-cyan border border-cyan/30" },
    accepted: { label: "Accepted", classes: "bg-green/10 text-green border border-green/30" },
    rejected: { label: "Rejected", classes: "bg-red/10 text-red border border-red/30" },
};

function StatusBadge({ status }) {
    const style = STATUS_STYLES[status] || { label: status, classes: "bg-muted/10 text-muted-light border border-muted/30" };

    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium font-mono ${style.classes}`}>
            {style.label}
        </span>
    );
}

export default StatusBadge;