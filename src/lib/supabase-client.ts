/**
 * Supabase Client
 *
 * Minimal client for Yura cloud sync authentication.
 * Used only to identify users for cloud sync.
 *
 * PHASE 1.1: Install Supabase client
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { ActivityLog } from "@/lib/storage/types";

// Configuration from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseKey) {
    console.warn(
        "Supabase credentials not configured. Auth will use mock mode."
    );
}

// Create Supabase client (nullable for offline mode)
export const supabase: SupabaseClient | null = supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey, {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            storageKey: "yura_supabase_session",
        },
    })
    : null;

/**
 * Check if Supabase is configured
 */
export function isSupabaseConfigured(): boolean {
    return supabase !== null;
}

export interface SupabaseTier {
    id: string;
    user_id: string;
    name: string;
    color: string;
    order: number;
    created_at: string;
}

export interface SupabaseTierItem {
    id: string;
    user_id: string;
    tier_id: string;
    series_id: number;
    position: number;
    media_type: string;
    created_at: string;
    updated_at: string;
}

/**
 * Get active session safely
 * Prioritizes local state to avoid AuthSessionMissingError
 */
export async function getSupabaseSession() {
    if (!supabase) return null;
    
    // 1. Try to get session from memory (fastest)
    const { data: { session } } = await supabase.auth.getSession();
    if (session) return session;

    return null;
}

async function requireSupabaseAuth() {
    if (!supabase) {
        throw new Error("Supabase is not configured");
    }

    // Prioritize getSession() over getUser() for better performance and reliability in refresh cycles
    const session = await getSupabaseSession();
    if (!session) {
        throw new Error("No active session. Please sign in.");
    }

    return { client: supabase, user: session.user };
}

export async function getTiers(): Promise<SupabaseTier[]> {
    const { client, user } = await requireSupabaseAuth();
    
    // We try to select "order" column. If migration ran, it exists.
    const { data, error } = await client
        .from("tiers")
        .select("*")
        .eq("user_id", user.id)
        .order("order", { ascending: true });

    if (error) {
        console.error("Error fetching tiers:", error);
        throw error;
    }

    return (data ?? []) as SupabaseTier[];
}

export async function getTierItems(): Promise<SupabaseTierItem[]> {
    const { client, user } = await requireSupabaseAuth();
    
    const { data, error } = await client
        .from("tier_items")
        .select("*")
        .eq("user_id", user.id)
        .order("position", { ascending: true });

    if (error) {
        console.error("Error fetching tier items:", error);
        throw error;
    }

    return (data ?? []) as SupabaseTierItem[];
}

export async function createTier(name: string, color: string): Promise<SupabaseTier> {
    const { client, user } = await requireSupabaseAuth();

    // Get max order
    const { data: maxData, error: maxError } = await client
        .from("tiers")
        .select("order")
        .eq("user_id", user.id)
        .order("order", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (maxError) {
        console.error("Error fetching max tier order:", maxError);
    }

    const nextOrder = (maxData?.order ?? -1) + 1;
    
    const { data, error } = await client
        .from("tiers")
        .insert({
            user_id: user.id,
            name,
            color,
            "order": nextOrder,
        })
        .select("*")
        .single();

    if (error) {
        throw error;
    }

    return data as SupabaseTier;
}

export async function updateTier(
    id: string,
    updates: { name?: string; color?: string; order?: number },
): Promise<void> {
    const { client, user } = await requireSupabaseAuth();
    
    const payload: any = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.color !== undefined) payload.color = updates.color;
    if (updates.order !== undefined) payload.order = updates.order;

    const { error } = await client
        .from("tiers")
        .update(payload)
        .eq("id", id)
        .eq("user_id", user.id);

    if (error) {
        throw error;
    }
}

export async function deleteTier(id: string): Promise<void> {
    const { client, user } = await requireSupabaseAuth();

    // tier_items will be deleted automatically via ON DELETE CASCADE foreign key
    const { error } = await client
        .from("tiers")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

    if (error) {
        throw error;
    }
}

/**
 * Moves media to a tier (or removes it if tierId is null)
 * Ensures "exist in only ONE tier at a time" rule.
 */
