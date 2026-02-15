/**
 * Device List Component
 *
 * Shows where user is logged in.
 * Displays device name, last seen, and location info.
 */

import { Badge } from "@/components/ui/badge";
import { Globe, Monitor, Smartphone, Tablet } from "lucide-react";

export interface Device {
    id: string;
    name: string;
    type: "desktop" | "mobile" | "tablet";
    lastSeen: Date;
    isCurrentDevice: boolean;
    browser?: string;
    os?: string;
    location?: string;
}

interface DeviceListProps {
    devices: Device[];
}

export function DeviceList({ devices = [] }: DeviceListProps) {
    const getDeviceIcon = (type: string) => {
        switch (type) {
            case "mobile":
                return <Smartphone className="w-5 h-5" />;
            case "tablet":
                return <Tablet className="w-5 h-5" />;
            default:
                return <Monitor className="w-5 h-5" />;
        }
    };

    const getTimeAgo = (date: Date): string => {
        const now = new Date();
        const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (seconds < 60) return "just now";
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}d ago`;
        const weeks = Math.floor(days / 7);
        if (weeks < 4) return `${weeks}w ago`;
        const months = Math.floor(days / 30);
        return `${months}mo ago`;
    };

    return (
        <div className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-foreground">Active Devices</h3>

            {devices.length === 0 ? (
                <p className="text-sm text-muted-foreground">No devices found. Sign in to see your devices here.</p>
            ) : (
                <div className="space-y-2">
                    {devices.map(device => (
                        <div
                            key={device.id}
                            className={`rounded-xl border p-3 transition-colors ${
                                device.isCurrentDevice
                                    ? "border-primary/35 bg-accent"
                                    : "border-border bg-card hover:bg-muted/50"
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                {/* Icon */}
                                <div
                                    className={`flex-shrink-0 ${
                                        device.isCurrentDevice ? "text-primary" : "text-muted-foreground"
                                    }`}
                                >
                                    {getDeviceIcon(device.type)}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium text-foreground">{device.name}</p>
                                        {device.isCurrentDevice && (
                                            <Badge variant="default" className="border border-primary/30 bg-primary/20 text-primary text-xs">
                                                This device
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Details */}
                                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                                        {device.browser && <span>{device.browser}</span>}
                                        {device.os && <span>•</span> && <span>{device.os}</span>}
                                        {device.location && (
                                            <>
                                                <span>•</span>
                                                <span className="flex items-center gap-1">
                                                    <Globe className="w-3 h-3" />
                                                    {device.location}
                                                </span>
                                            </>
                                        )}
                                    </div>

                                    {/* Last Seen */}
                                    <p className="mt-1 text-xs text-muted-foreground/80">
                                        Last seen {getTimeAgo(device.lastSeen)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Info */}
            <div className="rounded-lg border border-primary/25 bg-accent p-3 text-xs text-primary/90">
                <p>Unrecognized device? You can sign out from other devices in settings.</p>
            </div>
        </div>
    );
}
