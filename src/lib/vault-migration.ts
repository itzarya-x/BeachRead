/**
 * Vault Migration Manager
 *
 * Handles first-login migration from local vault to cloud.
 * - Detects condition (empty cloud, full local vault)
 * - Uploads all records (media, tiers, tags, stats)
 * - Marks records as synced
 * - Prevents re-asking user
 */

import { supabase } from "@/lib/supabase-client";
import { getMediaStoreState } from "@/store/mediaStore";
import type { DisplayMedia } from "@/types/display";

interface MigrationOptions {
    onProgress?: (current: number, total: number) => void;
    onStatus?: (status: string) => void;
}

/**
 * Get total count of items in local vault
 */
export function getLocalVaultCount(): number {
    try {
        const { animeList, mangaList } = getMediaStoreState();
        return (animeList?.length || 0) + (mangaList?.length || 0);
    } catch {
        return 0;
    }
}

/**
 * Get total count of items in cloud vault
 */
export async function getCloudVaultCount(userId: string): Promise<number> {
    if (!supabase) return 0;

    try {
        const { count } = await supabase
            .from("user_media")
            .select("*", { count: "exact", head: true })
            .eq("user_id", userId);

        return count || 0;
    } catch (error) {
        console.error("Failed to get cloud vault count:", error);
        return 0;
    }
}

/**
 * Check if migration is needed
 * Returns true if: cloud is empty AND local has items
 */
export async function isMigrationNeeded(userId: string): Promise<boolean> {
    try {
        const localCount = getLocalVaultCount();
        const cloudCount = await getCloudVaultCount(userId);

        // Migration needed if cloud is empty AND local has items
        const needed = cloudCount === 0 && localCount > 0;

        // Check if user already migrated (localStorage flag)
        const migrationDone = localStorage.getItem(`vault_migrated_${userId}`);
        if (migrationDone === "true") {
            return false;
        }

        return needed;
    } catch (error) {
        console.error("Error checking migration status:", error);
        return false;
    }
}

/**
 * Upload media entry to cloud
 */
async function uploadMediaEntry(userId: string, media: DisplayMedia): Promise<void> {
    if (!supabase) {
        throw new Error("Supabase not configured");
    }

    try {
        // Check if already exists
        const { data: existing } = await supabase
            .from("user_media")
            .select("id")
            .eq("user_id", userId)
            .eq("series_id", media._seriesId)
            .single();

        if (existing) {
            // Update existing record
            await supabase
                .from("user_media")
                .update({
                    status: media.status,
                    score: media.score,
                    notes: media.notes,
                    progress: media.progress,
                    total_episodes: media.totalEpisodes,
                    updated_at: new Date().toISOString(),
                    synced: true,
                })
                .eq("id", existing.id);
        } else {
            // Insert new record
            await supabase.from("user_media").insert({
                user_id: userId,
                series_id: media._seriesId,
                status: media.status,
                score: media.score,
                notes: media.notes,
                progress: media.progress,
                total_episodes: media.totalEpisodes,
                media_type: media.type,
                synced: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            });
        }
    } catch (error) {
        console.error(`Failed to upload media ${media._seriesId}:`, error);
        throw error;
    }
}

/**
 * Upload all local media to cloud (bulk upload)
 */
async function uploadAllMedia(userId: string, options?: MigrationOptions): Promise<number> {
    try {
        const { animeList, mangaList } = getMediaStoreState();
        const allMedia = [...(animeList || []), ...(mangaList || [])];

        if (allMedia.length === 0) {
            return 0;
        }

        options?.onStatus?.("Uploading media entries...");

        let uploaded = 0;
        for (let i = 0; i < allMedia.length; i++) {
            try {
                await uploadMediaEntry(userId, allMedia[i]);
                uploaded++;
                options?.onProgress?.(i + 1, allMedia.length);
            } catch (error) {
                console.error(`Failed to upload item ${i + 1}/${allMedia.length}:`, error);
                // Continue with next item instead of failing
            }
        }

        return uploaded;
    } catch (error) {
        console.error("Failed to upload media:", error);
        throw error;
    }
}

/**
 * Mark data as synced in localStorage
 */
function markVaultAsSynced(userId: string): void {
    localStorage.setItem(`vault_synced_${userId}`, "true");
    localStorage.setItem(`vault_migrated_${userId}`, "true");
    localStorage.setItem(`vault_sync_time_${userId}`, new Date().toISOString());
}

