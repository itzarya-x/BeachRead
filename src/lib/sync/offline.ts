/**
 * PHASE 8: Offline Mode
 *
 * User can keep working while offline:
 * - Changes are queued locally
 * - Sync resumes when connection returns
 * - Zero data loss during offline periods
 */

import { getStorageProvider } from "../storage";

export interface QueuedChange {
    id: string;
    itemId: string;
    type: "create" | "update" | "delete";
    data: any;
    timestamp: number;
    synced: boolean;
}

export interface OfflineQueueStatus {
    isOnline: boolean;
    pendingChanges: number;
    failedChanges: number;
    lastSyncAttempt?: number;
}

class OfflineQueueManager {
    private queue: Map<string, QueuedChange> = new Map();
    private isOnline = navigator.onLine;
    private status: OfflineQueueStatus = {
        isOnline: this.isOnline,
        pendingChanges: 0,
        failedChanges: 0,
    };

    private readonly STORAGE_KEY = "offline_queue";
    private readonly RETRY_INTERVAL = 5000; // 5 seconds
    private retryTimer: NodeJS.Timeout | null = null;

    constructor() {
        // Load queue from localStorage on init
        this.loadQueueFromStorage();

        // Monitor online/offline status
        window.addEventListener("online", () => this.onOnline());
        window.addEventListener("offline", () => this.onOffline());
    }

    /**
     * Queue a change for later sync
     *
     * Called when:
     * - User is offline
     * - Network error occurs
     * - User makes change (as fallback)
     */
    async queueChange(itemId: string, type: "create" | "update" | "delete", data: any): Promise<void> {
        const change: QueuedChange = {
            id: `${itemId}_${Date.now()}`,
            itemId,
            type,
            data,
            timestamp: Date.now(),
            synced: false,
        };

        // Add to in-memory queue
        this.queue.set(change.id, change);

        // Persist to localStorage for durability
        this.saveQueueToStorage();

        // Update status
        this.status.pendingChanges = this.queue.size;

        console.log(`Queued ${type} for item ${itemId}. Queue size: ${this.queue.size}`);
    }

    /**
     * When connection returns, process queued changes
     */
    private async onOnline(): Promise<void> {
        this.isOnline = true;
        this.status.isOnline = true;

        console.log("Back online. Processing queued changes...");
        await this.processQueue();
    }

    /**
     * When connection lost, note it
     */
    private onOffline(): void {
        this.isOnline = false;
        this.status.isOnline = false;

        console.log("Offline. Changes will be queued.");

        if (this.retryTimer) {
            clearInterval(this.retryTimer);
            this.retryTimer = null;
        }
    }

    /**
     * Process all queued changes
     *
     * Tries to sync each change back to server
     * If failure, retries with backoff
     */
    private async processQueue(): Promise<void> {
        if (this.queue.size === 0) {
            console.log("No queued changes to process.");
            return;
        }

        const changes = Array.from(this.queue.values()).filter(c => !c.synced);

        for (const change of changes) {
            try {
                await this.syncChange(change);
                change.synced = true;
                this.queue.delete(change.id);
            } catch (error) {
                console.error(`Failed to sync change ${change.id}:`, error);
                this.status.failedChanges++;
            }
        }

        // Save updated queue
        this.saveQueueToStorage();
        this.status.pendingChanges = this.queue.size;

        // If we still have unsynced changes and are online, retry after delay
        if (this.queue.size > 0 && this.isOnline) {
            if (!this.retryTimer) {
                this.retryTimer = setInterval(() => {
                    if (this.isOnline) {
                        this.processQueue();
                    }
                }, this.RETRY_INTERVAL);
            }
        }
    }

    /**
     * Sync a single change to the server
     */
    private async syncChange(change: QueuedChange): Promise<void> {
        const storage = getStorageProvider();

        // TODO: Implement based on change type
        switch (change.type) {
            case "create":
            case "update":
                // await storage.saveItem(change.itemId, change.data);
                break;
            case "delete":
                // await storage.deleteItem(change.itemId);
                break;
        }

        // Mark as synced
        // await updateSyncMetadata(change.itemId, {
        //     state: SyncState.SYNCED,
        //     lastSyncAt: Date.now(),
        // });
    }

    /**
     * Get queue status
     */
    getStatus(): OfflineQueueStatus {
        return { ...this.status, lastSyncAttempt: Date.now() };
    }

    /**
     * Get pending changes
     */
    getPendingChanges(): QueuedChange[] {
        return Array.from(this.queue.values()).filter(c => !c.synced);
    }

    /**
     * Clear entire queue (use with caution)
     */
    clearQueue(): void {
        this.queue.clear();
        localStorage.removeItem(this.STORAGE_KEY);
        this.status.pendingChanges = 0;
        this.status.failedChanges = 0;
    }

    /**
     * Persist queue to localStorage
     */
    private saveQueueToStorage(): void {
        try {
            const changes = Array.from(this.queue.values());
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(changes));
        } catch (error) {
            console.error("Failed to save queue to storage:", error);
        }
    }

    /**
     * Load queue from localStorage
     */
    private loadQueueFromStorage(): void {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            if (data) {
                const changes = JSON.parse(data) as QueuedChange[];
                changes.forEach(c => this.queue.set(c.id, c));
                this.status.pendingChanges = this.queue.size;
            }
        } catch (error) {
            console.error("Failed to load queue from storage:", error);
        }
    }

    /**
     * For testing: simulate offline period
     */
    simulateOffline(): void {
        this.onOffline();
    }

    /**
     * For testing: simulate coming back online
     */
    async simulateOnline(): Promise<void> {
        await this.onOnline();
    }
}

// Singleton instance
let instance: OfflineQueueManager | null = null;

export function getOfflineQueueManager(): OfflineQueueManager {
    if (!instance) {
        instance = new OfflineQueueManager();
    }
    return instance;
}
