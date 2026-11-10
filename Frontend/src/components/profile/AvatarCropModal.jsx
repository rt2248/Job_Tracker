import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Button from "../shared/Button";
import {
  MIN_ZOOM,
  MAX_ZOOM,
  DEFAULT_OUTPUT_SIZE,
  computeCoverScale,
  clampCropOffset,
  renderCroppedAvatarFile,
} from "../../utils/imageCrop";

const PREVIEW_SIZE = 80;
const ZOOM_STEP = 0.1;

export default function AvatarCropModal({
  isOpen,
  imageUrl,
  fileName,
  preferredMimeType,
  isUploading = false,
  onCancel,
  onConfirm,
}) {
  const viewportRef = useRef(null);
  const imgElementRef = useRef(null);
  const dragStateRef = useRef(null);

  const [viewportSize, setViewportSize] = useState(320);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isPreparingBlob, setIsPreparingBlob] = useState(false);
  const [loadError, setLoadError] = useState("");

  const isBusy = isUploading || isPreparingBlob;
  const isImageReady = naturalSize.width > 0 && naturalSize.height > 0 && !loadError;

  // Reset crop state whenever a new file/modal session starts
  useEffect(() => {
    if (!isOpen) return;
    setNaturalSize({ width: 0, height: 0 });
    setZoom(MIN_ZOOM);
    setOffset({ x: 0, y: 0 });
    setIsDragging(false);
    setIsPreparingBlob(false);
    setLoadError("");
  }, [isOpen, imageUrl]);

  // Measure actual responsive crop viewport dimension
  useEffect(() => {
    if (!isOpen || !viewportRef.current) return;

    const updateSize = () => {
      if (viewportRef.current) {
        const measured = viewportRef.current.clientWidth;
        if (measured > 0) {
          setViewportSize(measured);
        }
      }
    };

    updateSize();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(updateSize);
      observer.observe(viewportRef.current);
      return () => observer.disconnect();
    }

    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [isOpen]);

  // Re-clamp offset if viewport resizes
  useEffect(() => {
    if (!isImageReady) return;
    setOffset((prev) =>
      clampCropOffset({
        x: prev.x,
        y: prev.y,
        naturalWidth: naturalSize.width,
        naturalHeight: naturalSize.height,
        viewportSize,
        zoom,
      })
    );
  }, [viewportSize, naturalSize, zoom, isImageReady]);

  // Escape & body scroll lock
  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = "hidden";
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !isBusy) {
        e.preventDefault();
        onCancel?.();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, isBusy, onCancel]);

  const applyZoom = useCallback(
    (nextZoomRaw) => {
      const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(nextZoomRaw) || MIN_ZOOM));
      setZoom((prevZoom) => {
        if (isImageReady && prevZoom > 0) {
          const ratio = nextZoom / prevZoom;
          setOffset((prevOffset) =>
            clampCropOffset({
              x: prevOffset.x * ratio,
              y: prevOffset.y * ratio,
              naturalWidth: naturalSize.width,
              naturalHeight: naturalSize.height,
              viewportSize,
              zoom: nextZoom,
            })
          );
        }
        return nextZoom;
      });
    },
    [isImageReady, naturalSize, viewportSize]
  );

  // Smooth wheel zoom directly over the crop stage without triggering page scroll
  useEffect(() => {
    const el = viewportRef.current;
    if (!isOpen || !el) return;

    const handleWheel = (e) => {
      if (!isImageReady || isBusy) return;
      e.preventDefault();
      const delta = e.deltaY < 0 ? 0.08 : -0.08;
      applyZoom(zoom + delta);
    };

    el.addEventListener("wheel", handleWheel, { passive: false });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [isOpen, isImageReady, isBusy, zoom, applyZoom]);

  const handleImageLoad = (e) => {
    const img = e.currentTarget;
    if (!img.naturalWidth || !img.naturalHeight) {
      setLoadError("Unable to read image dimensions.");
      return;
    }
    setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
    setZoom(MIN_ZOOM);
    setOffset({ x: 0, y: 0 });
    setLoadError("");
  };

  const handleImageError = () => {
    setLoadError("This image file appears damaged or unreadable.");
  };

  const handlePointerDown = (e) => {
    if (!isImageReady || isBusy) return;
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture?.(e.pointerId);
    } catch {
      // Ignore if pointer capture is unsupported in synthetic test contexts
    }
    dragStateRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: offset.x,
      originY: offset.y,
    };
    setIsDragging(true);
  };

  const handlePointerMove = (e) => {
    if (!dragStateRef.current || dragStateRef.current.pointerId !== e.pointerId) return;
    const dx = e.clientX - dragStateRef.current.startX;
    const dy = e.clientY - dragStateRef.current.startY;
    setOffset(
      clampCropOffset({
        x: dragStateRef.current.originX + dx,
        y: dragStateRef.current.originY + dy,
        naturalWidth: naturalSize.width,
        naturalHeight: naturalSize.height,
        viewportSize,
        zoom,
      })
    );
  };

  const handlePointerEnd = (e) => {
    if (!dragStateRef.current || dragStateRef.current.pointerId !== e.pointerId) return;
    try {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    } catch {
      // Ignore if capture already released
    }
    dragStateRef.current = null;
    setIsDragging(false);
  };

  const handleStageKeyDown = (e) => {
    if (!isImageReady || isBusy) return;
    const step = e.shiftKey ? 18 : 6;
    let dx = 0;
    let dy = 0;

    if (e.key === "ArrowLeft") dx = -step;
    else if (e.key === "ArrowRight") dx = step;
    else if (e.key === "ArrowUp") dy = -step;
    else if (e.key === "ArrowDown") dy = step;
    else if (e.key === "+" || e.key === "=") {
      e.preventDefault();
      applyZoom(zoom + ZOOM_STEP);
      return;
    } else if (e.key === "-") {
      e.preventDefault();
      applyZoom(zoom - ZOOM_STEP);
      return;
    } else {
      return;
    }

    e.preventDefault();
    setOffset((prev) =>
      clampCropOffset({
        x: prev.x + dx,
        y: prev.y + dy,
        naturalWidth: naturalSize.width,
        naturalHeight: naturalSize.height,
        viewportSize,
        zoom,
      })
    );
  };

  const handleReset = () => {
    if (!isImageReady || isBusy) return;
    setZoom(MIN_ZOOM);
    setOffset({ x: 0, y: 0 });
  };

  const handleConfirmSave = async () => {
    if (!isImageReady || isBusy || !imgElementRef.current) return;

    try {
      setIsPreparingBlob(true);
      const croppedFile = await renderCroppedAvatarFile({
        image: imgElementRef.current,
        offset,
        zoom,
        viewportSize,
        preferredMimeType,
        outputSize: DEFAULT_OUTPUT_SIZE,
      });
      await onConfirm?.(croppedFile);
    } catch (err) {
      console.error("Crop processing error:", err);
      setLoadError(err?.message || "Failed to process cropped image.");
    } finally {
      setIsPreparingBlob(false);
    }
  };

  if (!isOpen) return null;

  const baseScale = computeCoverScale(naturalSize.width, naturalSize.height, viewportSize);
  const effectiveScale = baseScale * zoom;
  const displayedWidth = naturalSize.width * effectiveScale;
  const displayedHeight = naturalSize.height * effectiveScale;

  // Scale factors for proportional 80px live preview mirror
  const previewRatio = viewportSize > 0 ? PREVIEW_SIZE / viewportSize : 0.25;
  const previewWidth = displayedWidth * previewRatio;
  const previewHeight = displayedHeight * previewRatio;
  const previewOffsetX = offset.x * previewRatio;
  const previewOffsetY = offset.y * previewRatio;

  const isAtDefault = Math.abs(zoom - MIN_ZOOM) < 0.005 && Math.abs(offset.x) < 0.5 && Math.abs(offset.y) < 0.5;

  return createPortal(
    <div
      className="fixed inset-0 z-50 bg-canvas/80 backdrop-blur-sm flex items-center justify-center p-4 animate-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isBusy) {
          onCancel?.();
        }
      }}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="avatar-crop-modal-title"
        className="bg-surface border border-border-primary rounded-xl w-full max-w-2xl max-h-[92vh] overflow-y-auto p-5 sm:p-6 shadow-2xl animate-modal-content"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between gap-4 pb-4 border-b border-border-subtle mb-5">
          <h2 id="avatar-crop-modal-title" className="font-display text-ink text-xl sm:text-2xl font-bold tracking-tight">
            Adjust Profile Photo
          </h2>
          <button
            type="button"
            onClick={onCancel}
            disabled={isBusy}
            aria-label="Cancel photo adjustment"
            className="text-muted hover:text-ink p-1.5 rounded-lg hover:bg-surface-secondary transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Workspace Layout */}
        <div className="flex flex-col md:flex-row items-center md:items-stretch gap-6">
          {/* Interactive Crop Stage */}
          <div className="flex flex-col items-center gap-2.5 shrink-0">
            <div
              ref={viewportRef}
              tabIndex={isImageReady ? 0 : -1}
              role="application"
              aria-label="Crop area. Drag or use arrow keys to reposition, plus or minus keys to zoom."
              onKeyDown={handleStageKeyDown}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerEnd}
              onPointerCancel={handlePointerEnd}
              className={`w-[260px] h-[260px] sm:w-[320px] sm:h-[320px] relative overflow-hidden bg-neutral-950 rounded-lg select-none touch-none flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan ${
                isImageReady ? (isDragging ? "cursor-grabbing" : "cursor-grab") : "cursor-default"
              }`}
            >
              {imageUrl && (
                <img
                  ref={imgElementRef}
                  src={imageUrl}
                  alt="Crop preview source"
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  draggable={false}
                  style={
                    isImageReady
                      ? {
                          width: `${displayedWidth}px`,
                          height: `${displayedHeight}px`,
                          maxWidth: "none",
                          maxHeight: "none",
                          transform: `translate(${offset.x}px, ${offset.y}px)`,
                        }
                      : { opacity: 0, position: "absolute", width: "auto", height: "auto" }
                  }
                  className="pointer-events-none select-none shrink-0"
                />
              )}

              {/* Circular crop window reticle + dimmed corners */}
              {isImageReady && (
                <div
                  className="absolute inset-0 rounded-full pointer-events-none border border-white/60"
                  style={{ boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.62)" }}
                />
              )}

              {/* Subtle 3x3 alignment grid active while dragging */}
              {isImageReady && isDragging && (
                <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3">
                  <div className="border-r border-b border-white/25" />
                  <div className="border-r border-b border-white/25" />
                  <div className="border-b border-white/25" />
                  <div className="border-r border-b border-white/25" />
                  <div className="border-r border-b border-white/25" />
                  <div className="border-b border-white/25" />
                  <div className="border-r border-white/25" />
                  <div className="border-r border-white/25" />
                  <div />
                </div>
              )}

              {/* Loading / Error State inside stage */}
              {!isImageReady && !loadError && (
                <div className="text-sm text-white/75 font-sans">Loading image...</div>
              )}

              {loadError && (
                <div className="p-4 text-center space-y-2 z-10">
                  <svg className="w-8 h-8 text-red mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                  <p className="text-xs sm:text-sm text-white font-sans">{loadError}</p>
                </div>
              )}
            </div>
          </div>

          {/* Controls & Live Avatar Preview Column */}
          <div className="flex-1 w-full flex flex-col justify-between gap-6">
            <div className="space-y-6">
              {/* Live Cropped Avatar Preview */}
              <div className="flex items-center gap-4 pb-5 border-b border-border-subtle">
                <div
                  className="w-20 h-20 rounded-full overflow-hidden bg-surface-overlay flex items-center justify-center shrink-0 relative"
                  aria-label="Live avatar result preview"
                >
                  {isImageReady ? (
                    <img
                      src={imageUrl}
                      alt="Result preview"
                      draggable={false}
                      style={{
                        width: `${previewWidth}px`,
                        height: `${previewHeight}px`,
                        maxWidth: "none",
                        maxHeight: "none",
                        transform: `translate(${previewOffsetX}px, ${previewOffsetY}px)`,
                      }}
                      className="pointer-events-none select-none shrink-0"
                    />
                  ) : null}
                </div>
                <div className="min-w-0">
                  <span className="font-display font-semibold text-base text-ink block">
                    Avatar Preview
                  </span>
                  {fileName && (
                    <span className="font-mono text-xs text-muted block truncate max-w-[200px] mt-0.5" title={fileName}>
                      {fileName}
                    </span>
                  )}
                </div>
              </div>

              {/* Zoom Slider Control */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="avatar-zoom-slider" className="text-sm font-sans font-medium text-ink">
                    Zoom
                  </label>
                  <span className="font-mono text-xs font-medium text-muted">
                    {zoom.toFixed(2)}x
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={() => applyZoom(zoom - ZOOM_STEP)}
                    disabled={!isImageReady || isBusy || zoom <= MIN_ZOOM}
                    aria-label="Zoom out"
                    className="p-1.5 rounded-md text-muted hover:text-ink hover:bg-surface-secondary transition-colors cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" />
                    </svg>
                  </button>

                  <input
                    id="avatar-zoom-slider"
                    type="range"
                    min={MIN_ZOOM}
                    max={MAX_ZOOM}
                    step={0.01}
                    value={zoom}
                    disabled={!isImageReady || isBusy}
                    onChange={(e) => applyZoom(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-surface-secondary rounded-lg appearance-none cursor-pointer accent-cyan disabled:opacity-40"
                  />

                  <button
                    type="button"
                    onClick={() => applyZoom(zoom + ZOOM_STEP)}
                    disabled={!isImageReady || isBusy || zoom >= MAX_ZOOM}
                    aria-label="Zoom in"
                    className="p-1.5 rounded-md text-muted hover:text-ink hover:bg-surface-secondary transition-colors cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Reset Action */}
              <div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  disabled={!isImageReady || isBusy || isAtDefault}
                  className="text-xs sm:text-sm h-9 px-3.5 inline-flex items-center gap-2"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reset
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border-subtle mt-6">
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onCancel}
            disabled={isBusy}
            className="text-sm px-4 py-2"
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="md"
            isLoading={isBusy}
            disabled={!isImageReady || Boolean(loadError) || isBusy}
            onClick={handleConfirmSave}
            className="text-sm font-semibold px-5 py-2"
          >
            Save Picture
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
