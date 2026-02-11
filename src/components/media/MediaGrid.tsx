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
