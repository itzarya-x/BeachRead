import { DEFAULT_FILTERS, type FilterState } from "@/types/filters";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

export function useMediaFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<FilterState>(() => {
    const params = Object.fromEntries(searchParams.entries());
    return {
      ...DEFAULT_FILTERS,
      search: params.search || DEFAULT_FILTERS.search,
      format: params.format ? params.format.split(",") : DEFAULT_FILTERS.format,
      status: params.status ? params.status.split(",") : DEFAULT_FILTERS.status,
      genres: params.genres ? params.genres.split(",") : DEFAULT_FILTERS.genres,
      excludedGenres: params.excludedGenres ? params.excludedGenres.split(",") : DEFAULT_FILTERS.excludedGenres,
      tags: params.tags ? params.tags.split(",") : DEFAULT_FILTERS.tags,
      yearRange: params.yearRange 
        ? (params.yearRange.split(",").map(Number) as [number, number]) 
        : DEFAULT_FILTERS.yearRange,
      season: params.season || DEFAULT_FILTERS.season,
      country: params.country ? params.country.split(",") : DEFAULT_FILTERS.country,
      source: params.source ? params.source.split(",") : DEFAULT_FILTERS.source,
      scoreRange: params.scoreRange 
        ? (params.scoreRange.split(",").map(Number) as [number, number]) 
        : DEFAULT_FILTERS.scoreRange,
      episodesRange: params.episodesRange 
        ? (params.episodesRange.split(",").map(Number) as [number, number]) 
        : DEFAULT_FILTERS.episodesRange,
      chaptersRange: params.chaptersRange 
        ? (params.chaptersRange.split(",").map(Number) as [number, number]) 
        : DEFAULT_FILTERS.chaptersRange,
      sort: params.sort || DEFAULT_FILTERS.sort,
      isAdult: params.isAdult === "true",
    };
  });

  const updateFilters = useCallback((updater: Partial<FilterState> | ((prev: FilterState) => FilterState)) => {
    setFilters(prev => {
      const next = typeof updater === "function" ? updater(prev) : { ...prev, ...updater };
      
      const params: Record<string, string> = {};
      if (next.search) params.search = next.search;
      if (next.format.length > 0) params.format = next.format.join(",");
      if (next.status.length > 0) params.status = next.status.join(",");
      if (next.genres.length > 0) params.genres = next.genres.join(",");
      if (next.excludedGenres.length > 0) params.excludedGenres = next.excludedGenres.join(",");
      if (next.tags.length > 0) params.tags = next.tags.join(",");
      if (next.yearRange[0] !== DEFAULT_FILTERS.yearRange[0] || next.yearRange[1] !== DEFAULT_FILTERS.yearRange[1]) {
        params.yearRange = next.yearRange.join(",");
      }
      if (next.season) params.season = next.season;
      if (next.country.length > 0) params.country = next.country.join(",");
      if (next.source.length > 0) params.source = next.source.join(",");
      if (next.scoreRange[0] !== DEFAULT_FILTERS.scoreRange[0] || next.scoreRange[1] !== DEFAULT_FILTERS.scoreRange[1]) {
        params.scoreRange = next.scoreRange.join(",");
      }
      if (next.episodesRange[0] !== DEFAULT_FILTERS.episodesRange[0] || next.episodesRange[1] !== DEFAULT_FILTERS.episodesRange[1]) {
        params.episodesRange = next.episodesRange.join(",");
      }
      if (next.chaptersRange[0] !== DEFAULT_FILTERS.chaptersRange[0] || next.chaptersRange[1] !== DEFAULT_FILTERS.chaptersRange[1]) {
        params.chaptersRange = next.chaptersRange.join(",");
      }
      if (next.sort !== DEFAULT_FILTERS.sort) params.sort = next.sort;
      if (next.isAdult) params.isAdult = "true";

      setSearchParams(params, { replace: true });
      return next;
    });
  }, [setSearchParams]);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  return { filters, updateFilters, resetFilters };
}
