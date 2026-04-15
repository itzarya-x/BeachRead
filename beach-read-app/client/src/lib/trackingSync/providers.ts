import type { LibraryItem } from '../types';
import { ApiError, publicApiClient } from '../apiClient';
import type { ProviderId, ProviderMediaEntry } from './types';

const MAL_API_URL = 'https://api.myanimelist.net/v2';

type AniListDateParts = { year?: number | null; month?: number | null; day?: number | null };

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function toIsoDate(parts?: AniListDateParts | null): string | null {
  if (!parts?.year || !parts?.month || !parts?.day) return null;
  const yyyy = String(parts.year).padStart(4, '0');
  const mm = String(parts.month).padStart(2, '0');
  const dd = String(parts.day).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T00:00:00.000Z`;
}

function toProviderDate(value?: string | null): string | null {
  if (!value) return null;
  return value.length === 10 ? `${value}T00:00:00.000Z` : value;
}

function fromIsoDate(value?: string | null): AniListDateParts | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

function mapAniListStatus(status?: string | null): string {
  switch (status) {
    case 'CURRENT':
      return 'CURRENT';
    case 'COMPLETED':
      return 'COMPLETED';
    case 'PAUSED':
      return 'PAUSED';
    case 'DROPPED':
      return 'DROPPED';
    default:
      return 'PLANNING';
  }
}

function mapMalStatus(status?: string | null): string {
  switch (status) {
    case 'reading':
      return 'CURRENT';
    case 'completed':
      return 'COMPLETED';
    case 'on_hold':
      return 'PAUSED';
    case 'dropped':
      return 'DROPPED';
    default:
      return 'PLANNING';
  }
}

function toMalStatus(status?: string | null): string {
  switch (status) {
    case 'CURRENT':
    case 'READING':
      return 'reading';
    case 'COMPLETED':
      return 'completed';
    case 'PAUSED':
      return 'on_hold';
    case 'DROPPED':
      return 'dropped';
    default:
      return 'plan_to_read';
  }
}

async function fetchAniList<T>(query: string, variables: Record<string, unknown>, accessToken: string) {
  try {
    const json = await publicApiClient.post<{ data?: T; errors?: Array<{ message?: string }> }>(
      '/anilist/graphql',
      { query, variables, accessToken }
    );

    if (json?.errors?.length) {
      throw new Error(json.errors[0]?.message || 'AniList request failed.');
    }

    return (json?.data ?? null) as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw new Error(normalizeProviderRequestError('anilist', error.status, JSON.stringify(error.data || {})));
    }
    throw error;
  }
}

type ProviderIdentity = {
  id: string;
  username: string;
  favoriteCharacters?: Array<{ id: string; name: string; image: string }>;
};

function extractAniListCustomLists(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === 'string' && Boolean(item.trim()));
  }

  if (value && typeof value === 'object') {
    return Object.entries(value as Record<string, unknown>)
      .filter(([, enabled]) => Boolean(enabled))
      .map(([name]) => name.trim())
      .filter(Boolean);
  }

  return [];
}

function normalizeProviderRequestError(provider: ProviderId, status: number, bodyText?: string) {
  const body = bodyText?.trim();

  if (status === 401) {
    return provider === 'anilist'
      ? 'AniList rejected this token. Paste a valid AniList bearer token.'
      : 'MyAnimeList rejected this token. Paste a valid MAL OAuth access token.';
  }

  if (status === 403) {
    return provider === 'anilist'
      ? 'AniList denied this request. Check that the token still has access to your account.'
      : 'MyAnimeList denied this request. The token may be expired or missing required access.';
  }

  if (status === 429) {
    return `${provider.toUpperCase()} rate-limited the request. Try again in a moment.`;
  }

  if (body) {
    return `${provider.toUpperCase()} request failed with status ${status}: ${body}`;
  }

  return `${provider.toUpperCase()} request failed with status ${status}.`;
}

function normalizeAniListEntry(entry: any): ProviderMediaEntry {
  const rawMedia = entry?.media || {};
  const customLists = extractAniListCustomLists(entry?.customLists);
  const isFavourite = Boolean(rawMedia?.isFavourite);
  return {
    provider: 'anilist',
    providerMediaId: String(rawMedia?.id),
    seriesId: Number(rawMedia?.id) || null,
    title:
      asString(rawMedia?.title?.english) ||
      asString(rawMedia?.title?.romaji) ||
      asString(rawMedia?.title?.native) ||
      `Series ${rawMedia?.id}`,
    titles: [
      asString(rawMedia?.title?.english),
      asString(rawMedia?.title?.romaji),
      asString(rawMedia?.title?.native),
    ].filter((value): value is string => Boolean(value)),
    status: mapAniListStatus(entry?.status),
    score: Math.round(entry?.score || 0),
    progress: entry?.progress || 0,
    progressVolumes: entry?.progressVolumes || 0,
    repeat: entry?.repeat || 0,
    priority: entry?.priority || 0,
    isPrivate: Boolean(entry?.private),
    isFavourite,
    notes: asString(entry?.notes),
    customLists,
    startedAt: toIsoDate(entry?.startedAt),
    completedAt: toIsoDate(entry?.completedAt),
    updatedAt: entry?.updatedAt ? new Date(entry.updatedAt * 1000).toISOString() : null,
    rawMedia: {
      ...rawMedia,
      isFavourite,
    },
  };
}

export async function fetchAniListMangaEntries(accessToken: string): Promise<ProviderMediaEntry[]> {
  const viewerData = await fetchAniList<{ Viewer: { id?: number | null; favourites?: { manga?: { nodes?: Array<{ id: number }> } | null } | null } }>(
    `
      query {
        Viewer {
          id
          favourites {
            manga {
              nodes {
                id
              }
            }
          }
        }
      }
    `,
    {},
    accessToken
  );

  const viewerId = Number(viewerData?.Viewer?.id);
  if (!Number.isFinite(viewerId) || viewerId <= 0) {
    throw new Error('AniList token is valid, but the viewer ID could not be resolved.');
  }

  const favoriteIds = new Set(viewerData?.Viewer?.favourites?.manga?.nodes?.map(n => n.id) || []);

  const data = await fetchAniList<{
    manga: { lists: Array<{ name?: string | null; isCustomList?: boolean | null; entries: any[] }> | null };
  }>(
    `
      query ($userId: Int) {
        manga: MediaListCollection(userId: $userId, type: MANGA) {
          lists {
            name
            isCustomList
            entries {
              status
              score(format: POINT_100)
              progress
              progressVolumes
              repeat
              priority
              private
              notes
              customLists(asArray: true)
              updatedAt
              startedAt { year month day }
              completedAt { year month day }
              media {
                id
                type
                format
                isFavourite
                chapters
                volumes
                description(asHtml: false)
                countryOfOrigin
                genres
                coverImage { large medium }
                bannerImage
                tags { name }
                title { romaji english native }
              }
            }
          }
        }
      }
    `,
    { userId: viewerId },
    accessToken
  );

  return (data.manga?.lists || []).flatMap((list) => 
    (list.entries || []).map(entry => {
      const normalized = normalizeAniListEntry(entry);
      normalized.isFavourite = Boolean(normalized.rawMedia?.isFavourite) || favoriteIds.has(Number(normalized.providerMediaId));
      if (normalized.customLists.length === 0 && list?.isCustomList && typeof list?.name === 'string' && list.name.trim()) {
        normalized.customLists = [list.name.trim()];
      }
      normalized.rawMedia = {
        ...normalized.rawMedia,
        isFavourite: normalized.isFavourite,
      };
      return normalized;
    })
  );
}

export async function verifyAniListAccessToken(accessToken: string): Promise<ProviderIdentity & { favoriteCharacters?: any[] }> {
  const data = await fetchAniList<{ Viewer: { id: number; name?: string | null; favourites?: { characters?: { nodes?: Array<{ id: number; name: { full: string }; image: { large: string } }> } | null } | null } }>(
    `
      query {
        Viewer {
          id
          name
          favourites {
            characters {
              nodes {
                id
                name { full }
                image { large }
              }
            }
          }
        }
      }
    `,
    {},
    accessToken
  );

  const username = asString(data?.Viewer?.name);
  if (!username) {
    throw new Error('AniList token is valid, but the viewer identity could not be resolved.');
  }

  const id = String(data?.Viewer?.id);

  const favoriteCharacters = data?.Viewer?.favourites?.characters?.nodes?.map(node => ({
    id: String(node.id),
    name: node.name.full,
    image: node.image.large,
  })) || [];

  return { id, username, favoriteCharacters };
}

export async function searchAniListManga(title: string): Promise<any[]> {
  try {
    const json = await publicApiClient.post<{ data?: { Page?: { media?: any[] } } }>(
      '/anilist/graphql',
      {
        query: `
          query ($search: String) {
            Page(page: 1, perPage: 8) {
              media(search: $search, type: MANGA) {
                id
                format
                chapters
                volumes
                genres
                description(asHtml: false)
                countryOfOrigin
                bannerImage
                coverImage { large medium }
                title { romaji english native }
                tags { name }
              }
            }
          }
        `,
        variables: { search: title },
      }
    );
    return json?.data?.Page?.media || [];
  } catch (error) {
    if (error instanceof ApiError) {
      throw new Error(normalizeProviderRequestError('anilist', error.status, JSON.stringify(error.data || {})));
    }
    throw error;
  }
}

function normalizeMalEntry(item: any): ProviderMediaEntry {
  const node = item?.node || {};
  const titles = [
    asString(node?.title),
    asString(node?.alternative_titles?.en),
    asString(node?.alternative_titles?.ja),
    ...(Array.isArray(node?.alternative_titles?.synonyms)
      ? node.alternative_titles.synonyms.map((value: unknown) => asString(value))
      : []),
  ].filter((value): value is string => Boolean(value));

  return {
    provider: 'mal',
    providerMediaId: String(node?.id),
    seriesId: null,
    title: titles[0] || `Series ${node?.id}`,
    titles,
    status: mapMalStatus(item?.list_status?.status),
    score: Math.round((item?.list_status?.score || 0) * 10),
    progress: item?.list_status?.num_chapters_read || 0,
    progressVolumes: item?.list_status?.num_volumes_read || 0,
    repeat: item?.list_status?.num_times_reread || 0,
    priority: 0,
    isPrivate: false,
    isFavourite: false,
    notes: asString(item?.list_status?.comments),
    customLists: [],
    startedAt: toProviderDate(item?.list_status?.start_date),
    completedAt: toProviderDate(item?.list_status?.finish_date),
    updatedAt: toProviderDate(item?.list_status?.updated_at),
    rawMedia: {
      id: node?.id,
      title: node?.title,
      alternative_titles: node?.alternative_titles,
      num_chapters: node?.num_chapters,
      num_volumes: node?.num_volumes,
      genres: node?.genres,
      synopsis: node?.synopsis,
      main_picture: node?.main_picture,
    },
  };
}

export async function fetchMalMangaEntries(accessToken: string): Promise<ProviderMediaEntry[]> {
  let nextUrl = `${MAL_API_URL}/users/@me/mangalist?limit=1000&fields=list_status,alternative_titles,media_type,num_chapters,num_volumes,genres,synopsis,main_picture`;
  const entries: ProviderMediaEntry[] = [];

  while (nextUrl) {
    const response = await fetch(nextUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      const bodyText = await response.text().catch(() => '');
      throw new Error(normalizeProviderRequestError('mal', response.status, bodyText));
    }

    const json = await response.json();
    entries.push(...((json?.data || []).map(normalizeMalEntry)));
    nextUrl = json?.paging?.next || '';
  }

  return entries;
}

export async function verifyMalAccessToken(accessToken: string): Promise<ProviderIdentity> {
  const response = await fetch(`${MAL_API_URL}/users/@me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const bodyText = await response.text().catch(() => '');
    throw new Error(normalizeProviderRequestError('mal', response.status, bodyText));
  }

  const json = await response.json();
  const username = asString(json?.name);
  if (!username) {
    throw new Error('MAL token is valid, but the account name could not be resolved.');
  }

  const id = String(json?.id);

  return { id, username };
}

