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
        <div className="rounded-lg border border-gray-200 p-4 space-y-4">
            <h3 className="font-semibold text-lg text-gray-900">Active devices</h3>

            {devices.length === 0 ? (
                <p className="text-sm text-gray-500">No devices found. Sign in to see your devices here.</p>
            ) : (
                <div className="space-y-2">
                    {devices.map(device => (
                        <div
                            key={device.id}
                            className={`p-3 rounded-lg border transition-colors ${
                                device.isCurrentDevice
                                    ? "border-blue-200 bg-blue-50"
                                    : "border-gray-200 bg-white hover:bg-gray-50"
                            }`}
                        >
                            <div className="flex items-start gap-3">
                                {/* Icon */}
                                <div
                                    className={`flex-shrink-0 ${
                                        device.isCurrentDevice ? "text-blue-600" : "text-gray-600"
                                    }`}
                                >
                                    {getDeviceIcon(device.type)}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="font-medium text-gray-900">{device.name}</p>
                                        {device.isCurrentDevice && (
                                            <Badge variant="default" className="text-xs">
                                                This device
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Details */}
                                    <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-500">
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
                                    <p className="text-xs text-gray-400 mt-1">
                                        Last seen {getTimeAgo(device.lastSeen)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Info */}
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-700">
                <p>Unrecognized device? You can sign out from other devices in settings.</p>
            </div>
        </div>
    );
}
