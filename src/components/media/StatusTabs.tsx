import { cn } from "@/lib/utils";
import type { MediaStatus, MediaType } from "@/types/display";
import { STATUS_ORDER, STATUS_LABELS } from "@/lib/constants";

interface StatusTabsProps {
  activeStatus: MediaStatus;
  onStatusChange: (status: MediaStatus) => void;
  mediaType: MediaType;
  counts: Record<MediaStatus, number>;
}

export function StatusTabs({
  activeStatus,
  onStatusChange,
  mediaType,
  counts,
}: StatusTabsProps) {
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1">
      {STATUS_ORDER.map((status) => {
        const count = counts[status] || 0;
        const label = STATUS_LABELS[status][mediaType];
        const isActive = activeStatus === status;

        return (
          <button
            key={status}
            onClick={() => onStatusChange(status)}
            className={cn(
              "px-3 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap flex items-center gap-1.5",
              isActive
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
            )}
            style={
              isActive
                ? {
                    backgroundColor: `hsl(${getStatusHsl(status)} / 0.15)`,
                    color: `hsl(${getStatusHsl(status)})`,
                  }
                : undefined
            }
          >
            {label}
            <span
              className={cn(
                "text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center",
                isActive ? "bg-background/20" : "bg-secondary"
              )}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function getStatusHsl(status: MediaStatus): string {
  const map: Record<MediaStatus, string> = {
    CURRENT: "var(--status-current)",
    COMPLETED: "var(--status-completed)",
    PLANNING: "var(--status-planning)",
    DROPPED: "var(--status-dropped)",
    PAUSED: "var(--status-paused)",
    REPEATING: "var(--status-repeating)",
  };
  return map[status];
}
