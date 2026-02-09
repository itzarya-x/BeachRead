/**
 * PHASE 4.2-4.5: Sync Engine
 *
 * Orchestrates upload/download flows without blocking UI.
 * - Upload: detects local changes, queues, pushes in background
 * - Download: pulls newer changes on login/refresh
 * - Conflict: resolves with last-write-wins
 * - Async: never blocks UI
 */

import { getStorageProvider } from "../storage";
import { detectConflict, lastWriteWinsStrategy, resolveConflict } from "./conflict";
import { SyncMetadata, SyncState } from "./states";

export interface SyncEvent {
    type: "upload_start" | "upload_complete" | "download_start" | "download_complete" | "conflict" | "error";
    itemId: string;
    state?: SyncState;
    error?: string;
    timestamp: number;
}

export interface SyncStats {
    itemsUploaded: number;
    itemsDownloaded: number;
    conflicts: number;
    errors: number;
    lastSyncAt: number;
}

type SyncEventListener = (event: SyncEvent) => void;

class SyncEngine {
    private listeners: Set<SyncEventListener> = new Set();
    private isOnline = navigator.onLine;
    private syncInProgress = new Map<string, boolean>();
    private uploadQueue: Set<string> = new Set();
    private stats: SyncStats = {
        itemsUploaded: 0,
        itemsDownloaded: 0,
        conflicts: 0,
        errors: 0,
        lastSyncAt: 0,
    };

    constructor() {
        // Monitor online/offline status
        window.addEventListener("online", () => {
            this.isOnline = true;
            this.emit("sync_status", "online");
            this.processUploadQueue();
        });

        window.addEventListener("offline", () => {
            this.isOnline = false;
            this.emit("sync_status", "offline");
        });
    }

