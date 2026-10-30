const pool = require("../../configs/db");

const DEFAULT_VISIBILITY = {
    email: false,
    resume: false,
    location: false, // Privacy-first default: hides physical location until user opts in
    headline: true,
    bio: true,
    avatar: true,
    portfolio: true,
    socialLinks: true,
    skills: true,
    experience: true,
};

/**
 * Format raw SQL joined row into clean profile response object
 */
const formatProfileRow = (row) => {
    if (!row) return null;

    const resume = row.resume_id
        ? {
            id: row.resume_id,
            filename: row.resume_filename,
            fileSize: row.resume_file_size,
            mimeType: row.resume_mime_type,
            uploadedAt: row.resume_created_at,
        }
        : null;

    return {
        id: row.id,
        firstName: row.first_name,
        middleName: row.middle_name,
        lastName: row.last_name,
        email: row.email,
        username: row.user_name,
        createdAt: row.account_created_at,
        headline: row.headline || "",
        bio: row.bio || "",
        location: row.location || "",
        avatarUrl: row.avatar_url || null,
        socialLinks: {
            portfolio: row.portfolio_url || "",
            github: row.github_url || "",
            linkedin: row.linkedin_url || "",
            twitter: row.twitter_url || "",
        },
        skills: Array.isArray(row.skills) ? row.skills : [],
        experience: Array.isArray(row.experience) ? row.experience : [],
        isPublicProfile: Boolean(row.is_public_profile),
        visibilitySettings: {
            ...DEFAULT_VISIBILITY,
            ...(row.visibility_settings && typeof row.visibility_settings === "object" ? row.visibility_settings : {}),
        },
        updatedAt: row.updated_at || row.account_created_at,
        passwordChangedAt: row.password_changed_at || null,
        resume,
    };
};

/**
 * Retrieve authenticated user profile by user ID
 */
const getProfileByUserId = async (userId) => {
    const query = `
        SELECT 
            u.id,
            u.first_name,
            u.middle_name,
            u.last_name,
            u.email,
            u.user_name,
            u.created_at AS account_created_at,
            u.password_changed_at,
            p.headline,
            p.bio,
            p.location,
            p.avatar_url,
            p.portfolio_url,
            p.github_url,
            p.linkedin_url,
            p.twitter_url,
            COALESCE(p.skills, '[]'::jsonb) AS skills,
            COALESCE(p.experience, '[]'::jsonb) AS experience,
            COALESCE(p.is_public_profile, false) AS is_public_profile,
            COALESCE(p.visibility_settings, $2::jsonb) AS visibility_settings,
            p.updated_at,
            r.id AS resume_id,
            r.original_filename AS resume_filename,
            r.file_size AS resume_file_size,
            r.mime_type AS resume_mime_type,
            r.created_at AS resume_created_at
        FROM users u
        LEFT JOIN user_profiles p ON p.user_id = u.id
        LEFT JOIN user_resumes r ON r.user_id = u.id
        WHERE u.id = $1
    `;

    const result = await pool.query(query, [userId, JSON.stringify(DEFAULT_VISIBILITY)]);
    return formatProfileRow(result.rows[0]);
};

/**
 * Retrieve raw profile row by username for public view
 */
const getProfileByUsername = async (username) => {
    const query = `
        SELECT 
            u.id,
            u.first_name,
            u.middle_name,
            u.last_name,
            u.email,
            u.user_name,
            u.created_at AS account_created_at,
            u.password_changed_at,
            p.headline,
            p.bio,
            p.location,
            p.avatar_url,
            p.portfolio_url,
            p.github_url,
            p.linkedin_url,
            p.twitter_url,
            COALESCE(p.skills, '[]'::jsonb) AS skills,
            COALESCE(p.experience, '[]'::jsonb) AS experience,
            COALESCE(p.is_public_profile, false) AS is_public_profile,
            COALESCE(p.visibility_settings, $2::jsonb) AS visibility_settings,
            p.updated_at,
            r.id AS resume_id,
            r.original_filename AS resume_filename,
            r.file_size AS resume_file_size,
            r.mime_type AS resume_mime_type,
            r.created_at AS resume_created_at
        FROM users u
        LEFT JOIN user_profiles p ON p.user_id = u.id
        LEFT JOIN user_resumes r ON r.user_id = u.id
        WHERE u.user_name = $1
    `;

    const result = await pool.query(query, [username, JSON.stringify(DEFAULT_VISIBILITY)]);
    return formatProfileRow(result.rows[0]);
};

/**
 * Upsert user profile data with transaction safety
 */
