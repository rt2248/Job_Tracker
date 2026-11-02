const pool = require("../../configs/db");
const {
    parseAndClassifyListing,
    computeMatchFit,
} = require("../../utils/skillMatcher");

const STAGE_LABELS = {
    saved: "Saved",
    applied: "Applied",
    oa: "Online Assessment",
    interview: "Interview",
    offer: "Offer",
    accepted: "Accepted",
    rejected: "Rejected",
};

const ACTIVE_STATUSES = ["saved", "applied", "oa", "interview", "offer"];
const CLOSED_STATUSES = ["accepted", "rejected"];

/**
 * Retrieves consolidated KPI metrics, stale applications, submission velocity,
 * and rule-based insights for an authenticated user.
 *
 * @param {string} userId
 * @param {{ range?: '30d'|'90d'|'all', staleDays?: number }} options
 * @returns {Promise<Object>}
 */
const getInsightsSummary = async (userId, { range = "30d", staleDays = 14 } = {}) => {
    const validRange = ["30d", "90d", "all"].includes(range) ? range : "30d";
    const thresholdDays = Number.isInteger(staleDays) && staleDays >= 1 && staleDays <= 90 ? staleDays : 14;

    // 1. High-level metric counts (Scoped to authenticated user)
    const metricsRes = await pool.query(
        `SELECT
            COUNT(*)::int AS total_tracked,
            COUNT(*) FILTER (WHERE status != 'saved')::int AS total_submitted,
            COUNT(*) FILTER (WHERE status IN ('applied', 'oa', 'interview'))::int AS active_in_pipeline,
            COUNT(*) FILTER (WHERE status = 'interview')::int AS interviews_in_progress,
            COUNT(*) FILTER (WHERE status = 'offer')::int AS pending_offers,
            COUNT(*) FILTER (WHERE status IN ('offer', 'accepted'))::int AS cumulative_offers,
            COUNT(*) FILTER (WHERE status = 'rejected')::int AS cumulative_rejections,
            COUNT(*) FILTER (WHERE status = 'saved')::int AS saved_count
         FROM jobs
         WHERE user_id = $1`,
        [userId]
    );

    const m = metricsRes.rows[0] || {};
    const trackedOpportunities = Number(m.total_tracked) || 0;
    const submittedApplications = Number(m.total_submitted) || 0;
    const activeInPipeline = Number(m.active_in_pipeline) || 0;
    const interviewsInProgress = Number(m.interviews_in_progress) || 0;
    const pendingOffers = Number(m.pending_offers) || 0;
    const cumulativeOffers = Number(m.cumulative_offers) || 0;
    const cumulativeRejections = Number(m.cumulative_rejections) || 0;
    const savedCount = Number(m.saved_count) || 0;

    // 2. Exact elapsed-time stale applications detection using latest stage transition timestamp
    const staleRes = await pool.query(
        `SELECT 
            j.id,
            j.company,
            j.role,
            j.status,
            j.applied_date,
            j.updated_at,
            j.created_at,
            COALESCE(h.stage_entered_at, j.applied_date::timestamp with time zone, j.created_at) AS stage_entered_at,
            ROUND(EXTRACT(EPOCH FROM (NOW() - COALESCE(h.stage_entered_at, j.applied_date::timestamp with time zone, j.created_at))) / 86400, 1) AS days_inactive
         FROM jobs j
         LEFT JOIN LATERAL (
             SELECT MAX(changed_at) AS stage_entered_at
             FROM job_status_history
             WHERE job_id = j.id AND user_id = j.user_id AND to_status = j.status
         ) h ON true
         WHERE j.user_id = $1
           AND j.status IN ('applied', 'oa')
           AND (NOW() - COALESCE(h.stage_entered_at, j.applied_date::timestamp with time zone, j.created_at)) >= ($2 * INTERVAL '1 day')
         ORDER BY days_inactive DESC`,
        [userId, thresholdDays]
    );

    const staleApplications = staleRes.rows.map((row) => ({
        id: row.id,
        company: row.company,
        role: row.role,
        status: row.status,
        updatedAt: row.stage_entered_at ? new Date(row.stage_entered_at).toISOString() : (row.updated_at ? new Date(row.updated_at).toISOString() : null),
        stageEnteredAt: row.stage_entered_at ? new Date(row.stage_entered_at).toISOString() : null,
        daysInactive: parseFloat(row.days_inactive) || 0,
    }));

    // 3. Submissions over time (grouped by date)
    let rangeCondition = "";
    if (validRange === "30d") {
        rangeCondition = "AND COALESCE(applied_date, created_at::date) >= CURRENT_DATE - INTERVAL '30 days'";
    } else if (validRange === "90d") {
        rangeCondition = "AND COALESCE(applied_date, created_at::date) >= CURRENT_DATE - INTERVAL '90 days'";
    }

    const activityRes = await pool.query(
        `SELECT 
            TO_CHAR(COALESCE(applied_date, created_at::date), 'YYYY-MM-DD') AS submission_date,
            COUNT(*)::int AS count
         FROM jobs
         WHERE user_id = $1
           AND status != 'saved'
           ${rangeCondition}
         GROUP BY submission_date
         ORDER BY submission_date ASC`,
        [userId]
    );

    let totalSubmittedInPeriod = 0;
    const dailySeries = activityRes.rows.map((row) => {
        const count = Number(row.count) || 0;
        totalSubmittedInPeriod += count;
        return {
            date: row.submission_date,
            count,
        };
    });

    // 4. Rule-based recommendations derived from real user metrics
    const ruleBasedInsights = [];
    const staleCount = staleApplications.length;

    if (staleCount > 0) {
        ruleBasedInsights.push({
            id: "stale_applications_alert",
            type: "warning",
            title: `${staleCount} Stale Application${staleCount > 1 ? "s" : ""} Detected`,
            message: `You have ${staleCount} application${staleCount > 1 ? "s" : ""} in Applied or OA with no activity for over ${thresholdDays} days.`,
        });
    }

    if (interviewsInProgress > 0) {
        ruleBasedInsights.push({
            id: "active_interviews",
            type: "positive",
            title: "Active Interview Loop",
            message: `You currently have ${interviewsInProgress} interview${interviewsInProgress > 1 ? "s" : ""} in progress across your submitted applications.`,
        });
    }

    if (pendingOffers > 0) {
        ruleBasedInsights.push({
            id: "pending_offers",
            type: "positive",
            title: `${pendingOffers} Offer${pendingOffers > 1 ? "s" : ""} Received!`,
            message: `Congratulations! You have ${pendingOffers} offer${pendingOffers > 1 ? "s" : ""} awaiting your response.`,
        });
    }

    if (savedCount >= 5 && (submittedApplications === 0 || savedCount > submittedApplications * 1.5)) {
        ruleBasedInsights.push({
            id: "high_saved_ratio",
            type: "tip",
            title: "Convert Saved Opportunities",
            message: `You have ${savedCount} saved opportunities. Consider reviewing requirements and applying to maintain momentum.`,
        });
    }

    if (trackedOpportunities === 0) {
        ruleBasedInsights.push({
            id: "empty_tracker",
            type: "info",
            title: "Start Tracking Opportunities",
            message: "Add jobs from the Job Search board or your manual applications to unlock pipeline and skill analytics.",
        });
    }

    return {
        volumeMetrics: {
            trackedOpportunities,
            submittedApplications,
            cumulativeOffers,
            cumulativeRejections,
        },
        snapshotMetrics: {
            activeInPipeline,
            interviewsInProgress,
            pendingOffers,
        },
        staleAlerts: {
            thresholdDays,
            staleCount,
            applications: staleApplications,
            caveat: "Inactivity is measured from the most recent stage transition timestamp and indicates lack of stage movement, not verified employer response time.",
        },
        submissionActivity: {
            selectedRange: validRange,
            totalSubmittedInPeriod,
            dailySeries,
        },
        ruleBasedInsights,
    };
};

