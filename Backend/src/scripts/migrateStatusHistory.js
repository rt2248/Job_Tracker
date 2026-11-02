const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const pool = require("../configs/db");

const runMigration = async () => {
    const isRollback = process.argv.includes("--rollback");
    const sqlFile = isRollback ? "status_history_rollback.sql" : "status_history.sql";
    const sqlPath = path.join(__dirname, "../models/schema", sqlFile);

    // Safeguards for rollback
    if (isRollback) {
        // 1. Mandatory destructive history drop confirmation flag
        if (!process.argv.includes("--confirm-destructive-history-drop")) {
            console.error(
                "\n===============================================================================\n" +
                "CRITICAL ERROR: Rollback aborted.\n" +
                "Dropping 'job_status_history' will PERMANENTLY DESTROY all accumulated candidate\n" +
                "transition timestamps and historical stage duration data.\n\n" +
                "To proceed, you must explicitly pass: --confirm-destructive-history-drop\n" +
                "===============================================================================\n"
            );
            process.exitCode = 1;
            return;
        }

        // 2. Production environment safeguard
        if (process.env.NODE_ENV === "production" && !process.argv.includes("--confirm-production-destructive-rollback")) {
            console.error(
                "CRITICAL ERROR: Rollback aborted. Attempting to drop status history in PRODUCTION without '--confirm-production-destructive-rollback' flag."
            );
            process.exitCode = 1;
            return;
        }

        // 3. Remote / Cloud database safeguard
        const dbUrl = process.env.DATABASE_URL || "";
        const isRemoteHost = !dbUrl.includes("localhost") && !dbUrl.includes("127.0.0.1");
        if (isRemoteHost && !process.argv.includes("--confirm-remote-rollback")) {
            console.error(
                "CRITICAL ERROR: Rollback aborted. Attempting to drop status history on remote host without '--confirm-remote-rollback' flag."
            );
            process.exitCode = 1;
            return;
        }

        console.warn(
            "WARNING: Executing rollback will permanently drop table 'job_status_history' and the composite constraint 'uq_jobs_id_user_id'."
        );
    }

    console.log(`Starting ${isRollback ? "ROLLBACK" : "MIGRATION"}: ${sqlFile}...`);

    const client = await pool.connect();
    try {
        const sql = fs.readFileSync(sqlPath, "utf8");

        await client.query("BEGIN");
        await client.query(sql);
        await client.query("COMMIT");
        console.log(`Successfully executed ${sqlFile}.`);

        // Post-migration / Post-rollback verification
        if (isRollback) {
            // Verify table removal
            const tableRes = await client.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = 'job_status_history';
            `);
            console.log("Verified: job_status_history table dropped:", tableRes.rows.length === 0);

            // Verify composite constraint removal
            const constraintRes = await client.query(`
                SELECT conname 
                FROM pg_constraint 
                WHERE conrelid = 'jobs'::regclass AND conname = 'uq_jobs_id_user_id';
            `);
            console.log("Verified: uq_jobs_id_user_id constraint removed from jobs:", constraintRes.rows.length === 0);
        } else {
            // 1. Verify composite constraint on jobs
            const constraintRes = await client.query(`
                SELECT conname, contype 
                FROM pg_constraint 
                WHERE conrelid = 'jobs'::regclass AND conname = 'uq_jobs_id_user_id';
            `);
            console.log("Verified: uq_jobs_id_user_id exists on jobs table:", constraintRes.rows.length > 0);

            // 2. Verify job_status_history table existence
            const tableRes = await client.query(`
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = 'job_status_history';
            `);
            console.log("Verified: job_status_history table exists in public schema:", tableRes.rows.length > 0);

            // 3. Verify foreign key constraints on job_status_history
            const fkRes = await client.query(`
                SELECT conname, contype 
                FROM pg_constraint 
                WHERE conrelid = 'job_status_history'::regclass AND contype = 'f'
                ORDER BY conname;
            `);
            console.log(
                "Verified foreign keys on job_status_history:",
                fkRes.rows.map((r) => r.conname)
            );

            // 4. Verify indexes on job_status_history
            const idxRes = await client.query(`
                SELECT indexname 
                FROM pg_indexes 
                WHERE tablename = 'job_status_history'
                ORDER BY indexname;
            `);
            console.log(
                "Verified indexes on job_status_history:",
                idxRes.rows.map((r) => r.indexname)
            );
        }
    } catch (err) {
        await client.query("ROLLBACK").catch(() => {});
        console.error(`Migration failed with error:`, err);
        process.exitCode = 1;
    } finally {
        client.release();
        await pool.end();
    }
};

if (require.main === module) {
    runMigration();
}

module.exports = { runMigration };
