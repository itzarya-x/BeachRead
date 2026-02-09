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
