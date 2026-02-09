import { AppSidebar } from "@/components/layout/AppSidebar";
import { ConflictResolver } from "@/components/sync/ConflictResolver";
import { FirstLoginDialog } from "@/components/sync/FirstLoginDialog";
import { OfflineBanner } from "@/components/sync/OfflineBanner";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { DataProvider, useData } from "@/context/DataContext";
import { StatsFilterProvider } from "@/context/StatsFilterContext";
import { SyncUIProvider, useSyncUIContext } from "@/context/SyncUIContext";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Activity from "./pages/Activity";
import AnimeList from "./pages/AnimeList";
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
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const { loading, user, error } = useData();
    const syncUI = useSyncUIContext();

    // Show loading state
    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="text-center">
                    <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-muted-foreground text-sm">Loading your library…</p>
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
                    <main className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? "ml-20" : "ml-64"}`}>
                        <Routes>
                            <Route path="/" element={<Index />} />
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
                    </main>
                </div>
            </div>

            {/* Global Dialogs */}
            <FirstLoginDialog
                isOpen={syncUI.showFirstLoginDialog}
                onClose={syncUI.hideFirstLogin}
                localItemCount={syncUI.localItemCount}
                cloudItemCount={syncUI.cloudItemCount}
                onUpload={async () => {
                    // TODO: Connect to actual sync engine
                    console.log("Upload local vault");
                }}
                onDownload={async () => {
                    // TODO: Connect to actual sync engine
                    console.log("Download from cloud");
                }}
                onMerge={async () => {
                    // TODO: Connect to actual sync engine
                    console.log("Merge local and cloud");
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
                                <AppContent />
                            </SyncUIProvider>
                        </StatsFilterProvider>
                    </DataProvider>
                </AuthProvider>
            </BrowserRouter>
        </TooltipProvider>
    </QueryClientProvider>
);

export default App;
