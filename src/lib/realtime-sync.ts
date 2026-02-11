/**
 * Real-Time Sync Manager
 *
 * Manages real-time synchronization between multiple devices via Supabase.
 * Listens to remote changes and updates local store.
 * Enables multi-device synchronization where all devices show identical vault.
 */

import { getMediaStoreState } from "@/store/mediaStore";
import type { DisplayMedia } from "@/types/display";
import { createClient } from "@supabase/supabase-js";
import { getCachedMedia } from "./anilist-api";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

interface RealtimeSyncConfig {
    userId: string;
    onInsert?: (entry: DisplayMedia) => void;
    onUpdate?: (entryId: string | number, updates: Partial<DisplayMedia>) => void;
    onDelete?: (entryId: string | number) => void;
    onError?: (error: Error) => void;
}

export class RealtimeSyncManager {
    private supabase: any;
    private subscription: any = null;
    private userId: string | null = null;
    private config: RealtimeSyncConfig | null = null;
    private isProcessing = false;

    constructor() {
        if (supabaseUrl && supabaseAnonKey) {
            this.supabase = createClient(supabaseUrl, supabaseAnonKey);
        }
    }

    /**
     * Start listening to real-time changes for a user
     */
    async startSync(config: RealtimeSyncConfig): Promise<void> {
        if (!this.supabase) {
            console.warn("Supabase not configured, skipping real-time sync");
            return;
        }

        if (this.subscription) {
            console.warn("Real-time sync already active, stopping previous");
            await this.stopSync();
        }

        this.userId = config.userId;
        this.config = config;

        try {
            // Subscribe to all changes (INSERT, UPDATE, DELETE) for user's media
            this.subscription = this.supabase
                .channel(`user_media:${config.userId}`)
                .on(
                    "postgres_changes",
                    {
                        event: "INSERT",
                        schema: "public",
                        table: "user_media",
                        filter: `user_id=eq.${config.userId}`,
                    },
                    (payload: any) => this.handleInsert(payload),
                )
                .on(
                    "postgres_changes",
                    {
                        event: "UPDATE",
                        schema: "public",
                        table: "user_media",
                        filter: `user_id=eq.${config.userId}`,
                    },
                    (payload: any) => this.handleUpdate(payload),
                )
                .on(
                    "postgres_changes",
                    {
                        event: "DELETE",
                        schema: "public",
                        table: "user_media",
                        filter: `user_id=eq.${config.userId}`,
                    },
                    (payload: any) => this.handleDelete(payload),
                )
                .subscribe((status: string) => {
                    console.log(`[SYNC] Channel status: ${status}`);
                    if (status === "CLOSED") {
                        console.warn("[SYNC] Real-time channel closed");
                    }
                });

            console.log(`[SYNC] Real-time sync started for user ${config.userId}`);
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            console.error("[SYNC] Failed to start real-time sync:", error);
            this.config?.onError?.(error);
        }
    }

    /**
     * Stop listening to real-time changes
     */
    async stopSync(): Promise<void> {
        if (this.subscription) {
            try {
                await this.supabase?.removeChannel(this.subscription);
                this.subscription = null;
                console.log("[SYNC] Real-time sync stopped");
            } catch (err) {
                console.warn("[SYNC] Error stopping real-time sync:", err);
            }
        }

        this.userId = null;
        this.config = null;
    }

