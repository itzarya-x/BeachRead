/**
 * TASK 2 & 3: Local Database (IndexedDB)
 * 
 * Stores:
 * - media_cache: AniList media metadata (source of truth for enrichment)
 * - user_entries: User's list entries (Yura becomes authority after edit)
 * 
 * Structure:
 * - media_cache: { id, data, fetchedAt }
 * - user_entries: { entryId, seriesId, userId, data, editedAt, deleted }
 */

const DB_NAME = "yura_database";
const DB_VERSION = 2; // Incremented for tier system

// Store names
const STORE_MEDIA_CACHE = "media_cache";
const STORE_USER_ENTRIES = "user_entries";
const STORE_TIER_BOARDS = "tier_boards";
const STORE_TIERS = "tiers";
const STORE_TIER_ASSIGNMENTS = "tier_assignments";

let dbInstance: IDBDatabase | null = null;

export interface MediaCacheEntry {
    id: number;
    data: any; // AniListMediaResponse
    fetchedAt: number; // timestamp
}

export interface UserEntry {
    entryId: string | number;
    seriesId: number;
    userId: string | number;
    data: any; // DisplayMedia (partial - only user-editable fields)
    editedAt: number; // timestamp
    deleted: boolean; // TASK 4: Soft delete
}

/**
 * Initialize IndexedDB
 */
export async function initDatabase(): Promise<IDBDatabase> {
    if (dbInstance) return dbInstance;

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
            dbInstance = request.result;
            resolve(dbInstance);
        };

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;

            // Create media_cache store
            if (!db.objectStoreNames.contains(STORE_MEDIA_CACHE)) {
                const mediaStore = db.createObjectStore(STORE_MEDIA_CACHE, { keyPath: "id" });
                mediaStore.createIndex("fetchedAt", "fetchedAt", { unique: false });
            }

            // Create user_entries store
            if (!db.objectStoreNames.contains(STORE_USER_ENTRIES)) {
                const entriesStore = db.createObjectStore(STORE_USER_ENTRIES, { keyPath: "entryId" });
                entriesStore.createIndex("seriesId", "seriesId", { unique: false });
                entriesStore.createIndex("userId", "userId", { unique: false });
                entriesStore.createIndex("deleted", "deleted", { unique: false });
            }

            // PHASE 1: Tier system stores
            if (!db.objectStoreNames.contains(STORE_TIER_BOARDS)) {
                const boardsStore = db.createObjectStore(STORE_TIER_BOARDS, { keyPath: "id", autoIncrement: true });
                boardsStore.createIndex("createdAt", "createdAt", { unique: false });
            }

            if (!db.objectStoreNames.contains(STORE_TIERS)) {
                const tiersStore = db.createObjectStore(STORE_TIERS, { keyPath: "id", autoIncrement: true });
                tiersStore.createIndex("boardId", "boardId", { unique: false });
                tiersStore.createIndex("order", "order", { unique: false });
            }

            if (!db.objectStoreNames.contains(STORE_TIER_ASSIGNMENTS)) {
                const assignmentsStore = db.createObjectStore(STORE_TIER_ASSIGNMENTS, { keyPath: "id", autoIncrement: true });
                assignmentsStore.createIndex("boardId", "boardId", { unique: false });
                assignmentsStore.createIndex("tierId", "tierId", { unique: false });
                assignmentsStore.createIndex("mediaId", "mediaId", { unique: false });
                assignmentsStore.createIndex("boardId_mediaId", ["boardId", "mediaId"], { unique: false });
            }
        };
    });
}

/**
 * TASK 2: Save media cache entry
 */
