const pool = require("../../configs/db");

const getJobsByUserId = async (userId) => {
    const result = await pool.query(
        "SELECT * FROM jobs WHERE user_id=$1 ORDER BY created_at DESC",
        [userId]
    );
    return result.rows;
};

module.exports = { getJobsByUserId };