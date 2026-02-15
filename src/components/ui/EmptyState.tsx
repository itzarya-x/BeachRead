/**
 * PHASE 6 — EMPTY STATE EXPERIENCE
 * Professional empty states with illustrations, help text, and clear CTAs
 */

import { motion } from "framer-motion";
import {
    BarChart3,
    BookOpen,
    Inbox,
    ListPlus,
    LucideIcon,
    Search,
    Trophy,
    Wind
} from "lucide-react";
import { Button } from "./YuraButton";

interface EmptyStateProps {
    icon?: LucideIcon;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    secondaryAction?: {
        label: string;
        onClick: () => void;
    };
}

export function EmptyState({ 
    icon: Icon = Inbox, 
    title, 
    description, 
    action,
    secondaryAction 
}: EmptyStateProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, ease: [0.23, 1, 0.32, 1] }}
            className="relative flex flex-col items-center justify-center px-6 py-32 text-center"
        >
            <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/8 blur-[120px]" />

            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.45, delay: 0.1 }}
                className="group relative mb-10 flex h-24 w-24 items-center justify-center rounded-[1.5rem] border border-border bg-card shadow-sm"
            >
                <div className="absolute inset-0 rounded-[1.5rem] bg-primary/10 opacity-0 transition-opacity group-hover:opacity-100" />
                <Icon className="h-10 w-10 text-primary" strokeWidth={1.6} />
                <div className="absolute inset-0 scale-95 rounded-[1.5rem] border border-primary/25 opacity-0 transition-all duration-500 group-hover:scale-110 group-hover:opacity-100" />
            </motion.div>

            <div className="relative z-10 mb-10 max-w-xl space-y-4">
                <h3 className="text-3xl font-black leading-none tracking-tight text-foreground md:text-4xl">{title}</h3>
                <p className="px-6 text-base font-medium leading-relaxed tracking-tight text-muted-foreground md:text-lg">
                    {description}
                </p>
            </div>

            {(action || secondaryAction) && (
                <div className="relative z-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                    {action && (
                        <Button
                            onClick={action.onClick}
                            variant="primary"
                            size="md"
                            className="h-12 rounded-xl px-7 text-xs font-black uppercase tracking-[0.18em]"
                        >
                            {action.label}
                        </Button>
                    )}
                    {secondaryAction && (
                        <Button
                            onClick={secondaryAction.onClick}
                            variant="secondary"
                            size="md"
                            className="h-12 rounded-xl px-7 text-xs font-semibold uppercase tracking-[0.18em]"
                        >
                            {secondaryAction.label}
                        </Button>
                    )}
                </div>
            )}
        </motion.div>
    );
}

// Cinematic Presets (Task 13/24)

export function EmptyAnimeList({ onImport }: { onImport?: () => void }) {
    return (
        <EmptyState
            icon={Wind}
            title="Your anime shelf is ready"
            description="Import from AniList or add your first entry to start building a collection worth browsing."
            action={onImport ? {
                label: "Import from AniList",
                onClick: onImport
            } : undefined}
        />
    );
}

export function EmptyMangaList({ onImport }: { onImport?: () => void }) {
    return (
        <EmptyState
            icon={BookOpen}
            title="No manga in your library yet"
            description="Pull your existing list from AniList or add a title and begin curating your reading vault."
            action={onImport ? {
                label: "Import from AniList",
                onClick: onImport
            } : undefined}
        />
    );
}

export function EmptySearchResults() {
    return (
        <EmptyState
            icon={Search}
            title="No matches found"
            description="Try a broader title search or clear a few filters to surface more results."
        />
    );
}

export function EmptyTierList({ onCreate }: { onCreate?: () => void }) {
    return (
        <EmptyState
            icon={Trophy}
            title="No tier lists yet"
            description="Create your first tier board and start ranking favorites from S to F."
            action={onCreate ? {
                label: "Create tier list",
                onClick: onCreate
            } : undefined}
        />
    );
}

export function EmptyCustomList({ onCreate }: { onCreate?: () => void }) {
    return (
        <EmptyState
            icon={ListPlus}
            title="No custom collections yet"
            description="Create a custom list for seasonal picks, comfort rewatches, or any curation style you want."
            action={onCreate ? {
                label: "Create list",
                onClick: onCreate
            } : undefined}
        />
    );
}

export function EmptyStats() {
    return (
        <EmptyState
            icon={BarChart3}
            title="Stats will appear as you track"
            description="Log more progress and scores to unlock richer trends and viewing insights."
        />
    );
}

interface InlineEmptyStateProps {
    message: string;
    icon?: LucideIcon;
}

export function InlineEmptyState({ message, icon: Icon = Inbox }: InlineEmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center space-y-3 py-16 text-center">
            <div className="mb-1 flex h-14 w-14 items-center justify-center rounded-xl border border-border bg-card">
                <Icon className="h-7 w-7 text-muted-foreground/60" strokeWidth={1.5} />
            </div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{message}</p>
        </div>
    );
}
