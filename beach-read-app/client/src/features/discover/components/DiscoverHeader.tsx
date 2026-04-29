import { Wind } from 'lucide-react';

export function DiscoverHeader() {
    return (
        <div className="w-full mx-auto px-6 md:px-12">
            {/* Masthead */}
            <header className="pt-12 pb-8 flex flex-col items-center text-center max-w-[1000px] mx-auto">
                <div className="flex items-center gap-3 text-primary mb-4">
                    <Wind className="w-5 h-5 opacity-60" />
                    <p className="text-[10px] font-bold uppercase tracking-[0.4em] italic">
                        Collective Echoes
                    </p>
                </div>
                <h1 className="text-4xl md:text-5xl font-serif italic text-foreground tracking-tight leading-none mb-6">
                    Discoveries
                </h1>
                <p className="text-base md:text-lg text-status-dropped font-serif italic max-w-2xl mx-auto leading-relaxed">
                    Wander through the curated memories of stories told across time. <br className="hidden md:block" /> Find a reflection that speaks to you and add it to your personal sanctuary.
                </p>
                <div className="w-16 h-[1px] bg-border mt-8" />
            </header>
        </div>
    );
}
