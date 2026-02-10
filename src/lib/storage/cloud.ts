/**
 * Cloud Storage Provider (Supabase)
 *
 * Implements cloud-first storage using Supabase PostgreSQL.
 * When authenticated, all data reads/writes go to Supabase.
 * Provides real-time subscriptions for multi-device sync.
 *
 * Fallback to local storage when cloud operations fail (offline support).
 */

import { createClient } from "@supabase/supabase-js";
import { LocalStorageProvider } from "./local";
import type { IStorageProvider, SyncRecord, Tier, TierAssignment, TierBoard, UserEntry } from "./types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export class CloudStorageProvider implements IStorageProvider {
    private local: LocalStorageProvider;
    private supabase: any;
    private userId: string | null = null;
    private ready = false;
    private subscriptions: Map<string, any> = new Map();

    constructor(userId?: string) {
        this.local = new LocalStorageProvider();
        this.userId = userId || null;

        if (supabaseUrl && supabaseAnonKey) {
            this.supabase = createClient(supabaseUrl, supabaseAnonKey);
        }
    }

    async initialize(): Promise<void> {
        // Initialize local first (required for offline support)
        await this.local.initialize();

        // Only cloud operations if Supabase is configured
        if (!this.supabase || !this.userId) {
            this.ready = true;
            return;
        }

        // Test connection by fetching user's first entry
        try {
            const { data, error } = await this.supabase
                .from("user_media")
                .select("count")
                .eq("user_id", this.userId)
                .limit(1);

            if (error && error.code !== "PGRST116") {
                console.warn("Cloud provider connection issue, using local fallback:", error);
            }
        } catch (err) {
            console.warn("Cloud provider initialization failed, using local fallback:", err);
        }

        this.ready = true;
    }

    isReady(): boolean {
        return this.ready && this.local.isReady();
    }

    // ============= Media Cache =============
    async getMediaCache(id: number): Promise<any | null> {
        // Media cache is local-only (ephemeral)
        return this.local.getMediaCache(id);
    }

    async getAllMediaCache(): Promise<Map<number, any>> {
        return this.local.getAllMediaCache();
    }

    async saveMediaCache(id: number, data: any): Promise<void> {
        // Save to local only (ephemeral cache)
        await this.local.saveMediaCache(id, data);
    }

    async deleteMediaCache(id: number): Promise<void> {
        await this.local.deleteMediaCache(id);
    }

    // ============= User Entries (Cloud-First) =============
    async getUserEntry(entryId: number): Promise<UserEntry | null> {
        if (!this.supabase || !this.userId) {
            return this.local.getUserEntry(entryId);
        }

        try {
            const { data, error } = await this.supabase
                .from("user_media")
                .select("*")
                .eq("id", entryId)
                .eq("user_id", this.userId)
                .single();

            if (error) throw error;
            if (!data) return null;

            return this.mapToUserEntry(data);
        } catch (err) {
            console.warn("Failed to fetch user entry from cloud, using local:", err);
            return this.local.getUserEntry(entryId);
        }
    }

    async getAllUserEntries(userId: number): Promise<Map<number, UserEntry>> {
        if (!this.supabase || !this.userId) {
            return this.local.getAllUserEntries(userId);
        }

        try {
            const { data, error } = await this.supabase
                .from("user_media")
                .select("*")
                .eq("user_id", this.userId)
                .order("created_at", { ascending: false });

            if (error) throw error;

            const entries = new Map<number, UserEntry>();
            (data || []).forEach((row: any) => {
                entries.set(row.id, this.mapToUserEntry(row));
            });

            // Save to local as cache
            for (const [, entry] of entries) {
                await this.local.saveUserEntry(entry);
            }

            return entries;
        } catch (err) {
            console.warn("Failed to fetch all entries from cloud, using local:", err);
            return this.local.getAllUserEntries(userId);
        }
    }

    async saveUserEntry(entry: UserEntry): Promise<void> {
        if (!this.supabase || !this.userId) {
            return this.local.saveUserEntry(entry);
        }

        try {
            const record = {
                id: entry.entryId,
                user_id: this.userId,
                series_id: entry.seriesId,
                data: entry.data,
                edited_at: new Date(entry.editedAt).toISOString(),
                deleted: entry.deleted,
                updated_at: new Date().toISOString(),
            };

            const { error } = await this.supabase.from("user_media").upsert([record], { onConflict: "id" });

            if (error) throw error;

            // Also save locally as cache
            await this.local.saveUserEntry(entry);
        } catch (err) {
            console.warn("Failed to save entry to cloud, saving to local:", err);
            await this.local.saveUserEntry(entry);
        }
    }

    async deleteUserEntry(entryId: number): Promise<void> {
        if (!this.supabase || !this.userId) {
            return this.local.deleteUserEntry(entryId);
        }

        try {
            // Soft delete in cloud
            const { error } = await this.supabase
                .from("user_media")
                .update({ deleted: true, updated_at: new Date().toISOString() })
                .eq("id", entryId)
                .eq("user_id", this.userId);

            if (error) throw error;
            await this.local.deleteUserEntry(entryId);
        } catch (err) {
            console.warn("Failed to delete entry from cloud, deleting from local:", err);
            await this.local.deleteUserEntry(entryId);
        }
    }

    async hardDeleteUserEntry(entryId: number): Promise<void> {
        if (!this.supabase || !this.userId) {
            return this.local.hardDeleteUserEntry(entryId);
        }

        try {
            // Hard delete from cloud
            const { error } = await this.supabase
                .from("user_media")
                .delete()
                .eq("id", entryId)
                .eq("user_id", this.userId);

            if (error) throw error;
            await this.local.hardDeleteUserEntry(entryId);
        } catch (err) {
            console.warn("Failed to hard delete entry from cloud, deleting from local:", err);
            await this.local.hardDeleteUserEntry(entryId);
        }
    }

    // ============= Tier Boards =============
    async getTierBoard(id: number): Promise<TierBoard | null> {
        return this.local.getTierBoard(id);
    }

    async getAllTierBoards(userId?: number): Promise<TierBoard[]> {
        // Tier boards are local-only for now
        return this.local.getAllTierBoards(userId);
    }

    async createTierBoard(board: Omit<TierBoard, "id" | "createdAt" | "updatedAt">): Promise<number> {
        const id = await this.local.createTierBoard(board);
        return id;
    }

    async updateTierBoard(id: number, updates: Partial<TierBoard>): Promise<void> {
        return this.local.updateTierBoard(id, updates);
    }

    async deleteTierBoard(id: number): Promise<void> {
        return this.local.deleteTierBoard(id);
    }

    // ============= Tiers =============
    async getTier(id: number): Promise<Tier | null> {
        return this.local.getTier(id);
    }

    async getTiersByBoard(boardId: number): Promise<Tier[]> {
        return this.local.getTiersByBoard(boardId);
    }

    async createTier(tier: Omit<Tier, "id">): Promise<number> {
        return this.local.createTier(tier);
    }

    async updateTier(id: number, updates: Partial<Tier>): Promise<void> {
        return this.local.updateTier(id, updates);
    }

    async deleteTier(id: number): Promise<void> {
        return this.local.deleteTier(id);
    }

    // ============= Tier Assignments =============
    async getTierAssignment(id: number): Promise<TierAssignment | null> {
        return this.local.getTierAssignment(id);
    }

    async getTierAssignmentsByBoard(boardId: number): Promise<TierAssignment[]> {
        return this.local.getTierAssignmentsByBoard(boardId);
    }

    async createTierAssignment(assignment: Omit<TierAssignment, "id">): Promise<number> {
        return this.local.createTierAssignment(assignment);
    }

    async updateTierAssignment(id: number, updates: Partial<TierAssignment>): Promise<void> {
        return this.local.updateTierAssignment(id, updates);
    }

    async deleteTierAssignment(id: number): Promise<void> {
        return this.local.deleteTierAssignment(id);
    }

    // ============= Sync Tracking =============
    async recordSync(table: string, recordId: number, operation: string): Promise<void> {
        return this.local.recordSync(table, recordId, operation);
    }

    async getSyncRecords(): Promise<SyncRecord[]> {
        return this.local.getSyncRecords();
    }

    async clearSyncRecords(): Promise<void> {
        return this.local.clearSyncRecords();
    }

    // ============= Real-time Subscriptions =============
    /**
     * Subscribe to real-time changes for user's media entries
     * Enables multi-device sync
     */
    subscribeToUserMedia(userId: string, callback: (payload: any) => void): (() => void) | null {
        if (!this.supabase || !userId) {
            return null;
        }

        try {
            const channel = this.supabase
                .channel(`user_media:${userId}`)
                .on(
                    "postgres_changes",
                    {
                        event: "*",
                        schema: "public",
                        table: "user_media",
                        filter: `user_id=eq.${userId}`,
                    },
                    callback,
                )
                .subscribe();

            // Store subscription for cleanup
            const key = `user_media:${userId}`;
            this.subscriptions.set(key, channel);

            // Return unsubscribe function
            return () => {
                this.supabase.removeChannel(channel);
                this.subscriptions.delete(key);
            };
        } catch (err) {
            console.warn("Failed to subscribe to real-time changes:", err);
            return null;
        }
    }

    /**
     * Unsubscribe from all real-time subscriptions
     */
    unsubscribeAll(): void {
        this.subscriptions.forEach(channel => {
            try {
                this.supabase?.removeChannel(channel);
            } catch (err) {
                console.warn("Failed to unsubscribe from channel:", err);
            }
        });
        this.subscriptions.clear();
    }

    // ============= Helpers =============
    private mapToUserEntry(row: any): UserEntry {
        return {
            entryId: row.id,
            seriesId: row.series_id,
            userId: row.user_id,
            data: row.data,
            editedAt: new Date(row.edited_at).getTime(),
            deleted: row.deleted || false,
        };
    }
}
