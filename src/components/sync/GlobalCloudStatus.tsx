/**
 * Global Cloud Status (PHASE 4-5)
 *
 * Persistent cloud sync status indicator.
 * - Shows sync state: Connected, Not Connected, Not Configured
 * - Click to open drawer with sync details
 * - Displays user email and sync status
 */

import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useCloudSyncStatus } from "@/hooks/useCloudSyncStatus";
import { CheckCircle2, CloudOff, XCircle } from "lucide-react";
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
        color: "text-emerald-700",
        bgColor: "bg-emerald-100 border-emerald-300",
    },
    "not-connected": {
        state: "not-connected",
        icon: <XCircle size={14} />,
        label: "Not connected",
        color: "text-amber-700",
        bgColor: "bg-amber-100 border-amber-300",
    },
    "not-configured": {
        state: "not-configured",
        icon: <CloudOff size={14} />,
        label: "Not configured",
        color: "text-muted-foreground",
        bgColor: "bg-muted border-border",
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
    const config = SYNC_CONFIG[state] || SYNC_CONFIG["not-configured"];

    return (
        <>
            <button
                onClick={() => setShowDetails(true)}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${config.color} ${config.bgColor}`}
                title={config.label}
            >
                {config.icon}
                <span className="hidden sm:inline">{config.label}</span>
            </button>

            <Dialog open={showDetails} onOpenChange={setShowDetails}>
                <DialogContent className="max-w-md border-border bg-card sm:rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Cloud Sync Status</DialogTitle>
                        <DialogDescription>Current account and synchronization health.</DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="rounded-lg border border-border bg-muted/50 p-3">
                            <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Account</p>
                            <p className="text-sm font-medium text-foreground">{user?.email}</p>
                        </div>

                        <div className={`rounded-lg border p-3 ${config.bgColor}`}>
                            <div className="mb-2 flex items-center gap-2">
                                {config.icon}
                                <p className={`text-sm font-semibold ${config.color}`}>{config.label}</p>
                            </div>
                            <p className="text-xs text-muted-foreground">{syncStatus.message}</p>
                        </div>

                        <div className="rounded-lg border border-border bg-muted/50 p-3">
                            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">Sync State</p>
                            <div className="space-y-1.5 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Configured</span>
                                    <span className="font-medium text-foreground">{syncStatus.isConfigured ? "Yes" : "No"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Authenticated</span>
                                    <span className="font-medium text-foreground">{syncStatus.isAuthenticated ? "Yes" : "No"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Enabled</span>
                                    <span className="font-medium text-foreground">{syncStatus.isEnabled ? "Yes" : "No"}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="secondary" onClick={() => setShowDetails(false)}>
                            Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
