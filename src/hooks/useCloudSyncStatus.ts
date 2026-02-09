/**
 * useCloudSyncStatus Hook
 *
 * Provides cloud sync status and restrictions based on authentication.
 * PHASE 7: Cloud sync requires login
 * PHASE 8: UI feedback with sync status
 */

import { useAuth } from "@/context/AuthContext";
import { isSupabaseConfigured } from "@/lib/supabase-client";
import { useEffect, useState } from "react";

export interface CloudSyncStatus {
    isEnabled: boolean; // Can sync to cloud
    isConfigured: boolean; // Supabase configured
    isAuthenticated: boolean; // User logged in
    requiresLogin: boolean; // Sync blocked by auth
    status: "connected" | "not-connected" | "not-configured";
    message: string; // User-friendly message
}

/**
 * PHASE 6: Auto login behavior
 * PHASE 7: Sync requires login
 * PHASE 8: UI feedback
 */
export function useCloudSyncStatus(): CloudSyncStatus {
    const { isAuthenticated, loading } = useAuth();
    const isConfigured = isSupabaseConfigured();
    const [status, setStatus] = useState<CloudSyncStatus>({
        isEnabled: false,
        isConfigured: false,
        isAuthenticated: false,
        requiresLogin: false,
        status: "not-configured",
        message: "Cloud sync not configured",
    });

    useEffect(() => {
        // Skip while auth is loading
        if (loading) return;

        // Determine sync status
        if (!isConfigured) {
            setStatus({
                isEnabled: false,
                isConfigured: false,
                isAuthenticated: false,
                requiresLogin: false,
                status: "not-configured",
                message: "Configure Supabase to enable cloud sync",
            });
            return;
        }

        if (!isAuthenticated) {
            setStatus({
                isEnabled: false,
                isConfigured: true,
                isAuthenticated: false,
                requiresLogin: true,
                status: "not-connected",
                message: "Sign in to enable cloud sync",
            });
            return;
        }

        // PHASE 6: Session valid, never ask again (auto-enabled)
        setStatus({
            isEnabled: true,
            isConfigured: true,
            isAuthenticated: true,
            requiresLogin: false,
            status: "connected",
            message: "Cloud backup enabled",
        });
    }, [isConfigured, isAuthenticated, loading]);

    return status;
}
