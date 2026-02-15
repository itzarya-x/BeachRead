/**
 * Sync Status Indicator
 *
 * Displays current sync status with visual indicator.
 * Shows: 🟢 synced, 🟡 syncing, 🔴 error, ⚫ offline
 * Clickable to open details panel.
 */

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { AlertCircle, CheckCircle2, HelpCircle, Loader2, Wifi, WifiOff, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

export type SyncStatus = "synced" | "syncing" | "error" | "offline" | "unknown";

interface SyncStatusIndicatorProps {
    status: SyncStatus;
    onDetailsClick?: () => void;
    lastSyncTime?: Date;
    itemsUploaded?: number;
    itemsDownloaded?: number;
    conflictCount?: number;
}

const STATUS_CONFIG = {
    synced: {
        icon: <CheckCircle2 className="h-4 w-4 text-emerald-700" />,
        label: "Synced",
        color: "text-emerald-700",
        bgColor: "bg-emerald-100 border-emerald-300",
    },
    syncing: {
        icon: <Loader2 className="h-4 w-4 animate-spin text-amber-700" />,
        label: "Syncing...",
        color: "text-amber-700",
        bgColor: "bg-amber-100 border-amber-300",
    },
    error: {
        icon: <XCircle className="h-4 w-4 text-destructive" />,
        label: "Sync Error",
        color: "text-destructive",
        bgColor: "bg-destructive/12 border-destructive/35",
    },
    offline: {
        icon: <WifiOff className="h-4 w-4 text-muted-foreground" />,
        label: "Offline",
        color: "text-muted-foreground",
        bgColor: "bg-muted border-border",
    },
    unknown: {
        icon: <HelpCircle className="h-4 w-4 text-muted-foreground" />,
        label: "Unknown",
        color: "text-muted-foreground",
        bgColor: "bg-muted border-border",
    },
};

export function SyncStatusIndicator({
    status,
    onDetailsClick,
    lastSyncTime,
    itemsUploaded = 0,
    itemsDownloaded = 0,
    conflictCount = 0,
}: SyncStatusIndicatorProps) {
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener("online", handleOnline);
        window.addEventListener("offline", handleOffline);

        return () => {
            window.removeEventListener("online", handleOnline);
            window.removeEventListener("offline", handleOffline);
        };
    }, []);

    const config = STATUS_CONFIG[status] || STATUS_CONFIG.unknown;

    const syncTimeText =
        lastSyncTime && lastSyncTime instanceof Date && !isNaN(lastSyncTime.getTime())
            ? `Last synced ${getTimeAgo(lastSyncTime)}`
            : "Never synced";

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                        "gap-2 rounded-full border px-2.5",
                        config.bgColor,
                        config.color,
                        "hover:opacity-90"
                    )}
                    title={config.label}
                >
                    {config.icon}
                    <span className="hidden sm:inline text-xs font-medium">{config.label}</span>
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-72 border-border bg-card p-4 shadow-sm">
                <div className="space-y-3">
                    {/* Status Header */}
                    <div className="flex items-center gap-2">
                        {config.icon}
                        <div>
                            <p className={`font-semibold ${config.color}`}>{config.label}</p>
                            <p className="text-xs text-muted-foreground">{syncTimeText}</p>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-border" />

                    {/* Stats */}
                    {(itemsUploaded > 0 || itemsDownloaded > 0 || conflictCount > 0) && (
                        <>
                            <div className="grid grid-cols-3 gap-2 text-center text-sm">
                                {itemsUploaded > 0 && (
                                    <div>
                                        <p className="font-semibold text-primary">{itemsUploaded}</p>
                                        <p className="text-xs text-muted-foreground">Uploaded</p>
                                    </div>
                                )}
                                {itemsDownloaded > 0 && (
                                    <div>
                                        <p className="font-semibold text-emerald-700">{itemsDownloaded}</p>
                                        <p className="text-xs text-muted-foreground">Downloaded</p>
                                    </div>
                                )}
                                {conflictCount > 0 && (
                                    <div>
                                        <p className="font-semibold text-destructive">{conflictCount}</p>
                                        <p className="text-xs text-muted-foreground">Conflicts</p>
                                    </div>
                                )}
                            </div>
                            <div className="h-px bg-border" />
                        </>
                    )}

                    {/* Online Status */}
                    <div className="flex items-center gap-2 text-sm">
                        {isOnline ? (
                            <>
                                <Wifi className="w-4 h-4 text-green-600" />
                                <span className="text-emerald-700">Connected to internet</span>
                            </>
                        ) : (
                            <>
                                <WifiOff className="w-4 h-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Offline — changes will sync later</span>
                            </>
                        )}
                    </div>

                    {/* Help Text */}
                    {status === "error" && (
                        <div className="rounded bg-destructive/12 p-2 text-xs text-destructive">
                            <p className="flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                <span>Sync encountered an error. Check settings for details.</span>
                            </p>
                        </div>
                    )}

                    {conflictCount > 0 && (
                        <div className="rounded border border-amber-300 bg-amber-100 p-2 text-xs text-amber-700">
                            <p className="flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                <span>
                                    {conflictCount} conflict
                                    {conflictCount > 1 ? "s" : ""} need your attention.
                                </span>
                            </p>
                        </div>
                    )}

                    {/* Action Button */}
                    {onDetailsClick && (
                        <>
                            <div className="h-px bg-border" />
                            <Button variant="outline" size="sm" className="w-full" onClick={onDetailsClick}>
                                View Details
                            </Button>
                        </>
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

function getTimeAgo(date: Date): string {
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}
