import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge Tailwind CSS classes cleanly without collisions.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
