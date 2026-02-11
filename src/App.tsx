import { FirstLoginPrompt } from "@/components/account/FirstLoginPrompt";
import { SessionRestoreToast } from "@/components/account/SessionRestoreToast";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { TopHeader } from "@/components/layout/TopHeader";
import { DuplicateDetectorDialog } from "@/components/media/DuplicateDetectorDialog";
import { ConflictResolver } from "@/components/sync/ConflictResolver";
import { FirstLoginDialog } from "@/components/sync/FirstLoginDialog";
import { OfflineBanner } from "@/components/sync/OfflineBanner";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { ToastProvider } from "@/components/ui/ToastNotification";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { DataProvider, useData } from "@/context/DataContext";
import { StatsFilterProvider } from "@/context/StatsFilterContext";
import { SyncUIProvider, useSyncUIContext } from "@/context/SyncUIContext";
import { cn } from "@/lib/utils";
import { downloadVaultFromCloud, markVaultSkipped, mergeVaults, migrateVaultToCloud } from "@/lib/vault-migration";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnimatePresence } from "framer-motion";
import { useState } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import Activity from "./pages/Activity";
import AnimeList from "./pages/AnimeList";
import { AuthCallback } from "./pages/AuthCallback";
import Continue from "./pages/Continue";
import CustomLists from "./pages/CustomLists";
import Index from "./pages/Index";
import MangaList from "./pages/MangaList";
import MediaDetail from "./pages/MediaDetail";
import NotFound from "./pages/NotFound";
import RawData from "./pages/RawData";
import Settings from "./pages/Settings";
import Stats from "./pages/Stats";
import TierList from "./pages/TierList";
import TierMaker from "./pages/TierMaker";

const queryClient = new QueryClient();

const AppContent = () => {
    console.log("%c🔥 Yura App V2 (Cloud-Only Boot) Active", "color: #ff922b; font-weight: bold;");
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const { loading, user, error } = useData();
    const { user: authUser } = useAuth();
    const syncUI = useSyncUIContext();
    const location = useLocation();

    // Show loading state
    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#090f1a] relative overflow-hidden">
                {/* Ambient Glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
                
                <div className="relative z-10 text-center space-y-8">
                    <div className="relative">
                        <div className="w-20 h-20 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto shadow-glow" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <h1 className="text-2xl font-black tracking-[0.3em] uppercase text-white/80">Yura</h1>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 animate-pulse">Initializing Neural Link</p>
                    </div>
                </div>
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="text-center max-w-md">
                    <p className="text-destructive mb-2 font-semibold">Error Loading Data</p>
                    <p className="text-sm text-muted-foreground mb-4">{error}</p>
                    <div className="flex gap-2 justify-center">
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm"
                        >
                            Retry
                        </button>
                        <button
                            onClick={() => (window.location.href = "/")}
                            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 text-sm"
                        >
                            Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // Show no user state
    if (!user) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="text-center">
                    <p className="text-destructive mb-4">Failed to load profile data.</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="flex min-h-screen bg-background flex-col">
                <OfflineBanner />
                <div className="flex flex-1">
                    <AppSidebar isCollapsed={sidebarCollapsed} onCollapsedChange={setSidebarCollapsed} />
                    
                    {/* Main Content Area */}
                    <div className={cn(
                        "flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out",
                        sidebarCollapsed ? "md:ml-20" : "md:ml-72",
                        "ml-0" // No margin on mobile
                    )}>
                        <TopHeader />
                        <main className="flex-1 overflow-y-auto">
                            <AnimatePresence mode="wait">
                                <Routes location={location} key={location.pathname}>
                                    <Route path="/" element={<Index />} />
                                    <Route path="/auth/callback" element={<AuthCallback />} />
                                    <Route path="/continue" element={<Continue />} />
                                    <Route path="/anime" element={<AnimeList />} />
                                    <Route path="/anime/:id" element={<MediaDetail />} />
                                    <Route path="/manga" element={<MangaList />} />
                                    <Route path="/manga/:id" element={<MediaDetail />} />
                                    <Route path="/tiers" element={<TierList />} />
                                    <Route path="/tier-maker" element={<TierMaker />} />
                                    <Route path="/custom-lists" element={<CustomLists />} />
                                    <Route path="/stats" element={<Stats />} />
                                    <Route path="/activity" element={<Activity />} />
                                    <Route path="/settings" element={<Settings />} />
                                    <Route path="/raw-data" element={<RawData />} />
                                    <Route path="*" element={<NotFound />} />
                                </Routes>
                            </AnimatePresence>
                        </main>
                    </div>
                </div>
            </div>

            {/* Auth UI Components (PHASE 6-9) */}
            <FirstLoginPrompt />
            <SessionRestoreToast />

            {/* Global Dialogs */}
            <FirstLoginDialog
                isOpen={syncUI.showFirstLoginDialog}
                onClose={() => {
                    // Mark as skipped when user closes dialog without action
                    if (authUser) {
                        markVaultSkipped(authUser.id);
                    }
                    syncUI.hideFirstLogin();
                }}
                localItemCount={syncUI.localItemCount}
                cloudItemCount={syncUI.cloudItemCount}
                onUpload={async () => {
                    if (!authUser) throw new Error("No user authenticated");

                    const result = await migrateVaultToCloud(authUser.id, {
                        onStatus: status => console.log("Migration:", status),
                        onProgress: (current, total) => {
                            console.log(`Progress: ${current}/${total}`);
                        },
                    });

                    if (!result.success) {
                        throw new Error(result.error || "Migration failed");
                    }
                }}
                onDownload={async () => {
                    if (!authUser) throw new Error("No user authenticated");

                    const result = await downloadVaultFromCloud(authUser.id, {
                        onStatus: status => console.log("Download:", status),
                        onProgress: (current, total) => {
                            console.log(`Progress: ${current}/${total}`);
                        },
                    });

                    if (!result.success) {
                        throw new Error(result.error || "Download failed");
                    }
                }}
                onMerge={async () => {
                    if (!authUser) throw new Error("No user authenticated");

                    const result = await mergeVaults(authUser.id, {
                        onStatus: status => console.log("Merge:", status),
                        onProgress: (current, total) => {
                            console.log(`Progress: ${current}/${total}`);
                        },
                    });

                    if (!result.success) {
                        throw new Error(result.error || "Merge failed");
                    }
                }}
            />

            <ConflictResolver
                isOpen={syncUI.showConflictResolver}
                onClose={syncUI.hideConflicts}
                conflicts={syncUI.conflicts}
                onResolve={async (conflictId, choice) => {
                    // TODO: Connect to actual conflict resolver
                    console.log(`Resolved conflict ${conflictId} with choice: ${choice}`);
                }}
            />

            <DuplicateDetectorDialog />
            <CommandPalette />
        </>
    );
};

const App = () => (
    <QueryClientProvider client={queryClient}>
        <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
                <AuthProvider>
                    <DataProvider>
                        <StatsFilterProvider>
                            <SyncUIProvider>
                                <ToastProvider>
                                    <AppContent />
                                </ToastProvider>
                            </SyncUIProvider>
                        </StatsFilterProvider>
                    </DataProvider>
                </AuthProvider>
            </BrowserRouter>
        </TooltipProvider>
    </QueryClientProvider>
);

export default App;
