import { Link } from 'react-router-dom';
import { handleCoverImageError, sanitizeCoverUrl } from '../../../shared/utils/image';

export function StatusMeter({ label, value, percentage, color }: { label: string; value: string; percentage: number; color: string }) {
    return (
        <div className="space-y-2">
            <div className="flex justify-between items-end">
                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{label}</span>
                <span className="text-[10px] font-black text-foreground">{value}</span>
            </div>
            <div className="h-2 w-full bg-muted border border-border/40 rounded-full overflow-hidden relative">
                <div
                    className="h-full transition-all duration-1000 ease-out"
                    style={{
                        width: `${percentage}%`,
                        backgroundColor: color,
                        boxShadow: `0 0 10px ${color}40`
                    }}
                />
            </div>
        </div>
    );
}

export function StatRow({ label, value, primaryColor }: { label: string; value: string | number, primaryColor: string }) {
    return (
        <div className="flex justify-between items-end relative z-10 p-6 border-b border-border/20 group hover:bg-primary/5 transition-colors">
            <span className="text-[12px] font-black uppercase tracking-[0.2em] opacity-40 group-hover:opacity-100 group-hover:text-primary transition-all">{label}</span>
            <div className="flex flex-col items-end">
                <span className="text-6xl font-black text-foreground leading-none tracking-tighter">{value}</span>
                <div className="w-24 h-2 mt-4 bg-muted relative overflow-hidden">
                    <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-700 ease-out" style={{ backgroundColor: primaryColor }} />
                </div>
            </div>
        </div>
    );
}

export const FavoriteCover: React.FC<{ item: any }> = ({ item }) => (
    <Link
        to={`/manga/${item.id}`}
        className="group relative aspect-[2/3] overflow-hidden rounded-2xl border border-white/5 bg-muted/20 transition-all duration-500 hover:scale-[1.05] hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
        title={item.title}
    >
        <img
            src={sanitizeCoverUrl(item.coverUrl)}
            onError={handleCoverImageError}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
            alt={item.title}
        />
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/20 to-transparent p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <p className="line-clamp-2 text-[10px] font-black uppercase tracking-tight text-white leading-tight">{item.title}</p>
        </div>
    </Link>
);
