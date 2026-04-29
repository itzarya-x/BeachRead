import { useQuery } from '@tanstack/react-query';
import { publicApiClient } from '../../../shared/api/apiClient';

export const CHARACTER_DETAIL_QUERY_KEY = 'character-detail';

export function useCharacterDetailQuery(id?: string) {
    return useQuery({
        queryKey: [CHARACTER_DETAIL_QUERY_KEY, id],
        queryFn: async () => {
            if (!id) throw new Error('ID is required');
            return publicApiClient.get<any>(`/character/${id}`);
        },
        enabled: !!id,
        staleTime: 1000 * 60 * 15, // 15 minutes
    });
}
