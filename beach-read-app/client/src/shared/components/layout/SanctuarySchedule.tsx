import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../../features/auth/context/auth-context';
import { useLibrary } from '../../../features/library/hooks/useLibrary';
import { publicApiClient } from '../../api/apiClient';
import { Calendar, Clock, ChevronRight, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { sanitizeCoverUrl } from '../../utils/image';
import type { LibraryItem } from '../../types/types';

interface AiringEntry {
    id: number;
    airingAt: number;
    episode: number;
    media: {
        id: number;
        title: {
            romaji: string;
            english: string;
        }
        coverImage: {
            large: string;
        }
    }
}

export function SanctuarySchedule() {
    const { user } = useAuth();
    const { library } = useLibrary();
    const [schedule, setSchedule] = useState<AiringEntry[]>([]);
    const [loading, setLoading] = useState(false);

    const animeInLibrary = useMemo(() => {
        return library
            .filter((item: LibraryItem) => item.mediaType === 'ANIME' && item.status !== 'COMPLETED' && item.status !== 'DROPPED')
            .map((item: LibraryItem) => item.seriesId)
            .filter((id: number | undefined) => !!id);
    }, [library]);

    useEffect(() => {
        const fetchSchedule = async () => {
            if (!user || animeInLibrary.length === 0) return;
            setLoading(true);
            try {
                // Note: AniList airing schedule usually needs its own query.
                // I'll fetch this from a new backend route.
                
                const airingData = await publicApiClient.get<AiringEntry[]>(`/anime/schedule?ids=${animeInLibrary.join(',')}`);
                setSchedule(airingData);
            } catch (err) {
                console.error('Failed to fetch airing schedule:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchSchedule();
    }, [user, animeInLibrary]);

    if (!user || animeInLibrary.length === 0) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 text-primary rounded-lg">
                        <Calendar size={16} />
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-[0.3em] text-foreground">Sanctuary Schedule</h3>
                </div>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Next 7 Days</span>
            </div>

            {loading ? (
                <div className="py-8 flex justify-center">
                    <Loader2 size={20} className="animate-spin text-muted-foreground/20" />
                </div>
            ) : schedule.length === 0 ? (
                <div className="py-10 text-center border border-dashed border-border rounded-3xl bg-foreground/[0.01]">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-40">No upcoming broadcasts</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {schedule.map(entry => {
                        const date = new Date(entry.airingAt * 1000);
                        const isToday = new Date().toDateString() === date.toDateString();

                        return (
                            <Link 
                                key={entry.id} 
                                to={`/manga/${entry.media.id}`}
                                className="group flex items-center gap-4 p-4 rounded-2xl bg-foreground/[0.02] border border-foreground/5 hover:bg-foreground/[0.04] transition-all"
                            >
                                <div className="relative shrink-0">
                                    <img 
                                        src={sanitizeCoverUrl(entry.media.coverImage.large)} 
                                        className="w-12 h-16 object-cover rounded-xl shadow-sm" 
                                        alt={entry.media.title.romaji} 
                                    />
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-white text-[9px] font-black rounded-full flex items-center justify-center shadow-lg">
                                        {entry.episode}
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-[11px] font-black uppercase tracking-tight text-foreground truncate group-hover:text-primary transition-colors">
                                        {entry.media.title.romaji || entry.media.title.english}
                                    </h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <Clock size={10} className={isToday ? 'text-sakura-accent' : 'text-muted-foreground'} />
                                        <span className={`text-[9px] font-bold uppercase tracking-widest ${isToday ? 'text-sakura-accent' : 'text-muted-foreground'}`}>
                                            {isToday ? 'Today' : date.toLocaleDateString('default', { weekday: 'short' })} · {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                                <ChevronRight size={14} className="text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                            </Link>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
