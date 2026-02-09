/**
 * Cloud Sync Status Indicator (PHASE 8)
 *
 * Minimal UI feedback showing cloud sync status.
 * Always visible, small, informative.
 *
 * PHASE 8: Show "Cloud backup enabled" or "Not connected"
 */

import { useCloudSyncStatus } from "@/hooks/useCloudSyncStatus";
import { useAuth } from "@/context/AuthContext";
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
            <div className="flex items-center gap-2 text-xs text-green-600 px-3 py-1 bg-green-50 rounded-full border border-green-200 hover:bg-green-100 transition-colors cursor-default">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span>{syncStatus.message}</span>
            </div>
        );
    }

    // Not connected: Show hint to sign in
    if (syncStatus.requiresLogin) {
        return (
            <button
                onClick={() => navigate("/login")}
                className="flex items-center gap-2 text-xs text-blue-600 px-3 py-1 bg-blue-50 rounded-full border border-blue-200 hover:bg-blue-100 transition-colors"
            >
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                <span>{syncStatus.message}</span>
            </button>
        );
    }

    return null;
}
