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
            transition={{ duration: 1, ease: [0.23, 1, 0.32, 1] }}
            className="flex flex-col items-center justify-center py-40 px-6 text-center relative"
        >
            {/* Ambient Background Glow (Task 1/2) */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none -z-10" />

            {/* Icon Spotlight */}
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 1, delay: 0.2 }}
                className="w-32 h-32 rounded-[2.5rem] bg-[#101827] flex items-center justify-center mb-12 border border-white/5 shadow-2xl relative group"
            >
                <div className="absolute inset-0 bg-primary/10 rounded-[2.5rem] opacity-0 group-hover:opacity-100 transition-opacity" />
                <Icon className="w-12 h-12 text-primary" strokeWidth={1.5} />
                {/* Microinteraction glow */}
                <div className="absolute inset-0 border border-primary/20 rounded-[2.5rem] scale-0 group-hover:scale-110 transition-transform duration-500 opacity-0 group-hover:opacity-100" />
            </motion.div>

            {/* Content (Task 9 Scale) */}
            <div className="max-w-xl space-y-6 mb-12 relative z-10">
                <h3 className="text-4xl md:text-5xl font-black text-white tracking-tighter leading-none">{title}</h3>
                <p className="text-xl text-white/40 leading-relaxed font-medium tracking-tight px-10">
                    {description}
                </p>
            </div>

            {/* Actions (Premium Buttons) */}
            {(action || secondaryAction) && (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-6 relative z-10">
                    {action && (
                        <Button
                            onClick={action.onClick}
                            variant="primary"
                            size="lg"
                            className="px-12 rounded-2xl font-black uppercase tracking-[0.2em] text-xs h-16 shadow-glow"
                        >
                            {action.label}
                        </Button>
                    )}
                    {secondaryAction && (
                        <Button
                            onClick={secondaryAction.onClick}
                            variant="secondary"
                            size="lg"
                            className="px-12 rounded-2xl font-black uppercase tracking-[0.2em] text-xs h-16 border-white/5 bg-white/5 hover:bg-white/10"
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
            title="THE ARCHIVE IS SILENT"
            description="Your personal cinema has no reels to play. Connect your AniList protocol to begin the synchronization."
            action={onImport ? {
                label: "Connect Protocol",
                onClick: onImport
            } : undefined}
        />
    );
}

export function EmptyMangaList({ onImport }: { onImport?: () => void }) {
    return (
        <EmptyState
            icon={BookOpen}
            title="LIBRARY IS VACANT"
            description="The graphical archives remain unindexed. Link your data streams to populate your curated collection."
            action={onImport ? {
                label: "Initialize Link",
                onClick: onImport
            } : undefined}
        />
    );
}

export function EmptySearchResults() {
    return (
        <EmptyState
            icon={Search}
            title="SIGNAL LOST"
            description="No matching fragments found within the current parameters. Adjust your search vectors to continue."
        />
    );
}

export function EmptyTierList({ onCreate }: { onCreate?: () => void }) {
    return (
        <EmptyState
            icon={Trophy}
            title="NO RANKINGS INDEXED"
            description="Your hierarchies are empty. Create your first strategic tier list to rank your archival fragments."
            action={onCreate ? {
                label: "Create Ranking",
                onClick: onCreate
            } : undefined}
        />
    );
}

export function EmptyCustomList({ onCreate }: { onCreate?: () => void }) {
    return (
        <EmptyState
            icon={ListPlus}
            title="NO COLLECTIONS FOUND"
            description="You haven't initialized any bespoke data structures. Create a custom list to organize your archival fragments."
            action={onCreate ? {
                label: "Initialize List",
                onClick: onCreate
            } : undefined}
        />
    );
}

export function EmptyStats() {
    return (
        <EmptyState
            icon={BarChart3}
            title="INSUFFICIENT INTELLIGENCE"
            description="Add more archival entries to generate a comprehensive diagnostic report of your media universe."
        />
    );
}

interface InlineEmptyStateProps {
    message: string;
    icon?: LucideIcon;
}

export function InlineEmptyState({ message, icon: Icon = Inbox }: InlineEmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-2">
                <Icon className="w-8 h-8 text-white/20" strokeWidth={1.5} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">{message}</p>
        </div>
    );
}
