import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { publicApiClient } from '../lib/apiClient';
import { useAuth } from '../context/auth-context';
import { useLibrary } from '../hooks/useLibrary';
import { supabase } from '../lib/supabaseClient';
import type { MediaDetail } from '../lib/types';
import { ArrowLeft, Star, BookOpen, Clock, Globe, Bookmark, Share2, Loader2, Play, Check, ChevronRight, Heart, MoreHorizontal } from 'lucide-react';
import { handleCoverImageError, sanitizeCoverUrl } from '../lib/image';
import { FastActionSurface } from '../components/manga/FastActionSurface';

export default function MediaDetailView() {
    const { id } = useParams<{ id: string }>();
    const { user } = useAuth();
    const { library, addToLibrary, removeFromLibrary, updateLibraryItem } = useLibrary();
    const [manga, setManga] = useState<MediaDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showFastActions, setShowFastActions] = useState(false);
    const [notes, setNotes] = useState<any[]>([]);
    const [noteLoading, setNoteLoading] = useState(false);
    const [emotionTags, setEmotionTags] = useState<string[]>([]);

    const libraryItem = library.find(item => item.id === id);
    const isInLibrary = !!libraryItem;
    const isFavourite = !!libraryItem?.isFavourite;

    const fetchNotes = useCallback(async () => {
        if (!libraryItem?.dbId) return;
        const { data } = await supabase!
            .from('notes')
            .select('*')
            .eq('library_entry_id', libraryItem.dbId)
            .order('created_at', { ascending: false });
        if (data) setNotes(data);
    }, [libraryItem?.dbId]);

    useEffect(() => {
        if (isInLibrary) fetchNotes();
    }, [isInLibrary, fetchNotes]);

    const handleSaveNote = async () => {
        const input = document.getElementById('reflection-input') as HTMLTextAreaElement;
        const text = input.value.trim();
        if (!text || !libraryItem?.dbId) return;

        setNoteLoading(true);
        try {
            const { error: insertError } = await supabase!
                .from('notes')
                .insert({
                    library_entry_id: libraryItem.dbId,
                    content: text,
                    chapter_marker: libraryItem.progress,
                    emotion_tags: emotionTags,
                    is_public: false
                });
            
            if (insertError) throw insertError;
            input.value = '';
            setEmotionTags([]);
            await fetchNotes();
        } catch (err) {
            console.error('Failed to save note:', err);
        } finally {
            setNoteLoading(false);
        }
    };

    const toggleEmotion = (tag: string) => {
        setEmotionTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
    };

    useEffect(() => {
        const fetchManga = async () => {
            if (!id) return;
            setLoading(true);
            try {
                const data = await publicApiClient.get<MediaDetail>(`/manga/${id}`);
                setManga(data);
            } catch (err: any) {
                setError(err.message || 'Failed to load media details');
            } finally {
                setLoading(false);
            }
        };

        fetchManga();
    }, [id]);

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
                isFavourite: true
            });
        } else {
            await updateLibraryItem(id!, { isFavourite: !isFavourite });
        }
    };

    const handleReadClick = () => {
        document.getElementById('unit-list')?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleLibraryToggle = async () => {
        if (!user) {
            window.location.href = '/login';
            return;
        }

        if (isInLibrary) {
            await removeFromLibrary(id!);
        } else {
            if (!manga) return;
            await addToLibrary({
                id: manga.id,
                title: manga.title,
                coverUrl: manga.coverUrl,
                genres: manga.genres
            });
        }
    };

    const handleChapterClick = async (unitNum: number) => {
        if (!user) {
            window.location.href = '/login';
            return;
        }
        
        if (!isInLibrary) {
            // Add to library first if not there
            if (!manga) return;
            await addToLibrary({
                id: manga.id,
                title: manga.title,
                coverUrl: manga.coverUrl,
                genres: manga.genres,
                mediaType: manga.type
            });
        }
        
        // Update progress
        const totalUnits = manga?.type === 'ANIME' ? manga?.episodes : manga?.chapters;
        await updateLibraryItem(id!, { 
            progress: unitNum,
            status: totalUnits && unitNum === totalUnits ? 'COMPLETED' : 'READING'
        });
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Loading Details</p>
                </div>
            </div>
        );
    }

    if (error || !manga) {
        return (
            <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center text-destructive mb-6">
                    <Globe size={32} />
                </div>
                <h2 className="text-2xl font-black tracking-tight mb-2 uppercase">Error</h2>
                <p className="text-muted-foreground text-sm mb-8 max-w-xs">{error || 'The requested manga could not be found.'}</p>
                <Link to="/" className="px-8 py-3 bg-foreground text-background rounded-xl font-black text-xs tracking-widest uppercase hover:opacity-90 transition-opacity">
                    Return Home
                </Link>
            </div>
        );
    }

    return (
        <div className="w-full bg-background min-h-screen pb-20 overflow-x-hidden">
            {/* HERO BANNER */}
            <div className="relative h-[60vh] w-full overflow-hidden">
                <div 
                    className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-[2000ms] hover:scale-105"
                    style={{ backgroundImage: `url(${sanitizeCoverUrl(manga.bannerUrl || manga.coverUrl)})` }}
                />
                <div className="absolute inset-0 z-10 bg-gradient-to-t from-background via-background/40 to-transparent" />
                <div className="absolute inset-0 z-10 bg-gradient-to-r from-background via-background/20 to-transparent" />
                
                <div className="absolute bottom-0 left-0 w-full z-20 px-8 md:px-[64px] pb-16">
                     <Link to="/" className="inline-flex items-center gap-2 text-foreground/70 hover:text-foreground mb-12 transition-colors group">
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Back to Home</span>
                     </Link>
                     
                     <div className="max-w-[800px] space-y-6">
                        <div className="flex flex-wrap gap-2">
                            {manga.genres.map(g => (
                                <span key={g} className="px-3 py-1 bg-background/40 backdrop-blur-md rounded-lg text-[9px] font-black uppercase tracking-wider text-foreground/90 border border-white/10">
                                    {g}
                                </span>
                            ))}
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-foreground leading-[0.9] uppercase">{manga.title}</h1>
                        <p className="text-xl md:text-2xl font-light tracking-[0.2em] text-foreground/40 leading-none">{manga.titleJp}</p>
                        
                        <div className="flex flex-wrap items-center gap-4 pt-4">
                            <button 
                                onClick={handleReadClick}
                                className="px-8 h-[54px] bg-primary text-white rounded-2xl font-black text-[10px] tracking-[0.2em] uppercase flex items-center gap-3 hover:opacity-90 transition-all active:scale-[0.98] shadow-lg shadow-primary/20"
                            >
                                <Play size={18} fill="currentColor" />
                                {manga.type === 'ANIME' ? 'Start Watching' : 'Start Reading'}
                            </button>
                            
                            <button 
                                onClick={handleFavouriteToggle}
                                className={`w-[54px] h-[54px] rounded-2xl flex items-center justify-center transition-all border ${
                                    isFavourite 
                                        ? 'bg-red-500/10 border-red-500/20 text-red-500 shadow-lg shadow-red-500/10' 
                                        : 'bg-background/40 backdrop-blur-md border-white/10 text-foreground/70 hover:text-foreground hover:bg-background/60'
                                }`}
                            >
                                <Heart size={22} fill={isFavourite ? "currentColor" : "none"} />
                            </button>

                            {/* Fast Actions Floating Toggle */}
                            <div className="relative">
                                <button 
                                    onClick={() => setShowFastActions(!showFastActions)}
                                    className="px-8 h-[54px] bg-foreground/10 backdrop-blur-md border border-white/10 text-foreground rounded-2xl font-black text-[10px] tracking-[0.2em] uppercase flex items-center gap-3 hover:bg-foreground/20 transition-all active:scale-[0.98]"
                                >
                                    <MoreHorizontal size={18} />
                                    Fast Actions
                                </button>
                                
                                {showFastActions && (
                                    <div className="absolute bottom-full left-0 mb-4 z-50 w-80">
                                        <FastActionSurface 
                                            id={id!}
                                            title={manga.title}
                                            coverUrl={manga.coverUrl}
                                            genres={manga.genres}
                                            mediaType={manga.type}
                                            onClose={() => setShowFastActions(false)}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                     </div>
                </div>
            </div>

            {/* MAIN CONTENT */}
            <div className="max-w-[1400px] mx-auto px-8 md:px-[64px] -mt-8 relative z-30 grid grid-cols-1 lg:grid-cols-12 gap-16">
                
                {/* INFO SIDEBAR */}
                <div className="lg:col-span-4 space-y-10">
                    <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden shadow-2xl border border-white/5 group bg-muted/20">
                        <img src={sanitizeCoverUrl(manga.coverUrl)} onError={handleCoverImageError} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" alt={manga.title} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-foreground/5 p-6 rounded-[24px] border border-foreground/10 backdrop-blur-sm">
                            <div className="flex items-center gap-2 text-primary mb-2">
                                <Star size={14} fill="currentColor" />
                                <span className="text-[9px] font-black uppercase tracking-widest">Global Score</span>
                            </div>
                            <div className="text-3xl font-black tracking-tighter">{manga.stats.score.toFixed(1)}</div>
                        </div>
                        <div className="bg-foreground/5 p-6 rounded-[24px] border border-foreground/10 backdrop-blur-sm">
                            <div className="flex items-center gap-2 text-primary mb-2">
                                <BookOpen size={14} />
                                <span className="text-[9px] font-black uppercase tracking-widest">{manga.type === 'ANIME' ? 'Episodes' : 'Chapters'}</span>
                            </div>
                            <div className="text-3xl font-black tracking-tighter">{(manga.type === 'ANIME' ? manga.episodes : manga.chapters) || '??'}</div>
                        </div>
                    </div>

                    <div className="p-8 bg-foreground/[0.02] rounded-[32px] border border-foreground/5 space-y-6">
                         {[
                            { label: 'Status', value: manga.stats.status, icon: Play },
                            { label: 'Popularity', value: manga.stats.popularity, icon: Globe },
                            { label: 'My Progress', value: libraryItem ? `${manga.type === 'ANIME' ? 'Episode' : 'Chapter'} ${libraryItem.progress}` : 'Not Started', icon: Clock }
                         ].map(item => (
                             <div key={item.label} className="flex justify-between items-center group">
                                <div className="flex items-center gap-3">
                                    <item.icon size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                                    <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">{item.label}</span>
                                </div>
                                <span className={`text-xs font-bold ${item.label === 'My Progress' && libraryItem ? 'text-primary' : 'text-foreground'}`}>{item.value}</span>
                             </div>
                         ))}
                    </div>

                    <div className="flex gap-3">
                        <button 
                            onClick={handleLibraryToggle}
                            className={`flex-1 h-[60px] rounded-2xl font-black text-xs tracking-[0.2em] uppercase flex items-center justify-center gap-3 transition-all active:scale-[0.98] ${
                                isInLibrary 
                                    ? 'bg-primary text-white' 
                                    : 'bg-foreground text-background hover:opacity-90'
                            }`}
                        >
                            {isInLibrary ? <Check size={18} /> : <Bookmark size={18} />}
                            {isInLibrary ? 'In Library' : 'Add to Library'}
                        </button>
                        <button className="w-[60px] h-[60px] bg-foreground/5 text-foreground rounded-2xl border border-foreground/10 flex items-center justify-center hover:bg-foreground/10 transition-all">
                            <Share2 size={18} />
                        </button>
                    </div>
                </div>

                {/* DESCRIPTION & CHAPTERS */}
                <div className="lg:col-span-8 space-y-16 py-8">
                    <section>
                        <div className="flex items-center gap-4 mb-8">
                            <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-primary">Synopsis</h3>
                            <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
                        </div>
                        <p className="text-foreground/70 leading-[1.8] text-base md:text-lg font-medium max-w-[700px]">
                            {manga.description}
                        </p>
                    </section>

                    {/* Characters Section */}
                    {manga.characters && manga.characters.length > 0 && (
                        <section>
                            <div className="flex items-center gap-4 mb-10">
                                <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-primary">Main Characters</h3>
                                <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                                {manga.characters.map(char => (
                                    <div key={char.id} className="group flex flex-col gap-3">
                                        <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-muted/20 border border-white/5 relative">
                                            <img src={char.image} alt={char.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                            {char.role && (
                                                <div className="absolute top-3 right-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded-lg text-[8px] font-black uppercase tracking-widest text-white/90">
                                                    {char.role}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-black uppercase tracking-tight text-foreground truncate">{char.name}</h4>
                                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">Character</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    <section>
                        <div className="flex items-center gap-4 mb-10">
                            <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-primary">Archival Journal</h3>
                            <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
                        </div>

                        <div className="space-y-12">
                            {isInLibrary && (
                                <div className="p-10 rounded-[40px] bg-white/[0.02] border border-white/5 space-y-8">
                                    <div className="flex flex-wrap gap-2">
                                        {['Hype', 'Sad', 'Shocked', 'Masterpiece', 'Mind Blown', 'Chill'].map(tag => (
                                            <button 
                                                key={tag}
                                                onClick={() => toggleEmotion(tag)}
                                                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                                                    emotionTags.includes(tag) 
                                                        ? 'bg-primary border-primary text-white' 
                                                        : 'bg-white/5 border-white/10 text-white/40 hover:border-white/20'
                                                }`}
                                            >
                                                {tag}
                                            </button>
                                        ))}
                                    </div>
                                    <textarea 
                                        id="reflection-input"
                                        placeholder={`Record archival thoughts or specific ${manga.type === 'ANIME' ? 'episode' : 'chapter'} observations...`}
                                        className="w-full h-32 bg-transparent border-b border-white/10 p-0 text-lg font-medium outline-none focus:border-primary/40 transition-all resize-none placeholder:text-white/10"
                                    />
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/20">
                                            <Clock size={14} />
                                            Marking {manga.type === 'ANIME' ? 'Episode' : 'Chapter'} {libraryItem?.progress || 0}
                                        </div>
                                        <button 
                                            onClick={handleSaveNote}
                                            disabled={noteLoading}
                                            className="px-10 py-4 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:opacity-90 transition-all active:scale-95 flex items-center gap-3"
                                        >
                                            {noteLoading ? <Loader2 size={16} className="animate-spin" /> : 'Log Reflection'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-6">
                                {notes.length === 0 ? (
                                    <div className="p-20 rounded-[48px] border-2 border-dashed border-white/5 text-center">
                                        <p className="text-xs font-black uppercase tracking-[0.2em] text-white/10">Journal Partition Empty</p>
                                    </div>
                                ) : (
                                    notes.map((note) => (
                                        <div key={note.id} className="p-10 rounded-[40px] bg-white/[0.01] border border-white/5 space-y-6 group">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-4">
                                                    <div className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-[9px] font-black uppercase tracking-widest">
                                                        {manga.type === 'ANIME' ? 'Episode' : 'Chapter'} {note.chapter_marker}
                                                    </div>
                                                    <div className="flex gap-2">
                                                        {(note.emotion_tags || []).map((tag: string) => (
                                                            <span key={tag} className="text-[8px] font-black uppercase tracking-widest text-white/30">{tag}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <span className="text-[9px] font-black uppercase tracking-widest text-white/10">{new Date(note.created_at).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-white/70 leading-relaxed text-lg font-medium">{note.content}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </section>

                    <section id="unit-list">
                         <div className="flex items-center justify-between mb-10">
                            <div className="flex items-center gap-4 flex-1">
                                <h3 className="text-[11px] font-black uppercase tracking-[0.4em] text-primary">{manga.type === 'ANIME' ? 'Episodes' : 'Chapters'}</h3>
                                <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
                            </div>
                            <span className="ml-6 text-[10px] font-black uppercase tracking-widest text-muted-foreground px-4 py-2 bg-foreground/5 rounded-full border border-foreground/10">
                                List View
                            </span>
                        </div>

                        <div className="space-y-3">
                            {[...Array(Math.min((manga.type === 'ANIME' ? manga.episodes : manga.chapters) || 12, 100))].map((_, idx) => {
                                const i = idx + 1;
                                return (
                                <button 
                                    key={i} 
                                    onClick={() => {
                                        handleChapterClick(i);
                                        const unitLabel = manga.type === 'ANIME' ? 'anime episode' : (manga.type === 'NOVEL' ? 'novel chapter' : 'manga chapter');
                                        const query = `${manga.title} ${unitLabel} ${i} read`;
                                        window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, "_blank");
                                    }}
                                    className={`w-full group flex items-center justify-between p-6 rounded-2xl border transition-all cursor-pointer ${
                                        libraryItem && libraryItem.progress >= i 
                                            ? 'bg-primary/5 border-primary/30' 
                                            : 'bg-foreground/[0.02] border-foreground/5 hover:bg-foreground/[0.04] hover:border-foreground/10'
                                    }`}
                                >
                                    <div className="flex items-center gap-6">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-[11px] font-black transition-colors ${
                                            libraryItem && libraryItem.progress >= i 
                                                ? 'bg-primary text-white shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]' 
                                                : 'bg-foreground/5 group-hover:bg-primary/10 group-hover:text-primary'
                                        }`}>
                                            {i.toString().padStart(2, '0')}
                                        </div>
                                        <div className="text-left">
                                            <div className={`text-sm font-black transition-colors uppercase tracking-tight ${
                                                libraryItem && libraryItem.progress >= i ? 'text-foreground' : 'text-foreground/80 group-hover:text-primary'
                                            }`}>
                                                {manga.type === 'ANIME' ? 'Episode' : 'Chapter'} {i}
                                            </div>
                                            <div className="text-[9px] text-muted-foreground font-black uppercase tracking-widest mt-1">Verified Translation · EN</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {libraryItem && libraryItem.progress >= i && (
                                            <Check size={16} className="text-primary" />
                                        )}
                                        <div className="h-10 w-10 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 group-hover:bg-primary/10 transition-all">
                                            <ChevronRight className="text-primary" size={16} />
                                        </div>
                                    </div>
                                </button>
                                );
                            })}
                        </div>
                        
                        <button className="w-full mt-8 py-4 border border-dashed border-foreground/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:border-primary/50 hover:text-primary transition-all">
                            Load Full List
                        </button>
                    </section>
                </div>

            </div>
        </div>
    );
}
