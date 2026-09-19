import { EXPERIENCE_LEVEL_META } from "../../constants/experienceLevel";

function ExperienceLevelBadge({ experienceLevel }) {
    const meta = EXPERIENCE_LEVEL_META[experienceLevel] || { label: experienceLevel };

    return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium font-mono shrink-0 bg-surface-2 text-muted-light border border-surface-2">
            {meta.label}
        </span>
    );
}

export default ExperienceLevelBadge;