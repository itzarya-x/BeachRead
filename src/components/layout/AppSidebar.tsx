import { SidebarAccountBlock } from "@/components/account/SidebarAccountBlock";
import { CloudSyncStatusIndicator } from "@/components/sync/CloudSyncStatusIndicator";
import { SyncStatusIndicator } from "@/components/sync/SyncStatusIndicator";
import { cn } from "@/lib/utils";
import {
    Activity as ActivityIcon,
    BarChart3,
    BookOpen,
    ChevronLeft,
    Home,
    Play,
    Trophy,
    Tv
} from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

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
            { path: "/anime", label: "Anime", icon: Tv },
            { path: "/manga", label: "Manga", icon: BookOpen },
        ]
    },
    {
        title: "Discover",
        items: [
             { path: "/tier-maker", label: "Tier Lists", icon: Trophy },
             { path: "/stats", label: "Stats", icon: BarChart3 },
             { path: "/activity", label: "Activity", icon: ActivityIcon },
        ]
    },
];


interface AppSidebarProps {
    isCollapsed?: boolean;
    onCollapsedChange?: (collapsed: boolean) => void;
}

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
                "fixed left-0 top-0 h-screen bg-sidebar-background/80 backdrop-blur-2xl border-r border-white/5 transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] flex flex-col z-40",
                "hidden md:flex", // Hide on mobile
                collapsed ? "w-20" : "w-72",
            )}
        >
            {/* Header */}
            <div className="h-20 flex items-center justify-between px-6">
                {!collapsed && (
                    <Link to="/" className="flex items-center gap-3 group">
                        <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center rotate-3 group-hover:rotate-12 transition-all duration-500 shadow-glow">
                             <div className="-rotate-3 group-hover:-rotate-12 transition-all duration-500 text-primary-foreground font-black text-lg">Y</div>
                        </div>
                        <span className="font-display font-black text-2xl tracking-tighter text-foreground group-hover:text-primary transition-all duration-500">
                            YURA
                        </span>
                    </Link>
                )}
                <button
                    onClick={handleToggleCollapse}
                    className={cn(
                        "p-2.5 rounded-xl hover:bg-white/5 text-muted-foreground hover:text-foreground transition-all active:scale-90",
                        collapsed ? "mx-auto" : "ml-auto"
                    )}
                    title={collapsed ? "Expand" : "Collapse"}
                >
                    <ChevronLeft className={cn("w-5 h-5 transition-transform duration-700 ease-in-out", collapsed && "rotate-180")} />
                </button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto px-4 py-8 space-y-10 scrollbar-hide">
                {mainNav.map((section, idx) => (
                    <div key={idx} className="space-y-4">
                        {!collapsed && (
                            <h3 className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-[0.3em] px-4">
                                {section.title}
                            </h3>
                        )}
                        <div className="space-y-1.5 font-display">
                            {section.items.map(link => {
                                const isActive = link.path === "/" 
                                    ? location.pathname === "/" 
                                    : location.pathname.startsWith(link.path);
                                
                                return (
                                    <Link
                                        key={link.path}
                                        to={link.path}
                                        className={cn(
                                            "relative flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-500 group overflow-hidden",
                                            isActive
                                                ? "bg-primary text-primary-foreground shadow-glow shadow-primary/20"
                                                : "text-muted-foreground/60 hover:text-foreground hover:bg-white/[0.04]",
                                            collapsed && "justify-center px-0"
                                        )}
                                        title={collapsed ? link.label : undefined}
                                    >
                                        <link.icon className={cn(
                                            "w-5 h-5 shrink-0 transition-all duration-500 group-hover:scale-110",
                                            isActive ? "text-primary-foreground" : "group-hover:text-primary"
                                        )} strokeWidth={isActive ? 2.5 : 2} />
                                        
                                        {!collapsed && (
                                            <span className={cn(
                                                "text-sm font-bold tracking-tight transition-all duration-500",
                                                isActive ? "translate-x-0.5" : "group-hover:translate-x-1"
                                            )}>
                                                {link.label}
                                            </span>
                                        )}
                                        
                                        {/* Active Glow Pill (if not collapsed) */}
                                        {isActive && !collapsed && (
                                            <div className="absolute right-2 w-1.5 h-1.5 rounded-full bg-primary-foreground/50" />
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
