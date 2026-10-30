const express = require("express");
const router = express.Router();

const { signup, login, getMe, changePassword } = require("../controller/auth.controller");
const verifyToken = require("../middleware/auth.middleware");
const { signupLimiter, loginLimiter, changePasswordLimiter } = require("../middleware/rateLimiter");

// Public authentication routes (rate limited by IP)
router.post("/signup", signupLimiter, signup);
router.post("/login", loginLimiter, login);

// Authenticated user identity route
router.get("/me", verifyToken, getMe);

// Authenticated password change route (rate limited by authenticated user/IP: 5 per 15 min)
router.put("/change-password", verifyToken, changePasswordLimiter, changePassword);

module.exports = router;