export async function fetchAniListAnimeEntries(accessToken: string): Promise<ProviderMediaEntry[]> {
  const viewerData = await fetchAniList<{ Viewer: { id?: number | null; favourites?: { anime?: { nodes?: Array<{ id: number }> } | null } | null } }>(
    `
      query {
        Viewer {
          id
          favourites {
            anime {
              nodes {
                id
              }
            }
          }
        }
      }
    `,
    {},
    accessToken
  );

  const viewerId = Number(viewerData?.Viewer?.id);
  if (!Number.isFinite(viewerId) || viewerId <= 0) {
    throw new Error('AniList token is valid, but the viewer ID could not be resolved.');
  }

  const favoriteIds = new Set(viewerData?.Viewer?.favourites?.anime?.nodes?.map(n => n.id) || []);

  const data = await fetchAniList<{
    anime: { lists: Array<{ name?: string | null; isCustomList?: boolean | null; entries: any[] }> | null };
  }>(
    `
      query ($userId: Int) {
        anime: MediaListCollection(userId: $userId, type: ANIME) {
          lists {
            name
            isCustomList
            entries {
              status
              score(format: POINT_100)
              progress
              repeat
              priority
              private
              notes
              customLists(asArray: true)
              updatedAt
              startedAt { year month day }
              completedAt { year month day }
              media {
                id
                type
                format
                isFavourite
                episodes
                description(asHtml: false)
                countryOfOrigin
                genres
                coverImage { large medium }
                bannerImage
                tags { name }
                title { romaji english native }
              }
            }
          }
        }
      }
    `,
    { userId: viewerId },
    accessToken
  );

  return (data.anime?.lists || []).flatMap((list) => 
    (list.entries || []).map(entry => {
      const normalized = normalizeAniListEntry(entry);
      normalized.isFavourite = Boolean(normalized.rawMedia?.isFavourite) || favoriteIds.has(Number(normalized.providerMediaId));
      if (normalized.customLists.length === 0 && list?.isCustomList && typeof list?.name === 'string' && list.name.trim()) {
        normalized.customLists = [list.name.trim()];
      }
      normalized.rawMedia = {
        ...normalized.rawMedia,
        isFavourite: normalized.isFavourite,
      };
      return normalized;
    })
  );
}

