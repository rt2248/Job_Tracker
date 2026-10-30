const pool = require("../../configs/db");

const findUserbyEmail = async (email) => {
    const result = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    return result.rows[0] || null;
};

const findUserbyUsername = async (userName) => {
    const result = await pool.query("SELECT * FROM users WHERE user_name=$1", [userName]);
    return result.rows[0] || null;
};

const createUser = async ({ firstName, middleName, lastName, email, userName, passwordHash }) => {
    const result = await pool.query(
        `INSERT INTO users (first_name, middle_name, last_name, email, user_name, password_hash) VALUES ($1,$2,$3,$4,$5,$6)
        RETURNING id, first_name, middle_name, last_name, email, user_name, created_at, token_version, password_changed_at`,
        [firstName, middleName || null, lastName, email, userName, passwordHash]
    );
    return result.rows[0] || null;
};

const findUserById = async (id) => {
    const result = await pool.query(
        "SELECT id, first_name, middle_name, last_name, email, user_name, created_at, password_changed_at FROM users WHERE id=$1",
        [id]
    );
    return result.rows[0] || null;
};

/**
 * Retrieves full user authentication state including hash and token version
 * Used strictly for password verification and session invalidation
 */
const getUserAuthDetailsById = async (id) => {
    const result = await pool.query(
        "SELECT id, email, user_name, password_hash, token_version, password_changed_at FROM users WHERE id=$1",
        [id]
    );
    return result.rows[0] || null;
};

/**
 * Atomically updates user password, increments token version to revoke other sessions,
 * and updates password_changed_at timestamp.
 * Uses optimistic concurrency check (expectedTokenVersion) to prevent race conditions.
 */
const updateUserPasswordAndInvalidateSessions = async (userId, newPasswordHash, expectedTokenVersion) => {
    const result = await pool.query(
        `UPDATE users
         SET password_hash = $1,
             token_version = token_version + 1,
             password_changed_at = CURRENT_TIMESTAMP
         WHERE id = $2 AND token_version = $3
         RETURNING id, email, user_name, token_version, password_changed_at`,
        [newPasswordHash, userId, expectedTokenVersion]
    );
    return result.rows[0] || null;
};

module.exports = {
    findUserbyEmail,
    findUserbyUsername,
    findUserById,
    getUserAuthDetailsById,
    createUser,
    updateUserPasswordAndInvalidateSessions,
};
