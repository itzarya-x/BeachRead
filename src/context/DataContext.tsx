import { fetchMediaBatched, getCachedMedia, initializeCache, searchAniListMedia } from "@/lib/anilist-api";
import { dbClearAllLocalEntries, dbGetAllLocalEntries } from "@/lib/database";
import { editHistory } from "@/lib/editHistory";
import { mapCountryToOriginType, parseGdprData } from "@/lib/gdpr-parser";
import { getRealtimeSyncManager } from "@/lib/realtime-sync";
import { getStorageProvider, switchStorageProvider } from "@/lib/storage";
import { DataLog, displayStorageStatus, updateStorageMode } from "@/lib/storage-mode";
import { CloudStorageProvider } from "@/lib/storage/cloud";
import type { ActivityLog, UserEntry } from "@/lib/storage/types";
import { dbClearAllLocalTierData, dbGetAllLocalAssignments, dbGetAllLocalTiers, getAllTierBoards as dbGetAllTierBoards } from "@/lib/tierDatabase";
import { getMediaStoreState, useMediaStore } from "@/store/mediaStore";
import type { DisplayMedia, DisplayUser, MediaStatus, MediaType } from "@/types/display";
import type { GdprData } from "@/types/gdpr";
import { safeArray } from "@/utils/safeArray";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthContext";

export interface DuplicateCheck {
    existing: DisplayMedia;
    pending: Partial<DisplayMedia> & { _seriesId: number; mediaType: MediaType };
}

interface DataContextValue {
    // Loading states
    loading: boolean;
    enriching: boolean;
    enrichProgress: { loaded: number; total: number };
    error: string | null;

    // Parsed data
    user: DisplayUser | null;
    animeList: DisplayMedia[]; // Read from store
    mangaList: DisplayMedia[]; // Read from store
    rawData: GdprData | null;

    // Storage mode (PHASE 5)
    storageMode: "cloud" | "local";

    // Helpers
    getAnimeByStatus: (status: MediaStatus) => DisplayMedia[];
    getMangaByStatus: (status: MediaStatus) => DisplayMedia[];
    getCustomListEntries: (listName: string, type: MediaType) => DisplayMedia[];
    getTitle: (media: DisplayMedia) => string;

    // TASK 4: CRUD operations
    addEntry: (entry: Partial<DisplayMedia> & { _seriesId: number; mediaType: MediaType }) => Promise<void>;
    updateEntry: (entryId: string | number, updates: Partial<DisplayMedia>) => Promise<void>;
    deleteEntry: (entryId: string | number) => Promise<void>;
    searchAniList: (query: string, type: "ANIME" | "MANGA") => Promise<DisplayMedia[]>;

    // MIGRATION & IMPORT
    migrateLocalData: (onProgress?: (current: number, total: number) => void) => Promise<void>;
    clearLocalData: () => Promise<void>;
    importAnilistGdpr: (data: GdprData, onProgress?: (current: number, total: number) => void) => Promise<void>;

    // DUPLICATE DETECTION
    duplicateCheck: DuplicateCheck | null;
    resolveDuplicate: (action: "view" | "update" | "cancel") => Promise<void>;
    getActivities: () => Promise<ActivityLog[]>;
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
    const [userEdits, setUserEdits] = useState<Map<string | number, UserEntry>>(new Map());
    const [error, setError] = useState<string | null>(null);
    const [storageMode, setStorageMode] = useState<"cloud" | "local">("local");
    const [duplicateCheck, setDuplicateCheck] = useState<DuplicateCheck | null>(null);

    // Get authenticated user from AuthContext
    const { user: authUser } = useAuth();

    // TASK 6 & 7: Use Zustand store for reactive state
    const { animeList, mangaList, setAnimeList, setMangaList } = useMediaStore();

