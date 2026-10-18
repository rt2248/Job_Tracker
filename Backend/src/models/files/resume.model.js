const pool = require("../../configs/db");

const getResumeByUserId = async (userId) => {
    const result = await pool.query(
        `SELECT id, user_id, original_filename, storage_filename, file_size, mime_type, created_at, updated_at
         FROM user_resumes
         WHERE user_id = $1`,
        [userId]
    );
    return result.rows[0] || null;
};

const upsertResume = async ({ userId, originalFilename, storageFilename, fileSize, mimeType = "application/pdf" }) => {
    const result = await pool.query(
        `INSERT INTO user_resumes (user_id, original_filename, storage_filename, file_size, mime_type, updated_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
         ON CONFLICT (user_id)
         DO UPDATE SET
             original_filename = EXCLUDED.original_filename,
             storage_filename = EXCLUDED.storage_filename,
             file_size = EXCLUDED.file_size,
             mime_type = EXCLUDED.mime_type,
             updated_at = CURRENT_TIMESTAMP
         RETURNING id, user_id, original_filename, storage_filename, file_size, mime_type, created_at, updated_at`,
        [userId, originalFilename, storageFilename, fileSize, mimeType]
    );
    return result.rows[0];
};

const deleteResumeByUserId = async (userId) => {
    const result = await pool.query(
        `DELETE FROM user_resumes
         WHERE user_id = $1
         RETURNING id, user_id, original_filename, storage_filename`,
        [userId]
    );
    return result.rows[0] || null;
};

module.exports = {
    getResumeByUserId,
    upsertResume,
    deleteResumeByUserId,
};