const updateProfileByUserId = async (userId, updatePayload) => {
    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        // 1. Check if user exists
        const userCheck = await client.query("SELECT id FROM users WHERE id = $1", [userId]);
        if (userCheck.rows.length === 0) {
            await client.query("ROLLBACK");
            return null;
        }

        // 2. Handle name updates on users table if provided
        const nameUpdates = [];
        const nameValues = [];
        let nameParamIdx = 1;

        if (updatePayload.firstName !== undefined) {
            nameUpdates.push(`first_name = $${nameParamIdx++}`);
            nameValues.push(updatePayload.firstName.trim());
        }
        if (updatePayload.middleName !== undefined) {
            nameUpdates.push(`middle_name = $${nameParamIdx++}`);
            nameValues.push(updatePayload.middleName ? updatePayload.middleName.trim() : null);
        }
        if (updatePayload.lastName !== undefined) {
            nameUpdates.push(`last_name = $${nameParamIdx++}`);
            nameValues.push(updatePayload.lastName.trim());
        }

        if (nameUpdates.length > 0) {
            nameValues.push(userId);
            const userUpdateQuery = `
                UPDATE users 
                SET ${nameUpdates.join(", ")} 
                WHERE id = $${nameParamIdx}
            `;
            await client.query(userUpdateQuery, nameValues);
        }

        // 3. Upsert user_profiles table
        // Fetch current profile to merge defaults
        const currentProfileRes = await client.query(
            "SELECT * FROM user_profiles WHERE user_id = $1",
            [userId]
        );
        const current = currentProfileRes.rows[0] || {};

        const headline = updatePayload.headline !== undefined ? updatePayload.headline : current.headline;
        const bio = updatePayload.bio !== undefined ? updatePayload.bio : current.bio;
        const location = updatePayload.location !== undefined ? updatePayload.location : current.location;
        const avatarUrl = updatePayload.avatarUrl !== undefined ? updatePayload.avatarUrl : current.avatar_url;

        // Social links extraction
        let portfolioUrl = current.portfolio_url;
        let githubUrl = current.github_url;
        let linkedinUrl = current.linkedin_url;
        let twitterUrl = current.twitter_url;

        if (updatePayload.socialLinks && typeof updatePayload.socialLinks === "object") {
            if (updatePayload.socialLinks.portfolio !== undefined) portfolioUrl = updatePayload.socialLinks.portfolio;
            if (updatePayload.socialLinks.github !== undefined) githubUrl = updatePayload.socialLinks.github;
            if (updatePayload.socialLinks.linkedin !== undefined) linkedinUrl = updatePayload.socialLinks.linkedin;
            if (updatePayload.socialLinks.twitter !== undefined) twitterUrl = updatePayload.socialLinks.twitter;
        }
        if (updatePayload.portfolioUrl !== undefined) portfolioUrl = updatePayload.portfolioUrl;
        if (updatePayload.githubUrl !== undefined) githubUrl = updatePayload.githubUrl;
        if (updatePayload.linkedinUrl !== undefined) linkedinUrl = updatePayload.linkedinUrl;
        if (updatePayload.twitterUrl !== undefined) twitterUrl = updatePayload.twitterUrl;

        // Clean & sanitize skills
        const skills = updatePayload.skills !== undefined
            ? JSON.stringify(updatePayload.skills.map((s) => (typeof s === "string" ? s.trim() : s)))
            : JSON.stringify(current.skills || []);

        // Clean & sanitize experience
        const experience = updatePayload.experience !== undefined
            ? JSON.stringify(updatePayload.experience.map((e) => ({
                company: (e.company || "").trim(),
                title: (e.title || "").trim(),
                location: e.location ? e.location.trim() : null,
                startDate: e.startDate ? String(e.startDate).trim() : null,
                endDate: e.endDate ? String(e.endDate).trim() : null,
                current: Boolean(e.current),
                description: e.description ? e.description.trim() : "",
            })))
            : JSON.stringify(current.experience || []);

        const isPublicProfile = updatePayload.isPublicProfile !== undefined
            ? Boolean(updatePayload.isPublicProfile)
            : Boolean(current.is_public_profile);

        let visibilitySettings = {
            ...DEFAULT_VISIBILITY,
            ...(current.visibility_settings || {}),
        };
        if (updatePayload.visibilitySettings && typeof updatePayload.visibilitySettings === "object") {
            visibilitySettings = {
                ...visibilitySettings,
                ...updatePayload.visibilitySettings,
            };
        }

        const upsertQuery = `
            INSERT INTO user_profiles (
                user_id,
                headline,
                bio,
                location,
                avatar_url,
                portfolio_url,
                github_url,
                linkedin_url,
                twitter_url,
                skills,
                experience,
                is_public_profile,
                visibility_settings,
                updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11::jsonb, $12, $13::jsonb, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id)
            DO UPDATE SET
                headline = EXCLUDED.headline,
                bio = EXCLUDED.bio,
                location = EXCLUDED.location,
                avatar_url = EXCLUDED.avatar_url,
                portfolio_url = EXCLUDED.portfolio_url,
                github_url = EXCLUDED.github_url,
                linkedin_url = EXCLUDED.linkedin_url,
                twitter_url = EXCLUDED.twitter_url,
                skills = EXCLUDED.skills,
                experience = EXCLUDED.experience,
                is_public_profile = EXCLUDED.is_public_profile,
                visibility_settings = EXCLUDED.visibility_settings,
                updated_at = CURRENT_TIMESTAMP
            RETURNING *
        `;

        await client.query(upsertQuery, [
            userId,
            headline || null,
            bio || null,
            location || null,
            avatarUrl || null,
            portfolioUrl || null,
            githubUrl || null,
            linkedinUrl || null,
            twitterUrl || null,
            skills,
            experience,
            isPublicProfile,
            JSON.stringify(visibilitySettings),
        ]);

        await client.query("COMMIT");
    } catch (err) {
        await client.query("ROLLBACK");
        throw err;
    } finally {
        client.release();
    }

    // Return the updated, formatted profile
    return getProfileByUserId(userId);
};

module.exports = {
    DEFAULT_VISIBILITY,
    formatProfileRow,
    getProfileByUserId,
    getProfileByUsername,
    updateProfileByUserId,
};
