const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const AVATAR_STORAGE_DIR = process.env.AVATAR_STORAGE_DIR || path.join(__dirname, "../../uploads/avatars");

// Ensure the avatar storage directory exists
if (!fs.existsSync(AVATAR_STORAGE_DIR)) {
    fs.mkdirSync(AVATAR_STORAGE_DIR, { recursive: true });
}

/**
 * Validates binary signature / magic bytes of uploaded image buffer
 * Strictly allows: PNG, JPEG, and WebP
 * Strictly rejects: SVG, GIF, and all other formats
 *
 * @param {Buffer} buffer
 * @returns {{ mimeType: string, ext: string } | null}
 */
function detectImageSignature(buffer) {
    if (!buffer || !Buffer.isBuffer(buffer) || buffer.length < 12) {
        return null;
    }

    // 1. PNG: 89 50 4E 47 0D 0A 1A 0A
    if (
        buffer.length >= 8 &&
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47 &&
        buffer[4] === 0x0d &&
        buffer[5] === 0x0a &&
        buffer[6] === 0x1a &&
        buffer[7] === 0x0a
    ) {
        return { mimeType: "image/png", ext: "png" };
    }

    // 2. JPEG: FF D8 FF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
        return { mimeType: "image/jpeg", ext: "jpg" };
    }

    // 3. WebP: 'RIFF' (bytes 0-3) and 'WEBP' (bytes 8-11)
    if (
        buffer.length >= 12 &&
        buffer[0] === 0x52 && // R
        buffer[1] === 0x49 && // I
        buffer[2] === 0x46 && // F
        buffer[3] === 0x46 && // F
        buffer[8] === 0x57 && // W
        buffer[9] === 0x45 && // E
        buffer[10] === 0x42 && // B
        buffer[11] === 0x50    // P
    ) {
        // Additional check for WebP chunk types: VP8 , VP8L, or VP8X
        if (buffer.length >= 16) {
            const chunkType = buffer.toString("ascii", 12, 16);
            if (chunkType === "VP8 " || chunkType === "VP8L" || chunkType === "VP8X") {
                return { mimeType: "image/webp", ext: "webp" };
            }
        }
        return { mimeType: "image/webp", ext: "webp" };
    }

    return null;
}

/**
 * Generates an unpredictable UUID-based storage filename
 * @param {string} ext
 * @returns {string}
 */
function generateAvatarFilename(ext) {
    const cleanExt = (ext || "png").toLowerCase().replace(/^\./, "");
    return `${crypto.randomUUID()}.${cleanExt}`;
}

/**
 * Saves an avatar buffer to storage directory
 * @param {string} storageFilename
 * @param {Buffer} buffer
 */
async function saveAvatar(storageFilename, buffer) {
    const safeFilename = path.basename(storageFilename);
    const destination = path.join(AVATAR_STORAGE_DIR, safeFilename);
    await fs.promises.writeFile(destination, buffer);
    return destination;
}

/**
 * Checks if an avatar exists in storage directory
 * @param {string} storageFilename
 * @returns {boolean}
 */
function avatarExists(storageFilename) {
    if (!storageFilename) return false;
    const safeFilename = path.basename(storageFilename);
    return fs.existsSync(path.join(AVATAR_STORAGE_DIR, safeFilename));
}

/**
 * Returns a readable stream for the requested avatar
 * @param {string} storageFilename
 * @returns {fs.ReadStream}
 */
function getAvatarReadStream(storageFilename) {
    const safeFilename = path.basename(storageFilename);
    const filePath = path.join(AVATAR_STORAGE_DIR, safeFilename);
    return fs.createReadStream(filePath);
}

/**
 * Deletes an avatar file from storage
 * @param {string} storageFilename
 */
async function deleteAvatar(storageFilename) {
    if (!storageFilename) return;
    try {
        const safeFilename = path.basename(storageFilename);
        const filePath = path.join(AVATAR_STORAGE_DIR, safeFilename);
        if (fs.existsSync(filePath)) {
            await fs.promises.unlink(filePath);
        }
    } catch (err) {
        console.error(`Failed to delete avatar file ${storageFilename}:`, err.message);
    }
}

module.exports = {
    AVATAR_STORAGE_DIR,
    detectImageSignature,
    generateAvatarFilename,
    saveAvatar,
    avatarExists,
    getAvatarReadStream,
    deleteAvatar,
};
