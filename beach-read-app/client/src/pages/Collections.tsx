import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Layers, Trash2, ArrowUpRight, FolderHeart, Sparkles, Loader2, ShieldCheck, ShieldOff } from 'lucide-react';
import { handleCoverImageError, sanitizeCoverUrl } from '../lib/image';
import { useLibrary } from '../hooks/useLibrary';
import { useCollections } from '../hooks/useCollections';

const Collections: React.FC = () => {
    const { library } = useLibrary();
    const { collections, loading, error, createCollection, deleteCollection } = useCollections();
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await createCollection(newName, newDesc, isPrivate);
            setIsCreateModalOpen(false);
            setNewName('');
            setNewDesc('');
            setIsPrivate(false);
        } catch {
            alert('Failed to create collection. Please check your connection.');
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this collection? All saved data will be lost.')) {
            try {
                await deleteCollection(id);
            } catch {
                alert('Failed to delete collection.');
            }
        }
    };

    if (loading && collections.length === 0) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background pt-[64px]">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
            </div>
        );
    }

    const heartsSaved = library.filter(l => l.isFavourite).length;

    return (
        <div className="flex w-full flex-col items-center bg-background min-h-screen pt-[120px] pb-[110px]">
            <div className="w-full max-w-[1280px] px-[28px]">
                
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20">
                    <div className="max-w-2xl">
                        <div className="flex items-center gap-3 mb-6">
                            <Layers className="text-primary w-5 h-5" />
                            <p className="text-[11px] font-black uppercase tracking-[0.4em] text-primary">Archival Curation</p>
                        </div>
                        <h1 className="text-6xl font-black tracking-[-0.05em] text-foreground uppercase leading-[0.9]">
                            First-Class <span className="text-foreground/20 italic">Collections</span>
                        </h1>
                        <p className="mt-6 text-lg text-muted-foreground font-medium italic">
                            Organize your library into ordered, themed, and structured archival partitions.
                        </p>
                    </div>

                    <button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="h-16 px-10 bg-foreground text-background rounded-3xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:opacity-90 transition-all active:scale-95 shadow-2xl"
                    >
                        <Plus size={18} />
                        New Partition
                    </button>
                </div>

                {error && (
                    <div className="mb-10 p-6 rounded-3xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-bold uppercase tracking-widest text-center">
                        Archival Fault: {error}
                    </div>
                )}

                {/* Collections Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* My Favorites (Auto Collection) */}
                    <div className="group relative flex flex-col p-8 rounded-[48px] bg-red-500/[0.03] border border-red-500/10 hover:bg-red-500/[0.06] hover:border-red-500/30 transition-all duration-500 overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity text-red-500">
                            <FolderHeart size={160} />
                        </div>

                        <div className="flex justify-between items-start mb-10 relative z-10">
                            <div className="max-w-[80%]">
                                <h3 className="text-2xl font-black text-foreground uppercase tracking-tight mb-2 truncate">Core Sanctuary</h3>
                                <p className="text-xs text-muted-foreground font-medium italic line-clamp-2">Stories that define your archival journey.</p>
                            </div>
                            <div className="p-3 bg-red-500/10 text-red-500 rounded-2xl">
                                <Sparkles size={16} />
                            </div>
                        </div>

                        <div className="flex-1 flex items-center justify-center mb-10 relative z-10">
                            {heartsSaved > 0 ? (
                                <div className="flex -space-x-12">
                                    {library.filter(l => l.isFavourite).slice(0, 4).map((item, i, arr) => (
                                        <div 
                                            key={item.id}
                                            className="w-24 h-36 rounded-2xl overflow-hidden shadow-2xl border-4 border-background rotate-[-5deg] group-hover:rotate-0 transition-transform duration-700"
                                            style={{ 
                                                transform: `rotate(${ (i - (arr.length - 1) / 2) * 10 }deg) translateY(${ Math.abs(i - (arr.length - 1) / 2) * 10 }px)`,
                                                zIndex: i
                                            }}
                                        >
                                            <img src={sanitizeCoverUrl(item.coverUrl)} onError={handleCoverImageError} className="w-full h-full object-cover" alt="" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="w-full h-36 border-2 border-dashed border-red-500/10 rounded-3xl flex flex-col items-center justify-center gap-3">
                                    <Sparkles className="text-red-500/20 w-8 h-8" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-red-500/30">No Favorites</span>
                                </div>
                            )}
                        </div>

                        <div className="flex items-center justify-between relative z-10">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">
                                {heartsSaved} Hearts Saved
                            </span>
                            <Link to="/library?filter=favourites" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-foreground hover:text-red-500 transition-colors group/btn">
                                Enter Sanctuary <ArrowUpRight size={14} className="group-hover/btn:-translate-y-1 group-hover/btn:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>

                    {collections.map((collection) => {
                        const covers = (collection.items || []).slice(0, 4);

                        return (
                            <div 
                                key={collection.id} 
                                className="group relative flex flex-col p-8 rounded-[48px] bg-muted/10 border border-border/40 hover:bg-muted/20 hover:border-primary/30 transition-all duration-500 overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                                    <Layers size={160} />
                                </div>

                                <div className="flex justify-between items-start mb-10 relative z-10">
                                    <div className="max-w-[80%]">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="text-2xl font-black text-foreground uppercase tracking-tight truncate">{collection.name}</h3>
                                            {collection.isPrivate ? <ShieldCheck size={14} className="text-primary" /> : <ShieldOff size={14} className="text-white/20" />}
                                        </div>
                                        <p className="text-xs text-muted-foreground font-medium italic line-clamp-2">{collection.description}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => handleDelete(collection.id)}
                                            className="p-3 bg-foreground/5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-2xl transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 flex items-center justify-center mb-10 relative z-10">
                                    {covers.length > 0 ? (
                                        <div className="flex -space-x-12">
                                            {covers.map((item, i) => (
                                                <div 
                                                    key={item.id}
                                                    className="w-24 h-36 rounded-2xl overflow-hidden shadow-2xl border-4 border-background rotate-[-5deg] group-hover:rotate-0 transition-transform duration-700"
                                                    style={{ transform: `rotate(${ (i - (covers.length - 1) / 2) * 10 }deg) translateY(${ Math.abs(i - (covers.length - 1) / 2) * 10 }px)` }}
                                                >
                                                    <img src={sanitizeCoverUrl(item.coverUrl || '')} onError={handleCoverImageError} className="w-full h-full object-cover" alt="" />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="w-full h-36 border-2 border-dashed border-border/40 rounded-3xl flex flex-col items-center justify-center gap-3">
                                            <Sparkles className="text-muted-foreground/30 w-8 h-8" />
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Empty Partition</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-between relative z-10">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">
                                        {(collection.items || []).length} Archives
                                    </span>
                                    <Link 
                                        to={`/library?filter=${encodeURIComponent(collection.name)}`}
                                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-foreground hover:text-primary transition-colors group/btn"
                                    >
                                        Inspect Curation <ArrowUpRight size={14} className="group-hover/btn:-translate-y-1 group-hover/btn:translate-x-1 transition-transform" />
                                    </Link>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Empty State */}
                {collections.length === 0 && !loading && (
                    <div className="py-40 flex flex-col items-center justify-center text-center border-2 border-dashed border-border/50 rounded-[64px] bg-muted/5">
                        <Layers className="w-20 h-20 text-muted-foreground/20 mb-8" />
                        <h2 className="text-3xl font-black text-foreground uppercase tracking-tight mb-4">No Active Partitions</h2>
                        <p className="text-muted-foreground max-w-sm italic mb-10">
                            Your curation stream is currently uninitialized. Create a new collection to begin organizational protocol.
                        </p>
                        <button 
                            onClick={() => setIsCreateModalOpen(true)}
                            className="px-12 h-16 bg-foreground text-background rounded-3xl text-[11px] font-black uppercase tracking-[0.2em]"
                        >
                            Initialize Partition
                        </button>
                    </div>
                )}
            </div>

            {/* Create Collection Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-[3000] flex items-center justify-center p-6">
                    <div className="absolute inset-0 bg-background/40 backdrop-blur-xl" onClick={() => setIsCreateModalOpen(false)} />
                    <div className="relative w-full max-w-[500px] bg-background border border-border shadow-[0_30px_100px_rgba(0,0,0,0.3)] rounded-[48px] p-12 animate-in zoom-in-95 duration-300">
                        <h2 className="text-3xl font-black text-foreground uppercase tracking-tight mb-2">New Partition</h2>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-[0.2em] mb-10">Initialize custom archival list</p>
                        
                        <form onSubmit={handleCreate} className="space-y-8">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Partition ID/Name</label>
                                <input 
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="w-full h-16 bg-muted/10 border border-border/60 rounded-[20px] px-6 text-sm font-bold focus:outline-none focus:border-primary/50 focus:bg-background transition-all"
                                    placeholder="e.g. Cyberpunk Noir"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground ml-1">Archive Objective</label>
                                <textarea 
                                    value={newDesc}
                                    onChange={(e) => setNewDesc(e.target.value)}
                                    className="w-full h-32 bg-muted/10 border border-border/60 rounded-[20px] px-6 py-4 text-sm font-medium focus:outline-none focus:border-primary/50 focus:bg-background transition-all resize-none"
                                    placeholder="Define the scope of this curation..."
                                />
                            </div>
                            
                            <div className="flex items-center justify-between p-6 bg-white/5 rounded-3xl border border-white/10">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white">Private Partition</p>
                                    <p className="text-[8px] font-bold text-white/40 uppercase mt-1">Hide from public intelligence</p>
                                </div>
                                <button 
                                    type="button"
                                    onClick={() => setIsPrivate(!isPrivate)}
                                    className={`w-12 h-6 rounded-full transition-all relative ${isPrivate ? 'bg-primary' : 'bg-white/10'}`}
                                >
                                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isPrivate ? 'left-7' : 'left-1'}`} />
                                </button>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button 
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="flex-1 h-16 border border-border rounded-3xl text-[11px] font-black uppercase tracking-widest text-muted-foreground hover:bg-muted/20 transition-all"
                                >
                                    Abort
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-[2] h-16 bg-foreground text-background rounded-3xl text-[11px] font-black uppercase tracking-widest hover:opacity-90 transition-all"
                                >
                                    Initialize
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Collections;
