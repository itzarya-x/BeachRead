/**
 * Storage Mode Manager
 *
 * HARD SWITCH between cloud and local based on authentication.
 * Provides loud logging and enforcement to guarantee correct storage usage.
 *
 * Rules:
 * - If authenticated: ONLY Supabase (cloud)
 * - If not authenticated: ONLY IndexedDB (local)
 * - Never both, never fallback silently
 */

export type StorageMode = "cloud" | "local";

interface StorageModeState {
    mode: StorageMode;
    userId: string | null;
    isAuthenticated: boolean;
}

let currentState: StorageModeState = {
    mode: "local",
    userId: null,
    isAuthenticated: false,
};

/**
 * PHASE 1.1: Get active storage mode based ONLY on auth session
 */
export function getActiveStorageMode(isAuthenticated: boolean, userId?: string): StorageMode {
    if (isAuthenticated && userId) {
        return "cloud";
    }
    return "local";
}

/**
 * Update storage mode based on auth status
 */
export function updateStorageMode(isAuthenticated: boolean, userId?: string): void {
    const newMode = getActiveStorageMode(isAuthenticated, userId);
    const wasCloud = currentState.mode === "cloud";
    const isCloud = newMode === "cloud";

    currentState = {
        mode: newMode,
        userId: userId || null,
        isAuthenticated,
    };

    if (wasCloud !== isCloud) {
        console.log(
            `%c🔄 STORAGE MODE SWITCHED: ${wasCloud ? "CLOUD" : "LOCAL"} → ${isCloud ? "CLOUD" : "LOCAL"}`,
            "font-weight: bold; color: #ff6b6b;",
        );
    }
}

/**
 * Get current storage mode
 */
export function getCurrentStorageMode(): StorageModeState {
    return { ...currentState };
}

/**
 * PHASE 1.2: Block local access if authenticated
 * Call this before ANY IndexedDB operation
 */
export function assertNotCloud(operation: string): void {
    if (currentState.mode === "cloud") {
        const error = `❌ LOCAL DATABASE ACCESS BLOCKED (USER AUTHENTICATED)\nOperation: ${operation}\nUser ID: ${currentState.userId}`;
        console.error(`%c${error}`, "color: #ff0000; font-weight: bold;");
        throw new Error(error);
    }
}

/**
 * PHASE 1.2: Block cloud access if not authenticated
 * Call this before ANY Supabase operation
 */
export function assertCloud(operation: string): void {
    if (currentState.mode === "local") {
        const error = `❌ CLOUD DATABASE ACCESS BLOCKED (USER NOT AUTHENTICATED)\nOperation: ${operation}`;
        console.error(`%c${error}`, "color: #ff0000; font-weight: bold;");
        throw new Error(error);
    }
}

/**
 * PHASE 2: Loud logging for all operations
 */
export const DataLog = {
    reading: (source: "SUPABASE" | "INDEXEDDB" | "GDPR", count?: number) => {
        const suffix = count !== undefined ? ` (${count} items)` : "";
        console.log(`%c[DATA] reading from ${source}${suffix}`, `color: #4dabf7; font-weight: bold;`);
    },

    inserted: (source: "SUPABASE" | "INDEXEDDB", id: string | number) => {
        console.log(`%c[DATA] inserted into ${source} id=${id}`, `color: #51cf66; font-weight: bold;`);
    },

    updated: (source: "SUPABASE" | "INDEXEDDB", id: string | number, fields?: string[]) => {
        const fieldStr = fields ? ` (${fields.join(", ")})` : "";
        console.log(`%c[DATA] updated in ${source} id=${id}${fieldStr}`, `color: #ffd43b; font-weight: bold;`);
    },

    deleted: (source: "SUPABASE" | "INDEXEDDB", id: string | number, soft: boolean = false) => {
        const type = soft ? "soft" : "hard";
        console.log(`%c[DATA] ${type} deleted from ${source} id=${id}`, `color: #ff8787; font-weight: bold;`);
    },

    error: (operation: string, error: any) => {
        console.error(
            `%c[DATA] ERROR in ${operation}: ${error.message || error}`,
            `color: #ff0000; font-weight: bold;`,
        );
    },

    verified: (id: string | number, source: "SUPABASE" | "INDEXEDDB", success: boolean) => {
        const status = success ? "✅ VERIFIED" : "❌ VERIFICATION FAILED";
        const color = success ? "#51cf66" : "#ff0000";
        console.log(`%c[DATA] ${status} - ${source} id=${id}`, `color: ${color}; font-weight: bold;`);
    },

    modeStatus: () => {
        const mode = currentState.mode.toUpperCase();
        const status = currentState.isAuthenticated ? "✅ AUTHENTICATED" : "⛔ NOT AUTHENTICATED";
        const color = currentState.mode === "cloud" ? "#4dabf7" : "#868e96";
        console.log(
            `%c📊 STORAGE MODE: ${mode} | ${status} | User: ${currentState.userId || "NONE"}`,
            `color: ${color}; font-weight: bold; font-size: 12px;`,
        );
    },
};

/**
 * Display current storage mode in console (for verification)
 */
export function displayStorageStatus(): string {
    const mode = currentState.mode.toUpperCase();
    const status = currentState.isAuthenticated ? "🔒 AUTHENTICATED" : "🔓 NOT AUTHENTICATED";
    return `Storage: ${mode} | ${status}`;
}
