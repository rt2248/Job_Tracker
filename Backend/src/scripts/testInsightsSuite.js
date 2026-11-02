const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const express = require("express");
const jwt = require("jsonwebtoken");
const { execSync } = require("child_process");
const pool = require("../configs/db");
const insightsRoutes = require("../routes/insights.routes");
const { updateJobStatus } = require("../models/files/jobs.model");
const {
    normalizeSkillToken,
    parseAndClassifyListing,
    computeMatchFit,
} = require("../utils/skillMatcher");

const runInsightsTestSuite = async () => {
    console.log("===============================================================================");
    console.log("    JOB TRACKER — STAGE 5 INSIGHTS & VERIFICATION TEST SUITE (AUTOMATED)       ");
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

    // Spin up ephemeral test server
    const app = express();
    app.use(express.json());
    app.use("/api/insights", insightsRoutes);

    const server = app.listen(0);
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

    const timestamp = Date.now();
    const userA_Email = `ins_user_a_${timestamp}@example.com`;
    const userA_Username = `ins_user_a_${timestamp}`;
    const userB_Email = `ins_user_b_${timestamp}@example.com`;
    const userB_Username = `ins_user_b_${timestamp}`;
    const userC_Email = `ins_user_c_${timestamp}@example.com`;
    const userC_Username = `ins_user_c_${timestamp}`;
    const seedUserEmail = `ins_seed_test_${timestamp}@example.com`;
    const seedUserUsername = `ins_seed_test_${timestamp}`;

    let userAId = null;
    let userBId = null;
    let userCId = null;
    let seedUserId = null;
    let tokenA = null;
    let tokenB = null;
    let tokenC = null;
    let listing1Id = null;
    let listing2Id = null;

    try {
        // ==========================================
        // 1. UNIT TESTS: Skill Matcher & Classification
        // ==========================================
        console.log("--- 1. Testing Skill Matcher Utility (Synonyms, Tokens & Classification) ---");

        // Normalization checks
        assert(normalizeSkillToken("React") === "react", "Normalizes 'React' to 'react'");
        assert(normalizeSkillToken("react.js") === "react", "Normalizes 'react.js' to 'react'");
        assert(normalizeSkillToken("NodeJS") === "node.js", "Normalizes 'NodeJS' to 'node.js'");
        assert(normalizeSkillToken("REST API") === "rest api", "Normalizes 'REST API' to 'rest api'");
        assert(normalizeSkillToken("api") === "rest api", "Normalizes 'api' to 'rest api'");
        assert(normalizeSkillToken("Postgres") === "postgresql", "Normalizes 'Postgres' to 'postgresql'");
        assert(normalizeSkillToken("k8s") === "kubernetes", "Normalizes 'k8s' to 'kubernetes'");
        assert(normalizeSkillToken("UnknownCustomTool") === null, "Returns null for unrecognized tool");
        assert(normalizeSkillToken("") === null, "Returns null for empty string");
        assert(normalizeSkillToken(null) === null, "Returns null for null input");

        // Tripartite classification check
        const sampleClassification = parseAndClassifyListing(
            ["React", "Docker", "Tally"],
            [
                "3+ years experience with React and Node.js",
                "Understanding of REST API design and PostgreSQL",
                "Experience with C++ and C#",
                "Experience with Tally ERP and GA4",
                "Available for part-time hours and strong communication",
            ]
        );

        assert(
            sampleClassification.identifiableSkills.includes("react") &&
            sampleClassification.identifiableSkills.includes("node.js") &&
            sampleClassification.identifiableSkills.includes("docker") &&
            sampleClassification.identifiableSkills.includes("postgresql") &&
            sampleClassification.identifiableSkills.includes("rest api") &&
            sampleClassification.identifiableSkills.includes("c++") &&
            sampleClassification.identifiableSkills.includes("c#"),
            "Accurately extracts all curated identifiable skills including C++ and C#"
        );

        assert(
            sampleClassification.qualitativeRequirements.length >= 1 &&
            sampleClassification.qualitativeRequirements.some(r => r.includes("part-time hours")),
            "Accurately classifies soft skills/logistics into qualitativeRequirements"
        );

        assert(
            sampleClassification.unrecognizedTechnicalTerms.length >= 1 &&
            sampleClassification.unrecognizedTechnicalTerms.some(t => t.includes("Tally")),
            "Accurately classifies non-curated tools (Tally) into unrecognizedTechnicalTerms"
        );

        // Context-sensitive 'go' check
        const goCheck1 = parseAndClassifyListing([], ["Golang programming required"]);
        assert(goCheck1.identifiableSkills.includes("go"), "Recognizes 'golang' as 'go'");
        const goCheck2 = parseAndClassifyListing([], ["Go language developer"]);
        assert(goCheck2.identifiableSkills.includes("go"), "Recognizes 'go language' as 'go'");
        const goCheckFalse = parseAndClassifyListing([], ["Must go through three interview rounds"]);
        assert(!goCheckFalse.identifiableSkills.includes("go"), "Does NOT falsely match English word 'go'");

        // Match fit calculation
        const fit1 = computeMatchFit(
            ["React", "Node.js", "Docker"],
            ["react", "node.js", "docker", "postgresql"]
        );
        assert(fit1.totalIdentifiable === 4, "Identifies total of 4 skills in requirement");
        assert(fit1.matchedSkills.length === 3, "Finds 3 matched skills");
        assert(fit1.missingSkills.length === 1 && fit1.missingSkills[0] === "postgresql", "Identifies missing 'postgresql'");
        assert(fit1.matchPercentage === 75, "Calculates exact match percentage (3/4 = 75%)");

        // Edge case: Empty user skills
        const fitEmptyUser = computeMatchFit([], ["react", "node.js"]);
        assert(fitEmptyUser.matchedSkills.length === 0, "Empty user profile yields 0 matched skills");
        assert(fitEmptyUser.matchPercentage === 0, "Empty user profile yields 0% match");

        // Edge case: Empty requirements
        const fitEmptyReqs = computeMatchFit(["React"], []);
        assert(fitEmptyReqs.totalIdentifiable === 0, "Empty listing requirements yields total 0");
        assert(fitEmptyReqs.matchPercentage === null, "Empty listing requirements returns null match percentage");

        // ==========================================
        // 2. FIXTURE SETUP
        // ==========================================
        console.log("\n--- 2. Setting Up Test Users, Profiles & Seed Opportunities ---");

        // Create User A
        const userARes = await pool.query(
            `INSERT INTO users (first_name, last_name, email, user_name, password_hash)
             VALUES ('InsightA', 'User', $1, $2, 'dummy_hash')
             RETURNING id`,
            [userA_Email, userA_Username]
        );
        userAId = userARes.rows[0].id;
        tokenA = jwt.sign({ userId: userAId, tokenVersion: 1 }, process.env.JWT_SECRET);

        // Add profile with skills for User A
        await pool.query(
            `INSERT INTO user_profiles (user_id, skills)
             VALUES ($1, $2::jsonb)`,
            [userAId, JSON.stringify(["React", "Node.js", "Docker", "PostgreSQL"])]
        );

        // Create User B (for cross-tenant checks)
        const userBRes = await pool.query(
            `INSERT INTO users (first_name, last_name, email, user_name, password_hash)
             VALUES ('InsightB', 'User', $1, $2, 'dummy_hash')
             RETURNING id`,
            [userB_Email, userB_Username]
        );
        userBId = userBRes.rows[0].id;
        tokenB = jwt.sign({ userId: userBId, tokenVersion: 1 }, process.env.JWT_SECRET);

        // Create User C (empty dataset user)
        const userCRes = await pool.query(
            `INSERT INTO users (first_name, last_name, email, user_name, password_hash)
             VALUES ('InsightC', 'User', $1, $2, 'dummy_hash')
             RETURNING id`,
            [userC_Email, userC_Username]
        );
        userCId = userCRes.rows[0].id;
        tokenC = jwt.sign({ userId: userCId, tokenVersion: 1 }, process.env.JWT_SECRET);

        // Create Listing 1 (linked to User A Job 1)
        const l1Res = await pool.query(
            `INSERT INTO job_listings (
                title, company, link, job_type, work_mode, experience_level, location,
                requirements, posted_date
             ) VALUES (
                'Fullstack Engineer', 'AlphaTech', 'https://alphatech.com/jobs/1', 'fulltime', 'remote', 'mid', 'Remote',
                $1, CURRENT_DATE
             ) RETURNING id`,
            [[
                "3+ years experience with React and Node.js",
                "Hands-on with REST API design and PostgreSQL",
                "Familiarity with Docker",
                "Experience with Tally",
                "Available for part-time hours",
            ]]
        );
        listing1Id = l1Res.rows[0].id;

        // Tag Listing 1 with "React", "Node.js", "MongoDB", "Tally"
        const tagNames = ["react", "node.js", "mongodb", "tally"];
        for (const tName of tagNames) {
            const tagRes = await pool.query(
                `INSERT INTO tags (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
                [tName]
            );
            await pool.query(
                `INSERT INTO listing_tags (listing_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                [listing1Id, tagRes.rows[0].id]
            );
        }

        // Create Listing 2 (linked to User A Job 2)
        const l2Res = await pool.query(
            `INSERT INTO job_listings (
                title, company, link, job_type, work_mode, experience_level, location,
                requirements, posted_date
             ) VALUES (
                'Python Engineer', 'BetaTech', 'https://betatech.com/jobs/2', 'fulltime', 'remote', 'senior', 'Remote',
                $1, CURRENT_DATE
             ) RETURNING id`,
            [[
                "Experience with Python and Django",
                "Strong communication skills",
            ]]
        );
        listing2Id = l2Res.rows[0].id;

        // Populate User A's 9 jobs across various stages and dates
        // 1. Linked Job 1 (saved)
        const j1 = await pool.query(
            `INSERT INTO jobs (user_id, company, role, status, source_listing_id)
             VALUES ($1, 'AlphaTech', 'Fullstack Engineer', 'saved', $2) RETURNING id`,
            [userAId, listing1Id]
        );
        await pool.query(
            `INSERT INTO job_status_history (job_id, user_id, from_status, to_status, changed_at)
             VALUES ($1, $2, NULL, 'saved', NOW() - INTERVAL '30 days')`,
            [j1.rows[0].id, userAId]
        );

        // 2. Linked Job 2 (applied, updated 20 days ago -> STALE under 14d)
        const j2 = await pool.query(
            `INSERT INTO jobs (user_id, company, role, status, applied_date, updated_at, source_listing_id)
             VALUES ($1, 'BetaTech', 'Python Engineer', 'applied', CURRENT_DATE - 20, NOW() - INTERVAL '20 days', $2) RETURNING id`,
            [userAId, listing2Id]
        );
        await pool.query(
            `INSERT INTO job_status_history (job_id, user_id, from_status, to_status, changed_at)
             VALUES ($1, $2, 'saved', 'applied', NOW() - INTERVAL '20 days')`,
            [j2.rows[0].id, userAId]
        );

        // 3. Manual Job 3 (applied, updated 5 days ago -> NOT stale)
        const j3 = await pool.query(
            `INSERT INTO jobs (user_id, company, role, status, applied_date, updated_at)
             VALUES ($1, 'GammaCorp', 'DevOps Eng', 'applied', CURRENT_DATE - 5, NOW() - INTERVAL '5 days') RETURNING id`,
            [userAId]
        );
        await pool.query(
            `INSERT INTO job_status_history (job_id, user_id, from_status, to_status, changed_at)
             VALUES ($1, $2, 'saved', 'applied', NOW() - INTERVAL '5 days')`,
            [j3.rows[0].id, userAId]
        );

        // 4. Manual Job 4 (oa, updated 13 days 20 hours ago -> NOT stale under 14d boundary)
        const j4 = await pool.query(
            `INSERT INTO jobs (user_id, company, role, status, applied_date, updated_at)
             VALUES ($1, 'DeltaCorp', 'Frontend Eng', 'oa', CURRENT_DATE - 13, NOW() - INTERVAL '13 days 20 hours') RETURNING id`,
            [userAId]
        );
        await pool.query(
            `INSERT INTO job_status_history (job_id, user_id, from_status, to_status, changed_at)
             VALUES ($1, $2, 'applied', 'oa', NOW() - INTERVAL '13 days 20 hours')`,
            [j4.rows[0].id, userAId]
        );

        // 5. Manual Job 5 (oa, updated 14 days 2 hours ago -> STALE under 14d boundary)
        const j5 = await pool.query(
            `INSERT INTO jobs (user_id, company, role, status, applied_date, updated_at)
             VALUES ($1, 'EpsilonCorp', 'Backend Eng', 'oa', CURRENT_DATE - 14, NOW() - INTERVAL '14 days 2 hours') RETURNING id`,
            [userAId]
        );
        await pool.query(
            `INSERT INTO job_status_history (job_id, user_id, from_status, to_status, changed_at)
             VALUES ($1, $2, 'applied', 'oa', NOW() - INTERVAL '14 days 2 hours')`,
            [j5.rows[0].id, userAId]
        );

        // 6. Manual Job 6 (interview, applied 40d ago, updated 2d ago)
        await pool.query(
            `INSERT INTO jobs (user_id, company, role, status, applied_date, updated_at)
             VALUES ($1, 'ZetaCorp', 'Fullstack Eng', 'interview', CURRENT_DATE - 40, NOW() - INTERVAL '2 days')`,
            [userAId]
        );

        // 7. Manual Job 7 (offer, applied 60d ago, updated 1d ago)
        await pool.query(
            `INSERT INTO jobs (user_id, company, role, status, applied_date, updated_at)
             VALUES ($1, 'EtaCorp', 'Lead Eng', 'offer', CURRENT_DATE - 60, NOW() - INTERVAL '1 day')`,
            [userAId]
        );

        // 8. Manual Job 8 (accepted, applied 80d ago, updated 10d ago)
        await pool.query(
            `INSERT INTO jobs (user_id, company, role, status, applied_date, updated_at)
             VALUES ($1, 'ThetaCorp', 'Staff Eng', 'accepted', CURRENT_DATE - 80, NOW() - INTERVAL '10 days')`,
            [userAId]
        );

        // 9. Manual Job 9 (rejected, applied 100d ago, updated 95d ago)
        await pool.query(
            `INSERT INTO jobs (user_id, company, role, status, applied_date, updated_at)
             VALUES ($1, 'IotaCorp', 'Architect', 'rejected', CURRENT_DATE - 100, NOW() - INTERVAL '95 days')`,
            [userAId]
        );

        // Populate User B with 2 distinct jobs
        await pool.query(
            `INSERT INTO jobs (user_id, company, role, status, applied_date)
             VALUES ($1, 'UserBCorp1', 'Junior Eng', 'applied', CURRENT_DATE - 2),
                    ($1, 'UserBCorp2', 'Support Eng', 'rejected', CURRENT_DATE - 10)`,
            [userBId]
        );

        assert(userAId && userBId && userCId, "Initialized all test users and sample application datasets");

        // ==========================================
        // 3. ENDPOINT TESTS: GET /api/insights/summary
        // ==========================================
        console.log("\n--- 3. Testing GET /api/insights/summary ---");

        // Unauthenticated check
        const unauthRes = await fetch(`${baseUrl}/api/insights/summary`);
        assert(unauthRes.status === 401, "Rejects request without Authorization token (401)");

        // Authenticated call for User A
        const summaryRes = await fetch(`${baseUrl}/api/insights/summary?range=30d&staleDays=14`, {
            headers: { Authorization: `Bearer ${tokenA}` },
        });
        assert(summaryRes.status === 200, "Returns 200 OK for authenticated user");
        const summary = await summaryRes.json();

        // Volume Metrics
        assert(summary.volumeMetrics.trackedOpportunities === 9, "Correct trackedOpportunities count (9 total jobs)");
        assert(summary.volumeMetrics.submittedApplications === 8, "Correct submittedApplications count (8 non-saved jobs)");
        assert(summary.volumeMetrics.cumulativeOffers === 2, "Correct cumulativeOffers count (1 offer + 1 accepted = 2)");
        assert(summary.volumeMetrics.cumulativeRejections === 1, "Correct cumulativeRejections count (1 rejected)");

        // Snapshot Metrics
        assert(summary.snapshotMetrics.activeInPipeline === 5, "Correct activeInPipeline (2 applied + 2 oa + 1 interview = 5)");
        assert(summary.snapshotMetrics.interviewsInProgress === 1, "Correct interviewsInProgress (1 interview)");
        assert(summary.snapshotMetrics.pendingOffers === 1, "Correct pendingOffers (1 offer)");

        // Stale Alerts (Exact elapsed time interval comparison)
        assert(summary.staleAlerts.thresholdDays === 14, "Reports thresholdDays = 14");
        assert(summary.staleAlerts.staleCount === 2, "Detects exactly 2 stale applications (Job 2: 20d, Job 5: 14.1d)");
        assert(summary.staleAlerts.applications.length === 2, "Stale applications list contains exactly 2 items");
        assert(
            summary.staleAlerts.applications.some(a => a.company === "BetaTech") &&
            summary.staleAlerts.applications.some(a => a.company === "EpsilonCorp"),
            "Correctly includes BetaTech (20d) and EpsilonCorp (14.1d)"
        );
        assert(
            !summary.staleAlerts.applications.some(a => a.company === "DeltaCorp"),
            "Strict boundary check: DeltaCorp (13.8d) is correctly NOT flagged as stale"
        );
        assert(
            !summary.staleAlerts.applications.some(a => a.company === "GammaCorp"),
            "GammaCorp (5d) is correctly NOT flagged as stale"
        );
        assert(
            summary.staleAlerts.caveat.includes("Inactivity is measured"),
            "Returns approved semantic disclosure caveat for stale calculation"
        );

        // Date Range Filters on Submission Activity
        assert(summary.submissionActivity.selectedRange === "30d", "Reports selectedRange: '30d'");
        assert(summary.submissionActivity.totalSubmittedInPeriod === 4, "30d range includes exactly 4 applications (20d, 5d, 13d, 14d)");

        // Test 90d range
        const summary90Res = await fetch(`${baseUrl}/api/insights/summary?range=90d`, {
            headers: { Authorization: `Bearer ${tokenA}` },
        });
        const summary90 = await summary90Res.json();
        assert(summary90.submissionActivity.selectedRange === "90d", "Supports range: '90d'");
        assert(summary90.submissionActivity.totalSubmittedInPeriod === 7, "90d range includes exactly 7 applications (excludes 100d job)");

        // Test all range
        const summaryAllRes = await fetch(`${baseUrl}/api/insights/summary?range=all`, {
            headers: { Authorization: `Bearer ${tokenA}` },
        });
        const summaryAll = await summaryAllRes.json();
        assert(summaryAll.submissionActivity.selectedRange === "all", "Supports range: 'all'");
        assert(summaryAll.submissionActivity.totalSubmittedInPeriod === 8, "All range includes all 8 submitted applications");

        // Fallback for invalid range
        const summaryInvalidRange = await fetch(`${baseUrl}/api/insights/summary?range=invalid_range_value`, {
            headers: { Authorization: `Bearer ${tokenA}` },
        });
        const summaryInvalid = await summaryInvalidRange.json();
        assert(summaryInvalid.submissionActivity.selectedRange === "30d", "Invalid range gracefully defaults to '30d'");

        // Rule-based insights
        assert(summary.ruleBasedInsights.length >= 3, "Generates multiple rule-based insight recommendations");
        assert(
            summary.ruleBasedInsights.some(i => i.id === "stale_applications_alert" && i.type === "warning"),
            "Generates stale applications warning alert"
        );
        assert(
            summary.ruleBasedInsights.some(i => i.id === "active_interviews" && i.type === "positive"),
            "Generates active interviews encouragement"
        );
        assert(
            summary.ruleBasedInsights.some(i => i.id === "pending_offers" && i.type === "positive"),
            "Generates pending offers positive notification"
        );

        // ==========================================
        // 3.1. DETAILED STALE INACTIVITY & STATUS HISTORY TRANSITION REGRESSION TESTS
        // ==========================================
        console.log("\n--- 3.1. Testing Status History Stage Inactivity & Edit Resilience ---");

        // 1. Application becomes stale after 14 days without status transition
        const staleTestJobRes = await pool.query(
            `INSERT INTO jobs (user_id, company, role, status, applied_date, notes, link)
             VALUES ($1, 'NotesEditCorp', 'Senior Architect', 'applied', CURRENT_DATE - 16, 'Original notes', 'https://orig-link.com')
             RETURNING id`,
            [userAId]
        );
        const staleTestJobId = staleTestJobRes.rows[0].id;
        await pool.query(
            `INSERT INTO job_status_history (job_id, user_id, from_status, to_status, changed_at)
             VALUES ($1, $2, 'saved', 'applied', NOW() - INTERVAL '16 days')`,
            [staleTestJobId, userAId]
        );

        const check1Res = await fetch(`${baseUrl}/api/insights/summary`, {
            headers: { Authorization: `Bearer ${tokenA}` },
        });
        const check1 = await check1Res.json();
        const foundInStale1 = check1.staleAlerts.applications.find(a => a.id === staleTestJobId);
        assert(foundInStale1 !== undefined, "1. Application becomes stale after 16 days without status transition");
        assert(foundInStale1 && foundInStale1.daysInactive >= 16.0, "Reports correct daysInactive >= 16 days");

        // 2. Editing its notes does not reset the stale timer
        await pool.query(
            `UPDATE jobs
             SET notes = 'Updated notes on company benefits and team structure',
                 updated_at = NOW()
             WHERE id = $1`,
            [staleTestJobId]
        );
        const check2Res = await fetch(`${baseUrl}/api/insights/summary`, {
            headers: { Authorization: `Bearer ${tokenA}` },
        });
        const check2 = await check2Res.json();
        const foundInStale2 = check2.staleAlerts.applications.find(a => a.id === staleTestJobId);
        assert(foundInStale2 !== undefined, "2. Editing notes does NOT reset the stale timer (job remains in staleAlerts)");
        assert(foundInStale2 && foundInStale2.daysInactive >= 16.0, "Inactivity timer still measures elapsed time from stage transition (~16d)");

        // 3. Editing its link does not reset the stale timer
        await pool.query(
            `UPDATE jobs
             SET link = 'https://updated-application-portal.com',
                 updated_at = NOW()
             WHERE id = $1`,
            [staleTestJobId]
        );
        const check3Res = await fetch(`${baseUrl}/api/insights/summary`, {
            headers: { Authorization: `Bearer ${tokenA}` },
        });
        const check3 = await check3Res.json();
        const foundInStale3 = check3.staleAlerts.applications.find(a => a.id === staleTestJobId);
        assert(foundInStale3 !== undefined, "3. Editing link does NOT reset the stale timer");
        assert(foundInStale3 && foundInStale3.daysInactive >= 16.0, "Inactivity timer remains unchanged after link modification");

        // 4. Moving from applied to oa resets the stage inactivity timer
        await updateJobStatus(userAId, staleTestJobId, "oa");
        const check4Res = await fetch(`${baseUrl}/api/insights/summary`, {
            headers: { Authorization: `Bearer ${tokenA}` },
        });
        const check4 = await check4Res.json();
        const foundInStale4 = check4.staleAlerts.applications.find(a => a.id === staleTestJobId);
        assert(foundInStale4 === undefined, "4. Moving from 'applied' to 'oa' resets stage inactivity timer (no longer stale)");

        // 5. An application younger than 14 days is not flagged
        const youngJobRes = await pool.query(
            `INSERT INTO jobs (user_id, company, role, status, applied_date)
             VALUES ($1, 'YoungCorp', 'UI Developer', 'applied', CURRENT_DATE - 6)
             RETURNING id`,
            [userAId]
        );
        const youngJobId = youngJobRes.rows[0].id;
        await pool.query(
            `INSERT INTO job_status_history (job_id, user_id, from_status, to_status, changed_at)
             VALUES ($1, $2, 'saved', 'applied', NOW() - INTERVAL '6 days')`,
            [youngJobId, userAId]
        );
        const check5Res = await fetch(`${baseUrl}/api/insights/summary`, {
            headers: { Authorization: `Bearer ${tokenA}` },
        });
        const check5 = await check5Res.json();
        assert(!check5.staleAlerts.applications.some(a => a.id === youngJobId), "5. Application younger than 14 days (6d) is NOT flagged as stale");

        // 6. Exactly 14 days is handled consistently with approved threshold
        const boundaryJob14Res = await pool.query(
            `INSERT INTO jobs (user_id, company, role, status, applied_date)
             VALUES ($1, 'BoundaryCorp14', 'QA Engineer', 'applied', CURRENT_DATE - 14)
             RETURNING id`,
            [userAId]
        );
        const boundaryJob14Id = boundaryJob14Res.rows[0].id;
        await pool.query(
            `INSERT INTO job_status_history (job_id, user_id, from_status, to_status, changed_at)
             VALUES ($1, $2, 'saved', 'applied', NOW() - INTERVAL '14 days 1 minute')`,
            [boundaryJob14Id, userAId]
        );

        const boundaryJob13Res = await pool.query(
            `INSERT INTO jobs (user_id, company, role, status, applied_date)
             VALUES ($1, 'BoundaryCorp13', 'DevOps', 'applied', CURRENT_DATE - 13)
             RETURNING id`,
            [userAId]
        );
        const boundaryJob13Id = boundaryJob13Res.rows[0].id;
        await pool.query(
            `INSERT INTO job_status_history (job_id, user_id, from_status, to_status, changed_at)
             VALUES ($1, $2, 'saved', 'applied', NOW() - INTERVAL '13 days 23 hours')`,
            [boundaryJob13Id, userAId]
        );

        const check6Res = await fetch(`${baseUrl}/api/insights/summary?staleDays=14`, {
            headers: { Authorization: `Bearer ${tokenA}` },
        });
        const check6 = await check6Res.json();
        assert(check6.staleAlerts.applications.some(a => a.id === boundaryJob14Id), "6a. Exactly >= 14 days application IS flagged as stale");
        assert(!check6.staleAlerts.applications.some(a => a.id === boundaryJob13Id), "6b. Application at 13 days 23 hours is NOT flagged as stale");

        // 7. Missing history records fallback safety
        const legacyJobRes = await pool.query(
            `INSERT INTO jobs (user_id, company, role, status, applied_date)
             VALUES ($1, 'LegacyCorp', 'Legacy Engineer', 'applied', CURRENT_DATE - 25)
             RETURNING id`,
            [userAId]
        );
        const legacyJobId = legacyJobRes.rows[0].id;
        const check7Res = await fetch(`${baseUrl}/api/insights/summary`, {
            headers: { Authorization: `Bearer ${tokenA}` },
        });
        const check7 = await check7Res.json();
        const foundLegacy = check7.staleAlerts.applications.find(a => a.id === legacyJobId);
        assert(foundLegacy !== undefined, "7. Missing history records handled safely via fallback to applied_date");
        assert(foundLegacy && foundLegacy.daysInactive >= 25.0, "Legacy job reports daysInactive >= 25 days based on applied_date");

        // 8. Cross-user records cannot influence stale calculations
        const userBStaleJobRes = await pool.query(
            `INSERT INTO jobs (user_id, company, role, status, applied_date)
             VALUES ($1, 'UserBStaleCorp', 'Specialist', 'applied', CURRENT_DATE - 40)
             RETURNING id`,
            [userBId]
        );
        const userBStaleJobId = userBStaleJobRes.rows[0].id;
        await pool.query(
            `INSERT INTO job_status_history (job_id, user_id, from_status, to_status, changed_at)
             VALUES ($1, $2, 'saved', 'applied', NOW() - INTERVAL '40 days')`,
            [userBStaleJobId, userBId]
        );
        const check8Res = await fetch(`${baseUrl}/api/insights/summary`, {
            headers: { Authorization: `Bearer ${tokenA}` },
        });
        const check8 = await check8Res.json();
        assert(!check8.staleAlerts.applications.some(a => a.id === userBStaleJobId), "8. Cross-user records cannot influence User A's stale calculations");

        // ==========================================
        // 3.2. DETAILED STALEDAYS INPUT VALIDATION TESTS
        // ==========================================
        console.log("\n--- 3.2. Testing staleDays Parameter Validation & Interval Safety ---");

        // Missing staleDays defaults to 14
        const valMissingRes = await fetch(`${baseUrl}/api/insights/summary`, {
            headers: { Authorization: `Bearer ${tokenA}` },
        });
        assert(valMissingRes.status === 200, "Missing staleDays returns 200 OK");
        const valMissing = await valMissingRes.json();
        assert(valMissing.staleAlerts.thresholdDays === 14, "Missing staleDays defaults to 14");

        // Explicit valid staleDays
        const valExplicitRes = await fetch(`${baseUrl}/api/insights/summary?staleDays=21`, {
            headers: { Authorization: `Bearer ${tokenA}` },
        });
        assert(valExplicitRes.status === 200, "Valid explicit staleDays (21) returns 200 OK");
        const valExplicit = await valExplicitRes.json();
        assert(valExplicit.staleAlerts.thresholdDays === 21, "Reports thresholdDays = 21");

        // Non-numeric staleDays rejected
        const valNonNumericRes = await fetch(`${baseUrl}/api/insights/summary?staleDays=not_a_number`, {
            headers: { Authorization: `Bearer ${tokenA}` },
        });
        assert(valNonNumericRes.status === 400, "Non-numeric staleDays rejected with 400 Bad Request");
        const nonNumBody = await valNonNumericRes.json();
        assert(nonNumBody.message && nonNumBody.message.includes("Invalid staleDays"), "Returns explanatory error message for non-numeric");

        // Decimal staleDays rejected
        const valDecimalRes = await fetch(`${baseUrl}/api/insights/summary?staleDays=14.5`, {
            headers: { Authorization: `Bearer ${tokenA}` },
        });
        assert(valDecimalRes.status === 400, "Decimal staleDays (14.5) rejected with 400 Bad Request");

        // Zero staleDays rejected
        const valZeroRes = await fetch(`${baseUrl}/api/insights/summary?staleDays=0`, {
            headers: { Authorization: `Bearer ${tokenA}` },
        });
        assert(valZeroRes.status === 400, "Zero staleDays rejected with 400 Bad Request");

        // Negative staleDays rejected
        const valNegativeRes = await fetch(`${baseUrl}/api/insights/summary?staleDays=-7`, {
            headers: { Authorization: `Bearer ${tokenA}` },
        });
        assert(valNegativeRes.status === 400, "Negative staleDays (-7) rejected with 400 Bad Request");

        // Unreasonably large staleDays rejected (> 90)
        const valLargeRes = await fetch(`${baseUrl}/api/insights/summary?staleDays=999`, {
            headers: { Authorization: `Bearer ${tokenA}` },
        });
        assert(valLargeRes.status === 400, "Unreasonably large staleDays (999) rejected with 400 Bad Request");

        // ==========================================
        // 4. ENDPOINT TESTS: GET /api/insights/pipeline
        // ==========================================
        console.log("\n--- 4. Testing GET /api/insights/pipeline ---");

        const pipelineRes = await fetch(`${baseUrl}/api/insights/pipeline`, {
            headers: { Authorization: `Bearer ${tokenA}` },
        });
        assert(pipelineRes.status === 200, "GET /api/insights/pipeline returns 200 OK");
        const pipeline = await pipelineRes.json();

        assert(pipeline.snapshotTotal >= 9, "Total pipeline snapshot count is non-zero");
        assert(pipeline.activeSegment.totalActive > 0, "Active segment contains active opportunities");
        assert(pipeline.closedSegment.totalClosed > 0, "Closed segment contains resolved opportunities");

        // Check stages
        const savedStage = pipeline.activeSegment.stages.find(s => s.status === "saved");
        const appliedStage = pipeline.activeSegment.stages.find(s => s.status === "applied");
        const acceptedStage = pipeline.closedSegment.stages.find(s => s.status === "accepted");
        const rejectedStage = pipeline.closedSegment.stages.find(s => s.status === "rejected");

        assert(savedStage !== undefined, "Saved stage present in active segment");
        assert(appliedStage !== undefined, "Applied stage present in active segment");
        assert(acceptedStage !== undefined, "Accepted stage present in closed segment");
        assert(rejectedStage !== undefined, "Rejected stage present in closed segment");
        assert(pipeline.disclaimer.includes("point-in-time snapshot"), "Includes point-in-time snapshot disclaimer");

        // ==========================================
        // 5. ENDPOINT TESTS: GET /api/insights/skill-fit
        // ==========================================
        console.log("\n--- 5. Testing GET /api/insights/skill-fit ---");

        const skillFitRes = await fetch(`${baseUrl}/api/insights/skill-fit`, {
            headers: { Authorization: `Bearer ${tokenA}` },
        });
        assert(skillFitRes.status === 200, "GET /api/insights/skill-fit returns 200 OK");
        const skillFit = await skillFitRes.json();

        assert(Array.isArray(skillFit.userDeclaredSkills), "userDeclaredSkills is returned as an array");
        assert(skillFit.userDeclaredSkills.length === 4, "User A has 4 declared profile skills");

        // Coverage calculations
        assert(skillFit.coverage.totalTrackedJobs >= 9, "Coverage reports totalTrackedJobs");
        assert(skillFit.coverage.listingLinkedJobs === 2, "Coverage reports listingLinkedJobs = 2");
        assert(skillFit.coverage.unlinkedJobs >= 7, "Coverage reports unlinkedJobs (manually tracked excluded)");
        assert(skillFit.coverage.coveragePercentage > 0, "Coverage percentage calculated accurately");
        assert(skillFit.coverage.note.includes("Only jobs linked to the Job Search board"), "Includes coverage transparency note");

        // Job fit summaries (strictly listing-linked)
        assert(skillFit.jobFitSummaries.length === 2, "jobFitSummaries contains only the 2 listing-linked opportunities");

        const alphaFit = skillFit.jobFitSummaries.find(j => j.company === "AlphaTech");
        const betaFit = skillFit.jobFitSummaries.find(j => j.company === "BetaTech");

        assert(alphaFit !== undefined, "AlphaTech listing-linked job evaluated");
        assert(
            alphaFit.matchedSkills.includes("react") &&
            alphaFit.matchedSkills.includes("node.js") &&
            alphaFit.matchedSkills.includes("docker") &&
            alphaFit.matchedSkills.includes("postgresql"),
            "AlphaTech matches React, Node.js, Docker, PostgreSQL"
        );
        assert(alphaFit.missingSkills.includes("mongodb"), "AlphaTech identifies missing skill 'mongodb'");
        assert(alphaFit.matchPercentage >= 60, `AlphaTech calculates match percentage (${alphaFit.matchPercentage}%)`);
        assert(
            alphaFit.qualitativeRequirements.some(q => q.includes("part-time hours")),
            "AlphaTech preserves qualitative requirements"
        );
        assert(
            alphaFit.unrecognizedTerms.some(u => u.includes("Tally")),
            "AlphaTech categorizes non-vocabulary term (Tally) into unrecognizedTerms"
        );

        assert(betaFit !== undefined, "BetaTech listing-linked job evaluated");
        assert(betaFit.matchedSkills.length === 0, "BetaTech has 0 matched skills (Python/Django not in user profile)");
        assert(betaFit.matchPercentage === 0, "BetaTech reports 0% match");
        assert(skillFit.disclaimer.includes("automated estimate"), "Includes suitability disclosure disclaimer");

        // ==========================================
        // 6. TENANT ISOLATION TESTS
        // ==========================================
        console.log("\n--- 6. Testing Multi-Tenant Data Isolation ---");

        const userBSummaryRes = await fetch(`${baseUrl}/api/insights/summary`, {
            headers: { Authorization: `Bearer ${tokenB}` },
        });
        const userBSummary = await userBSummaryRes.json();

        assert(userBSummary.volumeMetrics.trackedOpportunities >= 2, "User B summary scoped exclusively to User B");
        assert(userBSummary.volumeMetrics.cumulativeOffers === 0, "User B cumulativeOffers = 0 (no offers leaked from User A)");

        // ==========================================
        // 7. EMPTY DATASET TESTS (Zero Jobs User)
        // ==========================================
        console.log("\n--- 7. Testing Empty Dataset Graceful Handling ---");

        const userCSummaryRes = await fetch(`${baseUrl}/api/insights/summary`, {
            headers: { Authorization: `Bearer ${tokenC}` },
        });
        assert(userCSummaryRes.status === 200, "Empty dataset user returns 200 OK without errors");
        const userCSummary = await userCSummaryRes.json();

        assert(userCSummary.volumeMetrics.trackedOpportunities === 0, "Empty user trackedOpportunities: 0");
        assert(userCSummary.volumeMetrics.submittedApplications === 0, "Empty user submittedApplications: 0");
        assert(userCSummary.staleAlerts.staleCount === 0, "Empty user staleCount: 0");
        assert(userCSummary.staleAlerts.applications.length === 0, "Empty user stale applications: []");
        assert(userCSummary.submissionActivity.totalSubmittedInPeriod === 0, "Empty user activity total: 0");
        assert(userCSummary.submissionActivity.dailySeries.length === 0, "Empty user dailySeries: []");
        assert(
            userCSummary.ruleBasedInsights.some(i => i.id === "empty_tracker"),
            "Empty user receives informative 'Start Tracking Opportunities' recommendation"
        );

        const userCPipelineRes = await fetch(`${baseUrl}/api/insights/pipeline`, {
            headers: { Authorization: `Bearer ${tokenC}` },
        });
        assert(userCPipelineRes.status === 200, "Empty user pipeline returns 200 OK");
        const userCPipeline = await userCPipelineRes.json();
        assert(userCPipeline.snapshotTotal === 0, "Empty user snapshotTotal: 0");
        assert(userCPipeline.activeSegment.stages.every(s => s.count === 0 && s.percentage === 0), "All stage percentages are 0.0%");

        const userCSkillFitRes = await fetch(`${baseUrl}/api/insights/skill-fit`, {
            headers: { Authorization: `Bearer ${tokenC}` },
        });
        assert(userCSkillFitRes.status === 200, "Empty user skill fit returns 200 OK");
        const userCSkillFit = await userCSkillFitRes.json();
        assert(userCSkillFit.coverage.totalTrackedJobs === 0, "Empty user coverage total: 0");
        assert(userCSkillFit.jobFitSummaries.length === 0, "Empty user jobFitSummaries: []");

        // ==========================================
        // 8. EXTENDED SECURITY & SESSION REVOCATION (token_version)
        // ==========================================
        console.log("\n--- 8. Testing Extended Security, Malformed Tokens & Session Invalidation ---");

        // Unauthenticated access on pipeline and skill-fit
        const unauthPipelineRes = await fetch(`${baseUrl}/api/insights/pipeline`);
        assert(unauthPipelineRes.status === 401, "GET /api/insights/pipeline rejects unauthenticated access with 401");

        const unauthSkillFitRes = await fetch(`${baseUrl}/api/insights/skill-fit`);
        assert(unauthSkillFitRes.status === 401, "GET /api/insights/skill-fit rejects unauthenticated access with 401");

        // Malformed token rejection
        const malformedHeaders = { Authorization: "Bearer malformed.invalid.token.signature" };
        const malformedSummaryRes = await fetch(`${baseUrl}/api/insights/summary`, { headers: malformedHeaders });
        assert(malformedSummaryRes.status === 401, "Rejects malformed JWT token on /summary with 401");

        const malformedPipelineRes = await fetch(`${baseUrl}/api/insights/pipeline`, { headers: malformedHeaders });
        assert(malformedPipelineRes.status === 401, "Rejects malformed JWT token on /pipeline with 401");

        const malformedSkillFitRes = await fetch(`${baseUrl}/api/insights/skill-fit`, { headers: malformedHeaders });
        assert(malformedSkillFitRes.status === 401, "Rejects malformed JWT token on /skill-fit with 401");

        // Invalidate User A session via token_version increment (simulating password change/logout-all)
        await pool.query("UPDATE users SET token_version = token_version + 1 WHERE id = $1", [userAId]);

        // Old token must be rejected across all endpoints
        const revokedSummaryRes = await fetch(`${baseUrl}/api/insights/summary`, {
            headers: { Authorization: `Bearer ${tokenA}` },
        });
        assert(revokedSummaryRes.status === 401, "Revoked token is rejected on /summary with 401");
        const revokedSummaryBody = await revokedSummaryRes.json();
        assert(
            revokedSummaryBody.message && revokedSummaryBody.message.includes("Session expired or revoked"),
            "Revocation response explains session expired or revoked"
        );

        const revokedPipelineRes = await fetch(`${baseUrl}/api/insights/pipeline`, {
            headers: { Authorization: `Bearer ${tokenA}` },
        });
        assert(revokedPipelineRes.status === 401, "Revoked token is rejected on /pipeline with 401");

        const revokedSkillFitRes = await fetch(`${baseUrl}/api/insights/skill-fit`, {
            headers: { Authorization: `Bearer ${tokenA}` },
        });
        assert(revokedSkillFitRes.status === 401, "Revoked token is rejected on /skill-fit with 401");

        // Mint fresh token for User A with tokenVersion = 2
        const tokenA_v2 = jwt.sign({ userId: userAId, tokenVersion: 2 }, process.env.JWT_SECRET);
        const freshSummaryRes = await fetch(`${baseUrl}/api/insights/summary`, {
            headers: { Authorization: `Bearer ${tokenA_v2}` },
        });
        assert(freshSummaryRes.status === 200, "Fresh token with updated tokenVersion succeeds on /summary with 200 OK");

        const freshPipelineRes = await fetch(`${baseUrl}/api/insights/pipeline`, {
            headers: { Authorization: `Bearer ${tokenA_v2}` },
        });
        assert(freshPipelineRes.status === 200, "Fresh token succeeds on /pipeline with 200 OK");

        const freshSkillFitRes = await fetch(`${baseUrl}/api/insights/skill-fit`, {
            headers: { Authorization: `Bearer ${tokenA_v2}` },
        });
        assert(freshSkillFitRes.status === 200, "Fresh token succeeds on /skill-fit with 200 OK");

        // ==========================================
        // 9. SQL PARAMETERIZATION & MULTI-TENANT ISOLATION
        // ==========================================
        console.log("\n--- 9. Testing SQL Parameterization Resistance & Multi-Tenant Boundary ---");

        // SQL injection payload in staleDays
        const sqliStale1 = await fetch(`${baseUrl}/api/insights/summary?staleDays=14%20OR%201=1`, {
            headers: { Authorization: `Bearer ${tokenA_v2}` },
        });
        assert(sqliStale1.status === 400, "SQL injection attempt in staleDays (?staleDays=14 OR 1=1) rejected with 400");

        const sqliStale2 = await fetch(`${baseUrl}/api/insights/summary?staleDays=14;DROP%20TABLE%20jobs;`, {
            headers: { Authorization: `Bearer ${tokenA_v2}` },
        });
        assert(sqliStale2.status === 400, "SQL injection attempt in staleDays (?staleDays=14;DROP TABLE) rejected with 400");

        // SQL injection payload in range
        const sqliRange = await fetch(`${baseUrl}/api/insights/summary?range=30d'%20OR%20'1'='1`, {
            headers: { Authorization: `Bearer ${tokenA_v2}` },
        });
        assert(sqliRange.status === 200, "SQL injection attempt in range safely handled and defaulted to '30d'");
        const sqliRangeBody = await sqliRange.json();
        assert(sqliRangeBody.submissionActivity.selectedRange === "30d", "Sanitized range correctly reports '30d'");

        // Multi-tenant pipeline isolation: User B has 3 jobs (2 applied, 1 rejected)
        const userBPipelineRes = await fetch(`${baseUrl}/api/insights/pipeline`, {
            headers: { Authorization: `Bearer ${tokenB}` },
        });
        const userBPipeline = await userBPipelineRes.json();
        assert(userBPipeline.snapshotTotal === 3, "User B pipeline snapshot total exactly matches User B jobs (3)");
        assert(userBPipeline.activeSegment.totalActive === 2, "User B active segment contains exactly 2 active jobs");
        assert(userBPipeline.closedSegment.totalClosed === 1, "User B closed segment contains exactly 1 closed job");
        const bInterviewStage = userBPipeline.activeSegment.stages.find(s => s.status === "interview");
        assert(bInterviewStage && bInterviewStage.count === 0, "User B sees 0 interviews (User A's interviews not leaked)");

        // Multi-tenant skill-fit isolation: User B has no linked jobs
        const userBSkillFitRes = await fetch(`${baseUrl}/api/insights/skill-fit`, {
            headers: { Authorization: `Bearer ${tokenB}` },
        });
        const userBSkillFit = await userBSkillFitRes.json();
        assert(userBSkillFit.coverage.totalTrackedJobs === 3, "User B skill fit reports totalTrackedJobs = 3");
        assert(userBSkillFit.coverage.listingLinkedJobs === 0, "User B reports listingLinkedJobs = 0 (no leakage from User A)");
        assert(userBSkillFit.coverage.unlinkedJobs === 3, "User B reports unlinkedJobs = 3");
        assert(userBSkillFit.jobFitSummaries.length === 0, "User B jobFitSummaries is empty (User A listings not leaked)");

        // ==========================================
        // 10. SEEDED DATASET INTEGRATION & LIFECYCLE
        // ==========================================
        console.log("\n--- 10. Testing Seeded Dataset Integration & Lifecycle (seedJobs.js) ---");

        const seedUserRes = await pool.query(
            `INSERT INTO users (first_name, last_name, email, user_name, password_hash)
             VALUES ('Seed', 'InsightsUser', $1, $2, 'dummy_seed_hash')
             RETURNING id`,
            [seedUserEmail, seedUserUsername]
        );
        seedUserId = seedUserRes.rows[0].id;
        const seedToken = jwt.sign({ userId: seedUserId, tokenVersion: 1 }, process.env.JWT_SECRET);

        // Execute seed script
        execSync(`node Backend/src/scripts/seedJobs.js "${seedUserEmail}"`, { stdio: "pipe" });

        // Query summary for seeded user
        const seedSummaryRes = await fetch(`${baseUrl}/api/insights/summary`, {
            headers: { Authorization: `Bearer ${seedToken}` },
        });
        assert(seedSummaryRes.status === 200, "GET /api/insights/summary returns 200 OK for seeded dataset");
        const seedSummary = await seedSummaryRes.json();

        assert(seedSummary.volumeMetrics.trackedOpportunities === 18, "Seeded dataset: trackedOpportunities === 18");
        assert(seedSummary.volumeMetrics.submittedApplications === 18, "Seeded dataset: submittedApplications === 18");
        assert(seedSummary.volumeMetrics.cumulativeOffers === 5, "Seeded dataset: cumulativeOffers === 5 (3 offer + 2 accepted)");
        assert(seedSummary.volumeMetrics.cumulativeRejections === 4, "Seeded dataset: cumulativeRejections === 4");
        assert(seedSummary.snapshotMetrics.activeInPipeline === 9, "Seeded dataset: activeInPipeline === 9 (3 applied + 3 oa + 3 interview)");
        assert(seedSummary.snapshotMetrics.interviewsInProgress === 3, "Seeded dataset: interviewsInProgress === 3");
        assert(seedSummary.snapshotMetrics.pendingOffers === 3, "Seeded dataset: pendingOffers === 3");
        assert(seedSummary.staleAlerts.staleCount === 6, "Seeded dataset: detects exactly 6 stale applications (3 applied + 3 oa from Aug 2026)");
        assert(seedSummary.staleAlerts.applications.length === 6, "Seeded dataset: stale alerts list has 6 applications");

        // Query pipeline for seeded user
        const seedPipelineRes = await fetch(`${baseUrl}/api/insights/pipeline`, {
            headers: { Authorization: `Bearer ${seedToken}` },
        });
        assert(seedPipelineRes.status === 200, "GET /api/insights/pipeline returns 200 OK for seeded dataset");
        const seedPipeline = await seedPipelineRes.json();

        assert(seedPipeline.snapshotTotal === 18, "Seeded dataset: snapshotTotal === 18");
        assert(seedPipeline.activeSegment.totalActive === 12, "Seeded dataset: totalActive === 12");
        assert(seedPipeline.closedSegment.totalClosed === 6, "Seeded dataset: totalClosed === 6");
        assert(seedPipeline.activeSegment.stages.find(s => s.status === "applied").count === 3, "Seeded dataset: applied stage count === 3");
        assert(seedPipeline.activeSegment.stages.find(s => s.status === "oa").count === 3, "Seeded dataset: oa stage count === 3");
        assert(seedPipeline.activeSegment.stages.find(s => s.status === "interview").count === 3, "Seeded dataset: interview stage count === 3");
        assert(seedPipeline.activeSegment.stages.find(s => s.status === "offer").count === 3, "Seeded dataset: offer stage count === 3");
        assert(seedPipeline.closedSegment.stages.find(s => s.status === "accepted").count === 2, "Seeded dataset: accepted stage count === 2");
        assert(seedPipeline.closedSegment.stages.find(s => s.status === "rejected").count === 4, "Seeded dataset: rejected stage count === 4");

        // Query skill fit for seeded user
        const seedSkillFitRes = await fetch(`${baseUrl}/api/insights/skill-fit`, {
            headers: { Authorization: `Bearer ${seedToken}` },
        });
        assert(seedSkillFitRes.status === 200, "GET /api/insights/skill-fit returns 200 OK for seeded dataset");
        const seedSkillFit = await seedSkillFitRes.json();

        assert(seedSkillFit.coverage.totalTrackedJobs === 18, "Seeded dataset: totalTrackedJobs === 18");
        assert(seedSkillFit.coverage.listingLinkedJobs === 0, "Seeded dataset: listingLinkedJobs === 0 (manual dummy jobs)");
        assert(seedSkillFit.coverage.unlinkedJobs === 18, "Seeded dataset: unlinkedJobs === 18");
        assert(seedSkillFit.coverage.coveragePercentage === 0.0, "Seeded dataset: coveragePercentage === 0.0%");
        assert(seedSkillFit.jobFitSummaries.length === 0, "Seeded dataset: jobFitSummaries is empty");

        // Reseeding idempotency verification
        execSync(`node Backend/src/scripts/seedJobs.js "${seedUserEmail}"`, { stdio: "pipe" });
        const reseedSummaryRes = await fetch(`${baseUrl}/api/insights/summary`, {
            headers: { Authorization: `Bearer ${seedToken}` },
        });
        const reseedSummary = await reseedSummaryRes.json();
        assert(reseedSummary.volumeMetrics.trackedOpportunities === 18, "Reseeding idempotency: volumeMetrics remains exactly 18");
        assert(reseedSummary.snapshotMetrics.activeInPipeline === 9, "Reseeding idempotency: activeInPipeline remains exactly 9");

        console.log("\n===============================================================================");
        console.log(`=== STAGE 5 INSIGHTS TEST SUITE FINISHED: ${passed} PASSED, ${failed} FAILED ===`);
        console.log("===============================================================================\n");
    } catch (err) {
        console.error("Test execution encountered an unexpected fatal error:", err);
        failed++;
    } finally {
        console.log("--- Cleaning Up Test Fixtures ---");
        try {
            if (userAId) {
                await pool.query("DELETE FROM users WHERE id = $1", [userAId]);
            }
            if (userBId) {
                await pool.query("DELETE FROM users WHERE id = $1", [userBId]);
            }
            if (userCId) {
                await pool.query("DELETE FROM users WHERE id = $1", [userCId]);
            }
            if (seedUserId) {
                await pool.query("DELETE FROM users WHERE id = $1", [seedUserId]);
            }
            if (listing1Id) {
                await pool.query("DELETE FROM job_listings WHERE id = $1", [listing1Id]);
            }
            if (listing2Id) {
                await pool.query("DELETE FROM job_listings WHERE id = $1", [listing2Id]);
            }
            console.log("All test users, listings, jobs, tags, and profiles cleaned up successfully.");
        } catch (cleanupErr) {
            console.error("Error during fixture cleanup:", cleanupErr);
        }

        server.close();
        await pool.end();
        process.exitCode = failed > 0 ? 1 : 0;
    }
};

runInsightsTestSuite();