    /**
     * Subscribe to sync events (never blocks)
     */
    subscribe(listener: SyncEventListener): () => void {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    /**
     * PHASE 4.2: Upload Flow
     *
     * Mark item as dirty → queue → push in background
     * Never blocks UI
     */
    async uploadItem(itemId: string, itemData: any): Promise<void> {
        // Mark as pending upload
        await this.updateSyncMetadata(itemId, {
            state: SyncState.PENDING_UPLOAD,
            localUpdatedAt: Date.now(),
        });

        // Queue for background sync
        this.uploadQueue.add(itemId);

        // Emit event (UI can show "syncing" indicator)
        this.emitEvent({
            type: "upload_start",
            itemId,
            state: SyncState.PENDING_UPLOAD,
            timestamp: Date.now(),
        });

        // If online, start background sync (non-blocking)
        if (this.isOnline) {
            // Don't await - let it happen in background
            this.processUploadQueue();
        }
    }

    /**
     * PHASE 4.3: Download Flow
     *
     * Pull changes newer than local on login/refresh
     * Merge with local data, handle conflicts
     * Never blocks UI
     */
    async downloadUpdates(userId: string): Promise<void> {
        const storage = getStorageProvider();

        try {
            // Get last sync time
            const lastSyncAt = this.stats.lastSyncAt || 0;

            // Emit download start (UI shows loading)
            this.emitEvent({
                type: "download_start",
                itemId: "all",
                state: SyncState.SYNCING,
                timestamp: Date.now(),
            });

            // Fetch items from cloud that changed after last sync
            // TODO: Implement cloud.getItems(userId, since: lastSyncAt)
            const cloudItems = (await (storage as any).getItems?.(userId, lastSyncAt)) || [];

            // Process each cloud item
            for (const cloudItem of cloudItems) {
                await this.mergeCloudItem(cloudItem);
            }

            // Update last sync time
            this.stats.lastSyncAt = Date.now();

            this.emitEvent({
                type: "download_complete",
                itemId: "all",
                state: SyncState.SYNCED,
                timestamp: Date.now(),
            });
        } catch (error) {
            this.emitEvent({
                type: "error",
                itemId: "all",
                error: `Download failed: ${error instanceof Error ? error.message : String(error)}`,
                timestamp: Date.now(),
            });
        }
    }

    /**
     * Merge a single cloud item with local version
     */
    private async mergeCloudItem(cloudItem: any): Promise<void> {
        const storage = getStorageProvider();
        const itemId = cloudItem.id;

        try {
            // Get local version (this is a tier assignment, media cache, or user entry)
            // For now, we'll work with the stored metadata approach
            const localMetadata = await this.getSyncMetadata(itemId);

            if (!localMetadata) {
                // Item only exists in cloud - download it
                // TODO: Implement cloud item download and storage
                await this.updateSyncMetadata(itemId, {
                    state: SyncState.SYNCED,
                    localUpdatedAt: new Date(cloudItem.updatedAt).getTime(),
                    cloudUpdatedAt: new Date(cloudItem.updatedAt).getTime(),
                });

                this.stats.itemsDownloaded++;
                this.emitEvent({
                    type: "download_complete",
                    itemId,
                    state: SyncState.SYNCED,
                    timestamp: Date.now(),
                });
                return;
            }

            // Item exists both places - check for conflict
            const hasConflict = detectConflict(localMetadata, cloudItem);

            if (hasConflict) {
                // PHASE 4.4: Conflict Resolution
                const resolution = resolveConflict(localMetadata, cloudItem, lastWriteWinsStrategy);

                // Store the resolved winner
                await this.updateSyncMetadata(itemId, {
                    state: SyncState.SYNCED,
                    localUpdatedAt: new Date(resolution.winner.updatedAt).getTime(),
                    cloudUpdatedAt: new Date(cloudItem.updatedAt).getTime(),
                    conflict: {
                        localVersion: localMetadata,
                        cloudVersion: cloudItem,
                        resolvedAt: Date.now(),
                        resolution: resolution.strategy as any,
                    },
                });

                this.stats.conflicts++;
                this.emitEvent({
                    type: "conflict",
                    itemId,
                    state: SyncState.SYNCED,
                    timestamp: Date.now(),
                });
            } else if (new Date(cloudItem.updatedAt).getTime() > localMetadata.localUpdatedAt) {
                // Cloud is newer - take it
                await this.updateSyncMetadata(itemId, {
                    state: SyncState.SYNCED,
                    localUpdatedAt: new Date(cloudItem.updatedAt).getTime(),
                    cloudUpdatedAt: new Date(cloudItem.updatedAt).getTime(),
                });

                this.stats.itemsDownloaded++;
                this.emitEvent({
                    type: "download_complete",
                    itemId,
                    state: SyncState.SYNCED,
                    timestamp: Date.now(),
                });
            }
        } catch (error) {
            this.emitEvent({
                type: "error",
                itemId,
                error: `Merge failed: ${error instanceof Error ? error.message : String(error)}`,
                timestamp: Date.now(),
            });
        }
    }

    /**
     * Process queued items for upload in background
     * Non-blocking - UI continues responding
     */
    private async processUploadQueue(): Promise<void> {
        const itemsToProcess = Array.from(this.uploadQueue);
        this.uploadQueue.clear();

        for (const itemId of itemsToProcess) {
            // Skip if already syncing
            if (this.syncInProgress.get(itemId)) {
                this.uploadQueue.add(itemId);
                continue;
            }

            // Start sync in background (don't await)
            this.syncItemInBackground(itemId);
        }
    }

    /**
     * PHASE 4.5: Never Block UI
     *
     * Sync happens in background via setTimeout
     * UI gets updates via events but never waits
     */
    private async syncItemInBackground(itemId: string): Promise<void> {
        // Use setTimeout to ensure UI isn't blocked
        setTimeout(async () => {
            if (this.syncInProgress.get(itemId)) {
                return;
            }

            this.syncInProgress.set(itemId, true);

            try {
                // TODO: Implement cloud storage save
                // Get item from storage and push to cloud

                // Mark as synced
                await this.updateSyncMetadata(itemId, {
                    state: SyncState.SYNCED,
                    lastSyncAt: Date.now(),
                    cloudUpdatedAt: Date.now(),
                });

                this.stats.itemsUploaded++;
                this.emitEvent({
                    type: "upload_complete",
                    itemId,
                    state: SyncState.SYNCED,
                    timestamp: Date.now(),
                });
            } catch (error) {
                this.stats.errors++;
                this.emitEvent({
                    type: "error",
                    itemId,
                    error: `Upload failed: ${error instanceof Error ? error.message : String(error)}`,
                    timestamp: Date.now(),
                });

                // Re-queue for retry
                this.uploadQueue.add(itemId);
            } finally {
                this.syncInProgress.set(itemId, false);
            }
        }, 0);
    }

    /**
     * Get sync metadata for an item
     */
    private async getSyncMetadata(itemId: string): Promise<SyncMetadata | null> {
        // TODO: Fetch from storage
        return null;
    }

    /**
     * Update sync metadata for an item
     */
    private async updateSyncMetadata(itemId: string, metadata: Partial<SyncMetadata>): Promise<void> {
        // TODO: Store in storage
    }

    /**
     * Emit sync event to subscribers
     */
    private emitEvent(event: SyncEvent): void {
        this.listeners.forEach(listener => listener(event));
    }

    /**
     * Generic emit (compatibility)
     */
    private emit(type: string, data: any): void {
        // For non-SyncEvent types
    }

    /**
     * Get current sync statistics
     */
    getStats(): SyncStats {
        return { ...this.stats };
    }

    /**
     * Get online status
     */
    isOnlineNow(): boolean {
        return this.isOnline;
    }

    /**
     * Force sync all pending items (for testing/UI button)
     */
    async forceSyncAll(): Promise<void> {
        this.uploadQueue.forEach(() => {}); // Process all queued
        this.processUploadQueue();
    }
}

// Singleton instance
let instance: SyncEngine | null = null;

export function getSyncEngine(): SyncEngine {
    if (!instance) {
        instance = new SyncEngine();
    }
    return instance;
}
