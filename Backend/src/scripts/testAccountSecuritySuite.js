const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const express = require("express");
const jwt = require("jsonwebtoken");
const pool = require("../configs/db");
const authRoutes = require("../routes/auth.routes");
const profileRoutes = require("../routes/profile.routes");
const { validatePassword, MIN_PASSWORD_LENGTH, MAX_PASSWORD_LENGTH } = require("../utils/passwordPolicy");
const {
    updateUserPasswordAndInvalidateSessions,
    getUserAuthDetailsById,
} = require("../models/files/user.model");

const runAccountSecurityTests = async () => {
    console.log("=== STARTING STAGE 5.1 ACCOUNT SECURITY & PASSWORD MANAGEMENT TEST SUITE ===\n");
    let passed = 0;
    let failed = 0;

    const assert = (condition, desc) => {
        if (condition) {
            console.log(`✓ PASS: ${desc}`);
            passed++;
        } else {
            console.error(`✗ FAIL: ${desc}`);
            failed++;
        }
    };

    // Spin up an in-memory test express server with auth and profile routes
    const app = express();
    app.use(express.json());
    app.use("/api/auth", authRoutes);
    app.use("/api/profile", profileRoutes);

    const server = app.listen(0);
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

    const timestamp = Date.now();
    const testUsername = `sec_test_${timestamp}`;
    const testEmail = `sec_test_${timestamp}@example.com`;
    const initialPassword = "InitialSecurePass123!";
    const newPassword = "NewUpdatedSecurePass456#";

    let createdUserId = null;
    let legacyUserId = null;

    try {
        // ==========================================
        // 1. UNIT TESTS: Password Policy Validation
        // ==========================================
        console.log("--- 1. Testing Password Policy Validation Utility ---");
        assert(validatePassword("") !== null, "Rejects empty password");
        assert(validatePassword(null) !== null, "Rejects null password");
        assert(validatePassword(12345) !== null, "Rejects non-string password");
        assert(validatePassword("Short1!") !== null, `Rejects password shorter than ${MIN_PASSWORD_LENGTH} chars`);
        assert(validatePassword("A".repeat(MAX_PASSWORD_LENGTH + 1) + "1!a") !== null, `Rejects password longer than ${MAX_PASSWORD_LENGTH} chars`);
        assert(validatePassword("nouppercase123!") !== null, "Rejects password without uppercase letter");
        assert(validatePassword("NOLOWERCASE123!") !== null, "Rejects password without lowercase letter");
        assert(validatePassword("NoDigitsHere!@#") !== null, "Rejects password without numbers");
        assert(validatePassword("NoSpecialChars123") !== null, "Rejects password without special characters");
        assert(validatePassword("ValidPass123!") === null, "Accepts standard compliant strong password");
        assert(validatePassword("P@ssw0rdWithAllReqs") === null, "Accepts mixed alphanumeric with symbols");
        assert(validatePassword("A1!a" + "x".repeat(124)) === null, "Accepts valid password exactly 128 chars long");

        // ==========================================
        // 2. DATABASE SCHEMA: Account Security Columns
        // ==========================================
        console.log("\n--- 2. Testing Database Schema & Column Types ---");
        const colRes = await pool.query(`
            SELECT column_name, data_type, is_nullable, column_default 
            FROM information_schema.columns 
            WHERE table_name = 'users' AND column_name IN ('token_version', 'password_changed_at')
            ORDER BY column_name;
        `);
        const tokenVerCol = colRes.rows.find(r => r.column_name === "token_version");
        const pwChangedCol = colRes.rows.find(r => r.column_name === "password_changed_at");

        assert(tokenVerCol !== undefined, "Column 'token_version' exists in 'users' table");
        assert(tokenVerCol && tokenVerCol.data_type === "integer", "'token_version' is of type integer");
        assert(tokenVerCol && tokenVerCol.is_nullable === "NO", "'token_version' is NOT NULL");
        assert(tokenVerCol && tokenVerCol.column_default.includes("1"), "'token_version' has default value 1");

        assert(pwChangedCol !== undefined, "Column 'password_changed_at' exists in 'users' table");
        assert(pwChangedCol && pwChangedCol.data_type.includes("timestamp"), "'password_changed_at' is of type timestamp");
        assert(pwChangedCol && pwChangedCol.is_nullable === "YES", "'password_changed_at' allows NULL");

        // ==========================================
        // 3. SIGNUP ENDPOINT: Validation & Policy Checks
        // ==========================================
        console.log("\n--- 3. Testing Registration (Signup) Policy & Uniqueness ---");

        // Test weak password rejection on signup
        const weakSignup = await fetch(`${baseUrl}/api/auth/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                firstname: "Sec",
                lastname: "Test",
                email: `weak_${timestamp}@example.com`,
                username: `weak_${timestamp}`,
                password: "weakpassword",
            }),
        });
        const weakData = await weakSignup.json();
        assert(weakSignup.status === 400, "POST /api/auth/signup rejects weak password with 400");
        assert(weakData.message && weakData.message.includes("uppercase"), "Error message specifies missing uppercase criteria");

        // Test valid signup
        const validSignup = await fetch(`${baseUrl}/api/auth/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                firstname: "Security",
                lastname: "Tester",
                email: testEmail,
                username: testUsername,
                password: initialPassword,
            }),
        });
        const signupData = await validSignup.json();
        assert(validSignup.status === 201, "POST /api/auth/signup succeeds with 201 Created");
        assert(signupData.token !== undefined, "Signup response contains JWT token");
        assert(signupData.user && signupData.user.passwordChangedAt === null, "Signup response returns passwordChangedAt = null");

        createdUserId = signupData.user?.id;
        assert(createdUserId !== undefined, "Created user ID retrieved");

        // Inspect initial JWT
        const initialDecoded = jwt.decode(signupData.token);
        assert(initialDecoded.tokenVersion === 1, "Initial JWT contains tokenVersion = 1");

        // Test duplicate email rejection (409)
        const dupEmailSignup = await fetch(`${baseUrl}/api/auth/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                firstname: "Dup",
                lastname: "User",
                email: testEmail, // duplicate
                username: `unique_${timestamp}`,
                password: initialPassword,
            }),
        });
        assert(dupEmailSignup.status === 409, "POST /api/auth/signup rejects duplicate email with 409 Conflict");

        // Test duplicate username rejection (409)
        const dupUsernameSignup = await fetch(`${baseUrl}/api/auth/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                firstname: "Dup",
                lastname: "User",
                email: `unique_${timestamp}@example.com`,
                username: testUsername, // duplicate
                password: initialPassword,
            }),
        });
        assert(dupUsernameSignup.status === 409, "POST /api/auth/signup rejects duplicate username with 409 Conflict");

        // ==========================================
        // 4. LOGIN ENDPOINT: Authentication & Token Generation
        // ==========================================
        console.log("\n--- 4. Testing Login Endpoint ---");

        // Test invalid password
        const badLogin = await fetch(`${baseUrl}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                identifier: testUsername,
                password: "WrongPassword123!",
            }),
        });
        assert(badLogin.status === 401, "POST /api/auth/login rejects wrong password with 401");

        // Test valid login with username
        const loginUserRes = await fetch(`${baseUrl}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                identifier: testUsername,
                password: initialPassword,
            }),
        });
        const loginUserData = await loginUserRes.json();
        assert(loginUserRes.status === 200, "POST /api/auth/login succeeds with 200 using username");
        assert(loginUserData.user && loginUserData.user.passwordChangedAt === null, "Login response includes passwordChangedAt: null");

        const session1Token = loginUserData.token;
        const decodedSession1 = jwt.decode(session1Token);
        assert(decodedSession1.tokenVersion === 1, "Login token contains tokenVersion = 1");

        // Test valid login with email
        const loginEmailRes = await fetch(`${baseUrl}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                identifier: testEmail,
                password: initialPassword,
            }),
        });
        assert(loginEmailRes.status === 200, "POST /api/auth/login succeeds with 200 using email");

        // ==========================================
        // 5. AUTHENTICATED ENDPOINTS INITIAL STATE
        // ==========================================
        console.log("\n--- 5. Testing Initial Authenticated Endpoints State ---");
        const getMeInitial = await fetch(`${baseUrl}/api/auth/me`, {
            headers: { Authorization: `Bearer ${session1Token}` },
        });
        const meInitialData = await getMeInitial.json();
        assert(getMeInitial.status === 200, "GET /api/auth/me returns 200 with valid session token");
        assert(meInitialData.user.passwordChangedAt === null, "GET /api/auth/me initially reports passwordChangedAt: null");

        const getProfileInitial = await fetch(`${baseUrl}/api/profile/me`, {
            headers: { Authorization: `Bearer ${session1Token}` },
        });
        const profileInitialData = await getProfileInitial.json();
        assert(getProfileInitial.status === 200, "GET /api/profile/me returns 200 with valid session token");
        assert(profileInitialData.profile && profileInitialData.profile.passwordChangedAt === null, "GET /api/profile/me initially reports passwordChangedAt: null");

        // ==========================================
        // 6. PASSWORD CHANGE: Validations & Execution
        // Note: changePasswordLimiter permits 5 requests per 15m.
        // We carefully test 4 validation errors + 1 valid change (total 5 requests).
        // ==========================================
        console.log("\n--- 6. Testing PUT /api/auth/change-password Validations & Execution ---");

        // 6.1 Unauthenticated request (does not hit changePasswordLimiter as it has no valid token, or tests pre-auth)
        const unauthChange = await fetch(`${baseUrl}/api/auth/change-password`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                currentPassword: initialPassword,
                newPassword: newPassword,
                confirmPassword: newPassword,
            }),
        });
        assert(unauthChange.status === 401, "Rejects unauthenticated password change with 401");

        // 6.2 Attempt 1 on limiter: Incorrect current password
        const wrongCurrent = await fetch(`${baseUrl}/api/auth/change-password`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session1Token}`,
            },
            body: JSON.stringify({
                currentPassword: "IncorrectCurrentPassword123!",
                newPassword: newPassword,
                confirmPassword: newPassword,
            }),
        });
        assert(wrongCurrent.status === 401, "Rejects incorrect currentPassword with 401 (Attempt 1)");

        // 6.3 Attempt 2 on limiter: Weak new password
        const weakNew = await fetch(`${baseUrl}/api/auth/change-password`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session1Token}`,
            },
            body: JSON.stringify({
                currentPassword: initialPassword,
                newPassword: "short",
                confirmPassword: "short",
            }),
        });
        assert(weakNew.status === 400, "Rejects weak new password with 400 (Attempt 2)");

        // 6.4 Attempt 3 on limiter: Confirmation mismatch
        const mismatch = await fetch(`${baseUrl}/api/auth/change-password`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session1Token}`,
            },
            body: JSON.stringify({
                currentPassword: initialPassword,
                newPassword: newPassword,
                confirmPassword: "DifferentPassword123!",
            }),
        });
        assert(mismatch.status === 400, "Rejects newPassword mismatch with confirmPassword with 400 (Attempt 3)");

        // 6.5 Attempt 4 on limiter: Identical new password to current password
        const identical = await fetch(`${baseUrl}/api/auth/change-password`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session1Token}`,
            },
            body: JSON.stringify({
                currentPassword: initialPassword,
                newPassword: initialPassword,
                confirmPassword: initialPassword,
            }),
        });
        assert(identical.status === 400, "Rejects newPassword identical to currentPassword with 400 (Attempt 4)");

        // 6.6 Attempt 5 on limiter: Valid password change
        console.log("\n--- 7. Testing Successful Password Change (Attempt 5) ---");
        const successfulChange = await fetch(`${baseUrl}/api/auth/change-password`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session1Token}`,
            },
            body: JSON.stringify({
                currentPassword: initialPassword,
                newPassword: newPassword,
                confirmPassword: newPassword,
            }),
        });
        const changeData = await successfulChange.json();
        assert(successfulChange.status === 200, "PUT /api/auth/change-password succeeds with 200 OK");
        assert(changeData.message === "Password changed successfully", "Returns confirmation message");
        assert(changeData.token !== undefined, "Returns fresh JWT token for current session");
        assert(changeData.passwordChangedAt !== null, "Returns non-null passwordChangedAt timestamp");

        const session2FreshToken = changeData.token;
        const decodedFresh = jwt.decode(session2FreshToken);
        assert(decodedFresh && decodedFresh.tokenVersion === 2, "Fresh token has incremented tokenVersion = 2");

        // Verify database state directly
        const dbUser = await getUserAuthDetailsById(createdUserId);
        assert(dbUser.token_version === 2, "Database record reflects incremented token_version = 2");
        assert(dbUser.password_changed_at !== null, "Database record reflects non-null password_changed_at");

        // ==========================================
        // 8. SESSION INVALIDATION VERIFICATION (Old vs Fresh Tokens)
        // ==========================================
        console.log("\n--- 8. Testing Session Invalidation Across Endpoints ---");

        // 8.1 Old Session 1 token MUST be rejected now
        const oldMeReq = await fetch(`${baseUrl}/api/auth/me`, {
            headers: { Authorization: `Bearer ${session1Token}` },
        });
        assert(oldMeReq.status === 401, "Old JWT token is REVOKED on GET /api/auth/me (status 401)");
        const oldMeErr = await oldMeReq.json();
        assert(oldMeErr.message.includes("Session expired or revoked"), "Rejection message explains session was revoked");

        const oldProfileReq = await fetch(`${baseUrl}/api/profile/me`, {
            headers: { Authorization: `Bearer ${session1Token}` },
        });
        assert(oldProfileReq.status === 401, "Old JWT token is REVOKED on GET /api/profile/me (status 401)");

        // 8.2 Fresh Session 2 token MUST be accepted
        const freshMeReq = await fetch(`${baseUrl}/api/auth/me`, {
            headers: { Authorization: `Bearer ${session2FreshToken}` },
        });
        assert(freshMeReq.status === 200, "Fresh JWT token succeeds on GET /api/auth/me (status 200)");
        const freshMeData = await freshMeReq.json();
        assert(freshMeData.user.passwordChangedAt !== null, "GET /api/auth/me returns updated passwordChangedAt timestamp");

        const freshProfileReq = await fetch(`${baseUrl}/api/profile/me`, {
            headers: { Authorization: `Bearer ${session2FreshToken}` },
        });
        assert(freshProfileReq.status === 200, "Fresh JWT token succeeds on GET /api/profile/me (status 200)");
        const freshProfileData = await freshProfileReq.json();
        assert(freshProfileData.profile && freshProfileData.profile.passwordChangedAt !== null, "GET /api/profile/me returns updated passwordChangedAt timestamp");

        // ==========================================
        // 9. LEGACY TOKEN COMPATIBILITY & REVOCATION
        // ==========================================
        console.log("\n--- 9. Testing Legacy Token Handling ---");

        // Create a secondary test user who has NOT changed password (token_version = 1)
        const legacyTimestamp = Date.now() + 10;
        const legacyUsername = `legacy_${legacyTimestamp}`;
        const legacyEmail = `legacy_${legacyTimestamp}@example.com`;
        const legacySignup = await fetch(`${baseUrl}/api/auth/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                firstname: "Legacy",
                lastname: "User",
                email: legacyEmail,
                username: legacyUsername,
                password: initialPassword,
            }),
        });
        const legacyData = await legacySignup.json();
        legacyUserId = legacyData.user.id;

        // Sign a legacy token without tokenVersion claim for this user
        const legacyTokenNoClaim = jwt.sign(
            { userId: legacyUserId, email: legacyEmail },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        // A user with token_version = 1 should still be allowed through with legacy token (zero-downtime)
        const legacyAllowed = await fetch(`${baseUrl}/api/auth/me`, {
            headers: { Authorization: `Bearer ${legacyTokenNoClaim}` },
        });
        assert(legacyAllowed.status === 200, "Legacy token without claim is ACCEPTED when user token_version is 1");

        // Now craft a legacy token (without tokenVersion claim) for our original user (whose token_version = 2)
        const revokedLegacyToken = jwt.sign(
            { userId: createdUserId, email: testEmail },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );
        const legacyRevoked = await fetch(`${baseUrl}/api/auth/me`, {
            headers: { Authorization: `Bearer ${revokedLegacyToken}` },
        });
        assert(legacyRevoked.status === 401, "Legacy token without claim is REVOKED when user token_version > 1");

        // ==========================================
        // 10. AUTHENTICATION WITH NEW VS OLD CREDENTIALS
        // ==========================================
        console.log("\n--- 10. Testing Authentication With New vs Old Password ---");
        const loginOld = await fetch(`${baseUrl}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                identifier: testUsername,
                password: initialPassword,
            }),
        });
        assert(loginOld.status === 401, "Login with old password is rejected (status 401)");

        const loginNew = await fetch(`${baseUrl}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                identifier: testUsername,
                password: newPassword,
            }),
        });
        const loginNewData = await loginNew.json();
        assert(loginNew.status === 200, "Login with new password succeeds (status 200)");
        assert(loginNewData.user.passwordChangedAt !== null, "New login returns populated passwordChangedAt");
        const loginNewDecoded = jwt.decode(loginNewData.token);
        assert(loginNewDecoded.tokenVersion === 2, "New login issues JWT with tokenVersion = 2");

        // ==========================================
        // 11. OPTIMISTIC CONCURRENCY CONTROL
        // ==========================================
        console.log("\n--- 11. Testing Concurrency Safety & Optimistic Locking ---");
        // Attempting to update password with an outdated expected token_version (e.g., 1 when DB is 2)
        const staleUpdate = await updateUserPasswordAndInvalidateSessions(
            createdUserId,
            "dummy_hash",
            1 // stale version
        );
        assert(staleUpdate === null, "Optimistic lock prevents write when token_version mismatch occurs");

        // ==========================================
        // 12. RATE LIMITING ENFORCEMENT
        // ==========================================
        console.log("\n--- 12. Testing Rate Limiting (changePasswordLimiter) ---");
        // We already performed 5 requests against changePasswordLimiter for this user/IP.
        // The 6th request MUST trigger HTTP 429 Too Many Requests!
        const rateLimitedReq = await fetch(`${baseUrl}/api/auth/change-password`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${session2FreshToken}`,
            },
            body: JSON.stringify({
                currentPassword: newPassword,
                newPassword: "AnotherPassword123!",
                confirmPassword: "AnotherPassword123!",
            }),
        });
        assert(rateLimitedReq.status === 429, "Attempt 6 triggers HTTP 429 Too Many Requests");
        const rateLimitBody = await rateLimitedReq.json();
        assert(
            rateLimitBody.message && rateLimitBody.message.includes("Too many password change attempts"),
            "429 message informs user of rate limit lockout"
        );

        console.log(`\n=== STAGE 5.1 ACCOUNT SECURITY SUITE COMPLETED: ${passed} passed, ${failed} failed ===`);
    } catch (err) {
        console.error("Test execution encountered unexpected error:", err);
        failed++;
    } finally {
        // Clean up test users
        try {
            if (createdUserId) {
                await pool.query("DELETE FROM users WHERE id = $1", [createdUserId]);
            }
            if (legacyUserId) {
                await pool.query("DELETE FROM users WHERE id = $1", [legacyUserId]);
            }
        } catch (cleanupErr) {
            console.error("Error during test user cleanup:", cleanupErr);
        }

        server.close();
        await pool.end();
        process.exitCode = failed > 0 ? 1 : 0;
    }
};

runAccountSecurityTests();
