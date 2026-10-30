const jwt = require("jsonwebtoken");
const { hashPassword, comparePassword } = require("../utils/hash");
const { validatePassword } = require("../utils/passwordPolicy");
const {
    findUserbyEmail,
    findUserbyUsername,
    findUserById,
    getUserAuthDetailsById,
    createUser,
    updateUserPasswordAndInvalidateSessions,
} = require("../models/files/user.model");

/**
 * User Registration
 * Checks both email and username uniqueness, enforces password policy,
 * and signs JWT containing the initial tokenVersion.
 */
const signup = async (req, res) => {
    try {
        const { firstname, midname, lastname, email, username, password } = req.body;

        if (!firstname || !lastname || !email || !username || !password) {
            return res.status(400).json({ message: "Required fields are missing" });
        }

        // 1. Server-side password strength policy check
        const passwordError = validatePassword(password);
        if (passwordError) {
            return res.status(400).json({ message: passwordError });
        }

        // 2. Email uniqueness check
        const existingEmail = await findUserbyEmail(email.trim().toLowerCase());
        if (existingEmail) {
            return res.status(409).json({ message: "Email already in use" });
        }

        // 3. Username uniqueness check
        const existingUsername = await findUserbyUsername(username.trim().toLowerCase());
        if (existingUsername) {
            return res.status(409).json({ message: "Username already in use" });
        }

        // 4. Hash password and persist user
        const passwordHash = await hashPassword(password);
        const newUser = await createUser({
            firstName: firstname.trim(),
            middleName: midname ? midname.trim() : null,
            lastName: lastname.trim(),
            email: email.trim().toLowerCase(),
            userName: username.trim().toLowerCase(),
            passwordHash,
        });

        // 5. Issue initial JWT containing tokenVersion (1)
        const token = jwt.sign(
            {
                userId: newUser.id,
                email: newUser.email,
                tokenVersion: newUser.token_version || 1,
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(201).json({
            message: "User registered successfully",
            token,
            user: {
                id: newUser.id,
                firstName: newUser.first_name,
                middleName: newUser.middle_name,
                lastName: newUser.last_name,
                email: newUser.email,
                username: newUser.user_name,
                createdAt: newUser.created_at,
                passwordChangedAt: newUser.password_changed_at || null,
            },
        });
    } catch (error) {
        // Handle concurrent registration race conditions via PostgreSQL unique violations (23505)
        if (error.code === "23505") {
            const detail = String(error.detail || "");
            const constraint = String(error.constraint || "");
            if (detail.includes("email") || constraint.includes("email")) {
                return res.status(409).json({ message: "Email already in use" });
            }
            if (detail.includes("user_name") || constraint.includes("user_name")) {
                return res.status(409).json({ message: "Username already in use" });
            }
            return res.status(409).json({ message: "An account with these credentials already exists" });
        }
        console.error("Signup error:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

/**
 * User Login
 * Authenticates via email or username and issues JWT containing current tokenVersion.
 */
const login = async (req, res) => {
    try {
        const { identifier, password } = req.body;

        if (!identifier || !password) {
            return res.status(400).json({ message: "Email/Username and password are required" });
        }

        const isEmail = identifier.includes("@");
        const cleanIdentifier = identifier.trim().toLowerCase();

        const user = isEmail
            ? await findUserbyEmail(cleanIdentifier)
            : await findUserbyUsername(cleanIdentifier);

        if (!user) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const passwordMatch = await comparePassword(password, user.password_hash);
        if (!passwordMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = jwt.sign(
            {
                userId: user.id,
                email: user.email,
                tokenVersion: user.token_version || 1,
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                firstName: user.first_name,
                lastName: user.last_name,
                email: user.email,
                username: user.user_name,
                passwordChangedAt: user.password_changed_at || null,
            },
        });
    } catch (error) {
        console.error("Login error:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

/**
 * Get Authenticated User Identity
 */
const getMe = async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await findUserById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({
            user: {
                id: user.id,
                firstName: user.first_name,
                middleName: user.middle_name,
                lastName: user.last_name,
                email: user.email,
                username: user.user_name,
                createdAt: user.created_at,
                passwordChangedAt: user.password_changed_at || null,
            },
        });
    } catch (error) {
        console.error("Error fetching current user profile:", error.message);
        res.status(500).json({ message: "Server error" });
    }
};

/**
 * PUT /api/auth/change-password
 *
 * Secure password change workflow:
 * 1. Validates current password via bcrypt.
 * 2. Enforces password strength policy and rejection of identical new password.
 * 3. Atomically updates password hash, increments token_version, and updates password_changed_at.
 * 4. Issues fresh JWT with incremented tokenVersion, immediately revoking all other active sessions.
 */
const changePassword = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { currentPassword, newPassword, confirmPassword } = req.body;

        // 1. Validate required fields
        if (!currentPassword || typeof currentPassword !== "string") {
            return res.status(400).json({ message: "Current password is required" });
        }
        if (!newPassword || typeof newPassword !== "string") {
            return res.status(400).json({ message: "New password is required" });
        }
        if (!confirmPassword || typeof confirmPassword !== "string") {
            return res.status(400).json({ message: "Please confirm your new password" });
        }

        // 2. Validate new password against security policy
        const policyError = validatePassword(newPassword);
        if (policyError) {
            return res.status(400).json({ message: policyError });
        }

        // 3. Confirm password matching
        if (newPassword !== confirmPassword) {
            return res.status(400).json({ message: "New password and confirmation do not match" });
        }

        // 4. Reject new password identical to current password
        if (currentPassword === newPassword) {
            return res.status(400).json({ message: "New password cannot be identical to the current password" });
        }

        // 5. Retrieve current auth state
        const user = await getUserAuthDetailsById(userId);
        if (!user) {
            return res.status(404).json({ message: "User account not found" });
        }

        // 6. Verify current password
        const isCurrentMatch = await comparePassword(currentPassword, user.password_hash);
        if (!isCurrentMatch) {
            return res.status(401).json({ message: "Incorrect current password" });
        }

        // 7. Hash new password
        const newPasswordHash = await hashPassword(newPassword);

        // 8. Atomically update hash, increment token_version, and set password_changed_at
        const updatedUser = await updateUserPasswordAndInvalidateSessions(
            userId,
            newPasswordHash,
            user.token_version
        );

        if (!updatedUser) {
            return res.status(409).json({ message: "Password update conflict. Please try again." });
        }

        // 9. Issue fresh JWT with incremented tokenVersion for the active session
        const freshToken = jwt.sign(
            {
                userId: updatedUser.id,
                email: updatedUser.email,
                tokenVersion: updatedUser.token_version,
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(200).json({
            message: "Password changed successfully",
            token: freshToken,
            passwordChangedAt: updatedUser.password_changed_at,
        });
    } catch (error) {
        console.error("Change password error:", error.message);
        res.status(500).json({ message: "Server error changing password" });
    }
};

module.exports = {
    signup,
    login,
    getMe,
    changePassword,
};
