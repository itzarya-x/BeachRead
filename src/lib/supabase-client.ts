/**
 * Supabase Client
 *
 * Minimal client for Yura cloud sync authentication.
 * Used only to identify users for cloud sync.
 *
 * PHASE 1.1: Install Supabase client
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

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
    order_index: number;
    created_at: string;
}

export interface SupabaseUserMediaTierRow {
    id: string;
    tier_id: string | null;
    tier_position: number | null;
}

async function requireSupabaseAuth() {
    if (!supabase) {
        throw new Error("Supabase is not configured");
    }

    const { data, error } = await supabase.auth.getUser();
    if (error) {
        throw error;
    }

    const user = data.user;
    if (!user) {
        throw new Error("No authenticated user");
    }

    return { client: supabase, user };
}

export async function getTiers(): Promise<SupabaseTier[]> {
    const { client, user } = await requireSupabaseAuth();
    const { data, error } = await client
        .from("tiers")
        .select("*")
        .eq("user_id", user.id)
        .order("order_index", { ascending: true });

    if (error) {
        throw error;
    }

    return (data ?? []) as SupabaseTier[];
}

export async function getTierAssignmentsForMedia(
    mediaIds: Array<string | number>,
): Promise<SupabaseUserMediaTierRow[]> {
    const { client, user } = await requireSupabaseAuth();
    if (mediaIds.length === 0) {
        return [];
    }

    const normalizedIds = mediaIds.map((id) => String(id));
    const { data, error } = await client
        .from("user_media")
        .select("id,tier_id,tier_position")
        .eq("user_id", user.id)
        .in("id", normalizedIds);

    if (error) {
        throw error;
    }

    return (data ?? []) as SupabaseUserMediaTierRow[];
}

export async function createTier(name: string, color: string): Promise<SupabaseTier> {
    const { client, user } = await requireSupabaseAuth();

    const { data: maxData, error: maxError } = await client
        .from("tiers")
        .select("order_index")
        .eq("user_id", user.id)
        .order("order_index", { ascending: false })
        .limit(1)
        .maybeSingle();

    if (maxError) {
        throw maxError;
    }

    const nextOrderIndex = (maxData?.order_index ?? -1) + 1;
    const { data, error } = await client
        .from("tiers")
        .insert({
            user_id: user.id,
            name,
            color,
            order_index: nextOrderIndex,
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
    updates: { name?: string; color?: string; order_index?: number },
): Promise<void> {
    const { client, user } = await requireSupabaseAuth();
    const { error } = await client
        .from("tiers")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id);

    if (error) {
        throw error;
    }
}

export async function deleteTier(id: string): Promise<void> {
    const { client, user } = await requireSupabaseAuth();

    const { error: clearError } = await client
        .from("user_media")
        .update({ tier_id: null, tier_position: null })
        .eq("user_id", user.id)
        .eq("tier_id", id);

    if (clearError) {
        throw clearError;
    }

    const { error } = await client
        .from("tiers")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

    if (error) {
        throw error;
    }
}

export async function moveMediaToTier(
    mediaId: string | number,
    tierId: string | null,
    position: number | null,
): Promise<void> {
    const { client, user } = await requireSupabaseAuth();

    const { error } = await client
        .from("user_media")
        .update({
            tier_id: tierId,
            tier_position: position,
            updated_at: new Date().toISOString(),
        })
        .eq("id", String(mediaId))
        .eq("user_id", user.id);

    if (error) {
        throw error;
    }
}

export async function reorderItemsInTier(
    tierId: string | null,
    orderedMediaIds: Array<string | number>,
): Promise<void> {
    const { client, user } = await requireSupabaseAuth();

    for (let index = 0; index < orderedMediaIds.length; index += 1) {
        const mediaId = orderedMediaIds[index];
        const { error } = await client
            .from("user_media")
            .update({
                tier_id: tierId,
                tier_position: index,
                updated_at: new Date().toISOString(),
            })
            .eq("id", String(mediaId))
            .eq("user_id", user.id);

        if (error) {
            throw error;
        }
    }
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
