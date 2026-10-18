const pool = require("../../configs/db");

const getSettingsByUserId = async (userId) => {
    const result = await pool.query(
        "SELECT return_prompts_enabled FROM users WHERE id=$1",
        [userId]
    );
    return result.rows[0];
};

// Updates only the fields that were provided; returns the fresh settings row.
const updateSettingsByUserId = async (userId, { returnPromptsEnabled }) => {
    const result = await pool.query(
        `UPDATE users
         SET return_prompts_enabled = COALESCE($2, return_prompts_enabled)
         WHERE id=$1
         RETURNING return_prompts_enabled`,
        [userId, returnPromptsEnabled]
    );
    return result.rows[0];
};

module.exports = { getSettingsByUserId, updateSettingsByUserId };