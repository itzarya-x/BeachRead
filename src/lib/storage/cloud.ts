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
    private isUUID(id: any): boolean {
        if (typeof id !== "string") return false;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return uuidRegex.test(id);
    }

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
            const { error } = await this.supabase
                .from("user_media")
                .select("id")
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

    // ============= Media Cache (HARD BLOCK in Cloud Mode) =============
    async getMediaCache(id: number): Promise<any | null> {
        throw new Error("❌ CLOUD SECURITY VIOLATION: IndexedDB cache read blocked in authenticated mode.");
    }

    async getAllMediaCache(): Promise<Map<number, any>> {
        throw new Error("❌ CLOUD SECURITY VIOLATION: IndexedDB cache read blocked in authenticated mode.");
    }

    async saveMediaCache(id: number, data: any): Promise<void> {
        // We allow saving in-memory, but not to IndexedDB if strict
        // For now, satisfy the "Hard Block" requirement
        throw new Error("❌ CLOUD SECURITY VIOLATION: IndexedDB cache write blocked in authenticated mode.");
    }

    async deleteMediaCache(id: number): Promise<void> {
        throw new Error("❌ CLOUD SECURITY VIOLATION: IndexedDB cache delete blocked in authenticated mode.");
    }

    // ============= User Entries (Cloud-First) =============
    async getUserEntry(entryId: string | number): Promise<UserEntry | null> {
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

    async getAllUserEntries(userId: string | number): Promise<Map<string | number, UserEntry>> {
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

            const entries = new Map<string | number, UserEntry>();
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

    async saveUserEntry(entry: UserEntry): Promise<string | number> {
        assertCloud("CloudStorage.saveUserEntry");

        if (!this.supabase || !this.userId) {
            throw new Error("Supabase not configured");
        }

        try {
            // TASK 7 & 4: Safety log and UUID check
            const isRealUUID = this.isUUID(entry.entryId);
            if (!isRealUUID && entry.entryId !== 0) {
                console.warn(`%c⚠️ Safety: Entry ID "${entry.entryId}" is not a valid UUID. Removing from payload.`, "color: #fcc419;");
            }

            const record: any = {
                user_id: this.userId,
                series_id: entry.seriesId,
                data: entry.data,
                edited_at: new Date(entry.editedAt).toISOString(),
                deleted: entry.deleted,
                updated_at: new Date().toISOString(),
                media_type: entry.data.mediaType || "ANIME",
            };

            // TASK 1: Remove id from create payload (only keep if it's a real UUID)
            if (isRealUUID) {
                record.id = entry.entryId;
            }

            DataLog.inserted("SUPABASE", isRealUUID ? entry.entryId : "NEW (AUTO-UUID)");
            
            // TASK 2 & 3: Use upsert with conflict on (user_id, series_id) to let DB generate ID
            const { data, error } = await this.supabase
                .from("user_media")
                .upsert([record], { onConflict: "user_id, series_id" })
                .select();

            if (error) throw error;
            if (!data || data.length === 0) throw new Error("No data returned from Supabase after save");

            const savedRecord = data[0];
            const newId = savedRecord.id;

            // Verification
            const { data: verifyData, error: verifyError } = await this.supabase
                .from("user_media")
                .select("*")
                .eq("id", newId)
                .eq("user_id", this.userId)
                .single();

            if (verifyError || !verifyData) {
                DataLog.verified(newId, "SUPABASE", false);
                throw new Error("Verification failed after insert");
            }

            DataLog.verified(newId, "SUPABASE", true);
            return newId;
        } catch (err) {
            DataLog.error("saveUserEntry", err);
            throw err;
        }
    }

    async deleteUserEntry(entryId: string | number): Promise<void> {
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

    async hardDeleteUserEntry(entryId: string | number): Promise<void> {
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
    async getTierBoard(id: string | number): Promise<TierBoard | null> {
        return this.local.getTierBoard(id);
    }

    async getAllTierBoards(userId?: string | number): Promise<TierBoard[]> {
        return this.local.getAllTierBoards(userId);
    }

    async createTierBoard(board: Omit<TierBoard, "id" | "createdAt" | "updatedAt">): Promise<string | number> {
        return this.local.createTierBoard(board);
    }

    async updateTierBoard(id: string | number, updates: Partial<TierBoard>): Promise<void> {
        return this.local.updateTierBoard(id, updates);
    }

    async deleteTierBoard(id: string | number): Promise<void> {
        return this.local.deleteTierBoard(id);
    }

    // ============= Tiers (Local-only for now) =============
    async getTier(id: string | number): Promise<Tier | null> {
        return this.local.getTier(id);
    }

    async getTiersByBoard(boardId: string | number): Promise<Tier[]> {
        return this.local.getTiersByBoard(boardId);
    }

    async createTier(tier: Omit<Tier, "id">): Promise<string | number> {
        return this.local.createTier(tier);
    }

    async updateTier(id: string | number, updates: Partial<Tier>): Promise<void> {
        return this.local.updateTier(id, updates);
    }

    async deleteTier(id: string | number): Promise<void> {
        return this.local.deleteTier(id);
    }

    // ============= Tier Assignments (Local-only for now) =============
    async getAssignment(id: string | number): Promise<TierAssignment | null> {
        return this.local.getAssignment(id);
    }

    async getAssignmentsForBoard(boardId: string | number): Promise<TierAssignment[]> {
        return this.local.getAssignmentsForBoard(boardId);
    }

    async getAssignmentsForMedia(mediaId: string | number): Promise<TierAssignment[]> {
        return this.local.getAssignmentsForMedia(mediaId);
    }

    async saveAssignment(assignment: Omit<TierAssignment, "id">): Promise<string | number> {
        return this.local.saveAssignment(assignment);
    }

    async updateAssignment(id: string | number, updates: Partial<TierAssignment>): Promise<void> {
        return this.local.updateAssignment(id, updates);
    }

    async deleteAssignment(id: string | number): Promise<void> {
        return this.local.deleteAssignment(id);
    }

    // ============= Sync Tracking =============
    async recordSync(record: Omit<SyncRecord, "id">): Promise<void> {
        return this.local.recordSync(record);
    }

    async getPendingSyncs(userId: string | number): Promise<SyncRecord[]> {
        return this.local.getPendingSyncs(userId);
    }

    async markSynced(recordId: string | number): Promise<void> {
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
            editedAt: new Date(row.edited_at || row.updated_at || row.created_at || new Date()).getTime(),
            deleted: row.deleted || false,
        };
    }
}
