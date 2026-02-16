import { cn } from "@/lib/utils";
import { Grid2X2, LayoutGrid, List } from "lucide-react";
import { motion } from "framer-motion";

export type ViewMode = "grid" | "compact" | "list";

interface ViewSwitcherProps {
  currentMode: ViewMode;
  onModeChange: (mode: ViewMode) => void;
  className?: string;
}

export function ViewSwitcher({ currentMode, onModeChange, className }: ViewSwitcherProps) {
  const modes: { id: ViewMode; icon: typeof LayoutGrid; label: string }[] = [
    { id: "grid", icon: LayoutGrid, label: "Grid View" },
    { id: "compact", icon: Grid2X2, label: "Compact Grid" },
    { id: "list", icon: List, label: "List View" },
  ];

  return (
    <div className={cn("flex items-center gap-1 bg-white/5 border border-white/5 p-1 rounded-xl shadow-depth1", className)}>
      {modes.map((mode) => {
        const isActive = currentMode === mode.id;
        const Icon = mode.icon;

        return (
          <button
            key={mode.id}
            onClick={() => onModeChange(mode.id)}
            className={cn(
              "relative flex items-center justify-center w-9 h-9 rounded-lg transition-all duration-200",
              isActive ? "text-primary" : "text-white/40 hover:text-white/70 hover:bg-white/5"
            )}
            title={mode.label}
          >
            {isActive && (
              <motion.div
                layoutId="active-view-bg"
                className="absolute inset-0 bg-primary/10 border border-primary/20 rounded-lg"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <Icon className="w-4 h-4 relative z-10" />
          </button>
        );
      })}
    </div>
  );
}
