import { cn } from "@/lib/utils";
import React from "react";

interface AutoBentoProps {
    children: React.ReactNode;
    minTileWidth?: number;
    maxWidth?: number;
    className?: string;
}

export function AutoBento({
    children,
    minTileWidth = 280,
    maxWidth = 1500,
    className,
}: AutoBentoProps) {
    // Dynamic tile width bounds to prevent stretching
    const isUltrawide = typeof window !== 'undefined' && window.innerWidth > 1800;
    const tileMin = isUltrawide ? 320 : minTileWidth;
    const tileMax = isUltrawide ? 380 : 340;

    return (
        <div
            className={cn("page-container w-full", className)}
        >
            <div className="bento-grid">
                {children}
            </div>
        </div>
    );
}
