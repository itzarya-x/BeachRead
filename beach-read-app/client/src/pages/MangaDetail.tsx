import { useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../features/auth/context/auth-context';
import { useLibrary } from '../features/library/hooks/useLibrary';
import { parseSeriesId } from '../features/library/utils/libraryTransformers';
import { 
    BookOpen, 
    Bookmark, 
    Check, 
    Heart, 
    Share2, 
    Star, 
    Wind,
    Activity,
    Layers,
    Hash,
    Tv,
    Zap,
    Users,
    Globe,
    ExternalLink
} from 'lucide-react';
import { handleCoverImageError, sanitizeCoverUrl } from '../shared/utils/image';
import { MangaDetailSkeleton } from '../shared/ui/PageSkeletons';
import { Tabs } from '../shared/ui/Tabs';
import { useToast } from '../app/providers/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import { FastActionSurface } from '../features/manga/components/FastActionSurface';
import { Surface } from '../shared/ui/Surface';
import { Button } from '../shared/ui/Button';
import { Skeleton } from '../shared/ui/Skeleton';
import { useMediaDetailQuery } from '../features/manga/hooks/useMediaQuery';

export function MangaDetail() {
    const { id } = useParams<{ id: string }>();
    const [searchParams, setSearchParams] = useSearchParams();
    const [isImageLoaded, setIsImageLoaded] = useState(false);
    const [editingSource, setEditingSource] = useState(false);
    
    const { data: manga, isLoading, error } = useMediaDetailQuery(id);
    
    const activeTab = searchParams.get('tab') || 'overview';
    const handleTabChange = (tab: string) => {
        setSearchParams({ tab }, { replace: true });
    };
    
    const { user } = useAuth();
    const { library, addToLibrary, removeFromLibrary, toggleFavourite, updateLibraryItem } = useLibrary();
    const { showToast } = useToast();

    const libraryItem = library.find(item => 
        item.id === id || String(parseSeriesId(item.id)) === String(parseSeriesId(id || ''))
    );
    const isInLibrary = !!libraryItem;
    const isFavourite = libraryItem?.isFavourite || false;

    const handleFavouriteToggle = async () => {
        if (!user) {
            window.location.href = '/login';
            return;
        }

        if (!isInLibrary) {
            if (!manga) return;
            await addToLibrary({
                id: manga.id,
                title: manga.title,
                coverUrl: manga.coverUrl,
                genres: manga.genres,
                mediaType: manga.type,
                isFavourite: true
            });
            showToast(`Added ${manga.title} to your archive`, 'success');
        } else {
            await toggleFavourite(libraryItem!.id);
            showToast(isFavourite ? 'Removed from cherished collection' : 'Added to cherished collection', 'success');
        }
    };

    const handleLibraryToggle = async () => {
        if (!user) {
            window.location.href = '/login';
            return;
        }

        if (isInLibrary) {
            await removeFromLibrary(libraryItem!.id);
            showToast('Removed from archive', 'info');
        } else {
            if (!manga) return;
            await addToLibrary({
                id: manga.id,
                title: manga.title,
                coverUrl: manga.coverUrl,
                genres: manga.genres,
                mediaType: manga.type
            });
            showToast('Catalogued in your sanctuary', 'success');
        }
    };

    const handleReadClick = () => {
        if (!manga) return;
        if (manga.type === 'ANIME') {
            window.open(`https://www.google.com/search?q=${encodeURIComponent(manga.title + ' watch online')}`, '_blank');
        } else {
            window.open(`https://www.google.com/search?q=${encodeURIComponent(manga.title + ' read online')}`, '_blank');
        }
    };

    const handleSaveSource = async () => {
        setEditingSource(false);
        showToast('Reading source preserved', 'success');
    };

    if (isLoading) return <MangaDetailSkeleton />;
    if (error || !manga) return <div className="p-20 text-center text-destructive font-serif italic">{(error as any)?.message || 'Media not found'}</div>;

    return (
        <div className="relative w-full bg-background min-h-screen pb-20 overflow-x-hidden selection:bg-muted-foreground selection:text-white">
            {/* Dynamic Themed Background */}
            <div 
                className="fixed inset-0 z-0 opacity-10 pointer-events-none transition-all duration-[2000ms] scale-110 blur-[100px]"
                style={{ 
                    backgroundImage: `url(${sanitizeCoverUrl(manga.coverUrl)})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            />
            <div className="fixed inset-0 z-0 bg-background/50 pointer-events-none" />

            {/* HERO BANNER */}
            <div className="relative h-[35vh] w-full overflow-hidden">
                <div
                    className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-[2000ms] hover:scale-105"
                    style={{ backgroundImage: `url(${sanitizeCoverUrl(manga.bannerUrl || manga.coverUrl)})` }}
                />
            </div>

            {/* MAIN CONTENT */}
            <div className="max-w-[1400px] mx-auto px-8 md:px-[64px] relative z-20 -mt-32">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                    
                    {/* INFO SIDEBAR (Now on Left, span 3) */}
                    <div className="lg:col-span-3 space-y-10 order-1 lg:order-1">
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1], delay: 0.1 }}
                            className="relative aspect-[2/3] w-full rounded-[40px] overflow-hidden shadow-2xl border border-white/10 group bg-muted/20"
                        >
                            <AnimatePresence>
                                {!isImageLoaded && (
                                    <Skeleton className="absolute inset-0 z-0 h-full w-full rounded-none" />
                                )}
                            </AnimatePresence>
                            <motion.img 
                                layoutId={`media-image-${id}`}
                                src={sanitizeCoverUrl(manga.coverUrl)} 
                                onError={handleCoverImageError} 
                                onLoad={() => setIsImageLoaded(true)}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: isImageLoaded ? 1 : 0 }}
                                transition={{ duration: 0.5 }}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                                alt={manga.title} 
                            />
                        </motion.div>

                        <FastActionSurface
                            id={id!}
                            title={manga.title}
                            coverUrl={manga.coverUrl}
                            genres={manga.genres}
                            mediaType={manga.type}
                        />

                        <div className="grid grid-cols-1 gap-4 pt-6 border-t border-border/20">
                            <Surface variant="glass" className="p-6 text-left rounded-[24px]">
                                <div className="flex items-center gap-2 text-primary mb-2">
                                    <Star size={16} fill="currentColor" strokeWidth={3} />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Refined Score</span>
                                </div>
                                <div className="text-3xl font-serif italic tracking-tighter text-foreground">{manga.stats.score.toFixed(1)}</div>
                            </Surface>
                            <Surface variant="glass" className="p-6 text-left rounded-[24px]">
                                <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                    <Users size={16} strokeWidth={3} />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Popularity</span>
                                </div>
                                <div className="text-3xl font-serif italic tracking-tighter text-foreground">{manga.stats.popularity.toLocaleString()}</div>
                            </Surface>
                        </div>

                        <div className="space-y-6 pt-6 border-t border-border/20 px-2">
                            {[
                                { label: 'Format', value: manga.type, icon: Layers },
                                { label: 'Status', value: manga.status, icon: Zap },
                                { label: 'Runtime', value: manga.episodes || '—', show: manga.type === 'ANIME', icon: Tv },
                                { label: 'Volumes', value: manga.chapters || '—', show: manga.type !== 'ANIME', icon: BookOpen },
                                { label: 'My Journey', value: libraryItem ? `${libraryItem.status} • ${libraryItem.progress || 0}` : 'Uncatalogued', icon: Activity },
                            ].map((item, i) => (item.show !== false && (
                                <div key={i} className="flex justify-between items-center group">
                                    <div className="flex items-center gap-3">
                                        <item.icon size={12} className="text-muted-foreground/40 group-hover:text-primary transition-colors" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 group-hover:text-primary transition-colors">{item.label}</span>
                                    </div>
                                    <span className={`text-[11px] font-black uppercase tracking-tight ${item.label === 'My Journey' && libraryItem ? 'text-primary' : 'text-foreground'}`}>{item.value}</span>
                                </div>
                            )))}
                        </div>

                        {/* Stored Source UI */}
                        {isInLibrary && (
                            <div className="pt-6 border-t border-foreground/5 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-primary">
                                        <Globe size={14} />
                                        <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Reading Sanctuary</span>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (editingSource) handleSaveSource();
                                            else setEditingSource(true);
                                        }}
                                        className="text-[10px] font-black uppercase tracking-widest text-primary hover:opacity-80 transition-opacity"
                                        aria-label={editingSource ? "Save source" : "Edit source"}
                                    >
                                        {editingSource ? 'Preserve' : 'Relocate'}
                                    </button>
                                </div>
                                <div className={`p-4 rounded-xl border transition-all ${editingSource ? 'bg-background border-primary/40 shadow-lg' : 'bg-muted/10 border-border/40'}`}>
                                    {editingSource ? (
                                        <input 
                                            autoFocus
                                            className="w-full bg-transparent text-xs outline-none font-serif italic text-foreground"
                                            placeholder="Enter portal URL..."
                                            onKeyDown={e => e.key === 'Enter' && handleSaveSource()}
                                        />
                                    ) : (
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-serif italic text-muted-foreground truncate max-w-[180px]">Default External Portal</span>
                                            <ExternalLink size={12} className="text-muted-foreground/40" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* DESCRIPTION & CHAPTERS (Now on Right, span 9) */}
                    <div className="lg:col-span-9 flex flex-col pt-8 lg:pt-0 order-2 lg:order-2">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="space-y-8"
                        >
                            <div className="space-y-4">
                                <motion.h1 
                                    layoutId={`media-title-${id}`}
                                    className="text-4xl md:text-6xl font-serif italic text-foreground tracking-tight leading-none text-left"
                                >
                                    {manga.title}
                                </motion.h1>
                                <p className="text-lg md:text-xl font-light tracking-[0.15em] text-foreground/40 leading-none text-left uppercase">{manga.titleJp}</p>

                                <div className="flex flex-wrap items-center gap-4 pt-4">
                                    <Button onClick={handleReadClick} variant="primary" className="rounded-full px-8 py-4 text-[11px] font-black">
                                        {manga.type === 'ANIME' ? <Tv size={18} className="mr-3" /> : <BookOpen size={18} className="mr-3" />}
                                        {manga.type === 'ANIME' ? 'Resume Reflection' : 'Enter Archive'}
                                    </Button>

                                    <Button onClick={handleLibraryToggle} variant={isInLibrary ? 'secondary' : 'outline'} className="rounded-full px-8 py-4 text-[11px] font-black">
                                        {isInLibrary ? <Check size={18} className="mr-3" /> : <Bookmark size={18} className="mr-3" />}
                                        {isInLibrary ? 'Catalogued' : 'Add to Collection'}
                                    </Button>

                                    <Button onClick={handleFavouriteToggle} variant={isFavourite ? 'warm' : 'outline'} size="icon" className="h-14 w-14 rounded-full border-2">
                                        <Heart size={22} fill={isFavourite ? "currentColor" : "none"} strokeWidth={2.5} />
                                    </Button>

                                    <Button variant="outline" size="icon" aria-label="Share" className="h-14 w-14 rounded-full border-2">
                                        <Share2 size={18} strokeWidth={2.5} />
                                    </Button>
                                </div>
                            </div>

                            <section className="animate-in fade-in duration-700">
                                <div className="flex items-center gap-4 mb-6">
                                    <h3 className="text-[11px] font-bold uppercase tracking-[0.4em] text-primary flex items-center gap-2">
                                        <Layers size={14} /> Synopsis
                                    </h3>
                                    <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
                                </div>
                                <p className="text-foreground/70 leading-[1.8] text-base md:text-lg font-medium max-w-[750px] text-left italic font-serif">
                                    {manga.description}
                                </p>
                            </section>

                            <Tabs
                                tabs={[
                                    { id: 'overview', label: 'Overview' },
                                    { id: 'journal', label: 'Journal' },
                                    { id: 'chapters', label: manga.type === 'ANIME' ? 'Episodes' : 'Chapters' },
                                ]}
                                activeTab={activeTab}
                                onTabChange={handleTabChange}
                                className="mb-10"
                            />

                            <div className="min-h-[400px]">
                                <AnimatePresence mode="wait">
                                    {activeTab === 'overview' && (
                                        <motion.div 
                                            key="overview"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="space-y-16"
                                        >
                                            <div className="flex flex-wrap gap-2">
                                                {manga.genres.map((g: string) => (
                                                    <span key={g} className="px-5 py-2.5 bg-muted/10 border border-border/40 rounded-full text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 hover:text-primary hover:border-primary/40 transition-all cursor-default flex items-center gap-2">
                                                        <Hash size={10} /> {g}
                                                    </span>
                                                ))}
                                            </div>

                                            {manga.relations && manga.relations.length > 0 && (
                                                <section>
                                                    <div className="flex items-center gap-4 mb-10">
                                                        <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-primary flex items-center gap-2">
                                                            <Wind size={14} /> Franchise Connections
                                                        </h3>
                                                        <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
                                                    </div>
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-6">
                                                        {manga.relations.map((rel: any, idx: number) => (
                                                            <motion.div key={rel.id} whileHover={{ y: -4 }} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: idx * 0.05 }} className="space-y-3 group">

                                                                <Link to={`/manga/${rel.id}`} className="block relative aspect-[2/3] overflow-hidden rounded-[24px] border border-border/40 shadow-sm group-hover:shadow-xl transition-all duration-500">
                                                                    <img src={sanitizeCoverUrl(rel.coverUrl)} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
                                                                    <div className="absolute inset-x-0 bottom-0 p-3 bg-black/60 backdrop-blur-md border-t border-white/10">
                                                                        <p className="text-[8px] font-black uppercase text-white tracking-widest">{rel.relationType}</p>
                                                                    </div>
                                                                </Link>
                                                                <p className="text-[10px] font-black text-foreground line-clamp-1 uppercase tracking-tight opacity-70 group-hover:opacity-100 group-hover:text-primary transition-all">{rel.title}</p>
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                </section>
                                            )}
                                            {manga.characters && manga.characters.length > 0 && (
                                                <section>
                                                    <div className="flex items-center gap-4 mb-10">
                                                        <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-primary flex items-center gap-2">
                                                            <Users size={14} /> Notable Figures
                                                        </h3>
                                                        <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
                                                    </div>
                                                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-6">
                                                        {manga.characters.map((char: any, idx: number) => (
                                                            <motion.div 
                                                                key={char.id} 
                                                                whileHover={{ y: -4 }} 
                                                                initial={{ opacity: 0 }} 
                                                                animate={{ opacity: 1 }} 
                                                                transition={{ delay: idx * 0.05 }} 
                                                                className="space-y-3 group"
                                                            >
                                                                <Link to={`/character/${char.id}`} className="block relative aspect-[3/4] overflow-hidden rounded-[24px] border border-border/40 shadow-sm group-hover:shadow-xl transition-all duration-500">
                                                                    <img src={sanitizeCoverUrl(char.image)} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" alt={char.name} />
                                                                    <div className="absolute inset-x-0 bottom-0 p-3 bg-black/60 backdrop-blur-md border-t border-white/10 text-center">
                                                                        <p className="text-[8px] font-black uppercase text-white tracking-widest">{char.role}</p>
                                                                    </div>
                                                                </Link>
                                                                <p className="text-[10px] font-black text-foreground line-clamp-1 uppercase tracking-tight opacity-70 group-hover:opacity-100 group-hover:text-primary transition-all text-center">{char.name}</p>
                                                            </motion.div>
                                                        ))}
                                                    </div>
                                                </section>
                                            )}
                                        </motion.div>
                                    )}

                                    {activeTab === 'chapters' && (
                                        <motion.section 
                                            key="chapters"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="space-y-6"
                                        >
                                            <div className="flex items-center justify-between mb-8">
                                                <div className="space-y-1 text-left">
                                                    <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-primary flex items-center gap-2">
                                                        <Activity size={14} /> Release Chronicle
                                                    </h3>
                                                    <p className="text-[9px] text-muted-foreground font-black uppercase tracking-widest ml-6">Available Transmissions</p>
                                                </div>
                                            </div>

                                            <div className="grid gap-4">
                                                {Array.from({ length: 12 }).map((_, i) => {
                                                    const idx = i + 1;
                                                    const isRead = libraryItem && libraryItem.progress >= idx;
                                                    return (
                                                        <motion.div
                                                            key={idx}
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: i * 0.02 }}
                                                        >
                                                            <Surface
                                                                variant="muted"
                                                                withPadding={false}
                                                                onClick={() => {
                                                                    if (isInLibrary) updateLibraryItem(id!, { progress: idx });
                                                                }}
                                                                className={`p-6 flex items-center justify-between transition-all group cursor-pointer rounded-[24px] border-2 ${
                                                                    isRead ? 'bg-primary/5 border-primary/20' : 'hover:border-primary/20 border-transparent'
                                                                }`}
                                                            >
                                                                <div className="flex items-center gap-6">
                                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-[12px] font-black transition-colors ${
                                                                        isRead ? 'bg-primary text-white shadow-lg' : 'bg-muted/40 text-muted-foreground group-hover:text-primary'
                                                                    }`}>
                                                                        {idx.toString().padStart(2, '0')}
                                                                    </div>
                                                                    <div className="text-left">
                                                                        <p className={`text-sm font-black uppercase tracking-widest transition-colors ${
                                                                            isRead ? 'text-foreground' : 'text-foreground/60 group-hover:text-primary'
                                                                        }`}>
                                                                            {manga.type === 'ANIME' ? 'Episode' : 'Chapter'} {idx}
                                                                        </p>
                                                                        <p className="text-[9px] text-muted-foreground font-black uppercase tracking-[0.2em] mt-1">Verified Transmission · EN</p>
                                                                    </div>
                                                                </div>
                                                                <div className="opacity-0 group-hover:opacity-100 transition-all">
                                                                    <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-primary/10" aria-label="Mark as read">
                                                                        <Check size={16} strokeWidth={3} className={isRead ? 'text-primary' : 'text-muted-foreground'} />
                                                                    </Button>
                                                                </div>
                                                            </Surface>
                                                        </motion.div>
                                                    );
                                                })}
                                            </div>
                                        </motion.section>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            {/* RELATED TITLES LANE */}
            <div className="max-w-[1400px] mx-auto px-8 md:px-[64px] border-t border-border/40 pt-20 mt-20">
                <div className="flex items-center gap-4 mb-12">
                    <h3 className="text-[11px] font-bold uppercase tracking-[0.3em] text-primary">Related Echoes</h3>
                    <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
                </div>
                <Surface variant="muted" className="flex items-center justify-center py-32 border-dashed border-2 opacity-50">
                    <div className="text-center space-y-4">
                        <Wind className="w-10 h-10 text-muted-foreground mx-auto animate-pulse" />
                        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">Recommendation Engine Offline</p>
                    </div>
                </Surface>
            </div>
        </div>
    );
}

export default MangaDetail;
