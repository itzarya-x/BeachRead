/**
 * TASK 11: Conflict Handling
 * 
 * If reimport: Ask Replace / Merge / Keep Yura edits
 */

import type { DisplayMedia } from "@/types/display";
import { getAllUserEntries } from "./database";

export type ConflictResolution = "replace" | "merge" | "keep";

export interface ConflictInfo {
    entryId: number;
    yuraEntry: DisplayMedia;
    anilistEntry: Partial<DisplayMedia>;
    conflicts: string[]; // Fields that differ
}

/**
 * Detect conflicts between Yura edits and AniList data
 */
export async function detectConflicts(
    userId: number,
    anilistEntries: Partial<DisplayMedia>[]
): Promise<ConflictInfo[]> {
    const userEdits = await getAllUserEntries(userId);
    const conflicts: ConflictInfo[] = [];

    for (const anilistEntry of anilistEntries) {
        if (!anilistEntry._entryId) continue;

        const userEdit = userEdits.get(anilistEntry._entryId);
        if (!userEdit || userEdit.deleted) continue;

        // Compare fields
        const conflictFields: string[] = [];
        const yuraData = userEdit.data;

        // Check editable fields
        const editableFields: (keyof DisplayMedia)[] = [
            "status", "score", "progress", "progressVolumes", "repeat",
            "priority", "tierId", "notes", "customLists", "startedAt", "completedAt"
        ];

        for (const field of editableFields) {
            if (yuraData[field] !== undefined && anilistEntry[field] !== undefined) {
                if (JSON.stringify(yuraData[field]) !== JSON.stringify(anilistEntry[field])) {
                    conflictFields.push(field);
                }
            }
        }

        if (conflictFields.length > 0) {
            conflicts.push({
                entryId: anilistEntry._entryId,
                yuraEntry: yuraData as DisplayMedia,
                anilistEntry,
                conflicts: conflictFields,
            });
        }
    }

    return conflicts;
}

/**
 * Resolve conflicts based on user choice
 */
export function resolveConflict(
    conflict: ConflictInfo,
    resolution: ConflictResolution
): Partial<DisplayMedia> {
    switch (resolution) {
        case "replace":
            // Use AniList data, discard Yura edits
            return conflict.anilistEntry;

        case "merge":
            // Merge: AniList for metadata, Yura for user edits
            return {
                ...conflict.anilistEntry,
                // Keep Yura user-editable fields
                status: conflict.yuraEntry.status,
                score: conflict.yuraEntry.score,
                progress: conflict.yuraEntry.progress,
                progressVolumes: conflict.yuraEntry.progressVolumes,
                repeat: conflict.yuraEntry.repeat,
                priority: conflict.yuraEntry.priority,
                tierId: conflict.yuraEntry.tierId,
                notes: conflict.yuraEntry.notes,
                customLists: conflict.yuraEntry.customLists,
                startedAt: conflict.yuraEntry.startedAt,
                completedAt: conflict.yuraEntry.completedAt,
            };

        case "keep":
            // Keep Yura edits, ignore AniList changes
            return conflict.yuraEntry;

        default:
            return conflict.yuraEntry;
    }
}