    // TASK 2 & 3: Load and parse GDPR data with Storage Provider integration
    // Also switches storage provider based on authentication status
    useEffect(() => {
        async function load() {
            try {
                // PHASE 1.1: Detect guest mode
                const isAuthenticated = !!authUser?.id;
                const mode = isAuthenticated ? "cloud" : "local";

                // Update storage mode (hard switch)
                updateStorageMode(isAuthenticated, authUser?.id);
                setStorageMode(mode);

                const modeLabel = isAuthenticated ? "CLOUD MODE ☁️" : "GUEST MODE (Local) 👤";
                console.log(`%c📊 ${modeLabel}`, "font-weight: bold; color: #4dabf7; font-size: 14px;");
                console.log("%c" + displayStorageStatus(), "font-weight: bold; color: #4dabf7; font-size: 14px;");

                // PHASE 1: For guest users, return empty arrays immediately
                if (!isAuthenticated) {
                    console.log("%c✨ Guest experience: showing empty vault", "color: #868e96;");
                    // Provide a minimal but complete DisplayUser for guest mode
                    setUser({
                        id: 0,
                        displayName: "Guest",
                        userName: "guest",
                        email: "",
                        about: "",
                        avatarUrl: null,
                        bannerUrl: null,
                        profileColor: "#ffffff",
                        scoreFormat: "POINT_100",
                        titleLanguage: "ROMAJI",
                        customListNames: { anime: [], manga: [] },
                        statistics: {
                            anime: {
                                count: 0,
                                minutesWatched: 0,
                                progress: 0,
                                progressVolumes: 0,
                                meanScore: 0,
                                standardDeviation: 0,
                            },
                            manga: {
                                count: 0,
                                minutesWatched: 0,
                                progress: 0,
                                progressVolumes: 0,
                                meanScore: 0,
                                standardDeviation: 0,
                            },
                        },
                        activityHistory: {},
                        activityHistoryTotal: 0,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        listOrder: 0,
                        forumHomepage: 0,
                        adultContent: false,
                        legacyLists: false,
                        donator: 0,
                        donatorBadge: null,
                        notifications: 0,
                        airingNotifications: false,
                        privacy: false,
                        notificationOptions: "",
                        modRoles: 0,
                        ip: "",
                        animeWatched: 0,
                        chaptersRead: 0,
                        advancedScoresActive: false,
                        advancedScoresNames: [],
                        hiddenCategories: null,
                        statusDistribution: { anime: [], manga: [] },
                        scoreDistribution: { anime: [], manga: [] },
                        favourites: { anime: [], manga: [], characters: [], staff: [], studios: [] },
                    });
                    setAnimeList([]);
                    setMangaList([]);
                    setUserEdits(new Map());
                    setRawData(null);
                    setLoading(false);
                    setError(null);
                    return;
                }

                // TASK 1 & 2 & 3: Cloud must load FIRST if authenticated
                if (isAuthenticated && authUser?.id) {
                    console.log("%c[BOOT] loading from SUPABASE", "color: #1c7ed6; font-weight: bold; font-size: 16px;");
                    
                    // TASK 3 — Clear local state in cloud mode
                    setAnimeList([]);
                    setMangaList([]);
                    setLoading(true);

                    await switchStorageProvider(true, authUser.id);
                    const storage = getStorageProvider();

                    // Load EVERYTHING from Supabase
                    const accumulatedEdits = new Map<string | number, UserEntry>();
                    
                    // Helper to map edits to display media
                    const mapEditsToDisplay = (edits: Map<string | number, UserEntry>): DisplayMedia[] => {
                        return Array.from(edits.values()).map(edit => {
                            const data = edit.data || {};
                            return {
                                ...data,
                                // RE-ENSURE metadata exists even if edit.data has null/undefined fields
                                title: data.title || { romaji: "Unknown", english: null, native: null },
                                coverImage: data.coverImage || null,
                                bannerImage: data.bannerImage || null,
                                genres: safeArray<string>(data.genres),
                                tags: safeArray<any>(data.tags),
                                format: data.format || null,
                                customLists: safeArray<string>(data.customLists),
                                advancedScores: safeArray<number>(data.advancedScores),
                                _entryId: edit.entryId,
                                _seriesId: edit.seriesId,
                                _userId: edit.userId,
                                _enriched: !!data.title && data.title.romaji !== "Loading fragment...",
                            } as DisplayMedia;
                        });
                    };

                    const cloudEdits = await storage.getAllUserEntries(authUser.id, (batch) => {
                         // TASK 5: Prevent UI freeze by appending gradually
                         batch.forEach(entry => accumulatedEdits.set(entry.entryId, entry));
                         
                         // Update UI with partial results
                         const partialEntries = mapEditsToDisplay(accumulatedEdits);
                         setAnimeList(partialEntries.filter(e => e.mediaType === "ANIME"));
                         setMangaList(partialEntries.filter(e => e.mediaType === "MANGA"));
                         setUserEdits(new Map(accumulatedEdits));
                    });

                    console.log(`%c[BOOT] Found ${cloudEdits.size} entries in Supabase.`, "color: #1c7ed6;");
                    
                    // Final state update (ensure consistency)
                    setUserEdits(cloudEdits);

                    // For cloud users, the Supabase data is the ONLY source.
                    const cloudEntries = mapEditsToDisplay(cloudEdits);

                    const finalAnime = cloudEntries.filter(e => e.mediaType === "ANIME");
                    const finalManga = cloudEntries.filter(e => e.mediaType === "MANGA");

                    setAnimeList(finalAnime);
                    setMangaList(finalManga);
                    
                    // Set identity from Auth
                    setUser({
                        id: authUser.id,
                        displayName: authUser.displayName || authUser.email.split("@")[0],
                        userName: authUser.email,
                        email: authUser.email,
                        about: "",
                        avatarUrl: authUser.avatar || null,
                        bannerUrl: null,
                        profileColor: "blue",
                        scoreFormat: "POINT_10",
                        titleLanguage: "ROMAJI",
                        customListNames: { anime: [], manga: [] },
                        statistics: {
                            anime: { count: 0, minutesWatched: 0, progress: 0, progressVolumes: 0, meanScore: 0, standardDeviation: 0 },
                            manga: { count: 0, minutesWatched: 0, progress: 0, progressVolumes: 0, meanScore: 0, standardDeviation: 0 },
                        },
                        activityHistory: {},
                        activityHistoryTotal: 0,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                        listOrder: 0,
                        forumHomepage: 0,
                        adultContent: false,
                        legacyLists: false,
                        donator: 0,
                        donatorBadge: null,
                        notifications: 0,
                        airingNotifications: false,
                        privacy: false,
                        notificationOptions: "",
                        modRoles: 0,
                        ip: "",
                        animeWatched: 0,
                        chaptersRead: 0,
                        advancedScoresActive: false,
                        advancedScoresNames: [],
                        hiddenCategories: [],
                        statusDistribution: { anime: [], manga: [] },
                        scoreDistribution: { anime: [], manga: [] },
                        favourites: { anime: [], manga: [], characters: [], staff: [], studios: [] }
                    });

                    setLoading(false);

                    // Trigger enrichment for these entries
                    setEnriching(true);
                    const allIds = cloudEntries.map(e => e._seriesId);
                    
                    // Hydration Pipeline - Progressive loading like Netflix
                    // We fetch in batches and update the UI incrementally
                    fetchMediaBatched(allIds, (loaded, total) => {
                        setEnrichProgress({ loaded, total });
                        
                        // Progressive UI update after each batch (Task 6 & 10)
                        setAnimeList(prev => prev.map(e => enrichEntryWithUserEdits(e, cloudEdits)));
                        setMangaList(prev => prev.map(e => enrichEntryWithUserEdits(e, cloudEdits)));
                    }).then(() => {
                        setEnriching(false);
                        console.log("%c[HYDRATE] All fragments identified and metadata synced.", "color: #51cf66; font-weight: bold;");
                        
                        // Final refresh to ensure everything is perfect
                        setAnimeList(prev => prev.map(e => enrichEntryWithUserEdits(e, cloudEdits)));
                        setMangaList(prev => prev.map(e => enrichEntryWithUserEdits(e, cloudEdits)));

                        // Re-sync after enrichment to ensure data is fresh
                        const syncManager = getRealtimeSyncManager();
                        syncManager.startSync({
                            userId: authUser.id,
                            onError: error => console.error("[SYNC] error:", error),
                        });
                    });

                    return; // EXIT EARLY - Cloud boot for cloud users
                }

                // GUEST MODE - Original loading logic (GDPR + Local)
                await switchStorageProvider(false);
                const storage = getStorageProvider();
                await initializeCache();

                DataLog.reading("GDPR");
                const response = await fetch("/data/gdpr_data.json");
                if (!response.ok) {
                    throw new Error(`Failed to fetch GDPR data: ${response.status} ${response.statusText}`);
                }
                const data: GdprData = await response.json();
                setRawData(data);
                const parsed = parseGdprData(data);
                setUser(parsed.user);

                let edits = new Map<string | number, UserEntry>();
                edits = await storage.getAllUserEntries(parsed.user.id);
                setUserEdits(edits);

                // applyUserEdits merges database edits into base JSON entries
                const applyUserEdits = (
                    entries: DisplayMedia[],
                    userEditsMap: Map<string | number, UserEntry>,
                ): DisplayMedia[] => {
                    return entries.map(entry => {
                        const edit = userEditsMap.get(entry._entryId);
                        if (edit && !edit.deleted) {
                            return {
                                ...entry,
                                ...edit.data,
                                _entryId: entry._entryId,
                                _seriesId: entry._seriesId,
                                _userId: entry._userId,
                            };
                        }
                        return entry;
                    });
                };

                // identifyStandaloneEdits finds entries in database that are NOT in the base JSON
                const identifyStandaloneEdits = (
                    existingIds: Set<string | number>,
                    userEditsMap: Map<string | number, UserEntry>,
                    type: MediaType,
                ): DisplayMedia[] => {
                    const standalone: DisplayMedia[] = [];
                    userEditsMap.forEach((edit, entryId) => {
                        if (!existingIds.has(entryId) && !edit.deleted) {
                            const skeleton: DisplayMedia = {
                                status: edit.data.status || "PLANNING",
                                score: edit.data.score ?? 0,
                                progress: edit.data.progress ?? 0,
                                progressVolumes: edit.data.progressVolumes ?? 0,
                                repeat: edit.data.repeat ?? 0,
                                priority: edit.data.priority ?? 0,
                                tierId: edit.data.tierId ?? null,
                                isPrivate: edit.data.isPrivate ?? false,
                                notes: edit.data.notes ?? null,
                                customLists: edit.data.customLists || [],
                                startedAt: edit.data.startedAt ?? null,
                                completedAt: edit.data.completedAt ?? null,
                                createdAt: new Date().toISOString(),
                                updatedAt: new Date().toISOString(),
                                mediaType: edit.data.mediaType || type, // Default to current list type if unknown
                                advancedScores: edit.data.advancedScores || [],
                                hiddenDefault: edit.data.hiddenDefault ?? false,
                                coverImage: null,
                                bannerImage: null,
                                genres: [],
                                tags: [],
                                duration: null,
                                originType: "manga",
                                ...edit.data,
                                // FORCE SAFE TITLE - spreading edit.data above might overwrite with null
                                title: edit.data?.title || { romaji: "Loading fragment...", english: null, native: null },
                                _seriesId: edit.seriesId,
                                _entryId: edit.entryId,
                                _userId: edit.userId,
                                _enriched: false,
                            };
                            
                            // If we don't know the type, add it to both lists temporarily
                            // It will be re-sorted after background enrichment
                            if (!edit.data.mediaType || edit.data.mediaType === type) {
                                standalone.push(skeleton);
                            }
                        }
                    });
                    return standalone;
                };

                let animeEntries = parsed.animeEntries;
                let mangaEntries = parsed.mangaEntries;

                // Track existing IDs from JSON
                const existingAnimeIds = new Set<string | number>(animeEntries.map(e => e._entryId));
                const existingMangaIds = new Set<string | number>(mangaEntries.map(e => e._entryId));

                // 1. Apply edits to existing JSON entries
                animeEntries = applyUserEdits(animeEntries, edits);
                mangaEntries = applyUserEdits(mangaEntries, edits);

                // 2. Add STANDALONE entries (added via app, not in GDPR)
                const standaloneAnime = identifyStandaloneEdits(existingAnimeIds, edits, "ANIME");
                const standaloneManga = identifyStandaloneEdits(existingMangaIds, edits, "MANGA");

                // Combine them
                const initialAnime = [...animeEntries, ...standaloneAnime];
                const initialManga = [...mangaEntries, ...standaloneManga];

                // TASK 2: Enrich immediately from cache
                const enrichedAnime = initialAnime.map(entry => enrichEntryWithUserEdits(entry, edits));
                const enrichedManga = initialManga.map(entry => enrichEntryWithUserEdits(entry, edits));

                // Update store
                setAnimeList(enrichedAnime);
                setMangaList(enrichedManga);
                setLoading(false);
                setError(null);

                // Background enrichment
                setEnriching(true);
                const allIds = [
                    ...initialAnime.map(e => e._seriesId),
                    ...initialManga.map(e => e._seriesId),
                ];

                fetchMediaBatched(allIds, (loaded, total) => {
                    setEnrichProgress({ loaded, total });
                    
                    // Progressive UI update (Task 6)
                    setAnimeList(prev => prev.map(e => enrichEntryWithUserEdits(e, edits)));
                    setMangaList(prev => prev.map(e => enrichEntryWithUserEdits(e, edits)));
                })
                    .then(() => {
                        setEnriching(false);
                        
                        // Final re-sort and classification based on TRUE mediaType from API
                        setAnimeList(prev => {
                            const combined = [...prev, ...getMediaStoreState().mangaList];
                            const allEnriched = combined.map(e => enrichEntryWithUserEdits(e, edits));
                            // Use Map to dedupe by _entryId
                            const unique = new Map(allEnriched.map(e => [e._entryId, e]));
                            return Array.from(unique.values()).filter(e => e.mediaType === "ANIME");
                        });
                        
                        setMangaList(prev => {
                            const combined = [...prev, ...getMediaStoreState().animeList];
                            const allEnriched = combined.map(e => enrichEntryWithUserEdits(e, edits));
                            const unique = new Map(allEnriched.map(e => [e._entryId, e]));
                            return Array.from(unique.values()).filter(e => e.mediaType === "MANGA");
                        });

                        if (authUser?.id) {
                            const syncManager = getRealtimeSyncManager();
                            syncManager.startSync({
                                userId: authUser.id,
                                onError: error => {
                                    console.error("[SYNC] Real-time sync error:", error);
                                },
                            });
                        }
                    })
                    .catch(err => {
                        console.error("Background enrichment failed:", err);
                        setEnriching(false);
                    });
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
                console.error("Failed to load GDPR data:", err);
                setError(errorMessage);
                setLoading(false);
            }
        }

        load();

        // Cleanup: Stop real-time sync on unmount or when logged out
        return () => {
            if (!authUser?.id) {
                const syncManager = getRealtimeSyncManager();
                if (syncManager.isActive()) {
                    syncManager.stopSync();
                }
            }
        };
    }, [authUser?.id, setAnimeList, setMangaList]);

