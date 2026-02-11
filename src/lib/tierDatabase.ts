/**
 * PHASE 1: Tier System Database
 * 
 * Manages tier boards, tiers, and tier assignments
 */

import { initDatabase } from "./database";

const STORE_TIER_BOARDS = "tier_boards";
const STORE_TIERS = "tiers";
const STORE_TIER_ASSIGNMENTS = "tier_assignments";

// PHASE 1.1: Tier Board
export interface TierBoard {
    id?: string | number;
    name: string;
    description: string;
    createdAt: number;
    updatedAt: number;
}

// PHASE 1.2: Tier Row
export interface Tier {
    id?: string | number;
    boardId: string | number;
    name: string;
    color: string;
    order: number; // Display order
}

// PHASE 1.3: Media Placement
export interface TierAssignment {
    id?: string | number;
    boardId: string | number;
    mediaId: string | number; // DisplayMedia._entryId
    tierId: string | number | null; // null = unassigned pool
    position: number; // Order within tier
}

/**
 * Get all tier boards
 */
export async function getAllTierBoards(): Promise<TierBoard[]> {
    const db = await initDatabase();
    const transaction = db.transaction([STORE_TIER_BOARDS], "readonly");
    const store = transaction.objectStore(STORE_TIER_BOARDS);

    return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => {
            const boards = request.result.sort((a, b) => b.createdAt - a.createdAt);
            resolve(boards);
        };
        request.onerror = () => reject(request.error);
    });
}

/**
 * Get tier board by ID
 */
