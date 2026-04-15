import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { ApiError, apiClient } from '../lib/apiClient';
import type { Collection } from '../lib/types';

interface CollectionResponseRow {
    id: string;
    name: string;
    description: string | null;
    visibility: 'PRIVATE' | 'UNLISTED' | 'PUBLIC';
    created_at: string;
    updated_at: string;
    items: Array<{
        id: string;
        title_id: string;
        sort_order: number;
        created_at: string;
    }>;
}

let collectionsEndpointUnavailable = false;
let collectionsFetchInFlight = false;

async function getAccessToken() {
    if (!supabase) return null;
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
}

export const useCollections = () => {
    const [collections, setCollections] = useState<Collection[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCollections = useCallback(async () => {
        if (!supabase) return;
        if (collectionsEndpointUnavailable) {
            setCollections([]);
            setLoading(false);
            setError(null);
            return;
        }
        if (collectionsFetchInFlight) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        collectionsFetchInFlight = true;

        try {
            const token = await getAccessToken();
            if (!token) {
                setCollections([]);
                return;
            }

            const data = await apiClient.get<CollectionResponseRow[]>('/v1/collections', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const mapped: Collection[] = (data || []).map(row => ({
                id: row.id,
                name: row.name,
                description: row.description || '',
                isPrivate: row.visibility === 'PRIVATE',
                createdAt: row.created_at,
                updatedAt: row.updated_at,
                items: (row.items || []).map((item: any) => ({
                    id: item.id,
                    collectionId: row.id,
                    titleId: item.title_id,
                    sortOrder: item.sort_order,
                    addedAt: item.created_at,
                })).sort((a: any, b: any) => a.sortOrder - b.sortOrder)
            }));

            setCollections(mapped);
        } catch (err: unknown) {
            if (err instanceof ApiError && err.status === 404) {
                collectionsEndpointUnavailable = true;
                setCollections([]);
                setError(null);
                return;
            }

            console.error('Error fetching collections:', err);
            setError(err instanceof Error ? err.message : 'Failed to load collections');
        } finally {
            collectionsFetchInFlight = false;
            setLoading(false);
        }
    }, []);

    const createCollection = async (name: string, description: string, isPrivate: boolean = false) => {
        if (!supabase) return;
        try {
            const token = await getAccessToken();
            if (!token) throw new Error('Not authenticated');

            const data = await apiClient.post<CollectionResponseRow>('/v1/collections', {
                name,
                description,
                visibility: isPrivate ? 'PRIVATE' : 'PUBLIC'
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            const newColl: Collection = {
                id: data.id,
                name: data.name,
                description: data.description || '',
                isPrivate: data.visibility === 'PRIVATE',
                createdAt: data.created_at,
                updatedAt: data.updated_at,
                items: []
            };

            setCollections(prev => [newColl, ...prev]);
            return newColl;
        } catch (err: unknown) {
            console.error('Error creating collection:', err);
            throw err;
        }
    };

    const addTitleToCollection = async (collectionId: string, externalId: string) => {
        if (!supabase) return;
        try {
            const token = await getAccessToken();
            if (!token) throw new Error('Not authenticated');

            const { data: mapping } = await supabase
                .from('title_provider_mappings')
                .select('title_id')
                .eq('provider_title_id', externalId)
                .limit(1)
                .maybeSingle();
            
            if (!mapping?.title_id) throw new Error('Title metadata not found. Add to library first.');

            const collection = collections.find(c => c.id === collectionId);
            const nextOrder = (collection?.items?.length || 0);

            await apiClient.post(`/v1/collections/${collectionId}/items`, {
                titleId: mapping.title_id,
                sortOrder: nextOrder
            }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            await fetchCollections();
        } catch (err) {
            console.error('Error adding to collection:', err);
            throw err;
        }
    };

    const removeTitleFromCollection = async (collectionId: string, titleId: string) => {
        if (!supabase) return;
        try {
            const token = await getAccessToken();
            if (!token) throw new Error('Not authenticated');

            await apiClient.delete(`/v1/collections/${collectionId}/items/${titleId}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            await fetchCollections();
        } catch (err) {
            console.error('Error removing from collection:', err);
            throw err;
        }
    };

    const deleteCollection = async (id: string) => {
        if (!supabase) return;
        try {
            const token = await getAccessToken();
            if (!token) throw new Error('Not authenticated');

            await apiClient.delete(`/v1/collections/${id}`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            setCollections(prev => prev.filter(c => c.id !== id));
        } catch (err: unknown) {
            console.error('Error deleting collection:', err);
            throw err;
        }
    };

    useEffect(() => {
        fetchCollections();
    }, [fetchCollections]);

    return {
        collections,
        loading,
        error,
        createCollection,
        deleteCollection,
        addTitleToCollection,
        removeTitleFromCollection,
        refreshCollections: fetchCollections
    };
};
