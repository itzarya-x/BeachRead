import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '../../../shared/api/apiClient';
import { FALLBACK_SEARCH_RESULTS } from '../api/fallback-search';
import { sanitizeCoverUrl } from '../../../shared/utils/image';
import type { MediaType } from '../../../shared/types/types';

export interface SearchResult {
    id: string;
    title: string;
    genres: string[];
    coverUrl: string;
    score: number;
    popularity: number;
    mediaType: MediaType;
}

export interface PageInfo {
    total: number;
    perPage: number;
    currentPage: number;
    lastPage: number;
    hasNextPage: boolean;
}

export interface SearchResponse {
    results: SearchResult[];
    pageInfo: PageInfo;
}

export interface SearchFilters {
    genre?: string[];
    status?: string;
    format?: string;
    year?: string;
    sort?: string;
    type?: MediaType;
}

export const useSearch = (initialQuery = '') => {
    const [query, setQuery] = useState(initialQuery);
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pageInfo, setPageInfo] = useState<PageInfo | null>(null);

    const search = useCallback(async (searchQuery: string, page = 1, filters: SearchFilters = {}) => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (searchQuery.trim()) params.append('query', searchQuery.trim());
            if (filters.genre && filters.genre.length > 0) params.append('genre', filters.genre.join(','));
            if (filters.status) params.append('status', filters.status);
            if (filters.format) params.append('format', filters.format);
            if (filters.year) params.append('year', filters.year);
            if (filters.sort) params.append('sort', filters.sort);
            if (filters.type) params.append('type', filters.type);
            params.append('page', page.toString());

            const data = await apiClient.get<SearchResponse>(`/search?${params.toString()}`);
            setResults((data.results || []).map((item) => ({ 
                ...item, 
                mediaType: item.mediaType || (item as any).type,
                coverUrl: sanitizeCoverUrl(item.coverUrl) 
            })));
            setPageInfo(data.pageInfo);
        } catch (err: any) {
            if (err?.status === 502 || err?.status === 0) {
                setResults(FALLBACK_SEARCH_RESULTS);
                setPageInfo({
                    total: FALLBACK_SEARCH_RESULTS.length,
                    perPage: FALLBACK_SEARCH_RESULTS.length,
                    currentPage: 1,
                    lastPage: 1,
                    hasNextPage: false,
                });
                setError('Search backend unavailable. Showing fallback results.');
            } else {
                setError(err.message || 'Failed to search');
                setResults([]);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (initialQuery) {
            search(initialQuery);
        }
    }, [initialQuery, search]);

    return {
        query,
        setQuery,
        results,
        loading,
        error,
        pageInfo,
        search
    };
};