    /**
     * Handle INSERT events (new entries from other devices)
     */
    private async handleInsert(payload: any): Promise<void> {
        if (this.isProcessing) return;

        try {
            this.isProcessing = true;
            const record = payload.new;

            if (!record || !record.id) return;

            // Enrich entry with cached data
            const entry = await this.mapToDisplayMedia(record, "INSERT");
            if (!entry) return;

            // Update store
            const { addEntry: storeAddEntry } = getMediaStoreState();
            storeAddEntry(entry);

            // Notify callback
            this.config?.onInsert?.(entry);

            console.log(`[SYNC] Inserted entry: ${record.id}`);
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            console.error("[SYNC] Error handling insert:", error);
            this.config?.onError?.(error);
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Handle UPDATE events (edits from other devices)
     */
    private async handleUpdate(payload: any): Promise<void> {
        if (this.isProcessing) return;

        try {
            this.isProcessing = true;
            const record = payload.new;

            if (!record || !record.id) return;

            // Check if this is a soft delete
            if (record.deleted) {
                // Handle as delete
                const { deleteEntry: storeDeleteEntry } = getMediaStoreState();
                storeDeleteEntry(record.id);
                this.config?.onDelete?.(record.id);
                return;
            }

            // Extract only user-editable fields from update
            const updates: Partial<DisplayMedia> = {};
            const userEditableFields = [
                "status",
                "score",
                "progress",
                "progressVolumes",
                "repeat",
                "priority",
                "tierId",
                "isPrivate",
                "notes",
                "customLists",
                "startedAt",
                "completedAt",
                "advancedScores",
                "hiddenDefault",
            ];

            userEditableFields.forEach(field => {
                if (field in record.data) {
                    (updates as any)[field] = record.data[field];
                }
            });

            // Update store
            const { updateEntry: storeUpdateEntry } = getMediaStoreState();
            storeUpdateEntry(record.id, updates);

            // Notify callback
            this.config?.onUpdate?.(record.id, updates);

            console.log(`[SYNC] Updated entry: ${record.id}`);
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            console.error("[SYNC] Error handling update:", error);
            this.config?.onError?.(error);
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Handle DELETE events (deletions from other devices)
     */
    private async handleDelete(payload: any): Promise<void> {
        if (this.isProcessing) return;

        try {
            this.isProcessing = true;
            const record = payload.old;

            if (!record || !record.id) return;

            // Remove from store
            const { deleteEntry: storeDeleteEntry } = getMediaStoreState();
            storeDeleteEntry(record.id);

            // Notify callback
            this.config?.onDelete?.(record.id);

            console.log(`[SYNC] Deleted entry: ${record.id}`);
        } catch (err) {
            const error = err instanceof Error ? err : new Error(String(err));
            console.error("[SYNC] Error handling delete:", error);
            this.config?.onError?.(error);
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Convert Supabase record to DisplayMedia
     */
    private async mapToDisplayMedia(record: any, event: string): Promise<DisplayMedia | null> {
        try {
            const cached = getCachedMedia(record.series_id);

            const media: DisplayMedia = {
                // User-editable fields from cloud
                status: record.data?.status || "PLANNING",
                score: record.data?.score ?? 0,
                progress: record.data?.progress ?? 0,
                progressVolumes: record.data?.progressVolumes ?? 0,
                repeat: record.data?.repeat ?? 0,
                priority: record.data?.priority ?? 0,
                tierId: record.data?.tierId ?? null,
                isPrivate: record.data?.isPrivate ?? false,
                notes: record.data?.notes ?? null,
                customLists: record.data?.customLists || [],
                startedAt: record.data?.startedAt ?? null,
                completedAt: record.data?.completedAt ?? null,
                advancedScores: record.data?.advancedScores || [],
                hiddenDefault: record.data?.hiddenDefault ?? false,

                // Enriched fields from cache
                title: cached?.title || { romaji: "Unknown", english: null, native: null },
                coverImage: cached?.coverImage?.large || cached?.coverImage?.medium || null,
                bannerImage: cached?.bannerImage || null,
                format: cached?.format || null,
                episodes: cached?.episodes ?? null,
                chapters: cached?.chapters ?? null,
                volumes: cached?.volumes ?? null,
                genres: cached?.genres || [],
                season: cached?.season || null,
                seasonYear: cached?.seasonYear ?? null,
                description: cached?.description || null,
                originType: cached?.countryOfOrigin ? this.mapCountryToOriginType(cached.countryOfOrigin) : "manga",

                // Metadata
                mediaType: record.data?.mediaType || "ANIME",
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                _seriesId: record.series_id,
                _entryId: record.id,
                _userId: record.user_id,
                _enriched: !!cached,
            };

            return media;
        } catch (err) {
            console.error("[SYNC] Error mapping record to DisplayMedia:", err);
            return null;
        }
    }

    /**
     * Map country code to origin type
     */
    private mapCountryToOriginType(countryOfOrigin: string): "manga" | "manhua" | "manhwa" {
        if (!countryOfOrigin) return "manga";
        const country = countryOfOrigin.toUpperCase();

        if (country === "CN") return "manhua";
        if (country === "KR") return "manhwa";

        return "manga";
    }

    /**
     * Check if sync is active
     */
    isActive(): boolean {
        return this.subscription !== null;
    }
}

// Global singleton instance
let syncManager: RealtimeSyncManager | null = null;

export function getRealtimeSyncManager(): RealtimeSyncManager {
    if (!syncManager) {
        syncManager = new RealtimeSyncManager();
    }
    return syncManager;
}
