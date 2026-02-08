import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface FilterChipsProps {
  options: FilterOption[];
  selected: string[];
  onToggle: (value: string) => void;
  onClear?: () => void;
  label?: string;
}

export function FilterChips({ options, selected, onToggle, onClear, label }: FilterChipsProps) {
  const hasSelection = selected.length > 0;

  return (
    <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar pb-1">
      {label && (
        <span className="text-xs text-muted-foreground font-medium shrink-0">{label}:</span>
      )}
      {options.map((opt) => {
        const isActive = selected.includes(opt.value);
        return (
          <button
            key={opt.value}
            onClick={() => onToggle(opt.value)}
            className={cn("filter-chip", isActive && "active")}
          >
            {opt.label}
            {opt.count !== undefined && (
              <span className="ml-1 opacity-60">{opt.count}</span>
            )}
          </button>
        );
      })}
      {hasSelection && onClear && (
        <button
          onClick={onClear}
          className="filter-chip text-destructive border-destructive/30 hover:bg-destructive/10 flex items-center gap-1"
        >
          <X className="w-3 h-3" />
          Clear
        </button>
      )}
    </div>
  );
}