export async function fetchProviderEntries(provider: ProviderId, accessToken: string): Promise<ProviderMediaEntry[]> {
  if (provider === 'anilist') {
    const [manga, anime] = await Promise.all([
      fetchAniListMangaEntries(accessToken),
      fetchAniListAnimeEntries(accessToken),
    ]);
    return [...manga, ...anime];
  }
  
  return fetchMalMangaEntries(accessToken);
}

export async function verifyProviderAccessToken(provider: ProviderId, accessToken: string): Promise<ProviderIdentity> {
  return provider === 'anilist'
    ? verifyAniListAccessToken(accessToken)
    : verifyMalAccessToken(accessToken);
}

export async function pushAniListEntry(accessToken: string, providerMediaId: string, item: LibraryItem) {
  await fetchAniList(
    `
      mutation (
        $mediaId: Int,
        $status: MediaListStatus,
        $scoreRaw: Int,
        $progress: Int,
        $progressVolumes: Int,
        $repeat: Int,
        $notes: String,
        $customLists: [String],
        $startedAt: FuzzyDateInput,
        $completedAt: FuzzyDateInput
      ) {
        SaveMediaListEntry(
          mediaId: $mediaId,
          status: $status,
          scoreRaw: $scoreRaw,
          progress: $progress,
          progressVolumes: $progressVolumes,
          repeat: $repeat,
          notes: $notes,
          customLists: $customLists,
          startedAt: $startedAt,
          completedAt: $completedAt
        ) {
          id
          updatedAt
        }
      }
    `,
    {
      mediaId: Number(providerMediaId),
      status: item.status === 'READING' ? 'CURRENT' : item.status,
      scoreRaw: Math.round(item.score || 0),
      progress: Math.round(item.progress || 0),
      progressVolumes: 0,
      repeat: 0,
      notes: null,
      customLists: Array.isArray(item.customLists)
        ? item.customLists.filter((value): value is string => typeof value === 'string' && Boolean(value.trim()))
        : [],
      startedAt: undefined,
      completedAt: item.status === 'COMPLETED' ? fromIsoDate(new Date().toISOString()) : undefined,
    },
    accessToken
  );
}

export async function pushMalEntry(accessToken: string, providerMediaId: string, item: LibraryItem) {
  const body = new URLSearchParams();
  body.set('status', toMalStatus(item.status));
  body.set('score', String(Math.round((item.score || 0) / 10)));
  body.set('num_chapters_read', String(Math.round(item.progress || 0)));
  body.set('num_volumes_read', '0');

  const response = await fetch(`${MAL_API_URL}/manga/${providerMediaId}/my_list_status`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const bodyText = await response.text().catch(() => '');
    throw new Error(normalizeProviderRequestError('mal', response.status, bodyText));
  }
}

export async function pushProviderEntry(provider: ProviderId, accessToken: string, providerMediaId: string, item: LibraryItem) {
  if (provider === 'anilist') {
    await pushAniListEntry(accessToken, providerMediaId, item);
    return;
  }

  await pushMalEntry(accessToken, providerMediaId, item);
}
