
import { Skeleton } from './Skeleton';

export const MangaDetailSkeleton = () => {
    return (
        <div className="w-full bg-background min-h-screen pb-20 overflow-x-hidden">
            <div className="relative h-[35vh] w-full overflow-hidden bg-muted/20" />
            <div className="max-w-[1400px] mx-auto px-8 md:px-[64px] relative z-20 -mt-32 grid grid-cols-1 lg:grid-cols-12 gap-16">
                <div className="lg:col-span-3 space-y-10">
                    <Skeleton className="aspect-[2/3] w-full rounded-[40px]" />
                    <div className="grid grid-cols-1 gap-4 pt-6">
                        <Skeleton className="h-24 rounded-[24px]" />
                        <Skeleton className="h-24 rounded-[24px]" />
                    </div>
                    <div className="space-y-6 pt-6">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="flex justify-between items-center">
                                <Skeleton className="h-3 w-20" />
                                <Skeleton className="h-3 w-24" />
                            </div>
                        ))}
                    </div>
                </div>
                <div className="lg:col-span-9 space-y-12 py-8 pt-16">
                    <div className="space-y-4">
                        <Skeleton className="h-16 md:h-20 w-3/4" />
                        <Skeleton className="h-6 w-1/2" />
                    </div>
                    <div className="flex gap-4">
                        <Skeleton className="h-14 w-40 rounded-full" />
                        <Skeleton className="h-14 w-14 rounded-full" />
                    </div>
                    <section className="space-y-6 pt-8">
                        <Skeleton className="h-4 w-32" />
                        <div className="space-y-3">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-2/3" />
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export const CharacterDetailSkeleton = () => {
    return (
        <div className="w-full bg-background min-h-screen pb-20 overflow-x-hidden">
            <div className="relative h-[30vh] w-full overflow-hidden bg-muted/10" />
            <div className="max-w-[1400px] mx-auto px-8 md:px-[64px] relative z-20 -mt-24 grid grid-cols-1 lg:grid-cols-12 gap-16">
                <div className="lg:col-span-3 space-y-10">
                    <Skeleton className="aspect-[2/3] w-full rounded-[40px]" />
                    <div className="space-y-6 pt-6 px-2">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="flex justify-between items-center">
                                <Skeleton className="h-3 w-16" />
                                <Skeleton className="h-3 w-20" />
                            </div>
                        ))}
                    </div>
                </div>
                <div className="lg:col-span-9 space-y-12 py-8 pt-12">
                    <div className="space-y-4">
                        <Skeleton className="h-16 md:h-20 w-2/3" />
                        <Skeleton className="h-6 w-1/3" />
                    </div>
                    <section className="space-y-6 pt-8">
                        <Skeleton className="h-4 w-32" />
                        <div className="space-y-3">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-2/3" />
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export const GridSkeleton = ({ count = 12 }: { count?: number }) => {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {[...Array(count)].map((_, i) => (
                <div key={i} className="space-y-4">
                    <Skeleton className="aspect-[2/3.2] w-full rounded-3xl" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                </div>
            ))}
        </div>
    );
};

export const LibrarySkeleton = () => {
    return (
        <div className="w-full min-h-screen bg-background pb-20 px-6 md:px-[64px] pt-[120px]">
            <div className="max-w-[1400px] mx-auto space-y-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div className="space-y-4">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-12 w-64" />
                    </div>
                    <div className="flex gap-4">
                        <Skeleton className="h-10 w-32 rounded-xl" />
                        <Skeleton className="h-10 w-32 rounded-xl" />
                    </div>
                </div>
                <GridSkeleton />
            </div>
        </div>
    );
};

export const ProfileSkeleton = () => {
    return (
        <div className="min-h-screen bg-background">
            <div className="h-[300px] md:h-[450px] w-full bg-muted/20" />
            <div className="mx-auto max-w-[1200px] px-6">
                <div className="relative flex flex-col md:flex-row items-center md:items-end gap-10">
                    <div className="relative -mt-24 md:-mt-32">
                        <Skeleton className="w-48 h-48 md:w-64 md:h-64 border-[6px] border-background shadow-2xl" />
                    </div>
                    <div className="flex-1 py-8 space-y-4">
                        <Skeleton className="h-12 md:h-16 w-64 mx-auto md:mx-0" />
                        <Skeleton className="h-4 w-32 mx-auto md:mx-0" />
                    </div>
                </div>
            </div>
            <div className="mx-auto max-w-[1200px] px-6 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    <aside className="lg:col-span-3 space-y-10">
                        <Skeleton className="h-32 w-full rounded-2xl" />
                        <Skeleton className="h-64 w-full rounded-2xl" />
                    </aside>
                    <main className="lg:col-span-9 space-y-12">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[...Array(4)].map((_, i) => (
                                <Skeleton key={i} className="h-24 rounded-2xl" />
                            ))}
                        </div>
                        <section className="space-y-4">
                            <Skeleton className="h-6 w-32" />
                            <Skeleton className="h-32 w-full rounded-2xl" />
                        </section>
                    </main>
                </div>
            </div>
        </div>
    );
};

export const GenericPageSkeleton = () => {
    return (
        <div className="w-full min-h-screen bg-background px-8 md:px-[64px] pt-[120px] pb-20">
            <div className="max-w-[1400px] mx-auto space-y-12">
                <div className="space-y-4">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-12 w-64" />
                </div>
                <div className="space-y-8">
                    <Skeleton className="h-64 w-full rounded-3xl" />
                    <Skeleton className="h-64 w-full rounded-3xl" />
                    <Skeleton className="h-64 w-full rounded-3xl" />
                </div>
            </div>
        </div>
    );
};
