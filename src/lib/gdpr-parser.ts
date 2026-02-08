import type { GdprData, GdprListEntry, GdprFavourite } from "@/types/gdpr";
import type {
  DisplayMedia,
  DisplayUser,
  MediaStatus,
  MediaType,
  OriginType,
} from "@/types/display";
import {
  STATUS_MAP,
  MEDIA_TYPE_MAP,
  SCORE_FORMAT_MAP,
  TITLE_LANGUAGE_MAP,
  formatDate,
  getAvatarUrl,
} from "@/lib/constants";

/**
 * Map country of origin to origin type
 * TASK 1: Auto-classify manga/manhua/manhwa
 */
export function mapCountryToOriginType(countryOfOrigin: string | null | undefined): OriginType {
  if (!countryOfOrigin) return "manga"; // Default fallback
  
  const country = countryOfOrigin.toUpperCase();
  if (country === "JP" || country === "JPN") return "manga";
  if (country === "CN" || country === "CHN") return "manhua";
  if (country === "KR" || country === "KOR") return "manhwa";
  
  // Fallback to manga for all other countries
  return "manga";
}

export function parseGdprData(raw: GdprData): {
  user: DisplayUser;
  animeEntries: DisplayMedia[];
  mangaEntries: DisplayMedia[];
} {
  const { user, lists, favourites = [] } = raw;

  // Parse statistics JSON string
  let stats = { anime: defaultStats(), manga: defaultStats() };
  try {
    const parsed = JSON.parse(user.statistics);
    stats = {
      anime: { ...defaultStats(), ...parsed.anime },
      manga: { ...defaultStats(), ...parsed.manga },
    };
  } catch {
    // Keep defaults
  }

  const displayUser: DisplayUser = {
    id: user.id,
    displayName: user.display_name,
    userName: user.user_name,
    email: user.email,
    about: user.about || "",
    avatarUrl: getAvatarUrl(user.avatar_url),
    bannerUrl: user.banner_url
      ? `https://s4.anilist.co/file/anilistcdn/user/banner/${user.banner_url}`
      : null,
    profileColor: user.profile_color || "blue",
    scoreFormat: SCORE_FORMAT_MAP[user.score_type] || "POINT_10",
    titleLanguage: TITLE_LANGUAGE_MAP[user.title_language] || "ROMAJI",
    customListNames: {
      anime: user.custom_lists?.anime || [],
      manga: user.custom_lists?.manga || [],
    },
    statistics: stats,
    activityHistory: user.stats?.activity_history || {},
    activityHistoryTotal: user.stats?.activity_history_total || 0,
    createdAt: user.created_at,
    updatedAt: user.updated_at,

    // Account settings
    listOrder: user.list_order,
    forumHomepage: user.forum_homepage,
    adultContent: user.adult_content === 1,
    legacyLists: user.legacy_lists === 1,
    donator: user.donator,
    donatorBadge: user.donator_badge,
    notifications: user.notifications,
    airingNotifications: user.airing_notifications === 1,
    privacy: user.privacy === 1,
    notificationOptions: user.notification_options || "",
    modRoles: user.mod_roles,
    ip: user.ip || "",

    // Counters
    animeWatched: user.anime_watched,
    chaptersRead: user.chapters_read,

    // Advanced scoring config
    advancedScoresActive: user.advanced_scores?.active || false,
    advancedScoresNames: user.advanced_scores?.names || [],

    // Hidden categories
    hiddenCategories: user.hidden_categories,

    // Raw distributions
    statusDistribution: user.stats?.status_distribution || { anime: [], manga: [] },
    scoreDistribution: user.stats?.score_distribution || { anime: [], manga: [] },

    // Favourites - parse from favourites array
    favourites: {
      anime: favourites.filter((f: GdprFavourite) => f.favourite_type === 1).map((f: GdprFavourite) => f.favourite_id),
      manga: favourites.filter((f: GdprFavourite) => f.favourite_type === 2).map((f: GdprFavourite) => f.favourite_id),
      characters: favourites.filter((f: GdprFavourite) => f.favourite_type === 3).map((f: GdprFavourite) => f.favourite_id),
      staff: favourites.filter((f: GdprFavourite) => f.favourite_type === 4).map((f: GdprFavourite) => f.favourite_id),
      studios: favourites.filter((f: GdprFavourite) => f.favourite_type === 5).map((f: GdprFavourite) => f.favourite_id),
    },
  };

  const animeEntries: DisplayMedia[] = [];
  const mangaEntries: DisplayMedia[] = [];

  for (const entry of lists) {
    const mediaType: MediaType = MEDIA_TYPE_MAP[entry.series_type] || "ANIME";
    const customListNames =
      mediaType === "ANIME"
        ? user.custom_lists?.anime || []
        : user.custom_lists?.manga || [];

    const display = parseListEntry(entry, mediaType, customListNames);

    if (mediaType === "ANIME") {
      animeEntries.push(display);
    } else {
      mangaEntries.push(display);
    }
  }

  return { user: displayUser, animeEntries, mangaEntries };
}

function parseListEntry(
  entry: GdprListEntry,
  mediaType: MediaType,
  customListNames: string[]
): DisplayMedia {
  // Parse custom_lists boolean array
  let assignedLists: string[] = [];
  try {
    const boolArr: number[] = JSON.parse(entry.custom_lists || "[]");
    assignedLists = boolArr
      .map((val, idx) => (val ? customListNames[idx] : null))
      .filter((name): name is string => name !== null && name !== undefined);
  } catch {
    // Ignore parse errors
  }

  // Parse advanced_scores
  let advancedScores: number[] = [];
  try {
    const parsed = JSON.parse(entry.advanced_scores || "[]");
    if (Array.isArray(parsed)) advancedScores = parsed;
  } catch {
    // Ignore
  }

  const status: MediaStatus = STATUS_MAP[entry.status] || "CURRENT";

  return {
    status,
    score: entry.score,
    progress: entry.progress,
    progressVolumes: entry.progress_volume,
    repeat: entry.repeat,
    priority: entry.priority,
    tierId: null, // TASK 14: Migration - will be set by user
    isPrivate: entry.private === 1,
    notes: entry.notes,
    customLists: assignedLists,
    startedAt: formatDate(entry.started_on),
    completedAt: formatDate(entry.finished_on),
    createdAt: entry.created_at,
    updatedAt: entry.updated_at,
    mediaType,
    advancedScores,
    hiddenDefault: entry.hidden_default === 1,

    // Placeholder until API enrichment
    title: { romaji: "Loading…", english: null, native: null },
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
    originType: "manga", // Default, will be updated from API

    _seriesId: entry.series_id,
    _entryId: entry.id,
    _userId: entry.user_id,
    _enriched: false,
  };
}

function defaultStats() {
  return {
    count: 0,
    minutesWatched: 0,
    progress: 0,
    progressVolumes: 0,
    meanScore: 0,
    standardDeviation: 0,
  };
}
