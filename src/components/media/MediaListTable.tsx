import { useData } from "@/context/DataContext";
import { ScoreDisplay } from "./ScoreDisplay";
import type { DisplayMedia } from "@/types/display";

interface MediaListTableProps {
  items: DisplayMedia[];
  emptyMessage?: string;
}

export function MediaListTable({
  items,
  emptyMessage = "No entries found",
}: MediaListTableProps) {
  const { user, getTitle } = useData();
  const scoreFormat = user?.scoreFormat || "POINT_10";

  if (items.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-muted-foreground text-left">
            <th className="py-2 px-3 font-medium w-10">#</th>
            <th className="py-2 px-3 font-medium">Title</th>
            <th className="py-2 px-3 font-medium text-center">Score</th>
            <th className="py-2 px-3 font-medium text-center">Progress</th>
            <th className="py-2 px-3 font-medium hidden md:table-cell">Format</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => {
            const title = getTitle(item);
            const total =
              item.mediaType === "ANIME" ? item.episodes : item.chapters;
            return (
              <tr
                key={`${item._seriesId}-${idx}`}
                className="border-b border-border/50 hover:bg-secondary/50 transition-colors"
              >
                <td className="py-2 px-3 text-muted-foreground">{idx + 1}</td>
                <td className="py-2 px-3">
                  <div className="flex items-center gap-3">
                    {item.coverImage && (
                      <img
                        src={item.coverImage}
                        alt={title}
                        className="w-8 h-11 object-cover rounded-sm shrink-0"
                        loading="lazy"
                      />
                    )}
                    <span className="text-foreground font-medium line-clamp-1">
                      {title}
                    </span>
                  </div>
                </td>
                <td className="py-2 px-3 text-center">
                  <ScoreDisplay
                    score={item.score}
                    format={scoreFormat}
                    size="sm"
                  />
                </td>
                <td className="py-2 px-3 text-center text-muted-foreground">
                  {item.progress}
                  {total ? `/${total}` : ""}
                </td>
                <td className="py-2 px-3 hidden md:table-cell text-muted-foreground uppercase text-xs">
                  {item.format || "–"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
