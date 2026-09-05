export function formatCompensation(job) {
    const { compensationMin, compensationMax, compensationPeriod, compensationCurrency } = job;

    if (!compensationMin && !compensationMax) return null;

    const min = Number(compensationMin);
    const max = Number(compensationMax);

    const symbol = compensationCurrency === "INR" ? "₹" : `${compensationCurrency} `;
    const periodLabel = compensationPeriod === "monthly" ? "/mo" : "/yr";

    const formatAmount = (amount) => {
        if (amount >= 100000) {
            const lakhs = amount / 100000;
            return `${Number.isInteger(lakhs) ? lakhs : lakhs.toFixed(1)}L`;
        }
        if (amount >= 1000) {
            const thousands = amount / 1000;
            return `${Number.isInteger(thousands) ? thousands : thousands.toFixed(1)}K`;
        }
        return amount;
    };

    if (compensationMin && compensationMax) {
        return `${symbol}${formatAmount(min)} - ${symbol}${formatAmount(max)} ${periodLabel}`;
    }

    const single = min || max;
    return `${symbol}${formatAmount(single)} ${periodLabel}`;
}