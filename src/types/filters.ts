export type FilterState = {
  search: string;
  format: string[];
  status: string[];
  genres: string[];
  excludedGenres: string[];
  tags: string[];
  yearRange: [number, number];
  season: string | null;
  country: string[];
  source: string[];
  scoreRange: [number, number];
  episodesRange: [number, number];
  chaptersRange: [number, number];
  sort: string;
  isAdult: boolean;
};

export const DEFAULT_FILTERS: FilterState = {
  search: "",
  format: [],
  status: [],
  genres: [],
  excludedGenres: [],
  tags: [],
  yearRange: [1970, new Date().getFullYear() + 1],
  season: null,
  country: [],
  source: [],
  scoreRange: [0, 100],
  episodesRange: [0, 150],
  chaptersRange: [0, 500],
  sort: "updatedAt",
  isAdult: false,
};
