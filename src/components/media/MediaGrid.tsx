import { MediaCard } from "./MediaCard";
import type { DisplayMedia } from "@/types/display";

interface MediaGridProps {
  items: DisplayMedia[];
  emptyMessage?: string;
}

export function MediaGrid({ items, emptyMessage = "No entries found" }: MediaGridProps) {
  if (items.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground">
        <p className="text-lg">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {items.map((item, idx) => (
        <div
          key={`${item._seriesId}-${idx}`}
          className="animate-fade-in"
          style={{ animationDelay: `${Math.min(idx * 25, 250)}ms` }}
        >
          <MediaCard media={item} />
        </div>
      ))}
    </div>
  );
}
