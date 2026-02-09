/**
 * Global Cloud Status (PHASE 4-5)
 *
 * Persistent indicator showing sync state.
 * States: 🟢 synced, 🟡 syncing, 🔴 error, ⚫ offline
 * Click to open sync details drawer.
 *
 * DESIGN: Small, always visible, build trust through transparency
 */

import { useAuth } from "@/context/AuthContext";
import { useCloudSyncStatus } from "@/hooks/useCloudSyncStatus";
import { ChevronRight, RefreshCw, X } from "lucide-react";
import { useState } from "react";

export function GlobalCloudStatus() {
    const syncStatus = useCloudSyncStatus();
    const { user } = useAuth();
    const [showDetails, setShowDetails] = useState(false);

    // Show nothing if not configured or not logged in
    if (!syncStatus.isConfigured || !syncStatus.isAuthenticated) {
        return null;
    }

    const isSyncing = false; // TODO: connect to actual sync state
    const syncState = syncStatus.status === "connected" ? (isSyncing ? "syncing" : "synced") : syncStatus.status;

    const statusConfig = {
        synced: {
            icon: "🟢",
            label: "Synced",
            color: "text-green-600",
            bg: "bg-green-50 border-green-200",
        },
        syncing: {
            icon: "🟡",
            label: "Syncing",
            color: "text-yellow-600",
            bg: "bg-yellow-50 border-yellow-200",
        },
        error: {
            icon: "🔴",
            label: "Error",
            color: "text-red-600",
            bg: "bg-red-50 border-red-200",
        },
        "not-connected": {
            icon: "⚫",
            label: "Offline",
            color: "text-gray-600",
            bg: "bg-gray-50 border-gray-200",
        },
    };

    const config = statusConfig[syncState as keyof typeof statusConfig];

    return (
        <>
            {/* Indicator */}
            <button
                onClick={() => setShowDetails(true)}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-full border transition-all hover:opacity-80 ${config.bg}`}
            >
                <span className="text-sm">{config.icon}</span>
                <span className={config.color}>{config.label}</span>
                <ChevronRight size={14} className={config.color} />
            </button>

            {/* Details Drawer */}
            {showDetails && (
                <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-end sm:justify-center z-50 p-4">
                    <div className="bg-surface-1 border border-border/30 rounded-t-lg sm:rounded-lg w-full sm:max-w-sm max-h-96 overflow-y-auto flex flex-col">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-border/20 sticky top-0 bg-surface-1">
                            <h2 className="text-lg font-semibold text-foreground">Sync Details</h2>
                            <button
                                onClick={() => setShowDetails(false)}
                                className="p-1 hover:bg-surface-2 rounded transition-colors"
                            >
                                <X size={20} className="text-muted-foreground" />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex-1 p-4 space-y-4">
                            {/* Status */}
                            <div className={`${config.bg} border rounded p-3 space-y-1`}>
                                <p className="text-xs font-medium text-muted-foreground">Status</p>
                                <p className={`text-sm font-semibold ${config.color}`}>{config.label}</p>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-surface-2 rounded p-3">
                                    <p className="text-xs text-muted-foreground">Uploads</p>
                                    <p className="text-lg font-semibold text-foreground">0</p>
                                </div>
                                <div className="bg-surface-2 rounded p-3">
                                    <p className="text-xs text-muted-foreground">Downloads</p>
                                    <p className="text-lg font-semibold text-foreground">0</p>
                                </div>
                                <div className="bg-surface-2 rounded p-3">
                                    <p className="text-xs text-muted-foreground">Pending</p>
                                    <p className="text-lg font-semibold text-foreground">0</p>
                                </div>
                                <div className="bg-surface-2 rounded p-3">
                                    <p className="text-xs text-muted-foreground">Conflicts</p>
                                    <p className="text-lg font-semibold text-foreground">0</p>
                                </div>
                            </div>

                            {/* User Info */}
                            {user && (
                                <div className="bg-blue-50 border border-blue-200 rounded p-3">
                                    <p className="text-xs font-medium text-muted-foreground">User</p>
                                    <p className="text-sm font-medium text-foreground truncate">{user.email}</p>
                                </div>
                            )}

                            {/* Info */}
                            <p className="text-xs text-muted-foreground pt-2 border-t border-border/20">
                                Your data is securely synced to Supabase. All changes are tracked and synced
                                automatically.
                            </p>
                        </div>

                        {/* Footer */}
                        <div className="p-4 border-t border-border/20 sticky bottom-0 bg-surface-1">
                            <button
                                onClick={() => {
                                    setShowDetails(false);
                                    // TODO: trigger sync
                                }}
                                className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
                            >
                                <RefreshCw size={16} />
                                Sync Now
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
