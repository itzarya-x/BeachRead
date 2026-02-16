import { AutoBento } from "@/components/layout/AutoBento";
import { EmptySearchResults, EmptyState } from "@/components/ui/EmptyState";
import type { DisplayMedia } from "@/types/display";
import { Search } from "lucide-react";
import { MediaCard } from "./MediaCard";

interface MediaGridProps {
  items: DisplayMedia[];
  emptyMessage?: string;
}

export function MediaGrid({ items, emptyMessage = "No entries found" }: MediaGridProps) {
  if (items.length === 0) {
    // If we have an empty message that looks like a search failure, use the search preset
    const isSearch = emptyMessage.toLowerCase().includes("filter") || emptyMessage.toLowerCase().includes("search");
    
    return isSearch ? (
      <EmptySearchResults />
    ) : (
      <EmptyState
        icon={Search}
        title="Command Void"
        description={emptyMessage}
      />
    );
  }

  return (
    <AutoBento maxWidth={1500} minTileWidth={220} className="w-full">
      {items.map((item, idx) => (
        <div
          key={`${item._seriesId}-${idx}`}
          className="animate-fade-in"
          style={{ animationDelay: `${Math.min(idx * 25, 250)}ms` }}
        >
          <MediaCard media={item} />
        </div>
      ))}
    </AutoBento>
  );
}
