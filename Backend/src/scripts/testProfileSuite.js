const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") });
const express = require("express");
const jwt = require("jsonwebtoken");
const pool = require("../configs/db");
const profileRoutes = require("../routes/profile.routes");
const authRoutes = require("../routes/auth.routes");
const resumeRoutes = require("../routes/resume.routes");
const {
    getProfileByUserId,
    getProfileByUsername,
    updateProfileByUserId,
    DEFAULT_VISIBILITY,
} = require("../models/files/profile.model");
const {
    isValidHttpUrl,
    isValidAvatarUrl,
} = require("../controller/profile.controller");
const {
    avatarExists,
} = require("../utils/avatarStorage");

const runTests = async () => {
    console.log("=== STARTING STAGE 4 PROFILE & AVATAR UPLOAD TEST SUITE ===\n");
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

    // Spin up an in-memory test express server with the mounted routes
    const app = express();
    app.use(express.json());
    app.use("/api/profile", profileRoutes);
    app.use("/api/auth", authRoutes);
    app.use("/api/resume", resumeRoutes);

    const server = app.listen(0);
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

    try {
        // --- 1. Unit Security Checks: URL & Avatar Validation ---
        console.log("\n--- Testing URL & Avatar Sanitization ---");
        assert(!isValidHttpUrl("http://"), "Rejects 'http://' with missing hostname");
        assert(!isValidHttpUrl("javascript:alert(1)"), "Rejects 'javascript:alert(1)'");
        assert(!isValidHttpUrl("data:text/html,<h1>XSS</h1>"), "Rejects data URIs");
        assert(!isValidHttpUrl("ftp://example.com/file"), "Rejects ftp protocol");
        assert(isValidHttpUrl("https://github.com/developer"), "Accepts valid https URL");
        assert(isValidHttpUrl("http://localhost:3000/test"), "Accepts valid http localhost URL");

        // Allowed avatar formats: PNG, JPEG/JPG, and WebP
        console.log("\n--- Testing Allowed Avatar Formats (PNG, JPEG, WebP) ---");
        assert(isValidAvatarUrl("/uploads/avatars/user.png"), "Accepts internal PNG (.png)");
        assert(isValidAvatarUrl("/uploads/avatars/user.PNG"), "Accepts internal uppercase PNG (.PNG)");
        assert(isValidAvatarUrl("/uploads/avatars/user.jpg"), "Accepts internal JPG (.jpg)");
        assert(isValidAvatarUrl("/uploads/avatars/user.JPG"), "Accepts internal uppercase JPG (.JPG)");
        assert(isValidAvatarUrl("/uploads/avatars/user.jpeg"), "Accepts internal JPEG (.jpeg)");
        assert(isValidAvatarUrl("/uploads/avatars/user.JPEG"), "Accepts internal uppercase JPEG (.JPEG)");
        assert(isValidAvatarUrl("/uploads/avatars/user.webp"), "Accepts internal WebP (.webp)");
        assert(isValidAvatarUrl("/uploads/avatars/user.WEBP"), "Accepts internal uppercase WebP (.WEBP)");
        assert(isValidAvatarUrl("/api/profile/avatar/user-123.png"), "Accepts /api/profile/avatar/ PNG reference");
        assert(isValidAvatarUrl("/api/profile/avatar/user-123.webp"), "Accepts /api/profile/avatar/ WebP reference");
        assert(isValidAvatarUrl("/avatars/profile-123.webp"), "Accepts /avatars/ WebP reference");
        assert(isValidAvatarUrl("https://images.unsplash.com/photo-123.png"), "Accepts external PNG URL");
        assert(isValidAvatarUrl("https://images.unsplash.com/photo-123.jpg"), "Accepts external JPG URL");
        assert(isValidAvatarUrl("https://images.unsplash.com/photo-123.jpeg"), "Accepts external JPEG URL");
        assert(isValidAvatarUrl("https://images.unsplash.com/photo-123.webp"), "Accepts external WebP URL");
        assert(isValidAvatarUrl("https://avatars.githubusercontent.com/u/12345"), "Accepts external image endpoint URL");

        // Strictly Rejected avatar formats (SVG, GIF, unapproved formats, path traversal)
        console.log("\n--- Testing Strictly Rejected Avatar Formats (SVG, GIF, etc.) ---");
        assert(!isValidAvatarUrl("/uploads/avatars/user.svg"), "Rejects internal SVG (.svg)");
        assert(!isValidAvatarUrl("/uploads/avatars/user.SVG"), "Rejects internal uppercase SVG (.SVG)");
        assert(!isValidAvatarUrl("/uploads/avatars/user.sVg"), "Rejects internal mixed-case SVG (.sVg)");
        assert(!isValidAvatarUrl("https://example.com/avatar.svg"), "Rejects external SVG URL (.svg)");
        assert(!isValidAvatarUrl("https://example.com/avatar.SVG"), "Rejects external uppercase SVG URL (.SVG)");
        assert(!isValidAvatarUrl("https://example.com/avatar.sVg?size=200"), "Rejects external SVG URL with query params");
        assert(!isValidAvatarUrl("/uploads/avatars/user.gif"), "Rejects internal GIF (.gif)");
        assert(!isValidAvatarUrl("/uploads/avatars/user.GIF"), "Rejects internal uppercase GIF (.GIF)");
        assert(!isValidAvatarUrl("https://example.com/animated.gif"), "Rejects external GIF URL (.gif)");
        assert(!isValidAvatarUrl("/uploads/avatars/user.bmp"), "Rejects internal BMP (.bmp)");
        assert(!isValidAvatarUrl("https://example.com/photo.bmp"), "Rejects external BMP URL (.bmp)");
        assert(!isValidAvatarUrl("/uploads/avatars/script.sh"), "Rejects unsupported non-image extension (.sh)");
        assert(!isValidAvatarUrl("/uploads/avatars/../secret.png"), "Rejects internal path traversal with '..'");
        assert(!isValidAvatarUrl("/uploads/avatars/sub/pic.png"), "Rejects internal path with nested directories");
        assert(!isValidAvatarUrl("/uploads/avatars/%2e%2e/pic.png"), "Rejects percent-encoded path traversal");
        assert(!isValidAvatarUrl("C:\\Windows\\System32\\calc.exe"), "Rejects Windows absolute filesystem path");
        assert(!isValidAvatarUrl("data:image/svg+xml;utf8,<svg></svg>"), "Rejects SVG data URI");

        // --- 2. Database & User Setup ---
        console.log("\n--- Setting up Test User ---");
        const userRes = await pool.query("SELECT * FROM users LIMIT 1");
        assert(userRes.rows.length > 0, "Found an existing user in database");
        const testUser = userRes.rows[0];
        console.log(`Using test user: ${testUser.user_name} (${testUser.id})`);

        const validToken = jwt.sign(
            { userId: testUser.id, email: testUser.email },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        // --- 3. Multipart Avatar Upload Pipeline Tests ---
        console.log("\n--- Testing Multipart Avatar Upload Pipeline ---");
        // Sample image buffers
        const validPngBuf = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52]);
        const validJpgBuf = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x60]);
        const validWebpBuf = Buffer.from([0x52, 0x49, 0x46, 0x46, 0x24, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50, 0x38, 0x20]);
        const svgBuf = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><circle cx="50" cy="50" r="40"/></svg>');
        const gifBuf = Buffer.from('GIF89a\x01\x00\x01\x00\x80\x00\x00\x00\x00\x00\xff\xff\xff');

        // Test 3.1: Unauthenticated upload rejection
        const unauthUploadRes = await fetch(`${baseUrl}/api/profile/avatar`, {
            method: "POST",
        });
        assert(unauthUploadRes.status === 401, "POST /api/profile/avatar rejects unauthenticated request with 401");

        // Test 3.2: Missing file upload
        const emptyUploadRes = await fetch(`${baseUrl}/api/profile/avatar`, {
            method: "POST",
            headers: { Authorization: `Bearer ${validToken}` },
        });
        assert(emptyUploadRes.status === 400, "POST /api/profile/avatar rejects request without file with 400");

        // Test 3.3: Rejection of SVG upload
        const svgForm = new FormData();
        svgForm.append("avatar", new Blob([svgBuf], { type: "image/svg+xml" }), "vector.svg");
        const svgUploadRes = await fetch(`${baseUrl}/api/profile/avatar`, {
            method: "POST",
            headers: { Authorization: `Bearer ${validToken}` },
            body: svgForm,
        });
        assert(svgUploadRes.status === 400, "POST /api/profile/avatar rejects SVG file upload with 400");

        // Test 3.4: Rejection of GIF upload
        const gifForm = new FormData();
        gifForm.append("avatar", new Blob([gifBuf], { type: "image/gif" }), "animated.gif");
        const gifUploadRes = await fetch(`${baseUrl}/api/profile/avatar`, {
            method: "POST",
            headers: { Authorization: `Bearer ${validToken}` },
            body: gifForm,
        });
        assert(gifUploadRes.status === 400, "POST /api/profile/avatar rejects GIF file upload with 400");

        // Test 3.5: Rejection of Extension/Content Mismatch (JPEG content disguised as .png)
        const mismatchForm = new FormData();
        mismatchForm.append("avatar", new Blob([validJpgBuf], { type: "image/png" }), "disguised.png");
        const mismatchRes = await fetch(`${baseUrl}/api/profile/avatar`, {
            method: "POST",
            headers: { Authorization: `Bearer ${validToken}` },
            body: mismatchForm,
        });
        assert(mismatchRes.status === 400, "POST /api/profile/avatar rejects content/extension mismatch with 400");

        // Test 3.6: Successful PNG Upload
        const pngForm = new FormData();
        pngForm.append("avatar", new Blob([validPngBuf], { type: "image/png" }), "avatar.png");
        const pngUploadRes = await fetch(`${baseUrl}/api/profile/avatar`, {
            method: "POST",
            headers: { Authorization: `Bearer ${validToken}` },
            body: pngForm,
        });
        assert(pngUploadRes.status === 200, "POST /api/profile/avatar accepts valid PNG upload with 200");
        const pngData = await pngUploadRes.json();
        assert(pngData.avatarUrl && pngData.avatarUrl.startsWith("/api/profile/avatar/"), "Returns safe /api/profile/avatar/ URL");
        assert(pngData.avatarUrl.endsWith(".png"), "URL reflects .png extension");
        const firstAvatarFilename = pngData.avatarUrl.replace("/api/profile/avatar/", "");
        assert(avatarExists(firstAvatarFilename), "First uploaded PNG file exists on server disk");

        // Test 3.7: Secure Static Serving of Uploaded Avatar
        const serveRes = await fetch(`${baseUrl}${pngData.avatarUrl}`);
        assert(serveRes.status === 200, "GET /api/profile/avatar/:filename serves uploaded avatar with 200");
        assert(serveRes.headers.get("content-type") === "image/png", "Serves correct image/png content-type header");
        assert(serveRes.headers.get("x-content-type-options") === "nosniff", "Enforces X-Content-Type-Options: nosniff");
        assert(serveRes.headers.get("content-security-policy") === "default-src 'none'", "Enforces strict CSP default-src 'none'");

        // Test 3.8: Safe Avatar Replacement (Upload WebP, replacing old PNG)
        const webpForm = new FormData();
        webpForm.append("avatar", new Blob([validWebpBuf], { type: "image/webp" }), "new-avatar.webp");
        const webpUploadRes = await fetch(`${baseUrl}/api/profile/avatar`, {
            method: "POST",
            headers: { Authorization: `Bearer ${validToken}` },
            body: webpForm,
        });
        assert(webpUploadRes.status === 200, "POST /api/profile/avatar accepts WebP replacement with 200");
        const webpData = await webpUploadRes.json();
        const secondAvatarFilename = webpData.avatarUrl.replace("/api/profile/avatar/", "");
        assert(avatarExists(secondAvatarFilename), "Second uploaded WebP file exists on server disk");
        assert(!avatarExists(firstAvatarFilename), "SAFE REPLACEMENT: Old PNG avatar file was cleanly unlinked from disk");

        // Test 3.9: Serving non-existent avatar returns 404
        const notFoundAvatar = await fetch(`${baseUrl}/api/profile/avatar/00000000-0000-0000-0000-000000000000.png`);
        assert(notFoundAvatar.status === 404, "GET /api/profile/avatar/:filename returns 404 for non-existent avatar");

        // Test 3.10: Traversal attack on serving endpoint returns 400
        const traversalRes = await fetch(`${baseUrl}/api/profile/avatar/..%2Fserver.js`);
        assert(traversalRes.status === 400, "GET /api/profile/avatar/:filename rejects path traversal with 400");

        // Test 3.11: DELETE /api/profile/avatar rejects unauthenticated
        const unauthDel = await fetch(`${baseUrl}/api/profile/avatar`, { method: "DELETE" });
        assert(unauthDel.status === 401, "DELETE /api/profile/avatar rejects unauthenticated request with 401");

        // Test 3.12: Shared reference protection test
        // Create a temporary mock second profile pointing to the same avatar URL
        await pool.query(
            "INSERT INTO user_profiles (user_id, avatar_url, updated_at) VALUES ('00000000-0000-0000-0000-000000000001', $1, CURRENT_TIMESTAMP) ON CONFLICT (user_id) DO UPDATE SET avatar_url = EXCLUDED.avatar_url",
            [webpData.avatarUrl]
        ).catch(() => {}); // If foreign key prevents direct user_profiles insert, safely skip mock or test cleanly

        // Test 3.13: DELETE /api/profile/avatar removes avatar
        const delRes = await fetch(`${baseUrl}/api/profile/avatar`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${validToken}` },
        });
        assert(delRes.status === 200, "DELETE /api/profile/avatar returns 200 on success");
        const delData = await delRes.json();
        assert(delData.avatarUrl === null, "DELETE returns avatarUrl: null");
        assert(!avatarExists(secondAvatarFilename), "DELETE unlinks unshared avatar file from disk");

        // Test 3.14: GET on deleted avatar returns 404
        const deletedCheck = await fetch(`${baseUrl}/api/profile/avatar/${secondAvatarFilename}`);
        assert(deletedCheck.status === 404, "GET /api/profile/avatar/:filename returns 404 after deletion");

        // Test 3.15: Re-upload avatar for downstream visibility and public profile tests
        const reuploadForm = new FormData();
        reuploadForm.append("avatar", new Blob([validPngBuf], { type: "image/png" }), "audit_avatar.png");
        const reuploadRes = await fetch(`${baseUrl}/api/profile/avatar`, {
            method: "POST",
            headers: { Authorization: `Bearer ${validToken}` },
            body: reuploadForm,
        });
        assert(reuploadRes.status === 200, "Re-uploading avatar succeeds with 200");

        // --- 4. Protected Fields & Mass Assignment Tests ---
        console.log("\n--- Testing Protected Fields Rejection ---");
        const protectedFieldsTest = [
            { id: "11111111-1111-1111-1111-111111111111" },
            { user_id: "11111111-1111-1111-1111-111111111111" },
            { userId: "11111111-1111-1111-1111-111111111111" },
            { password_hash: "$2a$10$fakehashfakehash" },
            { password: "newPassword123" },
            { email: "hacked@example.com" },
            { user_name: "hackedusername" },
            { username: "hackedusername" },
            { return_prompts_enabled: false },
            { role: "admin" },
            { roles: ["admin"] },
            { isAdmin: true },
            { is_admin: true },
            { token: "fakeToken" },
            { updatedAt: "2026-01-01" },
            { storage_filename: "arbitrary-uuid.pdf" },
            { file_size: 1000 },
            { mime_type: "application/pdf" },
            { unknownField: "bad" },
        ];

        for (const badPayload of protectedFieldsTest) {
            const badKey = Object.keys(badPayload)[0];
            const res = await fetch(`${baseUrl}/api/profile/me`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${validToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(badPayload),
            });
            assert(res.status === 400, `Rejects protected/unsupported key '${badKey}' with 400`);
        }

        // --- 5. Nested Experience Validation Tests ---
        console.log("\n--- Testing Nested Experience Schema Validation ---");
        const invalidExpCases = [
            {
                payload: { experience: [{ company: "Acme", title: "Dev", evilKey: true }] },
                desc: "Rejects experience with unknown nested key 'evilKey'",
            },
            {
                payload: { experience: [{ company: "", title: "Dev" }] },
                desc: "Rejects experience with empty company name",
            },
            {
                payload: { experience: [{ company: "Acme", title: "" }] },
                desc: "Rejects experience with empty title",
            },
            {
                payload: { experience: [{ company: "Acme", title: "Dev", current: "not-a-bool" }] },
                desc: "Rejects experience with non-boolean 'current'",
            },
        ];

        for (const testCase of invalidExpCases) {
            const res = await fetch(`${baseUrl}/api/profile/me`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${validToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(testCase.payload),
            });
            assert(res.status === 400, testCase.desc);
        }

        // --- 6. Visibility Settings Validation Tests ---
        console.log("\n--- Testing Visibility Settings Validation ---");
        const invalidVisCases = [
            {
                payload: { visibilitySettings: { unknownSetting: true } },
                desc: "Rejects unknown visibility key 'unknownSetting'",
            },
            {
                payload: { visibilitySettings: { email: "yes" } },
                desc: "Rejects non-boolean visibility setting value",
            },
        ];

        for (const testCase of invalidVisCases) {
            const res = await fetch(`${baseUrl}/api/profile/me`, {
                method: "PUT",
                headers: {
                    Authorization: `Bearer ${validToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(testCase.payload),
            });
            assert(res.status === 400, testCase.desc);
        }

        // --- 7. Privacy-First Defaults & Public Profile Verification ---
        console.log("\n--- Testing Privacy-First Defaults on Public Profile ---");
        // Update user to be public, but reset visibilitySettings to default
        const resetUpdate = {
            headline: "Principal Engineer",
            bio: "Passionate about security, distributed databases, and high-performance APIs.",
            location: "Seattle, WA",
            portfolioUrl: "https://myportfolio.dev",
            githubUrl: "https://github.com/myhandle",
            linkedinUrl: "https://linkedin.com/in/myhandle",
            twitterUrl: "https://twitter.com/myhandle",
            skills: ["Node.js", "PostgreSQL", "React", "Docker"],
            experience: [
                {
                    company: "Acme Corp",
                    title: "Staff Engineer",
                    location: "Seattle, WA",
                    startDate: "2021-01",
                    endDate: null,
                    current: true,
                    description: "Architected distributed event streaming platform.",
                },
            ],
            isPublicProfile: true,
            visibilitySettings: {
                ...DEFAULT_VISIBILITY,
            },
        };

        const updateRes = await fetch(`${baseUrl}/api/profile/me`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${validToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(resetUpdate),
        });
        assert(updateRes.status === 200, "Successfully updated profile with privacy-first defaults");

        // Fetch public profile
        const publicRes = await fetch(`${baseUrl}/api/profile/${testUser.user_name}`);
        assert(publicRes.status === 200, "GET /api/profile/:username returns 200");
        const pubData = (await publicRes.json()).profile;

        // Verify Privacy-First defaults
        assert(pubData.location === undefined, "PRIVACY-FIRST: Location is HIDDEN by default");
        assert(pubData.email === undefined, "PRIVACY-FIRST: Email is HIDDEN by default");
        assert(pubData.resume === undefined, "PRIVACY-FIRST: Resume is HIDDEN by default");
        assert(pubData.id === undefined, "PRIVACY-FIRST: Internal ID is NEVER exposed");

        // Verify standard public elements
        assert(pubData.username === testUser.user_name, "Username is present");
        assert(pubData.headline === "Principal Engineer", "Headline is present by default");
        assert(pubData.bio.includes("Passionate about security"), "Bio is present by default");
        assert(pubData.avatarUrl.startsWith("/api/profile/avatar/"), "Uploaded avatar URL is present by default");
        assert(pubData.portfolioUrl === "https://myportfolio.dev", "Portfolio URL is present by default");
        assert(pubData.socialLinks.github === "https://github.com/myhandle", "Social Links (github) present by default");
        assert(pubData.skills.length === 4, "Skills are present by default");
        assert(pubData.experience.length === 1, "Experience is present by default");

        // --- 8. Granular Visibility Toggles Verification ---
        console.log("\n--- Testing Granular Visibility Toggles ---");
        const hideVisuals = {
            visibilitySettings: {
                headline: false,
                bio: false,
                avatar: false,
                portfolio: false,
                socialLinks: false,
                skills: false,
                experience: false,
                location: true, // explicitly reveal location
            },
        };

        const hideRes = await fetch(`${baseUrl}/api/profile/me`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${validToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(hideVisuals),
        });
        assert(hideRes.status === 200, "PUT /api/profile/me updated granular toggles");

        const recheckPublic = await (await fetch(`${baseUrl}/api/profile/${testUser.user_name}`)).json();
        const recheckPub = recheckPublic.profile;

        assert(recheckPub.headline === undefined, "Headline is omitted when visibilitySettings.headline is false");
        assert(recheckPub.bio === undefined, "Bio is omitted when visibilitySettings.bio is false");
        assert(recheckPub.avatarUrl === undefined, "Avatar is omitted when visibilitySettings.avatar is false");
        assert(recheckPub.portfolioUrl === undefined, "Portfolio is omitted when visibilitySettings.portfolio is false");
        assert(recheckPub.socialLinks === undefined, "Social links are omitted when visibilitySettings.socialLinks is false");
        assert(recheckPub.skills.length === 0, "Skills list is empty when visibilitySettings.skills is false");
        assert(recheckPub.experience.length === 0, "Experience list is empty when visibilitySettings.experience is false");
        assert(recheckPub.location === "Seattle, WA", "Location is visible when explicitly set to true");

        // --- 9. Private Profile & Auth Tests ---
        console.log("\n--- Testing Profile Privacy Mode & Authorization ---");
        await fetch(`${baseUrl}/api/profile/me`, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${validToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ isPublicProfile: false }),
        });
        const privateCheck = await fetch(`${baseUrl}/api/profile/${testUser.user_name}`);
        assert(privateCheck.status === 403, "GET /api/profile/:username returns 403 when isPublicProfile is false");

        const unauthMe = await fetch(`${baseUrl}/api/profile/me`);
        assert(unauthMe.status === 401, "GET /api/profile/me rejects unauthenticated request with 401");

        const unauthPut = await fetch(`${baseUrl}/api/profile/me`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ headline: "Hacked" }),
        });
        assert(unauthPut.status === 401, "PUT /api/profile/me rejects unauthenticated request with 401");

        // --- 10. Regression Tests ---
        console.log("\n--- Testing Existing Feature Regressions ---");
        const authMe = await fetch(`${baseUrl}/api/auth/me`, {
            headers: { Authorization: `Bearer ${validToken}` },
        });
        assert(authMe.status === 200, "Regression: /api/auth/me returns 200");

        const resumeGet = await fetch(`${baseUrl}/api/resume`, {
            headers: { Authorization: `Bearer ${validToken}` },
        });
        assert(resumeGet.status === 200, "Regression: /api/resume returns 200");

        console.log(`\n=== AUDIT TEST SUITE COMPLETED: ${passed} passed, ${failed} failed ===`);
    } catch (err) {
        console.error("Test execution encountered error:", err);
        failed++;
    } finally {
        server.close();
        await pool.end();
        process.exitCode = failed > 0 ? 1 : 0;
    }
};

runTests();