    const getTitle = useCallback(
        (media: DisplayMedia): string => {
            if (!media || !media.title || typeof media.title !== "object") {
                return "Unknown Fragment";
            }

            const titleObj = media.title as any;
            const romaji = titleObj.romaji || "";
            const english = titleObj.english || "";
            const native = titleObj.native || "";

            if (!user) return romaji || english || native || "Unknown";

            switch (user.titleLanguage) {
                case "ENGLISH":
                    return english || romaji || native || "Unknown";
                case "NATIVE":
                    return native || romaji || english || "Unknown";
                default:
                    return romaji || english || native || "Unknown";
            }
        },
        [user],
    );

    // Handle logout: Switch back to local storage and stop real-time sync
    useEffect(() => {
        const handleLogout = async () => {
            if (!authUser) {
                // User logged out
                console.log("[SYNC] User logged out, switching to local storage");

                // Stop real-time sync
                const syncManager = getRealtimeSyncManager();
                if (syncManager.isActive()) {
                    await syncManager.stopSync();
                }

                // Switch back to local storage
                try {
                    await switchStorageProvider(false);
                } catch (err) {
                    console.warn("Error switching to local storage on logout:", err);
                }
            }
        };

        handleLogout();
    }, [authUser]);

    const getAnimeByStatus = useCallback((status: MediaStatus) => {
        const { animeList: storeAnimeList } = getMediaStoreState();
        return safeArray<DisplayMedia>(storeAnimeList).filter(e => e.status === status);
    }, []);

