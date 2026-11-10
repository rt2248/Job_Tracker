import React, { useEffect, useState } from "react";
import { cn } from "../../utils/cn";

/**
 * Unified, borderless avatar presentation used across Profile and Navigation.
 * Stands directly on its own without decorative boxes, borders, outlines, rings, or shadows.
 */
export default function UserAvatar({
  src,
  alt = "User avatar",
  initials = "EV",
  sizeClass = "w-24 h-24",
  textSizeClass = "text-3xl",
  fallbackClassName = "bg-surface-overlay text-ink",
  imgClassName,
  onClick,
  ariaLabel,
  title,
  statusIndicator,
  onLoadStateChange,
  wrapperClassName,
}) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  const showImage = Boolean(src) && !hasError;

  useEffect(() => {
    onLoadStateChange?.(showImage);
  }, [showImage, onLoadStateChange]);

  const visualNode = showImage ? (
    <img
      src={src}
      alt={alt}
      onError={() => setHasError(true)}
      className={cn(
        sizeClass,
        "rounded-full object-cover block select-none shrink-0",
        imgClassName
      )}
    />
  ) : (
    <span
      className={cn(
        sizeClass,
        "rounded-full flex items-center justify-center font-display font-bold select-none shrink-0",
        fallbackClassName,
        textSizeClass
      )}
      aria-hidden={onClick ? "true" : undefined}
    >
      {initials}
    </span>
  );

  const interactiveOrStaticNode = onClick ? (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel || `View ${alt}`}
      title={title}
      className={cn(
        "p-0 m-0 border-0 bg-transparent rounded-full cursor-pointer inline-flex items-center justify-center shrink-0 transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan",
        wrapperClassName
      )}
    >
      {visualNode}
    </button>
  ) : (
    visualNode
  );

  if (!statusIndicator) {
    return interactiveOrStaticNode;
  }

  return (
    <div className="relative inline-flex shrink-0">
      {interactiveOrStaticNode}
      {statusIndicator}
    </div>
  );
}
