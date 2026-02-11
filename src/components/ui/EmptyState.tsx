/**
 * PHASE 6 — EMPTY STATE EXPERIENCE
 * Professional empty states with illustrations, help text, and clear CTAs
 */

import ds from "@/styles/design-system";
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
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-24 px-4 text-center relative overflow-hidden"
        >
            {/* Ambient Background (Task 2) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/2 rounded-full blur-[100px] pointer-events-none" />

            {/* Icon Spotlight */}
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8, ease: ds.motion.easing.default as any }}
                className="w-24 h-24 rounded-3xl bg-surface-elevated1 flex items-center justify-center mb-8 border border-white/5 shadow-depth1 relative group"
            >
                <div className="absolute inset-0 bg-primary/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
                <Icon className="w-10 h-10 text-primary/40 group-hover:text-primary transition-colors" />
                <div className="absolute -inset-1 bg-primary/10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity rounded-full -z-10" />
            </motion.div>

            {/* Content */}
            <div className="max-w-md space-y-4 mb-10 relative z-10">
                <h3 className="text-3xl font-black text-foreground tracking-tighter uppercase">{title}</h3>
                <p className="text-muted-foreground/60 leading-relaxed font-medium">{description}</p>
            </div>

            {/* Actions */}
            {(action || secondaryAction) && (
                <div className="flex flex-wrap items-center justify-center gap-4 relative z-10">
                    {action && (
                        <Button
                            onClick={action.onClick}
                            variant="primary"
                            className="px-8"
                        >
                            {action.label}
                        </Button>
                    )}
                    {secondaryAction && (
                        <Button
                            onClick={secondaryAction.onClick}
                            variant="secondary"
                            className="px-8"
                        >
                            {secondaryAction.label}
                        </Button>
                    )}
                </div>
            )}
        </motion.div>
    );
}

// Preset Empty States

export function EmptyAnimeList({ onImport }: { onImport?: () => void }) {
    return (
        <EmptyState
            icon={Wind}
            title="Silence in the Vault"
            description="The synthetic archive is currently devoid of signals. Initialize your synchronization to populate the command center."
            action={onImport ? {
                label: "Connect AniList",
                onClick: onImport
            } : undefined}
        />
    );
}

export function EmptyMangaList({ onImport }: { onImport?: () => void }) {
    return (
        <EmptyState
            icon={BookOpen}
            title="Untouched Library"
            description="The graphical archive remains uninitialized. Establish a data link to begin indexing your collection."
            action={onImport ? {
                label: "Establish Link",
                onClick: onImport
            } : undefined}
        />
    );
}

export function EmptySearchResults() {
    return (
        <EmptyState
            icon={Search}
            title="No Results Found"
            description="We couldn't find any matches for your search. Try adjusting your filters or search terms."
        />
    );
}

export function EmptyTierList({ onCreate }: { onCreate?: () => void }) {
    return (
        <EmptyState
            icon={Trophy}
            title="No Tier Lists Yet"
            description="Create your first tier list to start ranking your favorite anime and manga. Organize your collection by quality, enjoyment, or any criteria you choose."
            action={onCreate ? {
                label: "Create Tier List",
                onClick: onCreate
            } : undefined}
        />
    );
}

export function EmptyStats() {
    return (
        <EmptyState
            icon={BarChart3}
            title="Not Enough Data"
            description="Add more entries to your collection to see detailed statistics and insights about your watching and reading habits."
        />
    );
}

export function EmptyCustomList({ onCreate }: { onCreate?: () => void }) {
    return (
        <EmptyState
            icon={ListPlus}
            title="No Custom Lists"
            description="Create custom lists to organize your collection. Group anime and manga by themes, moods, recommendations, or any way you like."
            action={onCreate ? {
                label: "Create List",
                onClick: onCreate
            } : undefined}
        />
    );
}

// Inline Empty State (for smaller contexts)
interface InlineEmptyStateProps {
    message: string;
    icon?: LucideIcon;
}

export function InlineEmptyState({ message, icon: Icon = Inbox }: InlineEmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
            <Icon className="w-8 h-8 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">{message}</p>
        </div>
    );
}
