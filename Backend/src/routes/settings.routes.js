const express = require("express");
const router = express.Router();

const { getSettings, updateSettings } = require("../controller/settings.controller");
const verifyToken = require("../middleware/auth.middleware");

router.get("/", verifyToken, getSettings);
router.patch("/", verifyToken, updateSettings);

module.exports = router;