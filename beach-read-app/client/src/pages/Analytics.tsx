import React from 'react';
import { useStats } from '../hooks/useStats';
import { 
    Loader2, 
    TrendingUp, 
    Zap, 
    Target, 
    AlertTriangle, 
    ArrowUpRight,
    BookOpen
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { sanitizeCoverUrl } from '../lib/image';
import { supabase } from '../lib/supabaseClient';

const Analytics: React.FC = () => {
    const { stats, loading, refreshStats } = useStats();
    const navigate = useNavigate();

    const handleResolveConflict = async (jobId: string, _winner: 'local' | 'remote') => {
        // Logic to resolve conflict
        // In a real app, this would trigger an RPC or update specific entries
        await supabase!.from('sync_jobs').update({ status: 'COMPLETED' }).eq('id', jobId);
        await refreshStats();
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div className="w-full min-h-screen bg-background pt-[120px] pb-20 px-6 md:px-[64px]">
            <div className="max-w-[1400px] mx-auto space-y-20">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary mb-4">Tactical Analysis</p>
                        <h1 className="text-6xl md:text-8xl font-black tracking-[-0.05em] text-foreground uppercase leading-[0.85]">Intelligence<br/>Deck</h1>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col justify-center">
                            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Archive Velocity</p>
                            <p className="text-2xl font-black text-white">2.4 <span className="text-xs opacity-30">Ch/Day</span></p>
                        </div>
                    </div>
                </div>

                {/* 1. Critical Interventions (Sync Conflicts) */}
                {stats.activeConflicts && stats.activeConflicts.length > 0 && (
                    <section className="animate-in fade-in slide-in-from-top-8 duration-700">
                        <div className="flex items-center gap-4 mb-8">
                            <AlertTriangle className="text-red-500" size={24} />
                            <h2 className="text-2xl font-black uppercase tracking-tight text-white">Critical Interventions</h2>
                            <div className="h-px flex-1 bg-red-500/20" />
                        </div>
                        
                        <div className="grid grid-cols-1 gap-6">
                            {stats.activeConflicts.map((job: any) => (
                                <div key={job.id} className="bg-red-500/5 border border-red-500/20 rounded-[40px] p-8 md:p-12">
                                    <div className="flex flex-col lg:flex-row gap-12">
                                        <div className="flex-1 space-y-6">
                                            <h3 className="text-xl font-black uppercase tracking-tight text-white">Sync Conflict: {job.provider}</h3>
                                            <p className="text-white/60 text-sm leading-relaxed max-w-md italic">
                                                We detected a divergence between your local archival state and the provider's records. Manual resolution required to maintain data integrity.
                                            </p>
                                            <div className="grid grid-cols-2 gap-8">
                                                <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-4">Local State</p>
                                                    <p className="text-2xl font-black text-white">CH 10</p>
                                                    <p className="text-[10px] font-black uppercase text-white/40 mt-1">Reading</p>
                                                </div>
                                                <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-4">Remote State</p>
                                                    <p className="text-2xl font-black text-white">CH 12</p>
                                                    <p className="text-[10px] font-black uppercase text-white/40 mt-1">Completed</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-4 justify-center">
                                            <button 
                                                onClick={() => handleResolveConflict(job.id, 'local')}
                                                className="px-10 py-5 bg-white/10 border border-white/10 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all"
                                            >
                                                Keep Local Archive
                                            </button>
                                            <button 
                                                onClick={() => handleResolveConflict(job.id, 'remote')}
                                                className="px-10 py-5 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-xl shadow-primary/20"
                                            >
                                                Accept Remote Update
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* 2. Recommended Actions */}
                <section>
                    <div className="flex items-center gap-4 mb-10">
                        <Zap className="text-primary" size={24} />
                        <h2 className="text-2xl font-black uppercase tracking-tight text-white">Actionable Directives</h2>
                        <div className="h-px flex-1 bg-white/5" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {stats.recommendedActions?.map((action) => (
                            <div key={action.id} className="group relative bg-white/[0.02] border border-white/5 rounded-[48px] p-8 flex flex-col hover:bg-white/[0.05] transition-all">
                                <div className="flex items-start justify-between mb-8">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                                        action.type === 'FINISH_QUICKLY' ? 'bg-green-500/20 text-green-500' :
                                        action.type === 'STALLED_FAVORITE' ? 'bg-red-500/20 text-red-500' :
                                        'bg-amber-500/20 text-amber-500'
                                    }`}>
                                        {action.type === 'FINISH_QUICKLY' ? <Target size={24} /> : 
                                         action.type === 'STALLED_FAVORITE' ? <TrendingUp size={24} /> : 
                                         <BookOpen size={24} />}
                                    </div>
                                    <Link to={`/manga/${action.mediaId}`} className="p-3 bg-white/5 rounded-xl text-white/40 hover:text-white transition-colors">
                                        <ArrowUpRight size={20} />
                                    </Link>
                                </div>
                                
                                <div className="flex-1">
                                    <h3 className="text-lg font-black text-white uppercase tracking-tight mb-2 line-clamp-1">{action.title}</h3>
                                    <p className="text-xs text-white/40 font-medium leading-relaxed italic">{action.description}</p>
                                </div>

                                <div className="mt-8 flex items-center gap-4">
                                    <div className="w-12 h-16 rounded-xl overflow-hidden border border-white/10 shrink-0">
                                        <img src={sanitizeCoverUrl(action.coverUrl || '')} className="w-full h-full object-cover" alt="" />
                                    </div>
                                    <button 
                                        onClick={() => navigate(`/manga/${action.mediaId}`)}
                                        className="flex-1 h-12 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/60 hover:bg-primary hover:border-primary hover:text-white transition-all"
                                    >
                                        Execute Action
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 3. Historical Data & Descriptive Charts */}
                <section className="pt-20 border-t border-white/5">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                        <div className="lg:col-span-4 space-y-12">
                            <div className="p-10 rounded-[48px] bg-muted/20 border border-white/5">
                                <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-white/40 mb-10">Archive Maturity</h3>
                                <div className="space-y-8">
                                    {[
                                        { label: 'Completed', value: stats.completed, color: 'bg-green-500' },
                                        { label: 'Reading', value: stats.reading, color: 'bg-primary' },
                                        { label: 'Planning', value: stats.planning, color: 'bg-amber-500' },
                                        { label: 'Dropped', value: stats.dropped, color: 'bg-red-500' }
                                    ].map(item => (
                                        <div key={item.label} className="space-y-3">
                                            <div className="flex justify-between items-end">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-white/60">{item.label}</span>
                                                <span className="text-xl font-black text-white">{item.value}</span>
                                            </div>
                                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                                <div className={`h-full ${item.color}`} style={{ width: `${(item.value / (stats.completed + stats.reading + stats.planning + stats.dropped || 1)) * 100}%` }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-12 pt-8 border-t border-white/5 grid grid-cols-2 gap-4">
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Chapters Read</span>
                                        <span className="text-xl font-black text-white">{stats.totalChaptersRead}</span>
                                    </div>
                                    <div className="flex flex-col text-right">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Episodes Watched</span>
                                        <span className="text-xl font-black text-white">{stats.totalEpisodesWatched}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="lg:col-span-8 p-10 rounded-[48px] bg-white/[0.02] border border-white/5">
                            <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-primary mb-10">Genre Weight Distribution</h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                                {stats.genreStats.slice(0, 6).map(genre => (
                                    <div key={genre.name} className="p-6 bg-white/5 rounded-3xl border border-white/10 hover:border-primary/40 transition-all group">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-4 group-hover:text-primary transition-colors">{genre.name}</p>
                                        <div className="flex items-end gap-2">
                                            <span className="text-3xl font-black text-white">{genre.count}</span>
                                            <span className="text-[10px] font-bold text-white/20 mb-1.5">{genre.percentage}%</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
};

export default Analytics;