export async function moveMediaToTier(
    seriesId: number,
    tierId: string | null,
    position: number,
    mediaType: string = "ANIME"
): Promise<void> {
    const { client, user } = await requireSupabaseAuth();

    // 1. Remove from any existing tier
    const { error: deleteError } = await client
        .from("tier_items")
        .delete()
        .eq("user_id", user.id)
        .eq("series_id", seriesId);

    if (deleteError) {
        throw deleteError;
    }

    // 2. Insert into new tier if tierId is provided (not null)
    if (tierId) {
        const { error: insertError } = await client
            .from("tier_items")
            .insert({
                user_id: user.id,
                tier_id: tierId,
                series_id: seriesId,
                position: position,
                media_type: mediaType
            });

        if (insertError) {
            throw insertError;
        }

        // Log tier move activity
        await logActivity({
            seriesId,
            actionType: "tier_change",
            mediaType: mediaType as "ANIME" | "MANGA",
            details: { to: tierId }
        });
    } else {
        // Log removal from tier
        await logActivity({ seriesId, actionType: "tier_change", mediaType: mediaType as "ANIME" | "MANGA", details: { to: null } });
    }

    // 3. SYNC: Update user_media JSONB for unified vault state
    try {
        const { data: mediaRecord } = await client
            .from("user_media")
            .select("id, data")
            .eq("user_id", user.id)
            .eq("series_id", seriesId)
            .maybeSingle();

        if (mediaRecord) {
            const updatedData = { 
                ...(mediaRecord.data || {}), 
                tierId: tierId // Update or clear tierId
            };
            
            await client
                .from("user_media")
                .update({ 
                    data: updatedData,
                    tier_id: tierId, // Sync column
                    tier_position: position, // Sync column
                    updated_at: new Date().toISOString()
                })
                .eq("id", mediaRecord.id);
                
            console.log(`[SYNC] Propagated tier change (${tierId || "NONE"}) to user_media for series ${seriesId}`);
        }
    } catch (err) {
        console.warn("[SYNC] Failed to propagate tier change to user_media:", err);
    }
}

export async function reorderItemsInTier(
    tierId: string,
    orderedSeriesIds: number[]
): Promise<void> {
    const { client, user } = await requireSupabaseAuth();

    const { data: existingItems, error: fetchError } = await client
        .from("tier_items")
        .select("id, series_id")
        .eq("user_id", user.id)
        .eq("tier_id", tierId)
        .in("series_id", orderedSeriesIds);

    if (fetchError || !existingItems) {
        throw fetchError || new Error("Failed to fetch items for reorder");
    }

    const updates = existingItems.map(item => {
        const newPos = orderedSeriesIds.indexOf(item.series_id);
        if (newPos === -1) return null; // Should not happen
        return {
            id: item.id,
            user_id: user.id,
            tier_id: tierId,
            series_id: item.series_id,
            position: newPos,
            updated_at: new Date().toISOString()
        };
    }).filter(Boolean);

    if (updates.length > 0) {
        const { error: updateError } = await client
            .from("tier_items")
            .upsert(updates);
            
        if (updateError) throw updateError;

        // SYNC: Update user_media for each item to reflect new positions
        for (const item of updates) {
            try {
                const { data: mediaRecord } = await client
                    .from("user_media")
                    .select("data")
                    .eq("user_id", user.id)
                    .eq("series_id", item.series_id)
                    .maybeSingle();
                
                if (mediaRecord) {
                    await client
                        .from("user_media")
                        .update({
                            tier_position: item.position,
                            data: { ...mediaRecord.data, tierId: tierId }
                        })
                        .eq("user_id", user.id)
                        .eq("series_id", item.series_id);
                }
            } catch (err) {
                console.warn(`[SYNC] Failed to update position for series ${item.series_id}:`, err);
            }
        }
    }
}

export async function getActivities(limit = 500): Promise<ActivityLog[]> {
    const { client, user } = await requireSupabaseAuth();
    
    const { data, error } = await client
        .from("activity_log")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(limit);

    if (error) {
        console.error("Error fetching activities:", error);
        throw error;
    }

    return (data ?? []).map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        seriesId: row.series_id,
        actionType: row.action_type,
        mediaType: row.media_type,
        details: row.details,
        createdAt: row.created_at
    })) as ActivityLog[];
}

export async function logActivity(
    activity: Omit<ActivityLog, "id" | "userId" | "createdAt">
): Promise<void> {
    try {
        const { client, user } = await requireSupabaseAuth();

        const { error } = await client
            .from("activity_log")
            .insert({
                user_id: user.id,
                series_id: activity.seriesId,
                action_type: activity.actionType,
                media_type: activity.mediaType,
                details: activity.details
            });

        if (error) {
            console.error("Error logging activity:", error);
        }
    } catch (e) {
        // Silently fail activity logging if not configured/logged in
        console.warn("Activity logging skipped:", e);
    }
}

/**
 * HYBRID ARCHITECTURE: Fetching aggregated data
 */
export async function fetchCoreStats(userId: string) {
    const { client } = await requireSupabaseAuth();
    const { data, error } = await client
        .from("user_stats_core")
        .select("*")
        .eq("user_id", userId)
        .single();
    if (error) throw error;
    return data;
}

export async function fetchScoreDistribution(userId: string) {
    const { client } = await requireSupabaseAuth();
    const { data, error } = await client
        .from("user_score_distribution")
        .select("*")
        .eq("user_id", userId);
    if (error) throw error;
    return data;
}

export async function fetchActivityHeatmap(userId: string) {
    const { client } = await requireSupabaseAuth();
    const { data, error } = await client
        .from("user_activity_heatmap")
        .select("*")
        .eq("user_id", userId);
    if (error) throw error;
    return data;
}

/**
 * Verify Supabase connectivity
 */
export async function verifySupabaseConnection(): Promise<boolean> {
    if (!supabase) return false;

    try {
        const { error } = await supabase.auth.getSession();
        return !error;
    } catch {
        return false;
    }
}
