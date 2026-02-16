import React from "react";
import { useData } from "@/context/DataContext";
import { cn } from "@/lib/utils";
import type { DisplayMedia } from "@/types/display";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Link } from "react-router-dom";

interface MediaCardProps {
  media: DisplayMedia;
}

export const MediaCard = React.memo(({ media }: MediaCardProps) => {
  const { getTitle } = useData();
  const title = getTitle(media);
  const linkPath = `/${media.mediaType.toLowerCase()}/${media._seriesId}`;

  const progressLabel =
    media.mediaType === "ANIME"
      ? `${media.progress}${media.episodes ? `/${media.episodes}` : ""}`
      : `${media.progress}${media.chapters ? `/${media.chapters}` : ""}`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group w-full max-w-[160px] space-y-2.5"
    >
      <Link to={linkPath} className="block relative aspect-[2/3] overflow-hidden rounded-[14px] bg-white/5 border border-white/10 shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:border-primary/30">
        {media.coverImage ? (
          <img
            src={media.coverImage}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-white/5 font-black uppercase tracking-tighter text-4xl">
            {media.mediaType[0]}
          </div>
        )}
        
        {/* Quick info overlay on hover could go here, but prompt says title below image */}
        {media.score > 0 && (
          <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-1">
            <Star className="w-2 h-2 fill-primary text-primary" />
            <span className="text-[10px] font-black text-white">{media.score}</span>
          </div>
        )}
      </Link>

      <div className="space-y-1 px-0.5">
        <Link to={linkPath} className="block group-hover:text-primary transition-colors">
          <h3 className="text-sm font-bold leading-tight line-clamp-2 tracking-tight text-white/90">
            {title}
          </h3>
        </Link>
        
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-bold uppercase tracking-widest text-white/40">
          <span className="text-primary/70">{media.status}</span>
          <span className="w-1 h-1 rounded-full bg-white/10" />
          <span>{progressLabel}</span>
        </div>

        {media.tags && media.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {media.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="px-1.5 py-0.5 rounded-md bg-white/5 border border-white/5 text-[8px] font-black uppercase tracking-tighter text-white/30 whitespace-nowrap">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
});

MediaCard.displayName = "MediaCard";
