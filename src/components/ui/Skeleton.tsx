/**
 * PHASE 3.6 — SKELETON LOADING STATES
 * Professional loading experience - never blank screens
 */

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-2xl bg-white/[0.03]",
                className
            )}
        >
            <motion.div
                animate={{
                    x: ["-100%", "100%"],
                }}
                transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: "linear",
                }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.05] to-transparent"
            />
        </div>
    );
}

// Media Row Card Skeleton (Task 23)
export function MediaRowCardSkeleton() {
    return (
        <div className="shrink-0 w-[240px] md:w-[320px] space-y-6">
            <Skeleton className="aspect-[2/3] w-full rounded-[1.5rem]" />
            <div className="space-y-3 px-2">
                <Skeleton className="h-5 w-full rounded-lg" />
                <Skeleton className="h-4 w-2/3 rounded-lg opacity-50" />
            </div>
        </div>
    );
}

// Grid Card Skeleton
export function MediaCardSkeleton() {
    return (
        <div className="bg-[#101827]/40 rounded-[1.5rem] overflow-hidden border border-white/5">
            <Skeleton className="aspect-[2/3] w-full" />
            <div className="p-5 space-y-3">
                <Skeleton className="h-4 w-3/4 rounded-md" />
                <Skeleton className="h-3 w-1/2 rounded-md opacity-50" />
            </div>
        </div>
    );
}

// Media Detail Page Skeleton (Task 23)
export function DetailPageSkeleton() {
    return (
        <div className="min-h-screen pb-32">
            <Skeleton className="w-full h-[650px] md:h-[850px] rounded-none opacity-20" />
            
            <div className="container mx-auto px-6 md:px-14 relative -mt-[400px] md:-mt-[550px] z-10">
                <div className="flex flex-col lg:flex-row gap-16 md:gap-24">
                    <div className="shrink-0 space-y-10">
                        <Skeleton className="w-[320px] md:w-[420px] aspect-[2/3] rounded-[1.5rem]" />
                        <Skeleton className="h-20 w-full rounded-2xl" />
                    </div>
                    
                    <div className="flex-1 pt-20 space-y-16">
                        <div className="space-y-8">
                            <div className="flex gap-4">
                                <Skeleton className="h-8 w-24 rounded-lg" />
                                <Skeleton className="h-8 w-32 rounded-lg" />
                            </div>
                            <Skeleton className="h-24 md:h-40 w-full md:w-3/4 rounded-3xl" />
                            <Skeleton className="h-20 w-1/2 rounded-2xl" />
                        </div>
                        
                        <div className="flex gap-3">
                            {[1, 2, 3, 4].map(i => (
                                <Skeleton key={i} className="h-10 w-24 rounded-xl" />
                            ))}
                        </div>
                        
                        <div className="space-y-6">
                            <Skeleton className="h-6 w-32 rounded-lg" />
                            <Skeleton className="h-40 w-full rounded-3xl" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Grid Skeleton
interface GridSkeletonProps {
    count?: number;
    type?: "card" | "row";
}

export function GridSkeleton({ count = 12, type = "card" }: GridSkeletonProps) {
    const SkeletonComponent = type === "card" ? MediaCardSkeleton : MediaRowCardSkeleton;
    
    return (
        <div className={cn(
            "grid gap-8",
            type === "card" 
                ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6"
                : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
        )}>
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonComponent key={i} />
            ))}
        </div>
    );
}

// Stats Card Skeleton
export function StatsCardSkeleton() {
    return (
        <div className="bg-[#101827]/40 backdrop-blur-xl rounded-[2rem] p-8 border border-white/5 space-y-6">
            <div className="flex justify-between">
                <Skeleton className="w-14 h-14 rounded-2xl" />
                <Skeleton className="w-20 h-4 rounded-full" />
            </div>
            <div className="space-y-3">
                <Skeleton className="h-10 w-24 rounded-xl" />
                <Skeleton className="h-4 w-32 rounded-lg opacity-50" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
        </div>
    );
}
