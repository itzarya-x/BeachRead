import { ScoreDisplay } from "@/components/media/ScoreDisplay";
import { useData } from "@/context/DataContext";
import type { DisplayMedia } from "@/types/display";
import { BookOpen, Edit2, Eye, Play, Trophy } from "lucide-react";
import { Link } from "react-router-dom";

interface MediaRowCardProps {
    media: DisplayMedia;
}

export function MediaRowCard({ media }: MediaRowCardProps) {
    const { user, getTitle } = useData();
    const title = getTitle(media);
    const scoreFormat = user?.scoreFormat || "POINT_10";
    const linkPath = `/${media.mediaType.toLowerCase()}/${media._seriesId}`;

    const progressLabel =
        media.mediaType === "ANIME"
            ? `${media.progress}${media.episodes ? `/${media.episodes}` : ""} ep`
            : `${media.progress}${media.chapters ? `/${media.chapters}` : ""} ch`;

    const progressPercent =
        media.episodes || media.chapters
            ? Math.min(100, (media.progress / (media.episodes || media.chapters || 1)) * 100)
            : 0;

    return (
        <Link to={linkPath} className="shrink-0 w-[160px] md:w-[180px] group">
            <div className="media-card relative">
                {/* Cover */}
                <div className="aspect-[2/3] bg-surface-2 relative overflow-hidden">
                    {media.coverImage ? (
                        <img
                            src={media.coverImage}
                            alt={title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            loading="lazy"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-surface-2">
                            {media.mediaType === "ANIME" ? (
                                <Play className="w-8 h-8 text-muted-foreground/30" />
                            ) : (
                                <BookOpen className="w-8 h-8 text-muted-foreground/30" />
                            )}
                        </div>
                    )}

                    {/* Hover overlay */}
                    <div className="media-overlay flex flex-col justify-between p-3 gap-1.5">
                        {/* Top actions */}
                        <div className="flex gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <button
                                onClick={e => {
                                    e.preventDefault();
                                }}
                                className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 transition-colors"
                                title="Edit"
                            >
                                <Edit2 className="w-3.5 h-3.5 text-white" />
                            </button>
                            <button
                                onClick={e => {
                                    e.preventDefault();
                                }}
                                className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 transition-colors"
                                title="Tier"
                            >
                                <Trophy className="w-3.5 h-3.5 text-white" />
                            </button>
                            <button
                                onClick={e => {
                                    e.preventDefault();
                                }}
                                className="p-1.5 rounded-lg bg-black/60 hover:bg-black/80 transition-colors"
                                title="Details"
                            >
                                <Eye className="w-3.5 h-3.5 text-white" />
                            </button>
                        </div>

                        {/* Bottom info */}
                        <div className="space-y-1.5">
                            <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-tight">
                                {title}
                            </h3>
                            <span className="text-xs text-muted-foreground">{progressLabel}</span>
                            {/* Progress bar on hover */}
                            {progressPercent > 0 && (
                                <div className="h-1 bg-muted/50 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary rounded-full"
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Score badge */}
                    {media.score > 0 && (
                        <div className="absolute top-2 left-2 bg-surface-0/80 backdrop-blur-sm rounded-lg px-2 py-0.5 group-hover:scale-110 transition-transform duration-200">
                            <ScoreDisplay score={media.score} format={scoreFormat} size="sm" />
                        </div>
                    )}

                    {/* Tier badge if exists */}
                    {media.tier && (
                        <div
                            className={`absolute bottom-2 right-2 px-2 py-0.5 rounded font-bold text-xs tier-${media.tier.toLowerCase()}`}
                        >
                            {media.tier}
                        </div>
                    )}
                </div>
            </div>
        </Link>
    );
}
