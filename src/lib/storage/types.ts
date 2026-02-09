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
    entryId: number;
    seriesId: number;
    userId: number;
    data: any; // DisplayMedia (partial - only user-editable fields)
    editedAt: number;
    deleted: boolean; // Soft delete
}

// ============= Tier System =============
export interface TierBoard {
    id?: number;
    userId?: number; // For cloud sync
    name: string;
    description: string;
    createdAt: number;
    updatedAt: number;
}

export interface Tier {
    id?: number;
    boardId: number;
    userId?: number; // For cloud sync
    name: string;
    color: string;
    order: number;
}

export interface TierAssignment {
    id?: number;
    boardId: number;
    mediaId: number;
    tierId: number | null;
    position: number;
    userId?: number; // For cloud sync
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
    id?: number;
    userId: number;
    entity: string; // "user_entry", "tier_board", "tier_assignment", etc.
    entityId: number;
    operation: "create" | "update" | "delete";
    timestamp: number;
    synced: boolean;
    syncedAt?: number;
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
    getUserEntry(entryId: number): Promise<UserEntry | null>;
    getAllUserEntries(userId: number): Promise<Map<number, UserEntry>>;
    saveUserEntry(entry: UserEntry): Promise<void>;
    deleteUserEntry(entryId: number): Promise<void>;
    hardDeleteUserEntry(entryId: number): Promise<void>;

    /**
     * Tier Board Operations
     */
    getTierBoard(id: number): Promise<TierBoard | null>;
    getAllTierBoards(userId?: number): Promise<TierBoard[]>;
    createTierBoard(board: Omit<TierBoard, "id" | "createdAt" | "updatedAt">): Promise<number>;
    updateTierBoard(id: number, updates: Partial<TierBoard>): Promise<void>;
    deleteTierBoard(id: number): Promise<void>;

    /**
     * Tier Operations
     */
    getTier(id: number): Promise<Tier | null>;
    getTiersByBoard(boardId: number): Promise<Tier[]>;
    createTier(tier: Omit<Tier, "id">): Promise<number>;
    updateTier(id: number, updates: Partial<Tier>): Promise<void>;
    deleteTier(id: number): Promise<void>;

    /**
     * Tier Assignment Operations
     */
    getAssignment(id: number): Promise<TierAssignment | null>;
    getAssignmentsForBoard(boardId: number): Promise<TierAssignment[]>;
    getAssignmentsForMedia(mediaId: number): Promise<TierAssignment[]>;
    saveAssignment(assignment: Omit<TierAssignment, "id">): Promise<number>;
    updateAssignment(id: number, updates: Partial<TierAssignment>): Promise<void>;
    deleteAssignment(id: number): Promise<void>;

    /**
     * Sync Operations (for cloud provider)
     */
    recordSync?(record: Omit<SyncRecord, "id">): Promise<void>;
    getPendingSyncs?(userId: number): Promise<SyncRecord[]>;
    markSynced?(recordId: number): Promise<void>;

    /**
     * Settings Operations
     */
    getSetting?(userId: number, key: string): Promise<any | null>;
    setSetting?(userId: number, key: string, value: any): Promise<void>;
}
