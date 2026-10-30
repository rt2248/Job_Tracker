const jwt = require("jsonwebtoken");
const pool = require("../configs/db");

/**
 * Authentication Middleware with Server-Side Session Invalidation
 *
 * Verifies the JWT signature and enforces token version validation against
 * the database to ensure immediate cross-device revocation upon password changes.
 */
const verifyToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded || !decoded.userId) {
            return res.status(401).json({ message: "Invalid token payload" });
        }

        // Query user's current persisted token version
        const userRes = await pool.query(
            "SELECT id, token_version FROM users WHERE id = $1",
            [decoded.userId]
        );

        if (userRes.rows.length === 0) {
            return res.status(401).json({ message: "User account no longer exists" });
        }

        const user = userRes.rows[0];

        // Session Invalidation Strategy:
        // 1. If token includes tokenVersion, it must strictly match user.token_version.
        // 2. If token lacks tokenVersion (legacy pre-migration session), it remains valid
        //    only while user.token_version === 1. As soon as a password change commits
        //    (incrementing token_version to 2+), all legacy tokens are immediately revoked.
        if (decoded.tokenVersion !== undefined) {
            if (Number(decoded.tokenVersion) !== Number(user.token_version)) {
                return res.status(401).json({ message: "Session expired or revoked. Please sign in again." });
            }
        } else {
            if (Number(user.token_version) !== 1) {
                return res.status(401).json({ message: "Session expired or revoked. Please sign in again." });
            }
        }

        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

module.exports = verifyToken;
