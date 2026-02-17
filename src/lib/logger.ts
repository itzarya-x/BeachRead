const shouldLog = import.meta.env.DEV;

export function debugLog(...args: unknown[]) {
  if (shouldLog) {
    console.debug(...args);
  }
}
