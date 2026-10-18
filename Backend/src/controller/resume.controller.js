const path = require("path");
const {
    getResumeByUserId,
    upsertResume,
    deleteResumeByUserId,
} = require("../models/files/resume.model");
const {
    isValidPdfSignature,
    generateStorageFilename,
    saveFile,
    fileExists,
    getReadStream,
    deleteFile,
} = require("../utils/storage");

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const formatResume = (row) => ({
    id: row.id,
    filename: row.original_filename,
    size: row.file_size,
    mimeType: row.mime_type,
    uploadedAt: row.updated_at || row.created_at,
});

/**
 * GET /api/resume
 * Retrieves current user's resume metadata
 */
const getResume = async (req, res) => {
    try {
        const userId = req.user.userId;
        const row = await getResumeByUserId(userId);

        if (!row) {
            return res.status(200).json({ resume: null });
        }

        res.status(200).json({ resume: formatResume(row) });
    } catch (error) {
        console.error("Error fetching resume metadata:", error);
        res.status(500).json({ message: "Server error fetching resume" });
    }
};

/**
 * POST /api/resume
 * Uploads or replaces current user's resume
 */
const uploadResume = async (req, res) => {
    let newStorageFilename = null;
    try {
        const userId = req.user.userId;

        if (!req.file || !req.file.buffer) {
            return res.status(400).json({ message: "No resume file provided" });
        }

        // 1. File size check
        if (req.file.size === 0) {
            return res.status(400).json({ message: "Uploaded file is empty" });
        }
        if (req.file.size > MAX_FILE_SIZE) {
            return res.status(400).json({ message: "File exceeds 5MB limit" });
        }

        // 2. File extension check
        const ext = path.extname(req.file.originalname).toLowerCase();
        if (ext !== ".pdf") {
            return res.status(400).json({ message: "Only PDF files are supported" });
        }

        // 3. MIME type check
        if (req.file.mimetype !== "application/pdf") {
            return res.status(400).json({ message: "Invalid MIME type; expected application/pdf" });
        }

        // 4. Content signature check (PDF magic bytes %PDF-)
        if (!isValidPdfSignature(req.file.buffer)) {
            return res.status(400).json({ message: "Invalid file content: signature does not match PDF format" });
        }

        // 5. Look up existing resume to prepare for clean replacement
        const existingResume = await getResumeByUserId(userId);

        // 6. Generate unguessable storage filename and save file
        newStorageFilename = generateStorageFilename();
        await saveFile(newStorageFilename, req.file.buffer);

        // 7. Sanitize original filename (remove any directory path components)
        const originalFilename = path.basename(req.file.originalname).slice(0, 255);

        // 8. Commit metadata to database
        const savedRecord = await upsertResume({
            userId,
            originalFilename,
            storageFilename: newStorageFilename,
            fileSize: req.file.size,
            mimeType: "application/pdf",
        });

        // 9. Now that DB commit succeeded, clean up old file if replacing
        if (existingResume && existingResume.storage_filename && existingResume.storage_filename !== newStorageFilename) {
            await deleteFile(existingResume.storage_filename);
        }

        res.status(200).json({
            message: existingResume ? "Resume replaced successfully" : "Resume uploaded successfully",
            resume: formatResume(savedRecord),
        });
    } catch (error) {
        console.error("Error uploading resume:", error);
        // If file was written but DB failed, clean up the orphaned file
        if (newStorageFilename) {
            await deleteFile(newStorageFilename);
        }
        res.status(500).json({ message: "Server error uploading resume" });
    }
};

/**
 * GET /api/resume/file
 * Securely streams the authenticated user's PDF inline
 */
const viewResumeFile = async (req, res) => {
    try {
        const userId = req.user.userId;
        const row = await getResumeByUserId(userId);

        if (!row) {
            return res.status(404).json({ message: "No resume found" });
        }

        if (!fileExists(row.storage_filename)) {
            return res.status(404).json({ message: "Resume file not found on storage" });
        }

        // Sanitize filename for Content-Disposition header
        const safeDispositionName = row.original_filename
            .replace(/["\r\n\\]/g, "_")
            .slice(0, 100);

        // Set security and inline viewing headers
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `inline; filename="${safeDispositionName}"`);
        res.setHeader("X-Content-Type-Options", "nosniff");
        res.setHeader("Content-Security-Policy", "default-src 'self'");
        res.setHeader("Cache-Control", "private, no-cache, no-store, must-revalidate");

        const stream = getReadStream(row.storage_filename);
        stream.on("error", (streamErr) => {
            console.error("Stream error reading resume:", streamErr);
            if (!res.headersSent) {
                res.status(500).json({ message: "Failed to read resume file" });
            }
        });
        stream.pipe(res);
    } catch (error) {
        console.error("Error viewing resume file:", error);
        res.status(500).json({ message: "Server error retrieving resume" });
    }
};

/**
 * DELETE /api/resume
 * Deletes current user's resume
 */
const deleteResume = async (req, res) => {
    try {
        const userId = req.user.userId;
        const deletedRecord = await deleteResumeByUserId(userId);

        if (!deletedRecord) {
            return res.status(404).json({ message: "No resume to delete" });
        }

        if (deletedRecord.storage_filename) {
            await deleteFile(deletedRecord.storage_filename);
        }

        res.status(200).json({ message: "Resume deleted successfully" });
    } catch (error) {
        console.error("Error deleting resume:", error);
        res.status(500).json({ message: "Server error deleting resume" });
    }
};

module.exports = {
    getResume,
    uploadResume,
    viewResumeFile,
    deleteResume,
};
