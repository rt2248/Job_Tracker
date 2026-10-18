const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const STORAGE_DIR = process.env.RESUME_STORAGE_DIR || path.join(__dirname, "../../uploads/resumes");

// Ensure the storage directory exists
if (!fs.existsSync(STORAGE_DIR)) {
    fs.mkdirSync(STORAGE_DIR, { recursive: true });
}

/**
 * Validates whether the buffer begins with the PDF magic bytes (%PDF-)
 * @param {Buffer} buffer 
 * @returns {boolean}
 */
function isValidPdfSignature(buffer) {
    if (!buffer || !Buffer.isBuffer(buffer) || buffer.length < 5) {
        return false;
    }
    // %PDF- magic bytes: 0x25, 0x50, 0x44, 0x46, 0x2D
    return (
        buffer[0] === 0x25 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x44 &&
        buffer[3] === 0x46 &&
        buffer[4] === 0x2d
    );
}

/**
 * Generates an unguessable storage filename
 * @returns {string}
 */
function generateStorageFilename() {
    return `${crypto.randomUUID()}.pdf`;
}

/**
 * Saves a buffer to the storage directory
 * @param {string} storageFilename 
 * @param {Buffer} buffer 
 */
async function saveFile(storageFilename, buffer) {
    const safeFilename = path.basename(storageFilename);
    const destination = path.join(STORAGE_DIR, safeFilename);
    await fs.promises.writeFile(destination, buffer);
    return destination;
}

/**
 * Checks if a file exists in the storage directory
 * @param {string} storageFilename 
 * @returns {boolean}
 */
function fileExists(storageFilename) {
    if (!storageFilename) return false;
    const safeFilename = path.basename(storageFilename);
    return fs.existsSync(path.join(STORAGE_DIR, safeFilename));
}

/**
 * Returns a readable stream for the requested file
 * @param {string} storageFilename 
 * @returns {fs.ReadStream}
 */
function getReadStream(storageFilename) {
    const safeFilename = path.basename(storageFilename);
    const filePath = path.join(STORAGE_DIR, safeFilename);
    return fs.createReadStream(filePath);
}

/**
 * Deletes a file from storage
 * @param {string} storageFilename 
 */
async function deleteFile(storageFilename) {
    if (!storageFilename) return;
    try {
        const safeFilename = path.basename(storageFilename);
        const filePath = path.join(STORAGE_DIR, safeFilename);
        if (fs.existsSync(filePath)) {
            await fs.promises.unlink(filePath);
        }
    } catch (err) {
        console.error(`Failed to delete storage file ${storageFilename}:`, err.message);
    }
}

module.exports = {
    STORAGE_DIR,
    isValidPdfSignature,
    generateStorageFilename,
    saveFile,
    fileExists,
    getReadStream,
    deleteFile,
};
