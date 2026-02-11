import { SidebarAccountBlock } from "@/components/account/SidebarAccountBlock";
import { CloudSyncStatusIndicator } from "@/components/sync/CloudSyncStatusIndicator";
import { SyncStatusIndicator } from "@/components/sync/SyncStatusIndicator";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
    Activity as ActivityIcon,
    BarChart3,
    BookOpen,
    ChevronLeft,
    Home,
    Play,
    Settings,
    Trophy,
    Tv
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

interface AppSidebarProps {
    isCollapsed?: boolean;
    onCollapsedChange?: (collapsed: boolean) => void;
}

const mainNav = [
    {
        title: "Main",
        items: [
            { path: "/", label: "Home", icon: Home },
            { path: "/continue", label: "Continue", icon: Play },
        ]
    },
    {
        title: "Library",
        items: [
            { path: "/anime", label: "Anime Archive", icon: Tv },
            { path: "/manga", label: "Manga Library", icon: BookOpen },
        ]
    },
    {
        title: "Discover",
        items: [
             { path: "/tier-maker", label: "Tier Ranking", icon: Trophy },
             { path: "/activity", label: "Interaction", icon: ActivityIcon },
        ]
    },
    {
        title: "Analytics",
        items: [
             { path: "/stats", label: "Intelligence", icon: BarChart3 },
        ]
    },
    {
        title: "System",
        items: [
             { path: "/settings", label: "Protocols", icon: Settings },
        ]
    },
];

export function AppSidebar({ isCollapsed = false, onCollapsedChange }: AppSidebarProps) {
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(isCollapsed);

    const handleToggleCollapse = () => {
        const newState = !collapsed;
        setCollapsed(newState);
        onCollapsedChange?.(newState);
    };

    return (
        <aside
            className={cn(
                "fixed left-0 top-0 h-screen bg-sidebar-background/80 backdrop-blur-2xl border-r border-sidebar-border transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] flex flex-col z-40",
                "hidden md:flex", // Hide on mobile
                collapsed ? "w-20" : "w-72",
            )}
        >
            {/* Header */}
            <div className="h-20 flex items-center justify-between px-8">
                {!collapsed && (
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center rotate-3 group-hover:rotate-12 transition-all duration-500 shadow-glow">
                             <div className="-rotate-3 group-hover:-rotate-12 transition-all duration-500 text-primary-foreground font-black text-xl">Y</div>
                        </div>
                        <span className="font-display font-black text-2xl tracking-tighter text-foreground">
                            YURA
                        </span>
                    </Link>
                )}
                <button
                    onClick={handleToggleCollapse}
                    className={cn(
                        "p-2.5 rounded-xl hover:bg-white/5 text-white/20 hover:text-white transition-all",
                        collapsed ? "mx-auto" : "ml-auto"
                    )}
                >
                    <ChevronLeft className={cn("w-5 h-5 transition-transform duration-700 ease-in-out", collapsed && "rotate-180")} />
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-4 py-8 space-y-12 scrollbar-hide">
                {mainNav.map((section, idx) => (
                    <div key={idx} className="space-y-4">
                        {!collapsed && (
                            <h3 className="text-[10px] font-black text-white/10 uppercase tracking-[0.4em] px-4">
                                {section.title}
                            </h3>
                        )}
                        <div className="space-y-1">
                            {section.items.map(link => {
                                const isActive = link.path === "/" 
                                    ? location.pathname === "/" 
                                    : location.pathname.startsWith(link.path);
                                
                                return (
                                    <Link
                                        key={link.path}
                                        to={link.path}
                                        className={cn(
                                            "relative flex items-center gap-5 px-5 py-3 rounded-xl transition-all duration-300 group",
                                            isActive
                                                ? "text-primary"
                                                : "text-white/40 hover:text-white hover:bg-white/[0.03]",
                                            collapsed && "justify-center px-0"
                                        )}
                                        title={collapsed ? link.label : undefined}
                                    >
                                        {/* Active Pill Highlight (Task 11) */}
                                        {isActive && (
                                            <motion.div 
                                                layoutId="sidebar-pill"
                                                className="absolute left-0 w-1 h-8 bg-primary rounded-r-full shadow-[0_0_15px_rgba(56,189,248,0.8)]"
                                            />
                                        )}

                                        <link.icon className={cn(
                                            "w-5 h-5 shrink-0 transition-transform duration-300",
                                            isActive ? "scale-110" : "group-hover:scale-110"
                                        )} />
                                        
                                        {!collapsed && (
                                            <span className={cn(
                                                "text-[13px] font-bold tracking-tight",
                                                isActive ? "text-white" : ""
                                            )}>
                                                {link.label}
                                            </span>
                                        )}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-border/10 bg-black/20 backdrop-blur-md">
                <div className="space-y-4">
                    {/* Account Block */}
                    <SidebarAccountBlock collapsed={collapsed} />
                    
                    {!collapsed && (
                        <div className="flex items-center justify-between px-2 pt-2">
                            <CloudSyncStatusIndicator />
                            <SyncStatusIndicator
                                status="synced"
                                lastSyncTime={new Date()}
                                itemsUploaded={0}
                                itemsDownloaded={0}
                                conflictCount={0}
                            />
                        </div>
                    )}
                </div>
            </div>
        </aside>
    );
}
