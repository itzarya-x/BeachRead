import { PageContent, PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { AddMediaModal } from "@/components/media/AddMediaModal";
import { FilterChips } from "@/components/media/FilterChips";
import { MediaGrid } from "@/components/media/MediaGrid";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { GridSkeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/YuraButton";
import { useData } from "@/context/DataContext";
import { STATUS_LABELS, STATUS_ORDER } from "@/lib/constants";
import type { DisplayMedia } from "@/types/display";
import { safeArray } from "@/utils/safeArray";
import { ArrowDownWideNarrow, Plus, Search, Tv } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

const SORT_OPTIONS = [
    { value: "updated", label: "Last Updated" },
    { value: "title", label: "Title" },
    { value: "score", label: "Score" },
    { value: "progress", label: "Progress" },
];

const AnimeList = () => {
    const { animeList, getAnimeByStatus, loading, getTitle } = useData();
    const [statusFilter, setStatusFilter] = useState<string[]>([]);
    const [formatFilter, setFormatFilter] = useState<string[]>([]);
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("updated");
    const [showAddModal, setShowAddModal] = useState(false);

    const statusOptions = useMemo(
        () =>
            STATUS_ORDER.map(s => ({
                value: s,
                label: STATUS_LABELS[s]["ANIME"],
                count: safeArray(getAnimeByStatus(s)).length,
            })),
        [getAnimeByStatus],
    );

    const formatOptions = useMemo(() => {
        const formats = new Map<string, number>();
        safeArray<DisplayMedia>(animeList).forEach(item => {
            if (item.format) {
                formats.set(item.format, (formats.get(item.format) || 0) + 1);
            }
        });
        return Array.from(formats.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([f, count]) => ({ value: f, label: f, count }));
    }, [animeList]);

    const toggleStatus = useCallback((val: string) => {
        setStatusFilter(prev => (safeArray<string>(prev).includes(val) ? prev.filter(v => v !== val) : [...safeArray<string>(prev), val]));
    }, []);

    const toggleFormat = useCallback((val: string) => {
        setFormatFilter(prev => (safeArray<string>(prev).includes(val) ? prev.filter(v => v !== val) : [...safeArray<string>(prev), val]));
    }, []);

    const filtered = useMemo(() => {
        let items = safeArray<DisplayMedia>(animeList);

        if (statusFilter.length > 0) {
            items = items.filter(i => statusFilter.includes(i.status));
        }
        if (formatFilter.length > 0) {
            items = items.filter(i => i.format && formatFilter.includes(i.format));
        }
        if (search) {
            const q = search.toLowerCase();
            items = items.filter(i => getTitle(i).toLowerCase().includes(q));
        }

        items = [...items].sort((a, b) => {
            switch (sortBy) {
                case "title":
                    return getTitle(a).localeCompare(getTitle(b));
                case "score":
                    return b.score - a.score;
                case "progress":
                    return b.progress - a.progress;
                default:
                    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
            }
        });

        return items;
    }, [animeList, statusFilter, formatFilter, search, sortBy, getTitle]);

    if (loading) {
        return (
            <PageWrapper className="p-6">
                <div className="flex justify-between items-center mb-8">
                    <div className="h-10 w-48 rounded-lg bg-muted animate-pulse" />
                    <div className="h-10 w-32 rounded-lg bg-muted animate-pulse" />
                </div>
                <GridSkeleton count={12} />
            </PageWrapper>
        );
    }

    return (
        <PageWrapper>
            <PageHeader 
                title="Synthetic Archive" 
                subtitle={`${animeList.length} indexed streams`} 
                icon={Tv}
            />
            <PageContent className="animate-fade-in">
                {/* Search & sort */}
                <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm">
                    <div className="relative flex-1 min-w-[220px]">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/80" />
                        <Input
                            type="text"
                            placeholder="Search anime titles..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="h-10 rounded-xl border-border bg-input pl-9"
                        />
                    </div>
                    <div className="flex items-center gap-2 min-w-[170px]">
                        <ArrowDownWideNarrow className="w-4 h-4 text-muted-foreground/70" />
                        <Select
                            value={sortBy}
                            onValueChange={setSortBy}
                        >
                            <SelectTrigger className="h-10 rounded-xl border-border bg-input">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                {SORT_OPTIONS.map(opt => (
                                    <SelectItem key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button
                        onClick={() => setShowAddModal(true)}
                        icon={Plus}
                    >
                        Add Anime
                    </Button>
                </div>

                {/* Filter chips */}
                <div className="space-y-2 mb-6">
                    <FilterChips
                        label="Status"
                        options={statusOptions}
                        selected={statusFilter}
                        onToggle={toggleStatus}
                        onClear={() => setStatusFilter([])}
                    />
                    {formatOptions.length > 0 && (
                        <FilterChips
                            label="Format"
                            options={formatOptions}
                            selected={formatFilter}
                            onToggle={toggleFormat}
                            onClear={() => setFormatFilter([])}
                        />
                    )}
                </div>

                {/* Results count */}
                <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    Showing {filtered.length} of {animeList.length}
                </p>

                {/* Grid */}
                <MediaGrid items={filtered} emptyMessage="No anime match your filters" />
            </PageContent>
            {showAddModal && (
                <AddMediaModal
                    mediaType="ANIME"
                    onClose={() => setShowAddModal(false)}
                />
            )}
        </PageWrapper>
    );
};

export default AnimeList;
