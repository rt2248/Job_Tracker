const pool = require("../configs/db");

const findUserbyEmail = async (email) => {
    const result = await pool.query("SELECT * FROM users WHERE email=$1", [email]);
    return result.rows[0];
};

const createUser=async({firstName, middleName, lastName, email, passwordHash})=>{
    const result = await pool.query(
        `INSERT INTO users (first_name, middle_name, last_name, email, password_hash) VALUES ($1,$2,$3,$4,$5)
        RETURNING id, first_name, middle_name, last_name, email, created_at`,
        [firstName, middleName||null, lastName,email, passwordHash]
    );
    return result.rows[0];
};

module.exports={findUserbyEmail, createUser};