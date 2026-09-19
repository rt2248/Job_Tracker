export function formatRelativeDate(dateString) {
    if (!dateString) return "—";

    const posted = new Date(dateString);
    const now = new Date();
    const diffMs = now.setHours(0, 0, 0, 0) - posted.setHours(0, 0, 0, 0);
    const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;

    const diffWeeks = Math.floor(diffDays / 7);
    if (diffWeeks < 5) return `${diffWeeks} week${diffWeeks > 1 ? "s" : ""} ago`;

    const diffMonths = Math.floor(diffDays / 30);
    return `${diffMonths} month${diffMonths > 1 ? "s" : ""} ago`;
}