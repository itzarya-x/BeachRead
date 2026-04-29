import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { fetchLibraryItems, addLibraryEntry, updateLibraryEntry, removeLibraryEntry, readGuestLibrary, writeGuestLibrary } from '../../../services/api/libraryApi';
import { useAuth } from '../../auth/context/auth-context';
import { useToast } from '../../../app/providers/ToastContext';
import { normalizeLibraryItem, deriveStatus, parseSeriesId } from '../utils/libraryTransformers';
import { computeStats } from '../utils/statsCalculator';
import type { AuthContextUser, LibraryItem, UserStats } from '../../../shared/types/types';
import { isSupabaseConfigured, supabase, supabaseRealtime } from '../../../shared/api/supabaseClient';
import { syncPublicProfileSnapshot } from '../../profile/api/publicProfile';

export const LIBRARY_QUERY_KEY = 'library';

const lastSnapshotSyncKeyByUser = new Map<string, string>();
const inFlightSnapshotSyncs = new Map<string, Promise<void>>();

function createSnapshotSyncKey(user: AuthContextUser, library: LibraryItem[]) {
    return JSON.stringify({
        userId: user?.id,
        profile: {
            displayName: user?.displayName,
            username: user?.username,
            avatarUrl: user?.avatarUrl,
            bannerUrl: user?.bannerUrl,
            bio: user?.bio,
            location: user?.location,
            website: user?.website,
            twitterHandle: user?.twitterHandle,
            isPrivate: user?.isPrivate,
            showStats: user?.showStats,
            customColors: user?.customColors,
            favoriteCharacters: user?.favoriteCharacters,
            favoriteMangaOrder: user?.favoriteMangaOrder,
            pinnedMangaIds: user?.pinnedMangaIds,
            profileSections: user?.profileSections,
            profilePrivacy: user?.profilePrivacy,
            featuredCollections: user?.featuredCollections,
            snapshotCards: user?.snapshotCards,
            nowReadingId: user?.nowReadingId,
        },
        library: library.map((item) => ({
            id: item.id,
            status: item.status,
            progress: item.progress,
            score: item.score,
            isFavourite: item.isFavourite,
            updatedAt: item.updatedAt,
            comments: item.comments,
        })),
    });
}

async function syncSnapshotIfNeeded(user: AuthContextUser | null, library: LibraryItem[]) {
    if (!user || !isSupabaseConfigured()) return;

    const syncKey = createSnapshotSyncKey(user, library);
    if (lastSnapshotSyncKeyByUser.get(user.id) === syncKey) return;

    const inFlightKey = `${user.id}:${syncKey}`;
    const existingInFlight = inFlightSnapshotSyncs.get(inFlightKey);
    if (existingInFlight) {
        await existingInFlight;
        return;
    }

    const request = (async () => {
        await syncPublicProfileSnapshot({
            user,
            stats: computeStats(library),
            library,
        });
        lastSnapshotSyncKeyByUser.set(user.id, syncKey);
    })();

    inFlightSnapshotSyncs.set(inFlightKey, request);

    try {
        await request;
    } catch (error) {
        console.error('Failed to sync public profile snapshot:', error);
    } finally {
        inFlightSnapshotSyncs.delete(inFlightKey);
    }
}

