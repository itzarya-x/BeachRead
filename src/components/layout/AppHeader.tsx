import { GlobalCloudStatus } from "@/components/sync/GlobalCloudStatus";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useData } from "@/context/DataContext";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { BarChart3, BookOpen, Clock, Database, Home, List, MoreHorizontal, Settings, Trophy, Tv } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const mainNav = [
    { path: "/", label: "Pulse", icon: Home },
    { path: "/anime", label: "Archive", icon: Tv },
    { path: "/manga", label: "Library", icon: BookOpen },
    { path: "/tiers", label: "Ranking", icon: Trophy },
    { path: "/stats", label: "Intelligence", icon: BarChart3 },
    { path: "/activity", label: "Sync", icon: Clock },
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
        <header className="sakura-glass sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4">
                <div className="flex items-center h-16 gap-6">
                    {/* Brand */}
                    <Link to="/" className="flex items-center gap-2 shrink-0 group">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center rotate-45 group-hover:rotate-90 transition-transform duration-500 shadow-glow">
                             <div className="-rotate-45 group-hover:-rotate-90 transition-transform duration-500 text-white font-black text-xl">Y</div>
                        </div>
                        <span className="font-display font-black text-2xl tracking-tighter text-foreground group-hover:text-primary transition-colors">
                            YURA
                        </span>
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
                                        "sakura-sidebar-button flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap relative group",
                                        isActive
                                            ? "is-active text-primary"
                                            : "text-muted-foreground/60 hover:text-foreground",
                                    )}
                                >
                                    <link.icon className={cn("w-3.5 h-3.5", isActive ? "text-primary" : "text-muted-foreground/40")} />
                                    <span className="hidden lg:inline">{link.label}</span>
                                    {isActive && (
                                        <motion.div 
                                            layoutId="header-active"
                                            className="absolute bottom-0 inset-x-0 h-0.5 bg-primary shadow-glow z-10" 
                                        />
                                    )}
                                </Link>
                            );
                        })}

                        {/* More dropdown */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    className={cn(
                                        "sakura-sidebar-button flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                                        isMoreActive
                                            ? "is-active text-primary"
                                            : "text-muted-foreground hover:text-foreground",
                                    )}
                                >
                                    <MoreHorizontal className="w-4 h-4" />
                                    <span className="hidden sm:inline">More</span>
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                                {moreNav.map(link => (
                                    <DropdownMenuItem key={link.path} asChild>
                                        <Link to={link.path} className="sakura-sidebar-button flex items-center gap-2 cursor-pointer">
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
                            {/* Cloud Status (PHASE 4-5) */}
                            <GlobalCloudStatus />

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
