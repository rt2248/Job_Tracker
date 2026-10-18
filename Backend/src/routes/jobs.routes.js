const express = require("express");
const router = express.Router();

const {
    getJobs,
    getTrackedListings,
    addJobFromListing,
    changeJobStatus,
} = require("../controller/jobs.controller");
const verifyToken = require("../middleware/auth.middleware");

router.get("/", verifyToken, getJobs);
router.get("/tracked-listings", verifyToken, getTrackedListings);
router.post("/from-listing", verifyToken, addJobFromListing);
router.patch("/:id/status", verifyToken, changeJobStatus);

module.exports = router;