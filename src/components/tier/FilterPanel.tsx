/**
 * PHASE 4: Filter Panel for TierMaker
 */

import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
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
        <div className="space-y-4 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-foreground">Filters</h3>
                <button
                    onClick={() => onFiltersChange({
                        mediaType: "all",
                        genres: [],
                        minScore: 0,
                        maxScore: 100,
                        status: [],
                    })}
                    className="text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground hover:text-foreground"
                >
                    Clear all
                </button>
            </div>

            {/* Media Type */}
            <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Media Type</label>
                <Select
                    value={filters.mediaType}
                    onValueChange={(value) =>
                        onFiltersChange({ ...filters, mediaType: value as FilterPanelProps["filters"]["mediaType"] })
                    }
                >
                    <SelectTrigger className="h-10 rounded-xl border-border bg-input">
                        <SelectValue placeholder="Select media type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All</SelectItem>
                        <SelectItem value="anime">Anime</SelectItem>
                        <SelectItem value="manga">Manga</SelectItem>
                        <SelectItem value="manhua">Manhua</SelectItem>
                        <SelectItem value="manhwa">Manhwa</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Genres */}
            <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Genres</label>
                <div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto">
                    {allGenres.map(genre => (
                        <button
                            key={genre}
                            onClick={() => {
                                const newGenres = filters.genres.includes(genre)
                                    ? filters.genres.filter(g => g !== genre)
                                    : [...filters.genres, genre];
                                onFiltersChange({ ...filters, genres: newGenres });
                            }}
                            className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                                filters.genres.includes(genre)
                                    ? "border-primary/45 bg-primary/12 text-primary"
                                    : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
                            }`}
                        >
                            {genre}
                        </button>
                    ))}
                </div>
            </div>

            {/* Score Range */}
            <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Score: {filters.minScore} - {filters.maxScore}
                </label>
                <div className="space-y-3 rounded-xl border border-border bg-muted/50 p-3">
                    <Slider
                        min={0}
                        max={100}
                        step={1}
                        value={[filters.minScore]}
                        onValueChange={(value) => onFiltersChange({ ...filters, minScore: value[0] ?? 0 })}
                    />
                    <Slider
                        min={0}
                        max={100}
                        step={1}
                        value={[filters.maxScore]}
                        onValueChange={(value) => onFiltersChange({ ...filters, maxScore: value[0] ?? 100 })}
                    />
                    <div className="grid grid-cols-2 gap-2">
                        <Input
                            type="number"
                            value={filters.minScore}
                            min={0}
                            max={filters.maxScore}
                            onChange={(e) => onFiltersChange({ ...filters, minScore: Number(e.target.value) || 0 })}
                            className="h-9 rounded-lg border-border bg-input text-xs"
                        />
                        <Input
                            type="number"
                            value={filters.maxScore}
                            min={filters.minScore}
                            max={100}
                            onChange={(e) => onFiltersChange({ ...filters, maxScore: Number(e.target.value) || 100 })}
                            className="h-9 rounded-lg border-border bg-input text-xs"
                        />
                    </div>
                </div>
            </div>

            {/* Status */}
            <div>
                <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Status</label>
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
                            className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                                filters.status.includes(status)
                                    ? "border-primary/45 bg-primary/12 text-primary"
                                    : "border-border bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
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
