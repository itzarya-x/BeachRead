/**
 * Storage Provider Abstraction Layer
 *
 * Decouples the app from specific storage implementations.
 * Allows seamless switching between local (IndexedDB) and cloud (Supabase) storage.
 *
 * CRITICAL: App must work offline - local storage is always primary.
 * Cloud is replication & sync only.
 */

// ============= Media Cache =============
export interface MediaCacheEntry {
    id: number;
    data: any; // AniListMediaResponse
    fetchedAt: number;
}

// ============= User Entries (List Items) =============
export interface UserEntry {
    entryId: string | number;
    seriesId: number;
    userId: string | number;
    data: any; // DisplayMedia (partial - only user-editable fields)
    editedAt: number;
    deleted: boolean; // Soft delete
}

// ============= Tier System =============
// PHASE 1.1: Tier Board
export interface TierBoard {
    id?: string | number;
    name: string;
    description: string;
    createdAt: number;
    updatedAt: number;
}

export interface Tier {
    id?: string | number;
    boardId: string | number;
    userId?: string | number; // For cloud sync
    name: string;
    color: string;
    order: number;
}

// PHASE 1.3: Media Placement
export interface TierAssignment {
    id?: string | number;
    boardId: string | number;
    mediaId: string | number; // DisplayMedia._entryId
    tierId: string | number | null; // null = unassigned pool
    position: number; // Order within tier
    userId?: string | number; // For cloud sync
}

// ============= Tags/Custom Lists =============
export interface Tag {
    id?: number;
    userId: number;
    name: string;
    createdAt: number;
    updatedAt: number;
}

// ============= Settings =============
export interface UserSettings {
    userId: number;
    key: string;
    value: any;
    updatedAt: number;
}

// ============= Sync Metadata =============
export interface SyncRecord {
    id?: string | number;
    userId: string | number;
    entity: string; // "user_entry", "tier_board", "tier_assignment", etc.
    entityId: string | number;
    operation: "create" | "update" | "delete";
    timestamp: number;
    synced: boolean;
    syncedAt?: number;
}

// ============= Activity Log =============
export interface ActivityLog {
    id?: string | number;
    userId: string | number;
    seriesId?: number;
    actionType: string; // 'progress', 'add', 'status_change', 'tier_move', 'rating_change'
    mediaType?: string; // 'ANIME', 'MANGA'
    details: any;
    createdAt: string;
}
// ============= Storage Provider Interface =============
export interface IStorageProvider {
    /**
     * Initialization
     */
    initialize(): Promise<void>;
    isReady(): boolean;

    /**
     * Media Cache Operations
     */
    getMediaCache(id: number): Promise<any | null>;
    getAllMediaCache(): Promise<Map<number, any>>;
    saveMediaCache(id: number, data: any): Promise<void>;
    deleteMediaCache(id: number): Promise<void>;

    /**
     * User Entry Operations (List Items)
     */
    getUserEntry(entryId: string | number): Promise<UserEntry | null>;
    getAllUserEntries(userId: string | number, onProgress?: (entries: UserEntry[]) => void): Promise<Map<string | number, UserEntry>>;
    saveUserEntry(entry: UserEntry): Promise<string | number>;
    saveUserEntries(entries: UserEntry[]): Promise<void>;
    deleteUserEntry(entryId: string | number): Promise<void>;
    hardDeleteUserEntry(entryId: string | number): Promise<void>;

    /**
     * Tier Board Operations
     */
    getTierBoard(id: string | number): Promise<TierBoard | null>;
    getAllTierBoards(userId?: string | number): Promise<TierBoard[]>;
    createTierBoard(board: Omit<TierBoard, "id" | "createdAt" | "updatedAt">): Promise<string | number>;
    updateTierBoard(id: string | number, updates: Partial<TierBoard>): Promise<void>;
    deleteTierBoard(id: string | number): Promise<void>;

    /**
     * Tier Operations
     */
    getTier(id: string | number): Promise<Tier | null>;
    getTiersByBoard(boardId: string | number): Promise<Tier[]>;
    createTier(tier: Omit<Tier, "id">): Promise<string | number>;
    updateTier(id: string | number, updates: Partial<Tier>): Promise<void>;
    deleteTier(id: string | number): Promise<void>;

    /**
     * Tier Assignment Operations
     */
    getAssignment(id: string | number): Promise<TierAssignment | null>;
    getAssignmentsForBoard(boardId: string | number): Promise<TierAssignment[]>;
    getAssignmentsForMedia(mediaId: string | number): Promise<TierAssignment[]>;
    saveAssignment(assignment: Omit<TierAssignment, "id">): Promise<string | number>;
    updateAssignment(id: string | number, updates: Partial<TierAssignment>): Promise<void>;
    deleteAssignment(id: string | number): Promise<void>;

    /**
     * Sync Operations (for cloud provider)
     */
    recordSync?(record: Omit<SyncRecord, "id">): Promise<void>;
    getPendingSyncs?(userId: string | number): Promise<SyncRecord[]>;
    markSynced?(recordId: string | number): Promise<void>;

    /**
     * Settings Operations
     */
    getSetting?(userId: number, key: string): Promise<any | null>;
    setSetting?(userId: number, key: string, value: any): Promise<void>;

    /**
     * Activity Operations
     */
    logActivity(activity: Omit<ActivityLog, "id" | "userId" | "createdAt">): Promise<void>;
    getActivities(userId: string | number): Promise<ActivityLog[]>;
}
