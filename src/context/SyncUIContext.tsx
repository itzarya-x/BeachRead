/**
 * Sync UI Context
 *
 * Provides sync UI state to all components.
 * Manages dialogs, status, conflicts globally.
 */

import type { ConflictItem } from "@/components/sync/ConflictResolver";
import type { SyncStatus } from "@/components/sync/SyncStatusIndicator";
import { useSyncUI } from "@/hooks/useSyncUI";
import React, { createContext, useContext } from "react";

interface SyncUIContextValue {
    syncStatus: SyncStatus;
    syncStats: {
        itemsUploaded: number;
        itemsDownloaded: number;
        conflictCount: number;
        lastSyncTime?: Date;
    };
    showFirstLoginDialog: boolean;
    showSyncDetails: boolean;
    showConflictResolver: boolean;
    conflicts: ConflictItem[];
    localItemCount: number;
    cloudItemCount: number;
    updateSyncStatus: (status: SyncStatus) => void;
    updateSyncStats: (
        stats: Partial<{
            itemsUploaded: number;
            itemsDownloaded: number;
            conflictCount: number;
            lastSyncTime?: Date;
        }>,
    ) => void;
    showFirstLogin: (local: number, cloud: number) => void;
    hideFirstLogin: () => void;
    setShowSyncDetails: (show: boolean) => void;
    showConflicts: (items: ConflictItem[]) => void;
    hideConflicts: () => void;
}

const SyncUIContext = createContext<SyncUIContextValue | null>(null);

export function useSyncUIContext(): SyncUIContextValue {
    const ctx = useContext(SyncUIContext);
    if (!ctx) {
        throw new Error("useSyncUIContext must be used within SyncUIProvider");
    }
    return ctx;
}

export function SyncUIProvider({ children }: { children: React.ReactNode }) {
    const syncUI = useSyncUI();

    return <SyncUIContext.Provider value={syncUI as SyncUIContextValue}>{children}</SyncUIContext.Provider>;
}
