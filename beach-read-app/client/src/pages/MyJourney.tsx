import React, { useState } from 'react';
import { useStats } from '../features/library/hooks/useStats';
import {
    Loader2,
    TrendingUp,
    Target,
    ArrowUpRight,
    BookOpen,
    Wind,
    Compass,
    Play,
    Book,
    PieChart,
    BarChart3,
    Clock,
    Activity,
    Hash,
    Layers,
    Globe2,
    Heart
} from 'lucide-react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { sanitizeCoverUrl } from '../shared/utils/image';
import type { MediaStats, UserStats } from '../shared/types/types';

import { Surface } from '../shared/ui/Surface';

const StatCard: React.FC<{ label: string; value: string | number; subValue?: string; icon?: React.ReactNode; trend?: number }> = ({ label, value, subValue, icon, trend }) => (
    <Surface variant="paper" className="flex flex-col justify-between group h-full">
        <div className="flex items-center justify-between">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">{label}</p>
            {icon && <div className="text-muted-foreground/20 group-hover:text-primary/40 transition-colors">{icon}</div>}
        </div>
        <div className="mt-4 flex items-baseline gap-2">
            <p className="text-3xl font-serif italic text-foreground tracking-tight">{value}</p>
            {subValue && <span className="text-[10px] opacity-40 uppercase font-sans font-bold not-italic">{subValue}</span>}
        </div>
        {trend !== undefined && (
            <div className={`mt-2 text-[9px] font-bold uppercase tracking-widest ${trend >= 0 ? 'text-status-success' : 'text-status-error'}`}>
                {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% trend
            </div>
        )}
    </Surface>
);

const ActivitySparkline: React.FC<{ data: { day: string; count: number }[] }> = ({ data }) => {
    const max = Math.max(...data.map(d => d.count), 1);
    const points = data.map((d, i) => `${(i / (data.length - 1)) * 100},${100 - (d.count / max) * 100}`).join(' ');

    return (
        <div className="h-32 w-full relative group">
            <svg className="h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                <path
                    d={`M ${points}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="text-primary/40 group-hover:text-primary transition-all duration-500"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
                <path
                    d={`M 0,100 L ${points} L 100,100 Z`}
                    fill="currentColor"
                    className="text-primary/5 group-hover:text-primary/10 transition-all duration-500"
                />
            </svg>
            <div className="absolute inset-0 flex items-end justify-between px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {data.map((d, i) => (
                    <div 
                        key={i} 
                        className="w-1 bg-primary/20 hover:bg-primary h-full cursor-help relative"
                        style={{ height: `${(d.count / max) * 100}%` }}
                    >
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-foreground text-background text-[8px] font-bold px-2 py-1 rounded whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity z-20">
                            {d.count} updates on {new Date(d.day).toLocaleDateString()}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const RankedGenreBar: React.FC<{ stats: { name: string; count: number; percentage: number }[] }> = ({ stats }) => (
    <div className="space-y-6">
        {stats.slice(0, 8).map((genre, idx) => (
            <div key={genre.name} className="group flex items-center gap-4">
                <span className="text-[8px] font-bold text-muted-foreground/40 w-4">0{idx + 1}</span>
                <div className="flex-1 space-y-1.5">
                    <div className="flex justify-between items-end">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-foreground group-hover:text-primary transition-colors">{genre.name}</span>
                        <span className="text-[9px] font-serif italic text-muted-foreground/60">{genre.count} items</span>
                    </div>
                    <div className="h-1 w-full bg-muted/30 rounded-full overflow-hidden">
                        <div 
                            className="h-full bg-primary/40 group-hover:bg-primary transition-all duration-700 ease-out" 
                            style={{ width: `${genre.percentage}%` }} 
                        />
                    </div>
                </div>
            </div>
        ))}
    </div>
);

const QualityDistribution: React.FC<{ distribution: { bucket: number; count: number }[]; mean: number }> = ({ distribution, mean }) => {
    const maxCount = Math.max(...distribution.map(b => b.count), 1);
    
    return (
        <div className="space-y-8">
            <div className="relative h-48 flex items-end gap-1 px-2">
                {/* Mean Line */}
                <div 
                    className="absolute top-0 bottom-0 w-px border-l border-dashed border-primary/40 z-10 flex flex-col items-center"
                    style={{ left: `${(mean / 100) * 100}%` }}
                >
                    <span className="absolute -top-6 text-[8px] font-bold uppercase tracking-widest text-primary bg-background px-2">Avg {mean}</span>
                </div>

                {distribution.map((bucket) => (
                    <div key={bucket.bucket} className="flex-1 flex flex-col items-center gap-3 group h-full">
                        <div className="w-full bg-muted/20 rounded-t-lg relative border-x border-t border-border/10 group-hover:bg-muted/40 transition-colors h-full">
                            <div 
                                className="absolute bottom-0 left-0 w-full bg-primary/40 rounded-t-md transition-all duration-700 group-hover:bg-primary/60" 
                                style={{ height: `${(bucket.count / maxCount) * 100}%` }}
                            />
                            {/* Tooltip */}
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-foreground text-background text-[8px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20 shadow-xl">
                                {bucket.count} Titles ({Math.round((bucket.count / distribution.reduce((a,b) => a+b.count, 0)) * 100)}%)
                            </div>
                        </div>
                        <span className="text-[8px] font-bold text-muted-foreground/40">{bucket.bucket}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

const DistributionBar: React.FC<{ label: string; count: number; percentage: number; color?: string }> = ({ label, count, percentage, color = 'bg-primary' }) => (
    <div className="space-y-2">
        <div className="flex justify-between items-end">
            <div className="flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-foreground">{label}</span>
                <span className="text-[9px] font-medium text-muted-foreground/60">{count} Entries</span>
            </div>
            <span className="text-xs font-serif italic text-foreground">{percentage}%</span>
        </div>
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden border border-border/10">
            <div className={`h-full ${color} transition-all duration-1000 ease-out`} style={{ width: `${percentage}%` }} />
        </div>
    </div>
);

const MediaStatsSection: React.FC<{ stats: MediaStats; title: string; icon: React.ReactNode; type: 'ANIME' | 'MANGA' }> = ({ stats, title, icon, type }) => (
    <div className="space-y-16">
        {/* Section Header */}
        <div className="flex items-center gap-6 border-b border-border/40 pb-8">
            <div className="p-4 bg-card border border-border/40 rounded-2xl text-primary shadow-sm">
                {icon}
            </div>
            <div>
                <h3 className="text-3xl font-serif italic text-foreground leading-none mb-2">{title} Analysis</h3>
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted-foreground/60">Historical Archive Metrics</p>
            </div>
        </div>

        {/* Primary Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            <StatCard label={`Total ${title}`} value={stats.count} icon={<Hash size={14} />} />
            <StatCard 
                label={type === 'ANIME' ? "Episodes" : "Chapters"} 
                value={stats.totalUnits} 
                icon={<Activity size={14} />} 
            />
            {type === 'MANGA' ? (
                <StatCard label="Volumes" value={stats.totalVolumesRead || 0} icon={<Layers size={14} />} />
            ) : (
                <StatCard label="Days Watched" value={stats.daysWatched || 0} subValue="Days" icon={<Clock size={14} />} />
            )}
            <StatCard 
                label={type === 'ANIME' ? "Days Planned" : "Chapters Planned"} 
                value={type === 'ANIME' ? (stats.daysPlanned || 0) : (stats.unitsPlanned || 0)} 
                subValue={type === 'ANIME' ? "Days" : ""}
                icon={<Target size={14} />} 
            />
            <StatCard label="Mean Score" value={stats.meanScore} icon={<TrendingUp size={14} />} />
            <StatCard label="Std. Deviation" value={stats.standardDeviation} icon={<Wind size={14} />} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            {/* Status & Genre Comparison */}
            <Surface variant="paper" className="lg:col-span-5 flex flex-col gap-12">
                <div className="space-y-10">
                    <div className="flex items-center gap-3">
                        <PieChart className="w-4 h-4 text-primary/40" />
                        <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Status Balance</h4>
                    </div>
                    <div className="space-y-8">
                        {stats.statusDistribution.sort((a, b) => b.count - a.count).map(item => (
                            <DistributionBar 
                                key={item.status} 
                                label={item.status.replace(/_/g, ' ')} 
                                count={item.count} 
                                percentage={item.percentage} 
                                color={
                                    item.status === 'COMPLETED' ? 'bg-status-success' :
                                    item.status === 'READING' || item.status === 'CURRENT' ? 'bg-status-info' :
                                    item.status === 'DROPPED' ? 'bg-status-error' : 'bg-neutral-300'
                                }
                            />
                        ))}
                    </div>
                </div>

                <div className="pt-10 border-t border-border/10 space-y-10">
                    <div className="flex items-center gap-3">
                        <Wind className="w-4 h-4 text-primary/40" />
                        <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Thematic Thread Affinity</h4>
                    </div>
                    <RankedGenreBar stats={stats.genreStats} />
                </div>
            </Surface>

            {/* Quality and Formatting */}
            <div className="lg:col-span-7 space-y-12">
                <Surface variant="paper" className="space-y-10">
                    <div className="flex items-center gap-3">
                        <TrendingUp className="w-4 h-4 text-primary/40" />
                        <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Score Quality Distribution</h4>
                    </div>
                    <QualityDistribution distribution={stats.scoreDistribution} mean={stats.meanScore} />
                </Surface>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <Surface variant="paper" className="space-y-10">
                        <div className="flex items-center gap-3">
                            <BarChart3 className="w-4 h-4 text-primary/40" />
                            <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Format Breakdown</h4>
                        </div>
                        <div className="space-y-6">
                            {stats.formatDistribution.sort((a, b) => b.count - a.count).slice(0, 5).map(item => (
                                <DistributionBar 
                                    key={item.format} 
                                    label={item.format} 
                                    count={item.count} 
                                    percentage={item.percentage} 
                                />
                            ))}
                        </div>
                    </Surface>

                    <Surface variant="paper" className="space-y-10">
                        <div className="flex items-center gap-3">
                            <Globe2 className="w-4 h-4 text-primary/40" />
                            <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Regional Origins</h4>
                        </div>
                        <div className="space-y-6">
                            {stats.countryDistribution && stats.countryDistribution.length > 0 ? (
                                stats.countryDistribution.slice(0, 5).map((item, idx) => (
                                    <DistributionBar 
                                        key={item.country} 
                                        label={item.country} 
                                        count={item.count} 
                                        percentage={item.percentage} 
                                        color={idx === 0 ? 'bg-primary' : idx === 1 ? 'bg-primary/60' : 'bg-primary/30'}
                                    />
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full py-10 opacity-20">
                                    <Globe2 className="w-8 h-8 mb-2" />
                                    <p className="text-[10px] font-bold uppercase tracking-widest">Global data missing</p>
                                </div>
                            )}
                        </div>
                    </Surface>
                </div>
            </div>
        </div>
    </div>
);

const Analytics: React.FC<{ stats?: UserStats }> = ({ stats: propStats }) => {
    const { stats: hookStats, loading } = useStats();
    const stats = propStats || hookStats;
    const navigate = useNavigate();
    const location = useLocation();
    const [activeSection, setActiveSection] = useState<'overview' | 'anime' | 'manga'>('overview');

    const isStandalone = location.pathname === '/stats' || location.pathname === '/analytics';
    const isPublicView = !!propStats;

    if (loading && !propStats) {
        return (
            <div className={`flex min-h-[400px] items-center justify-center ${isStandalone ? 'bg-background' : ''}`}>
                <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div className={`w-full space-y-16 pb-20 ${isStandalone ? 'min-h-screen bg-background px-6 md:px-[64px] pt-[120px]' : ''}`}>
            {/* Header */}
            {!isPublicView && (
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
                    <div className="space-y-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-muted-foreground">Reflective Analytics</p>
                        <h1 className="text-4xl md:text-7xl font-serif italic text-foreground leading-tight tracking-tighter">Library Insights</h1>
                    </div>
                    
                    <div className="flex bg-card border border-border/40 rounded-full p-1.5 shadow-sm">
                        {(['overview', 'anime', 'manga'] as const).map((section) => (
                            <button
                                key={section}
                                onClick={() => setActiveSection(section)}
                                className={`px-10 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                                    activeSection === section 
                                    ? 'bg-primary text-primary-foreground shadow-md' 
                                    : 'text-muted-foreground hover:bg-muted'
                                }`}
                            >
                                {section}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {isPublicView && (
                <div className="flex justify-center mb-12">
                    <div className="flex bg-card border border-border/40 rounded-full p-1.5 shadow-sm">
                        {(['overview', 'anime', 'manga'] as const).map((section) => (
                            <button
                                key={section}
                                onClick={() => setActiveSection(section)}
                                className={`px-10 py-3 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${
                                    activeSection === section 
                                    ? 'bg-primary text-primary-foreground shadow-md' 
                                    : 'text-muted-foreground hover:bg-muted'
                                }`}
                            >
                                {section}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {activeSection === 'overview' && (
                <div className="space-y-24">
                    {/* Top Row: Activity & KPIs */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <Surface variant="paper" className="lg:col-span-8 flex flex-col justify-between">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground mb-1">Activity Pulse</h4>
                                    <p className="text-xs text-muted-foreground/60 italic font-serif">Updates across the archive (last 30 days)</p>
                                </div>
                                <Activity className="w-5 h-5 text-primary/20" />
                            </div>
                            <ActivitySparkline data={stats.readingVelocity || []} />
                        </Surface>
                        <div className="lg:col-span-4 flex flex-col gap-6">
                            <div className="grid grid-cols-2 gap-6">
                                <StatCard label="Mean Score" value={stats.meanScore} icon={<TrendingUp size={14} />} />
                                <StatCard label="Hoarding" value={stats.hoardingRatio || 0} icon={<Compass size={14} />} />
                            </div>
                            
                            {/* Practical Health Card */}
                            <Surface variant="muted" className="border-border/10 flex-1 flex flex-col justify-between">
                                <div className="space-y-4">
                                    <h4 className="text-[9px] font-bold uppercase tracking-[0.3em] text-muted-foreground/60">Library Health</h4>
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-[8px] font-bold uppercase text-muted-foreground/40 mb-1">Completion</p>
                                                <p className="text-xl font-serif italic text-foreground">{stats.completionRatio}%</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[8px] font-bold uppercase text-muted-foreground/40 mb-1">Time Invested</p>
                                                <p className="text-xl font-serif italic text-foreground">{stats.totalHours}h</p>
                                            </div>
                                        </div>
                                        <div className="h-1 w-full bg-background/50 rounded-full overflow-hidden">
                                            <div className="h-full bg-primary/40" style={{ width: `${stats.completionRatio}%` }} />
                                        </div>
                                    </div>
                                </div>
                                
                                {stats.stalledTitles && stats.stalledTitles > 0 ? (
                                    <div className="mt-8 pt-4 border-t border-border/10">
                                        <p className="text-[9px] font-bold uppercase tracking-widest text-status-error/60 flex items-center gap-2">
                                            <Activity size={10} /> {stats.stalledTitles} Stalled Journeys
                                        </p>
                                    </div>
                                ) : null}
                            </Surface>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                        {/* Status Balance */}
                        <Surface variant="paper" className="lg:col-span-5 flex flex-col gap-12">
                            <div className="flex items-center gap-3">
                                <PieChart className="w-4 h-4 text-primary/40" />
                                <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Status Balance</h4>
                            </div>
                            <div className="space-y-10">
                                {[
                                    { label: 'Completed', count: stats.completed, color: 'bg-status-success' },
                                    { label: 'Reading', count: stats.reading, color: 'bg-status-info' },
                                    { label: 'Planning', count: stats.planning, color: 'bg-neutral-300' },
                                    { label: 'Dropped', count: stats.dropped, color: 'bg-status-error' },
                                ].map((item) => {
                                    const total = (stats.completed + stats.reading + stats.planning + stats.dropped + stats.paused) || 1;
                                    const percentage = Number(((item.count / total) * 100).toFixed(1));
                                    return (
                                        <DistributionBar 
                                            key={item.label} 
                                            label={item.label} 
                                            count={item.count} 
                                            percentage={percentage} 
                                            color={item.color} 
                                        />
                                    );
                                })}
                            </div>

                            <div className="pt-10 border-t border-border/10 space-y-10">
                                <div className="flex items-center gap-3">
                                    <Wind className="w-4 h-4 text-primary/40" />
                                    <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Global Genre Affinity</h4>
                                </div>
                                <RankedGenreBar stats={stats.genreStats} />
                            </div>
                        </Surface>

                        {/* Archive Quality and Maturity */}
                        <div className="lg:col-span-7 space-y-12">
                            <Surface variant="paper" className="space-y-12">
                                <div className="flex items-center gap-3">
                                    <TrendingUp className="w-4 h-4 text-primary/40" />
                                    <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Archive Quality Distribution</h4>
                                </div>
                                <QualityDistribution distribution={stats.scoreDistribution} mean={stats.meanScore} />
                            </Surface>

                            <div className="grid grid-cols-2 gap-8">
                                <Surface variant="paper" withPadding={false} className="p-8 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-muted/20 rounded-xl text-primary/40">
                                            <Clock size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Archive Maturity</h4>
                                            <p className="text-xl font-serif italic text-foreground">{stats.archiveMaturity}</p>
                                        </div>
                                    </div>
                                </Surface>
                                <Surface variant="paper" withPadding={false} className="p-8 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-muted/20 rounded-xl text-status-error/40">
                                            <Heart size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Favorites</h4>
                                            <p className="text-xl font-serif italic text-foreground">{stats.favorites || 0}</p>
                                        </div>
                                    </div>
                                </Surface>
                            </div>

                            {/* Insight Text */}
                            <Surface variant="muted" className="border-primary/10">
                                <p className="text-sm text-primary/80 italic font-serif leading-relaxed">
                                    "Your archive shows a <span className="font-bold">{stats.profileType.toLowerCase()}</span> profile. 
                                    {stats.highestRatedGenre ? ` You have a particular affinity for ${stats.highestRatedGenre.name}, which you rate at ${stats.highestRatedGenre.score} on average.` : ''}
                                    {stats.hoardingRatio && stats.hoardingRatio > 2 ? ' Consider spending more time in your planning list to reduce your hoarding ratio.' : ''}"
                                </p>
                            </Surface>
                        </div>
                    </div>

                    {isPublicView && stats.archiveMaturity && (
                        <div className="p-10 bg-card border border-border/40 rounded-[32px] shadow-sm flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="p-4 bg-muted/20 rounded-2xl">
                                    <Clock className="w-6 h-6 text-primary/40" />
                                </div>
                                <div>
                                    <h4 className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground mb-1">Archive Maturity</h4>
                                    <p className="text-sm text-muted-foreground/60 italic font-serif leading-relaxed">Historical depth of this personal sanctuary.</p>
                                </div>
                            </div>
                            <p className="text-5xl font-serif italic text-foreground tracking-tighter">{stats.archiveMaturity}</p>
                        </div>
                    )}

                    {/* Discovery Path (Recommended Actions) */}
                    {!isPublicView && stats.recommendedActions && stats.recommendedActions.length > 0 && (
                        <section className="space-y-12">
                            <div className="flex items-center gap-6">
                                <div className="p-3 bg-primary/10 rounded-xl text-primary">
                                    <Compass size={20} />
                                </div>
                                <h2 className="text-3xl font-serif italic text-foreground tracking-tight">Discovery Path</h2>
                                <div className="h-px flex-1 bg-border/20" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {stats.recommendedActions?.map((action) => (
                                    <div key={action.id} className="group relative bg-card border border-border/40 rounded-[32px] p-8 flex flex-col hover:shadow-xl transition-all duration-500">
                                        <div className="flex items-start justify-between mb-8">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                                                action.type === 'FINISH_QUICKLY' ? 'bg-muted text-muted-foreground' :
                                                action.type === 'STALLED_FAVORITE' ? 'bg-status-error/10 text-status-error' :
                                                'bg-status-info/10 text-status-info'
                                            }`}>
                                                {action.type === 'FINISH_QUICKLY' ? <Target size={20} /> :
                                                    action.type === 'STALLED_FAVORITE' ? <TrendingUp size={20} /> :
                                                        <BookOpen size={20} />}
                                            </div>
                                            <Link to={`/manga/${action.mediaId}`} className="p-2.5 rounded-full text-muted-foreground/40 hover:text-primary hover:bg-primary/5 transition-all">
                                                <ArrowUpRight size={20} />
                                            </Link>
                                        </div>

                                        <div className="flex-1">
                                            <h3 className="text-xl font-serif italic text-foreground mb-2 line-clamp-1">{action.title}</h3>
                                            <p className="text-[11px] text-muted-foreground/60 font-bold uppercase tracking-wider leading-relaxed italic">{action.description}</p>
                                        </div>

                                        <div className="mt-8 flex items-center gap-4 pt-6 border-t border-border/10">
                                            <div className="w-10 h-14 rounded-xl overflow-hidden border border-border/40 shrink-0 shadow-sm transition-transform group-hover:scale-105">
                                                <img src={sanitizeCoverUrl(action.coverUrl || '')} className="w-full h-full object-cover" alt="" />
                                            </div>
                                            <button
                                                onClick={() => navigate(`/manga/${action.mediaId}`)}
                                                className="flex-1 h-12 bg-muted/40 border border-border/40 rounded-2xl text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
                                            >
                                                View Memory
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>
            )}

            {activeSection === 'anime' && stats.animeStats && (
                <MediaStatsSection stats={stats.animeStats} title="Anime" icon={<Play size={24} fill="currentColor" />} type="ANIME" />
            )}

            {activeSection === 'manga' && stats.mangaStats && (
                <MediaStatsSection stats={stats.mangaStats} title="Manga" icon={<Book size={24} />} type="MANGA" />
            )}
        </div>
    );
};

export default Analytics;
