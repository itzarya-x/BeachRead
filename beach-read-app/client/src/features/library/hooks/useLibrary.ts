import { useLibraryQuery, useLibraryMutations, LIBRARY_QUERY_KEY } from './useLibraryQuery';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../auth/context/auth-context';

export function useLibrary() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: library = [], isLoading: loading, error } = useLibraryQuery();
  const mutations = useLibraryMutations();

  const refreshLibrary = async () => {
    await queryClient.invalidateQueries({ queryKey: [LIBRARY_QUERY_KEY, user?.id] });
  };

  return {
    library,
    loading,
    error: error ? error.message : null,
    addToLibrary: mutations.addToLibrary,
    updateLibraryItem: mutations.updateLibraryItem,
    removeFromLibrary: mutations.removeFromLibrary,
    toggleFavourite: mutations.toggleFavourite,
    refreshLibrary
  };
}
