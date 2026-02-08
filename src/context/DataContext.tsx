import { fetchMediaBatched, getCachedMedia, initializeCache, searchAniListMedia } from "@/lib/anilist-api";
import { parseGdprData, mapCountryToOriginType } from "@/lib/gdpr-parser";
import { initDatabase, saveUserEntry, getAllUserEntries, deleteUserEntry, type UserEntry } from "@/lib/database";
import { useMediaStore, getMediaStoreState } from "@/store/mediaStore";
import { editHistory } from "@/lib/editHistory";
import type { DisplayMedia, DisplayUser, MediaStatus, MediaType } from "@/types/display";
import type { GdprData } from "@/types/gdpr";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

interface DataContextValue {
    // Loading states
    loading: boolean;
    enriching: boolean;
    enrichProgress: { loaded: number; total: number };

    // Parsed data
    user: DisplayUser | null;
    animeList: DisplayMedia[]; // Read from store
    mangaList: DisplayMedia[]; // Read from store
    rawData: GdprData | null;

    // Helpers
    getAnimeByStatus: (status: MediaStatus) => DisplayMedia[];
    getMangaByStatus: (status: MediaStatus) => DisplayMedia[];
    getCustomListEntries: (listName: string, type: MediaType) => DisplayMedia[];
    getTitle: (media: DisplayMedia) => string;

    // TASK 4: CRUD operations
    addEntry: (entry: Partial<DisplayMedia> & { _seriesId: number; mediaType: MediaType }) => Promise<void>;
    updateEntry: (entryId: number, updates: Partial<DisplayMedia>) => Promise<void>;
    deleteEntry: (entryId: number) => Promise<void>;
    searchAniList: (query: string, type: "ANIME" | "MANGA") => Promise<DisplayMedia[]>;
}

const DataContext = createContext<DataContextValue | null>(null);

export function useData(): DataContextValue {
    const ctx = useContext(DataContext);
    if (!ctx) throw new Error("useData must be used within DataProvider");
    return ctx;
}

