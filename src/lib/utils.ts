import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * SAFETY: Guarantees an array is returned even if source is malformed.
 * Prevents ".map is not a function" or ".filter is not a function" crashes.
 */
export function ensureArray<T>(value: any): T[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (value === null || value === undefined) {
    return [];
  }

  if (typeof value === "object") {
    console.warn(`[SAFETY] normalized non-array object to values array`, value);
    return Object.values(value) as T[];
  }

  console.warn(`[SAFETY] normalized invalid type (${typeof value}) to []`, value);
  return [];
}
