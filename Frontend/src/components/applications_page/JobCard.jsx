import React from "react";
import StatusBadge from "./StatusBadge";
import JobTypeBadge from "../shared/JobTypeBadge";
import Card from "../shared/Card";
import { formatDate } from "../../utils/formatDate";
import { formatCompensation } from "../../utils/formatCompensation";

function JobCard({ job, onClick }) {
    const compensation = formatCompensation(job);

    return (
        <Card
            hoverable
            onClick={onClick}
            className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 cursor-pointer group bg-surface-secondary/80 hover:bg-surface-elevated border-border-primary hover:border-cyan/40"
        >
            <div className="min-w-0 w-full sm:w-auto">
                <h3 className="font-display text-ink font-semibold truncate text-base sm:text-lg group-hover:text-cyan transition-colors">
                    {job.role}
                </h3>
                <p className="text-muted text-xs sm:text-sm font-sans mt-1 flex items-center gap-2">
                    <span className="text-ink-secondary font-medium">{job.company}</span>
                    <span className="text-border-primary/80">·</span>
                    <JobTypeBadge jobType={job.jobType} />
                </p>
            </div>

            <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 shrink-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-border-subtle">
                <div className="text-xs font-sans text-left sm:text-right">
                    {compensation && (
                        <div className="text-cyan font-mono font-medium text-xs sm:text-sm">{compensation}</div>
                    )}
                    <div className="text-muted font-mono text-[11px] sm:text-xs mt-0.5">
                        {job.status === "saved" ? "Not applied yet" : `Applied: ${formatDate(job.appliedDate)}`}
                    </div>
                </div>
                <StatusBadge status={job.status} />
            </div>
        </Card>
    );
}

export default JobCard;