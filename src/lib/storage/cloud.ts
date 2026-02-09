/**
 * Cloud Storage Provider (Supabase)
 *
 * Stub implementation for Phase 2.
 * Will implement sync & cloud operations when Supabase is set up.
 *
 * For now, delegates to local storage to ensure app continues working offline.
 */

import { LocalStorageProvider } from "./local";
import type { IStorageProvider, SyncRecord, Tier, TierAssignment, TierBoard, UserEntry } from "./types";

export class CloudStorageProvider implements IStorageProvider {
    private local: LocalStorageProvider;
    private ready = false;

    constructor() {
        this.local = new LocalStorageProvider();
    }

    async initialize(): Promise<void> {
        // Initialize local first (required for offline support)
        await this.local.initialize();

        // TODO: Initialize Supabase client when ready
        // const { createClient } = await import("@supabase/supabase-js");
        // this.supabase = createClient(url, key);
        // await this.setupAuthListener();

        this.ready = true;
    }

    isReady(): boolean {
        return this.ready && this.local.isReady();
    }

    // ============= Media Cache =============
    async getMediaCache(id: number): Promise<any | null> {
        // TODO: Try cloud first, fallback to local
        return this.local.getMediaCache(id);
    }

    async getAllMediaCache(): Promise<Map<number, any>> {
        return this.local.getAllMediaCache();
    }

    async saveMediaCache(id: number, data: any): Promise<void> {
        // Save to local first (required for offline)
        await this.local.saveMediaCache(id, data);

        // TODO: Queue for cloud sync
        // await this.recordSync("media_cache", id, "create");
    }

    async deleteMediaCache(id: number): Promise<void> {
        await this.local.deleteMediaCache(id);
        // TODO: Queue for cloud sync
    }

    // ============= User Entries =============
    async getUserEntry(entryId: number): Promise<UserEntry | null> {
        return this.local.getUserEntry(entryId);
    }

    async getAllUserEntries(userId: number): Promise<Map<number, UserEntry>> {
        return this.local.getAllUserEntries(userId);
    }

    async saveUserEntry(entry: UserEntry): Promise<void> {
        await this.local.saveUserEntry(entry);
        // TODO: Queue for cloud sync
    }

    async deleteUserEntry(entryId: number): Promise<void> {
        await this.local.deleteUserEntry(entryId);
        // TODO: Queue for cloud sync
    }

    async hardDeleteUserEntry(entryId: number): Promise<void> {
        await this.local.hardDeleteUserEntry(entryId);
        // TODO: Queue for cloud sync
    }

    // ============= Tier Boards =============
    async getTierBoard(id: number): Promise<TierBoard | null> {
        return this.local.getTierBoard(id);
    }

    async getAllTierBoards(userId?: number): Promise<TierBoard[]> {
        // TODO: Fetch from cloud when available
        return this.local.getAllTierBoards(userId);
    }

    async createTierBoard(board: Omit<TierBoard, "id" | "createdAt" | "updatedAt">): Promise<number> {
        const id = await this.local.createTierBoard(board);
        // TODO: Queue for cloud sync
        return id;
    }

    async updateTierBoard(id: number, updates: Partial<TierBoard>): Promise<void> {
        await this.local.updateTierBoard(id, updates);
        // TODO: Queue for cloud sync
    }

    async deleteTierBoard(id: number): Promise<void> {
        await this.local.deleteTierBoard(id);
        // TODO: Queue for cloud sync
    }

    // ============= Tiers =============
    async getTier(id: number): Promise<Tier | null> {
        return this.local.getTier(id);
    }

    async getTiersByBoard(boardId: number): Promise<Tier[]> {
        return this.local.getTiersByBoard(boardId);
    }

    async createTier(tier: Omit<Tier, "id">): Promise<number> {
        const id = await this.local.createTier(tier);
        // TODO: Queue for cloud sync
        return id;
    }

    async updateTier(id: number, updates: Partial<Tier>): Promise<void> {
        await this.local.updateTier(id, updates);
        // TODO: Queue for cloud sync
    }

    async deleteTier(id: number): Promise<void> {
        await this.local.deleteTier(id);
        // TODO: Queue for cloud sync
    }

    // ============= Tier Assignments =============
    async getAssignment(id: number): Promise<TierAssignment | null> {
        return this.local.getAssignment(id);
    }

    async getAssignmentsForBoard(boardId: number): Promise<TierAssignment[]> {
        return this.local.getAssignmentsForBoard(boardId);
    }

    async getAssignmentsForMedia(mediaId: number): Promise<TierAssignment[]> {
        return this.local.getAssignmentsForMedia(mediaId);
    }

    async saveAssignment(assignment: Omit<TierAssignment, "id">): Promise<number> {
        const id = await this.local.saveAssignment(assignment);
        // TODO: Queue for cloud sync
        return id;
    }

    async updateAssignment(id: number, updates: Partial<TierAssignment>): Promise<void> {
        await this.local.updateAssignment(id, updates);
        // TODO: Queue for cloud sync
    }

    async deleteAssignment(id: number): Promise<void> {
        await this.local.deleteAssignment(id);
        // TODO: Queue for cloud sync
    }

    // ============= Sync Operations =============
    async recordSync(record: Omit<SyncRecord, "id">): Promise<void> {
        // TODO: Store in sync queue table
        console.log("[SYNC] Recording:", record);
    }

    async getPendingSyncs(userId: number): Promise<SyncRecord[]> {
        // TODO: Query sync queue table
        return [];
    }

    async markSynced(recordId: number): Promise<void> {
        // TODO: Update sync record
    }

    // ============= Settings Operations =============
    async getSetting(userId: number, key: string): Promise<any | null> {
        // TODO: Fetch from Supabase settings table
        return null;
    }

    async setSetting(userId: number, key: string, value: any): Promise<void> {
        // TODO: Save to Supabase settings table
    }
}
