import { useMemo } from "react";
import { useData } from "@/context/DataContext";
import { useStatsFilters, applyStatsFilters } from "@/context/StatsFilterContext";
import { computeProStatsPayload } from "@/lib/stats-engine";
import type { DisplayMedia } from "@/types/display";

/**
 * Hook to provide reactive, filtered, and memoized statistics
 * Powers the Intelligence Page
 */
export function useStats() {
    const { animeList, mangaList, user } = useData();
    const { filters } = useStatsFilters();

    // Combine all media
    const allMedia = useMemo(() => {
        return [...animeList, ...mangaList];
    }, [animeList, mangaList]);

    // Apply global stats filters
    const filtered = useMemo(() => {
        return applyStatsFilters(allMedia, filters, user?.favourites);
    }, [allMedia, filters, user?.favourites]);

    // Compute pro stats payload
    const stats = useMemo(() => {
        if (filtered.length === 0) return null;
        return computeProStatsPayload(filtered, user?.scoreFormat || "POINT_100");
    }, [filtered, user?.scoreFormat]);

    return {
        stats,
        filtered,
        totalCount: allMedia.length,
        hasEntries: allMedia.length > 0,
        filtersActive: filtered.length < allMedia.length
    };
}
