/**
 * TASK 14: Migration Utilities
 * 
 * Add originType and tierId to existing items without breaking UI
 */

import type { DisplayMedia } from "@/types/display";
import { mapCountryToOriginType } from "./gdpr-parser";
import { getCachedMedia } from "./anilist-api";

/**
 * Migrate existing entries to include originType and tierId
 */
export function migrateEntries(entries: DisplayMedia[]): DisplayMedia[] {
    return entries.map(entry => {
        const migrated: DisplayMedia = { ...entry };

        // TASK 14: Add originType if missing (for manga)
        if (entry.mediaType === "MANGA" && !entry.originType) {
            const cached = getCachedMedia(entry._seriesId);
            migrated.originType = mapCountryToOriginType(cached?.countryOfOrigin);
        } else if (!entry.originType) {
            migrated.originType = "manga"; // Default
        }

        // TASK 14: Add tierId if missing (default to null)
        if (migrated.tierId === undefined) {
            migrated.tierId = null;
        }

        return migrated;
    });
}

/**
 * Check if migration is needed
 */
export function needsMigration(entry: DisplayMedia): boolean {
    return (
        entry.originType === undefined ||
        entry.tierId === undefined
    );
}
