import { PageWrapper } from "@/components/layout/PageWrapper";
import { useData } from "@/context/DataContext";
import { useLocalStorage } from "@/hooks/useLocalStorage";
import { formatScore, STATUS_LABELS } from "@/lib/constants";
import {
    ArrowLeft,
    BookOpen,
    Calendar,
    EyeOff,
    Hash,
    Layers,
    Lock,
    MessageSquare,
    Play,
    Repeat,
    Save,
    Star,
    Tag,
} from "lucide-react";
import { useMemo } from "react";
import { Link, useLocation, useParams } from "react-router-dom";

const MediaDetail = () => {
    const { id } = useParams<{ id: string }>();
    const location = useLocation();
    const { animeList, mangaList, user, getTitle, loading } = useData();

    const mediaType = location.pathname.startsWith("/anime") ? "ANIME" : "MANGA";
    const backPath = `/${mediaType.toLowerCase()}`;

    const media = useMemo(() => {
        const list = mediaType === "ANIME" ? animeList : mangaList;
        return list.find(m => m._seriesId === Number(id)) || null;
    }, [id, mediaType, animeList, mangaList]);

    const [personalComment, setPersonalComment] = useLocalStorage(`media-comment-${id}`, "");

    if (loading) {
        return (
            <div className="flex min-h-[50vh] items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!media || !user) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-10 text-center">
                <p className="text-muted-foreground text-lg mb-4">Media not found</p>
                <Link to={backPath} className="text-primary hover:underline inline-flex items-center gap-1">
                    <ArrowLeft className="w-4 h-4" /> Back to {mediaType === "ANIME" ? "Anime" : "Manga"} Vault
                </Link>
            </div>
        );
    }

    const title = getTitle(media);
    const scoreFormat = user.scoreFormat;
    const statusLabel = STATUS_LABELS[media.status]?.[media.mediaType] || media.status;

    const progressLabel =
        media.mediaType === "ANIME"
            ? `${media.progress}${media.episodes ? ` / ${media.episodes} episodes` : " episodes"}`
            : `${media.progress}${media.chapters ? ` / ${media.chapters} chapters` : " chapters"}`;

    const hasAdvancedScores = media.advancedScores.length > 0 && media.advancedScores.some(s => s > 0);

    return (
        <PageWrapper>
            <div className="animate-fade-in">
                {/* Hero banner */}
                <div className="relative h-56 md:h-72 lg:h-80 overflow-hidden">
                    {media.bannerImage ? (
                        <img src={media.bannerImage} alt="" className="w-full h-full object-cover" />
                    ) : media.coverImage ? (
                        <img
                            src={media.coverImage}
                            alt=""
                            className="w-full h-full object-cover blur-2xl scale-110 opacity-40"
                        />
                    ) : (
                        <div className="w-full h-full bg-gradient-to-br from-primary/20 via-surface-1 to-accent/10" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

                    {/* Back button */}
                    <div className="absolute top-4 left-4 z-10">
                        <Link
                            to={backPath}
                            className="flex items-center gap-2 bg-surface-0/70 backdrop-blur-sm text-foreground px-3 py-2 rounded-xl text-sm font-medium hover:bg-surface-0/90 transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </Link>
                    </div>
                </div>

                {/* Main content */}
                <div className="max-w-5xl mx-auto px-4 -mt-24 md:-mt-32 relative z-10">
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Cover */}
                        <div className="shrink-0">
                            <div className="w-44 md:w-52 aspect-[2/3] rounded-xl overflow-hidden shadow-2xl ring-2 ring-border/20">
                                {media.coverImage ? (
                                    <img src={media.coverImage} alt={title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-surface-2 flex items-center justify-center">
                                        {media.mediaType === "ANIME" ? (
                                            <Play className="w-12 h-12 text-muted-foreground/30" />
                                        ) : (
                                            <BookOpen className="w-12 h-12 text-muted-foreground/30" />
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0 pt-2 md:pt-12">
                            <h1 className="font-display text-2xl md:text-3xl lg:text-4xl font-extrabold text-foreground mb-2 text-shadow-sm">
                                {title}
                            </h1>

                            {/* Alternative titles */}
                            {media.title.english && media.title.english !== title && (
                                <p className="text-sm text-muted-foreground mb-1">{media.title.english}</p>
                            )}
                            {media.title.native && (
                                <p className="text-sm text-muted-foreground mb-3">{media.title.native}</p>
                            )}

                            {/* Tags */}
                            <div className="flex flex-wrap items-center gap-2 mb-4">
                                <span className={`status-badge status-${media.status.toLowerCase()}`}>
                                    {statusLabel}
                                </span>
                                {media.format && (
                                    <span className="text-xs bg-surface-3 text-secondary-foreground px-2.5 py-1 rounded-full font-semibold uppercase">
                                        {media.format}
                                    </span>
                                )}
                                {media.isPrivate && (
                                    <span className="text-xs bg-destructive/20 text-destructive px-2.5 py-1 rounded-full font-semibold inline-flex items-center gap-1">
                                        <Lock className="w-3 h-3" />
                                        Private
                                    </span>
                                )}
                                {media.hiddenDefault && (
                                    <span className="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-full font-semibold inline-flex items-center gap-1">
                                        <EyeOff className="w-3 h-3" />
                                        Hidden
                                    </span>
                                )}
                                {media.seasonYear && (
                                    <span className="text-xs text-muted-foreground">
                                        {media.season} {media.seasonYear}
                                    </span>
                                )}
                            </div>

                            {/* Genres */}
                            {media.genres.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mb-5">
                                    {media.genres.map(g => (
                                        <span
                                            key={g}
                                            className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium"
                                        >
                                            {g}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Stats summary */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-8">
                        <StatBox
                            icon={Star}
                            label="Score"
                            value={media.score > 0 ? formatScore(media.score, scoreFormat) : "Unscored"}
                        />
                        <StatBox icon={Hash} label="Progress" value={progressLabel} />
                        <StatBox icon={Repeat} label="Rewatches" value={String(media.repeat)} />
                        <StatBox icon={Calendar} label="Started" value={media.startedAt || "—"} />
                    </div>

                    {/* Description */}
                    {media.description && (
                        <div className="mt-8 bg-card rounded-xl border border-border/40 p-5">
                            <h2 className="font-display text-lg font-bold text-foreground mb-3">Description</h2>
                            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                {media.description.replace(/<[^>]*>/g, "")}
                            </p>
                        </div>
                    )}

                    {/* Personal comments (Yura box) */}
                    <div className="mt-6 bg-card rounded-xl border border-border/40 p-5">
                        <div className="flex items-center gap-2 mb-3">
                            <MessageSquare className="w-5 h-5 text-accent" />
                            <h2 className="font-display text-lg font-bold text-foreground">My Notes</h2>
                        </div>

                        {/* GDPR notes */}
                        {media.notes && (
                            <div className="mb-4 bg-surface-1 rounded-lg p-3 border border-border/30">
                                <p className="text-xs text-muted-foreground font-medium mb-1">
                                    Original Notes (from GDPR)
                                </p>
                                <p className="text-sm text-foreground whitespace-pre-wrap">{media.notes}</p>
                            </div>
                        )}

                        {/* Personal comment textarea */}
                        <textarea
                            value={personalComment}
                            onChange={e => setPersonalComment(e.target.value)}
                            placeholder="Add your personal thoughts, reviews, or notes…"
                            className="w-full bg-surface-1 border border-border/40 rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary/40 transition-all resize-y min-h-[100px]"
                        />
                        <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                            <Save className="w-3 h-3" />
                            Auto-saved locally
                        </p>
                    </div>

                    {/* Advanced Scores */}
                    {hasAdvancedScores && (
                        <div className="mt-6 bg-card rounded-xl border border-border/40 p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <Layers className="w-5 h-5 text-primary" />
                                <h2 className="font-display text-lg font-bold text-foreground">Advanced Scores</h2>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                {media.advancedScores.map((score, idx) => {
                                    const label = user.advancedScoresNames[idx] || `Category ${idx + 1}`;
                                    return (
                                        <div
                                            key={idx}
                                            className="flex justify-between items-center bg-surface-1 rounded-lg px-3 py-2 text-sm"
                                        >
                                            <span className="text-muted-foreground">{label}</span>
                                            <span className="text-foreground font-bold">{score > 0 ? score : "—"}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Custom Lists */}
                    {media.customLists.length > 0 && (
                        <div className="mt-6 bg-card rounded-xl border border-border/40 p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <Tag className="w-5 h-5 text-primary" />
                                <h2 className="font-display text-lg font-bold text-foreground">Custom Lists</h2>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {media.customLists.map(list => (
                                    <span
                                        key={list}
                                        className="text-xs bg-primary/10 text-primary px-3 py-1.5 rounded-full font-medium"
                                    >
                                        {list}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Full Details */}
                    <div className="mt-6 mb-12 bg-card rounded-xl border border-border/40 p-5">
                        <h2 className="font-display text-lg font-bold text-foreground mb-3">All Details</h2>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                            <DetailRow label="Status" value={statusLabel} />
                            <DetailRow label="Score (raw)" value={media.score > 0 ? String(media.score) : "—"} />
                            <DetailRow
                                label="Score (formatted)"
                                value={media.score > 0 ? formatScore(media.score, scoreFormat) : "—"}
                            />
                            <DetailRow label="Progress" value={progressLabel} />
                            <DetailRow
                                label="Volume Progress"
                                value={
                                    media.progressVolumes > 0
                                        ? `${media.progressVolumes}${media.volumes ? ` / ${media.volumes}` : ""}`
                                        : "—"
                                }
                            />
                            <DetailRow label="Started" value={media.startedAt || "—"} />
                            <DetailRow label="Completed" value={media.completedAt || "—"} />
                            <DetailRow label="Repeat" value={String(media.repeat)} />
                            <DetailRow label="Priority" value={String(media.priority)} />
                            <DetailRow label="Private" value={media.isPrivate ? "Yes" : "No"} />
                            <DetailRow label="Hidden Default" value={media.hiddenDefault ? "Yes" : "No"} />
                            <DetailRow label="Media Type" value={media.mediaType} />
                            <DetailRow label="Created" value={new Date(media.createdAt).toLocaleString()} />
                            <DetailRow label="Updated" value={new Date(media.updatedAt).toLocaleString()} />
                            {media.format && <DetailRow label="Format (API)" value={media.format} />}
                            {media.episodes !== null && (
                                <DetailRow label="Total Episodes (API)" value={String(media.episodes)} />
                            )}
                            {media.chapters !== null && (
                                <DetailRow label="Total Chapters (API)" value={String(media.chapters)} />
                            )}
                            {media.volumes !== null && (
                                <DetailRow label="Total Volumes (API)" value={String(media.volumes)} />
                            )}
                            {media.season && (
                                <DetailRow label="Season (API)" value={`${media.season} ${media.seasonYear || ""}`} />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </PageWrapper>
    );
};

function StatBox({ icon: Icon, label, value }: { icon: typeof Star; label: string; value: string }) {
    return (
        <div className="bg-card rounded-xl border border-border/40 p-4 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-primary" />
            </div>
            <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-bold text-foreground">{value}</p>
            </div>
        </div>
    );
}

function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between py-1.5 border-b border-border/20">
            <span className="text-muted-foreground">{label}</span>
            <span className="text-foreground font-medium text-right">{value}</span>
        </div>
    );
}

export default MediaDetail;
