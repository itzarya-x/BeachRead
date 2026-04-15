import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useFetch } from '../hooks/useFetch';
import { HeroFeature } from '../components/home/HeroFeature';
import { DiscoverCarousel } from '../components/discover/DiscoverCarousel';
import { sanitizeCoverUrl } from '../lib/image';
import { useAuth } from '../context/auth-context';
import { useLibrary } from '../hooks/useLibrary';
import { Link, useNavigate } from 'react-router-dom';
import { 
    Plus, 
    Loader2, 
    TrendingUp, 
    Zap, 
    RefreshCcw, 
    Bell,
    Library,
    Calendar,
    Target,
    ZapOff,
    Sparkles
} from 'lucide-react';
import type { LibraryItem } from '../lib/types';
import { supabase } from '../lib/supabaseClient';

let intelligenceFeaturesUnavailable = false;
let releaseAlertsUnavailable = false;

export function Home() {
    const { user } = useAuth();
    const { library, updateLibraryItem } = useLibrary();
    const navigate = useNavigate();
    
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [syncJobs, setSyncJobs] = useState<any[]>([]);
    const [releaseAlerts, setReleaseAlerts] = useState<any[]>([]);
    const [finishQuickly, setFinishQuickly] = useState<any[]>([]);
    const [shortReads, setShortReads] = useState<any[]>([]);
    const [upcomingReleases, setUpcomingReleases] = useState<any[]>([]);
    const [tasteRecs, setTasteRecs] = useState<any[]>([]);
    const [readingGoals, setReadingGoals] = useState<any>(null);

    const { data: homeFeedData, loading: homeFeedLoading } = useFetch<any>('/home-feed');

    const fetchIntelligence = useCallback(async () => {
        if (!user || intelligenceFeaturesUnavailable) return;
        
        try {
            const { data: fq, error: fqError } = await supabase!.rpc('get_finish_quickly', { p_user_id: user.id, p_limit: 4 });
            if (fqError) throw fqError;
            if (fq) setFinishQuickly(fq);

            const { data: sr, error: srError } = await supabase!.rpc('get_short_reads', { p_user_id: user.id, p_limit: 4 });
            if (srError) throw srError;
            if (sr) setShortReads(sr);

            const { data: tr, error: trError } = await supabase!.rpc('get_taste_recommendations', { p_user_id: user.id, p_limit: 6 });
            if (trError) throw trError;
            if (tr) setTasteRecs(tr);

            const { data: goals, error: goalsError } = await supabase!.rpc('get_reading_stats_and_goals', { p_user_id: user.id });
            if (goalsError) throw goalsError;
            if (goals) setReadingGoals(goals);

            const { data: upcoming, error: upcomingError } = await supabase!
                .from('releases')
                .select(`
                    *,
                    titles(id, title_romaji, cover_url)
                `)
                .order('released_at', { ascending: false })
                .limit(5);
            if (upcomingError) throw upcomingError;
            if (upcoming) setUpcomingReleases(upcoming);
        } catch (_error) {
            intelligenceFeaturesUnavailable = true;
            setFinishQuickly([]);
            setShortReads([]);
            setTasteRecs([]);
            setReadingGoals(null);
            setUpcomingReleases([]);
        }
    }, [user]);

    useEffect(() => {
        if (!user) return;

        const fetchData = async () => {
            const { data: jobs } = await supabase!
                .from('sync_jobs')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(1);
            if (jobs) setSyncJobs(jobs);

            if (!releaseAlertsUnavailable) {
                const { data: alerts, error: alertsError } = await supabase!
                    .from('notifications')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('type', 'NEW_CHAPTER')
                    .eq('is_read', false)
                    .order('created_at', { ascending: false })
                    .limit(3);
                if (alertsError) {
                    releaseAlertsUnavailable = true;
                    setReleaseAlerts([]);
                } else if (alerts) {
                    setReleaseAlerts(alerts);
                }
            }
            
            await fetchIntelligence();
        };

        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, [user, fetchIntelligence]);

    const continueReading = useMemo(() => {
        return library
            .filter(item => item.status === 'READING')
            .sort((a, b) => Date.parse(b.updatedAt || '') - Date.parse(a.updatedAt || ''))
            .slice(0, 4);
    }, [library]);

    const handleIncrementChapter = async (e: React.MouseEvent, manga: LibraryItem) => {
        e.preventDefault();
        e.stopPropagation();
        if (updatingId) return;
        setUpdatingId(manga.id);
        try {
            const nextProgress = (manga.progress || 0) + 1;
            const totalUnits = manga.mediaType === 'ANIME' ? manga.episodes : manga.chapters;
            const isCompleted = totalUnits && nextProgress >= totalUnits;
            await updateLibraryItem(manga.id, {
                progress: nextProgress,
                status: isCompleted ? 'COMPLETED' : 'READING'
            });
            await fetchIntelligence();
        } finally {
            setUpdatingId(null);
        }
    };

    if (!user) {
        return (
            <div className="flex w-full flex-col items-center bg-background pb-[110px]">
                <HeroFeature data={homeFeedData?.hero || []} />
                <div className="w-full max-w-[1400px] px-[64px] mt-16">
                    <DiscoverCarousel title="Popular Right Now" mangaList={homeFeedData?.rankings?.seasonal || []} loading={homeFeedLoading} onViewAll={() => navigate('/discover')} />
                </div>
            </div>
        );
    }

    return (
        <div className="flex w-full flex-col items-center bg-background pb-[110px] min-h-screen">
            <div className="w-full max-w-[1600px] px-8 md:px-[64px] pt-[120px] space-y-16">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="animate-in fade-in slide-in-from-left-8 duration-700">
                        <div className="flex items-center gap-3 mb-4 text-primary">
                            <Zap size={18} fill="currentColor" />
                            <span className="text-[11px] font-black uppercase tracking-[0.4em]">Intelligence Protocol Active</span>
                        </div>
                        <h1 className="text-6xl md:text-8xl font-black tracking-[-0.05em] text-foreground uppercase leading-[0.85]">
                            Command<br/>Center
                        </h1>
                    </div>

                    {syncJobs.length > 0 && (
                        <div className="bg-white/5 border border-white/10 rounded-[32px] p-6 flex items-center gap-6 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-500">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${syncJobs[0].status === 'PROCESSING' ? 'bg-primary animate-spin' : 'bg-green-500/20 text-green-500'}`}>
                                <RefreshCcw size={20} />
                            </div>
                            <div>
                                <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1">Sync Status</p>
                                <p className="text-xs font-black text-white uppercase">{syncJobs[0].provider} • {syncJobs[0].status}</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-12">
                    
                    {/* Main Feed: Queue Intelligence */}
                    <div className="xl:col-span-8 space-y-16">
                        
                        {/* Continue Reading */}
                        <section>
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <h2 className="text-2xl font-black uppercase tracking-tight">Active Archive</h2>
                                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-[10px] font-black uppercase tracking-widest">{continueReading.length} Series</span>
                                </div>
                                <Link to="/library?filter=READING" className="text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors">Go to Library</Link>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {continueReading.length > 0 ? continueReading.map(manga => (
                                    <Link key={manga.id} to={`/manga/${manga.id}`} className="group relative bg-white/[0.02] border border-white/5 rounded-[40px] p-6 flex gap-6 hover:bg-white/[0.05] transition-all">
                                        <div className="w-24 h-32 rounded-2xl overflow-hidden shrink-0 shadow-xl border border-white/5 relative">
                                            <img src={sanitizeCoverUrl(manga.coverUrl)} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="" />
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                            <h3 className="text-lg font-black text-white uppercase tracking-tight truncate mb-2">{manga.title}</h3>
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] font-black uppercase tracking-widest text-white/40">{manga.mediaType === 'ANIME' ? 'Episode' : 'Chapter'}</span>
                                                    <span className="text-sm font-black text-primary">{manga.progress} <span className="text-white/20">/ {(manga.mediaType === 'ANIME' ? manga.episodes : manga.chapters) || '??'}</span></span>
                                                </div>
                                            </div>
                                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                                <div className="h-full bg-primary" style={{ width: `${(manga.progress / ((manga.mediaType === 'ANIME' ? manga.episodes : manga.chapters) || 100)) * 100}%` }} />
                                            </div>
                                        </div>
                                        <button onClick={(e) => handleIncrementChapter(e, manga)} className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-primary transition-all self-center">
                                            {updatingId === manga.id ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                                        </button>
                                    </Link>
                                )) : (
                                    <div className="col-span-2 py-12 rounded-[40px] border-2 border-dashed border-white/5 flex flex-col items-center justify-center text-center">
                                        <ZapOff className="text-white/10 mb-4" size={32} />
                                        <p className="text-sm font-black uppercase tracking-widest text-white/20">No active reads detected</p>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Finish Quickly */}
                        {finishQuickly.length > 0 && (
                            <section>
                                <div className="flex items-center gap-4 mb-8">
                                    <Target className="text-primary" size={20} />
                                    <h2 className="text-2xl font-black uppercase tracking-tight text-white">Finish Quickly</h2>
                                    <div className="h-px flex-1 bg-white/5" />
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                                    {finishQuickly.map(item => (
                                        <Link key={item.title_id} to={`/manga/${item.title_id}`} className="group space-y-4">
                                            <div className="aspect-[2/3] rounded-[32px] overflow-hidden bg-white/5 border border-white/5 relative shadow-2xl transition-all group-hover:scale-105">
                                                <img src={sanitizeCoverUrl(item.cover_url)} className="w-full h-full object-cover" alt="" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <span className="text-[10px] font-black uppercase bg-primary px-3 py-1 rounded-lg">{item.percent_complete}% Done</span>
                                                </div>
                                            </div>
                                            <h4 className="text-[11px] font-black uppercase tracking-tight text-white/80 line-clamp-1 group-hover:text-primary transition-colors">{item.title}</h4>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Short Reads (Backlog Intelligence) */}
                        {shortReads.length > 0 && (
                            <section>
                                <div className="flex items-center gap-4 mb-8">
                                    <Library className="text-amber-500" size={20} />
                                    <h2 className="text-2xl font-black uppercase tracking-tight text-white/60">Fast Backlog Clearance</h2>
                                    <div className="h-px flex-1 bg-white/5" />
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                                    {shortReads.map(item => (
                                        <Link key={item.title_id} to={`/manga/${item.title_id}`} className="group space-y-4">
                                            <div className="aspect-[2/3] rounded-[32px] overflow-hidden bg-white/5 border border-white/5 relative shadow-2xl transition-all group-hover:scale-105">
                                                <img src={sanitizeCoverUrl(item.cover_url)} className="w-full h-full object-cover" alt="" />
                                                <div className="absolute bottom-4 left-4 right-4">
                                                    <span className="px-2 py-1 bg-amber-500 text-black rounded-md text-[8px] font-black uppercase tracking-widest">{item.chapters_total} Chapters</span>
                                                </div>
                                            </div>
                                            <h4 className="text-[11px] font-black uppercase tracking-tight text-white/80 line-clamp-1 group-hover:text-amber-500 transition-colors">{item.title}</h4>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}
                        {/* Taste-based Recommendations */}
                        {tasteRecs.length > 0 && (
                            <section className="space-y-8">
                                <div className="flex items-center gap-4">
                                    <Sparkles className="text-primary" size={20} />
                                    <h2 className="text-2xl font-black uppercase tracking-tight text-white">Recommended for your Taste</h2>
                                    <div className="h-px flex-1 bg-white/5" />
                                </div>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                                    {tasteRecs.map(item => (
                                        <Link key={item.title_id} to={`/manga/${item.title_id}`} className="group relative bg-white/[0.02] border border-white/5 rounded-[32px] p-5 flex flex-col gap-4 hover:bg-white/[0.05] transition-all">
                                            <div className="aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl relative">
                                                <img src={sanitizeCoverUrl(item.cover_url)} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="" />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                                    <span className="text-[8px] font-black uppercase tracking-widest text-primary mb-1">Why this?</span>
                                                    <p className="text-[10px] text-white/80 leading-tight italic">{item.reason}</p>
                                                </div>
                                            </div>
                                            <div className="space-y-1 px-1">
                                                <h4 className="text-xs font-black uppercase tracking-tight text-white line-clamp-1 group-hover:text-primary transition-colors">{item.title}</h4>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[9px] font-bold text-white/40 uppercase">{item.genres[0]}</span>
                                                    <span className="text-[9px] font-bold text-primary uppercase">★ {item.average_score}</span>
                                                </div>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            </section>
                        )}
                    </div>

                    {/* Sidebar: Intelligence & Calendar */}
                    <div className="xl:col-span-4 space-y-12">
                        
                        {/* Reading Goals & Streaks */}
                        {readingGoals && (
                            <section className="bg-foreground text-background rounded-[48px] p-10 space-y-8 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <TrendingUp size={120} />
                                </div>
                                <div className="flex items-center gap-3 text-background/60 relative z-10">
                                    <Target size={18} />
                                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em]">Protocol Goals</h3>
                                </div>

                                <div className="space-y-8 relative z-10">
                                    <div className="flex justify-between items-end">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Daily Streak</span>
                                            <span className="text-xs font-black text-primary uppercase mt-1">Status: Active</span>
                                        </div>
                                        <span className="text-5xl font-black">{readingGoals.current_streak}<span className="text-sm opacity-40 ml-1 uppercase">Days</span></span>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex justify-between items-end">
                                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Monthly Chapter Target</span>
                                            <span className="text-xl font-black">{readingGoals.monthly_progress}<span className="text-xs opacity-40 ml-1">/ {readingGoals.monthly_goal}</span></span>
                                        </div>
                                        <div className="w-full h-2 bg-background/10 rounded-full overflow-hidden border border-background/5">
                                            <div 
                                                className="h-full bg-primary transition-all duration-1000" 
                                                style={{ width: `${Math.min(100, (readingGoals.monthly_progress / readingGoals.monthly_goal) * 100)}%` }} 
                                            />
                                        </div>
                                        <p className="text-[10px] font-bold opacity-40 italic">You've completed {Math.round((readingGoals.monthly_progress / readingGoals.monthly_goal) * 100)}% of your monthly transmission goal.</p>
                                    </div>
                                </div>
                            </section>
                        )}

                        {/* Release Calendar / Next-up */}
                        <section className="bg-white/[0.02] border border-white/5 rounded-[48px] p-10 space-y-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 text-primary">
                                    <Calendar size={18} />
                                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em]">Protocol Calendar</h3>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {upcomingReleases.length === 0 ? (
                                    <p className="text-xs italic text-white/20 text-center py-4">No transmissions detected.</p>
                                ) : upcomingReleases.map(rel => (
                                    <div key={rel.id} className="flex gap-4 group cursor-pointer" onClick={() => navigate(`/manga/${rel.titles.id}`)}>
                                        <div className="w-10 h-14 rounded-xl overflow-hidden shrink-0 border border-white/5">
                                            <img src={sanitizeCoverUrl(rel.titles.cover_url)} className="w-full h-full object-cover" alt="" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[11px] font-black text-white truncate">{rel.titles.title_romaji}</p>
                                            <p className="text-[9px] text-primary font-black uppercase tracking-widest mt-1">Chapter {rel.chapter_number}</p>
                                            <p className="text-[8px] text-white/20 font-bold uppercase tracking-widest mt-1">
                                                {new Date(rel.released_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Recent Alerts */}
                        <section className="bg-primary/5 border border-primary/10 rounded-[48px] p-10 space-y-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 text-primary">
                                    <Bell size={18} />
                                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em]">Archive Alerts</h3>
                                </div>
                            </div>
                            <div className="space-y-6">
                                {releaseAlerts.length === 0 ? (
                                    <p className="text-xs italic text-white/20 text-center">Protocol clear.</p>
                                ) : releaseAlerts.map(alert => (
                                    <div key={alert.id} className="flex gap-4 group cursor-pointer" onClick={() => navigate('/notifications')}>
                                        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                                            <Zap size={14} />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-[10px] font-black text-white line-clamp-1">{alert.title}</p>
                                            <p className="text-[8px] text-white/40 uppercase font-black tracking-widest">{alert.message}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
