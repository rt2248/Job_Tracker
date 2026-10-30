const path = require("path");
const pool = require("../configs/db");
const {
    DEFAULT_VISIBILITY,
    getProfileByUserId,
    getProfileByUsername,
    updateProfileByUserId,
} = require("../models/files/profile.model");
const {
    detectImageSignature,
    generateAvatarFilename,
    saveAvatar,
    avatarExists,
    getAvatarReadStream,
    deleteAvatar,
} = require("../utils/avatarStorage");

// Strict lists for security & validation
const PROTECTED_FIELDS = [
    "id",
    "user_id",
    "userId",
    "password_hash",
    "password",
    "email",
    "user_name",
    "username",
    "created_at",
    "createdAt",
    "updated_at",
    "updatedAt",
    "return_prompts_enabled",
    "storage_filename",
    "file_size",
    "mime_type",
    "role",
    "roles",
    "isAdmin",
    "is_admin",
    "token",
    "jwt",
];

const ALLOWED_UPDATE_FIELDS = new Set([
    "firstName",
    "middleName",
    "lastName",
    "headline",
    "bio",
    "location",
    "avatarUrl",
    "portfolioUrl",
    "githubUrl",
    "linkedinUrl",
    "twitterUrl",
    "socialLinks",
    "skills",
    "experience",
    "isPublicProfile",
    "visibilitySettings",
]);

const ALLOWED_VISIBILITY_KEYS = new Set([
    "email",
    "resume",
    "location",
    "headline",
    "bio",
    "avatar",
    "portfolio",
    "socialLinks",
    "skills",
    "experience",
]);

const ALLOWED_EXPERIENCE_FIELDS = new Set([
    "company",
    "title",
    "location",
    "startDate",
    "endDate",
    "current",
    "description",
]);

// Permitted avatar formats: PNG, JPEG/JPG, WebP only. SVG, GIF, and other formats are strictly rejected.
const ALLOWED_AVATAR_EXTENSIONS = new Set(["png", "jpg", "jpeg", "webp"]);
const INTERNAL_AVATAR_REGEX = /^(?:\/uploads\/avatars\/|\/avatars\/|\/api\/profile\/avatar\/)[a-zA-Z0-9_\-.]+\.(png|jpe?g|webp)$/i;
const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2 MB

const isValidHttpUrl = (str) => {
    if (!str || typeof str !== "string") return false;
    try {
        const parsed = new URL(str);
        return (parsed.protocol === "http:" || parsed.protocol === "https:") && Boolean(parsed.hostname);
    } catch {
        return false;
    }
};

