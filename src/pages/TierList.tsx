/**
 * PHASE 5: Tier List Gallery
 * View all created tier boards
 */

import { PageContent, PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
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
            <PageHeader 
                title="Tier Boards" 
                subtitle="Manage your ranking boards"
                action={
                    <Button 
                        onClick={handleCreateBoard}
                        icon={Plus}
                        variant="primary"
                    >
                        New Board
                    </Button>
                }
            />

            <PageContent className="animate-fade-in">
                {boards.length === 0 ? (
                    <EmptyTierList onCreate={handleCreateBoard} />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {boards.map(board => (
                            <Link 
                                key={board.id} 
                                to={`/tier-maker?board=${board.id}`}
                                className="group relative bg-card border border-border rounded-xl overflow-hidden hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300"
                            >
                                <div className="aspect-video bg-gradient-to-br from-primary/5 to-secondary flex items-center justify-center group-hover:scale-105 transition-transform duration-500">
                                    <LayoutGrid className="w-12 h-12 text-primary/20 group-hover:text-primary/40 transition-colors" />
                                </div>
                                
                                <div className="p-5">
                                    <h3 className="text-lg font-bold group-hover:text-primary transition-colors mb-1">{board.name}</h3>
                                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                        {board.description || "No description"}
                                    </p>
                                    <div className="flex items-center justify-between text-xs text-muted-foreground/60">
                                        <span>Created {new Date(board.createdAt).toLocaleDateString()}</span>
                                        <span className="group-hover:translate-x-1 transition-transform">Open Board →</span>
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </PageContent>
        </PageWrapper>
    );
}
