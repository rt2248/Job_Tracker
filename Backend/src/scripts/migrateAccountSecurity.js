const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const pool = require("../configs/db");

const runMigration = async () => {
    const isRollback = process.argv.includes("--rollback");
    const sqlFile = isRollback ? "account_security_rollback.sql" : "account_security.sql";
    const sqlPath = path.join(__dirname, "../models/schema", sqlFile);

    // Safeguards for rollback
    if (isRollback) {
        if (process.env.NODE_ENV === "production" && !process.argv.includes("--confirm-production-destructive-rollback")) {
            console.error(
                "CRITICAL ERROR: Rollback aborted. Attempting to drop account security columns in PRODUCTION without '--confirm-production-destructive-rollback' flag."
            );
            process.exitCode = 1;
            return;
        }

        const dbUrl = process.env.DATABASE_URL || "";
        const isRemoteHost = !dbUrl.includes("localhost") && !dbUrl.includes("127.0.0.1");
        if (isRemoteHost && !process.argv.includes("--confirm-remote-rollback")) {
            console.error(
                "CRITICAL ERROR: Rollback aborted. Attempting to drop account security columns on remote host without '--confirm-remote-rollback' flag."
            );
            process.exitCode = 1;
            return;
        }

        console.warn(
            "WARNING: Executing rollback will drop 'token_version' and 'password_changed_at' from the 'users' table."
        );
    }

    console.log(`Starting ${isRollback ? "ROLLBACK" : "MIGRATION"}: ${sqlFile}...`);

    try {
        const sql = fs.readFileSync(sqlPath, "utf8");
        await pool.query(sql);
        console.log(`Successfully executed ${sqlFile}.`);

        // Verification query
        const colRes = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name IN ('token_version', 'password_changed_at')
            ORDER BY column_name;
        `);

        if (isRollback) {
            console.log("Verified: account security columns dropped successfully. Remaining matching columns:", colRes.rows.length);
        } else {
            console.log("Verified: account security columns exist in users table:", colRes.rows.map(r => r.column_name));

            // Verify existing users retain NULL for password_changed_at and 1 for token_version
            const userCheck = await pool.query(`
                SELECT 
                    COUNT(*) AS total_users,
                    COUNT(password_changed_at) AS users_with_pw_changed_date,
                    COUNT(*) FILTER (WHERE token_version = 1) AS users_with_token_v1
                FROM users;
            `);
            const stats = userCheck.rows[0];
            console.log(`Verification stats: total users = ${stats.total_users}, users with password_changed_at = ${stats.users_with_pw_changed_date} (must be 0 for existing), users with token_version=1 = ${stats.users_with_token_v1}`);
        }
    } catch (err) {
        console.error(`Migration failed with error:`, err);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
};

if (require.main === module) {
    runMigration();
}

module.exports = { runMigration };
