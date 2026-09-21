import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combines clsx and tailwind-merge for safe conditional Tailwind class merging.
 * Use this instead of plain clsx() when Tailwind class conflicts are possible.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
