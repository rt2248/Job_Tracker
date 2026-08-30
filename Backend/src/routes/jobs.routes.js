const express = require("express");
const router = express.Router();

const { getJobs } = require("../controller/jobs.controller");
const verifyToken = require("../middleware/auth.middleware");

router.get("/", verifyToken, getJobs);

module.exports = router;