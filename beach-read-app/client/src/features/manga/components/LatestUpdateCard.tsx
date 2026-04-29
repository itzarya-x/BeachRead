
import { handleCoverImageError, sanitizeCoverUrl } from '../../../shared/utils/image';

export function LatestUpdateCard({ update }: { update: any }) {
    return (
        <div className="group relative flex h-[288px] cursor-pointer overflow-hidden rounded-[18px] border border-border/50 bg-white shadow-sm transition-all duration-300 ease-in-out hover:-translate-y-[4px] hover:shadow-[0_12px_36px_rgba(0,0,0,0.12)]">
            <div className="absolute inset-0 z-0 bg-background">
                <img
                    src={sanitizeCoverUrl(update.coverUrl)}
                    alt={update.title}
                    onError={handleCoverImageError}
                    className="h-full w-full object-cover object-top opacity-90 transition-transform duration-[800ms] ease-out group-hover:scale-105 mix-blend-multiply dark:mix-blend-lighten"
                />
            </div>

            <div className="absolute bottom-[10px] right-[10px] top-[10px] z-20 flex w-[66%] flex-col items-start rounded-[14px] border border-border/40 bg-background/88 p-[18px] shadow-[0_8px_32px_rgba(0,0,0,0.08)] backdrop-blur-md transition-all duration-300 dark:bg-[#061422]/85">
                <div className="mb-[14px]">
                    <h3 className="mb-[4px] line-clamp-2 text-[16px] font-black leading-[1.18] text-foreground transition-colors group-hover:text-primary">{update.title}</h3>
                    <p className="text-[11px] font-bold italic tracking-wide text-muted-foreground transition-colors duration-300">{update.author}</p>
                </div>

                <div className="mt-1 mb-auto w-full space-y-[8px]">
                    {update.chapters.slice(0, 3).map((ch: any, i: number) => (
                        <div key={i} className="group/link -mx-1.5 flex cursor-pointer items-center gap-[8px] rounded-[4px] p-1.5 text-muted-foreground transition-colors hover:bg-foreground/5">
                            <span className="inline-flex h-[10px] w-[16px] shrink-0 items-center justify-center overflow-hidden rounded-[1px] bg-foreground/20 text-[6px] font-black text-background">EN</span>
                            <div className="truncate text-[11px] font-bold leading-[1.4] tracking-wide text-foreground transition-colors">
                                <span className="text-muted-foreground mr-1">{ch.num.split('-')[0]}</span> "{ch.title}"
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-[16px] mb-[12px] flex w-full gap-[16px]">
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        {(update.genres || []).slice(0, 3).map((g: string) => (
                            <span key={g} className="rounded-[2px] bg-foreground/5 px-1.5 py-0.5 opacity-80 transition-opacity hover:opacity-100 dark:bg-foreground/10">{g}</span>
                        ))}
                    </div>
                </div>

                <div className="mt-auto flex w-full items-center border-t border-border/40 pt-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground/80 transition-colors duration-300">
                    Updated {update.updatedAt}
                </div>
            </div>
        </div>
    );
}
