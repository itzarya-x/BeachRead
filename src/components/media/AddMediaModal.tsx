/**
 * TASK 4: Add Media Modal
 * Allows: Search AniList OR create manual custom item
 */

import { useData } from "@/context/DataContext";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { DisplayMedia, MediaType } from "@/types/display";
import { Search, Plus, Loader2 } from "lucide-react";
import { useState } from "react";

interface AddMediaModalProps {
    mediaType: MediaType;
    onClose: () => void;
}

export function AddMediaModal({ mediaType, onClose }: AddMediaModalProps) {
    const { addEntry, searchAniList } = useData();
    const [mode, setMode] = useState<"search" | "manual">("search");
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<DisplayMedia[]>([]);
    const [searching, setSearching] = useState(false);
    const [loading, setLoading] = useState(false);
    const [manualForm, setManualForm] = useState({
        title: "",
        seriesId: 0,
    });

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        
        setSearching(true);
        try {
            const results = await searchAniList(searchQuery, mediaType);
            setSearchResults(results);
        } catch (err) {
            console.error("Search failed:", err);
        } finally {
            setSearching(false);
        }
    };

    const handleAddFromSearch = async (media: DisplayMedia) => {
        setLoading(true);
        try {
            await addEntry({
                ...media,
                _seriesId: media._seriesId,
                mediaType,
            });
            onClose();
        } catch (err) {
            console.error("Failed to add entry:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddManual = async () => {
        if (!manualForm.title.trim()) {
            alert("Please enter a title");
            return;
        }

        setLoading(true);
        try {
            // Generate a temporary series ID (negative for manual entries)
            const tempSeriesId = Date.now() * -1;
            
            await addEntry({
                _seriesId: manualForm.seriesId || tempSeriesId,
                mediaType,
                title: {
                    romaji: manualForm.title,
                    english: null,
                    native: null,
                },
                status: "PLANNING",
                score: 0,
                progress: 0,
                progressVolumes: 0,
                repeat: 0,
                priority: 0,
                isPrivate: false,
                notes: null,
                customLists: [],
                startedAt: null,
                completedAt: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                advancedScores: [],
                hiddenDefault: false,
                coverImage: null,
                bannerImage: null,
                format: null,
                episodes: null,
                chapters: null,
                volumes: null,
                genres: [],
                season: null,
                seasonYear: null,
                description: null,
                originType: mediaType === "MANGA" ? "manga" : "manga",
                _enriched: false,
            });
            onClose();
        } catch (err) {
            console.error("Failed to add manual entry:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-3xl border-border bg-card p-0 sm:rounded-2xl">
                <DialogHeader className="border-b border-border px-6 py-5">
                    <DialogTitle className="text-xl font-extrabold tracking-tight">
                        Add {mediaType === "ANIME" ? "Anime" : "Manga"}
                    </DialogTitle>
                    <DialogDescription>
                        Search AniList for quick add, or create a manual entry.
                    </DialogDescription>
                </DialogHeader>

                <div className="px-6 py-5">
                    <Tabs value={mode} onValueChange={(value) => setMode(value as "search" | "manual")} className="space-y-4">
                        <TabsList className="grid h-10 w-full grid-cols-2 rounded-xl border border-border bg-muted/50">
                            <TabsTrigger value="search" className="gap-2">
                                <Search className="h-4 w-4" />
                                Search AniList
                            </TabsTrigger>
                            <TabsTrigger value="manual" className="gap-2">
                                <Plus className="h-4 w-4" />
                                Manual Entry
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="search" className="space-y-4">
                            <div className="flex gap-2">
                                <Input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                    placeholder="Search AniList..."
                                    className="h-10 rounded-xl border-border bg-input"
                                />
                                <Button
                                    onClick={handleSearch}
                                    disabled={searching}
                                    className="h-10 rounded-xl"
                                >
                                    {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                                    Search
                                </Button>
                            </div>

                            {searchResults.length > 0 && (
                                <ScrollArea className="h-96 rounded-xl border border-border bg-muted/30 p-2">
                                    <div className="space-y-2 pr-2">
                                        {searchResults.map((result) => (
                                            <div
                                                key={result._seriesId}
                                                role="button"
                                                tabIndex={0}
                                                className="flex w-full items-center gap-4 rounded-xl border border-border bg-card p-3 text-left transition-colors hover:border-primary/40 hover:bg-muted/40 focus:outline-none focus:ring-2 focus:ring-primary/40"
                                                onClick={() => handleAddFromSearch(result)}
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter" || e.key === " ") {
                                                        e.preventDefault();
                                                        handleAddFromSearch(result);
                                                    }
                                                }}
                                            >
                                                {result.coverImage && (
                                                    <img
                                                        src={result.coverImage}
                                                        alt={result.title.romaji}
                                                        className="h-24 w-16 rounded-md object-cover"
                                                    />
                                                )}
                                                <div className="min-w-0 flex-1">
                                                    <h3 className="line-clamp-1 font-semibold">{result.title.romaji}</h3>
                                                    {result.title.english && (
                                                        <p className="line-clamp-1 text-sm text-muted-foreground">{result.title.english}</p>
                                                    )}
                                                    {result.description && (
                                                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                                                            {result.description}
                                                        </p>
                                                    )}
                                                </div>
                                                <Button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleAddFromSearch(result);
                                                    }}
                                                    disabled={loading}
                                                    className="h-9 rounded-lg"
                                                >
                                                    Add
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </ScrollArea>
                            )}
                        </TabsContent>

                        <TabsContent value="manual" className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Title</label>
                                <Input
                                    type="text"
                                    value={manualForm.title}
                                    onChange={(e) => setManualForm({ ...manualForm, title: e.target.value })}
                                    placeholder="Enter title..."
                                    className="h-10 rounded-xl border-border bg-input"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Series ID (optional)</label>
                                <Input
                                    type="number"
                                    value={manualForm.seriesId || ""}
                                    onChange={(e) => setManualForm({ ...manualForm, seriesId: parseInt(e.target.value) || 0 })}
                                    placeholder="AniList series ID (if known)"
                                    className="h-10 rounded-xl border-border bg-input"
                                />
                            </div>
                            <Button
                                onClick={handleAddManual}
                                disabled={loading || !manualForm.title.trim()}
                                className="h-10 w-full rounded-xl"
                            >
                                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                                Add Entry
                            </Button>
                        </TabsContent>
                    </Tabs>
                </div>

                <DialogFooter className="border-t border-border px-6 py-4">
                    <Button type="button" variant="secondary" onClick={onClose} className="rounded-xl">
                        Cancel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
