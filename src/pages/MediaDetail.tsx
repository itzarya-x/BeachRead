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
import type { DisplayMedia } from "@/types/display";
import { safeArray } from "@/utils/safeArray";
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
import { SafeImage } from "@/components/ui/SafeImage";

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
        const list = safeArray<DisplayMedia>(mediaType === "ANIME" ? animeList : mangaList);
        return list.find(m => m._seriesId === Number(id)) || null;
    }, [id, mediaType, animeList, mangaList]);

    const similarMedia = useMemo(() => {
        if (!media) return [];
        const list = safeArray<DisplayMedia>(mediaType === "ANIME" ? animeList : mangaList);
        return list
            .filter(m => m._seriesId !== media._seriesId && safeArray<string>(m.genres).some(g => safeArray<string>(media.genres).includes(g)))
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
            <div className="relative min-h-screen pb-32">
                {/* 1. Cinematic Backdrop (Task 16) */}
                <div className="relative w-full h-[650px] md:h-[850px] overflow-hidden">
                    <div className="absolute inset-0">
                        <SafeImage 
                            src={media.bannerImage || media.coverImage || ""} 
                            alt="" 
                            className="w-full h-full object-cover" 
                            style={{ filter: "brightness(0.95) contrast(1) saturate(0.9)" }}
                            useMotion={true}
                            initial={{ scale: 1.15, opacity: 0 }}
                            animate={{ scale: 1, opacity: 0.55 }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            fallback={
                                <div className="w-full h-full bg-gradient-to-b from-surface-elevated1 to-background" />
                            }
                        />
                        {/* Layered Fades (Task 16) */}
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/75 to-background/15" />
                        <div className="absolute inset-0 bg-gradient-to-r from-background/65 via-transparent to-background/35" />
                        <div className="absolute inset-0 bg-primary/[0.04]" />
                    </div>

                    {/* Back Navigation */}
                    <Link 
                        to={backPath}
                        className="group absolute left-10 top-10 z-40 flex scale-90 items-center gap-3 rounded-2xl border border-border bg-card px-6 py-3 text-muted-foreground shadow-sm transition-all hover:border-primary/30 hover:text-foreground md:scale-100"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span className="text-[10px] font-semibold uppercase tracking-[0.2em]">Back to Library</span>
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
                                transition={{ duration: 0.6, delay: 0.2, ease: [0.23, 1, 0.32, 1] }}
                                className="relative aspect-[2/3] w-[320px] overflow-hidden rounded-[1.5rem] border border-border shadow-md ring-1 ring-border/70 transition-all duration-500 group-hover:ring-primary/35 md:w-[420px]"
                            >
                                <SafeImage 
                                    src={media.coverImage} 
                                    alt={title} 
                                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" 
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                            </motion.div>

                            {/* Status Control Ribbon */}
                            <div className="flex items-center gap-2 rounded-2xl border border-border bg-card p-2 shadow-sm">
                                <div className="flex-1 px-4">
                                    <div className="mb-1 text-[9px] font-semibold uppercase tracking-widest text-primary/70">Status</div>
                                    <select 
                                        className="w-full cursor-pointer bg-transparent py-1 text-sm font-semibold uppercase tracking-widest text-foreground outline-none transition-colors hover:text-primary"
                                        value={media.status}
                                        onChange={(e) => handleSaveField("status", e.target.value)}
                                    >
                                        {Object.entries(STATUS_LABELS).map(([key, labelObj]) => (
                                            <option key={key} value={key} className="bg-card text-foreground">
                                                {labelObj[mediaType] || key}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="h-10 w-px bg-border" />
                                <button className="p-4 text-muted-foreground transition-all hover:scale-110 hover:text-destructive active:scale-90">
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
                                        <span className="rounded-xl border border-primary/25 bg-primary px-5 py-2 text-[10px] font-semibold uppercase tracking-[0.3em] text-primary-foreground shadow-sm">
                                            {media.mediaType}
                                        </span>
                                        <span className="text-xs font-semibold uppercase tracking-[0.4em] text-muted-foreground">{media.format || "Standard Archive"}</span>
                                    </div>
                                    
                                    <h1 className="text-balance text-6xl font-black leading-[0.8] tracking-tighter text-foreground md:text-[10rem]">
                                        {title}
                                    </h1>

                                    {/* Visual Stats Bar (Task 17) */}
                                    <div className="flex flex-wrap items-center gap-12 pt-4">
                                        <div className="space-y-2">
                                            <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">Archive Grade</div>
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
                                                                i < Math.round(media.score / 20) ? "bg-primary" : "bg-muted"
                                                            )} 
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="hidden h-16 w-px bg-border md:block" />
                                        
                                        <div className="space-y-2 flex-1 max-w-[300px]">
                                            <div className="flex justify-between items-end">
                                                <div className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">Progression</div>
                                                <div className="text-2xl font-black text-foreground tabular-nums tracking-tighter leading-none">
                                                    {media.progress} <span className="ml-1 text-sm font-semibold text-muted-foreground">/ {media.episodes || media.chapters || "?"}</span>
                                                </div>
                                            </div>
                                            <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${progressPercent}%` }}
                                                    className="absolute inset-0 rounded-full bg-primary"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Dynamic Genres */}
                                <div className="flex flex-wrap gap-3">
                                    {media.genres.map(genre => (
                                        <span key={genre} className="cursor-default rounded-2xl border border-border bg-card px-6 py-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground transition-all hover:border-primary/40 hover:text-primary">
                                            {genre}
                                        </span>
                                    ))}
                                </div>

                                {/* Narrative Context (Task 16) */}
                                {media.description && (
                                    <div className="max-w-4xl space-y-10">
                                        <div className="flex items-center gap-6">
                                            <h3 className="text-[10px] font-semibold uppercase tracking-[0.35em] text-muted-foreground text-nowrap">Synopsis</h3>
                                            <div className="h-px w-full bg-border" />
                                        </div>
                                        <div 
                                            className="detail-description text-2xl font-medium leading-[1.6] tracking-tight text-foreground/80 md:text-3xl"
                                            dangerouslySetInnerHTML={{ __html: media.description }}
                                        />
                                    </div>
                                )}

                                {/* Metadata Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-10">
                                    <div className="space-y-6">
                                        <h4 className="flex items-center gap-4 text-[10px] font-semibold uppercase tracking-[0.4em] text-primary/70">
                                            <MessageSquare className="w-4 h-4" /> Notes
                                        </h4>
                                        <div className="relative rounded-[2rem] border border-border bg-card p-10 text-xl font-medium italic leading-relaxed text-foreground/75 shadow-sm">
                                            <div className="absolute left-8 top-0 -translate-y-1/2 rounded-full border border-border bg-background px-4 py-1 text-[9px] font-semibold uppercase tracking-widest text-muted-foreground">Saved note</div>
                                            {media.notes || "No reflection indexed yet..."}
                                        </div>
                                    </div>
                                    <div className="space-y-6">
                                        <h4 className="flex items-center gap-4 text-[10px] font-semibold uppercase tracking-[0.4em] text-primary/70">
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
                                <div className="flex items-center gap-6 border-t border-border pt-16">
                                    <Button onClick={() => setShowEditModal(true)} size="lg" className="gap-4 rounded-2xl px-12 text-sm font-semibold uppercase tracking-[0.2em]">
                                        <Edit3 className="w-5 h-5" /> Edit Entry
                                    </Button>
                                    <button 
                                        onClick={() => setShowDeleteConfirm(true)}
                                        className="flex h-20 w-20 items-center justify-center rounded-2xl border border-destructive/25 bg-destructive/10 text-destructive transition-all hover:bg-destructive hover:text-white"
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
                            <MediaRow title="More Like This" icon={Sparkles}>
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
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90 p-6">
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="w-full max-w-xl space-y-10 rounded-[2rem] border border-destructive/20 bg-card p-12 text-center shadow-sm md:p-16"
                    >
                        <div className="mx-auto flex h-24 w-24 rotate-12 items-center justify-center rounded-3xl bg-destructive/20">
                            <Trash2 className="w-12 h-12 text-destructive -rotate-12" />
                        </div>
                        <div className="space-y-4">
                             <h2 className="text-4xl font-black tracking-tighter uppercase leading-none">Delete Entry?</h2>
                             <p className="text-lg leading-relaxed text-muted-foreground">This will permanently remove <span className="font-bold text-foreground">{title}</span> from your vault.</p>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setShowDeleteConfirm(false)} className="h-20 flex-1 rounded-2xl border border-border bg-muted text-xs font-semibold uppercase tracking-widest transition-all hover:bg-muted/70">Cancel</button>
                            <button onClick={handleDelete} className="h-20 flex-1 rounded-2xl bg-destructive text-xs font-semibold uppercase tracking-widest text-white transition-all hover:bg-destructive/90">Delete</button>
                        </div>
                    </motion.div>
                </div>
            )}
        </PageWrapper>
    );
};

function AttributeRow({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
    return (
        <div className="flex flex-col gap-1 rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-1">
                <Icon className="w-3 h-3 text-primary/50" />
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
            </div>
            <div className="text-sm font-semibold text-foreground">{value}</div>
        </div>
    );
}

export default MediaDetail;
