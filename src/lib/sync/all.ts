/**
 * Sync System Exports
 *
 * Consolidates all sync-related modules for easy importing
 */

// Sync states and metadata
export {
    SyncMetadata,
    SyncState,
    getSyncStatusLabel,
    hasConflict,
    isSynced,
    needsSync,
    transitionState,
} from "./states";

// Conflict resolution
export {
    ConflictResolutionStrategy,
    MergeConflict,
    canThreeWayMerge,
    detectConflict,
    getConflictDetails,
    lastWriteWinsStrategy,
    resolveConflict,
    threeWayMerge,
} from "./conflict";

// Sync engine (upload, download, sync orchestration)
export { SyncEvent, SyncStats, getSyncEngine } from "./engine";

// Initial migration (first login batch upload)
export { MigrationStatus, getMigrationManager } from "./migration";

// Backup and restore
export { BackupRestoreStatus, getBackupRestoreManager } from "./index"; // backup/restore manager

// Offline queue
export { OfflineQueueStatus, QueuedChange, getOfflineQueueManager } from "./offline";