export async function saveMediaCache(id: number, data: any): Promise<void> {
    const db = await initDatabase();
    const transaction = db.transaction([STORE_MEDIA_CACHE], "readwrite");
    const store = transaction.objectStore(STORE_MEDIA_CACHE);

    await new Promise<void>((resolve, reject) => {
        const request = store.put({
            id,
            data,
            fetchedAt: Date.now(),
        });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

/**
 * TASK 2: Get media cache entry
 */
export async function getMediaCache(id: number): Promise<any | null> {
    const db = await initDatabase();
    const transaction = db.transaction([STORE_MEDIA_CACHE], "readonly");
    const store = transaction.objectStore(STORE_MEDIA_CACHE);

    return new Promise((resolve, reject) => {
        const request = store.get(id);
        request.onsuccess = () => {
            const result = request.result;
            resolve(result ? result.data : null);
        };
        request.onerror = () => reject(request.error);
    });
}

/**
 * TASK 2: Get all media cache entries
 */
export async function getAllMediaCache(): Promise<Map<number, any>> {
    const db = await initDatabase();
    const transaction = db.transaction([STORE_MEDIA_CACHE], "readonly");
    const store = transaction.objectStore(STORE_MEDIA_CACHE);

    return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => {
            const map = new Map<number, any>();
            for (const entry of request.result) {
                map.set(entry.id, entry.data);
            }
            resolve(map);
        };
        request.onerror = () => reject(request.error);
    });
}

/**
 * TASK 3: Save user entry (preserves user edits)
 */
export async function saveUserEntry(entry: UserEntry): Promise<string | number> {
    const db = await initDatabase();
    const transaction = db.transaction([STORE_USER_ENTRIES], "readwrite");
    const store = transaction.objectStore(STORE_USER_ENTRIES);

    return new Promise((resolve, reject) => {
        const request = store.put({
            ...entry,
            editedAt: Date.now(),
        });
        request.onsuccess = () => resolve(request.result as string | number);
        request.onerror = () => reject(request.error);
    });
}

/**
 * TASK 3: Get user entry
 */
export async function getUserEntry(entryId: string | number): Promise<UserEntry | null> {
    const db = await initDatabase();
    const transaction = db.transaction([STORE_USER_ENTRIES], "readonly");
    const store = transaction.objectStore(STORE_USER_ENTRIES);

    return new Promise((resolve, reject) => {
        const request = store.get(entryId);
        request.onsuccess = () => {
            resolve(request.result || null);
        };
        request.onerror = () => reject(request.error);
    });
}

/**
 * TASK 3: Get all user entries for a user
 */
export async function getAllUserEntries(userId: string | number): Promise<Map<string | number, UserEntry>> {
    const db = await initDatabase();
    const transaction = db.transaction([STORE_USER_ENTRIES], "readonly");
    const store = transaction.objectStore(STORE_USER_ENTRIES);
    const index = store.index("userId");

    return new Promise((resolve, reject) => {
        const request = index.getAll(userId);
        request.onsuccess = () => {
            const map = new Map<string | number, UserEntry>();
            for (const entry of request.result) {
                if (!entry.deleted) {
                    map.set(entry.entryId, entry);
                }
            }
            resolve(map);
        };
        request.onerror = () => reject(request.error);
    });
}

/**
 * TASK 4: Soft delete user entry
 */
export async function deleteUserEntry(entryId: string | number): Promise<void> {
    const entry = await getUserEntry(entryId);
    if (!entry) return;

    await saveUserEntry({
        ...entry,
        deleted: true,
    });
}

/**
 * TASK 4: Hard delete user entry (permanent removal)
 */
export async function hardDeleteUserEntry(entryId: string | number): Promise<void> {
    const db = await initDatabase();
    const transaction = db.transaction([STORE_USER_ENTRIES], "readwrite");
    const store = transaction.objectStore(STORE_USER_ENTRIES);

    await new Promise<void>((resolve, reject) => {
        const request = store.delete(entryId);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}
/**
 * MIGRATION: Get ALL entries in IndexedDB (including guests)
 */
export async function dbGetAllLocalEntries(): Promise<UserEntry[]> {
    const db = await initDatabase();
    const transaction = db.transaction([STORE_USER_ENTRIES], "readonly");
    const store = transaction.objectStore(STORE_USER_ENTRIES);

    return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * MIGRATION: Clear all local user entries
 */
export async function dbClearAllLocalEntries(): Promise<void> {
    const db = await initDatabase();
    const transaction = db.transaction([STORE_USER_ENTRIES], "readwrite");
    const store = transaction.objectStore(STORE_USER_ENTRIES);

    return new Promise((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}
