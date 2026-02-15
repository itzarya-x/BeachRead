import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function ensureArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[]
  if (!value) return []
  if (typeof value === "object") {
    return Object.values(value as Record<string, unknown>) as T[]
  }
  return []
}
