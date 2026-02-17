/**
 * Auth Logging
 *
 * Internal logging for OAuth and auth failures.
 * Used for debugging without exposing raw errors to users.
 * Logs to console and LocalStorage for debugging.
 */

import { safeToISO } from "./utils";

interface AuthLogEntry {
    timestamp: number;
    level: "info" | "warn" | "error";
    event: string;
    reason?: string;
    details?: Record<string, unknown>;
    userAgent?: string;
}

const MAX_LOGS = 50; // Keep last 50 logs
const STORAGE_KEY = "yura_auth_logs";
const logs: AuthLogEntry[] = [];

/**
 * Initialize logging from localStorage
 */
function initializeLogs(): void {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                logs.splice(0, logs.length, ...parsed.slice(-MAX_LOGS));
            }
        }
    } catch (err) {
        console.error("Failed to load auth logs:", err);
    }
}

/**
 * Save logs to localStorage
 */
function persistLogs(): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(logs.slice(-MAX_LOGS)));
    } catch (err) {
        console.error("Failed to save auth logs:", err);
    }
}

/**
 * Add log entry
 */
function addLog(
    level: "info" | "warn" | "error",
    event: string,
    reason?: string,
    details?: Record<string, unknown>,
): void {
    const entry: AuthLogEntry = {
        timestamp: Date.now(),
        level,
        event,
        reason,
        details,
        userAgent: navigator.userAgent.substring(0, 100),
    };

    logs.push(entry);

    // Keep only last MAX_LOGS entries
    if (logs.length > MAX_LOGS) {
        logs.shift();
    }

    // Persist to storage
    persistLogs();

    // Also log to console (development)
    const prefix = `[AUTH ${level.toUpperCase()}]`;
    if (level === "error") {
        console.error(prefix, event, reason, details);
    } else if (level === "warn") {
        console.warn(prefix, event, reason, details);
    } else {
        console.log(prefix, event, reason, details);
    }
}

/**
 * Log successful OAuth attempt start
 */
export function logOAuthStart(provider: string): void {
    addLog("info", "oauth_start", provider);
}

/**
 * Log OAuth failure
 */
export function logOAuthFailure(provider: string, reason: string, details?: Record<string, unknown>): void {
    addLog("warn", "oauth_failure", reason, {
        provider,
        ...details,
    });
}

/**
 * Log OAuth success
 */
export function logOAuthSuccess(provider: string): void {
    addLog("info", "oauth_success", provider);
}

/**
 * Log magic link attempt
 */
export function logMagicLinkAttempt(email: string): void {
    addLog("info", "magic_link_attempt", undefined, {
        email: email.substring(0, 3) + "***",
    });
}

/**
 * Log magic link failure
 */
export function logMagicLinkFailure(email: string, reason: string, details?: Record<string, unknown>): void {
    addLog("warn", "magic_link_failure", reason, {
        email: email.substring(0, 3) + "***",
        ...details,
    });
}

/**
 * Log session restoration
 */
export function logSessionRestoration(success: boolean, details?: Record<string, unknown>): void {
    addLog(success ? "info" : "warn", "session_restoration", success ? "success" : "failed", details);
}

/**
 * Log network state change
 */
export function logNetworkStateChange(isOnline: boolean): void {
    addLog("info", "network_state_change", isOnline ? "online" : "offline");
}

/**
 * Get all logs for debugging
 */
export function getLogs(): AuthLogEntry[] {
    return [...logs];
}

/**
 * Get logs as formatted string (for support/debugging)
 */
export function getLogsAsString(): string {
    return logs
        .map(log => {
            const date = safeToISO(log.timestamp);
            const level = log.level.toUpperCase();
            const details = log.details ? JSON.stringify(log.details) : "";
            return `[${date}] ${level} ${log.event} ${log.reason || ""} ${details}`.trim();
        })
        .join("\n");
}

/**
 * Clear all logs
 */
export function clearLogs(): void {
    logs.length = 0;
    localStorage.removeItem(STORAGE_KEY);
}

/**
 * Export logs for debugging (can be sent to support)
 */
export function exportLogsForSupport(): {
    logs: AuthLogEntry[];
    timestamp: string;
    userAgent: string;
} {
    return {
        logs: getLogs(),
        timestamp: safeToISO(new Date()),
        userAgent: navigator.userAgent,
    };
}

// Initialize on load
initializeLogs();

// Log network state changes
if (typeof window !== "undefined") {
    window.addEventListener("online", () => {
        logNetworkStateChange(true);
    });

    window.addEventListener("offline", () => {
        logNetworkStateChange(false);
    });
}
