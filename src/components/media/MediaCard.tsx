import { Link } from "react-router-dom";
import { useData } from "@/context/DataContext";
import { useMediaStore } from "@/store/mediaStore";
import { useTierBadge } from "@/hooks/useTierBadge";
import { ScoreDisplay } from "./ScoreDisplay";
import type { DisplayMedia } from "@/types/display";
import { Eye, Play, BookOpen, Lock, Edit, CheckSquare, Square, Trophy } from "lucide-react";
import { useState } from "react";
import { EditMediaModal } from "./EditMediaModal";

interface MediaCardProps {
  media: DisplayMedia;
  onEdit?: () => void;
  selectable?: boolean; // TASK 9: Mass edit selection
}

export function MediaCard({ media, onEdit, selectable = false }: MediaCardProps) {
  const { user, getTitle } = useData();
  const { isSelected, toggleSelection } = useMediaStore();
  const tierBoardCount = useTierBadge(media._entryId); // PHASE 9: Tier badge
  const [showEditModal, setShowEditModal] = useState(false);
  const title = getTitle(media);
  const scoreFormat = user?.scoreFormat || "POINT_10";
  const linkPath = `/${media.mediaType.toLowerCase()}/${media._seriesId}`;
  const selected = isSelected(media._entryId);

  const progressLabel =
    media.mediaType === "ANIME"
      ? `${media.progress}${media.episodes ? `/${media.episodes}` : ""}`
      : `${media.progress}${media.chapters ? `/${media.chapters}` : ""}`;

  const progressPercent =
    media.episodes || media.chapters
      ? Math.min(100, (media.progress / (media.episodes || media.chapters || 1)) * 100)
      : 0;

  return (
    <div className="relative">
      {/* TASK 9: Selection checkbox */}
      {selectable && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            toggleSelection(media._entryId);
          }}
          className="absolute top-2 left-2 z-10 p-1.5 bg-surface-0/90 backdrop-blur-sm rounded-lg hover:bg-primary/20 transition-colors"
        >
          {selected ? (
            <CheckSquare className="w-4 h-4 text-primary" />
          ) : (
            <Square className="w-4 h-4 text-foreground" />
          )}
        </button>
      )}
      <Link to={linkPath} className="block">
        <div className={`media-card group cursor-pointer ${selected ? "ring-2 ring-primary" : ""}`}>
        {/* Cover image */}
        <div className="aspect-[2/3] bg-surface-2 relative">
          {media.coverImage ? (
            <img
              src={media.coverImage}
              alt={title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-surface-2">
              {media.mediaType === "ANIME" ? (
                <Play className="w-8 h-8 text-muted-foreground/20" />
              ) : (
                <BookOpen className="w-8 h-8 text-muted-foreground/20" />
              )}
            </div>
          )}

          {/* Hover overlay with quick actions */}
          <div className="media-overlay flex flex-col justify-between p-3">
            {/* Top actions */}
            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowEditModal(true);
                }}
                className="bg-surface-0/70 backdrop-blur-sm rounded-lg p-1.5 hover:bg-primary/20 transition-colors"
                title="Edit"
              >
                <Edit className="w-4 h-4 text-foreground" />
              </button>
              <div className="bg-surface-0/70 backdrop-blur-sm rounded-lg p-1.5 hover:bg-primary/20 transition-colors">
                <Eye className="w-4 h-4 text-foreground" />
              </div>
            </div>

            {/* Bottom info */}
            <div className="space-y-1.5">
              {media.format && (
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                  {media.format}
                </span>
              )}
              {media.genres.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {media.genres.slice(0, 2).map((g) => (
                    <span
                      key={g}
                      className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded-full"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Score badge */}
          {media.score > 0 && (
            <div className="absolute top-2 left-2 bg-surface-0/80 backdrop-blur-sm rounded-lg px-2 py-0.5">
              <ScoreDisplay score={media.score} format={scoreFormat} size="sm" />
            </div>
          )}

          {/* Private badge */}
          {media.isPrivate && (
            <div className="absolute top-2 right-2 bg-destructive/80 backdrop-blur-sm rounded-lg p-1">
              <Lock className="w-3 h-3 text-destructive-foreground" />
            </div>
          )}

          {/* PHASE 9: Tier badge */}
          {tierBoardCount > 0 && (
            <div className="absolute bottom-2 right-2 bg-primary/80 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1">
              <Trophy className="w-3 h-3 text-primary-foreground" />
              <span className="text-xs font-semibold text-primary-foreground">{tierBoardCount}</span>
            </div>
          )}
        </div>

        {/* Title & progress */}
        <div className="p-2.5 bg-card">
          <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-tight mb-1.5">
            {title}
          </h3>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{progressLabel}</span>
            {media.format && <span className="uppercase text-[10px]">{media.format}</span>}
          </div>
          {/* Progress bar */}
          {progressPercent > 0 && (
            <div className="mt-2 h-1 bg-surface-3 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}
        </div>
      </div>
      </Link>
      {showEditModal && (
        <EditMediaModal
          media={media}
          onClose={() => {
            setShowEditModal(false);
            onEdit?.();
          }}
          onDelete={onEdit}
        />
      )}
    </div>
  );
}
