/**
 * TASK 4: Add Media Modal
 * Allows: Search AniList OR create manual custom item
 */

import { useData } from "@/context/DataContext";
import type { DisplayMedia, MediaType } from "@/types/display";
import { X, Search, Plus, Loader2 } from "lucide-react";
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-card border border-border rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto m-4">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border">
                    <h2 className="text-xl font-semibold">Add {mediaType === "ANIME" ? "Anime" : "Manga"}</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-secondary rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Mode Toggle */}
                <div className="p-6 border-b border-border">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setMode("search")}
                            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                                mode === "search"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-secondary text-secondary-foreground"
                            }`}
                        >
                            <Search className="w-4 h-4" />
                            Search AniList
                        </button>
                        <button
                            onClick={() => setMode("manual")}
                            className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                                mode === "manual"
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-secondary text-secondary-foreground"
                            }`}
                        >
                            <Plus className="w-4 h-4" />
                            Manual Entry
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    {mode === "search" ? (
                        <div className="space-y-4">
                            {/* Search Input */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                    placeholder="Search AniList..."
                                    className="flex-1 px-3 py-2 bg-background border border-border rounded-lg"
                                />
                                <button
                                    onClick={handleSearch}
                                    disabled={searching}
                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                                >
                                    {searching ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Search className="w-4 h-4" />
                                    )}
                                    Search
                                </button>
                            </div>

                            {/* Search Results */}
                            {searchResults.length > 0 && (
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {searchResults.map((result) => (
                                        <div
                                            key={result._seriesId}
                                            className="flex items-center gap-4 p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors cursor-pointer"
                                            onClick={() => handleAddFromSearch(result)}
                                        >
                                            {result.coverImage && (
                                                <img
                                                    src={result.coverImage}
                                                    alt={result.title.romaji}
                                                    className="w-16 h-24 object-cover rounded"
                                                />
                                            )}
                                            <div className="flex-1">
                                                <h3 className="font-semibold">{result.title.romaji}</h3>
                                                {result.title.english && (
                                                    <p className="text-sm text-muted-foreground">{result.title.english}</p>
                                                )}
                                                {result.description && (
                                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                        {result.description}
                                                    </p>
                                                )}
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleAddFromSearch(result);
                                                }}
                                                disabled={loading}
                                                className="px-3 py-1 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
                                            >
                                                Add
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Title</label>
                                <input
                                    type="text"
                                    value={manualForm.title}
                                    onChange={(e) => setManualForm({ ...manualForm, title: e.target.value })}
                                    placeholder="Enter title..."
                                    className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">Series ID (optional)</label>
                                <input
                                    type="number"
                                    value={manualForm.seriesId || ""}
                                    onChange={(e) => setManualForm({ ...manualForm, seriesId: parseInt(e.target.value) || 0 })}
                                    placeholder="AniList series ID (if known)"
                                    className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                                />
                            </div>
                            <button
                                onClick={handleAddManual}
                                disabled={loading || !manualForm.title.trim()}
                                className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Plus className="w-4 h-4" />
                                )}
                                Add Entry
                            </button>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex justify-end p-6 border-t border-border">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
