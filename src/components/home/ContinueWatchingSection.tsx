import { ScoreDisplay } from "@/components/media/ScoreDisplay";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useData } from "@/context/DataContext";
import type { DisplayMedia } from "@/types/display";
import { BookOpen, Play, PlayCircle } from "lucide-react";
import { Link } from "react-router-dom";

interface ContinueWatchingCardProps {
    media: DisplayMedia;
}

function ContinueWatchingCard({ media }: ContinueWatchingCardProps) {
    const { user, getTitle } = useData();
    const title = getTitle(media);
    const scoreFormat = user?.scoreFormat || "POINT_10";
    const linkPath = `/${media.mediaType.toLowerCase()}/${media._seriesId}`;

    const progressLabel =
        media.mediaType === "ANIME"
            ? `${media.progress}${media.episodes ? `/${media.episodes}` : ""} episodes`
            : `${media.progress}${media.chapters ? `/${media.chapters}` : ""} chapters`;

    const progressPercent =
        media.episodes || media.chapters
            ? Math.min(100, (media.progress / (media.episodes || media.chapters || 1)) * 100)
            : 0;

    return (
        <Link to={linkPath} className="group shrink-0 w-full sm:w-[280px] h-[420px]">
            <Card className="relative h-full overflow-hidden p-0 border-0 bg-card hover:shadow-xl transition-all duration-300 hover:scale-105">
                {/* Cover Image - Large */}
                <div className="absolute inset-0">
                    {media.coverImage ? (
                        <img
                            src={media.coverImage}
                            alt={title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            loading="lazy"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-surface-2">
                            {media.mediaType === "ANIME" ? (
                                <Play className="w-12 h-12 text-muted-foreground/30" />
                            ) : (
                                <BookOpen className="w-12 h-12 text-muted-foreground/30" />
                            )}
                        </div>
                    )}

                    {/* Premium gradient overlay - thicker at bottom */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/98 via-black/40 to-transparent" />

                    {/* Score badge - top right */}
                    {media.score > 0 && (
                        <div className="absolute top-3 right-3 backdrop-blur-md bg-black/50 rounded-lg px-3 py-1.5 border border-white/10 shadow-lg">
                            <ScoreDisplay score={media.score} format={scoreFormat} size="sm" />
                        </div>
                    )}

                    {/* Content overlay - bottom */}
                    <div className="absolute bottom-0 left-0 right-0 p-5 space-y-3">
                        {/* Title */}
                        <div>
                            <h3 className="text-lg font-bold text-foreground line-clamp-2 leading-tight">{title}</h3>
                        </div>

                        {/* Progress info */}
                        <div className="space-y-2">
                            <p className="text-xs text-gray-300/80">{progressLabel}</p>
                            {progressPercent > 0 && (
                                <div className="h-2 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                                    <div
                                        className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-300 shadow-lg"
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                            )}
                        </div>

                        {/* Resume button with hover effect */}
                        <Button
                            onClick={e => {
                                e.preventDefault();
                            }}
                            className="w-full gap-2 mt-3 group/btn shadow-lg hover:shadow-xl"
                            size="sm"
                            variant="default"
                        >
                            <PlayCircle className="w-4 h-4 group-hover/btn:scale-110 transition-transform" />
                            Resume
                        </Button>
                    </div>

                    {/* Hover glow border */}
                    <div className="absolute inset-0 rounded-lg border-2 border-primary/0 group-hover:border-primary/50 transition-colors duration-300 pointer-events-none shadow-lg" />
                </div>
            </Card>
        </Link>
    );
}

interface ContinueWatchingSectionProps {
    items: DisplayMedia[];
    onViewAll: () => void;
}

export function ContinueWatchingSection({ items, onViewAll }: ContinueWatchingSectionProps) {
    if (items.length === 0) return null;

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="section-title text-2xl md:text-3xl">
                    <PlayCircle className="w-6 h-6 text-primary" />
                    Continue Watching
                </h2>
                <button
                    onClick={onViewAll}
                    className="text-sm text-primary hover:text-primary/80 font-semibold transition-colors"
                >
                    View All →
                </button>
            </div>

            {/* Carousel - full width scroll on mobile, grid on desktop */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 overflow-x-auto pb-2 hide-scrollbar">
                {items.slice(0, 12).map(item => (
                    <ContinueWatchingCard key={item._seriesId} media={item} />
                ))}
            </div>
        </section>
    );
}