    const getMangaByStatus = useCallback((status: MediaStatus) => {
        const { mangaList: storeMangaList } = getMediaStoreState();
        return safeArray<DisplayMedia>(storeMangaList).filter(e => e.status === status);
    }, []);

    const getCustomListEntries = useCallback((listName: string, type: MediaType) => {
        const { animeList: storeAnimeList, mangaList: storeMangaList } = getMediaStoreState();
        const list = type === "ANIME" ? storeAnimeList : storeMangaList;
        return safeArray<DisplayMedia>(list).filter(e => safeArray<string>(e.customLists).includes(listName));
    }, []);

    // TASK 4: Add entry
    const addEntry = useCallback(
        async (
            entry: Partial<DisplayMedia> & { _seriesId: number; mediaType: MediaType },
            isImport: boolean = false,
        ) => {
            if (!user) return;

            // TASK 1: Pre-insert duplicate check
            const list = entry.mediaType === "ANIME" ? animeList : mangaList;
            const existing = list.find(m => {
                if (m._seriesId !== 0 && m._seriesId === entry._seriesId) return true;
                // Fallback to title match if seriesId missing
                const mTitle = getTitle(m).toLowerCase();
                const eTitle = (entry.title?.romaji || entry.title?.english || "").toLowerCase();
                return eTitle !== "" && mTitle === eTitle;
            });

            if (existing) {
                if (isImport) {
                    // TASK 3: Import mode - auto merge
                    console.log(`%c[DUPLICATE] Auto-merging ${entry.title?.romaji || "Item"}`, "color: #4dabf7;");
                    await updateEntry(existing._entryId, entry);
                    return;
                }

                // TASK 2: If found, open modal (via state)
                console.log(`%c[DUPLICATE] Prevention triggered for ${entry.title?.romaji || "Item"}`, "color: #ff922b;");
                setDuplicateCheck({ existing, pending: entry });
                return;
            }

            // PHASE 4: Block guest users from adding entries
            if (storageMode === "local") {
                console.warn("❌ Guest users cannot add entries. Please sign in.");
                throw new Error("Sign in required to add entries");
            }

            // TASK 5: Generate a temporary entry ID (with temp- prefix)
            const tempEntryId = `temp-${Date.now()}`;

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
                duration: entry.duration ?? null,
                tags: entry.tags || [],
                originType: entry.originType || "manga",
                _seriesId: entry._seriesId,
                _entryId: tempEntryId,
                _userId: user.id,
                _enriched: entry._enriched ?? false,
            };

            // Enrich if needed
            const enriched = enrichEntryWithUserEdits(newEntry, userEdits);

            // TASK 8: Record edit history
            editHistory.recordEdit(tempEntryId, user.id, "create", null, enriched, "create", null, enriched);

            // Save to Storage Provider (PHASE 3: All CRUD → cloud)
            const storage = getStorageProvider();
            let finalId: string | number = tempEntryId;
            try {
                finalId = await storage.saveUserEntry({
                    entryId: tempEntryId,
                    seriesId: entry._seriesId,
                    userId: user.id,
                    data: {
                        ...enriched,
                        mediaType: entry.mediaType, // Critical: store media type for reload identification
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
            } catch (err) {
                DataLog.error("addEntry", err);
                throw err;
            }

            // TASK 3: Update with the REAL ID returned from server
            const finalEntry = { ...enriched, _entryId: finalId };

            // TASK 6 & 7: Update Zustand store (triggers stats invalidation)
            const { addEntry: storeAddEntry } = getMediaStoreState();
            storeAddEntry(finalEntry);
        },
        [user, userEdits, animeList, mangaList],
    );

    // TASK 2: Resolve duplicate
    const resolveDuplicate = useCallback(
        async (action: "view" | "update" | "cancel") => {
            if (!duplicateCheck) return;

            const { existing, pending } = duplicateCheck;
            setDuplicateCheck(null);

            if (action === "view") {
                // Navigate to the item (this depends on router, but for now we can maybe just toast or scroll)
                // We'll leave the navigation logic to the UI layer if needed, 
                // but let's at least log it.
                console.log(`%c[DUPLICATE] Viewing existing entry ${existing._entryId}`, "color: #51cf66;");
            } else if (action === "update") {
                console.log(`%c[DUPLICATE] Updating existing entry ${existing._entryId}`, "color: #ffd43b;");
                await updateEntry(existing._entryId, pending);
            } else {
                console.log("%c[DUPLICATE] Canceled add", "color: #adb5bd;");
            }
        },
        [duplicateCheck],
    );

    const getActivities = useCallback(async () => {
        if (!user) return [];
        const storage = getStorageProvider();
        return storage.getActivities(user.id);
    }, [user]);

    // MIGRATION Logic
    const migrateLocalData = useCallback(
        async (onProgress?: (current: number, total: number) => void) => {
            if (!authUser || !authUser.id) throw new Error("Authenticated user required for migration");

            const cloudStorage = getStorageProvider();
            if (!(cloudStorage instanceof CloudStorageProvider)) {
                throw new Error("Must be in cloud mode to migrate");
            }

            // 1. Collect everything
            const localEntries = await dbGetAllLocalEntries();
            const localBoards = await dbGetAllTierBoards();
            const localTiers = await dbGetAllLocalTiers();
            const localAssignments = await dbGetAllLocalAssignments();

            const totalItems = localEntries.length + localBoards.length + localTiers.length + localAssignments.length;
            let currentProgress = 0;

            const updateProgress = () => {
                currentProgress++;
                onProgress?.(currentProgress, totalItems);
            };

            // 2. Migrate Media Entries (Items)
            for (const entry of localEntries) {
                // Attach current user ID
                const entryToMigrate = { ...entry, userId: authUser.id };
                await cloudStorage.saveUserEntry(entryToMigrate);
                updateProgress();
            }

            // 3. Migrate Boards -> Tiers -> Assignments (Hierarchy Mapping)
            // localId -> cloudId mapping
            const boardMap = new Map<string | number, string | number>();
            const tierMap = new Map<string | number, string | number>();

            // Boards
            for (const board of localBoards) {
                const localId = board.id!;
                const newId = await cloudStorage.createTierBoard({
                    name: board.name,
                    description: board.description
                });
                boardMap.set(localId, newId);
                updateProgress();
            }

            // Tiers
            for (const tier of localTiers) {
                const localId = tier.id!;
                const newBoardId = boardMap.get(tier.boardId);
                if (!newBoardId) {
                    updateProgress();
                    continue;
                }
                const newId = await cloudStorage.createTier( {
                    boardId: newBoardId,
                    name: tier.name,
                    color: tier.color,
                    order: tier.order
                });
                tierMap.set(localId, newId);
                updateProgress();
            }

            // Assignments
            for (const assignment of localAssignments) {
                const newBoardId = boardMap.get(assignment.boardId);
                const newTierId = assignment.tierId ? tierMap.get(assignment.tierId) : null;
                
                if (!newBoardId) {
                    updateProgress();
                    continue;
                }

                await cloudStorage.saveAssignment({
                    boardId: newBoardId,
                    mediaId: assignment.mediaId,
                    tierId: newTierId || null,
                    position: assignment.position
                });
                updateProgress();
            }

            console.log("%c✅ Migration finished successfully", "color: #51cf66; font-weight: bold;");
        },
        [authUser]
    );

    const clearLocalData = useCallback(async () => {
        await dbClearAllLocalEntries();
        await dbClearAllLocalTierData();
    }, []);

    const importAnilistGdpr = useCallback(
        async (data: GdprData, onProgress?: (current: number, total: number) => void) => {
            if (!user) throw new Error("User session required for import");

            const { animeEntries, mangaEntries } = parseGdprData(data);
            const allEntries = [...animeEntries, ...mangaEntries];
            const total = allEntries.length;
            let current = 0;

            const storage = getStorageProvider();

            console.log(`%c[IMPORT] Starting import of ${total} entries...`, "color: #1c7ed6; font-weight: bold;");

            const userEntries: UserEntry[] = allEntries.map(entry => ({
                entryId: entry._entryId,
                seriesId: entry._seriesId,
                userId: user.id || 0,
                data: {
                    mediaType: entry.mediaType,
                    status: entry.status,
                    score: entry.score,
                    progress: entry.progress,
                    progressVolumes: entry.progressVolumes,
                    repeat: entry.repeat,
                    priority: entry.priority,
                    tierId: entry.tierId,
                    isPrivate: entry.isPrivate,
                    notes: entry.notes,
                    customLists: entry.customLists,
                    startedAt: entry.startedAt,
                    completedAt: entry.completedAt,
                    advancedScores: entry.advancedScores,
                    hiddenDefault: entry.hiddenDefault,
                },
                editedAt: Date.now(),
                deleted: false,
            }));

            // Use batch save for much better performance
            await storage.saveUserEntries(userEntries);
            onProgress?.(total, total);

            console.log("%c[IMPORT] Import finished successfully", "color: #51cf66; font-weight: bold;");
            
            // Trigger a reload to refresh the UI with new data
            window.location.reload();
        },
        [user],
    );

    // TASK 4: Update entry
    const updateEntry = useCallback(
        async (entryId: string | number, updates: Partial<DisplayMedia>) => {
            if (!user) return;

            // PHASE 4: Block guest users from updating entries
            if (storageMode === "local") {
                console.warn("❌ Guest users cannot update entries. Please sign in.");
                throw new Error("Sign in required to update entries");
            }

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
            const storage = getStorageProvider();

            // TASK 8: Record edit history for each changed field
            changedFields.forEach(field => {
                const oldVal = fieldChanges[field].old;
                const newVal = fieldChanges[field].new;

                editHistory.recordEdit(
                    entryId,
                    user.id,
                    "update",
                    existingEntry,
                    updated,
                    field,
                    oldVal,
                    newVal,
                );

                // LOG ACTIVITY (TASK 1: Behavioral Analytics)
                const seriesId = existingEntry._seriesId;
                const mediaType = existingEntry.mediaType;

                if (field === "progress" || field === "progressVolumes") {
                    storage.logActivity({ seriesId, actionType: "progress", mediaType, details: { from: oldVal, to: newVal } });
                } else if (field === "status" && newVal === "COMPLETED") {
                    storage.logActivity({ seriesId, actionType: "complete", mediaType, details: { title: getTitle(existingEntry) } });
                } else if (field === "status") {
                    storage.logActivity({ seriesId, actionType: "status_change", mediaType, details: { from: oldVal, to: newVal } });
                } else if (field === "tierId") {
                    storage.logActivity({ seriesId, actionType: "tier_move", mediaType, details: { from: oldVal, to: newVal } });
                } else if (field === "score") {
                    storage.logActivity({ seriesId, actionType: "rating_change", mediaType, details: { from: oldVal, to: newVal } });
                }
            });

            // Save user edits to Storage Provider (PHASE 3: All CRUD → cloud)
            let finalId = entryId;
            try {
                DataLog.updated("SUPABASE", entryId, changedFields);
                finalId = await storage.saveUserEntry({
                    entryId,
                    seriesId: existingEntry._seriesId,
                    userId: user.id,
                    data: {
                        mediaType: updated.mediaType,
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
            } catch (err) {
                DataLog.error("updateEntry", err);
                throw err;
            }

            // TASK 6 & 7: Update Zustand store (triggers stats invalidation)
            const { updateEntry: storeUpdateEntry } = getMediaStoreState();
            storeUpdateEntry(finalId, updates);

            // Update user edits map
            setUserEdits(prev => {
                const newMap = new Map(prev);
                newMap.set(finalId, {
                    entryId: finalId,
                    seriesId: existingEntry._seriesId,
                    userId: user.id,
                    data: updates,
                    editedAt: Date.now(),
                    deleted: false,
                });
                return newMap;
            });
        },
        [user, animeList, mangaList],
    );

    // TASK 4: Delete entry (soft delete)
    const deleteEntry = useCallback(
        async (entryId: string | number) => {
            if (!user) return;

            // PHASE 4: Block guest users from deleting entries
            if (storageMode === "local") {
                console.warn("❌ Guest users cannot delete entries. Please sign in.");
                throw new Error("Sign in required to delete entries");
            }

            // Find entry before deletion for history
            const animeEntry = animeList.find(e => e._entryId === entryId);
            const mangaEntry = mangaList.find(e => e._entryId === entryId);
            const existingEntry = animeEntry || mangaEntry;

            // TASK 8: Record deletion in history
            if (existingEntry) {
                editHistory.recordEdit(entryId, user.id, "delete", existingEntry, null, "delete", existingEntry, null);
            }

            // PHASE 3: All CRUD → cloud
            const storage = getStorageProvider();
            try {
                DataLog.deleted("SUPABASE", entryId, true);
                await storage.deleteUserEntry(entryId);
            } catch (err) {
                DataLog.error("deleteEntry", err);
                throw err;
            }

            // TASK 6 & 7: Update Zustand store (triggers stats invalidation)
            const { deleteEntry: storeDeleteEntry } = getMediaStoreState();
            storeDeleteEntry(entryId);

            // Update user edits map
            setUserEdits(prev => {
                const newMap = new Map(prev);
                newMap.delete(entryId);
                return newMap;
            });
        },
        [user, animeList, mangaList],
    );

    // TASK 4: Search AniList
    const searchAniList = useCallback(
        async (query: string, type: "ANIME" | "MANGA"): Promise<DisplayMedia[]> => {
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
                duration: media.duration ?? null,
                tags: (media.tags || []).map((t: any) => t.name),
                originType: type === "MANGA" ? mapCountryToOriginType(media.countryOfOrigin) : "manga",
                _seriesId: media.id,
                _entryId: 0, // Will be set when added
                _userId: user?.id || 0,
                _enriched: true,
            }));
        },
        [user],
    );

    const value = useMemo(
        () => ({
            loading,
            enriching,
            enrichProgress,
            error,
            user,
            animeList, // From store hook
            mangaList, // From store hook
            rawData,
            storageMode, // PHASE 5: Display current mode in UI
            getAnimeByStatus,
            getMangaByStatus,
            getCustomListEntries,
            getTitle,
            addEntry,
            updateEntry,
            deleteEntry,
            searchAniList,
            migrateLocalData,
            clearLocalData,
            importAnilistGdpr,
            duplicateCheck,
            resolveDuplicate,
            getActivities,
        }),
        [
            loading,
            enriching,
            enrichProgress,
            error,
            user,
            animeList,
            mangaList,
            rawData,
            storageMode,
            getAnimeByStatus,
            getMangaByStatus,
            getCustomListEntries,
            getTitle,
            addEntry,
            updateEntry,
            deleteEntry,
            searchAniList,
            migrateLocalData,
            clearLocalData,
            importAnilistGdpr,
            duplicateCheck,
            resolveDuplicate,
            getActivities,
        ],
    );

    return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

// TASK 3: Enrich entry while preserving user edits
function enrichEntryWithUserEdits(entry: DisplayMedia, userEdits: Map<string | number, UserEntry>): DisplayMedia {
    const cached = getCachedMedia(entry._seriesId);
    const userEdit = userEdits.get(entry._entryId);

    // TASK 1: Auto-classify origin type from countryOfOrigin
    const originType =
        entry.mediaType === "MANGA" && cached
            ? mapCountryToOriginType(cached.countryOfOrigin)
            : entry.originType || "manga";

    // TASK 1 & 3: Merge API data with entry with HYPER-SAFE accessors
    const enriched: DisplayMedia = {
        ...entry,
        // API enrichment (only if not user-edited)
        // ANY property that could be missing from API is now guarded with fallbacks
        title: {
            romaji: cached?.title?.romaji || entry.title?.romaji || "Unknown Title",
            english: cached?.title?.english || entry.title?.english || null,
            native: cached?.title?.native || entry.title?.native || null,
        },
        coverImage: cached?.coverImage?.large || cached?.coverImage?.medium || entry.coverImage || null,
        bannerImage: cached?.bannerImage || entry.bannerImage || null,
        format: cached?.format || entry.format || "TV",
        episodes: cached?.episodes ?? entry.episodes ?? null,
        chapters: cached?.chapters ?? entry.chapters ?? null,
        volumes: cached?.volumes ?? entry.volumes ?? null,
        genres: cached?.genres || entry.genres || [],
        season: cached?.season || entry.season || null,
        seasonYear: cached?.seasonYear ?? entry.seasonYear ?? null,
        description: cached?.description || entry.description || "No description available.",
        duration: cached?.duration ?? entry.duration ?? null,
        tags: cached?.tags?.map((t: any) => t.name) || entry.tags || [],
        originType,
        _enriched: !!cached,
    };

    // TASK 3: Apply user edits (user edits override API data)
    if (userEdit && !userEdit.deleted) {
        return {
            ...enriched,
            ...userEdit.data,
            // Re-ensure safe title after spread
            title: userEdit.data?.title || enriched.title,
            _entryId: entry._entryId,
            _seriesId: entry._seriesId,
            _userId: entry._userId,
        };
    }

    return enriched;
}
