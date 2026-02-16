import { Button } from "@/components/ui/button";
import type { DisplayUser } from "@/types/display";
import { Plus, Trophy, Upload } from "lucide-react";

interface HeroSectionProps {
    user: DisplayUser;
    onAddClick: () => void;
    onImportClick: () => void;
    onTierClick: () => void;
}

export function HeroSection({ user, onAddClick, onImportClick, onTierClick }: HeroSectionProps) {
    return (
        <div className="relative overflow-hidden mb-8">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-background to-accent/5" />
            {user.bannerUrl && (
                <div className="absolute inset-0">
                    <img src={user.bannerUrl} alt="" className="w-full h-full object-cover opacity-10" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
                </div>
            )}

            {/* Content */}
            <div className="relative w-full py-8 md:py-10">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    {/* Left: Avatar + Welcome + Subtitle */}
                    <div className="flex items-center gap-4">
                        {user.avatarUrl ? (
                            <img
                                src={user.avatarUrl}
                                alt={user.displayName}
                                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-primary/20 shadow-lg"
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold shadow-lg">
                                {user.displayName.charAt(0).toUpperCase()}
                            </div>
                        )}
                        <div>
                            <h1 className="font-display text-2xl md:text-3xl font-extrabold text-foreground">
                                Welcome back, {user.displayName}
                            </h1>
                            <p className="text-muted-foreground text-sm mt-1">Your personal media command center</p>
                        </div>
                    </div>

                    {/* Right: Quick buttons */}
                    <div className="flex gap-2 w-full md:w-auto">
                        <Button onClick={onAddClick} variant="default" size="sm" className="gap-2 flex-1 md:flex-none">
                            <Plus className="w-4 h-4" />
                            <span className="hidden sm:inline">Add</span>
                        </Button>
                        <Button
                            onClick={onImportClick}
                            variant="outline"
                            size="sm"
                            className="gap-2 flex-1 md:flex-none"
                        >
                            <Upload className="w-4 h-4" />
                            <span className="hidden sm:inline">Import</span>
                        </Button>
                        <Button onClick={onTierClick} variant="outline" size="sm" className="gap-2 flex-1 md:flex-none">
                            <Trophy className="w-4 h-4" />
                            <span className="hidden sm:inline">Tier List</span>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
