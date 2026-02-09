import { CloudSyncStatusIndicator } from "@/components/sync/CloudSyncStatusIndicator";
import { SyncStatusIndicator } from "@/components/sync/SyncStatusIndicator";
import { useData } from "@/context/DataContext";
import { cn } from "@/lib/utils";
import { BarChart3, BookOpen, ChevronLeft, Clock, Database, Heart, Home, Settings, Trophy, Tv } from "lucide-react";
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const mainNav = [
    { path: "/", label: "Home", icon: Home },
    { path: "/anime", label: "Anime", icon: Tv },
    { path: "/manga", label: "Manga", icon: BookOpen },
    { path: "/tier-maker", label: "Tier Maker", icon: Trophy },
    { path: "/tiers", label: "Tiers", icon: Trophy },
    { path: "/stats", label: "Stats", icon: BarChart3 },
    { path: "/activity", label: "Activity", icon: Clock },
];

const secondaryNav = [
    { path: "/custom-lists", label: "Favourites", icon: Heart },
    { path: "/settings", label: "Settings", icon: Settings },
    { path: "/raw-data", label: "Raw Data", icon: Database },
];

interface AppSidebarProps {
    isCollapsed?: boolean;
    onCollapsedChange?: (collapsed: boolean) => void;
}

export function AppSidebar({ isCollapsed = false, onCollapsedChange }: AppSidebarProps) {
    const location = useLocation();
    const { user } = useData();
    const [collapsed, setCollapsed] = useState(isCollapsed);

    const handleToggleCollapse = () => {
        const newState = !collapsed;
        setCollapsed(newState);
        onCollapsedChange?.(newState);
    };

    return (
        <aside
            className={cn(
                "fixed left-0 top-0 h-screen bg-surface-1 border-r border-border/30 transition-all duration-300 flex flex-col z-40",
                collapsed ? "w-20" : "w-64",
            )}
        >
            {/* Header */}
            <div className="p-4 border-b border-border/20 space-y-4">
                {/* Logo and collapse button */}
                <div className="flex items-center justify-between">
                    {!collapsed && (
                        <Link to="/" className="font-display font-extrabold text-xl text-gradient">
                            Yura
                        </Link>
                    )}
                    <button
                        onClick={handleToggleCollapse}
                        className="p-1.5 rounded-lg hover:bg-secondary transition-colors ml-auto"
                        title={collapsed ? "Expand" : "Collapse"}
                    >
                        <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} />
                    </button>
                </div>

                {/* User Profile */}
                <div className={cn("flex items-center", collapsed ? "justify-center" : "gap-3")}>
                    {user?.avatarUrl ? (
                        <img
                            src={user.avatarUrl}
                            alt={user.displayName}
                            className="w-10 h-10 rounded-lg object-cover ring-2 ring-primary/20"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
                            {user?.displayName.charAt(0).toUpperCase()}
                        </div>
                    )}
                    {!collapsed && (
                        <div className="min-w-0">
                            <p className="text-xs font-semibold text-muted-foreground">Logged in as</p>
                            <p className="text-sm font-bold text-foreground truncate">{user?.displayName}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                {/* Main Navigation */}
                <div className="space-y-1">
                    {mainNav.map(link => {
                        const isActive =
                            link.path === "/" ? location.pathname === "/" : location.pathname.startsWith(link.path);
                        return (
                            <Link
                                key={link.path}
                                to={link.path}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                                    isActive
                                        ? "bg-primary/20 text-primary border-l-2 border-primary"
                                        : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
                                )}
                                title={collapsed ? link.label : undefined}
                            >
                                <link.icon className="w-5 h-5 shrink-0" />
                                {!collapsed && <span className="text-sm font-medium">{link.label}</span>}
                            </Link>
                        );
                    })}
                </div>

                {/* Secondary Navigation */}
                {!collapsed && (
                    <>
                        <div className="my-4 border-t border-border/20" />
                        <div className="space-y-1">
                            {secondaryNav.map(link => {
                                const isActive = location.pathname === link.path;
                                return (
                                    <Link
                                        key={link.path}
                                        to={link.path}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                                            isActive
                                                ? "bg-primary/20 text-primary border-l-2 border-primary"
                                                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
                                        )}
                                    >
                                        <link.icon className="w-5 h-5 shrink-0" />
                                        <span className="text-sm font-medium">{link.label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    </>
                )}
            </nav>

            {/* Footer */}
            {!collapsed && (
                <div className="p-3 border-t border-border/20 space-y-3">
                    {/* Cloud Sync Status (PHASE 8) */}
                    <div className="flex justify-center">
                        <CloudSyncStatusIndicator />
                    </div>

                    {/* Sync Status */}
                    <div className="flex justify-center">
                        <SyncStatusIndicator
                            status="synced"
                            lastSyncTime={new Date()}
                            itemsUploaded={0}
                            itemsDownloaded={0}
                            conflictCount={0}
                        />
                    </div>
                    <p className="text-xs text-muted-foreground/60 text-center">v1.0</p>
                </div>
            )}
            {collapsed && (
                <div className="p-3 border-t border-border/20 space-y-3 flex flex-col items-center justify-center">
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
        </aside>
    );
}
