import React from "react";
import { useData } from "@/context/DataContext";
import type { DisplayMedia } from "@/types/display";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { safeFormatDistance } from "@/lib/utils";
import { Star, Trophy } from "lucide-react";

interface MediaListRowProps {
  media: DisplayMedia;
}

export const MediaListRow = React.memo(({ media }: MediaListRowProps) => {
  const { getTitle } = useData();
  const title = getTitle(media);
  const linkPath = `/${media.mediaType.toLowerCase()}/${media._seriesId}`;

  const progressLabel =
    media.mediaType === "ANIME"
      ? `${media.progress}${media.episodes ? `/${media.episodes}` : ""}`
      : `${media.progress}${media.chapters ? `/${media.chapters}` : ""}`;

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className="group flex items-center gap-4 p-3 bg-white/[0.02] border border-white/5 rounded-xl transition-all duration-200 hover:bg-white/[0.05] hover:border-primary/20"
    >
      <Link to={linkPath} className="shrink-0 w-[60px] h-[90px] overflow-hidden rounded-lg bg-white/5 border border-white/10 shadow-sm transition-transform duration-300 group-hover:scale-[1.03]">
        {media.coverImage ? (
          <img
            src={media.coverImage}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-white/10 font-black text-xl">
            {media.mediaType[0]}
          </div>
        )}
      </Link>

      <div className="flex-1 min-w-0 grid grid-cols-12 gap-4 items-center">
        <div className="col-span-12 lg:col-span-5 space-y-1">
          <Link to={linkPath} className="block group-hover:text-primary transition-colors">
            <h3 className="text-sm font-bold truncate tracking-tight text-white/90">
              {title}
            </h3>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary/70">{media.format || "ASSET"}</span>
            {media.tierId && (
              <div className="flex items-center gap-1 text-[10px] font-black text-yellow-500/80 uppercase tracking-tighter">
                <Trophy className="w-3 h-3" />
                {media.tierId}
              </div>
            )}
          </div>
        </div>

        <div className="col-span-4 lg:col-span-2 text-center lg:text-left">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-0.5">Status</div>
          <span className="text-xs font-bold text-white/60 uppercase">{media.status}</span>
        </div>

        <div className="col-span-4 lg:col-span-2 text-center lg:text-left">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-0.5">Progress</div>
          <span className="text-xs font-bold text-white/60 tabular-nums">{progressLabel}</span>
        </div>

        <div className="col-span-4 lg:col-span-1 text-center lg:text-left">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-0.5">Score</div>
          <div className="flex items-center justify-center lg:justify-start gap-1">
            <Star className={cn("w-3 h-3", media.score > 0 ? "fill-primary text-primary" : "text-white/10")} />
            <span className="text-xs font-black text-white/60 tabular-nums">{media.score || "??"}</span>
          </div>
        </div>

        <div className="hidden lg:block lg:col-span-2 text-right pr-4">
          <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-0.5">Modified</div>
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-tighter">
            {safeFormatDistance(media.updatedAt, { addSuffix: true })}
          </span>
        </div>
      </div>
    </motion.div>
  );
});

MediaListRow.displayName = "MediaListRow";
import { cn } from "@/lib/utils";