export function useLibraryRealtime(userId?: string) {
    const queryClient = useQueryClient();

    useEffect(() => {
        if (!userId || !isSupabaseConfigured()) return;

        const realtimeClient = supabaseRealtime || supabase;

        const channel = realtimeClient!
            .channel(`library_entries:${userId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'library_entries',
                    filter: `user_id=eq.${userId}`,
                },
                () => {
                    queryClient.invalidateQueries({ queryKey: [LIBRARY_QUERY_KEY, userId] });
                }
            )
            .subscribe();

        return () => {
            realtimeClient!.removeChannel(channel);
        };
    }, [userId, queryClient]);
}

export function useLibraryQuery() {
    const { user } = useAuth();
    useLibraryRealtime(user?.id);

    const query = useQuery({
        queryKey: [LIBRARY_QUERY_KEY, user?.id],
        queryFn: () => fetchLibraryItems(user?.id),
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    // Auto-sync public profile when library data changes for the owner
    useEffect(() => {
        if (user && query.data && !query.isFetching) {
            void syncSnapshotIfNeeded(user, query.data);
        }
    }, [user, query.data, query.isFetching]);

    return query;
}

export function useLibraryStats(): UserStats {
    const { data: library = [] } = useLibraryQuery();
    return computeStats(library);
}

async function resolveLibraryEntryDbId(userId: string, id: string): Promise<string | null> {
    if (!isSupabaseConfigured()) return null;
    const seriesId = String(parseSeriesId(id));

    const { data: mapping, error: mappingError } = await supabase!
        .from('title_provider_mappings')
        .select('title_id')
        .eq('provider', 'ANILIST')
        .eq('provider_title_id', seriesId)
        .maybeSingle();

    if (mappingError) throw mappingError;
    if (!mapping?.title_id) return null;

    const { data: entry, error: entryError } = await supabase!
        .from('library_entries')
        .select('id')
        .eq('user_id', userId)
        .eq('title_id', mapping.title_id)
        .maybeSingle();

    if (entryError) throw entryError;
    return entry?.id ? String(entry.id) : null;
}

export function useLibraryMutations() {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const { showToast } = useToast();

    const queryKey = [LIBRARY_QUERY_KEY, user?.id];

    const addToLibrary = useMutation({
        mutationFn: async (item: Partial<LibraryItem> & { id: string; title: string }) => {
            const seriesId = parseSeriesId(item.id);
            const optimistic: LibraryItem = normalizeLibraryItem({
                ...item,
                id: item.id,
                seriesId,
                updatedAt: item.updatedAt || new Date().toISOString(),
            });

            if (!user || !isSupabaseConfigured()) {
                const previous = readGuestLibrary();
                const next = [optimistic, ...previous.filter((x) => x.id !== optimistic.id)];
                writeGuestLibrary(next);
                return { optimistic, isGuest: true, library: next };
            }

            await addLibraryEntry(user.id, optimistic);
            return { optimistic, isGuest: false };
        },
        onMutate: async (item) => {
            await queryClient.cancelQueries({ queryKey });
            const previousLibrary = queryClient.getQueryData<LibraryItem[]>(queryKey) || [];

            const seriesId = parseSeriesId(item.id);
            const optimistic: LibraryItem = normalizeLibraryItem({
                ...item,
                id: item.id,
                seriesId,
                updatedAt: item.updatedAt || new Date().toISOString(),
            });

            queryClient.setQueryData<LibraryItem[]>(queryKey, (old = []) => [
                optimistic,
                ...old.filter((x) => x.id !== optimistic.id),
            ]);

            showToast(`Adding "${optimistic.title}" to Archive`, 'loading', 1000);

            return { previousLibrary };
        },
        onSuccess: (data) => {
            showToast(`Added "${data.optimistic.title}" to Library`, 'success');
            if (data.isGuest) {
                queryClient.setQueryData(queryKey, data.library);
            } else {
                const library = queryClient.getQueryData<LibraryItem[]>(queryKey) || [];
                void syncSnapshotIfNeeded(user, library);
            }
        },
        onError: (err, _newItem, context) => {
            if (context?.previousLibrary) {
                queryClient.setQueryData(queryKey, context.previousLibrary);
            }
            showToast(err.message || 'Failed to add library item', 'error');
        },
        onSettled: () => {
            if (user && isSupabaseConfigured()) {
                queryClient.invalidateQueries({ queryKey });
            }
        },
    });

    const updateLibraryItem = useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<LibraryItem> }) => {
            const previous = queryClient.getQueryData<LibraryItem[]>(queryKey) || [];
            const target =
                previous.find((x) => x.id === id)
                || previous.find((x) => String(parseSeriesId(x.id)) === String(parseSeriesId(id)));

            if (!target) throw new Error("Item not found");

            const merged = { ...target, ...updates };
            const totalUnits = merged.mediaType === 'ANIME' ? merged.episodes : merged.chapters;
            const derivedStatus = deriveStatus(merged.status, merged.progress, totalUnits);

            const updatePayload = {
                ...merged,
                status: derivedStatus,
                updatedAt: new Date().toISOString(),
            };

            if (!user || !isSupabaseConfigured()) {
                const next = previous.map(item => item.id === id ? updatePayload : item);
                writeGuestLibrary(next);
                return { isGuest: true, library: next };
            }

            const dbId = await resolveLibraryEntryDbId(user.id, id);
            if (!dbId) {
                // If not in library_entries yet, we need to use addLibraryEntry which handles modernization
                await addLibraryEntry(user.id, updatePayload);
                return { isGuest: false, library: previous.map(item => item.id === id ? updatePayload : item) };
            }

            await updateLibraryEntry(user.id, dbId, updatePayload);
            return { isGuest: false, library: previous.map(item => item.id === id ? updatePayload : item) };
        },
        onMutate: async ({ id, updates }) => {
            await queryClient.cancelQueries({ queryKey });
            const previousLibrary = queryClient.getQueryData<LibraryItem[]>(queryKey) || [];

            queryClient.setQueryData<LibraryItem[]>(queryKey, (old = []) =>
                old.map((item) => {
                    if (item.id !== id) return item;
                    const merged = { ...item, ...updates };
                    const totalUnits = merged.mediaType === 'ANIME' ? merged.episodes : merged.chapters;
                    const nextStatus = deriveStatus(merged.status, merged.progress, totalUnits);
                    return {
                        ...merged,
                        status: nextStatus,
                        completedAt: nextStatus === 'COMPLETED' ? (merged.completedAt || new Date().toISOString()) : null,
                        updatedAt: new Date().toISOString(),
                    };
                })
            );

            return { previousLibrary };
        },
        onSuccess: (data) => {
            if (data.isGuest) {
                queryClient.setQueryData(queryKey, data.library);
            } else {
                void syncSnapshotIfNeeded(user, data.library);
            }
        },
        onError: (err, _variables, context) => {
            if (context?.previousLibrary) {
                queryClient.setQueryData(queryKey, context.previousLibrary);
            }
            showToast(err.message || 'Failed to update library', 'error');
        },
        onSettled: () => {
            if (user && isSupabaseConfigured()) {
                queryClient.invalidateQueries({ queryKey });
            }
        },
    });

    const removeFromLibrary = useMutation({
        mutationFn: async (id: string) => {
            const previous = queryClient.getQueryData<LibraryItem[]>(queryKey) || [];
            const target =
                previous.find((x) => x.id === id)
                || previous.find((x) => String(parseSeriesId(x.id)) === String(parseSeriesId(id)));

            if (!user || !isSupabaseConfigured()) {
                if (!target) throw new Error("Item not found");
                const next = previous.filter(x => x.id !== id);
                writeGuestLibrary(next);
                return { isGuest: true, title: target.title, library: next };
            }

            const dbId = target?.dbId || await resolveLibraryEntryDbId(user.id, id);
            if (!dbId) throw new Error("Item not found");

            await removeLibraryEntry(user.id, dbId);
            return { isGuest: false, title: target?.title || 'Item', library: previous.filter(x => x.id !== id) };
        },
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey });
            const previousLibrary = queryClient.getQueryData<LibraryItem[]>(queryKey) || [];

            queryClient.setQueryData<LibraryItem[]>(queryKey, (old = []) =>
                old.filter((item) => item.id !== id)
            );

            return { previousLibrary };
        },
        onSuccess: (data) => {
            showToast(`Removed "${data.title}" from Library`, 'info');
            if (data.isGuest) {
                queryClient.setQueryData(queryKey, data.library);
            } else {
                void syncSnapshotIfNeeded(user, data.library);
            }
        },
        onError: (err, _id, context) => {
            if (context?.previousLibrary) {
                queryClient.setQueryData(queryKey, context.previousLibrary);
            }
            showToast(err.message || 'Failed to remove item', 'error');
        },
        onSettled: () => {
            if (user && isSupabaseConfigured()) {
                queryClient.invalidateQueries({ queryKey });
            }
        },
    });

    const toggleFavourite = useMutation({
        mutationFn: async (id: string) => {
            const previous = queryClient.getQueryData<LibraryItem[]>(queryKey) || [];
            const item =
                previous.find((x) => x.id === id)
                || previous.find((x) => String(parseSeriesId(x.id)) === String(parseSeriesId(id)));
            if (!item) {
                if (!user || !isSupabaseConfigured()) throw new Error("Item not found");
                // Force a refetch so we can resolve + toggle reliably.
                await queryClient.invalidateQueries({ queryKey });
                throw new Error("Please retry");
            }
            await updateLibraryItem.mutateAsync({ id, updates: { isFavourite: !item.isFavourite } });
        }
    });

    return {
        addToLibrary: (item: Partial<LibraryItem> & { id: string; title: string }) => addToLibrary.mutateAsync(item),
        updateLibraryItem: (id: string, updates: Partial<LibraryItem>) => updateLibraryItem.mutateAsync({ id, updates }),
        removeFromLibrary: (id: string) => removeFromLibrary.mutateAsync(id),
        toggleFavourite: (id: string) => toggleFavourite.mutateAsync(id),
    };
}