const isValidAvatarUrl = (str) => {
    if (!str || typeof str !== "string") return false;

    const trimmed = str.trim();
    if (trimmed.length === 0 || trimmed.length > 500) return false;

    // 1. Strict SVG rejection (case-insensitive across internal paths and external URLs)
    if (/\.svg(?:[?#\s]|$)/i.test(trimmed)) {
        return false;
    }

    // 2. Reject GIF and other unapproved formats explicitly
    if (/\.(?:gif|bmp|tiff?|ico|heic|avif)(?:[?#\s]|$)/i.test(trimmed)) {
        return false;
    }

    // 3. Internal safe avatar path validation: only approved directory/prefix and extensions (png, jpg, jpeg, webp)
    if (
        trimmed.startsWith("/uploads/avatars/") ||
        trimmed.startsWith("/avatars/") ||
        trimmed.startsWith("/api/profile/avatar/")
    ) {
        if (!INTERNAL_AVATAR_REGEX.test(trimmed) || trimmed.includes("..") || trimmed.includes("%")) {
            return false;
        }
        return true;
    }

    // 4. External URL validation
    if (!isValidHttpUrl(trimmed)) {
        return false;
    }

    try {
        const parsed = new URL(trimmed);
        const pathname = parsed.pathname.toLowerCase();

        // Check file extension in pathname if present
        const lastDotIdx = pathname.lastIndexOf(".");
        if (lastDotIdx !== -1) {
            const ext = pathname.slice(lastDotIdx + 1);
            if (/^[a-z0-9]{1,5}$/.test(ext)) {
                if (!ALLOWED_AVATAR_EXTENSIONS.has(ext)) {
                    return false;
                }
            }
        }

        return true;
    } catch {
        return false;
    }
};

/**
 * Validate incoming update profile payload with deep structure checks
 */
const validateProfilePayload = (body) => {
    if (!body || typeof body !== "object" || Array.isArray(body)) {
        return "Request body must be a valid JSON object";
    }

    const keys = Object.keys(body);
    if (keys.length === 0) {
        return "At least one profile field must be provided for update";
    }

    // Check protected fields & unknown root keys
    for (const key of keys) {
        if (PROTECTED_FIELDS.includes(key)) {
            return `Field '${key}' is protected and cannot be modified via profile update`;
        }
        if (!ALLOWED_UPDATE_FIELDS.has(key)) {
            return `Unsupported or unauthorized field '${key}' in update payload`;
        }
    }

    // Validate string identity fields
    if (body.firstName !== undefined) {
        if (typeof body.firstName !== "string" || body.firstName.trim().length === 0 || body.firstName.length > 100) {
            return "First name must be a non-empty string up to 100 characters";
        }
    }

    if (body.lastName !== undefined) {
        if (typeof body.lastName !== "string" || body.lastName.trim().length === 0 || body.lastName.length > 100) {
            return "Last name must be a non-empty string up to 100 characters";
        }
    }

    if (body.middleName !== undefined && body.middleName !== null) {
        if (typeof body.middleName !== "string" || body.middleName.length > 100) {
            return "Middle name must be a string up to 100 characters";
        }
    }

    if (body.headline !== undefined && body.headline !== null && body.headline !== "") {
        if (typeof body.headline !== "string" || body.headline.length > 150) {
            return "Headline must be a string up to 150 characters";
        }
    }

    if (body.bio !== undefined && body.bio !== null && body.bio !== "") {
        if (typeof body.bio !== "string" || body.bio.length > 2000) {
            return "Bio must be a string up to 2000 characters";
        }
    }

    if (body.location !== undefined && body.location !== null && body.location !== "") {
        if (typeof body.location !== "string" || body.location.length > 150) {
            return "Location must be a string up to 150 characters";
        }
    }

    if (body.avatarUrl !== undefined && body.avatarUrl !== null && body.avatarUrl !== "") {
        if (typeof body.avatarUrl !== "string" || body.avatarUrl.length > 500 || !isValidAvatarUrl(body.avatarUrl)) {
            return "Avatar reference must be a valid http(s) URL or safe internal path with an approved format (PNG, JPEG, WebP). SVG, GIF, and other formats are not permitted.";
        }
    }

    // Validate individual social link fields if passed top-level
    const urlFields = ["portfolioUrl", "githubUrl", "linkedinUrl", "twitterUrl"];
    for (const f of urlFields) {
        if (body[f] !== undefined && body[f] !== null && body[f] !== "") {
            if (typeof body[f] !== "string" || body[f].length > 500 || !isValidHttpUrl(body[f])) {
                return `${f} must be a valid http or https URL up to 500 characters with a valid hostname`;
            }
        }
    }

    // Validate socialLinks object
    if (body.socialLinks !== undefined && body.socialLinks !== null) {
        if (typeof body.socialLinks !== "object" || Array.isArray(body.socialLinks)) {
            return "socialLinks must be an object with portfolio, github, linkedin, twitter URLs";
        }
        for (const [key, val] of Object.entries(body.socialLinks)) {
            if (!["portfolio", "github", "linkedin", "twitter"].includes(key)) {
                return `Unsupported social link '${key}'`;
            }
            if (val !== undefined && val !== null && val !== "") {
                if (typeof val !== "string" || val.length > 500 || !isValidHttpUrl(val)) {
                    return `Social link '${key}' must be a valid http or https URL up to 500 characters with a valid hostname`;
                }
            }
        }
    }

    // Validate skills array & items
    if (body.skills !== undefined) {
        if (!Array.isArray(body.skills)) {
            return "skills must be an array of strings";
        }
        if (body.skills.length > 100) {
            return "A maximum of 100 skills are supported";
        }
        for (const s of body.skills) {
            if (typeof s !== "string" || s.trim().length === 0 || s.length > 50) {
                return "Each skill must be a non-empty string up to 50 characters";
            }
        }
    }

    // Validate experience array & nested item schema
    if (body.experience !== undefined) {
        if (!Array.isArray(body.experience)) {
            return "experience must be an array of objects";
        }
        if (body.experience.length > 50) {
            return "A maximum of 50 experience items are supported";
        }
        for (let idx = 0; idx < body.experience.length; idx++) {
            const exp = body.experience[idx];
            if (!exp || typeof exp !== "object" || Array.isArray(exp)) {
                return `Experience item at index ${idx} must be a valid object`;
            }

            // Check for unsupported / malicious keys in nested experience
            for (const key of Object.keys(exp)) {
                if (!ALLOWED_EXPERIENCE_FIELDS.has(key)) {
                    return `Unsupported field '${key}' in experience item at index ${idx}`;
                }
            }

            if (!exp.company || typeof exp.company !== "string" || exp.company.trim().length === 0 || exp.company.length > 150) {
                return `Experience item at index ${idx} must have a non-empty company name up to 150 characters`;
            }

            if (!exp.title || typeof exp.title !== "string" || exp.title.trim().length === 0 || exp.title.length > 150) {
                return `Experience item at index ${idx} must have a non-empty title up to 150 characters`;
            }

            if (exp.location !== undefined && exp.location !== null) {
                if (typeof exp.location !== "string" || exp.location.length > 150) {
                    return `Experience location at index ${idx} must be a string up to 150 characters`;
                }
            }

            if (exp.startDate !== undefined && exp.startDate !== null && exp.startDate !== "") {
                if (typeof exp.startDate !== "string" || exp.startDate.length > 50) {
                    return `Experience startDate at index ${idx} must be a string up to 50 characters`;
                }
            }

            if (exp.endDate !== undefined && exp.endDate !== null && exp.endDate !== "") {
                if (typeof exp.endDate !== "string" || exp.endDate.length > 50) {
                    return `Experience endDate at index ${idx} must be a string up to 50 characters`;
                }
            }

            if (exp.current !== undefined && typeof exp.current !== "boolean") {
                return `Experience 'current' at index ${idx} must be a boolean`;
            }

            if (exp.description !== undefined && exp.description !== null && exp.description !== "") {
                if (typeof exp.description !== "string" || exp.description.length > 2000) {
                    return `Experience description at index ${idx} must be a string up to 2000 characters`;
                }
            }
        }
    }

    // Validate isPublicProfile
    if (body.isPublicProfile !== undefined && typeof body.isPublicProfile !== "boolean") {
        return "isPublicProfile must be a boolean";
    }

    // Validate visibilitySettings keys and boolean values
    if (body.visibilitySettings !== undefined && body.visibilitySettings !== null) {
        if (typeof body.visibilitySettings !== "object" || Array.isArray(body.visibilitySettings)) {
            return "visibilitySettings must be an object with boolean flags";
        }
        for (const [vk, vv] of Object.entries(body.visibilitySettings)) {
            if (!ALLOWED_VISIBILITY_KEYS.has(vk)) {
                return `Unsupported visibility setting '${vk}'`;
            }
            if (typeof vv !== "boolean") {
                return `Visibility setting '${vk}' must be a boolean`;
            }
        }
    }

    return null;
};

/**
 * GET /api/profile/me
 * Authenticated user fetches their complete profile
 */
const getMyProfile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const profile = await getProfileByUserId(userId);

        if (!profile) {
            return res.status(404).json({ message: "User profile not found" });
        }

        res.status(200).json({ profile });
    } catch (err) {
        console.error("Error retrieving user profile:", err);
        res.status(500).json({ message: "Server error while retrieving profile" });
    }
};

/**
 * PUT /api/profile/me
 * Authenticated user updates their permitted profile fields
 */
const updateMyProfile = async (req, res) => {
    try {
        const userId = req.user.userId;

        const validationError = validateProfilePayload(req.body);
        if (validationError) {
            return res.status(400).json({ message: validationError });
        }

        const updatedProfile = await updateProfileByUserId(userId, req.body);
        if (!updatedProfile) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({
            message: "Profile updated successfully",
            profile: updatedProfile,
        });
    } catch (err) {
        console.error("Error updating user profile:", err);
        res.status(500).json({ message: "Server error while updating profile" });
    }
};

/**
 * Checks whether an avatar URL is referenced by another user profile
 * @param {string} avatarUrl
 * @param {string} currentUserId
 * @returns {Promise<boolean>}
 */
const isAvatarReferencedElsewhere = async (avatarUrl, currentUserId) => {
    if (!avatarUrl) return false;
    try {
        const res = await pool.query(
            "SELECT COUNT(*) AS count FROM user_profiles WHERE avatar_url = $1 AND user_id != $2",
            [avatarUrl, currentUserId]
        );
        return parseInt(res.rows[0]?.count || "0", 10) > 0;
    } catch {
        return false;
    }
};

/**
 * POST /api/profile/avatar
 * Securely uploads or replaces the authenticated user's avatar image
 */
const uploadAvatar = async (req, res) => {
    let newStorageFilename = null;
    try {
        const userId = req.user.userId;

        if (!req.file || !req.file.buffer) {
            return res.status(400).json({ message: "No avatar image provided" });
        }

        // 1. File size check
        if (req.file.size === 0) {
            return res.status(400).json({ message: "Uploaded avatar file is empty" });
        }
        if (req.file.size > MAX_AVATAR_SIZE) {
            return res.status(400).json({ message: "Avatar file exceeds 2MB limit" });
        }

        // 2. Reject SVG or GIF explicitly from original filename
        const originalName = req.file.originalname || "";
        if (/\.svg(?:[?#\s]|$)/i.test(originalName) || /\.gif(?:[?#\s]|$)/i.test(originalName)) {
            return res.status(400).json({ message: "SVG and GIF formats are not permitted for avatars" });
        }

        // 3. Inspect binary signature / magic bytes
        const detected = detectImageSignature(req.file.buffer);
        if (!detected) {
            return res.status(400).json({
                message: "Invalid file content: only PNG, JPEG, and WebP images are permitted",
            });
        }

        // 4. Validate client extension matches detected binary format
        const clientExt = path.extname(originalName).toLowerCase().replace(/^\./, "");
        const validExtensionsForType = {
            png: ["png"],
            jpg: ["jpg", "jpeg"],
            webp: ["webp"],
        };

        if (clientExt && (!validExtensionsForType[detected.ext] || !validExtensionsForType[detected.ext].includes(clientExt))) {
            return res.status(400).json({
                message: `File extension '.${clientExt}' does not match detected image format '${detected.ext}'`,
            });
        }

        // 5. Look up existing profile to prepare for clean replacement
        const currentProfile = await getProfileByUserId(userId);

        // 6. Generate unpredictable UUID storage filename and save file
        newStorageFilename = generateAvatarFilename(detected.ext);
        await saveAvatar(newStorageFilename, req.file.buffer);

        // 7. Update database record with safe internal path
        const avatarUrl = `/api/profile/avatar/${newStorageFilename}`;
        const updatedProfile = await updateProfileByUserId(userId, { avatarUrl });

        if (!updatedProfile) {
            await deleteAvatar(newStorageFilename);
            return res.status(404).json({ message: "User not found" });
        }

        // 8. DB update succeeded: clean up old avatar file if it was locally stored and not shared
        if (currentProfile && currentProfile.avatarUrl) {
            const oldMatch = currentProfile.avatarUrl.match(/^\/api\/profile\/avatar\/([a-f0-9\-]+\.(?:png|jpe?g|webp))$/i);
            if (oldMatch && oldMatch[1] && oldMatch[1] !== newStorageFilename) {
                const isShared = await isAvatarReferencedElsewhere(currentProfile.avatarUrl, userId);
                if (!isShared) {
                    await deleteAvatar(oldMatch[1]);
                }
            }
        }

        res.status(200).json({
            message: "Avatar uploaded successfully",
            avatarUrl,
            profile: updatedProfile,
        });
    } catch (err) {
        console.error("Error uploading avatar:", err);
        if (newStorageFilename) {
            await deleteAvatar(newStorageFilename);
        }
        res.status(500).json({ message: "Server error uploading avatar" });
    }
};

/**
 * DELETE /api/profile/avatar
 * Securely deletes or removes the authenticated user's avatar image
 */
const deleteMyAvatar = async (req, res) => {
    try {
        const userId = req.user.userId;
        const currentProfile = await getProfileByUserId(userId);

        if (!currentProfile || !currentProfile.avatarUrl) {
            return res.status(200).json({
                message: "No avatar to remove",
                avatarUrl: null,
                profile: currentProfile,
            });
        }

        const oldAvatarUrl = currentProfile.avatarUrl;
        const oldMatch = oldAvatarUrl.match(/^\/api\/profile\/avatar\/([a-f0-9\-]+\.(?:png|jpe?g|webp))$/i);

        // Update database: set avatarUrl to null
        const updatedProfile = await updateProfileByUserId(userId, { avatarUrl: null });

        if (!updatedProfile) {
            return res.status(404).json({ message: "User not found" });
        }

        // Clean up old file if stored locally and not referenced by another profile
        if (oldMatch && oldMatch[1]) {
            const isShared = await isAvatarReferencedElsewhere(oldAvatarUrl, userId);
            if (!isShared) {
                await deleteAvatar(oldMatch[1]);
            }
        }

        res.status(200).json({
            message: "Avatar removed successfully",
            avatarUrl: null,
            profile: updatedProfile,
        });
    } catch (err) {
        console.error("Error removing avatar:", err);
        res.status(500).json({ message: "Server error removing avatar" });
    }
};

/**
 * GET /api/profile/avatar/:filename
 * Safely streams an avatar image with strict nosniff and CSP headers
 */
const serveAvatar = async (req, res) => {
    try {
        const { filename } = req.params;

        if (!filename || typeof filename !== "string") {
            return res.status(400).json({ message: "Invalid filename parameter" });
        }

        const safeFilename = path.basename(filename);

        // Strict filename validation: must be UUID-based with allowed image extension
        const filenameRegex = /^[a-f0-9\-]+\.(png|jpe?g|webp)$/i;
        if (!filenameRegex.test(safeFilename) || safeFilename.includes("..")) {
            return res.status(400).json({ message: "Invalid avatar filename" });
        }

        if (!avatarExists(safeFilename)) {
            return res.status(404).json({ message: "Avatar not found" });
        }

        const ext = path.extname(safeFilename).toLowerCase();
        const mimeTypes = {
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".webp": "image/webp",
        };
        const mimeType = mimeTypes[ext] || "application/octet-stream";

        // Security headers to prevent execution as HTML/SVG or MIME sniffing
        res.setHeader("Content-Type", mimeType);
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("Content-Security-Policy", "default-src 'none'");
        res.setHeader("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
        res.setHeader("Content-Disposition", "inline");

        const stream = getAvatarReadStream(safeFilename);
        stream.on("error", (streamErr) => {
            console.error("Stream error reading avatar:", streamErr);
            if (!res.headersSent) {
                res.status(500).json({ message: "Failed to read avatar file" });
            }
        });
        stream.pipe(res);
    } catch (err) {
        console.error("Error serving avatar:", err);
        res.status(500).json({ message: "Server error retrieving avatar" });
    }
};

/**
 * GET /api/profile/:username
 * Public developer profile endpoint with server-side visibility enforcement
 */
const getPublicProfile = async (req, res) => {
    try {
        const { username } = req.params;

        if (!username || typeof username !== "string" || username.trim().length === 0) {
            return res.status(400).json({ message: "A valid username must be specified" });
        }

        const profile = await getProfileByUsername(username.trim());
        if (!profile) {
            return res.status(404).json({ message: "Developer profile not found" });
        }

        if (!profile.isPublicProfile) {
            return res.status(403).json({ message: "This developer profile is private" });
        }

        // Apply server-side privacy filtering based on visibilitySettings
        const vis = {
            ...DEFAULT_VISIBILITY,
            ...(profile.visibilitySettings || {}),
        };

        const publicProfile = {
            username: profile.username,
            firstName: profile.firstName,
            lastName: profile.lastName,
            // Conditional Headline
            headline: vis.headline && profile.headline ? profile.headline : undefined,
            // Conditional Bio
            bio: vis.bio && profile.bio ? profile.bio : undefined,
            // Conditional Avatar
            avatarUrl: vis.avatar && profile.avatarUrl ? profile.avatarUrl : undefined,
            // Conditional Location
            location: vis.location && profile.location ? profile.location : undefined,
            // Conditional Email
            email: vis.email && profile.email ? profile.email : undefined,
            // Conditional Portfolio URL
            portfolioUrl: vis.portfolio && profile.socialLinks?.portfolio ? profile.socialLinks.portfolio : undefined,
            // Conditional Social Links (github, linkedin, twitter)
            socialLinks: vis.socialLinks && profile.socialLinks
                ? {
                    github: profile.socialLinks.github || undefined,
                    linkedin: profile.socialLinks.linkedin || undefined,
                    twitter: profile.socialLinks.twitter || undefined,
                }
                : undefined,
            // Conditional Skills
            skills: vis.skills && Array.isArray(profile.skills) ? profile.skills : [],
            // Conditional Experience
            experience: vis.experience && Array.isArray(profile.experience) ? profile.experience : [],
            // Conditional Resume Metadata
            resume: vis.resume && profile.resume
                ? {
                    filename: profile.resume.filename,
                    fileSize: profile.resume.fileSize,
                    uploadedAt: profile.resume.uploadedAt,
                }
                : undefined,
        };

        // If socialLinks was created, clean out undefined inner properties or drop if empty
        if (publicProfile.socialLinks) {
            Object.keys(publicProfile.socialLinks).forEach((k) => {
                if (publicProfile.socialLinks[k] === undefined) {
                    delete publicProfile.socialLinks[k];
                }
            });
            if (Object.keys(publicProfile.socialLinks).length === 0) {
                delete publicProfile.socialLinks;
            }
        }

        // Clean out top-level undefined keys so JSON doesn't leak them
        Object.keys(publicProfile).forEach((k) => {
            if (publicProfile[k] === undefined) {
                delete publicProfile[k];
            }
        });

        res.status(200).json({ profile: publicProfile });
    } catch (err) {
        console.error("Error retrieving public profile:", err);
        res.status(500).json({ message: "Server error while retrieving public profile" });
    }
};

module.exports = {
    getMyProfile,
    updateMyProfile,
    uploadAvatar,
    deleteMyAvatar,
    serveAvatar,
    getPublicProfile,
    validateProfilePayload,
    isValidAvatarUrl,
    isValidHttpUrl,
    PROTECTED_FIELDS,
    ALLOWED_UPDATE_FIELDS,
    ALLOWED_VISIBILITY_KEYS,
    ALLOWED_EXPERIENCE_FIELDS,
    ALLOWED_AVATAR_EXTENSIONS,
};
