import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
    User,
    Calendar,
    Heart,
    Share2,
    Activity,
    Layers,
    Wind,
    ExternalLink,
    Briefcase,
    Zap
} from 'lucide-react';
import { sanitizeCoverUrl } from '../shared/utils/image';
import { CharacterDetailSkeleton } from '../shared/ui/PageSkeletons';
import { Tabs } from '../shared/ui/Tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { Surface } from '../shared/ui/Surface';
import { Button } from '../shared/ui/Button';
import { Skeleton } from '../shared/ui/Skeleton';
import { useCharacterDetailQuery } from '../features/manga/hooks/useCharacterQuery';

export function CharacterDetail() {
    const { id } = useParams<{ id: string }>();
    const [isImageLoaded, setIsImageLoaded] = useState(false);
    const [activeTab, setActiveTab] = useState('overview');
    
    const { data: character, isLoading, error } = useCharacterDetailQuery(id);
    
    if (isLoading) return <CharacterDetailSkeleton />;
    if (error || !character) return <div className="p-20 text-center text-destructive font-serif italic">{(error as any)?.message || 'Character not found'}</div>;

    const bannerImage = character.media?.[0]?.bannerUrl || character.media?.[0]?.coverUrl;

    return (
        <div className="relative w-full bg-background min-h-screen pb-20 overflow-x-hidden selection:bg-muted-foreground selection:text-white">
            {/* Dynamic Themed Background */}
            <div 
                className="fixed inset-0 z-0 opacity-5 pointer-events-none transition-all duration-[2000ms] scale-110 blur-[100px]"
                style={{ 
                    backgroundImage: `url(${character.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                }}
            />
            <div className="fixed inset-0 z-0 bg-background/50 pointer-events-none" />

            {/* HERO BANNER */}
            <div className="relative h-[30vh] w-full overflow-hidden">
                <div
                    className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-[2000ms] hover:scale-105"
                    style={{ backgroundImage: bannerImage ? `url(${sanitizeCoverUrl(bannerImage)})` : 'none' }}
                >
                    {!bannerImage && <div className="w-full h-full bg-muted/20" />}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
            </div>

            {/* MAIN CONTENT */}
            <div className="max-w-[1400px] mx-auto px-8 md:px-[64px] relative z-20 -mt-24">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                    
                    {/* INFO SIDEBAR */}
                    <div className="lg:col-span-3 space-y-10 order-1 lg:order-1">
                        <motion.div 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1], delay: 0.1 }}
                            className="relative aspect-[2/3] w-full rounded-[40px] overflow-hidden shadow-2xl border border-white/10 group bg-muted/20"
                        >
                            <AnimatePresence>
                                {!isImageLoaded && (
                                    <Skeleton className="absolute inset-0 z-0 h-full w-full rounded-none" />
                                )}
                            </AnimatePresence>
                            <motion.img 
                                src={character.image} 
                                onLoad={() => setIsImageLoaded(true)}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: isImageLoaded ? 1 : 0 }}
                                transition={{ duration: 0.5 }}
                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                                alt={character.name} 
                            />
                        </motion.div>

                        <div className="space-y-6 pt-6 border-t border-border/20 px-2">
                            {[
                                { label: 'Gender', value: character.gender, icon: User },
                                { label: 'Age', value: character.age, icon: Calendar },
                                { label: 'Blood Type', value: character.bloodType, icon: Activity },
                                { label: 'Native Name', value: character.nameNative, icon: Layers },
                            ].map((item, i) => (item.value && (
                                <div key={i} className="flex justify-between items-center group">
                                    <div className="flex items-center gap-3">
                                        <item.icon size={12} className="text-muted-foreground/40 group-hover:text-primary transition-colors" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 group-hover:text-primary transition-colors">{item.label}</span>
                                    </div>
                                    <span className="text-[11px] font-black uppercase tracking-tight text-foreground">{item.value}</span>
                                </div>
                            )))}
                        </div>

                        {character.siteUrl && (
                            <div className="pt-6 border-t border-foreground/5">
                                <a 
                                    href={character.siteUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between group cursor-pointer"
                                >
                                    <div className="flex items-center gap-3">
                                        <ExternalLink size={12} className="text-muted-foreground/40 group-hover:text-primary transition-colors" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 group-hover:text-primary transition-colors">AniList Portal</span>
                                    </div>
                                    <Zap size={12} className="text-primary opacity-0 group-hover:opacity-100 transition-all" />
                                </a>
                            </div>
                        )}
                    </div>

                    {/* DESCRIPTION & MEDIA */}
                    <div className="lg:col-span-9 flex flex-col pt-8 lg:pt-0 order-2 lg:order-2">
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="space-y-8"
                        >
                            <div className="space-y-4">
                                <motion.h1 
                                    className="text-4xl md:text-6xl font-serif italic text-foreground tracking-tight leading-none text-left"
                                >
                                    {character.name}
                                </motion.h1>
                                <div className="flex flex-wrap gap-3 pt-2">
                                    {character.nameAlt && character.nameAlt.slice(0, 3).map((alt: string) => (
                                        <span key={alt} className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground/40">{alt}</span>
                                    ))}
                                </div>

                                <div className="flex flex-wrap items-center gap-4 pt-6">
                                    <Button variant="outline" size="icon" className="h-14 w-14 rounded-full border-2">
                                        <Heart size={22} strokeWidth={2.5} />
                                    </Button>

                                    <Button variant="outline" size="icon" aria-label="Share" className="h-14 w-14 rounded-full border-2">
                                        <Share2 size={18} strokeWidth={2.5} />
                                    </Button>
                                </div>
                            </div>

                            <Tabs
                                tabs={[
                                    { id: 'overview', label: 'Biography' },
                                    { id: 'appearances', label: 'Appearances' },
                                ]}
                                activeTab={activeTab}
                                onTabChange={setActiveTab}
                                className="mb-10"
                            />

                            <div className="min-h-[400px]">
                                <AnimatePresence mode="wait">
                                    {activeTab === 'overview' && (
                                        <motion.div 
                                            key="overview"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="space-y-16"
                                        >
                                            <section className="animate-in fade-in duration-700">
                                                <div className="flex items-center gap-4 mb-6">
                                                    <h3 className="text-[11px] font-bold uppercase tracking-[0.4em] text-primary flex items-center gap-2">
                                                        <Briefcase size={14} /> Description
                                                    </h3>
                                                    <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
                                                </div>
                                                <div 
                                                    className="text-foreground/70 leading-[1.8] text-base md:text-lg font-medium max-w-[850px] text-left italic font-serif prose prose-invert prose-p:mb-4"
                                                    dangerouslySetInnerHTML={{ __html: character.description }}
                                                />
                                            </section>
                                        </motion.div>
                                    )}

                                    {activeTab === 'appearances' && (
                                        <motion.section 
                                            key="appearances"
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="space-y-10"
                                        >
                                            <div className="flex items-center gap-4 mb-6">
                                                <h3 className="text-[11px] font-bold uppercase tracking-[0.4em] text-primary flex items-center gap-2">
                                                    <Wind size={14} /> Chronological Appearances
                                                </h3>
                                                <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent" />
                                            </div>

                                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                                                {character.media.map((item: any, idx: number) => (
                                                    <motion.div 
                                                        key={`${item.id}-${idx}`}
                                                        whileHover={{ y: -4 }}
                                                        initial={{ opacity: 0 }} 
                                                        animate={{ opacity: 1 }} 
                                                        transition={{ delay: idx * 0.05 }}
                                                        className="space-y-3 group"
                                                    >
                                                        <Link to={`/media/${item.id}`} className="block relative aspect-[2/3] overflow-hidden rounded-[24px] border border-border/40 shadow-sm group-hover:shadow-xl transition-all duration-500">
                                                            <img src={sanitizeCoverUrl(item.coverUrl)} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" alt="" />
                                                            <div className="absolute inset-x-0 bottom-0 p-3 bg-black/60 backdrop-blur-md border-t border-white/10">
                                                                <p className="text-[8px] font-black uppercase text-white tracking-widest">{item.role}</p>
                                                            </div>
                                                        </Link>
                                                        <p className="text-[10px] font-black text-foreground line-clamp-2 uppercase tracking-tight opacity-70 group-hover:opacity-100 group-hover:text-primary transition-all">{item.title}</p>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </motion.section>
                                    )}
                                </AnimatePresence>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CharacterDetail;
