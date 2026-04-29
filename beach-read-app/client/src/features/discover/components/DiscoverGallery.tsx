import { Loader2, Wind, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import type { MangaResult } from './types';
import { MediaCard } from '../../../shared/ui/MediaCard';
import { STAGGER_CONTAINER } from '../../../shared/utils/motion-variants';
import { EmptyState } from '../../../shared/ui/EmptyState';
import { Button } from '../../../shared/ui/Button';

interface DiscoverGalleryProps {
    mangaList: MangaResult[];
    loading: boolean;
    onClearFilters?: () => void;
}

export function DiscoverGallery({ mangaList, loading, onClearFilters }: DiscoverGalleryProps) {
    if (loading && mangaList.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-32 opacity-50">
                <Loader2 className="h-6 w-6 animate-spin text-foreground mb-4" />
                <p className="text-[10px] font-mono uppercase tracking-[0.2em] text-foreground/70">Curating Gallery</p>
            </div>
        );
    }

    if (mangaList.length === 0) {
        return (
            <EmptyState
                title="The shelf is currently silent"
                description="No memories found that match your reflections. Try widening your search or clearing filters."
                icon={<Wind size={32} className="text-primary/40" />}
                action={
                    onClearFilters && (
                        <Button 
                            variant="primary" 
                            onClick={onClearFilters}
                            className="px-12"
                        >
                            <RefreshCw size={14} className="mr-2" />
                            Reset Reflections
                        </Button>
                    )
                }
            />
        );
    }

    return (
        <motion.div 
            variants={STAGGER_CONTAINER}
            initial="hidden"
            animate="visible"
            className={`transition-opacity duration-700 ease-in-out ${loading ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}
        >
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-8">
                {mangaList.map((manga, index) => (
	                    <MediaCard
	                        key={manga.id}
	                        id={manga.id}
	                        title={manga.title}
	                        coverUrl={manga.coverUrl}
	                        status={manga.status}
	                        mediaType={manga.mediaType === 'ANIME' ? 'ANIME' : 'MANGA'}
	                        index={index}
	                    />
                ))}
            </div>
        </motion.div>
    );
}