/**
 * Retrieves point-in-time pipeline snapshot segmented into Active Stages
 * and Closed Outcomes.
 *
 * @param {string} userId
 * @returns {Promise<Object>}
 */
const getPipelineSnapshot = async (userId) => {
    const res = await pool.query(
        `SELECT 
            status,
            COUNT(*)::int AS count
         FROM jobs
         WHERE user_id = $1
         GROUP BY status`,
        [userId]
    );

    const countsByStatus = {};
    for (const row of res.rows) {
        countsByStatus[row.status] = Number(row.count) || 0;
    }

    let totalActive = 0;
    const activeStages = ACTIVE_STATUSES.map((status) => {
        const count = countsByStatus[status] || 0;
        totalActive += count;
        return {
            status,
            label: STAGE_LABELS[status],
            count,
        };
    });

    let totalClosed = 0;
    const closedStages = CLOSED_STATUSES.map((status) => {
        const count = countsByStatus[status] || 0;
        totalClosed += count;
        return {
            status,
            label: STAGE_LABELS[status],
            count,
        };
    });

    const snapshotTotal = totalActive + totalClosed;

    // Calculate percentage shares of total tracked pipeline
    const formatStage = (stage) => ({
        ...stage,
        percentage: snapshotTotal > 0 ? Number(((stage.count / snapshotTotal) * 100).toFixed(1)) : 0.0,
    });

    return {
        snapshotTotal,
        activeSegment: {
            totalActive,
            stages: activeStages.map(formatStage),
        },
        closedSegment: {
            totalClosed,
            stages: closedStages.map(formatStage),
        },
        disclaimer: "This represents a point-in-time snapshot of current application stages, not a historical cohort conversion funnel.",
    };
};

