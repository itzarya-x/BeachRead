import type { SearchResult } from '../hooks/useSearch';

export const FALLBACK_SEARCH_RESULTS: SearchResult[] = [
  {
    id: '30046',
    title: 'Vagabond',
    genres: ['Action', 'Adventure', 'Drama'],
    coverUrl: '/cover-fallback.svg',
    score: 87,
    popularity: 100000,
    mediaType: 'MANGA'
    },
  {
    id: '30002',
    title: 'Berserk',
    genres: ['Action', 'Drama', 'Fantasy'],
    coverUrl: '/cover-fallback.svg',
    score: 87,
    popularity: 100000,
    mediaType: 'MANGA'
    },
  {
    id: '30021',
    title: 'One Piece',
    genres: ['Action', 'Adventure', 'Comedy'],
    coverUrl: '/cover-fallback.svg',
    score: 87,
    popularity: 100000,
    mediaType: 'MANGA'
    },
];

