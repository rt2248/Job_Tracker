import React from "react";
import { cn } from "../../utils/cn";

/**
 * ChartLegend - Reusable Accessible Legend for Visualization Components
 *
 * Employs distinct geometric shapes (circles, diamonds, triangles, squares)
 * in addition to colors to guarantee full WCAG accessibility without
 * relying on color perception alone.
 *
 * @param {Object} props
 * @param {Array<{
 *   key: string,
 *   label: string,
 *   count?: number,
 *   percentage?: number,
 *   color?: string,
 *   shape?: 'circle'|'square'|'diamond'|'triangle'|'star',
 *   active?: boolean
 * }>} props.items
 * @param {string} [props.activeKey]
 * @param {(key: string) => void} [props.onItemClick]
 * @param {string} [props.className]
 */
export default function ChartLegend({
  items = [],
  activeKey,
  onItemClick,
  className,
}) {
  if (!items || items.length === 0) return null;

  return (
    <div
      className={cn("flex flex-wrap items-center gap-x-4 gap-y-2 text-xs", className)}
      role="list"
      aria-label="Chart legend"
    >
      {items.map((item) => {
        const isActive = activeKey ? activeKey === item.key : true;
        const isSelected = activeKey === item.key;
        const hasClick = typeof onItemClick === "function";

        return (
          <div
            key={item.key}
            role={hasClick ? "button" : "listitem"}
            tabIndex={hasClick ? 0 : undefined}
            onClick={() => hasClick && onItemClick(item.key)}
            onKeyDown={(e) => {
              if (hasClick && (e.key === "Enter" || e.key === " ")) {
                e.preventDefault();
                onItemClick(item.key);
              }
            }}
            className={cn(
              "inline-flex items-center gap-2 py-1 px-2 rounded-lg transition-all select-none",
              hasClick && "cursor-pointer hover:bg-surface-secondary/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-cyan/60",
              isSelected && "bg-surface-secondary ring-1 ring-border-accent/40 font-medium",
              !isActive && "opacity-40"
            )}
            aria-label={`${item.label}: ${item.count !== undefined ? `${item.count} items` : ""}${item.percentage !== undefined ? ` (${item.percentage}%)` : ""}`}
          >
            {/* Accessible Geometric SVG Marker */}
            <span className="shrink-0 w-3 h-3 flex items-center justify-center" aria-hidden="true">
              {item.shape === "square" ? (
                <span className={cn("w-2.5 h-2.5 rounded-sm", item.color || "bg-muted")} />
              ) : item.shape === "diamond" ? (
                <span className={cn("w-2 h-2 transform rotate-45 rounded-[1px]", item.color || "bg-muted")} />
              ) : item.shape === "triangle" ? (
                <svg viewBox="0 0 10 10" className="w-2.5 h-2.5">
                  <polygon points="5,1 9,9 1,9" className={cn("fill-current", item.color ? "" : "text-muted")} style={{ fill: item.color && !item.color.startsWith("bg-") ? item.color : undefined }} />
                </svg>
              ) : (
                <span className={cn("w-2.5 h-2.5 rounded-full", item.color || "bg-muted")} />
              )}
            </span>

            {/* Label */}
            <span className="text-ink-secondary font-sans font-medium">
              {item.label}
            </span>

            {/* Optional Count */}
            {item.count !== undefined && (
              <span className="font-mono text-ink font-semibold">
                {item.count}
              </span>
            )}

            {/* Optional Percentage */}
            {item.percentage !== undefined && (
              <span className="text-muted font-mono text-[11px]">
                ({item.percentage}%)
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
