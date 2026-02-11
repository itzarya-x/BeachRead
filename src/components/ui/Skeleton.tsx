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
                "animate-pulse rounded-lg bg-gradient-to-r from-surface-1 via-surface-2 to-surface-1 bg-[length:200%_100%]",
                className
            )}
            style={{
                animation: "shimmer 2s infinite linear",
            }}
        />
    );
}

// Card Skeleton
export function MediaCardSkeleton() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-card rounded-xl overflow-hidden ring-1 ring-border/10"
        >
            {/* Cover */}
            <Skeleton className="aspect-[2/3] w-full" />
            
            {/* Info */}
            <div className="p-3 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
            </div>
        </motion.div>
    );
}

// Row Card Skeleton
export function MediaRowCardSkeleton() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="shrink-0 w-[160px] md:w-[180px] space-y-2"
        >
            <Skeleton className="aspect-[2/3] w-full rounded-xl" />
            <Skeleton className="h-4 w-full" />
        </motion.div>
    );
}

// List Item Skeleton
export function ListItemSkeleton() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-4 p-4 bg-card rounded-lg"
        >
            <Skeleton className="w-16 h-24 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-3 w-1/3" />
            </div>
        </motion.div>
    );
}

// Stats Card Skeleton
export function StatsCardSkeleton() {
    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-card rounded-xl p-6 space-y-3"
        >
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32" />
        </motion.div>
    );
}

// Detail Page Skeleton
export function DetailPageSkeleton() {
    return (
        <div className="space-y-6">
            {/* Banner */}
            <Skeleton className="w-full h-[400px] rounded-none" />
            
            <div className="max-w-7xl mx-auto px-4 space-y-8">
                {/* Title */}
                <div className="space-y-3">
                    <Skeleton className="h-10 w-2/3" />
                    <Skeleton className="h-5 w-1/2" />
                </div>
                
                {/* Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-6">
                        <Skeleton className="h-32 w-full rounded-xl" />
                        <Skeleton className="h-48 w-full rounded-xl" />
                    </div>
                    <div className="space-y-4">
                        <Skeleton className="h-24 w-full rounded-xl" />
                        <Skeleton className="h-24 w-full rounded-xl" />
                        <Skeleton className="h-24 w-full rounded-xl" />
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
            "grid gap-4",
            type === "card" 
                ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
                : "grid-cols-1"
        )}>
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonComponent key={i} />
            ))}
        </div>
    );
}

// Table Skeleton
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
    return (
        <div className="space-y-2">
            {Array.from({ length: rows }).map((_, i) => (
                <ListItemSkeleton key={i} />
            ))}
        </div>
    );
}