/**
 * Retrieves skill-fit analysis for listing-linked applications against
 * the authenticated user's profile skills.
 *
 * Excludes manual jobs without structured listing data.
 *
 * @param {string} userId
 * @returns {Promise<Object>}
 */
const getSkillFitAnalytics = async (userId) => {
    // 1. Retrieve user's declared profile skills
    const profileRes = await pool.query(
        `SELECT COALESCE(skills, '[]'::jsonb) AS skills
         FROM user_profiles
         WHERE user_id = $1`,
        [userId]
    );

    let userDeclaredSkills = [];
    if (profileRes.rows.length > 0 && Array.isArray(profileRes.rows[0].skills)) {
        userDeclaredSkills = profileRes.rows[0].skills;
    }

    // 2. Query total vs. listing-linked jobs coverage
    const coverageRes = await pool.query(
        `SELECT
            COUNT(*)::int AS total_tracked,
            COUNT(*) FILTER (WHERE source_listing_id IS NOT NULL)::int AS listing_linked
         FROM jobs
         WHERE user_id = $1`,
        [userId]
    );

    const cov = coverageRes.rows[0] || {};
    const totalTrackedJobs = Number(cov.total_tracked) || 0;
    const listingLinkedJobs = Number(cov.listing_linked) || 0;
    const unlinkedJobs = Math.max(0, totalTrackedJobs - listingLinkedJobs);
    const coveragePercentage = totalTrackedJobs > 0
        ? Number(((listingLinkedJobs / totalTrackedJobs) * 100).toFixed(1))
        : 0.0;

    // 3. Query linked jobs with requirements and discrete tags
    const linkedJobsRes = await pool.query(
        `SELECT
            j.id AS job_id,
            j.company,
            j.role,
            j.status,
            jl.id AS listing_id,
            jl.requirements,
            COALESCE(ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL), '{}') AS tags
         FROM jobs j
         JOIN job_listings jl ON jl.id = j.source_listing_id
         LEFT JOIN listing_tags lt ON lt.listing_id = jl.id
         LEFT JOIN tags t ON t.id = lt.tag_id
         WHERE j.user_id = $1
         GROUP BY j.id, jl.id
         ORDER BY j.created_at DESC`,
        [userId]
    );

    const jobFitSummaries = linkedJobsRes.rows.map((row) => {
        const classification = parseAndClassifyListing(row.tags || [], row.requirements || []);
        const fit = computeMatchFit(userDeclaredSkills, classification.identifiableSkills);

        return {
            jobId: row.job_id,
            company: row.company,
            role: row.role,
            status: row.status,
            identifiableSkills: classification.identifiableSkills,
            matchedSkills: fit.matchedSkills,
            missingSkills: fit.missingSkills,
            matchPercentage: fit.matchPercentage,
            qualitativeRequirements: classification.qualitativeRequirements,
            unrecognizedTerms: classification.unrecognizedTechnicalTerms,
        };
    });

    return {
        userDeclaredSkills,
        coverage: {
            totalTrackedJobs,
            listingLinkedJobs,
            unlinkedJobs,
            coveragePercentage,
            note: "Only jobs linked to the Job Search board have structured skill requirements.",
        },
        jobFitSummaries,
        disclaimer: "Skill match is an automated estimate based on recognizable keywords in job listings and does not replace a full evaluation of candidate qualifications.",
    };
};

module.exports = {
    getInsightsSummary,
    getPipelineSnapshot,
    getSkillFitAnalytics,
    STAGE_LABELS,
    ACTIVE_STATUSES,
    CLOSED_STATUSES,
};
