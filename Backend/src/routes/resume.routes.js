const express = require("express");
const multer = require("multer");
const router = express.Router();

const {
    getResume,
    uploadResume,
    viewResumeFile,
    deleteResume,
} = require("../controller/resume.controller");
const verifyToken = require("../middleware/auth.middleware");

// Configure multer to use in-memory storage with 5MB limit
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5 MB
    },
});

// Multer error handling wrapper
const uploadMiddleware = (req, res, next) => {
    upload.single("resume")(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === "LIMIT_FILE_SIZE") {
                return res.status(400).json({ message: "File exceeds 5MB limit" });
            }
            return res.status(400).json({ message: `Upload error: ${err.message}` });
        } else if (err) {
            return res.status(400).json({ message: err.message || "Failed to process file upload" });
        }
        next();
    });
};

router.get("/", verifyToken, getResume);
router.post("/", verifyToken, uploadMiddleware, uploadResume);
router.get("/file", verifyToken, viewResumeFile);
router.delete("/", verifyToken, deleteResume);

module.exports = router;
