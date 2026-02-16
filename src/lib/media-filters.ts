import type { DisplayMedia } from "@/types/display";
import type { FilterState } from "@/types/filters";

export function applyFilters(data: DisplayMedia[], filters: FilterState, type: "ANIME" | "MANGA") {
  return data.filter(item => {
    // Search
    if (filters.search) {
      const q = filters.search.toLowerCase();
      const titleMatches = 
        item.title.romaji.toLowerCase().includes(q) ||
        (item.title.english && item.title.english.toLowerCase().includes(q)) ||
        (item.title.native && item.title.native.toLowerCase().includes(q));
      if (!titleMatches) return false;
    }

    // Format
    if (filters.format.length > 0) {
      if (!item.format || !filters.format.includes(item.format)) return false;
    }

    // Status
    if (filters.status.length > 0) {
      if (!filters.status.includes(item.status)) return false;
    }

    // Genres (Include)
    if (filters.genres.length > 0) {
      if (!item.genres || !filters.genres.every(g => item.genres.includes(g))) return false;
    }

    // Genres (Exclude)
    if (filters.excludedGenres.length > 0) {
      if (item.genres && filters.excludedGenres.some(g => item.genres.includes(g))) return false;
    }

    // Tags
    if (filters.tags.length > 0) {
      if (!item.tags || !filters.tags.every(t => item.tags.includes(t))) return false;
    }

    // Year Range
    if (item.seasonYear) {
      if (item.seasonYear < filters.yearRange[0] || item.seasonYear > filters.yearRange[1]) return false;
    }

    // Season
    if (filters.season) {
      if (item.season !== filters.season) return false;
    }

    // Country
    if (filters.country.length > 0) {
      const itemCountry = (item as any).countryOfOrigin || (item as any).country;
      if (!itemCountry || !filters.country.includes(itemCountry)) return false;
    }

    // Source
    if (filters.source.length > 0) {
      const itemSource = (item as any).source;
      if (!itemSource || !filters.source.includes(itemSource)) return false;
    }

    // Adult Content
    if (!filters.isAdult && (item as any).isAdult) {
      return false;
    }

    // Score Range
    const score = (item as any).averageScore || item.score || 0;
    if (score < filters.scoreRange[0] || score > filters.scoreRange[1]) return false;

    // Episodes/Chapters Range
    if (type === "ANIME") {
      const episodes = item.episodes || 0;
      if (episodes < filters.episodesRange[0] || episodes > filters.episodesRange[1]) return false;
    } else {
      const chapters = item.chapters || 0;
      if (chapters < filters.chaptersRange[0] || chapters > filters.chaptersRange[1]) return false;
    }

    return true;
  }).sort((a, b) => {
    switch (filters.sort) {
      case "score": {
        const scoreA = (a as any).averageScore || a.score || 0;
        const scoreB = (b as any).averageScore || b.score || 0;
        return scoreB - scoreA;
      }
      case "popularity":
        return ((b as any).popularity || 0) - ((a as any).popularity || 0);
      case "title":
        return a.title.romaji.localeCompare(b.title.romaji);
      case "updatedAt":
      default:
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
  });
}