export function DataProvider({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = useState(true);
    const [enriching, setEnriching] = useState(false);
    const [enrichProgress, setEnrichProgress] = useState({ loaded: 0, total: 0 });
    const [user, setUser] = useState<DisplayUser | null>(null);
    const [rawData, setRawData] = useState<GdprData | null>(null);
    const [userEdits, setUserEdits] = useState<Map<number, UserEntry>>(new Map());
    
    // TASK 6 & 7: Use Zustand store for reactive state
    const { animeList, mangaList, setAnimeList, setMangaList } = useMediaStore();

    // TASK 2 & 3: Load and parse GDPR data with IndexedDB integration
    useEffect(() => {
        async function load() {
            try {
                // Initialize IndexedDB
                await initDatabase();
                
                // Initialize cache from IndexedDB
                await initializeCache();

                const response = await fetch("/data/gdpr_data.json");
                const data: GdprData = await response.json();
                setRawData(data);

                const parsed = parseGdprData(data);
                setUser(parsed.user);

                // TASK 3: Load user edits from IndexedDB
                let edits = new Map<number, UserEntry>();
                if (parsed.user.id) {
                    edits = await getAllUserEntries(parsed.user.id);
                    setUserEdits(edits);
                }

                // Apply user edits to parsed entries (TASK 3: Preserve user edits)
                const applyUserEdits = (entries: DisplayMedia[], userEditsMap: Map<number, UserEntry>): DisplayMedia[] => {
                    return entries.map(entry => {
                        const edit = userEditsMap.get(entry._entryId);
                        if (edit && !edit.deleted) {
                            // Merge user edits with base entry (user edits take precedence)
                            return {
                                ...entry,
                                ...edit.data,
                                _entryId: entry._entryId, // Preserve entry ID
                                _seriesId: entry._seriesId, // Preserve series ID
                                _userId: entry._userId, // Preserve user ID
                            };
                        }
                        return entry;
                    });
                };

                let animeEntries = parsed.animeEntries;
                let mangaEntries = parsed.mangaEntries;

                // Apply user edits
                animeEntries = applyUserEdits(animeEntries, edits);
                mangaEntries = applyUserEdits(mangaEntries, edits);

                // TASK 2: Enrich immediately from cache (non-blocking)
                // This uses data already stored in IndexedDB
                const enrichedAnime = animeEntries.map(entry => enrichEntryWithUserEdits(entry, edits));
                const enrichedManga = mangaEntries.map(entry => enrichEntryWithUserEdits(entry, edits));

                // TASK 6 & 7: Update store with enriched data (triggers stats invalidation)
                setAnimeList(enrichedAnime);
                setMangaList(enrichedManga);
                setLoading(false); // Show data immediately

                // Start background API enrichment for missing data (non-blocking)
                setEnriching(true);
                const allIds = [
                    ...parsed.animeEntries.map(e => e._seriesId),
                    ...parsed.mangaEntries.map(e => e._seriesId),
                ];

                // Fetch missing data in background (don't block UI)
                fetchMediaBatched(allIds, (loaded, total) => {
                    setEnrichProgress({ loaded, total });
                }).then(() => {
                    // After fetching, re-enrich with new data
                    const currentAnime = getMediaStoreState().animeList;
                    const currentManga = getMediaStoreState().mangaList;
                    const reEnrichedAnime = currentAnime.map(entry => enrichEntryWithUserEdits(entry, edits));
                    const reEnrichedManga = currentManga.map(entry => enrichEntryWithUserEdits(entry, edits));
                    setAnimeList(reEnrichedAnime);
                    setMangaList(reEnrichedManga);
                    setEnriching(false);
                }).catch((err) => {
                    console.error("Background enrichment failed:", err);
                    setEnriching(false);
                });
            } catch (err) {
                console.error("Failed to load GDPR data:", err);
                setLoading(false);
            }
        }

        load();
    }, []);

    const getTitle = useCallback(
        (media: DisplayMedia): string => {
            if (!user) return media.title.romaji || "Unknown";
            switch (user.titleLanguage) {
                case "ENGLISH":
                    return media.title.english || media.title.romaji || "Unknown";
                case "NATIVE":
                    return media.title.native || media.title.romaji || "Unknown";
                default:
                    return media.title.romaji || "Unknown";
            }
        },
        [user],
    );

    const getAnimeByStatus = useCallback(
        (status: MediaStatus) => {
            const { animeList: storeAnimeList } = getMediaStoreState();
            return storeAnimeList.filter(e => e.status === status);
        },
        [],
    );

    const getMangaByStatus = useCallback(
        (status: MediaStatus) => {
            const { mangaList: storeMangaList } = getMediaStoreState();
            return storeMangaList.filter(e => e.status === status);
        },
        [],
    );

    const getCustomListEntries = useCallback(
        (listName: string, type: MediaType) => {
            const { animeList: storeAnimeList, mangaList: storeMangaList } = getMediaStoreState();
            const list = type === "ANIME" ? storeAnimeList : storeMangaList;
            return list.filter(e => e.customLists.includes(listName));
        },
        [],
    );

    // TASK 4: Add entry
    const addEntry = useCallback(async (
        entry: Partial<DisplayMedia> & { _seriesId: number; mediaType: MediaType }
    ) => {
        if (!user) return;

        // Generate a temporary entry ID (negative for new entries)
        const tempEntryId = Date.now() * -1;
        
        const newEntry: DisplayMedia = {
            status: entry.status || "PLANNING",
            score: entry.score ?? 0,
            progress: entry.progress ?? 0,
            progressVolumes: entry.progressVolumes ?? 0,
            repeat: entry.repeat ?? 0,
            priority: entry.priority ?? 0,
            tierId: entry.tierId ?? null, // TASK 14
            isPrivate: entry.isPrivate ?? false,
            notes: entry.notes ?? null,
            customLists: entry.customLists || [],
            startedAt: entry.startedAt ?? null,
            completedAt: entry.completedAt ?? null,
            createdAt: entry.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            mediaType: entry.mediaType,
            advancedScores: entry.advancedScores || [],
            hiddenDefault: entry.hiddenDefault ?? false,
            title: entry.title || { romaji: "Unknown", english: null, native: null },
            coverImage: entry.coverImage ?? null,
            bannerImage: entry.bannerImage ?? null,
            format: entry.format ?? null,
            episodes: entry.episodes ?? null,
            chapters: entry.chapters ?? null,
            volumes: entry.volumes ?? null,
            genres: entry.genres || [],
            season: entry.season ?? null,
            seasonYear: entry.seasonYear ?? null,
            description: entry.description ?? null,
            originType: entry.originType || "manga",
            _seriesId: entry._seriesId,
            _entryId: tempEntryId,
            _userId: user.id,
            _enriched: entry._enriched ?? false,
        };

        // Enrich if needed
        const enriched = enrichEntryWithUserEdits(newEntry, userEdits);
        
        // TASK 8: Record edit history
        editHistory.recordEdit(
            tempEntryId,
            user.id,
            "create",
            null,
            enriched,
            "create",
            null,
            enriched
        );
        
        // Save to IndexedDB
        await saveUserEntry({
            entryId: tempEntryId,
            seriesId: entry._seriesId,
            userId: user.id,
            data: {
                status: enriched.status,
                score: enriched.score,
                progress: enriched.progress,
                progressVolumes: enriched.progressVolumes,
                repeat: enriched.repeat,
                priority: enriched.priority,
                tierId: enriched.tierId,
                isPrivate: enriched.isPrivate,
                notes: enriched.notes,
                customLists: enriched.customLists,
                startedAt: enriched.startedAt,
                completedAt: enriched.completedAt,
                advancedScores: enriched.advancedScores,
                hiddenDefault: enriched.hiddenDefault,
            },
            editedAt: Date.now(),
            deleted: false,
        });

        // TASK 6 & 7: Update Zustand store (triggers stats invalidation)
        const { addEntry: storeAddEntry } = getMediaStoreState();
        storeAddEntry(enriched);
    }, [user, userEdits]);

    // TASK 4: Update entry
    const updateEntry = useCallback(async (entryId: number, updates: Partial<DisplayMedia>) => {
        if (!user) return;

        // Find entry in current lists
        const animeEntry = animeList.find(e => e._entryId === entryId);
        const mangaEntry = mangaList.find(e => e._entryId === entryId);
        const existingEntry = animeEntry || mangaEntry;

        if (!existingEntry) return;

        // TASK 8: Track what changed for history
        const changedFields: string[] = [];
        const fieldChanges: Record<string, { old: any; new: any }> = {};
        
        Object.keys(updates).forEach(key => {
            if (key in existingEntry && (existingEntry as any)[key] !== (updates as any)[key]) {
                changedFields.push(key);
                fieldChanges[key] = {
                    old: (existingEntry as any)[key],
                    new: (updates as any)[key],
                };
            }
        });

        // Merge updates
        const updated: DisplayMedia = {
            ...existingEntry,
            ...updates,
            updatedAt: new Date().toISOString(),
        };

        // TASK 8: Record edit history for each changed field
        changedFields.forEach(field => {
            editHistory.recordEdit(
                entryId,
                user.id,
                "update",
                existingEntry,
                updated,
                field,
                fieldChanges[field].old,
                fieldChanges[field].new
            );
        });

        // Save user edits to IndexedDB (TASK 3: Preserve user edits)
        await saveUserEntry({
            entryId,
            seriesId: existingEntry._seriesId,
            userId: user.id,
            data: {
                status: updated.status,
                score: updated.score,
                progress: updated.progress,
                progressVolumes: updated.progressVolumes,
                repeat: updated.repeat,
                priority: updated.priority,
                tierId: updated.tierId,
                isPrivate: updated.isPrivate,
                notes: updated.notes,
                customLists: updated.customLists,
                startedAt: updated.startedAt,
                completedAt: updated.completedAt,
                advancedScores: updated.advancedScores,
                hiddenDefault: updated.hiddenDefault,
            },
            editedAt: Date.now(),
            deleted: false,
        });

        // TASK 6 & 7: Update Zustand store (triggers stats invalidation)
        const { updateEntry: storeUpdateEntry } = getMediaStoreState();
        storeUpdateEntry(entryId, updates);

        // Update user edits map
        setUserEdits(prev => {
            const newMap = new Map(prev);
            newMap.set(entryId, {
                entryId,
                seriesId: existingEntry._seriesId,
                userId: user.id,
                data: updates,
                editedAt: Date.now(),
                deleted: false,
            });
            return newMap;
        });
    }, [user, animeList, mangaList]);

    // TASK 4: Delete entry (soft delete)
    const deleteEntry = useCallback(async (entryId: number) => {
        if (!user) return;

        // Find entry before deletion for history
        const animeEntry = animeList.find(e => e._entryId === entryId);
        const mangaEntry = mangaList.find(e => e._entryId === entryId);
        const existingEntry = animeEntry || mangaEntry;

        // TASK 8: Record deletion in history
        if (existingEntry) {
            editHistory.recordEdit(
                entryId,
                user.id,
                "delete",
                existingEntry,
                null,
                "delete",
                existingEntry,
                null
            );
        }

        await deleteUserEntry(entryId);

        // TASK 6 & 7: Update Zustand store (triggers stats invalidation)
        const { deleteEntry: storeDeleteEntry } = getMediaStoreState();
        storeDeleteEntry(entryId);

        // Update user edits map
        setUserEdits(prev => {
            const newMap = new Map(prev);
            newMap.delete(entryId);
            return newMap;
        });
    }, [user, animeList, mangaList]);

    // TASK 4: Search AniList
    const searchAniList = useCallback(async (query: string, type: "ANIME" | "MANGA"): Promise<DisplayMedia[]> => {
        const results = await searchAniListMedia(query, type);
        
        // Convert AniListMediaResponse to DisplayMedia format
        return results.map(media => ({
            status: "PLANNING" as MediaStatus,
            score: 0,
            progress: 0,
            progressVolumes: 0,
            repeat: 0,
            priority: 0,
            tierId: null, // TASK 14
            isPrivate: false,
            notes: null,
            customLists: [],
            startedAt: null,
            completedAt: null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            mediaType: type,
            advancedScores: [],
            hiddenDefault: false,
            title: media.title,
            coverImage: media.coverImage?.large || media.coverImage?.medium || null,
            bannerImage: media.bannerImage || null,
            format: media.format || null,
            episodes: media.episodes ?? null,
            chapters: media.chapters ?? null,
            volumes: media.volumes ?? null,
            genres: media.genres || [],
            season: media.season || null,
            seasonYear: media.seasonYear ?? null,
            description: media.description || null,
            originType: type === "MANGA" ? mapCountryToOriginType(media.countryOfOrigin) : "manga",
            _seriesId: media.id,
            _entryId: 0, // Will be set when added
            _userId: user?.id || 0,
            _enriched: true,
        }));
    }, [user]);

    const value = useMemo(
        () => ({
            loading,
            enriching,
            enrichProgress,
            user,
            animeList, // From store hook
            mangaList, // From store hook
            rawData,
            getAnimeByStatus,
            getMangaByStatus,
            getCustomListEntries,
            getTitle,
            addEntry,
            updateEntry,
            deleteEntry,
            searchAniList,
        }),
        [
            loading,
            enriching,
            enrichProgress,
            user,
            animeList,
            mangaList,
            rawData,
            getAnimeByStatus,
            getMangaByStatus,
            getCustomListEntries,
            getTitle,
            addEntry,
            updateEntry,
            deleteEntry,
            searchAniList,
        ],
    );

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

// TASK 3: Enrich entry while preserving user edits
function enrichEntryWithUserEdits(entry: DisplayMedia, userEdits: Map<number, UserEntry>): DisplayMedia {
    const cached = getCachedMedia(entry._seriesId);
    const userEdit = userEdits.get(entry._entryId);
    
    // TASK 1: Auto-classify origin type from countryOfOrigin
    const originType = entry.mediaType === "MANGA" && cached
        ? mapCountryToOriginType(cached.countryOfOrigin)
        : entry.originType || "manga";
    
    // TASK 3: Merge API data with entry, but preserve user-editable fields if edited
    const enriched: DisplayMedia = {
        ...entry,
        // API enrichment (only if not user-edited)
        title: cached?.title || entry.title,
        coverImage: cached?.coverImage?.large || cached?.coverImage?.medium || entry.coverImage || null,
        bannerImage: cached?.bannerImage || entry.bannerImage || null,
        format: cached?.format || entry.format || null,
        episodes: cached?.episodes ?? entry.episodes ?? null,
        chapters: cached?.chapters ?? entry.chapters ?? null,
        volumes: cached?.volumes ?? entry.volumes ?? null,
        genres: cached?.genres || entry.genres || [],
        season: cached?.season || entry.season || null,
        seasonYear: cached?.seasonYear ?? entry.seasonYear ?? null,
        description: cached?.description || entry.description || null,
        originType,
        _enriched: !!cached,
    };

    // TASK 3: Apply user edits (user edits override API data)
    if (userEdit && !userEdit.deleted) {
        return {
            ...enriched,
            ...userEdit.data,
            _entryId: entry._entryId,
            _seriesId: entry._seriesId,
            _userId: entry._userId,
        };
    }

    return enriched;
}
