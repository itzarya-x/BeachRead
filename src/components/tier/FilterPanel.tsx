/**
 * PHASE 4: Filter Panel for TierMaker
 */

import type { DisplayMedia } from "@/types/display";
import { safeArray } from "@/utils/safeArray";
import { useMemo } from "react";

interface FilterPanelProps {
    filters: {
        mediaType: "all" | "anime" | "manga" | "manhua" | "manhwa";
        genres: string[];
        minScore: number;
        maxScore: number;
        status: string[];
    };
    onFiltersChange: (filters: FilterPanelProps["filters"]) => void;
    allMedia: DisplayMedia[];
}

export function FilterPanel({ filters, onFiltersChange, allMedia }: FilterPanelProps) {
    const allGenres = useMemo(() => {
        const genres = new Set<string>();
        safeArray<DisplayMedia>(allMedia).forEach(m => safeArray<string>(m.genres).forEach(g => genres.add(g)));
        return Array.from(genres).sort();
    }, [allMedia]);

    const allStatuses = useMemo(() => {
        const statuses = new Set<string>();
        safeArray<DisplayMedia>(allMedia).forEach(m => statuses.add(m.status));
        return Array.from(statuses).sort();
    }, [allMedia]);

    return (
        <div className="bg-card border border-border rounded-lg p-4 space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold">Filters</h3>
                <button
                    onClick={() => onFiltersChange({
                        mediaType: "all",
                        genres: [],
                        minScore: 0,
                        maxScore: 100,
                        status: [],
                    })}
                    className="text-xs text-muted-foreground hover:text-foreground"
                >
                    Clear all
                </button>
            </div>

            {/* Media Type */}
            <div>
                <label className="block text-sm font-medium mb-2">Media Type</label>
                <select
                    value={filters.mediaType}
                    onChange={(e) => onFiltersChange({ ...filters, mediaType: e.target.value as any })}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                >
                    <option value="all">All</option>
                    <option value="anime">Anime</option>
                    <option value="manga">Manga</option>
                    <option value="manhua">Manhua</option>
                    <option value="manhwa">Manhwa</option>
                </select>
            </div>

            {/* Genres */}
            <div>
                <label className="block text-sm font-medium mb-2">Genres</label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                    {allGenres.map(genre => (
                        <button
                            key={genre}
                            onClick={() => {
                                const newGenres = filters.genres.includes(genre)
                                    ? filters.genres.filter(g => g !== genre)
                                    : [...filters.genres, genre];
                                onFiltersChange({ ...filters, genres: newGenres });
                            }}
                            className={`px-2 py-1 rounded text-xs transition-colors ${
                                filters.genres.includes(genre)
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-secondary hover:bg-secondary/80"
                            }`}
                        >
                            {genre}
                        </button>
                    ))}
                </div>
            </div>

            {/* Score Range */}
            <div>
                <label className="block text-sm font-medium mb-2">
                    Score: {filters.minScore} - {filters.maxScore}
                </label>
                <div className="flex gap-2">
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={filters.minScore}
                        onChange={(e) => onFiltersChange({ ...filters, minScore: parseInt(e.target.value) })}
                        className="flex-1"
                    />
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={filters.maxScore}
                        onChange={(e) => onFiltersChange({ ...filters, maxScore: parseInt(e.target.value) })}
                        className="flex-1"
                    />
                </div>
            </div>

            {/* Status */}
            <div>
                <label className="block text-sm font-medium mb-2">Status</label>
                <div className="flex flex-wrap gap-2">
                    {allStatuses.map(status => (
                        <button
                            key={status}
                            onClick={() => {
                                const newStatus = filters.status.includes(status)
                                    ? filters.status.filter(s => s !== status)
                                    : [...filters.status, status];
                                onFiltersChange({ ...filters, status: newStatus });
                            }}
                            className={`px-2 py-1 rounded text-xs transition-colors ${
                                filters.status.includes(status)
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-secondary hover:bg-secondary/80"
                            }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
