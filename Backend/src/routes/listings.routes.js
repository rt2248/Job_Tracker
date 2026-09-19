const express = require("express");
const router = express.Router();

const { getJobListings, getLocations, getTags } = require("../controller/listings.controller");
const verifyToken = require("../middleware/auth.middleware");

router.get("/locations", verifyToken, getLocations);
router.get("/tags", verifyToken, getTags);
router.get("/", verifyToken, getJobListings);

module.exports = router;