import { cn } from "@/lib/utils";
import React from "react";

export function GlassCard({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={cn("sakura-glass rounded-[var(--radius-lg)] border transition-all duration-200", className)} {...props} />;
}
