const rateLimit = require("express-rate-limit");

/**
 * Rate Limiting Middleware Suite
 *
 * Deployment Topology Note:
 * Uses default in-memory MemoryStore suitable for single-instance deployments.
 * IP resolution relies on direct client IP (req.ip). Express app 'trust proxy'
 * should only be set in production when sitting behind a verified reverse proxy.
 */

// 1. Login Limiter: Max 10 attempts per 15 minutes per IP
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { message: "Too many login attempts. Please try again after 15 minutes." },
});

// 2. Signup Limiter: Max 10 account registrations per hour per IP
const signupLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { message: "Too many accounts created from this IP. Please try again later." },
});

// 3. Password Change Limiter: Max 5 attempts per 15 minutes
// Keying strategy: Keyed by authenticated user ID (req.user.userId) with fallback to IP.
// This prevents attackers from rotating IP addresses to brute force an account's current password,
// and ensures an attacker cannot lock out other users sharing a corporate NAT/proxy IP.
const changePasswordLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    keyGenerator: (req) => {
        // Authenticated user ID takes precedence over IP
        return req.user?.userId ? `user_${req.user.userId}` : req.ip;
    },
    validate: { keyGeneratorIpFallback: false },
    message: { message: "Too many password change attempts. Please try again after 15 minutes." },
});

module.exports = {
    loginLimiter,
    signupLimiter,
    changePasswordLimiter,
};
