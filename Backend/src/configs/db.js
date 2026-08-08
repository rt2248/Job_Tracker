const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

pool.on("connect", () => {
    console.log("Connection Successful!");
});
pool.on("error", (err) => {
    console.log("Database Connection Error", err);
    process.exit(-1);
});
module.exports = pool;
