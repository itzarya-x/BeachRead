/**
 * Sync Status Indicator
 *
 * Displays current sync status with visual indicator.
 * Shows: 🟢 synced, 🟡 syncing, 🔴 error, ⚫ offline
 * Clickable to open details panel.
 */

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertCircle, Wifi, WifiOff } from "lucide-react";
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
        icon: "🟢",
        label: "Synced",
        color: "text-green-600",
        bgColor: "bg-green-50",
    },
    syncing: {
        icon: "🟡",
        label: "Syncing...",
        color: "text-amber-600",
        bgColor: "bg-amber-50",
    },
    error: {
        icon: "🔴",
        label: "Sync Error",
        color: "text-red-600",
        bgColor: "bg-red-50",
    },
    offline: {
        icon: "⚫",
        label: "Offline",
        color: "text-gray-600",
        bgColor: "bg-gray-50",
    },
    unknown: {
        icon: "❓",
        label: "Unknown",
        color: "text-gray-600",
        bgColor: "bg-gray-50",
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
                    className={`${config.color} hover:${config.bgColor} gap-2`}
                    title={config.label}
                >
                    <span className="text-lg">{config.icon}</span>
                    <span className="hidden sm:inline text-xs font-medium">{config.label}</span>
                </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-64 p-4">
                <div className="space-y-3">
                    {/* Status Header */}
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">{config.icon}</span>
                        <div>
                            <p className={`font-semibold ${config.color}`}>{config.label}</p>
                            <p className="text-xs text-gray-500">{syncTimeText}</p>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px bg-gray-200" />

                    {/* Stats */}
                    {(itemsUploaded > 0 || itemsDownloaded > 0 || conflictCount > 0) && (
                        <>
                            <div className="grid grid-cols-3 gap-2 text-center text-sm">
                                {itemsUploaded > 0 && (
                                    <div>
                                        <p className="font-semibold text-blue-600">{itemsUploaded}</p>
                                        <p className="text-xs text-gray-500">Uploaded</p>
                                    </div>
                                )}
                                {itemsDownloaded > 0 && (
                                    <div>
                                        <p className="font-semibold text-green-600">{itemsDownloaded}</p>
                                        <p className="text-xs text-gray-500">Downloaded</p>
                                    </div>
                                )}
                                {conflictCount > 0 && (
                                    <div>
                                        <p className="font-semibold text-red-600">{conflictCount}</p>
                                        <p className="text-xs text-gray-500">Conflicts</p>
                                    </div>
                                )}
                            </div>
                            <div className="h-px bg-gray-200" />
                        </>
                    )}

                    {/* Online Status */}
                    <div className="flex items-center gap-2 text-sm">
                        {isOnline ? (
                            <>
                                <Wifi className="w-4 h-4 text-green-600" />
                                <span className="text-green-600">Connected to internet</span>
                            </>
                        ) : (
                            <>
                                <WifiOff className="w-4 h-4 text-gray-600" />
                                <span className="text-gray-600">Offline — changes will sync later</span>
                            </>
                        )}
                    </div>

                    {/* Help Text */}
                    {status === "error" && (
                        <div className="rounded bg-red-50 p-2 text-xs text-red-700">
                            <p className="flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                <span>Sync encountered an error. Check settings for details.</span>
                            </p>
                        </div>
                    )}

                    {conflictCount > 0 && (
                        <div className="rounded bg-yellow-50 p-2 text-xs text-yellow-700">
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
                            <div className="h-px bg-gray-200" />
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
