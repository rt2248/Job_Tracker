import { JOB_TYPE_META } from "../../constants/jobType";

const BADGE_CLASSES = {
    cyan: "bg-cyan/10 text-cyan border border-cyan/30",
    indigo: "bg-indigo/10 text-indigo border border-indigo/30",
    violet: "bg-violet/10 text-violet border border-violet/30",
    amber: "bg-amber/10 text-amber border border-amber/30",
};

function JobTypeBadge({ jobType }) {
    const meta = JOB_TYPE_META[jobType] || { label: jobType, color: "cyan" };
    const classes = BADGE_CLASSES[meta.color];

    return (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium font-mono shrink-0 ${classes}`}>
            {meta.label}
        </span>
    );
}

export default JobTypeBadge;