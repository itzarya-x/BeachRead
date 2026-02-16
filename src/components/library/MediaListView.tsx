import React from "react";
import type { DisplayMedia } from "@/types/display";
import { MediaCard } from "./MediaCard";
import { CompactCard } from "./CompactCard";
import { MediaListRow } from "./MediaListRow";
import { ViewMode } from "./ViewSwitcher";
import { cn } from "@/lib/utils";
import { AnimatePresence } from "framer-motion";

interface MediaListViewProps {
  items: DisplayMedia[];
  viewMode: ViewMode;
}

export function MediaListView({ items, viewMode }: MediaListViewProps) {
  if (viewMode === "list") {
    return (
      <div className="flex flex-col gap-2 w-full max-w-[1400px] mx-auto px-4 md:px-6">
        <AnimatePresence mode="popLayout">
          {items.map((item) => (
            <MediaListRow key={item._seriesId} media={item} />
          ))}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "grid mx-auto px-4 md:px-6 w-full max-w-[1400px]",
        viewMode === "grid" 
          ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-6" 
          : "grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 2xl:grid-cols-10 gap-4"
      )}
      style={{
        gridTemplateColumns: viewMode === "grid" 
          ? "repeat(auto-fill, minmax(160px, 1fr))" 
          : "repeat(auto-fill, minmax(120px, 1fr))"
      }}
    >
      <AnimatePresence mode="popLayout">
        {items.map((item) => (
          <div key={item._seriesId} className="flex justify-center">
            {viewMode === "grid" ? (
              <MediaCard media={item} />
            ) : (
              <CompactCard media={item} />
            )}
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
