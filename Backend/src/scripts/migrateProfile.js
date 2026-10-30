const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const pool = require("../configs/db");

const runMigration = async () => {
    const isRollback = process.argv.includes("--rollback");
    const sqlFile = isRollback ? "profile_rollback.sql" : "profile.sql";
    const sqlPath = path.join(__dirname, "../models/schema", sqlFile);

    // Safeguards for rollback
    if (isRollback) {
        // 1. Production environment safeguard
        if (process.env.NODE_ENV === "production" && !process.argv.includes("--confirm-production-destructive-rollback")) {
            console.error(
                "CRITICAL ERROR: Rollback aborted. Attempting to drop 'user_profiles' in PRODUCTION without '--confirm-production-destructive-rollback' flag."
            );
            process.exitCode = 1;
            return;
        }

        // 2. Remote / Cloud database safeguard
        const dbUrl = process.env.DATABASE_URL || "";
        const isRemoteHost = !dbUrl.includes("localhost") && !dbUrl.includes("127.0.0.1");
        if (isRemoteHost && !process.argv.includes("--confirm-remote-rollback")) {
            console.error(
                "CRITICAL ERROR: Rollback aborted. Attempting to drop 'user_profiles' on remote host without '--confirm-remote-rollback' flag."
            );
            process.exitCode = 1;
            return;
        }

        console.warn(
            "WARNING: Executing rollback will permanently drop table 'user_profiles' and all associated developer profile records."
        );
    }

    console.log(`Starting ${isRollback ? "ROLLBACK" : "MIGRATION"}: ${sqlFile}...`);

    try {
        const sql = fs.readFileSync(sqlPath, "utf8");
        await pool.query(sql);
        console.log(`Successfully executed ${sqlFile}.`);

        // Verify table existence
        const checkRes = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' AND table_name = 'user_profiles';
        `);
        
        if (isRollback) {
            console.log("Verified: user_profiles table dropped successfully.");
        } else {
            console.log("Verified: user_profiles table exists in public schema:", checkRes.rows.length > 0);
            
            // Check visibility_settings default
            const colRes = await pool.query(`
                SELECT column_default 
                FROM information_schema.columns 
                WHERE table_name = 'user_profiles' AND column_name = 'visibility_settings';
            `);
            console.log("Verified: visibility_settings default is:", colRes.rows[0]?.column_default?.slice(0, 80) + "...");
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
