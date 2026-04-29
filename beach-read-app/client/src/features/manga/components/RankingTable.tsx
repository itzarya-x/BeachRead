import { Link } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { handleCoverImageError, sanitizeCoverUrl } from '../../../shared/utils/image';
import { STAGGER_CONTAINER, STAGGER_ITEM } from '../../../shared/utils/motion-variants';

type RankingItem = {
    rank: number;
    id: string;
    title: string;
    titleJp?: string;
    coverUrl: string;
    episodes?: number | string;
    popularity?: string;
    nextEpisode?: number | null;
    countdown?: string;
};

type RankingsData = {
    season?: string;
    seasonYear?: number;
    trending: RankingItem[];
    popular: RankingItem[];
    topScored: RankingItem[];
    seasonal: RankingItem[];
    airingSchedule: RankingItem[];
};

interface RankingProps {
    data: RankingsData;
    loading?: boolean;
    error?: string | null;
}

const TABS = [
    { key: 'trending', label: 'Trending' },
    { key: 'popular', label: 'Popular' },
    { key: 'topScored', label: 'Top Scored' },
    { key: 'seasonal', label: 'Seasonal' },
    { key: 'airingSchedule', label: 'Airing Schedule' },
] as const;

type TabKey = typeof TABS[number]['key'];

export function RankingTable({ data, loading = false, error = null }: RankingProps) {
    const [activeTab, setActiveTab] = useState<TabKey>('trending');
    const isAiring = activeTab === 'airingSchedule';

    const activeList = useMemo(() => {
        if (activeTab === 'popular') return data.popular || [];
        if (activeTab === 'topScored') return data.topScored || [];
        if (activeTab === 'seasonal') return data.seasonal || [];
        if (activeTab === 'airingSchedule') return data.airingSchedule || [];
        return data.trending || [];
    }, [activeTab, data]);

    const seasonLabel = data.season && data.seasonYear ? `${data.season} ${data.seasonYear}` : 'Current Season';

    return (
        <section className="mx-auto mb-[88px] w-full max-w-[1280px] px-[28px] pt-[42px] transition-all duration-500">
            <div className="mb-[28px] flex flex-col justify-between gap-[18px] border-t border-border/70 pt-[22px] md:flex-row md:items-end">
                <div>
                    <p className="mb-[6px] text-[11px] font-bold uppercase tracking-[0.26em] text-muted-foreground transition-colors duration-500">Leaderboard</p>
                    <h2 className="mb-[18px] text-[30px] font-black tracking-[-0.03em] text-foreground transition-colors duration-500">Ranking Table</h2>
                    <div className="flex flex-wrap rounded-full border border-border/50 bg-muted/60 p-[4px] shadow-sm transition-all duration-500">
                        {TABS.map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`px-[16px] py-[8px] text-[12px] font-bold tracking-wide transition-all duration-500 rounded-full ${activeTab === tab.key ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:text-foreground'}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-[14px]">
                    <span className="rounded-full border border-border/60 bg-muted/50 px-[20px] py-[10px] text-[12px] font-bold text-foreground transition-all duration-500">
                        {activeTab === 'seasonal' ? seasonLabel : 'AniList Live'}
                    </span>
                </div>
            </div>

            <motion.div 
                key={activeTab}
                variants={STAGGER_CONTAINER}
                initial="hidden"
                animate="visible"
                className="grid gap-x-[100px] gap-y-[24px] md:grid-cols-2"
            >
                {loading ? (
                    <div className="md:col-span-2 rounded-xl border border-border/60 bg-muted/20 p-6 text-sm font-semibold text-muted-foreground transition-all duration-500">
                        Loading live AniList rankings...
                    </div>
                ) : null}
                {!loading && error ? (
                    <div className="md:col-span-2 rounded-xl border border-destructive/40 bg-destructive/10 p-6 text-sm font-semibold text-destructive transition-all duration-500">
                        {error}
                    </div>
                ) : null}
                {!loading && !error && activeList.length === 0 ? (
                    <div className="md:col-span-2 rounded-xl border border-border/60 bg-muted/20 p-6 text-sm font-semibold text-muted-foreground transition-all duration-500">
                        No ranking data received from AniList yet.
                    </div>
                ) : null}
                <div className="w-full">
                    <TableHeader isAiring={isAiring} />
                    {activeList.slice(0, 5).map((manga) => (
                        <RankingRow key={manga.id} manga={manga} isAiring={isAiring} />
                    ))}
                </div>
                <div className="hidden w-full md:block">
                    <TableHeader isAiring={isAiring} />
                    {activeList.slice(5, 10).map((manga) => (
                        <RankingRow key={manga.id} manga={manga} isAiring={isAiring} />
                    ))}
                </div>
            </motion.div>
        </section>
    );
}

function TableHeader({ isAiring }: { isAiring: boolean }) {
    return (
        <div className="flex items-center border-b border-border/80 pb-[12px] text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground transition-colors duration-500">
            <div className="w-10 text-center">Rank</div>
            <div className="flex-1 ml-[12px]">Title</div>
            <div className="w-[90px] text-right">{isAiring ? 'Episode' : 'Episodes'}</div>
            <div className="w-[90px] text-right pr-2">{isAiring ? 'Next In' : 'Popularity'}</div>
        </div>
    );
}

function RankingRow({ manga, isAiring }: { manga: RankingItem; isAiring: boolean }) {
    const episodesDisplay = isAiring ? (manga.nextEpisode ? `EP ${manga.nextEpisode}` : 'TBA') : `${manga.episodes ?? '?'}`;
    const rightDisplay = isAiring ? (manga.countdown || 'Soon') : (manga.popularity || 'N/A');

    return (
        <motion.div 
            variants={STAGGER_ITEM}
            className="group m-1 flex cursor-pointer items-center rounded-[10px] border-b border-border/30 px-4 py-[14px] transition-all duration-500 ease-in-out hover:bg-foreground/[0.04]"
        >
            <div className="w-10 text-center font-bold text-[11px] text-muted-foreground transition-colors duration-500">{(manga.rank).toString().padStart(2, '0')}</div>
            <div className="flex items-center flex-1 gap-[18px] ml-[12px]">
                <Link to={`/manga/${manga.id}`} className="shrink-0 flex items-center justify-center overflow-hidden bg-muted rounded-[2px] shadow-sm transition-all duration-500">
                    <img src={sanitizeCoverUrl(manga.coverUrl)} alt={manga.title} onError={handleCoverImageError} className="w-[36px] h-[52px] object-cover scale-[1.01] rounded-[2px] group-hover:scale-[1.08] transition-transform duration-500 ease-out" />
                </Link>
                <div className="flex flex-col justify-center">
                    <Link to={`/manga/${manga.id}`} className="text-[14px] font-black tracking-tight text-foreground hover:text-primary transition-colors duration-500 block mb-[2px]">{manga.title}</Link>
                    <span className="text-[11px] text-muted-foreground/70 font-medium tracking-wide transition-colors duration-500 block">{manga.titleJp}</span>
                </div>
            </div>
            <div className="w-[90px] text-right text-[12px] font-semibold text-muted-foreground transition-colors duration-500">{episodesDisplay}</div>
            <div className="w-[90px] text-right text-[12px] font-semibold text-muted-foreground pr-2 transition-colors duration-500">{rightDisplay}</div>
        </motion.div>
    );
}
