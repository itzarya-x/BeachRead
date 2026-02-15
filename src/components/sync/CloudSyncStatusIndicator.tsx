/**
 * Cloud Sync Status Indicator (PHASE 8)
 *
 * Minimal UI feedback showing cloud sync status.
 * Always visible, small, informative.
 *
 * PHASE 8: Show "Cloud backup enabled" or "Not connected"
 */

import { useAuth } from "@/context/AuthContext";
import { useCloudSyncStatus } from "@/hooks/useCloudSyncStatus";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

export function CloudSyncStatusIndicator() {
    const syncStatus = useCloudSyncStatus();
    const { isAuthenticated, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    if (authLoading) {
        return null; // Don't show while auth is loading
    }

    // Don't show if not configured
    if (!syncStatus.isConfigured) {
        return null;
    }

    // Connected: Show positive status
    if (syncStatus.isEnabled && syncStatus.isAuthenticated) {
        return (
            <div className="flex cursor-default items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-300 transition-colors">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
                <span>{syncStatus.message}</span>
            </div>
        );
    }

    // Not connected: Show hint to sign in
    if (syncStatus.requiresLogin) {
        return (
            <button
                onClick={() => navigate("/login")}
                className={cn(
                    "flex items-center gap-2 rounded-full border px-3 py-1 text-xs transition-colors",
                    "border-primary/35 bg-primary/10 text-primary hover:bg-primary/15"
                )}
            >
                <span className="h-1.5 w-1.5 rounded-full bg-white/55" />
                <span>{syncStatus.message}</span>
            </button>
        );
    }

    return null;
}
