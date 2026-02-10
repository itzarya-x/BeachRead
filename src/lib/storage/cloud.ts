/**
 * Cloud Storage Provider (Supabase)
 *
 * Implements cloud-first storage using Supabase PostgreSQL.
 * When authenticated, all data reads/writes go to Supabase.
 * Provides real-time subscriptions for multi-device sync.
 *
 * ENFORCEMENT: NO SILENT FALLBACKS - shows errors instead.
 * VERIFICATION: Fetches back after write to confirm success.
 * LOGGING: Loud logs for every operation.
 */

import { assertCloud, DataLog } from "@/lib/storage-mode";
import { createClient } from "@supabase/supabase-js";
import { LocalStorageProvider } from "./local";
import type { IStorageProvider, SyncRecord, Tier, TierAssignment, TierBoard, UserEntry } from "./types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export class CloudStorageProvider implements IStorageProvider {
    private supabase: any;
    private userId: string | null = null;
    private ready = false;
    private local: LocalStorageProvider;
    private subscriptions: Map<string, any> = new Map();

    constructor(userId?: string) {
        this.userId = userId || null;
        this.local = new LocalStorageProvider();

        if (supabaseUrl && supabaseAnonKey) {
            this.supabase = createClient(supabaseUrl, supabaseAnonKey);
        }
    }

    async initialize(): Promise<void> {
        // Initialize local provider first (for cache/ephemeral data)
        await this.local.initialize();

        // Only cloud operations if Supabase is configured
        if (!this.supabase || !this.userId) {
            this.ready = true;
            return;
        }

        // Test connection by fetching user's first entry
        try {
            DataLog.reading("SUPABASE");
            const { data, error } = await this.supabase
                .from("user_media")
                .select("count")
                .eq("user_id", this.userId)
                .limit(1);

            if (error && error.code !== "PGRST116") {
                throw error;
            }
            console.log("%c✅ Cloud connection verified", "color: #51cf66; font-weight: bold;");
        } catch (err) {
            DataLog.error("CloudProvider.initialize", err);
            throw new Error(`Cloud initialization failed: ${err}`);
        }

        this.ready = true;
    }

    isReady(): boolean {
        return this.ready && !!this.supabase;
    }

    // ============= Media Cache (Local Ephemeral) =============
    async getMediaCache(id: number): Promise<any | null> {
        return this.local.getMediaCache(id);
    }

    async getAllMediaCache(): Promise<Map<number, any>> {
        return this.local.getAllMediaCache();
    }

    async saveMediaCache(id: number, data: any): Promise<void> {
        return this.local.saveMediaCache(id, data);
    }

    async deleteMediaCache(id: number): Promise<void> {
        return this.local.deleteMediaCache(id);
    }

    // ============= User Entries (Cloud-First) =============
    async getUserEntry(entryId: number): Promise<UserEntry | null> {
        assertCloud("CloudStorage.getUserEntry");

        if (!this.supabase || !this.userId) {
            throw new Error("Supabase not configured");
        }

        try {
            DataLog.reading("SUPABASE");
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
            DataLog.error("getUserEntry", err);
            throw err;
        }
    }

    async getAllUserEntries(userId: number): Promise<Map<number, UserEntry>> {
        assertCloud("CloudStorage.getAllUserEntries");

        if (!this.supabase || !this.userId) {
            throw new Error("Supabase not configured");
        }

        try {
            DataLog.reading("SUPABASE");
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

            DataLog.reading("SUPABASE", entries.size);
            return entries;
        } catch (err) {
            DataLog.error("getAllUserEntries", err);
            throw err;
        }
    }

    async saveUserEntry(entry: UserEntry): Promise<void> {
        assertCloud("CloudStorage.saveUserEntry");

        if (!this.supabase || !this.userId) {
            throw new Error("Supabase not configured");
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

            DataLog.inserted("SUPABASE", entry.entryId);
            const { error } = await this.supabase.from("user_media").upsert([record], { onConflict: "id" });

            if (error) throw error;

            // Verification
            const { data: verifyData, error: verifyError } = await this.supabase
                .from("user_media")
                .select("*")
                .eq("id", entry.entryId)
                .eq("user_id", this.userId)
                .single();

            if (verifyError || !verifyData) {
                DataLog.verified(entry.entryId, "SUPABASE", false);
                throw new Error("Verification failed after insert");
            }

            DataLog.verified(entry.entryId, "SUPABASE", true);
        } catch (err) {
            DataLog.error("saveUserEntry", err);
            throw err;
        }
    }

    async deleteUserEntry(entryId: number): Promise<void> {
        assertCloud("CloudStorage.deleteUserEntry");

        if (!this.supabase || !this.userId) {
            throw new Error("Supabase not configured");
        }

        try {
            DataLog.deleted("SUPABASE", entryId, true);
            const { error } = await this.supabase
                .from("user_media")
                .update({ deleted: true, updated_at: new Date().toISOString() })
                .eq("id", entryId)
                .eq("user_id", this.userId);

            if (error) throw error;
        } catch (err) {
            DataLog.error("deleteUserEntry", err);
            throw err;
        }
    }

    async hardDeleteUserEntry(entryId: number): Promise<void> {
        assertCloud("CloudStorage.hardDeleteUserEntry");

        if (!this.supabase || !this.userId) {
            throw new Error("Supabase not configured");
        }

        try {
            DataLog.deleted("SUPABASE", entryId, false);
            const { error } = await this.supabase
                .from("user_media")
                .delete()
                .eq("id", entryId)
                .eq("user_id", this.userId);

            if (error) throw error;
        } catch (err) {
            DataLog.error("hardDeleteUserEntry", err);
            throw err;
        }
    }

    // ============= Tier Boards (Local-only for now) =============
    async getTierBoard(id: number): Promise<TierBoard | null> {
        return this.local.getTierBoard(id);
    }

    async getAllTierBoards(userId?: number): Promise<TierBoard[]> {
        return this.local.getAllTierBoards(userId);
    }

    async createTierBoard(board: Omit<TierBoard, "id" | "createdAt" | "updatedAt">): Promise<number> {
        return this.local.createTierBoard(board);
    }

    async updateTierBoard(id: number, updates: Partial<TierBoard>): Promise<void> {
        return this.local.updateTierBoard(id, updates);
    }

    async deleteTierBoard(id: number): Promise<void> {
        return this.local.deleteTierBoard(id);
    }

    // ============= Tiers (Local-only for now) =============
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

    // ============= Tier Assignments (Local-only for now) =============
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
        return this.local.saveAssignment(assignment);
    }

    async updateAssignment(id: number, updates: Partial<TierAssignment>): Promise<void> {
        return this.local.updateAssignment(id, updates);
    }

    async deleteAssignment(id: number): Promise<void> {
        return this.local.deleteAssignment(id);
    }

    // ============= Sync Tracking =============
    async recordSync(record: Omit<SyncRecord, "id">): Promise<void> {
        return this.local.recordSync(record);
    }

    async getPendingSyncs(userId: number): Promise<SyncRecord[]> {
        return this.local.getPendingSyncs(userId);
    }

    async markSynced(recordId: number): Promise<void> {
        return this.local.markSynced(recordId);
    }

    // ============= Real-time Subscriptions =============
    subscribeToUserMedia(userId: string, callback: (payload: any) => void): (() => void) | null {
        if (!this.supabase || !userId) return null;

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

            const key = `user_media:${userId}`;
            this.subscriptions.set(key, channel);

            return () => {
                this.supabase.removeChannel(channel);
                this.subscriptions.delete(key);
            };
        } catch (err) {
            console.warn("Failed to subscribe to real-time changes:", err);
            return null;
        }
    }

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
