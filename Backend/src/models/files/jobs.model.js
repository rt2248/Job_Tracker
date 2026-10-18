const pool = require("../../configs/db");

// Normalise text for comparison: lowercase, strip everything except a-z / 0-9.
const norm = (col) => `regexp_replace(lower(${col}), '[^a-z0-9]', '', 'g')`;

// Single source of truth for "this tracked job (j) is this listing (l)".
// Matches on explicit source listing ID or identical normalized company AND role/title.
// We avoid matching solely on external URL to prevent false duplicates across different
// roles sharing the same company career portal URL.
const MATCH_CONDITION = `(
    j.source_listing_id = l.id
    OR (
        ${norm("l.company")} <> '' AND ${norm("l.title")} <> ''
        AND ${norm("j.company")} = ${norm("l.company")}
        AND ${norm("j.role")} = ${norm("l.title")}
    )
)`;

// Prefer the job that came directly from this listing, then the newest.
const MATCH_PRIORITY = `COALESCE(j.source_listing_id = l.id, false) DESC, j.created_at DESC`;

const getJobsByUserId = async (userId) => {
    const result = await pool.query(
        "SELECT * FROM jobs WHERE user_id=$1 ORDER BY created_at DESC",
        [userId]
    );
    return result.rows;
};

// Map of listingId -> jobId for every listing the user already tracks.
const getTrackedListingMap = async (userId) => {
    const result = await pool.query(
        `SELECT DISTINCT ON (l.id) l.id AS listing_id, j.id AS job_id
         FROM job_listings l
         JOIN jobs j ON j.user_id = $1 AND ${MATCH_CONDITION}
         ORDER BY l.id, ${MATCH_PRIORITY}`,
        [userId]
    );
    return result.rows;
};

// Creates a 'saved' job from a listing unless one already matches.
const createJobFromListing = async (userId, listingId) => {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");

        // Serialise this user's creates so two simultaneous requests
        await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [userId]);

        const listingResult = await client.query(
            "SELECT * FROM job_listings WHERE id=$1",
            [listingId]
        );
        if (listingResult.rows.length === 0) {
            await client.query("ROLLBACK");
            return { notFound: true };
        }
        const listing = listingResult.rows[0];

        const existing = await client.query(
            `SELECT j.*
             FROM jobs j
             JOIN job_listings l ON l.id = $2
             WHERE j.user_id = $1 AND ${MATCH_CONDITION}
             ORDER BY ${MATCH_PRIORITY}
             LIMIT 1`,
            [userId, listingId]
        );
        if (existing.rows.length > 0) {
            await client.query("ROLLBACK");
            return { created: false, job: existing.rows[0] };
        }

        const inserted = await client.query(
            `INSERT INTO jobs (
                user_id, company, role, status, link,
                job_type, work_mode,
                compensation_min, compensation_max, compensation_period, compensation_currency,
                source_listing_id
            )
            VALUES ($1, $2, $3, 'saved', $4, $5, $6, $7, $8, $9, $10, $11)
            RETURNING *`,
            [
                userId, listing.company, listing.title, listing.link,
                listing.job_type, listing.work_mode,
                listing.compensation_min, listing.compensation_max,
                listing.compensation_period, listing.compensation_currency,
                listing.id,
            ]
        );

        await client.query("COMMIT");
        return { created: true, job: inserted.rows[0] };
    }
    catch (error) {
        await client.query("ROLLBACK").catch(() => { });
        if (error.code === "23505") {
            const existing = await pool.query(
                `SELECT * FROM jobs WHERE user_id = $1 AND source_listing_id = $2`,
                [userId, listingId]
            );
            if (existing.rows.length > 0) {
                return { created: false, job: existing.rows[0] };
            }
        }
        throw error;
    }
    finally {
        client.release();
    }
};

const updateJobStatus = async (userId, jobId, status) => {
    const result = await pool.query(
        `UPDATE jobs
         SET status = $1::job_status,
             applied_date = CASE
                 WHEN status = 'saved'::job_status AND $1::job_status = 'applied'::job_status AND applied_date IS NULL THEN CURRENT_DATE
                 ELSE applied_date
             END,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2 AND user_id = $3
         RETURNING *`,
        [status, jobId, userId]
    );
    return result.rows[0];
};

module.exports = { getJobsByUserId, getTrackedListingMap, createJobFromListing, updateJobStatus };