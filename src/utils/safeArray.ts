export function safeArray<T>(value: any): T[] {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  if (typeof value === "object") {
    console.warn("Normalized non-array:", value);
    return Object.values(value) as T[];
  }
  return [];
}
