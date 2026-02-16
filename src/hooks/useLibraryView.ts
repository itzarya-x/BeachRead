import { useState, useEffect } from "react";
import { ViewMode } from "@/components/library/ViewSwitcher";

export function useLibraryView() {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    const saved = localStorage.getItem("library_view_mode");
    return (saved as ViewMode) || "grid";
  });

  const updateViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem("library_view_mode", mode);
  };

  return { viewMode, updateViewMode };
}
