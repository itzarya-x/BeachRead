import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from "react";
import type { MediaType, MediaStatus } from "@/types/display";
import { useLocalStorage } from "@/hooks/useLocalStorage";

/**
 * PHASE 5: GLOBAL FILTER ENGINE
 * 
 * All statistics must recompute instantly when filters change.
 * Filters are persisted and applied globally across all stats.
 */

export interface StatsFilters {
    // Media type filter
    mediaType: "all" | "anime" | "manga";
    
    // Origin type filter (for manga: manga, manhua, manhwa)
    originTypes: ("manga" | "manhua" | "manhwa")[];
    
    // Status filter
    statuses: MediaStatus[];
    
    // Genre filter
    genres: string[];
    
    // Tag filter (for future use)
    tags: string[];
    
    // Year filter
    years: number[];
    
    // Score range filter
    minScore: number;
    maxScore: number;
    
    // Tier filter (priority)
    tiers: number[]; // priority values
    
    // Favourite filter
    favouritesOnly: boolean;
    
    // Custom list filter
    customLists: string[];
}

const DEFAULT_FILTERS: StatsFilters = {
    mediaType: "all",
    originTypes: [],
    statuses: [],
    genres: [],
    tags: [],
    years: [],
    minScore: 0,
    maxScore: 100,
    tiers: [],
    favouritesOnly: false,
    customLists: [],
};

interface StatsFilterContextValue {
    filters: StatsFilters;
    setFilters: (filters: StatsFilters | ((prev: StatsFilters) => StatsFilters)) => void;
    updateFilter: <K extends keyof StatsFilters>(key: K, value: StatsFilters[K]) => void;
    resetFilters: () => void;
    hasActiveFilters: boolean;
    getFilterSignature: () => string; // For memoization cache key
}

const StatsFilterContext = createContext<StatsFilterContextValue | null>(null);

export function useStatsFilters(): StatsFilterContextValue {
    const ctx = useContext(StatsFilterContext);
    if (!ctx) throw new Error("useStatsFilters must be used within StatsFilterProvider");
    return ctx;
}

export function StatsFilterProvider({ children }: { children: React.ReactNode }) {
    // PHASE 5.5: Persist filters to localStorage
    const [storedFilters, setStoredFilters] = useLocalStorage<StatsFilters>(
        "yura-stats-filters",
        DEFAULT_FILTERS
    );
    
    const [filters, setFiltersState] = useState<StatsFilters>(storedFilters);

    // Sync with localStorage
    useEffect(() => {
        setStoredFilters(filters);
    }, [filters, setStoredFilters]);

    const setFilters = useCallback((newFilters: StatsFilters | ((prev: StatsFilters) => StatsFilters)) => {
        setFiltersState(prev => {
            const updated = typeof newFilters === "function" ? newFilters(prev) : newFilters;
            return updated;
        });
    }, []);

    const updateFilter = useCallback(<K extends keyof StatsFilters>(
        key: K,
        value: StatsFilters[K]
    ) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    }, [setFilters]);

    const resetFilters = useCallback(() => {
        setFilters(DEFAULT_FILTERS);
    }, [setFilters]);

    const hasActiveFilters = useMemo(() => {
        return (
            filters.mediaType !== "all" ||
            filters.originTypes.length > 0 ||
            filters.statuses.length > 0 ||
            filters.genres.length > 0 ||
            filters.tags.length > 0 ||
            filters.years.length > 0 ||
            filters.minScore > 0 ||
            filters.maxScore < 100 ||
            filters.tiers.length > 0 ||
            filters.favouritesOnly ||
            filters.customLists.length > 0
        );
    }, [filters]);

    // PHASE 9.1: Generate cache signature for memoization
    const getFilterSignature = useCallback(() => {
        return JSON.stringify({
            mediaType: filters.mediaType,
            originTypes: filters.originTypes.sort(),
            statuses: filters.statuses.sort(),
            genres: filters.genres.sort(),
            tags: filters.tags.sort(),
            years: filters.years.sort(),
            minScore: filters.minScore,
            maxScore: filters.maxScore,
            tiers: filters.tiers.sort(),
            favouritesOnly: filters.favouritesOnly,
            customLists: filters.customLists.sort(),
        });
    }, [filters]);

    const value = useMemo(
        () => ({
            filters,
            setFilters,
            updateFilter,
            resetFilters,
            hasActiveFilters,
            getFilterSignature,
        }),
        [filters, setFilters, updateFilter, resetFilters, hasActiveFilters, getFilterSignature]
    );

    return <StatsFilterContext.Provider value={value}>{children}</StatsFilterContext.Provider>;
}

/**
 * Apply filters to a media list
 * PHASE 5.2: Pre-filter data before stats computation
 */
export function applyStatsFilters<T extends { 
    mediaType: MediaType;
    status: MediaStatus;
    score: number;
    genres?: string[];
    seasonYear?: number | null;
    priority: number;
    customLists: string[];
    _seriesId: number;
    originType?: "manga" | "manhua" | "manhwa";
}>(items: T[], filters: StatsFilters, userFavourites?: { anime: number[]; manga: number[] }): T[] {
    let filtered = [...items];

    // Media type filter
    if (filters.mediaType !== "all") {
        const targetType = filters.mediaType === "anime" ? "ANIME" : "MANGA";
        filtered = filtered.filter(item => item.mediaType === targetType);
    }

    // Origin type filter (TASK 1: Manga/Manhua/Manhwa classification)
    if (filters.originTypes.length > 0 && filters.mediaType === "manga") {
        filtered = filtered.filter(item => 
            item.originType && filters.originTypes.includes(item.originType)
        );
    }

    // Status filter
    if (filters.statuses.length > 0) {
        filtered = filtered.filter(item => filters.statuses.includes(item.status));
    }

    // Genre filter
    if (filters.genres.length > 0) {
        filtered = filtered.filter(item => 
            item.genres && item.genres.some(g => filters.genres.includes(g))
        );
    }

    // Year filter
    if (filters.years.length > 0) {
        filtered = filtered.filter(item => 
            item.seasonYear && filters.years.includes(item.seasonYear)
        );
    }

    // Score range filter
    if (filters.minScore > 0 || filters.maxScore < 100) {
        filtered = filtered.filter(item => 
            item.score >= filters.minScore && item.score <= filters.maxScore
        );
    }

    // Tier (priority) filter
    if (filters.tiers.length > 0) {
        filtered = filtered.filter(item => filters.tiers.includes(item.priority));
    }

    // Custom list filter
    if (filters.customLists.length > 0) {
        filtered = filtered.filter(item =>
            item.customLists.some(list => filters.customLists.includes(list))
        );
    }

    // Favourites filter
    if (filters.favouritesOnly && userFavourites) {
        filtered = filtered.filter(item => {
            if (item.mediaType === "ANIME") {
                return userFavourites.anime.includes(item._seriesId);
            } else {
                return userFavourites.manga.includes(item._seriesId);
            }
        });
    }

    return filtered;
}
