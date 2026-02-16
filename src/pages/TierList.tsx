/**
 * PHASE 5: Tier List Gallery
 * View all created tier boards
 */

import { PageContent, PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { AutoBento } from "@/components/layout/AutoBento";
import { EmptyTierList } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/YuraButton";
import { TierBoard, createTierBoard, getAllTierBoards } from "@/lib/tierDatabase";
import { LayoutGrid, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export default function TierList() {
    const [boards, setBoards] = useState<TierBoard[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        loadBoards();
    }, []);

    const loadBoards = async () => {
        try {
            const loaded = await getAllTierBoards();
            setBoards(loaded);
        } catch (err) {
            console.error("Failed to load tier boards:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBoard = async () => {
        const name = prompt("Board Name:");
        if (name) {
            try {
                const id = await createTierBoard({ name, description: "" });
                navigate(`/tier-maker?board=${id}`);
            } catch (err) {
                console.error("Failed to create board:", err);
            }
        }
    };

    if (loading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
        );
    }

    return (
        <PageWrapper>
            <div className="page-container">
                <PageHeader 
                    title="Tier Boards" 
                    subtitle="Manage your ranking boards"
                    action={
                        <Button 
                            onClick={handleCreateBoard}
                            icon={Plus}
                            variant="primary"
                            className="h-12 rounded-2xl px-8 shadow-glow"
                        >
                            New Board
                        </Button>
                    }
                />
            </div>

            <PageContent className="animate-fade-in max-w-none px-0">
                {boards.length === 0 ? (
                    <div className="page-container">
                        <EmptyTierList onCreate={handleCreateBoard} />
                    </div>
                ) : (
                    <AutoBento maxWidth={1500} minTileWidth={320}>
                        {boards.map(board => (
                            <Link 
                                key={board.id} 
                                to={`/tier-maker?board=${board.id}`}
                                className="group relative overflow-hidden rounded-3xl border border-white/5 bg-white/5 transition-all duration-500 hover:border-primary/30 hover:-translate-y-1 hover:shadow-depth2"
                            >
                                <div className="aspect-video bg-gradient-to-br from-primary/10 via-transparent to-black/40 flex items-center justify-center">
                                    <LayoutGrid className="w-12 h-12 text-primary/20 transition-colors group-hover:text-primary/40" />
                                </div>
                                
                                <div className="p-6">
                                    <h3 className="mb-1 text-lg font-black tracking-tight text-white group-hover:text-primary transition-colors uppercase">{board.name}</h3>
                                    <p className="mb-5 line-clamp-2 text-[10px] uppercase font-bold tracking-widest text-white/30 leading-relaxed">
                                        {board.description || "No tactical briefing provided"}
                                    </p>
                                    <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-[0.2em] text-white/20">
                                        <span>Initialised {new Date(board.createdAt).toLocaleDateString()}</span>
                                        <span className="text-primary group-hover:translate-x-1 transition-transform">Access →</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </AutoBento>
                )}
            </PageContent>
        </PageWrapper>
    );
}
