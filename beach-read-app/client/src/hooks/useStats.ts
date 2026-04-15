import { useCallback, useEffect, useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/auth-context';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import type { UserStats, RecommendedAction } from '../lib/types';

export const useStats = () => {
  const { user } = useAuth();
  const { library, stats: fallbackStats, loading: fallbackLoading, refreshLibrary } = useData();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  const getRecommendedActions = useCallback((): RecommendedAction[] => {
      const actions: RecommendedAction[] = [];

      // 1. Finish Quickly (Reading, > 80% progress)
      library.forEach(item => {
          const total = item.mediaType === 'ANIME' ? item.episodes : item.chapters;
          if (item.status === 'READING' && total && item.progress > 0) {
              const percent = (item.progress / total) * 100;
              if (percent >= 80 && percent < 100) {
                  actions.push({
                      id: `fq-${item.id}`,
                      type: 'FINISH_QUICKLY',
                      title: item.title,
                      description: `You are ${Math.round(percent)}% done. Just ${total - item.progress} ${item.mediaType === 'ANIME' ? 'episodes' : 'chapters'} left!`,
                      mediaId: item.id,
                      mediaType: item.mediaType,
                      coverUrl: item.coverUrl,
                      priority: 1
                  });
              }
          }
      });

      // 2. Stalled Favorites (Favorite, not updated in 14 days)
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
      library.forEach(item => {
          if (item.isFavourite && item.status === 'READING' && item.updatedAt && new Date(item.updatedAt) < twoWeeksAgo) {
              actions.push({
                  id: `sf-${item.id}`,
                  type: 'STALLED_FAVORITE',
                  title: item.title,
                  description: `One of your favorites hasn't been updated in over 2 weeks. Resume your journey?`,
                  mediaId: item.id,
                  mediaType: item.mediaType,
                  coverUrl: item.coverUrl,
                  priority: 2
              });
          }
      });

      // 3. Short Series from Backlog (Planning, < 20 chapters/episodes)
      library.forEach(item => {
          const total = item.mediaType === 'ANIME' ? item.episodes : item.chapters;
          if (item.status === 'PLANNING' && total && total > 0 && total <= 20) {
              actions.push({
                  id: `sr-${item.id}`,
                  type: 'SHORT_READ',
                  title: item.title,
                  description: `A short ${item.mediaType.toLowerCase()} in your backlog (${total} ${item.mediaType === 'ANIME' ? 'episodes' : 'chapters'}). Perfect for a quick session.`,
                  mediaId: item.id,
                  mediaType: item.mediaType,
                  coverUrl: item.coverUrl,
                  priority: 3
              });
          }
      });

      return actions.sort((a, b) => a.priority - b.priority).slice(0, 6);
  }, [library]);

  const fetchStats = useCallback(async () => {
    if (!user || !isSupabaseConfigured()) {
      setStats({ ...fallbackStats, recommendedActions: getRecommendedActions() });
      setLoading(fallbackLoading);
      return;
    }

    setLoading(true);
    try {
      // Fetch sync conflicts
      const { data: conflicts } = await supabase!
        .from('sync_jobs')
        .select(`
            *,
            sync_conflicts(*)
        `)
        .eq('user_id', user.id)
        .eq('status', 'REQUIRES_RESOLUTION');

      setStats({
        ...fallbackStats,
        recommendedActions: getRecommendedActions(),
        activeConflicts: conflicts || []
      });
    } catch (err: unknown) {
      console.error('Stats fetch error:', err);
      setStats({ ...fallbackStats, recommendedActions: getRecommendedActions() });
    } finally {
      setLoading(false);
    }
  }, [user, fallbackStats, fallbackLoading, getRecommendedActions]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error: null,
    refreshStats: async () => {
      await refreshLibrary();
      await fetchStats();
    },
  };
};
