import { ScoreDisplay } from "@/components/media/ScoreDisplay";
import { useData } from "@/context/DataContext";
import type { DisplayMedia } from "@/types/display";
import { BookOpen, Clock, Play } from "lucide-react";
import { Link } from "react-router-dom";

interface RecentlyUpdatedCardProps {
    media: DisplayMedia;
}

function RecentlyUpdatedCard({ media }: RecentlyUpdatedCardProps) {
    const { user, getTitle } = useData();
    const title = getTitle(media);
    const scoreFormat = user?.scoreFormat || "POINT_10";
    const linkPath = `/${media.mediaType.toLowerCase()}/${media._seriesId}`;

    const progressLabel =
        media.mediaType === "ANIME"
            ? `${media.progress}${media.episodes ? `/${media.episodes}` : ""}`
            : `${media.progress}${media.chapters ? `/${media.chapters}` : ""}`;

    const progressPercent =
        media.episodes || media.chapters
            ? Math.min(100, (media.progress / (media.episodes || media.chapters || 1)) * 100)
            : 0;

    const daysAgo = Math.floor((Date.now() - new Date(media.updatedAt).getTime()) / (1000 * 60 * 60 * 24));
    const timeAgoText = daysAgo === 0 ? "Today" : daysAgo === 1 ? "Yesterday" : `${daysAgo}d ago`;

    return (
        <Link to={linkPath} className="group">
            <div className="flex gap-3 p-3 rounded-lg hover:bg-secondary/40 transition-all duration-200 border border-transparent hover:border-primary/20">
                {/* Small cover image */}
                <div className="shrink-0 w-16 h-24 rounded-lg overflow-hidden bg-surface-2">
                    {media.coverImage ? (
                        <img
                            src={media.coverImage}
                            alt={title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            loading="lazy"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            {media.mediaType === "ANIME" ? (
                                <Play className="w-6 h-6 text-muted-foreground/30" />
                            ) : (
                                <BookOpen className="w-6 h-6 text-muted-foreground/30" />
                            )}
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                        {title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">{progressLabel}</p>

                    {/* Progress bar */}
                    {progressPercent > 0 && (
                        <div className="h-1 bg-muted/50 rounded-full overflow-hidden mt-2">
                            <div
                                className="h-full bg-primary/60 rounded-full"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    )}

                    {/* Time and score */}
                    <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground/70">{timeAgoText}</span>
                        {media.score > 0 && <ScoreDisplay score={media.score} format={scoreFormat} size="xs" />}
                    </div>
                </div>
            </div>
        </Link>
    );
}

interface RecentlyUpdatedSectionProps {
    items: DisplayMedia[];
    onViewAll: () => void;
}

export function RecentlyUpdatedSection({ items, onViewAll }: RecentlyUpdatedSectionProps) {
    if (items.length === 0) return null;

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="section-title text-2xl md:text-3xl">
                    <Clock className="w-6 h-6 text-primary" />
                    Recently Updated
                </h2>
                <button
                    onClick={onViewAll}
                    className="text-sm text-primary hover:text-primary/80 font-semibold transition-colors"
                >
                    View All →
                </button>
            </div>

            {/* Compact list */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {items.slice(0, 10).map(item => (
                    <RecentlyUpdatedCard key={`${item._seriesId}-recent`} media={item} />
                ))}
            </div>
        </section>
    );
}
