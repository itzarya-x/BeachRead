/**
 * useSyncUI Hook
 *
 * Provides UI state for sync components.
 * Manages sync status, dialogs, conflicts, etc.
 */

import type { ConflictItem } from "@/components/sync/ConflictResolver";
import type { SyncStatus } from "@/components/sync/SyncStatusIndicator";
import { useCallback, useEffect, useState } from "react";

interface SyncStats {
    itemsUploaded: number;
    itemsDownloaded: number;
    conflictCount: number;
    lastSyncTime?: Date;
}

export function useSyncUI() {
    const [syncStatus, setSyncStatus] = useState<SyncStatus>("unknown");
    const [syncStats, setSyncStats] = useState<SyncStats>({
        itemsUploaded: 0,
        itemsDownloaded: 0,
        conflictCount: 0,
    });
    const [showFirstLoginDialog, setShowFirstLoginDialog] = useState(false);
    const [showSyncDetails, setShowSyncDetails] = useState(false);
    const [showConflictResolver, setShowConflictResolver] = useState(false);
    const [conflicts, setConflicts] = useState<ConflictItem[]>([]);
    const [localItemCount, setLocalItemCount] = useState(0);
    const [cloudItemCount, setCloudItemCount] = useState(0);

    // TODO: Listen to sync engine events
    useEffect(() => {
        // When sync engine emits events, update status
        // This is placeholder for future integration
    }, []);

    const updateSyncStatus = useCallback((status: SyncStatus) => {
        setSyncStatus(status);
    }, []);

    const updateSyncStats = useCallback((stats: Partial<SyncStats>) => {
        setSyncStats(prev => ({ ...prev, ...stats }));
    }, []);

    const showFirstLogin = useCallback((local: number, cloud: number) => {
        setLocalItemCount(local);
        setCloudItemCount(cloud);
        setShowFirstLoginDialog(true);
    }, []);

    const hideFirstLogin = useCallback(() => {
        setShowFirstLoginDialog(false);
    }, []);

    const showConflicts = useCallback((items: ConflictItem[]) => {
        setConflicts(items);
        setShowConflictResolver(true);
    }, []);

    const hideConflicts = useCallback(() => {
        setConflicts([]);
        setShowConflictResolver(false);
    }, []);

    return {
        // Status
        syncStatus,
        syncStats,

        // Dialogs
        showFirstLoginDialog,
        showSyncDetails,
        showConflictResolver,

        // Data
        conflicts,
        localItemCount,
        cloudItemCount,

        // Methods
        updateSyncStatus,
        updateSyncStats,
        showFirstLogin,
        hideFirstLogin,
        setShowSyncDetails,
        showConflicts,
        hideConflicts,
    };
}
