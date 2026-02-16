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
        updatedAt
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
        updatedAt
      }
    }
  }
`;

// In-memory cache (for fast access)
const mediaCache = new Map<number, AniListMediaResponse>();

// TASK 2: Initialize cache from IndexedDB
let cacheInitialized = false;
async function initializeCacheFromDB(): Promise<void> {
    if (cacheInitialized) return;

    // We now allow IndexedDB caching even in cloud mode for CONTENT METADATA.
    // This provides "Persistence" for hydrated items across sessions.
    try {
        // We specifically use a separate instance of LocalStorageProvider 
        // for content metadata to ensure it's always accessible from IndexedDB,
        // even if the global provider is set to Cloud (Supabase).
        const localProvider = new (await import("./storage/local")).LocalStorageProvider();
        await localProvider.initialize();
        
        const cached = await localProvider.getAllMediaCache();
        for (const [id, media] of cached.entries()) {
            mediaCache.set(id, media);
        }
        cacheInitialized = true;
        console.log(`%c[HYDRATE] cache hit: ${cached.size} entries loaded from IndexedDB`, "color: #51cf66; font-weight: bold;");
    } catch (err) {
        console.warn("[HYDRATE] Failed to load cache from IndexedDB:", err);
        cacheInitialized = true;
    }

    // Initialized above
}

export function getCachedMedia(id: number): AniListMediaResponse | undefined {
    return mediaCache.get(id);
}

export function getAllCached(): Map<number, AniListMediaResponse> {
    return mediaCache;
}

async function fetchBatch(ids: number[]): Promise<AniListMediaResponse[]> {
    try {
        console.log(`%c[HYDRATE] fetching media: ${ids.length} items from AniList`, "color: #1c7ed6; font-weight: bold;");
        
        const response = await fetch(ANILIST_API, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                query: MEDIA_QUERY,
                variables: { ids, page: 1 },
            }),
        });

        if (response.status === 429) {
            console.warn("[HYDRATE] Rate limited. Waiting 2s before retry...");
            await sleep(2000);
            return fetchBatch(ids);
        }

        if (!response.ok) {
            console.warn(`[HYDRATE] AniList API error: ${response.status}`);
            return [];
        }

        const json = await response.json();
        const media: AniListMediaResponse[] = json?.data?.Page?.media || [];

        // TASK 2: Cache results in memory and IndexedDB
        for (const m of media) {
            mediaCache.set(m.id, m);
            console.log(`%c[HYDRATE] metadata received for series ${m.id}`, "color: #51cf66;");
            
            // Save to active storage provider (force local storage for metadata)
            (async () => {
                try {
                    const localProvider = new (await import("./storage/local")).LocalStorageProvider();
                    await localProvider.initialize();
                    await localProvider.saveMediaCache(m.id, m);
                } catch (err) {
                    console.warn(`[HYDRATE] Failed to persist media ${m.id}:`, err);
                }
            })();
        }

        return media;
    } catch (err) {
        console.error("[HYDRATE] Critical fetch error:", err);
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
                    if (isCloudProvider()) return;

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
