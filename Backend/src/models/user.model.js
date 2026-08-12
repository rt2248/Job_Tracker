const pool = require("../configs/db");

const findUserbyEmail = async (email) => {
    const result = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    return result.rows[0];
};

const findUserbyUsername=async(userName)=>{
    const result = await pool.query("SELECT * FROM users WHERE user_name=$1",[userName]);
    return result.rows[0];
}

const createUser = async ({ firstName, middleName, lastName, email, userName, passwordHash }) => {
    const result = await pool.query(
        `INSERT INTO users (first_name, middle_name, last_name, email, user_name, password_hash) VALUES ($1,$2,$3,$4,$5,$6)
        RETURNING id, first_name, middle_name, last_name, email, user_name, created_at`,
        [firstName, middleName || null, lastName, email, userName, passwordHash]
    );
    return result.rows[0];
};

module.exports = { findUserbyEmail, findUserbyUsername ,createUser };