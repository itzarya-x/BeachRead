import { PageContent, PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { AddMediaModal } from "@/components/media/AddMediaModal";
import { FilterChips } from "@/components/media/FilterChips";
import { MediaGrid } from "@/components/media/MediaGrid";
import { GridSkeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/YuraButton";
import { useData } from "@/context/DataContext";
import { STATUS_LABELS, STATUS_ORDER } from "@/lib/constants";
import type { DisplayMedia } from "@/types/display";
import { safeArray } from "@/utils/safeArray";
import { BookOpen, Plus, Search, SlidersHorizontal } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

const SORT_OPTIONS = [
    { value: "updated", label: "Last Updated" },
    { value: "title", label: "Title" },
    { value: "score", label: "Score" },
    { value: "progress", label: "Progress" },
];

const MangaList = () => {
    const { mangaList, getMangaByStatus, loading, getTitle } = useData();
    const [statusFilter, setStatusFilter] = useState<string[]>([]);
    const [formatFilter, setFormatFilter] = useState<string[]>([]);
    const [originTypeFilter, setOriginTypeFilter] = useState<string[]>([]);
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState("updated");
    const [showAddModal, setShowAddModal] = useState(false);

    const statusOptions = useMemo(
        () =>
            STATUS_ORDER.map(s => ({
                value: s,
                label: STATUS_LABELS[s]["MANGA"],
                count: safeArray(getMangaByStatus(s)).length,
            })),
        [getMangaByStatus],
    );

    const formatOptions = useMemo(() => {
        const formats = new Map<string, number>();
        safeArray<DisplayMedia>(mangaList).forEach(item => {
            if (item.format) {
                formats.set(item.format, (formats.get(item.format) || 0) + 1);
            }
        });
        return Array.from(formats.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([f, count]) => ({ value: f, label: f, count }));
    }, [mangaList]);

    const originTypeOptions = useMemo(() => {
        const originTypes = new Map<string, number>();
        safeArray<DisplayMedia>(mangaList).forEach(item => {
            if (item.originType) {
                originTypes.set(item.originType, (originTypes.get(item.originType) || 0) + 1);
            }
        });
        return Array.from(originTypes.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([t, count]) => ({ 
                value: t, 
                label: t.charAt(0).toUpperCase() + t.slice(1), 
                count 
            }));
    }, [mangaList]);

    const toggleStatus = useCallback((val: string) => {
        setStatusFilter(prev => (safeArray<string>(prev).includes(val) ? prev.filter(v => v !== val) : [...safeArray<string>(prev), val]));
    }, []);

    const toggleFormat = useCallback((val: string) => {
        setFormatFilter(prev => (safeArray<string>(prev).includes(val) ? prev.filter(v => v !== val) : [...safeArray<string>(prev), val]));
    }, []);

    const toggleOriginType = useCallback((val: string) => {
        setOriginTypeFilter(prev => (safeArray<string>(prev).includes(val) ? prev.filter(v => v !== val) : [...safeArray<string>(prev), val]));
    }, []);

    const filtered = useMemo(() => {
        let items = safeArray<DisplayMedia>(mangaList);

        if (statusFilter.length > 0) {
            items = items.filter(i => statusFilter.includes(i.status));
        }
        if (formatFilter.length > 0) {
            items = items.filter(i => i.format && formatFilter.includes(i.format));
        }
        if (originTypeFilter.length > 0) {
            items = items.filter(i => i.originType && originTypeFilter.includes(i.originType));
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
    }, [mangaList, statusFilter, formatFilter, originTypeFilter, search, sortBy, getTitle]);

    if (loading) {
        return (
            <PageWrapper className="p-6">
                <div className="flex justify-between items-center mb-8">
                    <div className="h-10 w-48 bg-surface-2 rounded-lg animate-pulse" />
                    <div className="h-10 w-32 bg-surface-2 rounded-lg animate-pulse" />
                </div>
                <GridSkeleton count={12} />
            </PageWrapper>
        );
    }

    return (
        <PageWrapper>
            <PageHeader 
                title="Graphic Library" 
                subtitle={`${mangaList.length} indexed volumes`} 
                icon={BookOpen}
            />
            <PageContent className="animate-fade-in">
                {/* Search & sort */}
                <div className="flex items-center gap-3 mb-4 flex-wrap">
                    <div className="flex items-center gap-2 bg-card border border-border/50 rounded-xl px-3 py-2 flex-1 max-w-sm">
                        <Search className="w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search manga…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none flex-1"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
                        <select
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value)}
                            className="bg-card border border-border/50 rounded-xl px-3 py-2 text-sm text-foreground outline-none"
                        >
                            {SORT_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <Button
                        onClick={() => setShowAddModal(true)}
                        icon={Plus}
                    >
                        Add Manga
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
                    {originTypeOptions.length > 0 && (
                        <FilterChips
                            label="Origin Type"
                            options={originTypeOptions}
                            selected={originTypeFilter}
                            onToggle={toggleOriginType}
                            onClear={() => setOriginTypeFilter([])}
                        />
                    )}
                </div>

                <p className="text-xs text-muted-foreground mb-4">
                    Showing {filtered.length} of {mangaList.length}
                </p>

                <MediaGrid items={filtered} emptyMessage="No manga match your filters" />
            </PageContent>
            {showAddModal && (
                <AddMediaModal
                    mediaType="MANGA"
                    onClose={() => setShowAddModal(false)}
                />
            )}
        </PageWrapper>
    );
};

export default MangaList;
