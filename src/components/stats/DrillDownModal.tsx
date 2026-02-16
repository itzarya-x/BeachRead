import React from "react";
import { X } from "lucide-react";
import type { DisplayMedia } from "@/types/display";
import { useData } from "@/context/DataContext";
import { useNavigate } from "react-router-dom";

/**
 * PHASE 4.2-4.3: DRILL DOWN INTERACTION
 * 
 * When user clicks ANY metric, show items contributing to that metric.
 * Supports multi-level drill: chart → list → item page
 */

interface DrillDownModalProps {
    items: DisplayMedia[];
    title: string;
    subtitle?: string;
    onClose: () => void;
}

export function DrillDownModal({ items, title, subtitle, onClose }: DrillDownModalProps) {
    const { getTitle } = useData();
    const navigate = useNavigate();

    const handleItemClick = (item: DisplayMedia) => {
        // PHASE 4.3: Navigate to item detail page
        const type = item.mediaType?.toLowerCase() || "anime";
        navigate(`/${type}/${item._seriesId}`);
    };

    return (
        <div 
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in"
            onClick={onClose}
        >
            <div 
                className="bg-card rounded-lg border border-border max-h-[80vh] w-full max-w-4xl overflow-hidden flex flex-col animate-in zoom-in-95 shadow-xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-border/50">
                    <div>
                        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
                        {subtitle && (
                            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
                        )}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-secondary rounded transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Items List */}
                <div className="overflow-y-auto flex-1">
                    {items.length > 0 ? (
                        <div className="divide-y divide-border/30">
                            {items.map((item) => (
                                <div
                                    key={item._seriesId}
                                    className="p-4 hover:bg-secondary/50 transition-colors cursor-pointer"
                                    onClick={() => handleItemClick(item)}
                                >
                                    <div className="flex gap-4">
                                        {/* Cover Image */}
                                        {item.coverImage ? (
                                            <img
                                                src={item.coverImage}
                                                alt={getTitle(item)}
                                                className="w-16 h-24 object-cover rounded flex-shrink-0"
                                            />
                                        ) : (
                                            <div className="w-16 h-24 bg-secondary rounded flex-shrink-0 flex items-center justify-center">
                                                <span className="text-xs text-muted-foreground">No cover</span>
                                            </div>
                                        )}

                                        {/* Item Info */}
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-semibold text-foreground truncate">
                                                {getTitle(item)}
                                            </h4>
                                            
                                            <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                                                <span className="capitalize">
                                                    Status: <span className="font-medium text-foreground">{item.status.toLowerCase()}</span>
                                                </span>
                                                {item.score > 0 && (
                                                    <span>
                                                        Score: <span className="font-medium text-foreground">{item.score}</span>
                                                    </span>
                                                )}
                                                {item.progress > 0 && (
                                                    <span>
                                                        Progress: <span className="font-medium text-foreground">{item.progress}</span>
                                                    </span>
                                                )}
                                                {item.format && (
                                                    <span>
                                                        Format: <span className="font-medium text-foreground">{item.format}</span>
                                                    </span>
                                                )}
                                            </div>

                                            {/* Genres */}
                                            {item.genres && item.genres.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-2">
                                                    {item.genres.slice(0, 5).map((genre) => (
                                                        <span
                                                            key={genre}
                                                            className="px-2 py-0.5 bg-secondary rounded text-xs text-muted-foreground"
                                                        >
                                                            {genre}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Click indicator */}
                                        <div className="flex items-center text-muted-foreground">
                                            <span className="text-xs">Click to view →</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-6 text-center text-muted-foreground">
                            No items to display
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-border/50 p-4 bg-secondary/30">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                            Total: {items.length} item{items.length !== 1 ? "s" : ""}
                        </span>
                        <span className="text-muted-foreground/60">
                            Click any item to view details
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
