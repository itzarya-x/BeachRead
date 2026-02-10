import type { AniListMediaResponse } from "@/types/display";
import { getStorageProvider, initializeStorageProvider, isCloudProvider } from "./storage";

const ANILIST_API = "https://graphql.anilist.co";
const BATCH_SIZE = 50;
const RATE_LIMIT_DELAY = 700; // ms between batches

const MEDIA_QUERY = `
  query ($ids: [Int], $page: Int) {
    Page(page: $page, perPage: 50) {
      media(id_in: $ids) {
        id
        title { romaji english native }
        coverImage { large medium }
        bannerImage
        format
        episodes
        chapters
        volumes
        genres
        tags { name category }
        season
        seasonYear
        description(asHtml: false)
        countryOfOrigin
        averageScore
        popularity
      }
    }
  }
`;

// TASK 4: Search query for adding items
const SEARCH_QUERY = `
  query ($search: String, $type: MediaType, $page: Int, $perPage: Int) {
    Page(page: $page, perPage: $perPage) {
      media(search: $search, type: $type) {
        id
        title { romaji english native }
        coverImage { large medium }
        bannerImage
        format
        episodes
        chapters
        volumes
        genres
        tags { name category }
        season
        seasonYear
        description(asHtml: false)
        countryOfOrigin
        averageScore
        popularity
      }
    }
  }
`;

// In-memory cache (for fast access)
const mediaCache = new Map<number, AniListMediaResponse>();

// TASK 2: Initialize cache from IndexedDB
let cacheInitialized = false;
async function initializeCacheFromDB(): Promise<void> {
    if (cacheInitialized) return; // Only initialize once

    try {
        // Use the active storage provider for media cache reads.
        let storage: any;
        try {
            storage = getStorageProvider();
        } catch (err) {
            // If storage not initialized, fall back to local-only init for cache
            await initializeStorageProvider(false);
            storage = getStorageProvider();
        }

        if (isCloudProvider()) {
            console.log("%c[DATA] Cloud Provider Active", "color: #4dabf7; font-weight: bold;");
        }

        const cached = await storage.getAllMediaCache();
        for (const [id, media] of cached.entries()) {
            mediaCache.set(id, media);
        }
        cacheInitialized = true;
        console.log(`%c[CACHE] Loaded ${cached.size} media entries from IndexedDB`, "color: #868e96; font-style: italic;");
    } catch (err) {
        console.warn("Failed to load cache from IndexedDB:", err);
        cacheInitialized = true; // Mark as initialized even on error to prevent retries
    }
}

export function getCachedMedia(id: number): AniListMediaResponse | undefined {
    return mediaCache.get(id);
}

export function getAllCached(): Map<number, AniListMediaResponse> {
    return mediaCache;
}

async function fetchBatch(ids: number[]): Promise<AniListMediaResponse[]> {
    try {
        const response = await fetch(ANILIST_API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                query: MEDIA_QUERY,
                variables: { ids, page: 1 },
            }),
        });

        if (response.status === 429) {
            // Rate limited - wait and retry
            await sleep(2000);
            return fetchBatch(ids);
        }

        if (!response.ok) {
            console.warn(`AniList API error: ${response.status}`);
            return [];
        }

        const json = await response.json();
        const media: AniListMediaResponse[] = json?.data?.Page?.media || [];

        // TASK 2: Cache results in memory and IndexedDB
        for (const m of media) {
            mediaCache.set(m.id, m);
            // Save to active storage provider (async, don't wait)
            (async () => {
                try {
                    let storage: any;
                    try {
                        storage = getStorageProvider();
                    } catch (err) {
                        await initializeStorageProvider(false);
                        storage = getStorageProvider();
                    }

                    await storage.saveMediaCache(m.id, m);
                } catch (err) {
                    console.warn(`Failed to save media ${m.id} to storage:`, err);
                }
            })();
        }

        return media;
    } catch (err) {
        console.warn("AniList API fetch error:", err);
        return [];
    }
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetchMediaBatched(
    seriesIds: number[],
    onProgress?: (loaded: number, total: number) => void,
): Promise<Map<number, AniListMediaResponse>> {
    // TASK 2: Load from IndexedDB on first call
    await initializeCacheFromDB();

    // Dedupe and filter already cached
    const uniqueIds = [...new Set(seriesIds)];
    const toFetch = uniqueIds.filter(id => !mediaCache.has(id));

    const total = toFetch.length;
    let loaded = 0;

    // Process in batches
    for (let i = 0; i < toFetch.length; i += BATCH_SIZE) {
        const batch = toFetch.slice(i, i + BATCH_SIZE);
        await fetchBatch(batch);
        loaded += batch.length;
        onProgress?.(loaded, total);

        // Rate limit delay between batches
        if (i + BATCH_SIZE < toFetch.length) {
            await sleep(RATE_LIMIT_DELAY);
        }
    }

    return mediaCache;
}

export function enrichMediaEntry(seriesId: number): Partial<AniListMediaResponse> | null {
    const cached = mediaCache.get(seriesId);
    if (!cached) return null;
    return cached;
}

export async function initializeCache(): Promise<void> {
    // Initialize cache immediately (synchronous if possible)
    await initializeCacheFromDB();
}

/**
 * TASK 4: Search AniList for media
 */
export async function searchAniListMedia(
    query: string,
    type: "ANIME" | "MANGA" = "ANIME",
    page: number = 1,
    perPage: number = 20,
): Promise<AniListMediaResponse[]> {
    try {
        const response = await fetch(ANILIST_API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                query: SEARCH_QUERY,
                variables: { search: query, type, page, perPage },
            }),
        });

        if (response.status === 429) {
            await sleep(2000);
            return searchAniListMedia(query, type, page, perPage);
        }

        if (!response.ok) {
            console.warn(`AniList API error: ${response.status}`);
            return [];
        }

        const json = await response.json();
        const media: AniListMediaResponse[] = json?.data?.Page?.media || [];

        // Cache results
        for (const m of media) {
            mediaCache.set(m.id, m);
            (async () => {
                try {
                    let storage: any;
                    try {
                        storage = getStorageProvider();
                    } catch (err) {
                        await initializeStorageProvider(false);
                        storage = getStorageProvider();
                    }
                    await storage.saveMediaCache(m.id, m);
                } catch (err) {
                    console.warn(`Failed to save media ${m.id} to storage:`, err);
                }
            })();
        }

        return media;
    } catch (err) {
        console.warn("AniList API search error:", err);
        return [];
    }
}
