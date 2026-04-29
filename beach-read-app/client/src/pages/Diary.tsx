import { useState, useEffect } from 'react';
import { useAuth } from '../features/auth/context/auth-context';
import { supabase } from '../shared/api/supabaseClient';
import { Loader2, BookOpen, Quote, Heart, Search } from 'lucide-react';
import { sanitizeCoverUrl } from '../shared/utils/image';
import { Link } from 'react-router-dom';

interface DiaryNote {
    id: string;
    content: string;
    created_at: string;
    chapter_marker: number;
    emotion_tags: string[];
    quotes: string[];
    library_entry: {
        id: string;
        progress: number;
        title: {
            id: string;
            primary_title: string;
            cover_image_url: string;
            media_type: string;
        }
    }
}

export default function Diary() {
    const { user } = useAuth();
    const [notes, setNotes] = useState<DiaryNote[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'ALL' | 'ANIME' | 'MANGA' | 'NOVEL'>('ALL');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const fetchAllNotes = async () => {
            if (!user) return;
            setLoading(true);
            try {
                const { data, error } = await supabase!
                    .from('notes')
                    .select(`
                        *,
                        library_entry:library_entries!inner (
                            id,
                            progress_chapters,
                            title:titles!inner (
                                id,
                                primary_title,
                                cover_image_url,
                                media_type
                            )
                        )
                    `)
                    .eq('library_entry.user_id', user.id)
                    .order('created_at', { ascending: false });

                if (error) throw error;
                setNotes(data as any);
            } catch (err) {
                console.error('Failed to fetch journal entries:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchAllNotes();
    }, [user]);

    const filteredNotes = notes.filter(note => {
        const matchesMedia = filter === 'ALL' || note.library_entry.title.media_type === filter;
        const matchesSearch = note.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             note.library_entry.title.primary_title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesMedia && matchesSearch;
    });

    // Group notes by month/year
    const groupedNotes: Record<string, DiaryNote[]> = {};
    filteredNotes.forEach(note => {
        const date = new Date(note.created_at);
        const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
        if (!groupedNotes[monthYear]) groupedNotes[monthYear] = [];
        groupedNotes[monthYear].push(note);
    });

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen bg-background pb-32 pt-32 px-6 md:px-[64px] relative">
            <div className="max-w-[1000px] mx-auto space-y-20">
                
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-12">
                    <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Archival Reflections</p>
                        <h1 className="text-5xl md:text-7xl font-serif italic text-foreground leading-[0.9] tracking-tighter">The Reading <span className="text-sakura-accent">Diary</span></h1>
                    </div>
                    
                    <div className="flex items-center gap-4 bg-foreground/5 p-2 rounded-2xl border border-foreground/10 backdrop-blur-sm">
                        <div className="relative">
                            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <input 
                                type="text"
                                placeholder="Search memories..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-transparent pl-10 pr-4 py-2 text-xs font-serif italic outline-none w-48 placeholder:text-muted-foreground/40"
                            />
                        </div>
                        <div className="h-4 w-px bg-foreground/10" />
                        <div className="flex gap-1">
                            {['ALL', 'MANGA', 'ANIME', 'NOVEL'].map(m => (
                                <button
                                    key={m}
                                    onClick={() => setFilter(m as any)}
                                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${filter === m ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-foreground'}`}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Notes List */}
                <div className="space-y-24">
                    {Object.entries(groupedNotes).length === 0 ? (
                        <div className="py-32 text-center space-y-6">
                            <div className="w-20 h-20 bg-muted/20 rounded-full flex items-center justify-center mx-auto text-muted-foreground/30">
                                <BookOpen size={40} />
                            </div>
                            <p className="text-sm font-serif italic text-muted-foreground">Your diary is waiting for its first entry. Record your thoughts on a series to see them here.</p>
                        </div>
                    ) : (
                        Object.entries(groupedNotes).map(([monthYear, entries]) => (
                            <section key={monthYear} className="space-y-12">
                                <div className="flex items-center gap-6">
                                    <h2 className="text-sm font-black uppercase tracking-[0.4em] text-primary flex-shrink-0">{monthYear}</h2>
                                    <div className="h-px w-full bg-gradient-to-r from-primary/20 to-transparent" />
                                </div>

                                <div className="space-y-16">
                                    {entries.map(note => (
                                        <div key={note.id} className="grid grid-cols-1 md:grid-cols-12 gap-8 group">
                                            {/* Date Sidebar */}
                                            <div className="md:col-span-2 flex flex-col items-start md:items-end pt-2">
                                                <p className="text-2xl font-serif italic text-foreground/40 leading-none">
                                                    {new Date(note.created_at).getDate().toString().padStart(2, '0')}
                                                </p>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-primary mt-2">
                                                    {new Date(note.created_at).toLocaleString('default', { weekday: 'short' })}
                                                </p>
                                            </div>

                                            {/* Content Card */}
                                            <div className="md:col-span-10 relative">
                                                <div className="absolute -left-4 top-0 bottom-0 w-px bg-foreground/5 group-hover:bg-primary/20 transition-colors hidden md:block" />
                                                
                                                <div className="space-y-8">
                                                    <div className="flex items-start gap-6">
                                                        <Link to={`/manga/${note.library_entry.title.id}`} className="shrink-0">
                                                            <img 
                                                                src={sanitizeCoverUrl(note.library_entry.title.cover_image_url)} 
                                                                className="w-16 h-24 object-cover rounded-xl shadow-md group-hover:scale-105 transition-transform duration-500 border border-white/5" 
                                                                alt={note.library_entry.title.primary_title} 
                                                            />
                                                        </Link>
                                                        <div className="space-y-2">
                                                            <div className="flex items-center gap-2">
                                                                <span className="px-2 py-0.5 bg-primary/10 text-primary text-[8px] font-black uppercase tracking-widest rounded-md border border-primary/20">
                                                                    {note.library_entry.title.media_type}
                                                                </span>
                                                                {note.chapter_marker && (
                                                                    <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                                                                        {note.library_entry.title.media_type === 'ANIME' ? 'Episode' : 'Chapter'} {note.chapter_marker}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <h3 className="text-xl font-black uppercase tracking-tight text-foreground group-hover:text-primary transition-colors leading-tight">
                                                                {note.library_entry.title.primary_title}
                                                            </h3>
                                                        </div>
                                                    </div>

                                                    <div className="relative pl-8 border-l-2 border-sakura-accent/30 py-1">
                                                        <Quote size={20} className="absolute -left-3 top-0 text-sakura-accent/20 -translate-y-1/2" />
                                                        <p className="text-lg md:text-xl font-serif italic text-foreground/80 leading-relaxed whitespace-pre-wrap">
                                                            {note.content}
                                                        </p>
                                                    </div>

                                                    {note.emotion_tags && note.emotion_tags.length > 0 && (
                                                        <div className="flex flex-wrap gap-2">
                                                            {note.emotion_tags.map(tag => (
                                                                <span key={tag} className="flex items-center gap-1.5 px-3 py-1 bg-foreground/5 rounded-full text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                                                                    <Heart size={10} className="text-primary/40" />
                                                                    {tag}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
