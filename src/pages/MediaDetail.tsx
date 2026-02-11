import { MediaRow } from "@/components/home/MediaRow";
import { MediaRowCard } from "@/components/home/MediaRowCard";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { EditMediaModal } from "@/components/media/EditMediaModal";
import { DetailPageSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/ToastNotification";
import { Button } from "@/components/ui/YuraButton";
import { useData } from "@/context/DataContext";
import { STATUS_LABELS } from "@/lib/constants";
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
        async (field: string, value: any) => {
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

    if (loading) return <DetailPageSkeleton />;

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
    const scoreFormat = user.scoreFormat;

    return (
        <PageWrapper>
            <div className="relative min-h-screen bg-background pb-32">
                {/* 1. Cinematic Backdrop */}
                <div className="relative w-full h-[500px] md:h-[700px] overflow-hidden">
                    <div className="absolute inset-0">
                        {media.bannerImage || media.coverImage ? (
                            <motion.img 
                                initial={{ scale: 1.1, opacity: 0 }}
                                animate={{ scale: 1, opacity: 0.5 }}
                                transition={{ duration: 1.5 }}
                                src={media.bannerImage || media.coverImage || ""} 
                                alt="" 
                                className="w-full h-full object-cover" 
                                style={{ filter: "brightness(0.6) contrast(1.2)" }}
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-b from-surface-elevated1 to-background" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-r from-background via-transparent to-transparent" />
                    </div>

                    <Link 
                        to={backPath}
                        className="absolute top-10 left-10 z-40 w-12 h-12 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/5 flex items-center justify-center text-white hover:bg-primary hover:text-primary-foreground transition-all group shadow-2xl"
                    >
                        <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                    </Link>
                </div>

                {/* 2. Content Layout */}
                <div className="container mx-auto px-6 max-w-[1400px] relative -mt-64 md:-mt-80 z-10">
                    <div className="flex flex-col lg:flex-row gap-12 md:gap-20">
                        
                        {/* Left: Floating Poster */}
                        <div className="shrink-0 space-y-8">
                            <motion.div 
                                initial={{ y: 40, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ duration: 0.8, delay: 0.2 }}
                                className="w-[280px] md:w-[320px] aspect-[2/3] rounded-[2.5rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.6)] ring-1 ring-white/10"
                            >
                                <img src={media.coverImage} alt={title} className="w-full h-full object-cover" />
                            </motion.div>

                            {/* Status Pill */}
                            <div className="bg-surface-elevated1/60 backdrop-blur-xl rounded-[2rem] p-4 border border-white/5 flex items-center gap-3">
                                <div className="flex-1">
                                    <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1 ml-3">Status</div>
                                    <select 
                                        className="w-full bg-transparent font-black text-sm uppercase tracking-widest outline-none px-3 py-1 cursor-pointer"
                                        value={media.status}
                                        onChange={(e) => handleSaveField("status", e.target.value)}
                                    >
                                        {Object.entries(STATUS_LABELS).map(([key, labelObj]) => (
                                            <option key={key} value={key} className="bg-popover text-foreground">
                                                {labelObj[mediaType] || key}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="w-px h-8 bg-white/10" />
                                <button className="p-3 text-white/40 hover:text-primary transition-colors">
                                    <Heart className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Right: Editorial Content */}
                        <div className="flex-1 pt-12">
                            <motion.div 
                                initial={{ x: 20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ duration: 0.8, delay: 0.3 }}
                                className="space-y-12"
                            >
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <span className="px-4 py-1.5 bg-primary/20 text-primary rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border border-primary/20">
                                            {media.mediaType}
                                        </span>
                                        <span className="text-white/40 font-bold text-sm tracking-widest uppercase">{media.format || "Standard"}</span>
                                    </div>
                                    <h1 className="text-6xl md:text-9xl font-black tracking-tighter leading-[0.85] text-balance">
                                        {title}
                                    </h1>
                                    <div className="flex items-center gap-10">
                                        <div className="space-y-1">
                                            <div className="text-[10px] uppercase tracking-widest text-muted-foreground/40 font-black">Score</div>
                                            <div className="text-4xl font-black text-primary tabular-nums tracking-tighter">
                                                {media.score > 0 ? media.score : "--"}
                                            </div>
                                        </div>
                                        <div className="w-px h-12 bg-white/5" />
                                        <div className="space-y-1">
                                            <div className="text-[10px] uppercase tracking-widest text-muted-foreground/40 font-black">Progression</div>
                                            <div className="text-4xl font-black text-foreground tabular-nums tracking-tighter">
                                                {media.progress} <span className="text-xl text-white/20">/ {media.episodes || media.chapters || "?"}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Genres */}
                                <div className="flex flex-wrap gap-2">
                                    {media.genres.map(genre => (
                                        <span key={genre} className="px-5 py-2 rounded-2xl bg-white/5 border border-white/5 text-xs font-bold text-white/60 hover:text-primary hover:border-primary/20 hover:bg-primary/5 transition-all cursor-default">
                                            {genre}
                                        </span>
                                    ))}
                                </div>

                                {/* Description */}
                                {media.description && (
                                    <div className="max-w-3xl">
                                        <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/30 mb-6 flex items-center gap-4 text-nowrap">
                                            The Narrative <div className="h-px w-full bg-white/5" />
                                        </h3>
                                        <div 
                                            className="text-xl md:text-2xl text-white/70 leading-[1.6] font-medium tracking-tight"
                                            dangerouslySetInnerHTML={{ __html: media.description }}
                                        />
                                    </div>
                                )}

                                {/* User Context / Notes */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-8">
                                    <div className="space-y-4">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 flex items-center gap-3">
                                            <MessageSquare className="w-4 h-4" /> Personal Reflection
                                        </h4>
                                        <div className="bg-surface-elevated1/40 p-8 rounded-[2.5rem] border border-white/5 text-lg italic font-medium text-white/60 leading-relaxed shadow-inner">
                                            {media.notes || "Write your personal reflections in the vault archives..."}
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60 flex items-center gap-3">
                                            <Star className="w-4 h-4" /> Attributes
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <AttributeRow label="Started" value={media.startedAt || "-"} icon={Calendar} />
                                            <AttributeRow label="Finished" value={media.completedAt || "-"} icon={Calendar} />
                                            <AttributeRow label="Volume" value={String(media.episodes || media.chapters || "-")} icon={Play} />
                                            <AttributeRow label="Re-read" value={String(media.repeat)} icon={Star} />
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-4 pt-12 border-t border-white/5">
                                    <Button onClick={() => setShowEditModal(true)} size="lg" className="rounded-2xl px-8 gap-3 font-black">
                                        <Edit3 className="w-5 h-5" /> Edit Record
                                    </Button>
                                    <button 
                                        onClick={() => setShowDeleteConfirm(true)}
                                        className="h-14 w-14 rounded-2xl bg-destructive/10 text-destructive border border-destructive/20 flex items-center justify-center hover:bg-destructive hover:text-white transition-all"
                                    >
                                        <Trash2 className="w-6 h-6" />
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    </div>

                    {/* Recommendations */}
                    {similarMedia.length > 0 && (
                        <div className="mt-40">
                            <MediaRow title="Similar Discoveries" icon={Sparkles}>
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

            {/* Delete Confirm */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-6">
                    <div className="bg-surface-elevated2 border border-destructive/20 p-10 rounded-[2.5rem] max-w-lg w-full text-center space-y-8 shadow-[0_0_100px_rgba(255,0,0,0.1)]">
                        <div className="w-20 h-20 bg-destructive/20 rounded-full flex items-center justify-center mx-auto">
                            <Trash2 className="w-10 h-10 text-destructive" />
                        </div>
                        <div className="space-y-2">
                             <h2 className="text-3xl font-black tracking-tight uppercase">Delete Record?</h2>
                             <p className="text-white/60">This will permanently remove <span className="text-white font-bold">{title}</span> from your personal archive. This cannot be undone.</p>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 h-16 rounded-2xl bg-white/5 font-black uppercase text-xs tracking-widest hover:bg-white/10 transition-all">Cancel</button>
                            <button onClick={handleDelete} className="flex-1 h-16 rounded-2xl bg-destructive text-white font-black uppercase text-xs tracking-widest hover:bg-destructive/90 transition-all shadow-2xl shadow-destructive/20">Delete Forever</button>
                        </div>
                    </div>
                </div>
            )}
        </PageWrapper>
    );
};

function AttributeRow({ label, value, icon: Icon }: { label: string; value: string; icon: any }) {
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

