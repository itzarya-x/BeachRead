/**
 * PHASE 9: Integration - Tier Badge Hook
 * Shows how many boards an item is ranked in
 */

import { getAllTierBoards, getAssignmentsForBoard } from "@/lib/tierDatabase";
import { useEffect, useState } from "react";

export function useTierBadge(mediaId: number | string): number {
    const [boardCount, setBoardCount] = useState(0);

    useEffect(() => {
        async function load() {
            try {
                const boards = await getAllTierBoards();
                let count = 0;

                for (const board of boards) {
                    if (!board.id) continue;
                    const assignments = await getAssignmentsForBoard(board.id);
                    if (assignments.some(a => a.mediaId === mediaId && a.tierId !== null)) {
                        count++;
                    }
                }

                setBoardCount(count);
            } catch (err) {
                console.error("Failed to load tier badge:", err);
            }
        }
        load();
    }, [mediaId]);

    return boardCount;
}
