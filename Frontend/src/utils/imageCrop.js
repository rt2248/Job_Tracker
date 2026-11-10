export const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2 MB
export const ALLOWED_AVATAR_EXTENSIONS = [".png", ".jpg", ".jpeg", ".webp"];
export const ALLOWED_AVATAR_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"];
export const DEFAULT_OUTPUT_SIZE = 512;
export const MIN_ZOOM = 1;
export const MAX_ZOOM = 3;

const MIME_TO_EXTENSION = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};

/**
 * Validates a user-selected File before opening the crop workspace.
 * Enforces the same extension, MIME, non-empty, and 2MB constraints as the backend.
 */
export function validateAvatarFile(file) {
  if (!file || typeof file.name !== "string") {
    return { valid: false, error: "Please select a valid image file." };
  }

  const dotIdx = file.name.lastIndexOf(".");
  const ext = dotIdx !== -1 ? file.name.slice(dotIdx).toLowerCase() : "";

  if (!ALLOWED_AVATAR_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: "Only PNG, JPEG, and WebP images are permitted for avatars. SVG and GIF are not allowed.",
    };
  }

  if (file.type && !ALLOWED_AVATAR_MIME_TYPES.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: "Only PNG, JPEG, and WebP images are permitted for avatars.",
    };
  }

  if (file.size === 0) {
    return { valid: false, error: "Selected file is empty." };
  }

  if (file.size > MAX_AVATAR_SIZE) {
    return { valid: false, error: "Avatar image exceeds the 2MB size limit." };
  }

  return { valid: true };
}

/**
 * Computes the base scale required so an image completely covers a square crop viewport
 * with zero blank edges at zoom = 1.
 */
export function computeCoverScale(naturalWidth, naturalHeight, viewportSize) {
  if (
    !Number.isFinite(naturalWidth) ||
    !Number.isFinite(naturalHeight) ||
    !Number.isFinite(viewportSize) ||
    naturalWidth <= 0 ||
    naturalHeight <= 0 ||
    viewportSize <= 0
  ) {
    return 1;
  }

  return Math.max(viewportSize / naturalWidth, viewportSize / naturalHeight);
}

/**
 * Clamps pan offset (x, y) in viewport pixels so the scaled image always covers
 * the entire crop viewport without exposing empty margins.
 */
export function clampCropOffset({
  x,
  y,
  naturalWidth,
  naturalHeight,
  viewportSize,
  zoom = 1,
}) {
  const safeZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(zoom) || MIN_ZOOM));
  const baseScale = computeCoverScale(naturalWidth, naturalHeight, viewportSize);
  const effectiveScale = baseScale * safeZoom;

  const displayedWidth = naturalWidth * effectiveScale;
  const displayedHeight = naturalHeight * effectiveScale;

  const maxOffsetX = Math.max(0, (displayedWidth - viewportSize) / 2);
  const maxOffsetY = Math.max(0, (displayedHeight - viewportSize) / 2);

  return {
    x: Math.min(maxOffsetX, Math.max(-maxOffsetX, Number(x) || 0)) + 0,
    y: Math.min(maxOffsetY, Math.max(-maxOffsetY, Number(y) || 0)) + 0,
  };
}

/**
 * Computes the exact square source crop rectangle in natural image pixels corresponding
 * to the viewport center, pan offset, and zoom factor.
 */
export function computeSourceCropRect({
  x,
  y,
  naturalWidth,
  naturalHeight,
  viewportSize,
  zoom = 1,
}) {
  const safeZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(zoom) || MIN_ZOOM));
  const baseScale = computeCoverScale(naturalWidth, naturalHeight, viewportSize);
  const effectiveScale = baseScale * safeZoom;

  const clamped = clampCropOffset({
    x,
    y,
    naturalWidth,
    naturalHeight,
    viewportSize,
    zoom: safeZoom,
  });

  const displayedWidth = naturalWidth * effectiveScale;
  const displayedHeight = naturalHeight * effectiveScale;

  const rawSx = ((displayedWidth - viewportSize) / 2 - clamped.x) / effectiveScale;
  const rawSy = ((displayedHeight - viewportSize) / 2 - clamped.y) / effectiveScale;
  const rawSize = viewportSize / effectiveScale;

  const sSize = Math.min(naturalWidth, naturalHeight, Math.max(1, rawSize));
  const sx = Math.min(Math.max(0, rawSx), Math.max(0, naturalWidth - sSize));
  const sy = Math.min(Math.max(0, rawSy), Math.max(0, naturalHeight - sSize));

  return { sx, sy, sSize };
}

