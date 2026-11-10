/**
 * @file careerStrategist.routes.js
 * @description Route registration for Career Strategist Assessment API.
 *
 * Stage 2B.4C — Option C Provider Abstraction Foundation.
 *
 * Middleware Pipeline:
 * 1. verifyToken (Authentication & Session Invalidation)
 * 2. careerAssessmentLimiter (User-based Rate Limiting: 10 per 15 min)
 * 3. generateAssessment (Controller Execution)
 */

const express = require("express");
const router = express.Router();

const verifyToken = require("../middleware/auth.middleware");
const { careerAssessmentLimiter } = require("../middleware/rateLimiter");
const { generateAssessment } = require("../controller/careerStrategist.controller");

// Primary endpoint: POST /api/career-strategist/assessment
router.post("/assessment", verifyToken, careerAssessmentLimiter, generateAssessment);

// Alias root endpoint: POST /api/career-strategist
router.post("/", verifyToken, careerAssessmentLimiter, generateAssessment);

module.exports = router;
