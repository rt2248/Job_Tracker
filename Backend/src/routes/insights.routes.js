const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/auth.middleware");
const {
    getSummary,
    getPipeline,
    getSkillFit,
} = require("../controller/insights.controller");

router.get("/summary", verifyToken, getSummary);
router.get("/pipeline", verifyToken, getPipeline);
router.get("/skill-fit", verifyToken, getSkillFit);

module.exports = router;
