import { MediaRow } from "@/components/home/MediaRow";
import { MediaRowCard } from "@/components/home/MediaRowCard";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { EditMediaModal } from "@/components/media/EditMediaModal";
import { DetailPageSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/ToastNotification";
import { Button } from "@/components/ui/YuraButton";
import { useData } from "@/context/DataContext";
import { STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
    ArrowLeft,
    Calendar,
    Edit3,
    Heart,
    MessageSquare,
    Play,
    Sparkles,
    Star,
    Trash2
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

const MediaDetail = () => {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { animeList, mangaList, user, getTitle, loading, updateEntry, deleteEntry } = useData();

    const mediaType = location.pathname.startsWith("/anime") ? "ANIME" : "MANGA";
    const backPath = `/${mediaType.toLowerCase()}`;

    const [isSaving, setIsSaving] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);

    const media = useMemo(() => {
        const list = mediaType === "ANIME" ? animeList : mangaList;
        return list.find(m => m._seriesId === Number(id)) || null;
    }, [id, mediaType, animeList, mangaList]);

    const similarMedia = useMemo(() => {
        if (!media) return [];
        const list = mediaType === "ANIME" ? animeList : mangaList;
        return list
            .filter(m => m._seriesId !== media._seriesId && m.genres.some(g => media.genres.includes(g)))
            .slice(0, 10);
    }, [media, animeList, mangaList, mediaType]);

    const handleSaveField = useCallback(
        async (field: string, value: string | number) => {
            if (!media) return;
            try {
                setIsSaving(true);
                await updateEntry(media._entryId, { [field]: value });
                showToast(`${field} updated`, "success");
            } catch (error) {
                showToast("Failed to save", "error");
            } finally {
                setIsSaving(false);
            }
        },
        [media, updateEntry, showToast],
    );

    const handleDelete = useCallback(async () => {
        if (!media) return;
        try {
            setIsDeleting(true);
            await deleteEntry(media._entryId);
            showToast("Item removed", "success");
            navigate(backPath);
        } catch (error) {
            showToast("Failed to delete", "error");
        } finally {
            setIsDeleting(false);
            setShowDeleteConfirm(false);
        }
    }, [media, deleteEntry, navigate, backPath, showToast]);

    if (loading || (media && !media._enriched)) return <DetailPageSkeleton />;

    if (!media || !user) {
        return (
            <div className="flex flex-col items-center justify-center py-40">
                <p className="text-muted-foreground mb-4">Content not found in your vault.</p>
                <Link to={backPath} className="text-primary hover:underline flex items-center gap-2">
                    <ArrowLeft className="w-4 h-4" /> Return to Gallery
                </Link>
            </div>
        );
    }

    const title = getTitle(media);
    const progressPercent =
        media.episodes || media.chapters
            ? Math.min(100, (media.progress / (media.episodes || media.chapters || 1)) * 100)
            : 0;

    return (
        <PageWrapper>
            <div className="relative min-h-screen bg-background pb-32">
                {/* 1. Cinematic Backdrop (Task 16) */}
                <div className="relative w-full h-[650px] md:h-[850px] overflow-hidden">
                    <div className="absolute inset-0">
                        {media.bannerImage || media.coverImage ? (
                            <motion.img 
                                initial={{ scale: 1.15, opacity: 0 }}
                                animate={{ scale: 1, opacity: 0.4 }}
                                transition={{ duration: 1.8, ease: "easeOut" }}
                                src={media.bannerImage || media.coverImage || ""} 
                                alt="" 
                                className="w-full h-full object-cover" 
                                style={{ filter: "brightness(0.5) contrast(1.1) saturate(0.8)" }}
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-b from-surface-elevated1 to-background" />
                        )}
                        {/* Layered Fades (Task 16) */}
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-transparent to-background/20" />
                        <div className="absolute inset-0 bg-black/20" />
                    </div>

                    {/* Back Navigation */}
                    <Link 
                        to={backPath}
                        className="absolute top-10 left-10 z-40 px-6 py-3 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/5 flex items-center gap-3 text-white/50 hover:text-white hover:bg-black/60 transition-all group scale-90 md:scale-100"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-[10px] font-black uppercase tracking-[0.25em]">Back to Archive</span>
                    </Link>
                </div>

                {/* 2. Content Layout */}
                <div className="container mx-auto px-6 md:px-14 relative -mt-[400px] md:-mt-[550px] z-10">
                    <div className="flex flex-col lg:flex-row gap-16 md:gap-24">
                        
                        {/* Left: Monumental Poster (Task 3) */}
                        <div className="shrink-0 space-y-10 group">
                            <motion.div 
                                initial={{ y: 60, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 1, delay: 0.4, ease: [0.23, 1, 0.32, 1] }}
                                className="w-[320px] md:w-[420px] aspect-[2/3] rounded-[1.5rem] overflow-hidden shadow-[0_64px_128px_-32px_rgba(0,0,0,0.8)] ring-1 ring-white/10 group-hover:ring-primary/40 transition-all duration-700 relative"
                            >
                                <img src={media.coverImage} alt={title} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            </motion.div>

                            {/* Status Control Ribbon */}
                            <div className="bg-white/5 backdrop-blur-2xl rounded-2xl p-2 border border-white/5 flex items-center gap-2 shadow-2xl">
                                <div className="flex-1 px-4">
                                    <div className="text-[9px] font-black uppercase tracking-widest text-primary/40 mb-1">Vault Status</div>
                                    <select 
                                        className="w-full bg-transparent font-black text-sm uppercase tracking-widest outline-none py-1 cursor-pointer text-white/80 hover:text-primary transition-colors"
                                        value={media.status}
                                        onChange={(e) => handleSaveField("status", e.target.value)}
                                    >
                                        {Object.entries(STATUS_LABELS).map(([key, labelObj]) => (
                                            <option key={key} value={key} className="bg-[#0b1220] text-foreground">
                                                {labelObj[mediaType] || key}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="w-px h-10 bg-white/10" />
                                <button className="p-4 text-white/20 hover:text-red-500 transition-all hover:scale-110 active:scale-90">
                                    <Heart className="w-6 h-6 fill-current" />
                                </button>
                            </div>
                        </div>

                        {/* Right: Editorial Content (Task 16) */}
                        <div className="flex-1 pt-20">
                            <motion.div 
                                initial={{ x: 40, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ duration: 1, delay: 0.6 }}
                                className="space-y-16"
                            >
                                <div className="space-y-8">
                                    <div className="flex items-center gap-6">
                                        <span className="px-5 py-2 bg-primary text-primary-foreground rounded-xl text-[10px] font-black uppercase tracking-[0.3em] shadow-glow">
                                            {media.mediaType}
                                        </span>
                                        <span className="text-white/30 font-black text-xs tracking-[0.4em] uppercase">{media.format || "Standard Archive"}</span>
                                    </div>
                                    
                                    <h1 className="text-6xl md:text-[10rem] font-black tracking-tighter leading-[0.8] text-balance">
                                        {title}
                                    </h1>

                                    {/* Visual Stats Bar (Task 17) */}
                                    <div className="flex flex-wrap items-center gap-12 pt-4">
                                        <div className="space-y-2">
                                            <div className="text-[10px] uppercase tracking-[0.3em] text-white/20 font-black">Archive Grade</div>
                                            <div className="flex items-end gap-3">
                                                <div className="text-6xl font-black text-primary tabular-nums tracking-tighter leading-none">
                                                    {media.score > 0 ? media.score : "--"}
                                                </div>
                                                <div className="flex gap-1 mb-1.5">
                                                    {[...Array(5)].map((_, i) => (
                                                        <div 
                                                            key={i} 
                                                            className={cn(
                                                                "w-1.5 h-6 rounded-full",
                                                                i < Math.round(media.score / 20) ? "bg-primary shadow-glow" : "bg-white/5"
                                                            )} 
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="w-px h-16 bg-white/5 hidden md:block" />
                                        
                                        <div className="space-y-2 flex-1 max-w-[300px]">
                                            <div className="flex justify-between items-end">
                                                <div className="text-[10px] uppercase tracking-[0.3em] text-white/20 font-black">Progression</div>
                                                <div className="text-2xl font-black text-white tabular-nums tracking-tighter leading-none">
                                                    {media.progress} <span className="text-sm text-white/20 font-bold ml-1">/ {media.episodes || media.chapters || "?"}</span>
                                                </div>
                                            </div>
                                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden relative">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${progressPercent}%` }}
                                                    className="absolute inset-0 bg-primary shadow-glow rounded-full"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Dynamic Genres */}
                                <div className="flex flex-wrap gap-3">
                                    {media.genres.map(genre => (
                                        <span key={genre} className="px-6 py-3 rounded-2xl bg-white/5 border border-white/5 text-[11px] font-black uppercase tracking-widest text-white/40 hover:text-primary hover:border-primary/40 transition-all cursor-default">
                                            {genre}
                                        </span>
                                    ))}
                                </div>

                                {/* Narrative Context (Task 16) */}
                                {media.description && (
                                    <div className="max-w-4xl space-y-10">
                                        <div className="flex items-center gap-6">
                                            <h3 className="text-[10px] font-black uppercase tracking-[0.5em] text-white/10 text-nowrap">The Narrative</h3>
                                            <div className="h-px w-full bg-white/5" />
                                        </div>
                                        <div 
                                            className="text-2xl md:text-3xl text-white/70 leading-[1.6] font-medium tracking-tight detail-description"
                                            dangerouslySetInnerHTML={{ __html: media.description }}
                                        />
                                    </div>
                                )}

                                {/* Metadata Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-10">
                                    <div className="space-y-6">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/40 flex items-center gap-4">
                                            <MessageSquare className="w-4 h-4" /> Personal Reflection
                                        </h4>
                                        <div className="bg-surface-elevated1/40 p-10 rounded-[2rem] border border-white/5 text-xl font-medium text-white/60 leading-relaxed italic relative">
                                            <div className="absolute top-0 left-8 -translate-y-1/2 px-4 py-1 bg-background border border-white/5 rounded-full text-[9px] font-black uppercase tracking-widest text-white/20">Stored Data</div>
                                            {media.notes || "No reflection indexed yet..."}
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary/40 flex items-center gap-4">
                                            <Sparkles className="w-4 h-4" /> Attributes
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <AttributeRow label="Commenced" value={media.startedAt || "Unknown"} icon={Calendar} />
                                            <AttributeRow label="Concluded" value={media.completedAt || "Active"} icon={Calendar} />
                                            <AttributeRow label="Unit Count" value={String(media.episodes || media.chapters || "∞")} icon={Play} />
                                            <AttributeRow label="Re-Archive" value={String(media.repeat)} icon={Star} />
                                        </div>
                                    </div>
                                </div>

                                {/* Detailed Actions */}
                                <div className="flex items-center gap-6 pt-16 border-t border-white/5">
                                    <Button onClick={() => setShowEditModal(true)} size="lg" className="rounded-2xl px-12 gap-4 font-black text-sm uppercase tracking-[0.2em]">
                                        <Edit3 className="w-5 h-5" /> Adjust Parameters
                                    </Button>
                                    <button 
                                        onClick={() => setShowDeleteConfirm(true)}
                                        className="h-20 w-20 rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 flex items-center justify-center hover:bg-destructive hover:text-white transition-all shadow-xl shadow-destructive/5"
                                    >
                                        <Trash2 className="w-7 h-7" />
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    </div>

                    {/* Recommendations Row */}
                    {similarMedia.length > 0 && (
                        <div className="mt-60">
                            <MediaRow title="Correlated Archetypes" icon={Sparkles}>
                                {similarMedia.map((item, i) => (
                                    <MediaRowCard key={item._seriesId} media={item} index={i} />
                                ))}
                            </MediaRow>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals */}
            {showEditModal && (
                <EditMediaModal 
                    media={media} 
                    onClose={() => setShowEditModal(false)} 
                    onDelete={handleDelete}
                />
            )}

            {/* Delete Confirmation Overlay (Task 13-ish) */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-6">
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-[#0b1220] border border-destructive/20 p-12 md:p-16 rounded-[3rem] max-w-xl w-full text-center space-y-10 shadow-[0_0_120px_rgba(255,0,0,0.15)]"
                    >
                        <div className="w-24 h-24 bg-destructive/20 rounded-3xl flex items-center justify-center mx-auto rotate-12">
                            <Trash2 className="w-12 h-12 text-destructive -rotate-12" />
                        </div>
                        <div className="space-y-4">
                             <h2 className="text-4xl font-black tracking-tighter uppercase leading-none">Purge Fragment?</h2>
                             <p className="text-white/50 text-lg leading-relaxed">This action will permanently delete <span className="text-white font-bold">{title}</span> from your personal universe. Correlation data will be lost.</p>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 h-20 rounded-2xl bg-white/5 font-black uppercase text-xs tracking-widest hover:bg-white/10 transition-all">Abort Path</button>
                            <button onClick={handleDelete} className="flex-1 h-20 rounded-2xl bg-destructive text-white font-black uppercase text-xs tracking-widest hover:bg-destructive/90 transition-all shadow-2xl shadow-destructive/40">Confirm Purge</button>
                        </div>
                    </motion.div>
                </div>
            )}
        </PageWrapper>
    );
};

function AttributeRow({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
    return (
        <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-1">
            <div className="flex items-center gap-2 mb-1">
                <Icon className="w-3 h-3 text-primary/40" />
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/30">{label}</span>
            </div>
            <div className="text-sm font-bold text-white/80">{value}</div>
        </div>
    );
}

export default MediaDetail;

