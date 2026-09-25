const { Pool } = require("pg");
require("dotenv").config();

const connectionString = process.env.DATABASE_URL;
const isProduction = process.env.NODE_ENV === "production" || (connectionString && (connectionString.includes("supabase.com") || connectionString.includes("supabase.co")));

const pool = new Pool({
    connectionString,
    ssl: isProduction ? { rejectUnauthorized: false } : false,
});

pool.on("connect", () => {
    console.log("Connection Successful!");
});

pool.on("error", (err) => {
    console.error("Database Connection Error", err);
});

module.exports = pool;
