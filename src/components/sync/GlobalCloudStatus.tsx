/**
 * Global Cloud Status (PHASE 4-5)
 *
 * Persistent cloud sync status indicator.
 * - Shows sync state: Connected, Not Connected, Not Configured
 * - Click to open drawer with sync details
 * - Displays user email and sync status
 */

import { useAuth } from "@/context/AuthContext";
import { useCloudSyncStatus } from "@/hooks/useCloudSyncStatus";
import { CheckCircle2, CloudOff, RefreshCw, X, XCircle } from "lucide-react";
import { useState } from "react";

type SyncState = "connected" | "not-connected" | "not-configured";

interface SyncConfig {
    state: SyncState;
    icon: React.ReactNode;
    label: string;
    color: string;
    bgColor: string;
}

const SYNC_CONFIG: Record<SyncState, SyncConfig> = {
    connected: {
        state: "connected",
        icon: <CheckCircle2 size={14} />,
        label: "Synced",
        color: "text-green-700",
        bgColor: "bg-green-50 border-green-200",
    },
    "not-connected": {
        state: "not-connected",
        icon: <XCircle size={14} />,
        label: "Not connected",
        color: "text-amber-700",
        bgColor: "bg-amber-50 border-amber-200",
    },
    "not-configured": {
        state: "not-configured",
        icon: <CloudOff size={14} />,
        label: "Not configured",
        color: "text-gray-700",
        bgColor: "bg-gray-50 border-gray-200",
    },
};

export function GlobalCloudStatus() {
    const { user, isAuthenticated } = useAuth();
    const syncStatus = useCloudSyncStatus();
    const [showDetails, setShowDetails] = useState(false);

    if (!isAuthenticated) {
        return null;
    }

    // Use status from hook
    const state: SyncState = syncStatus.status as SyncState;
    const config = SYNC_CONFIG[state];

    return (
        <>
            <button
                onClick={() => setShowDetails(true)}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-full border transition-colors hover:opacity-80 ${config.color} ${config.bgColor}`}
                title={config.label}
            >
                {config.icon}
                <span className="hidden sm:inline">{config.label}</span>
            </button>

            {/* Details Drawer */}
            {showDetails && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
                    <div className="bg-surface-1 rounded-t-lg sm:rounded-lg shadow-lg w-full sm:max-w-md border border-surface-2">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-surface-2">
                            <h2 className="text-lg font-semibold">Cloud Sync Status</h2>
                            <button
                                onClick={() => setShowDetails(false)}
                                className="p-1 hover:bg-surface-2 rounded-lg transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-4 space-y-4">
                            {/* User info */}
                            <div className="p-3 rounded-lg bg-surface-2 border border-surface-3">
                                <p className="text-xs font-medium text-muted-foreground mb-1">ACCOUNT</p>
                                <p className="text-sm font-medium text-foreground">{user?.email}</p>
                            </div>

                            {/* Status */}
                            <div className={`p-3 rounded-lg border ${config.bgColor}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    {config.icon}
                                    <p className="text-sm font-medium">{config.label}</p>
                                </div>
                                <p className="text-xs text-muted-foreground">{syncStatus.message}</p>
                            </div>

                            {/* Enabled status */}
                            <div className="p-3 rounded-lg bg-surface-2 border border-surface-3">
                                <p className="text-xs font-medium text-muted-foreground mb-2">CLOUD SYNC</p>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-sm">
                                        <span>Configured:</span>
                                        <span className="font-medium">{syncStatus.isConfigured ? "Yes" : "No"}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Authenticated:</span>
                                        <span className="font-medium">{syncStatus.isAuthenticated ? "Yes" : "No"}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span>Enabled:</span>
                                        <span className="font-medium">{syncStatus.isEnabled ? "Yes" : "No"}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
