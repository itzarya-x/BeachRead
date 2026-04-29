import { useQuery, useQueryClient } from '@tanstack/react-query';
import { publicApiClient } from '../../../shared/api/apiClient';

export const MEDIA_DETAIL_QUERY_KEY = 'media-detail';

export function useMediaDetailQuery(id?: string) {
    return useQuery({
        queryKey: [MEDIA_DETAIL_QUERY_KEY, id],
        queryFn: async () => {
            if (!id) throw new Error('ID is required');
            return publicApiClient.get<any>(`/media/${id}`);
        },
        enabled: !!id,
        staleTime: 1000 * 60 * 15, // 15 minutes
    });
}

export function useMediaPrefetch() {
    const queryClient = useQueryClient();

    const prefetchMedia = (id: string) => {
        queryClient.prefetchQuery({
            queryKey: [MEDIA_DETAIL_QUERY_KEY, id],
            queryFn: () => publicApiClient.get<any>(`/media/${id}`),
            staleTime: 1000 * 60 * 15,
        });
    };

    return { prefetchMedia };
}
