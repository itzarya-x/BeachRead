import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useData } from "@/context/DataContext";
import { cn } from "@/lib/utils";
import { BarChart3, BookOpen, Clock, Database, Home, List, MoreHorizontal, Settings, Trophy, Tv } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const mainNav = [
    { path: "/", label: "Home", icon: Home },
    { path: "/anime", label: "Anime", icon: Tv },
    { path: "/manga", label: "Manga", icon: BookOpen },
    { path: "/tiers", label: "Tiers", icon: Trophy },
    { path: "/stats", label: "Stats", icon: BarChart3 },
    { path: "/activity", label: "Activity", icon: Clock },
];

const moreNav = [
    { path: "/custom-lists", label: "Custom Lists", icon: List },
    { path: "/settings", label: "Settings", icon: Settings },
    { path: "/raw-data", label: "Raw Data", icon: Database },
];

export function AppHeader() {
    const location = useLocation();
    const { user, enriching, enrichProgress } = useData();

    const isMoreActive = moreNav.some(l => location.pathname === l.path);

    return (
        <header className="sticky top-0 z-50 glass-strong">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center h-14 gap-4">
                    {/* Brand */}
                    <Link to="/" className="font-display font-extrabold text-xl tracking-tight shrink-0 text-gradient">
                        AniTrack
                    </Link>

                    {/* Navigation */}
                    <nav className="flex items-center gap-0.5 overflow-x-auto hide-scrollbar flex-1">
                        {mainNav.map(link => {
                            const isActive =
                                link.path === "/" ? location.pathname === "/" : location.pathname.startsWith(link.path);
                            return (
                                <Link
                                    key={link.path}
                                    to={link.path}
                                    className={cn(
                                        "flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap relative",
                                        isActive
                                            ? "text-primary bg-primary/10 border-b-2 border-primary"
                                            : "text-muted-foreground hover:text-foreground hover:bg-secondary/40",
                                    )}
                                >
                                    <link.icon className="w-4 h-4" />
                                    <span className="hidden sm:inline">{link.label}</span>
                                    {isActive && (
                                        <span className="absolute inset-0 rounded-lg border border-primary/20 pointer-events-none" />
                                    )}
                                </Link>
                            );
                        })}

                        {/* More dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    className={cn(
                                        "flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                                        isMoreActive
                                            ? "text-primary bg-primary/10"
                                            : "text-muted-foreground hover:text-foreground hover:bg-secondary/60",
                                    )}
                                >
                                    <MoreHorizontal className="w-4 h-4" />
                                    <span className="hidden sm:inline">More</span>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                                {moreNav.map(link => (
                                    <DropdownMenuItem key={link.path} asChild>
                                        <Link to={link.path} className="flex items-center gap-2 cursor-pointer">
                                            <link.icon className="w-4 h-4" />
                                            {link.label}
                                        </Link>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </nav>

                    {/* User area */}
                    {user && (
                        <div className="flex items-center gap-3 shrink-0">
                            {enriching && (
                                <div className="text-xs text-muted-foreground hidden md:block">
                                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-glow-pulse mr-1.5" />
                                    {enrichProgress.loaded}/{enrichProgress.total}
                                </div>
                            )}
                            {user.avatarUrl ? (
                                <img
                                    src={user.avatarUrl}
                                    alt={user.displayName}
                                    className="w-8 h-8 rounded-full object-cover ring-2 ring-primary/30 transition-all hover:ring-primary/60"
                                />
                            ) : (
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold">
                                    {user.displayName.charAt(0).toUpperCase()}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Enrichment progress */}
            {enriching && enrichProgress.total > 0 && (
                <div className="h-0.5 bg-surface-1">
                    <div
                        className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
                        style={{
                            width: `${(enrichProgress.loaded / enrichProgress.total) * 100}%`,
                        }}
                    />
                </div>
            )}
        </header>
    );
}
