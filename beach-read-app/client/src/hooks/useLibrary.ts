import { useData } from '../context/DataContext';

export const useLibrary = () => {
  const { library, loading, error, addToLibrary, updateLibraryItem, removeFromLibrary, toggleFavourite, refreshLibrary } = useData();

  return {
    library,
    loading,
    error,
    addToLibrary,
    updateLibraryItem,
    removeFromLibrary,
    toggleFavourite,
    refreshLibrary,
  };
};

