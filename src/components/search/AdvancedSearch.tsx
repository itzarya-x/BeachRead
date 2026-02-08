/**
 * TASK 10: Advanced Search
 * Search by: title, tag, genre, origin, year, tier
 */

import { useData } from "@/context/DataContext";
import { useMediaStore } from "@/store/mediaStore";
import type { MediaType, OriginType } from "@/types/display";
import { Search, X } from "lucide-react";
import { useState, useMemo } from "react";

interface AdvancedSearchProps {
    mediaType: MediaType;
    onResults: (results: any[]) => void;
}

export function AdvancedSearch({ mediaType, onResults }: AdvancedSearchProps) {
    const { animeList, mangaList } = useMediaStore();
    const { getTitle } = useData();
    const [searchQuery, setSearchQuery] = useState("");
    const [filters, setFilters] = useState<{
        tags: string[];
        genres: string[];
        origin: OriginType | "";
        year: number | "";
        tier: number | "";
    }>({
        tags: [],
        genres: [],
        origin: "",
        year: "",
        tier: "",
    });

    const list = mediaType === "ANIME" ? animeList : mangaList;

    const results = useMemo(() => {
        let filtered = [...list];

        // Title search
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(item => {
                const title = getTitle(item).toLowerCase();
                return title.includes(query);
            });
        }

        // Genre filter
        if (filters.genres.length > 0) {
            filtered = filtered.filter(item => 
                filters.genres.some(genre => item.genres.includes(genre))
            );
        }

        // Origin filter (for manga)
        if (mediaType === "MANGA" && filters.origin) {
            filtered = filtered.filter(item => item.originType === filters.origin);
        }

        // Year filter
        if (filters.year) {
            filtered = filtered.filter(item => item.seasonYear === filters.year);
        }

        // Tier filter
        if (filters.tier !== "") {
            filtered = filtered.filter(item => item.priority === filters.tier);
        }

        return filtered;
    }, [list, searchQuery, filters, getTitle, mediaType]);

    // Update results callback
    useMemo(() => {
        onResults(results);
    }, [results, onResults]);

    // Get unique values for filters
    const allGenres = useMemo(() => {
        const genres = new Set<string>();
        list.forEach(item => item.genres.forEach(g => genres.add(g)));
        return Array.from(genres).sort();
    }, [list]);

    const allYears = useMemo(() => {
        const years = new Set<number>();
        list.forEach(item => {
            if (item.seasonYear) years.add(item.seasonYear);
        });
        return Array.from(years).sort((a, b) => b - a);
    }, [list]);

    return (
        <div className="space-y-4">
            {/* Search Input */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by title..."
                    className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg"
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-secondary rounded"
                    >
                        <X className="w-4 h-4" />
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="grid grid-cols-2 gap-4">
                {/* Genres */}
                <div>
                    <label className="block text-sm font-medium mb-2">Genres</label>
                    <select
                        multiple
                        value={filters.genres}
                        onChange={(e) => {
                            const selected = Array.from(e.target.selectedOptions, option => option.value);
                            setFilters({ ...filters, genres: selected });
                        }}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm"
                        size={5}
                    >
                        {allGenres.map(genre => (
                            <option key={genre} value={genre}>{genre}</option>
                        ))}
                    </select>
                </div>

                {/* Origin (Manga only) */}
                {mediaType === "MANGA" && (
                    <div>
                        <label className="block text-sm font-medium mb-2">Origin</label>
                        <select
                            value={filters.origin}
                            onChange={(e) => setFilters({ ...filters, origin: e.target.value as OriginType | "" })}
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                        >
                            <option value="">All</option>
                            <option value="manga">Manga</option>
                            <option value="manhua">Manhua</option>
                            <option value="manhwa">Manhwa</option>
                        </select>
                    </div>
                )}

                {/* Year */}
                <div>
                    <label className="block text-sm font-medium mb-2">Year</label>
                    <select
                        value={filters.year}
                        onChange={(e) => setFilters({ ...filters, year: e.target.value ? parseInt(e.target.value) : "" })}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                    >
                        <option value="">All years</option>
                        {allYears.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>

                {/* Tier */}
                <div>
                    <label className="block text-sm font-medium mb-2">Tier</label>
                    <select
                        value={filters.tier}
                        onChange={(e) => setFilters({ ...filters, tier: e.target.value ? parseInt(e.target.value) : "" })}
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                    >
                        <option value="">All tiers</option>
                        <option value="0">None</option>
                        <option value="1">Low</option>
                        <option value="2">Medium</option>
                        <option value="3">High</option>
                    </select>
                </div>
            </div>

            {/* Results count */}
            <div className="text-sm text-muted-foreground">
                Found {results.length} of {list.length} items
            </div>
        </div>
    );
}
