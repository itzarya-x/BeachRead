import type { LibraryItem, UserStats, MediaStats, LibraryStatus } from '../../../shared/types/types';

function computeMediaStats(items: LibraryItem[], type: 'ANIME' | 'MANGA'): MediaStats {
    const totalCount = items.length || 0;
    const withScore = items.filter((x) => (x.score || 0) > 0);
    const meanScore = withScore.length ? withScore.reduce((sum, x) => sum + (x.score || 0), 0) / withScore.length : 0;
    
    // Variance and Std Dev
    const variance = withScore.length 
        ? withScore.reduce((sum, x) => sum + Math.pow(x.score - meanScore, 2), 0) / withScore.length
        : 0;
    const standardDeviation = Math.sqrt(variance);

    const totalUnits = items.reduce((sum, x) => sum + (x.progress || 0), 0);
    const totalVolumesRead = type === 'MANGA' ? items.reduce((sum, x) => sum + (x.progressVolumes || 0), 0) : undefined;
    
    // Planned units
    const unitsPlanned = items
        .filter(x => x.status === 'PLANNING')
        .reduce((sum, x) => sum + (type === 'ANIME' ? (x.episodes || 0) : (x.chapters || 0)), 0);

    const daysWatched = type === 'ANIME' ? Number(((totalUnits * 24) / 1440).toFixed(1)) : undefined;
    const daysPlanned = type === 'ANIME' ? Number(((unitsPlanned * 24) / 1440).toFixed(1)) : undefined;

    const statusMap = new Map<LibraryStatus, number>();
    const formatMap = new Map<string, number>();
    const genreCounter = new Map<string, number>();
    const countryMap = new Map<string, number>();
    const yearMap = new Map<number, number>();

    items.forEach(item => {
        statusMap.set(item.status, (statusMap.get(item.status) || 0) + 1);
        if (item.format) formatMap.set(item.format, (formatMap.get(item.format) || 0) + 1);
        
        if (item.countryOfOrigin) {
            const country = item.countryOfOrigin;
            countryMap.set(country, (countryMap.get(country) || 0) + 1);
        }

        (item.genres || []).forEach(genre => {
            genreCounter.set(genre, (genreCounter.get(genre) || 0) + 1);
        });
        if (item.startedAt) {
            const year = new Date(item.startedAt).getFullYear();
            yearMap.set(year, (yearMap.get(year) || 0) + 1);
        }
    });

    const countryLabels: Record<string, string> = {
        'JP': 'Japan',
        'KR': 'South Korea',
        'CN': 'China',
        'TW': 'Taiwan',
        'US': 'United States',
    };

    const is100PointScale = items.some(x => (x.score || 0) > 10);
    const scoreDistribution = Array.from({ length: 10 }, (_, i) => ({ bucket: (i + 1) * 10, count: 0 }));
    withScore.forEach((item) => {
        const normalizedScore = (!is100PointScale && item.score <= 10) ? item.score * 10 : item.score;
        const bucketIdx = Math.max(0, Math.min(Math.floor((normalizedScore - 1) / 10), 9));
        if (scoreDistribution[bucketIdx]) {
            scoreDistribution[bucketIdx].count += 1;
        }
    });

    return {
        count: totalCount,
        meanScore: Number(meanScore.toFixed(1)),
        standardDeviation: Number(standardDeviation.toFixed(2)),
        totalUnits,
        totalVolumesRead,
        unitsPlanned,
        daysWatched,
        daysPlanned,
        statusDistribution: Array.from(statusMap.entries()).map(([status, count]) => ({ 
            status, 
            count, 
            percentage: Number(((count / (totalCount || 1)) * 100).toFixed(1)) 
        })),
        formatDistribution: Array.from(formatMap.entries()).map(([format, count]) => ({ 
            format, 
            count, 
            percentage: Number(((count / (totalCount || 1)) * 100).toFixed(1)) 
        })),
        scoreDistribution,
        genreStats: Array.from(genreCounter.entries())
            .map(([name, count]) => ({ name, count, percentage: Number(((count / (totalCount || 1)) * 100).toFixed(1)) }))
            .sort((a, b) => b.count - a.count),
        releaseYearStats: Array.from(yearMap.entries()).map(([year, count]) => ({ year, count })).sort((a, b) => a.year - b.year),
        countryDistribution: Array.from(countryMap.entries())
            .map(([code, count]) => ({ 
                country: countryLabels[code] || code, 
                count, 
                percentage: Number(((count / (totalCount || 1)) * 100).toFixed(1)) 
            }))
            .sort((a, b) => b.count - a.count)
    };
}

