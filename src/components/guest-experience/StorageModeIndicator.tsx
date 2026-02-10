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
            <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                [{storageMode}]
            </span>
        );
    }

    if (variant === "badge") {
        const isCloud = storageMode === "cloud";
        const bgColor = isCloud ? "bg-green-100 dark:bg-green-900" : "bg-gray-100 dark:bg-gray-800";
        const textColor = isCloud ? "text-green-700 dark:text-green-300" : "text-gray-700 dark:text-gray-300";
        const borderColor = isCloud ? "border-green-300 dark:border-green-700" : "border-gray-300 dark:border-gray-600";
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
        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg">
            <div className={`w-2 h-2 rounded-full ${isCloud ? "bg-green-500" : "bg-gray-500"}`} />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {isCloud ? "☁️ Cloud Storage" : "👤 Guest Mode"}
            </span>
        </div>
    );
}

export default StorageModeIndicator;
