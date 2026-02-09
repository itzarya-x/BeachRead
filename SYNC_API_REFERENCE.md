// SYNC SYSTEM API REFERENCE
// Quick guide for using each sync module

/\*\*

- =====================================================================
- MODULE: Sync States
- File: src/lib/sync/states.ts
-
- Core state machine and metadata tracking
- =====================================================================
  \*/

// Enum with all possible sync states
export enum SyncState {
LOCAL = "local", // Only local, not yet synced
SYNCED = "synced", // Successfully synced to cloud
PENDING_UPLOAD = "pending_upload", // Local changes waiting
PENDING_DOWNLOAD = "pending_download", // Cloud changes waiting
CONFLICT = "conflict", // Both sides changed
SYNCING = "syncing", // Currently syncing
ERROR = "error", // Sync failed
}

// Metadata for tracking each record's sync status
export interface SyncMetadata {
state: SyncState;
localUpdatedAt: number; // When record was edited locally
cloudUpdatedAt?: number; // When it was updated on cloud
lastSyncAt?: number; // Last successful sync
error?: string; // Error message if state is ERROR
conflict?: {
localVersion: any;
cloudVersion: any;
resolvedAt?: number;
resolution?: "local" | "cloud" | "merged";
};
}

// Usage
import { SyncState, needsSync, isSynced } from "@/lib/sync/states";

if (isSynced(state)) {
// Record is up to date with cloud
}

if (needsSync(state)) {
// Record needs to be synced
}

/\*\*

- =====================================================================
- MODULE: Conflict Resolution
- File: src/lib/sync/conflict.ts
-
- Handles conflicts when both local and cloud changed
- =====================================================================
  \*/

import {
lastWriteWinsStrategy,
resolveConflict,
detectConflict,
getConflictDetails,
} from "@/lib/sync/conflict";

// Resolve a conflict between local and cloud versions
const resolution = resolveConflict(localItem, cloudItem, lastWriteWinsStrategy);
console.log(`Winner: ${resolution.winner.id}, Strategy: ${resolution.strategy}`);

// Detect if a conflict occurred
if (detectConflict(local, cloud)) {
console.log("Conflict detected!");
}

// Get details for UI display
const details = getConflictDetails(local, cloud);
console.log(`Local version updated at: ${details.localUpdatedAt}`);
console.log(`Recommended: ${details.recommendation}`);

/\*\*

- =====================================================================
- MODULE: Sync Engine
- File: src/lib/sync/engine.ts
-
- Orchestrates upload/download flows
- =====================================================================
  \*/

import { getSyncEngine } from "@/lib/sync/engine";

const engine = getSyncEngine();

// Subscribe to sync events (UI should do this)
const unsubscribe = engine.subscribe((event) => {
console.log(`Sync ${event.type} for item ${event.itemId}`);
console.log(`New state: ${event.state}`);

    // Use to update UI with sync status

});

// Upload an item (marks as PENDING_UPLOAD, queues for background sync)
await engine.uploadItem(itemId, itemData);

// Download updates from cloud (pulls changes since last sync)
await engine.downloadUpdates(userId);

// Get sync statistics
const stats = engine.getStats();
console.log(`Uploaded: ${stats.itemsUploaded}, Downloaded: ${stats.itemsDownloaded}`);

// Check if online
if (engine.isOnlineNow()) {
console.log("Connected to internet");
}

// Force immediate sync of all pending
await engine.forceSyncAll();

/\*\*

- =====================================================================
- MODULE: Initial Migration
- File: src/lib/sync/migration.ts
-
- Batch uploads local vault on first login
- =====================================================================
  \*/

import { getMigrationManager } from "@/lib/sync/migration";

const migration = getMigrationManager();

// Check if this is user's first login
const isFirstLogin = await migration.checkFirstLogin(userId);

if (isFirstLogin) {
// Show migration dialog to user
const itemCount = await migration.getItemsToMigrate(userId);
console.log(`Ready to migrate ${itemCount} items`);

    // Perform migration with progress tracking
    await migration.migrateVaultToCloud(userId, (current, total) => {
        console.log(`Migrated ${current}/${total}`);
        // Update UI progress bar here
    });

}

// Get current status
const status = migration.getStatus();
console.log(`First login: ${status.isFirstLogin}, Completed: ${status.completed}`);

/\*\*

- =====================================================================
- MODULE: Backup & Restore
- File: src/lib/sync/index.ts
-
- Force download/upload and JSON export/import
- =====================================================================
  \*/

import { getBackupRestoreManager } from "@/lib/sync";

const backupManager = getBackupRestoreManager();

// Force download: Replace local with cloud copy
// Use when: "sync to this device", recovering from corruption
await backupManager.forceDownloadCloudCopy(userId, (current, total) => {
console.log(`Downloaded ${current}/${total}`);
});

// Force upload: Replace cloud with local copy
// Use when: "upload my local data", recovering from cloud issues
await backupManager.forceUploadLocalCopy(userId, (current, total) => {
console.log(`Uploaded ${current}/${total}`);
});

