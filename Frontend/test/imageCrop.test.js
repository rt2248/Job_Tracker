import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  MAX_AVATAR_SIZE,
  validateAvatarFile,
  computeCoverScale,
  clampCropOffset,
  computeSourceCropRect,
  getExtensionForMimeType,
  resolveTargetMimeType,
} from "../src/utils/imageCrop.js";

describe("Avatar Image Validation & Crop Geometry Utilities", () => {
  describe("1. validateAvatarFile", () => {
    it("accepts valid PNG, JPEG, and WebP files within 2MB limit", () => {
      assert.deepEqual(
        validateAvatarFile({ name: "photo.png", type: "image/png", size: 1024 }),
        { valid: true }
      );
      assert.deepEqual(
        validateAvatarFile({ name: "HEADSHOT.JPEG", type: "image/jpeg", size: 500_000 }),
        { valid: true }
      );
      assert.deepEqual(
        validateAvatarFile({ name: "portrait.webp", type: "image/webp", size: MAX_AVATAR_SIZE }),
        { valid: true }
      );
    });

    it("rejects SVG, GIF, and unsupported file extensions", () => {
      const svgRes = validateAvatarFile({ name: "vector.svg", type: "image/svg+xml", size: 512 });
      assert.equal(svgRes.valid, false);
      assert.match(svgRes.error, /PNG, JPEG, and WebP/);

      const gifRes = validateAvatarFile({ name: "anim.gif", type: "image/gif", size: 512 });
      assert.equal(gifRes.valid, false);

      const txtRes = validateAvatarFile({ name: "notes.txt", type: "text/plain", size: 512 });
      assert.equal(txtRes.valid, false);
    });

    it("rejects files with spoofed MIME types", () => {
      const res = validateAvatarFile({ name: "fake.png", type: "image/svg+xml", size: 1024 });
      assert.equal(res.valid, false);
      assert.match(res.error, /PNG, JPEG, and WebP/);
    });

    it("rejects empty files and files exceeding 2MB", () => {
      const emptyRes = validateAvatarFile({ name: "empty.png", type: "image/png", size: 0 });
      assert.equal(emptyRes.valid, false);
      assert.match(emptyRes.error, /empty/i);

      const largeRes = validateAvatarFile({
        name: "huge.jpg",
        type: "image/jpeg",
        size: MAX_AVATAR_SIZE + 1,
      });
      assert.equal(largeRes.valid, false);
      assert.match(largeRes.error, /2MB/);
    });
  });

  describe("2. computeCoverScale", () => {
    it("chooses scale covering both axes for landscape, portrait, and small images", () => {
      // Landscape 1600x800 in 320x320 viewport: must scale by 320/800 = 0.4 so height fills 320px
      assert.equal(computeCoverScale(1600, 800, 320), 0.4);
      // Portrait 600x1200 in 300x300 viewport: must scale by 300/600 = 0.5 so width fills 300px
      assert.equal(computeCoverScale(600, 1200, 300), 0.5);
      // Small square 100x100 in 300x300 viewport: upscales to 3.0x
      assert.equal(computeCoverScale(100, 100, 300), 3);
    });

    it("safely returns 1 for non-positive or non-finite inputs", () => {
      assert.equal(computeCoverScale(0, 500, 320), 1);
      assert.equal(computeCoverScale(500, -1, 320), 1);
      assert.equal(computeCoverScale(NaN, 500, 320), 1);
    });
  });

  describe("3. clampCropOffset", () => {
    it("allows horizontal panning and locks vertical panning for landscape image at 1x zoom", () => {
      // 1600x800 at 320px viewport -> baseScale = 0.4 -> displayed 640x320
      // Max X offset = (640 - 320)/2 = 160; Max Y offset = (320 - 320)/2 = 0
      const clamped = clampCropOffset({
        x: 500,
        y: 50,
        naturalWidth: 1600,
        naturalHeight: 800,
        viewportSize: 320,
        zoom: 1,
      });
      assert.deepEqual(clamped, { x: 160, y: 0 });

      const clampedNeg = clampCropOffset({
        x: -300,
        y: -25,
        naturalWidth: 1600,
        naturalHeight: 800,
        viewportSize: 320,
        zoom: 1,
      });
      assert.deepEqual(clampedNeg, { x: -160, y: 0 });
    });

    it("expands pan boundaries proportionally as zoom increases", () => {
      // 800x800 in 320px viewport at 2x zoom -> displayed 640x640 -> maxX/maxY = 160
      const clamped = clampCropOffset({
        x: 200,
        y: -200,
        naturalWidth: 800,
        naturalHeight: 800,
        viewportSize: 320,
        zoom: 2,
      });
      assert.deepEqual(clamped, { x: 160, y: -160 });
    });
  });

  describe("4. computeSourceCropRect", () => {
    it("computes exact centered square crop rectangle on landscape photo at zoom = 1", () => {
      // 1600x800 centered inside 320x320 -> crops middle 800x800 at x=400, y=0
      const rect = computeSourceCropRect({
        x: 0,
        y: 0,
        naturalWidth: 1600,
        naturalHeight: 800,
        viewportSize: 320,
        zoom: 1,
      });
      assert.deepEqual(rect, { sx: 400, sy: 0, sSize: 800 });
    });

    it("shifts crop rectangle accurately when user pans image right/left", () => {
      // Dragging image right (+160px in viewport) shifts crop window to left edge (sx = 0)
      const leftEdge = computeSourceCropRect({
        x: 160,
        y: 0,
        naturalWidth: 1600,
        naturalHeight: 800,
        viewportSize: 320,
        zoom: 1,
      });
      assert.deepEqual(leftEdge, { sx: 0, sy: 0, sSize: 800 });

      // Dragging image left (-160px in viewport) shifts crop window to right edge (sx = 800)
      const rightEdge = computeSourceCropRect({
        x: -160,
        y: 0,
        naturalWidth: 1600,
        naturalHeight: 800,
        viewportSize: 320,
        zoom: 1,
      });
      assert.deepEqual(rightEdge, { sx: 800, sy: 0, sSize: 800 });
    });

    it("halves source crop dimension when zoom is 2x", () => {
      // 1000x1000 centered at 2x zoom -> crops middle 500x500 starting at (250, 250)
      const zoomed = computeSourceCropRect({
        x: 0,
        y: 0,
        naturalWidth: 1000,
        naturalHeight: 1000,
        viewportSize: 320,
        zoom: 2,
      });
      assert.deepEqual(zoomed, { sx: 250, sy: 250, sSize: 500 });
    });
  });

  describe("5. MIME & extension format mapping", () => {
    it("maps MIME types to exact approved backend extensions", () => {
      assert.equal(getExtensionForMimeType("image/png"), "png");
      assert.equal(getExtensionForMimeType("image/webp"), "webp");
      assert.equal(getExtensionForMimeType("image/jpeg"), "jpg");
      assert.equal(resolveTargetMimeType("image/png"), "image/png");
      assert.equal(resolveTargetMimeType("image/svg+xml"), "image/jpeg");
    });
  });
});
