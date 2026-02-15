/**
 * Storage Mode Indicator
 * ========================
 * Displays current storage mode in UI header/footer
 * 
 * PHASE 5 (Guest Experience):
 * - Shows "Cloud" or "Guest" storage mode
 * - Provides visual indicator of authentication status
 * - Updates dynamically on auth changes
 * - Hidden in production (visible in dev/testing)
 */

import { useDataContext } from "@/context/DataContext";

interface StorageModeIndicatorProps {
    variant?: "inline" | "badge" | "full";
    showLabel?: boolean;
}

export function StorageModeIndicator({
    variant = "badge",
    showLabel = true,
}: StorageModeIndicatorProps) {
    const { storageMode } = useDataContext();
    const isDev = import.meta.env.DEV;

    // Only show in development
    if (!isDev) return null;

    if (variant === "inline") {
        return (
            <span className="text-xs font-mono text-muted-foreground">
                [{storageMode}]
            </span>
        );
    }

    if (variant === "badge") {
        const isCloud = storageMode === "cloud";
        const bgColor = isCloud ? "bg-emerald-100" : "bg-muted";
        const textColor = isCloud ? "text-emerald-700" : "text-muted-foreground";
        const borderColor = isCloud ? "border-emerald-300" : "border-border";
        const icon = isCloud ? "☁️" : "👤";

        return (
            <div className={`${bgColor} ${textColor} ${borderColor} border px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1`}>
                {icon}
                {showLabel ? `${storageMode}` : ""}
            </div>
        );
    }

    // Full view
    const isCloud = storageMode === "cloud";
    return (
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
            <div className={`h-2 w-2 rounded-full ${isCloud ? "bg-emerald-500" : "bg-muted-foreground"}`} />
            <span className="text-sm font-medium text-foreground">
                {isCloud ? "☁️ Cloud Storage" : "👤 Guest Mode"}
            </span>
        </div>
    );
}

export default StorageModeIndicator;
