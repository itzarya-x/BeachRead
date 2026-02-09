/**
 * PHASE 4.4: Conflict Resolution
 *
 * Handles conflicts when both local and cloud have changes.
 * v1: Last write wins (by updatedAt timestamp)
 * Can be enhanced later with smarter strategies.
 */

export interface ConflictResolutionStrategy {
    name: string;
    description: string;
    resolve(local: any, cloud: any): "local" | "cloud" | "merged";
}

/**
 * v1 Strategy: Last Write Wins
 *
 * Compares updatedAt timestamps. Whoever changed most recently wins.
 * Simple, predictable, prevents data loss by queuing the losing side.
 */
export const lastWriteWinsStrategy: ConflictResolutionStrategy = {
    name: "Last Write Wins",
    description: "The version with the most recent update timestamp is kept",

    resolve(local: any, cloud: any): "local" | "cloud" {
        const localTime = local.updatedAt ? new Date(local.updatedAt).getTime() : 0;
        const cloudTime = cloud.updatedAt ? new Date(cloud.updatedAt).getTime() : 0;

        if (localTime === cloudTime) {
            // Timestamps equal - prefer local (user's recent change)
            return "local";
        }

        return localTime > cloudTime ? "local" : "cloud";
    },
};

/**
 * Enhanced Strategy: Three-Way Merge
 *
 * For future use: compares against a common base version
 * Allows merging of non-conflicting changes
 */
export interface MergeConflict {
    base: any;
    local: any;
    cloud: any;
}

export function canThreeWayMerge(conflict: MergeConflict): boolean {
    // Only merge if we have all three versions
    if (!conflict.base || !conflict.local || !conflict.cloud) {
        return false;
    }

    // Only merge if changes are in different fields
    const baseKeys = Object.keys(conflict.base || {});
    const localChanges = Object.keys(conflict.local || {}).filter(k => conflict.local[k] !== conflict.base?.[k]);
    const cloudChanges = Object.keys(conflict.cloud || {}).filter(k => conflict.cloud[k] !== conflict.base?.[k]);

    // Check if changes are in different fields
    const localFields = new Set(localChanges);
    const cloudFields = new Set(cloudChanges);

    for (const field of localFields) {
        if (cloudFields.has(field)) {
            // Same field changed in both - conflict, can't merge
            return false;
        }
    }

    return true;
}

export function threeWayMerge(conflict: MergeConflict): any {
    if (!canThreeWayMerge(conflict)) {
        // Fall back to last-write-wins
        return lastWriteWinsStrategy.resolve(conflict.local, conflict.cloud) === "local"
            ? conflict.local
            : conflict.cloud;
    }

    // Start with base
    const merged = { ...conflict.base };

    // Apply local changes
    for (const [key, value] of Object.entries(conflict.local || {})) {
        if (value !== conflict.base?.[key]) {
            merged[key] = value;
        }
    }

    // Apply cloud changes
    for (const [key, value] of Object.entries(conflict.cloud || {})) {
        if (value !== conflict.base?.[key]) {
            merged[key] = value;
        }
    }

    // Use latest timestamp
    const localTime = conflict.local?.updatedAt ? new Date(conflict.local.updatedAt).getTime() : 0;
    const cloudTime = conflict.cloud?.updatedAt ? new Date(conflict.cloud.updatedAt).getTime() : 0;
    merged.updatedAt = localTime > cloudTime ? conflict.local.updatedAt : conflict.cloud.updatedAt;

    return merged;
}

/**
 * Resolve a conflict using specified strategy
 */
export function resolveConflict(
    local: any,
    cloud: any,
    strategy: ConflictResolutionStrategy = lastWriteWinsStrategy,
): { winner: any; loser: any; strategy: string } {
    const winner = strategy.resolve(local, cloud) === "local" ? local : cloud;
    const loser = strategy.resolve(local, cloud) === "local" ? cloud : local;

    return {
        winner,
        loser,
        strategy: strategy.name,
    };
}

/**
 * Detect if a conflict occurred between two versions
 */
export function detectConflict(local: any, cloud: any, base?: any): boolean {
    if (!local || !cloud) {
        return false;
    }

    // No base - if both changed, it's a conflict
    if (!base) {
        return JSON.stringify(local) !== JSON.stringify(cloud);
    }

    // With base: both sides changed the same field
    const baseStr = JSON.stringify(base);
    const localStr = JSON.stringify(local);
    const cloudStr = JSON.stringify(cloud);

    const localChanged = localStr !== baseStr;
    const cloudChanged = cloudStr !== baseStr;
    const sameResult = localStr === cloudStr;

    return localChanged && cloudChanged && !sameResult;
}

/**
 * Get detailed conflict info
 */
export function getConflictDetails(local: any, cloud: any) {
    return {
        localVersion: local,
        cloudVersion: cloud,
        localUpdatedAt: local?.updatedAt,
        cloudUpdatedAt: cloud?.updatedAt,
        isLocalNewer:
            local?.updatedAt && cloud?.updatedAt
                ? new Date(local.updatedAt).getTime() > new Date(cloud.updatedAt).getTime()
                : null,
        recommendation: lastWriteWinsStrategy.resolve(local, cloud),
    };
}
