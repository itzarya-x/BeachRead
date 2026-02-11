/**
 * Local Storage Provider (IndexedDB)
 *
 * Wraps existing IndexedDB logic for the storage abstraction layer.
 * This remains the primary storage - always works offline.
 *
 * ENFORCEMENT: Blocks access if user is authenticated (cloud-only).
 */

import {
    deleteUserEntry as dbDeleteUserEntry,
    getAllMediaCache as dbGetAllMediaCache,
    getAllUserEntries as dbGetAllUserEntries,
    getMediaCache as dbGetMediaCache,
    getUserEntry as dbGetUserEntry,
    hardDeleteUserEntry as dbHardDeleteUserEntry,
    saveMediaCache as dbSaveMediaCache,
    saveUserEntry as dbSaveUserEntry,
    initDatabase as initDB,
    type UserEntry,
} from "@/lib/database";
import { assertNotCloud } from "@/lib/storage-mode";

import {
    createTier as dbCreateTier,
    createTierBoard as dbCreateTierBoard,
    deleteAssignment as dbDeleteAssignment,
    deleteTier as dbDeleteTier,
    deleteTierBoard as dbDeleteTierBoard,
    getAllTierBoards as dbGetAllTierBoards,
    getAssignmentsForBoard as dbGetAssignmentsForBoard,
    getAssignmentsForMedia as dbGetAssignmentsForMedia,
    getTierBoard as dbGetTierBoard,
    getTiersForBoard as dbGetTiersByBoard,
    saveAssignment as dbSaveAssignment,
    updateTier as dbUpdateTier,
    updateTierBoard as dbUpdateTierBoard,
    type Tier,
    type TierAssignment,
    type TierBoard,
} from "@/lib/tierDatabase";

import type { IStorageProvider, SyncRecord } from "./types";

export class LocalStorageProvider implements IStorageProvider {
    private ready = false;

    async initialize(): Promise<void> {
        await initDB();
        this.ready = true;
    }

    isReady(): boolean {
        return this.ready;
    }

    // ============= Media Cache =============
    async getMediaCache(id: number): Promise<any | null> {
        return dbGetMediaCache(id);
    }

    async getAllMediaCache(): Promise<Map<number, any>> {
        return dbGetAllMediaCache();
    }

    async saveMediaCache(id: number, data: any): Promise<void> {
        return dbSaveMediaCache(id, data);
    }

    async deleteMediaCache(id: number): Promise<void> {
        const db = await initDB();
        const transaction = db.transaction(["media_cache"], "readwrite");
        const store = transaction.objectStore("media_cache");

        await new Promise<void>((resolve, reject) => {
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    // ============= User Entries =============
    async getUserEntry(entryId: string | number): Promise<UserEntry | null> {
        assertNotCloud("LocalStorage.getUserEntry");
        return dbGetUserEntry(entryId);
    }

    async getAllUserEntries(userId: string | number): Promise<Map<string | number, UserEntry>> {
        assertNotCloud("LocalStorage.getAllUserEntries");
        return dbGetAllUserEntries(userId);
    }

    async saveUserEntry(entry: UserEntry): Promise<string | number> {
        assertNotCloud("LocalStorage.saveUserEntry");
        return dbSaveUserEntry(entry);
    }

    async deleteUserEntry(entryId: string | number): Promise<void> {
        assertNotCloud("LocalStorage.deleteUserEntry");
        return dbDeleteUserEntry(entryId);
    }

    async hardDeleteUserEntry(entryId: string | number): Promise<void> {
        assertNotCloud("LocalStorage.hardDeleteUserEntry");
        return dbHardDeleteUserEntry(entryId);
    }

    // ============= Tier Boards =============
    async getTierBoard(id: string | number): Promise<TierBoard | null> {
        return dbGetTierBoard(id);
    }

    async getAllTierBoards(userId?: string | number): Promise<TierBoard[]> {
        // Note: Local storage doesn't filter by userId - all boards are available
        return dbGetAllTierBoards();
    }

    async createTierBoard(board: Omit<TierBoard, "id" | "createdAt" | "updatedAt">): Promise<string | number> {
        return dbCreateTierBoard(board);
    }

    async updateTierBoard(id: string | number, updates: Partial<TierBoard>): Promise<void> {
        return dbUpdateTierBoard(id, updates);
    }

    async deleteTierBoard(id: string | number): Promise<void> {
        return dbDeleteTierBoard(id);
    }

    // ============= Tiers =============
    async getTier(id: string | number): Promise<Tier | null> {
        // TODO: Implement getTier in tierDatabase
        return null;
    }

    async getTiersByBoard(boardId: string | number): Promise<Tier[]> {
        return dbGetTiersByBoard(boardId);
    }

    async createTier(tier: Omit<Tier, "id">): Promise<string | number> {
        return dbCreateTier(tier);
    }

    async updateTier(id: string | number, updates: Partial<Tier>): Promise<void> {
        return dbUpdateTier(id, updates);
    }

    async deleteTier(id: string | number): Promise<void> {
        return dbDeleteTier(id);
    }

    // ============= Tier Assignments =============
    async getAssignment(id: string | number): Promise<TierAssignment | null> {
        // TODO: Implement getAssignment in tierDatabase
        return null;
    }

    async getAssignmentsForBoard(boardId: string | number): Promise<TierAssignment[]> {
        return dbGetAssignmentsForBoard(boardId);
    }

    async getAssignmentsForMedia(mediaId: string | number): Promise<TierAssignment[]> {
        return dbGetAssignmentsForMedia(mediaId);
    }

    async saveAssignment(assignment: Omit<TierAssignment, "id">): Promise<string | number> {
        return dbSaveAssignment(assignment);
    }

    async updateAssignment(id: string | number, updates: Partial<TierAssignment>): Promise<void> {
        // TODO: Implement updateAssignment in tierDatabase
    }

    async deleteAssignment(id: string | number): Promise<void> {
        return dbDeleteAssignment(id);
    }

    // ============= Sync Operations (No-op for local storage) =============
    async recordSync(record: Omit<SyncRecord, "id">): Promise<void> {
        // Local storage doesn't need sync tracking
    }

    async getPendingSyncs(userId: string | number): Promise<SyncRecord[]> {
        // No pending syncs for local storage
        return [];
    }

    async markSynced(recordId: string | number): Promise<void> {
        // No-op
    }

    // ============= Settings Operations (No-op for now) =============
    async getSetting(userId: number, key: string): Promise<any | null> {
        // To be implemented if needed
        return null;
    }

    async setSetting(userId: number, key: string, value: any): Promise<void> {
        // To be implemented if needed
    }
}
