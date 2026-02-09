/**
 * Tier Storage Wrapper
 *
 * Provides convenience functions that map the old tierDatabase API
 * to the new storage provider API.
 *
 * This allows gradual migration of existing components without rewriting them.
 */

import { getStorageProvider } from "@/lib/storage";
import type { Tier, TierAssignment, TierBoard } from "@/lib/storage/types";

// Re-export types for convenience
export type { Tier, TierAssignment, TierBoard };

// ============= Tier Boards =============
export async function getAllTierBoards(): Promise<TierBoard[]> {
    const storage = getStorageProvider();
    return storage.getAllTierBoards();
}

export async function getTierBoard(id: number): Promise<TierBoard | null> {
    const storage = getStorageProvider();
    return storage.getTierBoard(id);
}

export async function createTierBoard(board: Omit<TierBoard, "id" | "createdAt" | "updatedAt">): Promise<number> {
    const storage = getStorageProvider();
    return storage.createTierBoard(board);
}

export async function createDefaultBoard(): Promise<number> {
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

export async function updateTierBoard(id: number, updates: Partial<TierBoard>): Promise<void> {
    const storage = getStorageProvider();
    return storage.updateTierBoard(id, updates);
}

export async function deleteTierBoard(id: number): Promise<void> {
    const storage = getStorageProvider();
    return storage.deleteTierBoard(id);
}

// ============= Tiers =============
export async function getTier(id: number): Promise<Tier | null> {
    const storage = getStorageProvider();
    return storage.getTier(id);
}

export async function getTiersByBoard(boardId: number): Promise<Tier[]> {
    const storage = getStorageProvider();
    return storage.getTiersByBoard(boardId);
}

// Alias for compatibility with old API
export const getTiersForBoard = getTiersByBoard;

export async function createTier(tier: Omit<Tier, "id">): Promise<number> {
    const storage = getStorageProvider();
    return storage.createTier(tier);
}

export async function updateTier(id: number, updates: Partial<Tier>): Promise<void> {
    const storage = getStorageProvider();
    return storage.updateTier(id, updates);
}

export async function deleteTier(id: number): Promise<void> {
    const storage = getStorageProvider();
    return storage.deleteTier(id);
}

// ============= Tier Assignments =============
export async function getAssignment(id: number): Promise<TierAssignment | null> {
    const storage = getStorageProvider();
    return storage.getAssignment(id);
}

export async function getAssignmentsForBoard(boardId: number): Promise<TierAssignment[]> {
    const storage = getStorageProvider();
    return storage.getAssignmentsForBoard(boardId);
}

export async function getAssignmentsForMedia(mediaId: number): Promise<TierAssignment[]> {
    const storage = getStorageProvider();
    return storage.getAssignmentsForMedia(mediaId);
}

export async function getAssignmentsForTier(tierId: number): Promise<TierAssignment[]> {
    const storage = getStorageProvider();
    const assignments = await storage.getAssignmentsForBoard(0); // TODO: track tierId in assignments
    return assignments.filter(a => a.tierId === tierId).sort((a, b) => a.position - b.position);
}

export async function saveAssignment(assignment: Omit<TierAssignment, "id">): Promise<number> {
    const storage = getStorageProvider();
    return storage.saveAssignment(assignment);
}

export async function updateAssignment(id: number, updates: Partial<TierAssignment>): Promise<void> {
    const storage = getStorageProvider();
    return storage.updateAssignment(id, updates);
}

export async function deleteAssignment(id: number): Promise<void> {
    const storage = getStorageProvider();
    return storage.deleteAssignment(id);
}

export async function getUnassignedForBoard(boardId: number): Promise<TierAssignment[]> {
    const assignments = await getAssignmentsForBoard(boardId);
    return assignments.filter(a => a.tierId === null).sort((a, b) => a.position - b.position);
}
