import { Link } from 'react-router-dom';
import { handleCoverImageError, sanitizeCoverUrl } from '../../lib/image';

const SPOTLIGHT_ITEMS = [
    {
        id: "30046",
        title: "Vagabond",
        author: "Takehiko Inoue",
        coverUrl: "/cover-fallback.svg",
        synopsis: "In 16th century Japan, Shinmen Takezou is shunned by the local villagers as a demon child due to his wild and violent nature. Running away from home with a fellow boy at age 17, Takezou joins the Toyotomi army to fight the Tokugawa clan at the Battle of Sekigahara. However, the Tokugawa win a crushing victory, leading to nearly three hundred years of Shogunate rule.",
        tags: ["Seinen", "Historical", "Action"]
    },
    {
        id: "30002",
        title: "Berserk",
        author: "Kentaro Miura",
        coverUrl: "/cover-fallback.svg",
        synopsis: "Guts, a former mercenary now known as the \"Black Swordsman,\" is out for revenge. After a tumultuous childhood, he finally finds someone he respects and believes he can trust, only to have everything fall apart when this person takes away everything important to Guts for the purpose of fulfilling his own desires.",
        tags: ["Seinen", "Dark Fantasy", "Action"]
    }
];

export function DiscoverHeader() {
    return (
        <div className="w-full mx-auto px-6 md:px-12">
            {/* Masthead */}
            <header className="pt-24 pb-12 flex flex-col items-center text-center max-w-[1000px] mx-auto">
                <p className="text-[11px] font-medium tracking-[0.3em] text-muted-foreground mb-6 font-mono uppercase bg-muted/20 px-3 py-1 rounded-sm border border-border/40">
                    Index — 001
                </p>
                <h1 className="text-6xl md:text-7xl lg:text-[80px] font-serif font-black text-foreground text-center leading-[1] tracking-tighter mb-8 
                               bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
                    Discover
                </h1>
                <p className="text-base md:text-lg text-muted-foreground font-medium max-w-xl mx-auto leading-relaxed mb-12">
                    Explore our curated database of manga. Find your next favorite story and add it to your library.
                </p>
                <div className="w-full h-px bg-foreground/10 max-w-[800px] mx-auto"></div>
            </header>

            {/* Curator's Spotlight */}
            <div className="py-10 max-w-[1000px] mx-auto">
                <div className="flex items-center gap-4 mb-12 border-b border-border/40 pb-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-foreground opacity-30"></span>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground font-mono">
                        Curator's Spotlight
                    </p>
                    <span className="flex-1 h-px bg-border/20"></span>
                </div>

                <div className="flex flex-col gap-24">
                    {SPOTLIGHT_ITEMS.map((item, idx) => (
                        <div key={item.id} className={`flex flex-col md:flex-row gap-10 md:gap-16 items-center ${idx % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}>
                            <div className="w-full md:w-5/12 shrink-0 group perspective-[1000px]">
                                <Link to={`/manga/${item.id}`} className="block relative aspect-[2/3] transform transition-transform duration-700 ease-out hover:-translate-y-2">
                                    <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-sm pointer-events-none z-10" />
                                    <img
                                        src={sanitizeCoverUrl(item.coverUrl)}
                                        alt={item.title}
                                        onError={handleCoverImageError}
                                        className="w-full h-full object-cover rounded-sm border border-border/60 shadow-lg brightness-[0.95] contrast-[1.05] group-hover:brightness-100 transition-all duration-700"
                                    />
                                    <div className="absolute -bottom-4 animate-in fade-in slide-in-from-bottom-2 -z-10 bg-gradient-to-t from-black/10 to-transparent w-full h-12 mix-blend-multiply blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                                </Link>
                            </div>
                            <div className="w-full md:w-7/12 flex flex-col justify-center">
                                <Link to={`/manga/${item.id}`}>
                                    <h2 className="text-4xl md:text-5xl font-serif font-black text-foreground tracking-tight mb-2 hover:opacity-80 transition-opacity">
                                        {item.title}
                                    </h2>
                                </Link>
                                <p className="text-[11px] font-mono tracking-[0.2em] text-muted-foreground mb-8 uppercase bg-muted/10 inline-flex self-start px-2 py-0.5 border border-border/20 rounded-sm">
                                    Author: {item.author}
                                </p>
                                <p className="text-sm leading-[1.8] text-foreground/80 mb-8 max-w-lg font-medium selection:bg-foreground/10 selection:text-foreground">
                                    {item.synopsis}
                                </p>
                                <div className="flex flex-wrap items-center gap-2 mb-10">
                                    {item.tags.map(tag => (
                                        <span key={tag} className="text-[10px] border border-border/50 px-2.5 py-1 text-muted-foreground tracking-[0.1em] uppercase font-bold bg-transparent">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                                <div>
                                    <Link to={`/manga/${item.id}`} className="group inline-flex items-center gap-3 text-xs font-black tracking-[0.15em] text-foreground uppercase border-b border-foreground/30 hover:border-foreground pb-1 transition-all duration-300">
                                        View Exhibition
                                        <span className="transform group-hover:translate-x-1.5 transition-transform duration-300">→</span>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="w-full h-px bg-border/40 max-w-[1200px] mx-auto mt-20 mb-8"></div>
        </div>
    );
}