// Export local vault as JSON (for manual backup to disk)
const jsonBackup = await backupManager.exportLocalVault();
downloadFile("vault-backup.json", jsonBackup);

// Import JSON backup (restore from file)
const imported = await backupManager.importLocalVault(jsonData);
console.log(`Imported ${imported} items`);

// Get current status
const status = backupManager.getStatus();
console.log(`In progress: ${status.inProgress}, Items: ${status.itemsProcessed}/${status.totalItems}`);

/\*\*

- =====================================================================
- MODULE: Offline Queue
- File: src/lib/sync/offline.ts
-
- Queues changes when offline, syncs when reconnected
- =====================================================================
  \*/

import { getOfflineQueueManager } from "@/lib/sync/offline";

const queue = getOfflineQueueManager();

// Queue a change (automatically called when offline)
await queue.queueChange(itemId, "update", {
title: "New Title",
updatedAt: Date.now(),
});

// Get queue status
const status = queue.getStatus();
console.log(`Online: ${status.isOnline}`);
console.log(`Pending changes: ${status.pendingChanges}`);

// Get list of pending changes
const pending = queue.getPendingChanges();
pending.forEach(change => {
console.log(`${change.type} for item ${change.itemId}`);
});

// Manually clear queue (use with caution)
queue.clearQueue();

// Testing utilities
queue.simulateOffline(); // Simulate connection loss
await queue.simulateOnline(); // Simulate connection restored

/\*\*

- =====================================================================
- TYPICAL WORKFLOW: USER LOGIN → SYNC
- =====================================================================
  \*/

import { useAuth } from "@/context/AuthContext";
import { getMigrationManager } from "@/lib/sync/migration";
import { getSyncEngine } from "@/lib/sync/engine";

async function handleLogin(email: string, password: string) {
const { login } = useAuth();

    // 1. Authenticate user
    await login(email, password);

    // 2. Check if first login
    const migration = getMigrationManager();
    const isFirstLogin = await migration.checkFirstLogin(userId);

    if (isFirstLogin) {
        // 3. Show migration dialog and upload local vault
        setShowMigrationDialog(true);
        await migration.migrateVaultToCloud(userId, updateProgress);
    }

    // 4. Download cloud updates
    const engine = getSyncEngine();
    await engine.downloadUpdates(userId);

    // 5. Subscribe to future syncs
    engine.subscribe(event => {
        // Update UI with sync status
        console.log(`Sync: ${event.type}`);
    });

    // 6. Navigate to app
    navigate("/home");

}

/\*\*

- =====================================================================
- TYPICAL WORKFLOW: USER EDIT → SYNC
- =====================================================================
  \*/

async function handleEditItem(itemId: string, newData: any) {
// 1. Update local storage immediately
await storage.saveUserEntry(newData);

    // 2. Queue for sync (background, non-blocking)
    const engine = getSyncEngine();
    await engine.uploadItem(itemId, newData);

    // 3. Show UI feedback
    showSyncIndicator("Syncing...");

    // 4. Listen for completion
    const unsubscribe = engine.subscribe(event => {
        if (event.itemId === itemId && event.type === "upload_complete") {
            showSyncIndicator("Synced!");
            unsubscribe();
        }
    });

}

/\*\*

- =====================================================================
- TYPICAL WORKFLOW: OFFLINE EDITING → RECONNECT
- =====================================================================
  \*/

import { getOfflineQueueManager } from "@/lib/sync/offline";

async function handleEditItemOffline(itemId: string, newData: any) {
// 1. Save locally (always works)
await storage.saveUserEntry(newData);

    // 2. If offline, queue it
    const queue = getOfflineQueueManager();
    if (!queue.getStatus().isOnline) {
        await queue.queueChange(itemId, "update", newData);
        showMessage("Changes will sync when online");
    } else {
        // 3. If online, sync immediately
        const engine = getSyncEngine();
        await engine.uploadItem(itemId, newData);
    }

}

// Queue manager automatically:
// - Detects when connection returns
// - Retries queued changes
// - Emits sync events
// - Marks as synced when complete

/\*\*

- =====================================================================
- ERROR HANDLING PATTERNS
- =====================================================================
  \*/

try {
await engine.uploadItem(itemId, data);
} catch (error) {
// Check sync engine status
const stats = engine.getStats();
console.log(`Failed syncs: ${stats.errors}`);

    // Item will be in PENDING_UPLOAD state
    // Will retry in background
    // Show message to user: "Will sync when connection improves"

}

try {
await migration.migrateVaultToCloud(userId);
} catch (error) {
const status = migration.getStatus();
console.log(`Migration error: ${status.error}`);

    // Retry migration later
    setTimeout(() => {
        migration.migrateVaultToCloud(userId);
    }, 5000);

}

// Event listener for sync errors
engine.subscribe(event => {
if (event.type === "error") {
console.error(`Sync failed for ${event.itemId}: ${event.error}`);
// Show error message to user
showError(`Failed to sync: ${event.error}`);
}
});

export const SYNC_API_REFERENCE = "All sync modules documented";
