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
        <span className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</span>
      )}
      {options.map((opt) => {
        const isActive = selected.includes(opt.value);
        return (
          <button
            key={opt.value}
            onClick={() => onToggle(opt.value)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-all",
              isActive
                ? "border-primary/45 bg-primary/12 text-primary"
                : "border-border bg-card text-muted-foreground hover:border-primary/25 hover:bg-muted hover:text-foreground"
            )}
          >
            {opt.label}
            {opt.count !== undefined && (
              <span className="ml-1 opacity-70">{opt.count}</span>
            )}
          </button>
        );
      })}
      {hasSelection && onClear && (
        <button
          onClick={onClear}
          className="flex shrink-0 items-center gap-1 rounded-full border border-destructive/35 bg-destructive/10 px-3 py-1.5 text-[11px] font-semibold text-destructive transition-colors hover:bg-destructive/20"
        >
          <X className="w-3 h-3" />
          Clear
        </button>
      )}
    </div>
  );
}