export async function getTierBoard(id: string | number): Promise<TierBoard | null> {
    const db = await initDatabase();
    const transaction = db.transaction([STORE_TIER_BOARDS], "readonly");
    const store = transaction.objectStore(STORE_TIER_BOARDS);

    return new Promise((resolve, reject) => {
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Create tier board
 */
export async function createTierBoard(board: Omit<TierBoard, "id" | "createdAt" | "updatedAt">): Promise<string | number> {
    const db = await initDatabase();
    const transaction = db.transaction([STORE_TIER_BOARDS], "readwrite");
    const store = transaction.objectStore(STORE_TIER_BOARDS);

    const now = Date.now();
    const boardData: TierBoard = {
        ...board,
        createdAt: now,
        updatedAt: now,
    };

    return new Promise((resolve, reject) => {
        const request = store.add(boardData);
        request.onsuccess = () => resolve(request.result as string | number);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Update tier board
 */
export async function updateTierBoard(id: string | number, updates: Partial<TierBoard>): Promise<void> {
    const db = await initDatabase();
    const transaction = db.transaction([STORE_TIER_BOARDS], "readwrite");
    const store = transaction.objectStore(STORE_TIER_BOARDS);

    return new Promise((resolve, reject) => {
        const getRequest = store.get(id);
        getRequest.onsuccess = () => {
            const existing = getRequest.result;
            if (!existing) {
                reject(new Error("Board not found"));
                return;
            }

            const updated: TierBoard = {
                ...existing,
                ...updates,
                updatedAt: Date.now(),
            };

            const putRequest = store.put(updated);
            putRequest.onsuccess = () => resolve();
            putRequest.onerror = () => reject(putRequest.error);
        };
        getRequest.onerror = () => reject(getRequest.error);
    });
}

/**
 * Delete tier board (and all associated tiers and assignments)
 */
export async function deleteTierBoard(id: string | number): Promise<void> {
    const db = await initDatabase();
    const transaction = db.transaction([STORE_TIER_BOARDS, STORE_TIERS, STORE_TIER_ASSIGNMENTS], "readwrite");
    const boardsStore = transaction.objectStore(STORE_TIER_BOARDS);
    const tiersStore = transaction.objectStore(STORE_TIERS);
    const assignmentsStore = transaction.objectStore(STORE_TIER_ASSIGNMENTS);
    const tierIndex = tiersStore.index("boardId");
    const assignmentIndex = assignmentsStore.index("boardId");

    return new Promise((resolve, reject) => {
        // Delete board
        const deleteBoard = boardsStore.delete(id);
        
        // Delete all tiers for this board
        const getTiers = tierIndex.getAll(id);
        getTiers.onsuccess = () => {
            getTiers.result.forEach(tier => {
                tiersStore.delete(tier.id);
            });

            // Delete all assignments for this board
            const getAssignments = assignmentIndex.getAll(id);
            getAssignments.onsuccess = () => {
                getAssignments.result.forEach(assignment => {
                    assignmentsStore.delete(assignment.id);
                });
                resolve();
            };
            getAssignments.onerror = () => reject(getAssignments.error);
        };
        getTiers.onerror = () => reject(getTiers.error);
        deleteBoard.onerror = () => reject(deleteBoard.error);
    });
}

/**
 * Get all tiers for a board
 */
export async function getTiersForBoard(boardId: string | number): Promise<Tier[]> {
    const db = await initDatabase();
    const transaction = db.transaction([STORE_TIERS], "readonly");
    const store = transaction.objectStore(STORE_TIERS);
    const index = store.index("boardId");

    return new Promise((resolve, reject) => {
        const request = index.getAll(boardId);
        request.onsuccess = () => {
            const tiers = request.result.sort((a, b) => a.order - b.order);
            resolve(tiers);
        };
        request.onerror = () => reject(request.error);
    });
}

/**
 * Create tier
 */
export async function createTier(tier: Omit<Tier, "id">): Promise<string | number> {
    const db = await initDatabase();
    const transaction = db.transaction([STORE_TIERS], "readwrite");
    const store = transaction.objectStore(STORE_TIERS);

    return new Promise((resolve, reject) => {
        const request = store.add(tier);
        request.onsuccess = () => resolve(request.result as string | number);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Update tier
 */
export async function updateTier(id: string | number, updates: Partial<Tier>): Promise<void> {
    const db = await initDatabase();
    const transaction = db.transaction([STORE_TIERS], "readwrite");
    const store = transaction.objectStore(STORE_TIERS);

    return new Promise((resolve, reject) => {
        const getRequest = store.get(id);
        getRequest.onsuccess = () => {
            const existing = getRequest.result;
            if (!existing) {
                reject(new Error("Tier not found"));
                return;
            }

            const updated: Tier = { ...existing, ...updates };
            const putRequest = store.put(updated);
            putRequest.onsuccess = () => resolve();
            putRequest.onerror = () => reject(putRequest.error);
        };
        getRequest.onerror = () => reject(getRequest.error);
    });
}

/**
 * Delete tier
 */
export async function deleteTier(id: string | number): Promise<void> {
    const db = await initDatabase();
    const transaction = db.transaction([STORE_TIERS, STORE_TIER_ASSIGNMENTS], "readwrite");
    const tiersStore = transaction.objectStore(STORE_TIERS);
    const assignmentsStore = transaction.objectStore(STORE_TIER_ASSIGNMENTS);
    const assignmentIndex = assignmentsStore.index("tierId");

    return new Promise((resolve, reject) => {
        // Get tier to find boardId
        const getTier = tiersStore.get(id);
        getTier.onsuccess = () => {
            const tier = getTier.result;
            if (!tier) {
                reject(new Error("Tier not found"));
                return;
            }

            // Move all assignments to unassigned (tierId = null)
            const getAssignments = assignmentIndex.getAll(id);
            getAssignments.onsuccess = () => {
                getAssignments.result.forEach(assignment => {
                    assignment.tierId = null;
                    assignmentsStore.put(assignment);
                });

                // Delete tier
                const deleteTier = tiersStore.delete(id);
                deleteTier.onsuccess = () => resolve();
                deleteTier.onerror = () => reject(deleteTier.error);
            };
            getAssignments.onerror = () => reject(getAssignments.error);
        };
        getTier.onerror = () => reject(getTier.error);
    });
}

/**
 * Get assignments for a board
 */
export async function getAssignmentsForBoard(boardId: string | number): Promise<TierAssignment[]> {
    const db = await initDatabase();
    const transaction = db.transaction([STORE_TIER_ASSIGNMENTS], "readonly");
    const store = transaction.objectStore(STORE_TIER_ASSIGNMENTS);
    const index = store.index("boardId");

    return new Promise((resolve, reject) => {
        const request = index.getAll(boardId);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Get assignments for a specific media item
 */
export async function getAssignmentsForMedia(mediaId: string | number): Promise<TierAssignment[]> {
    const db = await initDatabase();
    const transaction = db.transaction([STORE_TIER_ASSIGNMENTS], "readonly");
    const store = transaction.objectStore(STORE_TIER_ASSIGNMENTS);
    const index = store.index("mediaId");

    return new Promise((resolve, reject) => {
        const request = index.getAll(mediaId);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * Get assignments for a tier
 */
export async function getAssignmentsForTier(tierId: string | number): Promise<TierAssignment[]> {
    const db = await initDatabase();
    const transaction = db.transaction([STORE_TIER_ASSIGNMENTS], "readonly");
    const store = transaction.objectStore(STORE_TIER_ASSIGNMENTS);
    const index = store.index("tierId");

    return new Promise((resolve, reject) => {
        const request = index.getAll(tierId);
        request.onsuccess = () => {
            const assignments = request.result.sort((a, b) => a.position - b.position);
            resolve(assignments);
        };
        request.onerror = () => reject(request.error);
    });
}

/**
 * Create or update assignment (PHASE 3.2: Auto-save)
 */
export async function saveAssignment(assignment: Omit<TierAssignment, "id">): Promise<string | number> {
    const db = await initDatabase();
    const transaction = db.transaction([STORE_TIER_ASSIGNMENTS], "readwrite");
    const store = transaction.objectStore(STORE_TIER_ASSIGNMENTS);
    const index = store.index("boardId_mediaId");

    return new Promise((resolve, reject) => {
        // Check if assignment already exists
        const getExisting = index.get([assignment.boardId, assignment.mediaId]);
        getExisting.onsuccess = () => {
            if (getExisting.result) {
                // Update existing
                const updated: TierAssignment = {
                    ...getExisting.result,
                    ...assignment,
                };
                const putRequest = store.put(updated);
                putRequest.onsuccess = () => resolve(getExisting.result.id as string | number);
                putRequest.onerror = () => reject(putRequest.error);
            } else {
                // Create new
                const addRequest = store.add(assignment);
                addRequest.onsuccess = () => resolve(addRequest.result as string | number);
                addRequest.onerror = () => reject(addRequest.error);
            }
        };
        getExisting.onerror = () => reject(getExisting.error);
    });
}

/**
 * Delete assignment (move back to pool)
 */
export async function deleteAssignment(id: string | number): Promise<void> {
    const db = await initDatabase();
    const transaction = db.transaction([STORE_TIER_ASSIGNMENTS], "readwrite");
    const store = transaction.objectStore(STORE_TIER_ASSIGNMENTS);

    return new Promise((resolve, reject) => {
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
    });
}

/**
 * PHASE 1.4: Create default board
 */
export async function createDefaultBoard(): Promise<string | number> {
    const boards = await getAllTierBoards();
    if (boards.length > 0) {
        return boards[0].id!;
    }

    const defaultBoardId = await createTierBoard({
        name: "Main Rankings",
        description: "Your main tier ranking board",
    });

    // Create default tiers (S, A, B, C, D, F)
    const defaultTiers = [
        { name: "S", color: "#FF6B6B", order: 0 },
        { name: "A", color: "#4ECDC4", order: 1 },
        { name: "B", color: "#45B7D1", order: 2 },
        { name: "C", color: "#FFA07A", order: 3 },
        { name: "D", color: "#98D8C8", order: 4 },
        { name: "F", color: "#95A5A6", order: 5 },
    ];

    for (const tier of defaultTiers) {
        await createTier({
            boardId: defaultBoardId,
            ...tier,
        });
    }

    return defaultBoardId;
}

/**
 * Get unassigned items for a board (items in pool)
 */
export async function getUnassignedForBoard(boardId: string | number): Promise<TierAssignment[]> {
    const assignments = await getAssignmentsForBoard(boardId);
    return assignments.filter(a => a.tierId === null).sort((a, b) => a.position - b.position);
}
/**
 * MIGRATION: Get everything from all stores
 */
export async function dbGetAllLocalTiers(): Promise<Tier[]> {
    const db = await initDatabase();
    const transaction = db.transaction([STORE_TIERS], "readonly");
    const store = transaction.objectStore(STORE_TIERS);
    return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

export async function dbGetAllLocalAssignments(): Promise<TierAssignment[]> {
    const db = await initDatabase();
    const transaction = db.transaction([STORE_TIER_ASSIGNMENTS], "readonly");
    const store = transaction.objectStore(STORE_TIER_ASSIGNMENTS);
    return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

/**
 * MIGRATION: Clear all local tier data
 */
export async function dbClearAllLocalTierData(): Promise<void> {
    const db = await initDatabase();
    const transaction = db.transaction([STORE_TIER_BOARDS, STORE_TIERS, STORE_TIER_ASSIGNMENTS], "readwrite");
    transaction.objectStore(STORE_TIER_BOARDS).clear();
    transaction.objectStore(STORE_TIERS).clear();
    transaction.objectStore(STORE_TIER_ASSIGNMENTS).clear();
    return new Promise((resolve) => {
        transaction.oncomplete = () => resolve();
    });
}