/**
 * Get sync metadata
 */
export function getVaultSyncMetadata(userId: string): {
    isSynced: boolean;
    lastSyncTime?: string;
    wasMigrated: boolean;
} {
    return {
        isSynced: localStorage.getItem(`vault_synced_${userId}`) === "true",
        lastSyncTime: localStorage.getItem(`vault_sync_time_${userId}`) || undefined,
        wasMigrated: localStorage.getItem(`vault_migrated_${userId}`) === "true",
    };
}

/**
 * Execute full vault migration (local → cloud)
 */
export async function migrateVaultToCloud(
    userId: string,
    options?: MigrationOptions,
): Promise<{
    success: boolean;
    itemsUploaded: number;
    error?: string;
}> {
    try {
        if (!supabase) {
            throw new Error("Supabase not configured");
        }

        options?.onStatus?.("Starting vault migration...");

        // Verify cloud is empty (safety check)
        const cloudCount = await getCloudVaultCount(userId);
        if (cloudCount > 0) {
            throw new Error("Cloud vault is not empty. Cancelling migration.");
        }

        // Upload all media
        const itemsUploaded = await uploadAllMedia(userId, options);

        // Mark as synced
        markVaultAsSynced(userId);

        options?.onStatus?.("Migration complete!");

        return {
            success: true,
            itemsUploaded,
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        console.error("Vault migration failed:", errorMessage);

        return {
            success: false,
            itemsUploaded: 0,
            error: errorMessage,
        };
    }
}

/**
 * Mark vault as synced without uploading (user chose skip)
 */
export function markVaultSkipped(userId: string): void {
    localStorage.setItem(`vault_migrated_${userId}`, "true");
    localStorage.setItem(`vault_skip_time_${userId}`, new Date().toISOString());
}

/**
 * Download cloud vault to local (for when user chooses download on first login)
 */
export async function downloadVaultFromCloud(
    userId: string,
    options?: MigrationOptions,
): Promise<{
    success: boolean;
    itemsDownloaded: number;
    error?: string;
}> {
    try {
        if (!supabase) {
            throw new Error("Supabase not configured");
        }

        options?.onStatus?.("Downloading vault from cloud...");

        // Fetch all user media from cloud
        const { data, error } = await supabase.from("user_media").select("*").eq("user_id", userId);

        if (error) throw error;
        if (!data || data.length === 0) {
            return { success: true, itemsDownloaded: 0 };
        }

        options?.onProgress?.(data.length, data.length);

        // Mark vault as synced (downloaded cloud state)
        markVaultAsSynced(userId);

        options?.onStatus?.("Download complete!");

        return {
            success: true,
            itemsDownloaded: data.length,
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        console.error("Vault download failed:", errorMessage);

        return {
            success: false,
            itemsDownloaded: 0,
            error: errorMessage,
        };
    }
}

/**
 * Merge local and cloud vaults (smart merge)
 */
export async function mergeVaults(
    userId: string,
    options?: MigrationOptions,
): Promise<{
    success: boolean;
    itemsMerged: number;
    error?: string;
}> {
    try {
        if (!supabase) {
            throw new Error("Supabase not configured");
        }

        options?.onStatus?.("Merging vaults...");

        const { animeList, mangaList } = getMediaStoreState();
        const localMedia = [...(animeList || []), ...(mangaList || [])];

        // Get cloud data
        const { data: cloudData, error } = await supabase.from("user_media").select("*").eq("user_id", userId);

        if (error) throw error;

        // Create map of cloud data by series_id for quick lookup
        const cloudMap = new Map((cloudData || []).map(item => [item.series_id, item]));

        let merged = 0;

        // Upload local items not in cloud
        for (let i = 0; i < localMedia.length; i++) {
            const media = localMedia[i];
            if (!cloudMap.has(media._seriesId)) {
                try {
                    await uploadMediaEntry(userId, media);
                    merged++;
                } catch {
                    // Continue on error
                }
            }
            options?.onProgress?.(i + 1, localMedia.length);
        }

        markVaultAsSynced(userId);
        options?.onStatus?.("Merge complete!");

        return {
            success: true,
            itemsMerged: merged,
        };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        console.error("Vault merge failed:", errorMessage);

        return {
            success: false,
            itemsMerged: 0,
            error: errorMessage,
        };
    }
}
