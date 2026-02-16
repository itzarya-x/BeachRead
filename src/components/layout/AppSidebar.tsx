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
import { useState, useEffect } from "react";
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

    // Tablet Auto-Collapse Logic (md to lg)
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth >= 768 && window.innerWidth < 1024) {
                setCollapsed(true);
                onCollapsedChange?.(true);
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [onCollapsedChange]);

    const handleToggleCollapse = () => {
        const newState = !collapsed;
        setCollapsed(newState);
        onCollapsedChange?.(newState);
    };

    return (
        <aside
            className={cn(
                "sidebar flex min-h-screen flex-col shrink-0 transition-all duration-300",
                "hidden md:flex", // HIDE ON MOBILE
                collapsed ? "w-20" : "w-[260px]",
            )}
            style={{ transitionTimingFunction: "cubic-bezier(0.23,1,0.32,1)" }}
        >
            {/* Header */}
            <div className={cn("flex h-20 items-center justify-between", collapsed ? "px-4" : "px-6")}>
                {!collapsed && (
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-primary/30 bg-primary text-primary-foreground shadow-[0_0_20px_-12px_hsl(var(--primary)/0.95)] transition-transform duration-200 group-hover:scale-105">
                             <div className="text-xl font-black text-primary-foreground">Y</div>
                        </div>
                        <span className="font-display text-2xl font-black tracking-tight text-foreground">
                            YURA
                        </span>
                    </Link>
                )}
                <button
                    onClick={handleToggleCollapse}
                    className={cn(
                        "sakura-sidebar-button rounded-xl p-2.5 text-sidebar-foreground hover:text-sidebar-accent-foreground",
                        collapsed ? "mx-auto" : "ml-auto"
                    )}
                >
                    <ChevronLeft className={cn("h-5 w-5 transition-transform duration-300 ease-in-out", collapsed && "rotate-180")} />
                </button>
            </div>

            {/* Navigation */}
            <nav className={cn("scrollbar-hide flex-1 overflow-y-auto", collapsed ? "space-y-7 px-3 py-6" : "space-y-8 px-4 py-7")}>
                {mainNav.map((section, idx) => (
                    <div key={idx} className={cn("space-y-3", !collapsed && "px-2")}>
                        {!collapsed && (
                            <h3 className="px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                                {section.title}
                            </h3>
                        )}
                        <div className={cn("space-y-1.5", collapsed && "space-y-2.5")}>
                            {section.items.map(link => {
                                const isActive = link.path === "/" 
                                    ? location.pathname === "/" 
                                    : location.pathname.startsWith(link.path);
                                
                                return (
                                    <Link
                                        key={link.path}
                                        to={link.path}
                                        className={cn(
                                            "sakura-sidebar-button group relative flex items-center gap-4 rounded-xl border transition-all duration-200",
                                            isActive
                                                ? "is-active text-sidebar-accent-foreground font-medium"
                                                : "text-sidebar-foreground hover:text-sidebar-accent-foreground",
                                            collapsed ? "justify-center px-0 py-3.5" : "px-4 py-3"
                                        )}
                                        title={collapsed ? link.label : undefined}
                                    >
                                        {/* Active Pill Highlight (Task 11) */}
                                        {isActive && (
                                            <motion.div 
                                                layoutId="sidebar-pill"
                                                className="absolute left-0 h-8 w-1 rounded-full bg-primary"
                                            />
                                        )}

                                        <link.icon className={cn(
                                            "h-5 w-5 shrink-0 transition-all duration-200",
                                            isActive ? "scale-105 text-primary" : "group-hover:scale-105 group-hover:text-foreground"
                                        )} />
                                        
                                        {!collapsed && (
                                            <span className={cn(
                                                "text-[13px] font-medium tracking-wide",
                                                isActive ? "text-foreground" : ""
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
            <div className="bg-card/25 p-4 backdrop-blur-[18px]">
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
