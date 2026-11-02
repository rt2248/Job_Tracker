const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const { execSync } = require("child_process");
const pool = require("../configs/db");
const {
    createJobFromListing,
    updateJobStatus,
    getJobStatusHistory,
} = require("../models/files/jobs.model");

const runStatusHistoryTests = async () => {
    console.log("===============================================================================");
    console.log("       JOB TRACKER — STAGE 2 STATUS HISTORY TEST SUITE (AUTOMATED)            ");
    console.log("===============================================================================\n");

    let passed = 0;
    let failed = 0;

    const assert = (condition, desc) => {
        if (condition) {
            console.log(`  [PASS] ${desc}`);
            passed++;
        } else {
            console.error(`  [FAIL] ${desc}`);
            failed++;
        }
    };

    const timestamp = Date.now();
    const userA_Email = `test_status_hist_user_a_${timestamp}@example.com`;
    const userA_Username = `test_user_a_${timestamp}`;
    const userB_Email = `test_status_hist_user_b_${timestamp}@example.com`;
    const userB_Username = `test_user_b_${timestamp}`;
    const seedUserEmail = `test_status_hist_seed_${timestamp}@example.com`;
    const seedUserUsername = `test_seed_${timestamp}`;

    let userAId = null;
    let userBId = null;
    let seedUserId = null;
    let testListingId = null;
    let createdJobId = null;
    let cascadeJobId = null;
    let concurrentJobId = null;

    try {
        // ==========================================
        // 0. FIXTURE SETUP
        // ==========================================
        console.log("--- 0. Setting Up Isolated Test Fixtures ---");

        const userARes = await pool.query(
            `INSERT INTO users (first_name, last_name, email, user_name, password_hash)
             VALUES ('TestA', 'User', $1, $2, 'dummy_hash_a')
             RETURNING id`,
            [userA_Email, userA_Username]
        );
        userAId = userARes.rows[0].id;

        const userBRes = await pool.query(
            `INSERT INTO users (first_name, last_name, email, user_name, password_hash)
             VALUES ('TestB', 'User', $1, $2, 'dummy_hash_b')
             RETURNING id`,
            [userB_Email, userB_Username]
        );
        userBId = userBRes.rows[0].id;

        const listingRes = await pool.query(
            `INSERT INTO job_listings (
                title, company, link, job_type, work_mode,
                compensation_min, compensation_max, compensation_period, compensation_currency,
                experience_level, location, description, posted_date
             ) VALUES (
                $1, $2, 'https://example.com/test-job', 'fulltime', 'remote',
                120000, 160000, 'yearly', 'USD',
                'mid', 'Remote', 'Test listing for status history verification', CURRENT_DATE
             ) RETURNING id`,
            [`Staff Engineer ${timestamp}`, `TestCorp ${timestamp}`]
        );
        testListingId = listingRes.rows[0].id;

        assert(userAId && userBId && testListingId, "Successfully initialized test users and test listing");

        // ==========================================
        // SCENARIO 1: Initial History via createJobFromListing
        // ==========================================
        console.log("\n--- Scenario 1: Initial Status History Recording via createJobFromListing ---");

        const createRes = await createJobFromListing(userAId, testListingId);
        assert(createRes.created === true, "createJobFromListing succeeds with created: true");
        assert(createRes.job && createRes.job.status === "saved", "Created job has status 'saved'");
        createdJobId = createRes.job.id;

        const history1 = await getJobStatusHistory(userAId, createdJobId);
        assert(history1.length === 1, "Exactly one history entry created for new job");
        assert(history1[0].from_status === null, "Initial history has from_status: NULL");
        assert(history1[0].to_status === "saved", "Initial history has to_status: 'saved'");
        assert(history1[0].user_id === userAId, "History user_id matches job owner");
        assert(history1[0].job_id === createdJobId, "History job_id matches created job");
        assert(history1[0].changed_at !== null, "History changed_at is populated");

        // Verify duplicate createJobFromListing does not insert duplicate history
        const duplicateCreate = await createJobFromListing(userAId, testListingId);
        assert(duplicateCreate.created === false, "Duplicate createJobFromListing returns created: false");
        const historyAfterDup = await getJobStatusHistory(userAId, createdJobId);
        assert(historyAfterDup.length === 1, "Duplicate create does not insert additional history rows");

        // ==========================================
        // SCENARIO 2: Normal Status Transition via updateJobStatus
        // ==========================================
        console.log("\n--- Scenario 2: Normal Status Transition via updateJobStatus ---");

        const updateApplied = await updateJobStatus(userAId, createdJobId, "applied");
        assert(updateApplied.status === "applied", "updateJobStatus successfully transitioned to 'applied'");
        assert(updateApplied.applied_date !== null, "applied_date automatically populated on transition to 'applied'");

        const history2 = await getJobStatusHistory(userAId, createdJobId);
        assert(history2.length === 2, "History now contains exactly 2 transitions");
        assert(history2[1].from_status === "saved", "Transition 2 has from_status: 'saved'");
        assert(history2[1].to_status === "applied", "Transition 2 has to_status: 'applied'");

        // Subsequent transition: applied -> interview
        const updateInterview = await updateJobStatus(userAId, createdJobId, "interview");
        assert(updateInterview.status === "interview", "updateJobStatus transitioned to 'interview'");
        assert(updateInterview.applied_date !== null, "applied_date preserved across subsequent transitions");

        const history3 = await getJobStatusHistory(userAId, createdJobId);
        assert(history3.length === 3, "History now contains exactly 3 transitions");
        assert(history3[2].from_status === "applied", "Transition 3 has from_status: 'applied'");
        assert(history3[2].to_status === "interview", "Transition 3 has to_status: 'interview'");

        // ==========================================
        // SCENARIO 3: Duplicate Transition Prevention
        // ==========================================
        console.log("\n--- Scenario 3: Duplicate Transition Prevention (Idempotent Status) ---");

        const duplicateUpdate = await updateJobStatus(userAId, createdJobId, "interview");
        assert(duplicateUpdate.status === "interview", "Calling updateJobStatus with same status returns current job");

        const historyAfterNoop = await getJobStatusHistory(userAId, createdJobId);
        assert(historyAfterNoop.length === 3, "No duplicate history entry logged when status is unchanged");

        // ==========================================
        // SCENARIO 4: Transaction Rollback on Failure
        // ==========================================
        console.log("\n--- Scenario 4: Transaction Rollback Atomicity on Status History Failure ---");

        // Install a temporary trigger that fails history insertion for 'rejected'
        await pool.query(`
            CREATE OR REPLACE FUNCTION test_simulated_history_failure()
            RETURNS TRIGGER AS $$
            BEGIN
                IF NEW.to_status = 'rejected' THEN
                    RAISE EXCEPTION 'Simulated history write error for testing atomicity';
                END IF;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);

        await pool.query(`
            CREATE TRIGGER trg_test_simulate_failure
            BEFORE INSERT ON job_status_history
            FOR EACH ROW
            EXECUTE FUNCTION test_simulated_history_failure();
        `);

        let rollbackErrorCaught = false;
        try {
            await updateJobStatus(userAId, createdJobId, "rejected");
        } catch (err) {
            rollbackErrorCaught = true;
            assert(
                err.message && err.message.includes("Simulated history write error"),
                "updateJobStatus re-throws history insertion failure"
            );
        }
        assert(rollbackErrorCaught, "History insertion failure interrupted the operation");

        // Verify that the job status was rolled back to 'interview' and NOT committed as 'rejected'
        const currentJobInDb = await pool.query("SELECT status FROM jobs WHERE id = $1", [createdJobId]);
        assert(currentJobInDb.rows[0].status === "interview", "Job status in database rolled back to 'interview'");

        const historyAfterRollback = await getJobStatusHistory(userAId, createdJobId);
        assert(historyAfterRollback.length === 3, "No partial or orphaned history records written during failed transaction");

        // Remove the temporary trigger
        await pool.query("DROP TRIGGER IF EXISTS trg_test_simulate_failure ON job_status_history");
        await pool.query("DROP FUNCTION IF EXISTS test_simulated_history_failure()");

        // ==========================================
        // SCENARIO 5: Cross-Tenant Access Protection & Composite Foreign Key
        // ==========================================
        console.log("\n--- Scenario 5: Cross-Tenant Access Protection & Composite Foreign Key ---");

        // User B attempts to update User A's job
        const crossTenantUpdate = await updateJobStatus(userBId, createdJobId, "offer");
        assert(crossTenantUpdate === null, "updateJobStatus returns null when User B targets User A's job");

        // Verify User A's job was not modified
        const userAJobCheck = await pool.query("SELECT status FROM jobs WHERE id = $1", [createdJobId]);
        assert(userAJobCheck.rows[0].status === "interview", "User A's job remains unmodified after User B's unauthorized attempt");

        // Verify User B cannot view User A's history
        const crossTenantHistory = await getJobStatusHistory(userBId, createdJobId);
        assert(crossTenantHistory.length === 0, "getJobStatusHistory for User B returns empty array for User A's job");

        // Verify storage-level composite foreign key enforcement:
        // Attempt direct INSERT into job_status_history with mismatched user_id (User B) and job_id (owned by User A)
        let fkViolationCaught = false;
        try {
            await pool.query(
                `INSERT INTO job_status_history (job_id, user_id, from_status, to_status)
                 VALUES ($1, $2, 'interview'::job_status, 'offer'::job_status)`,
                [createdJobId, userBId]
            );
        } catch (err) {
            fkViolationCaught = true;
            assert(err.code === "23503", "Database raises foreign key violation (23503) on mismatched (job_id, user_id)");
            assert(
                err.constraint === "fk_status_history_job_user",
                "Violation specifically enforced by fk_status_history_job_user"
            );
        }
        assert(fkViolationCaught, "Composite foreign key blocks cross-tenant history spoofing at storage layer");

        // ==========================================
        // SCENARIO 6: Cascade Deletion
        // ==========================================
        console.log("\n--- Scenario 6: Cascade Deletion of History Records ---");

        // Create a new job specifically for deletion test
        const cascadeJobRes = await pool.query(
            `INSERT INTO jobs (user_id, company, role, status)
             VALUES ($1, 'CascadeCorp', 'Tester', 'saved')
             RETURNING id`,
            [userAId]
        );
        cascadeJobId = cascadeJobRes.rows[0].id;

        // Insert initial and transition history records
        await pool.query(
            `INSERT INTO job_status_history (job_id, user_id, from_status, to_status)
             VALUES ($1, $2, NULL, 'saved'::job_status),
                    ($1, $2, 'saved'::job_status, 'applied'::job_status)`,
            [cascadeJobId, userAId]
        );

        const historyBeforeDelete = await pool.query(
            "SELECT COUNT(*)::int AS count FROM job_status_history WHERE job_id = $1",
            [cascadeJobId]
        );
        assert(historyBeforeDelete.rows[0].count === 2, "2 history records exist prior to job deletion");

        // Delete the parent job
        await pool.query("DELETE FROM jobs WHERE id = $1 AND user_id = $2", [cascadeJobId, userAId]);

        const historyAfterDelete = await pool.query(
            "SELECT COUNT(*)::int AS count FROM job_status_history WHERE job_id = $1",
            [cascadeJobId]
        );
        assert(
            historyAfterDelete.rows[0].count === 0,
            "All status history records cascaded and were automatically removed on job deletion"
        );

        // ==========================================
        // SCENARIO 7: Concurrent Status Updates & Row-Locking
        // ==========================================
        console.log("\n--- Scenario 7: Concurrent Status Updates & Row-Locking (SELECT FOR UPDATE) ---");

        const concurrentJobRes = await pool.query(
            `INSERT INTO jobs (user_id, company, role, status)
             VALUES ($1, 'ConcurrencyCorp', 'LockTester', 'saved')
             RETURNING id`,
            [userAId]
        );
        concurrentJobId = concurrentJobRes.rows[0].id;
        await pool.query(
            `INSERT INTO job_status_history (job_id, user_id, from_status, to_status)
             VALUES ($1, $2, NULL, 'saved'::job_status)`,
            [concurrentJobId, userAId]
        );

        // Dispatch 2 concurrent updates to the same job
        const [res1, res2] = await Promise.all([
            updateJobStatus(userAId, concurrentJobId, "applied"),
            updateJobStatus(userAId, concurrentJobId, "oa"),
        ]);

        assert(res1 && res2, "Both concurrent transactions completed successfully without deadlock");
        const finalJobState = await pool.query("SELECT status FROM jobs WHERE id = $1", [concurrentJobId]);
        assert(["applied", "oa"].includes(finalJobState.rows[0].status), "Final job status is valid");

        const concurrentHistory = await getJobStatusHistory(userAId, concurrentJobId);
        assert(concurrentHistory.length >= 2, "Concurrent updates serialized and recorded sequential history entries");

        // ==========================================
        // SCENARIO 8: Connection Cleanup After Transaction Failures
        // ==========================================
        console.log("\n--- Scenario 8: Connection Pool Health & Leak Prevention After Errors ---");

        // Trigger an invalid enum error
        let enumErrorCaught = false;
        try {
            await updateJobStatus(userAId, createdJobId, "nonexistent_status_type");
        } catch (err) {
            enumErrorCaught = true;
        }
        assert(enumErrorCaught, "Invalid enum value triggered expected error");

        // Trigger a missing job error
        const missingJobRes = await updateJobStatus(userAId, "00000000-0000-0000-0000-000000000000", "applied");
        assert(missingJobRes === null, "Missing job gracefully handled without connection leak");

        // Verify pool client can be acquired and released immediately
        const testClient = await pool.connect();
        const pingRes = await testClient.query("SELECT 1 AS ping");
        testClient.release();
        assert(pingRes.rows[0].ping === 1, "Connection pool remains healthy and immediately available");
        assert(pool.waitingCount === 0, "No pending/blocked client connection requests in pool queue");

        // ==========================================
        // SCENARIO 9: Seed Script Idempotency & History Generation
        // ==========================================
        console.log("\n--- Scenario 9: Seed Script History Generation & Idempotency ---");

        // Create seed test user
        const seedUserRes = await pool.query(
            `INSERT INTO users (first_name, last_name, email, user_name, password_hash)
             VALUES ('Seed', 'Tester', $1, $2, 'dummy_seed_hash')
             RETURNING id`,
            [seedUserEmail, seedUserUsername]
        );
        seedUserId = seedUserRes.rows[0].id;

        // Run seed script for the first time
        execSync(`node Backend/src/scripts/seedJobs.js "${seedUserEmail}"`, { stdio: "pipe" });

        const seededJobs1 = await pool.query("SELECT COUNT(*)::int AS count FROM jobs WHERE user_id = $1", [seedUserId]);
        const seededHistory1 = await pool.query("SELECT COUNT(*)::int AS count FROM job_status_history WHERE user_id = $1", [seedUserId]);

        assert(seededJobs1.rows[0].count === 18, "seedJobs created 18 dummy jobs");
        assert(seededHistory1.rows[0].count === 18, "seedJobs created 18 matching status history records");

        // Re-run seed script (test idempotency and cascade delete on reseed)
        execSync(`node Backend/src/scripts/seedJobs.js "${seedUserEmail}"`, { stdio: "pipe" });

        const seededJobs2 = await pool.query("SELECT COUNT(*)::int AS count FROM jobs WHERE user_id = $1", [seedUserId]);
        const seededHistory2 = await pool.query("SELECT COUNT(*)::int AS count FROM job_status_history WHERE user_id = $1", [seedUserId]);

        assert(seededJobs2.rows[0].count === 18, "Re-seeding maintained exact count of 18 jobs");
        assert(seededHistory2.rows[0].count === 18, "Re-seeding cleanly cascaded and regenerated 18 history records without duplicates");

        console.log("\n===============================================================================");
        console.log(`=== STAGE 2 STATUS HISTORY TEST SUITE FINISHED: ${passed} PASSED, ${failed} FAILED ===`);
        console.log("===============================================================================\n");
    } catch (err) {
        console.error("Test execution encountered an unexpected fatal error:", err);
        failed++;
    } finally {
        console.log("--- Cleaning Up Test Fixtures ---");
        try {
            // Drop any test trigger if left behind
            await pool.query("DROP TRIGGER IF EXISTS trg_test_simulate_failure ON job_status_history");
            await pool.query("DROP FUNCTION IF EXISTS test_simulated_history_failure()");

            if (userAId) {
                await pool.query("DELETE FROM users WHERE id = $1", [userAId]);
            }
            if (userBId) {
                await pool.query("DELETE FROM users WHERE id = $1", [userBId]);
            }
            if (seedUserId) {
                await pool.query("DELETE FROM users WHERE id = $1", [seedUserId]);
            }
            if (testListingId) {
                await pool.query("DELETE FROM job_listings WHERE id = $1", [testListingId]);
            }
            console.log("All test users, listings, jobs, and history fixtures cleaned up successfully.");
        } catch (cleanupErr) {
            console.error("Error during fixture cleanup:", cleanupErr);
        }

        await pool.end();
        process.exitCode = failed > 0 ? 1 : 0;
    }
};

runStatusHistoryTests();
