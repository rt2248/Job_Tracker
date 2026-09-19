const pool = require("../configs/db");
const dummyListings = require("./data/listingsSeedData");

async function upsertTag(client, tagCache, rawName) {
    const name = rawName.trim().toLowerCase();

    if (tagCache.has(name)) {
        return tagCache.get(name);
    }

    const insertResult = await client.query(
        `INSERT INTO tags (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING id`,
        [name]
    );

    let tagId;
    if (insertResult.rows.length > 0) {
        tagId = insertResult.rows[0].id;
    } else {
        const existing = await client.query(`SELECT id FROM tags WHERE name = $1`, [name]);
        tagId = existing.rows[0].id;
    }

    tagCache.set(name, tagId);
    return tagId;
}

async function seedListings() {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        await client.query(
            "TRUNCATE TABLE listing_tags, tags, job_listings RESTART IDENTITY CASCADE"
        );
        console.log("Cleared existing listings, tags, and listing_tags.");

        console.log(`Seeding ${dummyListings.length} listings...`);
        const tagCache = new Map();

        for (const listing of dummyListings) {
            const insertResult = await client.query(
                `INSERT INTO job_listings (title, company, location, job_type, work_mode, experience_level, compensation_min, compensation_max, compensation_period, posted_date, description, requirements, link)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
         RETURNING id`,
                [
                    listing.title, listing.company, listing.location,
                    listing.jobType, listing.workMode, listing.experienceLevel,
                    listing.compensationMin, listing.compensationMax, listing.compensationPeriod,
                    listing.postedDate, listing.description, listing.requirements, listing.link,
                ]
            );

            const listingId = insertResult.rows[0].id;

            for (const rawTag of listing.tags) {
                const tagId = await upsertTag(client, tagCache, rawTag);
                await client.query(
                    `INSERT INTO listing_tags (listing_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                    [listingId, tagId]
                );
            }
        }

        await client.query("COMMIT");
        console.log("Seeding complete!");
    } catch (err) {
        await client.query("ROLLBACK");
        console.error("Seeding failed, rolled back:", err);
    } finally {
        client.release();
        await pool.end();
    }
}

seedListings();