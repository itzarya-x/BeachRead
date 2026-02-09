/**
 * PHASE 5: Initial Migration
 *
 * When user logs in for the first time:
 * - Show dialog: "Upload local vault to cloud?"
 * - Batch push all existing entries
 * - Mark everything as synced
 *
 * This enables multi-device experience from day 1
 */

import { getStorageProvider } from "../storage";

export interface MigrationStatus {
    isFirstLogin: boolean;
    itemsToMigrate: number;
    itemsMigrated: number;
    inProgress: boolean;
    completed: boolean;
    error?: string;
}

class MigrationManager {
    private status: MigrationStatus = {
        isFirstLogin: false,
        itemsToMigrate: 0,
        itemsMigrated: 0,
        inProgress: false,
        completed: false,
    };

    /**
     * Check if this is the user's first login
     *
     * Uses localStorage to track migration status per userId
     */
    async checkFirstLogin(userId: string): Promise<boolean> {
        const key = `migration_complete_${userId}`;
        const completed = localStorage.getItem(key);

        if (!completed) {
            this.status.isFirstLogin = true;
            return true;
        }

        this.status.isFirstLogin = false;
        return false;
    }

    /**
     * Get count of items to migrate
     *
     * Returns number of items in local storage that aren't yet synced
     */
    async getItemsToMigrate(userId: string): Promise<number> {
        const storage = getStorageProvider();

        try {
            // TODO: Get all local items not marked as SYNCED
            // const items = await storage.getItems(userId, filter: state !== SYNCED)
            // For now, return 0 - will implement when cloud storage ready
            const items: any[] = [];

            this.status.itemsToMigrate = items.length;
            return items.length;
        } catch (error) {
            console.error("Failed to count items for migration:", error);
            return 0;
        }
    }

    /**
     * Perform the initial migration
     *
     * Batch uploads all local items to cloud
     * - Reads all items from local storage
     * - Pushes to cloud in one operation
     * - Marks all as synced
     * - Never blocks UI (async operation)
     */
    async migrateVaultToCloud(userId: string, onProgress?: (current: number, total: number) => void): Promise<void> {
        if (this.status.inProgress) {
            throw new Error("Migration already in progress");
        }

        this.status.inProgress = true;
        this.status.itemsMigrated = 0;
        this.status.error = undefined;

        try {
            const storage = getStorageProvider();

            // Get all items from local storage
            // TODO: Implement storage.getAllItems() or similar
            const localItems: any[] = [];

            if (localItems.length === 0) {
                // No items to migrate
                this.markMigrationComplete(userId);
                this.status.completed = true;
                return;
            }

            this.status.itemsToMigrate = localItems.length;

            // Batch push to cloud
            // TODO: Implement cloud.batchSave(userId, items)
            // For now, simulate the process

            for (let i = 0; i < localItems.length; i++) {
                const item = localItems[i];

                try {
                    // Push item to cloud
                    // await storage.saveItem(item.id, item);

                    // Mark as synced
                    // await updateSyncMetadata(item.id, {
                    //     state: SyncState.SYNCED,
                    //     cloudUpdatedAt: Date.now(),
                    //     lastSyncAt: Date.now(),
                    // });

                    this.status.itemsMigrated = i + 1;

                    // Notify progress without blocking
                    if (onProgress) {
                        onProgress(this.status.itemsMigrated, this.status.itemsToMigrate);
                    }

                    // Yield to event loop every 10 items
                    if (i % 10 === 0) {
                        await new Promise(resolve => setTimeout(resolve, 0));
                    }
                } catch (itemError) {
                    console.error(`Failed to migrate item ${item.id}:`, itemError);
                    // Continue with next item
                }
            }

            // Mark migration as complete
            this.markMigrationComplete(userId);
            this.status.completed = true;
        } catch (error) {
            this.status.error = error instanceof Error ? error.message : String(error);
            throw error;
        } finally {
            this.status.inProgress = false;
        }
    }

    /**
     * Mark migration as complete for this user
     */
    private markMigrationComplete(userId: string): void {
        const key = `migration_complete_${userId}`;
        localStorage.setItem(key, JSON.stringify({ completedAt: Date.now() }));
    }

    /**
     * Get current migration status
     */
    getStatus(): MigrationStatus {
        return { ...this.status };
    }

    /**
     * Reset migration for testing
     */
    resetMigration(userId: string): void {
        const key = `migration_complete_${userId}`;
        localStorage.removeItem(key);
        this.status = {
            isFirstLogin: false,
            itemsToMigrate: 0,
            itemsMigrated: 0,
            inProgress: false,
            completed: false,
        };
    }
}

// Singleton instance
let instance: MigrationManager | null = null;

export function getMigrationManager(): MigrationManager {
    if (!instance) {
        instance = new MigrationManager();
    }
    return instance;
}
