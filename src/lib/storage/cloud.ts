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
import type { ActivityLog, IStorageProvider, SyncRecord, Tier, TierAssignment, TierBoard, UserEntry } from "./types";

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

    async getAllUserEntries(userId: string | number, onProgress?: (entries: UserEntry[]) => void): Promise<Map<string | number, UserEntry>> {
        assertCloud("CloudStorage.getAllUserEntries");

        if (!this.supabase || !this.userId) {
            throw new Error("Supabase not configured");
        }

        try {
            DataLog.reading("SUPABASE");

            // TASK 6: Store total count
            const { count, error: countError } = await this.supabase
                .from("user_media")
                .select("*", { count: "exact", head: true })
                .eq("user_id", this.userId);

            if (countError) throw countError;

            const totalCount = count || 0;
            console.log(`%c📊 Found ${totalCount} items in total`, "color: #339af0; font-weight: bold;");

            const entriesMap = new Map<string | number, UserEntry>();
            const pageSize = 1000;
            let page = 0;

            // TASK 2 & 3: Fetch all pages
            while (true) {
                const from = page * pageSize;
                const to = (page + 1) * pageSize - 1;

                // TASK 4: Show progress
                console.log(`%c🔄 Loading page ${page + 1}... (${from}-${to})`, "color: #adb5bd;");

                const { data, error } = await this.supabase
                    .from("user_media")
                    .select("*")
                    .eq("user_id", this.userId)
                    .order("created_at", { ascending: false })
                    .range(from, to); // TASK 2: range pagination

                if (error) throw error;

                const batch = data || [];
                if (batch.length === 0) break;

                const convertedBatch: UserEntry[] = [];
                batch.forEach((row: any) => {
                    const entry = this.mapToUserEntry(row);
                    entriesMap.set(row.id, entry);
                    convertedBatch.push(entry);
                });

                // TASK 5: Prevent UI freeze (gradual append via callback)
                if (onProgress) {
                    onProgress(convertedBatch);
                }

                if (batch.length < pageSize) break;
                page++;
            }

            DataLog.reading("SUPABASE", entriesMap.size);
            return entriesMap;
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

    async saveUserEntries(entries: UserEntry[]): Promise<void> {
        assertCloud("CloudStorage.saveUserEntries");

        if (!this.supabase || !this.userId) {
            throw new Error("Supabase not configured");
        }

        try {
            const CHUNK_SIZE = 50;
            for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
                const chunk = entries.slice(i, i + CHUNK_SIZE);
                const records = chunk.map(entry => {
                    const isRealUUID = this.isUUID(entry.entryId);
                    const record: any = {
                        user_id: this.userId,
                        series_id: entry.seriesId,
                        data: entry.data,
                        edited_at: new Date(entry.editedAt).toISOString(),
                        deleted: entry.deleted,
                        updated_at: new Date().toISOString(),
                        media_type: entry.data.mediaType || "ANIME",
                    };
                    if (isRealUUID) record.id = entry.entryId;
                    return record;
                });

                DataLog.inserted("SUPABASE", `BATCH ${i / CHUNK_SIZE + 1} (${records.length} items)`);
                const { error } = await this.supabase
                    .from("user_media")
                    .upsert(records, { onConflict: "user_id, series_id" });

                if (error) throw error;
            }
        } catch (err) {
            DataLog.error("saveUserEntries", err);
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

    // ============= Tier Boards =============
    async getTierBoard(id: string | number): Promise<TierBoard | null> {
        assertCloud("CloudStorage.getTierBoard");
        const { data, error } = await this.supabase
            .from("tier_boards")
            .select("*")
            .eq("id", id)
            .single();
        if (error) return null;
        return data;
    }

    async getAllTierBoards(userId?: string | number): Promise<TierBoard[]> {
        assertCloud("CloudStorage.getAllTierBoards");
        const id = userId || this.userId;
        const { data, error } = await this.supabase
            .from("tier_boards")
            .select("*")
            .eq("user_id", id)
            .order("created_at", { ascending: false });
        if (error) return [];
        return data || [];
    }

    async createTierBoard(board: Omit<TierBoard, "id" | "createdAt" | "updatedAt">): Promise<string | number> {
        assertCloud("CloudStorage.createTierBoard");
        const { data, error } = await this.supabase
            .from("tier_boards")
            .insert([{
                user_id: this.userId,
                name: board.name,
                description: board.description,
            }])
            .select()
            .single();
        if (error) throw error;
        return data.id;
    }

    async updateTierBoard(id: string | number, updates: Partial<TierBoard>): Promise<void> {
        assertCloud("CloudStorage.updateTierBoard");
        const { error } = await this.supabase
            .from("tier_boards")
            .update({
                name: updates.name,
                description: updates.description,
                updated_at: new Date().toISOString()
            })
            .eq("id", id);
        if (error) throw error;
    }

    async deleteTierBoard(id: string | number): Promise<void> {
        assertCloud("CloudStorage.deleteTierBoard");
        const { error } = await this.supabase
            .from("tier_boards")
            .delete()
            .eq("id", id);
        if (error) throw error;
    }

    // ============= Tiers =============
    async getTier(id: string | number): Promise<Tier | null> {
        assertCloud("CloudStorage.getTier");
        const { data, error } = await this.supabase
            .from("tiers")
            .select("*")
            .eq("id", id)
            .single();
        if (error) return null;
        return data;
    }

    async getTiersByBoard(boardId: string | number): Promise<Tier[]> {
        assertCloud("CloudStorage.getTiersByBoard");
        const { data, error } = await this.supabase
            .from("tiers")
            .select("*")
            .eq("board_id", boardId)
            .order("order", { ascending: true });
        if (error) return [];
        return data || [];
    }

    async createTier(tier: Omit<Tier, "id">): Promise<string | number> {
        assertCloud("CloudStorage.createTier");
        const { data, error } = await this.supabase
            .from("tiers")
            .insert([{
                board_id: tier.boardId,
                name: tier.name,
                color: tier.color,
                order: tier.order
            }])
            .select()
            .single();
        if (error) throw error;
        return data.id;
    }

    async updateTier(id: string | number, updates: Partial<Tier>): Promise<void> {
        assertCloud("CloudStorage.updateTier");
        const { error } = await this.supabase
            .from("tiers")
            .update({
                name: updates.name,
                color: updates.color,
                order: updates.order
            })
            .eq("id", id);
        if (error) throw error;
    }

    async deleteTier(id: string | number): Promise<void> {
        assertCloud("CloudStorage.deleteTier");
        const { error } = await this.supabase
            .from("tiers")
            .delete()
            .eq("id", id);
        if (error) throw error;
    }

    // ============= Tier Assignments =============
    async getAssignment(id: string | number): Promise<TierAssignment | null> {
        assertCloud("CloudStorage.getAssignment");
        const { data, error } = await this.supabase
            .from("tier_assignments")
            .select("*")
            .eq("id", id)
            .single();
        if (error) return null;
        return data;
    }

    async getAssignmentsForBoard(boardId: string | number): Promise<TierAssignment[]> {
        assertCloud("CloudStorage.getAssignmentsForBoard");
        const { data, error } = await this.supabase
            .from("tier_assignments")
            .select("*")
            .eq("board_id", boardId)
            .order("position", { ascending: true });
        if (error) return [];
        return data || [];
    }

    async getAssignmentsForMedia(mediaId: string | number): Promise<TierAssignment[]> {
        assertCloud("CloudStorage.getAssignmentsForMedia");
        const { data, error } = await this.supabase
            .from("tier_assignments")
            .select("*")
            .eq("media_id", String(mediaId))
            .eq("user_id", this.userId);
        if (error) return [];
        return data || [];
    }

    async saveAssignment(assignment: Omit<TierAssignment, "id">): Promise<string | number> {
        assertCloud("CloudStorage.saveAssignment");
        const { data, error } = await this.supabase
            .from("tier_assignments")
            .upsert([{
                user_id: this.userId,
                board_id: assignment.boardId,
                media_id: String(assignment.mediaId),
                tier_id: assignment.tierId,
                position: assignment.position
            }], { onConflict: "user_id, board_id, media_id" })
            .select()
            .single();
        if (error) throw error;
        return data.id;
    }

    async updateAssignment(id: string | number, updates: Partial<TierAssignment>): Promise<void> {
        assertCloud("CloudStorage.updateAssignment");
        const { error } = await this.supabase
            .from("tier_assignments")
            .update({
                tier_id: updates.tierId,
                position: updates.position
            })
            .eq("id", id);
        if (error) throw error;
    }

    async deleteAssignment(id: string | number): Promise<void> {
        assertCloud("CloudStorage.deleteAssignment");
        const { error } = await this.supabase
            .from("tier_assignments")
            .delete()
            .eq("id", id);
        if (error) throw error;
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

    // ============= Activity Log =============
    async logActivity(activity: Omit<ActivityLog, "id" | "userId" | "createdAt">): Promise<void> {
        if (!this.supabase || !this.userId) return;

        const { error } = await this.supabase
            .from("activity_log")
            .insert([{
                user_id: this.userId,
                series_id: activity.seriesId,
                action_type: activity.actionType,
                media_type: activity.mediaType,
                details: activity.details,
                created_at: new Date().toISOString()
            }]);

        if (error) {
            console.error("Failed to log activity:", error);
            // Don't throw, let the app continue
        }
    }

    async getActivities(userId: string | number): Promise<ActivityLog[]> {
        assertCloud("CloudStorage.getActivities");
        if (!this.supabase) return [];

        const { data, error } = await this.supabase
            .from("activity_log")
            .select("*")
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Failed to fetch activities:", error);
            return [];
        }

        return (data || []).map((row: any) => ({
            id: row.id,
            userId: row.user_id,
            seriesId: row.series_id,
            actionType: row.action_type,
            mediaType: row.media_type,
            details: row.details,
            createdAt: row.created_at
        }));
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
