/**
 * PHASE 4.1: Sync State Definitions
 *
 * Defines all possible sync states for records.
 * Each record can be in one of these states.
 */

export enum SyncState {
    /**
     * Record exists only locally
     * Not yet attempted to sync
     */
    LOCAL = "local",

    /**
     * Record successfully synced to cloud
     * In sync with cloud version
     */
    SYNCED = "synced",

    /**
     * Local changes not yet uploaded
     * User edited locally, waiting to push
     */
    PENDING_UPLOAD = "pending_upload",

    /**
     * Cloud has changes not yet downloaded
     * Cloud version is newer, waiting to pull
     */
    PENDING_DOWNLOAD = "pending_download",

    /**
     * Both local and cloud have changes
     * Conflict detected, needs resolution
     */
    CONFLICT = "conflict",

    /**
     * Sync in progress
     * Currently uploading/downloading
     */
    SYNCING = "syncing",

    /**
     * Failed to sync
     * Error occurred during sync
     */
    ERROR = "error",
}

export interface SyncMetadata {
    /**
     * Current sync state of this record
     */
    state: SyncState;

    /**
     * When record was last modified locally
     */
    localUpdatedAt: number;

    /**
     * When record was last modified on cloud
     */
    cloudUpdatedAt?: number;

    /**
     * When we last synced this record
     */
    lastSyncAt?: number;

    /**
     * Sync error message if state is ERROR
     */
    error?: string;

    /**
     * Conflict details if state is CONFLICT
     */
    conflict?: {
        localVersion: any;
        cloudVersion: any;
        resolvedAt?: number;
        resolution?: "local" | "cloud" | "merged";
    };
}

/**
 * Determine if a record needs syncing
 */
export function needsSync(state: SyncState): boolean {
    return [
        SyncState.LOCAL,
        SyncState.PENDING_UPLOAD,
        SyncState.PENDING_DOWNLOAD,
        SyncState.CONFLICT,
        SyncState.ERROR,
    ].includes(state);
}

/**
 * Determine if a record is synced
 */
export function isSynced(state: SyncState): boolean {
    return state === SyncState.SYNCED;
}

/**
 * Determine if a record has a conflict
 */
export function hasConflict(state: SyncState): boolean {
    return state === SyncState.CONFLICT;
}

/**
 * Transition state based on action
 */
export function transitionState(
    currentState: SyncState,
    action:
        | "mark_dirty"
        | "start_sync"
        | "sync_success"
        | "sync_error"
        | "detect_conflict"
        | "resolve_conflict"
        | "mark_local",
): SyncState {
    switch (action) {
        case "mark_dirty":
            // User edited locally
            return currentState === SyncState.SYNCED ? SyncState.PENDING_UPLOAD : currentState;

        case "start_sync":
            // Start syncing
            return SyncState.SYNCING;

        case "sync_success":
            // Sync completed successfully
            return SyncState.SYNCED;

        case "sync_error":
            // Sync failed
            return SyncState.ERROR;

        case "detect_conflict":
            // Detected conflict during sync
            return SyncState.CONFLICT;

        case "resolve_conflict":
            // Conflict resolved
            return SyncState.SYNCED;

        case "mark_local":
            // Mark as local only (offline)
            return SyncState.LOCAL;

        default:
            return currentState;
    }
}

/**
 * Get human-readable sync status
 */
export function getSyncStatusLabel(state: SyncState): string {
    const labels: Record<SyncState, string> = {
        [SyncState.LOCAL]: "Local Only",
        [SyncState.SYNCED]: "Synced",
        [SyncState.PENDING_UPLOAD]: "Uploading...",
        [SyncState.PENDING_DOWNLOAD]: "Downloading...",
        [SyncState.CONFLICT]: "Conflict",
        [SyncState.SYNCING]: "Syncing...",
        [SyncState.ERROR]: "Sync Error",
    };
    return labels[state];
}
