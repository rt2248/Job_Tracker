const pool = require("../../configs/db");

const getListings = async (filters) => {
    const {
        search, type, workMode, experienceLevel, location,
        salaryMin, salaryMax, postedWithin, tags,
    } = filters;

    const conditions = [];
    const values = [];
    let paramIndex = 1;

    if (search) {
        conditions.push(`(jl.title ILIKE $${paramIndex} OR jl.company ILIKE $${paramIndex})`);
        values.push(`%${search}%`);
        paramIndex++;
    }

    if (type) {
        conditions.push(`jl.job_type = $${paramIndex}`);
        values.push(type);
        paramIndex++;
    }

    if (workMode) {
        conditions.push(`jl.work_mode = $${paramIndex}`);
        values.push(workMode);
        paramIndex++;
    }

    if (experienceLevel) {
        conditions.push(`jl.experience_level = $${paramIndex}`);
        values.push(experienceLevel);
        paramIndex++;
    }

    if (location) {
        conditions.push(`jl.location = $${paramIndex}`);
        values.push(location);
        paramIndex++;
    }

    if (salaryMin) {
        conditions.push(`jl.compensation_max >= $${paramIndex}`);
        values.push(salaryMin);
        paramIndex++;
    }

    if (salaryMax) {
        conditions.push(`jl.compensation_min <= $${paramIndex}`);
        values.push(salaryMax);
        paramIndex++;
    }

    if (postedWithin) {
        const intervalMap = { day: "1 day", week: "7 days", month: "30 days" };
        const interval = intervalMap[postedWithin];
        if (interval) {
            conditions.push(`jl.posted_date >= NOW() - INTERVAL '${interval}'`);
        }
    }

    if (tags && tags.length > 0) {
        conditions.push(`jl.id IN (
            SELECT lt2.listing_id FROM listing_tags lt2
            JOIN tags t2 ON t2.id = lt2.tag_id
            WHERE t2.name = ANY($${paramIndex})
        )`);
        values.push(tags.map((t) => t.toLowerCase()));
        paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const query = `
        SELECT
            jl.id, jl.title, jl.company, jl.location, jl.job_type, jl.work_mode, jl.experience_level,
            jl.compensation_min, jl.compensation_max, jl.compensation_period, jl.compensation_currency,
            jl.posted_date, jl.description, jl.requirements, jl.link, jl.created_at,
            COALESCE(ARRAY_AGG(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL), '{}') AS tags
        FROM job_listings jl
        LEFT JOIN listing_tags lt ON lt.listing_id = jl.id
        LEFT JOIN tags t ON t.id = lt.tag_id
        ${whereClause}
        GROUP BY jl.id
        ORDER BY jl.posted_date DESC`;
    const result = await pool.query(query, values);
    return result.rows;
};

const getDistinctLocations = async () => {
    const result = await pool.query(
        "SELECT DISTINCT location FROM job_listings ORDER BY location ASC"
    );
    return result.rows.map((row) => row.location);
};

const getDistinctTags = async () => {
    const result = await pool.query("SELECT DISTINCT name FROM tags ORDER BY name ASC");
    return result.rows.map((row) => row.name);
};

module.exports = { getListings, getDistinctLocations, getDistinctTags };