const {
    getInsightsSummary,
    getPipelineSnapshot,
    getSkillFitAnalytics,
} = require("../models/files/insights.model");

/**
 * Controller: GET /api/insights/summary
 * Provides consolidated KPI metrics, stale applications, and submission activity over time
 */
const getSummary = async (req, res) => {
    try {
        const userId = req.user.userId;
        const range = req.query.range || "30d";
        
        let staleDays = 14;
        if (req.query.staleDays !== undefined && req.query.staleDays !== "") {
            const rawStaleDays = String(req.query.staleDays).trim();
            if (!/^-?\d+$/.test(rawStaleDays)) {
                return res.status(400).json({
                    message: "Invalid staleDays parameter. Must be an integer between 1 and 90.",
                });
            }
            const parsed = parseInt(rawStaleDays, 10);
            if (parsed <= 0) {
                return res.status(400).json({
                    message: "Invalid staleDays parameter. Must be greater than zero.",
                });
            }
            if (parsed > 90) {
                return res.status(400).json({
                    message: "Invalid staleDays parameter. Maximum allowable threshold is 90 days.",
                });
            }
            staleDays = parsed;
        }

        const validRanges = ["30d", "90d", "all"];
        const validatedRange = validRanges.includes(range) ? range : "30d";

        const summary = await getInsightsSummary(userId, { range: validatedRange, staleDays });
        return res.json(summary);
    } catch (error) {
        console.error("Error in getSummary insights controller:", error);
        return res.status(500).json({ message: "Failed to retrieve insights summary" });
    }
};

/**
 * Controller: GET /api/insights/pipeline
 * Provides point-in-time snapshot distribution across Active and Closed stages
 */
const getPipeline = async (req, res) => {
    try {
        const userId = req.user.userId;
        const pipeline = await getPipelineSnapshot(userId);
        return res.json(pipeline);
    } catch (error) {
        console.error("Error in getPipeline insights controller:", error);
        return res.status(500).json({ message: "Failed to retrieve pipeline snapshot" });
    }
};

/**
 * Controller: GET /api/insights/skill-fit
 * Evaluates profile skills against listing-linked requirements using rule-based classification
 */
const getSkillFit = async (req, res) => {
    try {
        const userId = req.user.userId;
        const skillFit = await getSkillFitAnalytics(userId);
        return res.json(skillFit);
    } catch (error) {
        console.error("Error in getSkillFit insights controller:", error);
        return res.status(500).json({ message: "Failed to retrieve skill fit analytics" });
    }
};

module.exports = {
    getSummary,
    getPipeline,
    getSkillFit,
};
