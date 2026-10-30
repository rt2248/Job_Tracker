const express = require("express");
const multer = require("multer");
const router = express.Router();
const verifyToken = require("../middleware/auth.middleware");
const {
    getMyProfile,
    updateMyProfile,
    uploadAvatar,
    deleteMyAvatar,
    serveAvatar,
    getPublicProfile,
} = require("../controller/profile.controller");

// Configure multer for memory storage with 2MB limit for avatar images
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 2 * 1024 * 1024, // 2 MB
    },
});

// Multer error handling wrapper for avatar uploads
const uploadAvatarMiddleware = (req, res, next) => {
    upload.single("avatar")(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === "LIMIT_FILE_SIZE") {
                return res.status(400).json({ message: "Avatar file exceeds 2MB limit" });
            }
            return res.status(400).json({ message: `Upload error: ${err.message}` });
        } else if (err) {
            return res.status(400).json({ message: err.message || "Failed to process avatar upload" });
        }
        next();
    });
};

// Private profile routes (requires JWT bearer token)
router.get("/me", verifyToken, getMyProfile);
router.put("/me", verifyToken, updateMyProfile);
router.post("/avatar", verifyToken, uploadAvatarMiddleware, uploadAvatar);
router.delete("/avatar", verifyToken, deleteMyAvatar);

// Public avatar safe serving endpoint (placed before /:username to avoid route collision)
router.get("/avatar/:filename", serveAvatar);

// Public profile route (privacy-enforced public view)
router.get("/:username", getPublicProfile);

module.exports = router;