export function computeStats(library: LibraryItem[]): UserStats {
    const completed = library.filter((x) => x.status === 'COMPLETED').length;
    const reading = library.filter((x) => x.status === 'READING' || x.status === 'CURRENT').length;
    const planning = library.filter((x) => x.status === 'PLANNING').length;
    const dropped = library.filter((x) => x.status === 'DROPPED').length;
    const paused = library.filter((x) => x.status === 'PAUSED').length;
    
    const animeItems = library.filter(x => x.mediaType === 'ANIME');
    const mangaItems = library.filter(x => x.mediaType === 'MANGA' || x.mediaType === 'NOVEL');

    const totalUnits = library.reduce((sum, x) => sum + (x.progress || 0), 0);
    const totalChaptersRead = library
        .filter((x) => x.mediaType !== 'ANIME')
        .reduce((sum, x) => sum + (x.progress || 0), 0);
    const totalEpisodesWatched = library
        .filter((x) => x.mediaType === 'ANIME')
        .reduce((sum, x) => sum + (x.progress || 0), 0);
    const withScore = library.filter((x) => (x.score || 0) > 0);
    const meanScore = withScore.length ? withScore.reduce((sum, x) => sum + (x.score || 0), 0) / withScore.length : 0;

    const genreCounter = new Map<string, number>();
    library.forEach((item) => {
        (item.genres || []).forEach((genre) => {
            genreCounter.set(genre, (genreCounter.get(genre) || 0) + 1);
        });
    });

    const totalItems = library.length || 1;
    const genreStats = Array.from(genreCounter.entries())
        .map(([name, count]) => ({ name, count, percentage: (count / totalItems) * 100 }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

    const scoreDistribution = Array.from({ length: 10 }, (_, i) => ({ bucket: (i + 1) * 10, count: 0 }));
    withScore.forEach((item) => {
        const is100PointScale = library.some(x => (x.score || 0) > 10);
        const normalizedScore = (!is100PointScale && item.score <= 10) ? item.score * 10 : item.score;
        
        const bucketIdx = Math.max(0, Math.min(Math.floor((normalizedScore - 1) / 10), 9));
        if (scoreDistribution[bucketIdx]) {
            scoreDistribution[bucketIdx].count += 1;
        }
    });

    // Profile Type Logic
    const totalWithStatus = completed + reading + dropped + paused;
    const completionRate = (completed / (totalWithStatus || 1)) * 100;
    const dropRate = (dropped / (totalWithStatus || 1)) * 100;

    let profileType: UserStats['profileType'] = 'STRATEGIST';
    if (completionRate > 70) profileType = 'COMPLETIONIST';
    else if (dropRate > 30) profileType = 'CRITIC';
    else if (totalItems < 20) profileType = 'CASUAL';

    const favorites = library.filter(x => x.isFavourite).length;
    const formats = {
        manga: library.filter(x => x.mediaType === 'MANGA').length,
        anime: library.filter(x => x.mediaType === 'ANIME').length,
        novel: library.filter(x => x.mediaType === 'NOVEL').length,
        oneShot: library.filter(x => {
            const total = x.mediaType === 'ANIME' ? x.episodes : x.chapters;
            return (total || 0) <= 1 && x.status === 'COMPLETED';
        }).length
    };

    // 1. Genre Affinity (Highest Mean Score per Genre)
    const genreScores = new Map<string, { total: number; count: number }>();
    withScore.forEach((item) => {
        (item.genres || []).forEach((genre) => {
            const current = genreScores.get(genre) || { total: 0, count: 0 };
            genreScores.set(genre, { total: current.total + item.score, count: current.count + 1 });
        });
    });

    let highestRatedGenre = { name: 'N/A', score: 0 };
    genreScores.forEach((val, key) => {
        const mean = val.total / val.count;
        if (val.count >= 3 && mean > highestRatedGenre.score) {
            highestRatedGenre = { name: key, score: Number(mean.toFixed(1)) };
        }
    });

    // 2. Reading Archetype (Length Distribution)
    const lengths = {
        marathons: library.filter(x => {
            const total = x.mediaType === 'ANIME' ? x.episodes : x.chapters;
            return (total || 0) >= 100;
        }).length,
        sprints: library.filter(x => {
            const total = x.mediaType === 'ANIME' ? x.episodes : x.chapters;
            return (total || 0) > 0 && (total || 0) < 30;
        }).length
    };

    // 3. Hoarding Ratio (Planning vs. Completed)
    const hoardingRatio = Number((planning / (completed || 1)).toFixed(2));

    // 4. Archive Maturity (Days since oldest entry)
    const dates = library.map(x => x.startedAt || x.updatedAt).filter(Boolean) as string[];
    let archiveMaturity = 'New Archive';
    if (dates.length > 0) {
        const oldest = new Date(Math.min(...dates.map(d => new Date(d).getTime())));
        const diffDays = Math.floor((new Date().getTime() - oldest.getTime()) / (1000 * 3600 * 24));
        archiveMaturity = diffDays > 365 ? `${(diffDays / 365).toFixed(1)}y` : `${diffDays}d`;
    }

    // 5. Reading Velocity (Activity in the last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const activityMap = new Map<string, number>();
    library.forEach(item => {
        if (item.updatedAt) {
            const date = new Date(item.updatedAt);
            if (date >= thirtyDaysAgo) {
                const dateStr = date.toISOString().split('T')[0];
                activityMap.set(dateStr, (activityMap.get(dateStr) || 0) + 1);
            }
        }
    });

    const readingVelocity = Array.from({ length: 31 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (30 - i));
        const dateStr = d.toISOString().split('T')[0];
        return {
            day: dateStr,
            count: activityMap.get(dateStr) || 0
        };
    });

    // 6. Practical Metrics (Time, Health, Friction)
    const totalEpisodes = library.filter(x => x.mediaType === 'ANIME').reduce((sum, x) => sum + (x.progress || 0), 0);
    const totalChapters = library.filter(x => x.mediaType !== 'ANIME').reduce((sum, x) => sum + (x.progress || 0), 0);
    
    // Estimated hours (24m per episode, 5m per chapter)
    const totalHours = Math.round((totalEpisodes * 24 + totalChapters * 5) / 60);
    
    const activeItems = totalItems - planning;
    const completionRatio = Math.round((completed / (activeItems || 1)) * 100);
    
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    
    const stalledTitles = library.filter(item => {
        if (item.status !== 'READING' && item.status !== 'CURRENT') return false;
        if (!item.updatedAt) return false;
        return new Date(item.updatedAt) < fourteenDaysAgo;
    }).length;

    return {
        completed,
        reading,
        planning,
        dropped,
        paused,
        totalUnits,
        totalChaptersRead,
        totalEpisodesWatched,
        meanScore: Number(meanScore.toFixed(1)),
        genreStats,
        scoreDistribution,
        profileType,
        readingVelocity,
        favorites,
        formatStats: formats,
        highestRatedGenre,
        hoardingRatio,
        lengthStats: lengths,
        archiveMaturity,
        totalHours,
        completionRatio,
        stalledTitles,
        animeStats: computeMediaStats(animeItems, 'ANIME'),
        mangaStats: computeMediaStats(mangaItems, 'MANGA')
    };
}
