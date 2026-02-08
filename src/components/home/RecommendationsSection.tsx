import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Lightbulb, Sparkles } from "lucide-react";

export function RecommendationsSection() {
    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="section-title text-2xl md:text-3xl">
                    <Lightbulb className="w-6 h-6 text-accent" />
                    Recommendations
                </h2>
                <button className="text-sm text-accent hover:text-accent/80 font-semibold transition-colors">
                    View All →
                </button>
            </div>

            {/* Placeholder cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map(i => (
                    <Card
                        key={i}
                        className="p-6 text-center space-y-3 border-2 border-dashed border-border/50 hover:border-accent/30 transition-colors group"
                    >
                        <div className="flex justify-center">
                            <div className="p-3 rounded-full bg-accent/10 group-hover:bg-accent/20 transition-colors">
                                <Sparkles className="w-6 h-6 text-accent" />
                            </div>
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground">Coming Soon</h3>
                            <p className="text-xs text-muted-foreground">Based on your watched history and ratings</p>
                        </div>
                        <Button variant="ghost" size="sm" disabled className="w-full text-accent">
                            Learn More
                        </Button>
                    </Card>
                ))}
            </div>

            <p className="text-xs text-muted-foreground text-center">
                Recommendations engine coming with more data enrichment 🚀
            </p>
        </section>
    );
}
