import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { parseISO, isValid, formatDistanceToNow, format } from "date-fns";

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

export function safeDate(date: any): Date | null {
  if (!date) return null;
  try {
    let d: Date;
    if (date instanceof Date) {
      d = date;
    } else if (typeof date === 'number') {
      d = new Date(date);
    } else {
      const s = String(date);
      // Try parseISO first
      d = parseISO(s);
      if (!isValid(d)) {
        // Fallback to native Date constructor
        d = new Date(s);
      }
    }
    return isValid(d) ? d : null;
  } catch {
    return null;
  }
}

export function safeFormatDistance(date: any, options?: any): string {
  const d = safeDate(date);
  if (!d) return "unknown time";
  try {
    return formatDistanceToNow(d, options);
  } catch {
    return "unknown time";
  }
}

export function safeFormat(date: any, formatStr: string): string {
  const d = safeDate(date);
  if (!d) return "unknown";
  try {
    return format(d, formatStr);
  } catch {
    return "unknown";
  }
}
