import { AppSidebar } from "@/components/layout/AppSidebar";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { DataProvider } from "@/context/DataContext";
import { StatsFilterProvider } from "@/context/StatsFilterContext";
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

    return (
        <div className="flex min-h-screen bg-background">
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
    );
};

const App = () => (
    <QueryClientProvider client={queryClient}>
        <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
                <DataProvider>
                    <StatsFilterProvider>
                        <AppContent />
                    </StatsFilterProvider>
                </DataProvider>
            </BrowserRouter>
        </TooltipProvider>
    </QueryClientProvider>
);

export default App;
