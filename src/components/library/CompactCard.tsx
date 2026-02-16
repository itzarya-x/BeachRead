import React from "react";
import { useData } from "@/context/DataContext";
import type { DisplayMedia } from "@/types/display";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

interface CompactCardProps {
  media: DisplayMedia;
}

export const CompactCard = React.memo(({ media }: CompactCardProps) => {
  const { getTitle } = useData();
  const title = getTitle(media);
  const linkPath = `/${media.mediaType.toLowerCase()}/${media._seriesId}`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="group w-full max-w-[120px] space-y-2"
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
          <div className="flex h-full w-full items-center justify-center text-white/5 font-black uppercase tracking-tighter text-2xl">
            {media.mediaType[0]}
          </div>
        )}
      </Link>

      <Link to={linkPath} className="block group-hover:text-primary transition-colors px-0.5">
        <h3 className="text-[11px] font-bold leading-tight line-clamp-2 tracking-tight text-white/80">
          {title}
        </h3>
      </Link>
    </motion.div>
  );
});

CompactCard.displayName = "CompactCard";
