import { useLibraryQuery, useLibraryStats, LIBRARY_QUERY_KEY } from './useLibraryQuery';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth/context/auth-context';
import type { UserStats } from '../../../shared/types/types';

export function useStats(): { stats: UserStats, loading: boolean, refreshStats: () => Promise<void> } {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { isLoading } = useLibraryQuery();
  const stats = useLibraryStats();

  const refreshStats = async () => {
    await queryClient.invalidateQueries({ queryKey: [LIBRARY_QUERY_KEY, user?.id] });
  };

  return {
    stats,
    loading: isLoading,
    refreshStats
  };
}