/**
 * Maps an image MIME type to an approved backend upload extension, guaranteeing
 * client extension matches binary signature.
 */
export function getExtensionForMimeType(mimeType) {
  const normalized = (mimeType || "").toLowerCase();
  return MIME_TO_EXTENSION[normalized] || "jpg";
}

/**
 * Resolves the target canvas output MIME type from the source file MIME type.
 */
export function resolveTargetMimeType(preferredMimeType) {
  const normalized = (preferredMimeType || "").toLowerCase();
  if (ALLOWED_AVATAR_MIME_TYPES.includes(normalized)) {
    return normalized;
  }
  return "image/jpeg";
}

function canvasToBlobAsync(canvas, mimeType, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to encode cropped avatar image."));
          return;
        }
        resolve(blob);
      },
      mimeType,
      quality
    );
  });
}

/**
 * Renders the adjusted crop rectangle into a crisp 1:1 File ready for FormData upload.
 * Ensures the output binary MIME matches the filename extension and stays within MAX_AVATAR_SIZE.
 */
export async function renderCroppedAvatarFile({
  image,
  offset,
  zoom,
  viewportSize,
  preferredMimeType,
  outputSize = DEFAULT_OUTPUT_SIZE,
  maxBytes = MAX_AVATAR_SIZE,
}) {
  if (!image || !image.naturalWidth || !image.naturalHeight) {
    throw new Error("Image is not loaded.");
  }

  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2D context is unavailable.");
  }

  const targetMime = resolveTargetMimeType(preferredMimeType);

  if (targetMime === "image/jpeg") {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, outputSize, outputSize);
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  const { sx, sy, sSize } = computeSourceCropRect({
    x: offset.x,
    y: offset.y,
    naturalWidth: image.naturalWidth,
    naturalHeight: image.naturalHeight,
    viewportSize,
    zoom,
  });

  ctx.drawImage(image, sx, sy, sSize, sSize, 0, 0, outputSize, outputSize);

  const encodingAttempts =
    targetMime === "image/png"
      ? [
          { mime: "image/png", quality: undefined },
          { mime: "image/webp", quality: 0.9 },
          { mime: "image/jpeg", quality: 0.88 },
        ]
      : targetMime === "image/webp"
      ? [
          { mime: "image/webp", quality: 0.92 },
          { mime: "image/webp", quality: 0.8 },
          { mime: "image/jpeg", quality: 0.85 },
        ]
      : [
          { mime: "image/jpeg", quality: 0.92 },
          { mime: "image/jpeg", quality: 0.82 },
          { mime: "image/jpeg", quality: 0.72 },
        ];

  let finalBlob = null;
  for (const attempt of encodingAttempts) {
    const candidate = await canvasToBlobAsync(canvas, attempt.mime, attempt.quality);
    if (candidate.size > 0 && candidate.size <= maxBytes) {
      finalBlob = candidate;
      break;
    }
    finalBlob = candidate;
  }

  if (!finalBlob || finalBlob.size === 0) {
    throw new Error("Cropped avatar image is empty.");
  }

  if (finalBlob.size > maxBytes) {
    throw new Error("Cropped avatar image exceeds the 2MB size limit.");
  }

  const actualMime = finalBlob.type || targetMime;
  const ext = getExtensionForMimeType(actualMime);
  return new File([finalBlob], `avatar.${ext}`, { type: actualMime });
}
