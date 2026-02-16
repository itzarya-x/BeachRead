import React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/YuraButton";
import { Filter, Search, RotateCcw, Check, MinusCircle, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { FilterState } from "@/types/filters";
import { 
  GENRES, 
  ANIME_FORMATS, 
  MANGA_FORMATS, 
  MEDIA_STATUSES, 
  SEASONS, 
  COUNTRIES, 
  SOURCES,
  SORT_OPTIONS
} from "@/lib/media-constants";

interface AdvancedFilterPanelProps {
  type: "ANIME" | "MANGA";
  filters: FilterState;
  updateFilters: (updater: Partial<FilterState> | ((prev: FilterState) => FilterState)) => void;
  resetFilters: () => void;
}

export function AdvancedFilterPanel({ type, filters, updateFilters, resetFilters }: AdvancedFilterPanelProps) {
  const formats = type === "ANIME" ? ANIME_FORMATS : MANGA_FORMATS;

  const handleGenreToggle = (genre: string) => {
    updateFilters(prev => {
      const isIncluded = prev.genres.includes(genre);
      const isExcluded = prev.excludedGenres.includes(genre);

      if (!isIncluded && !isExcluded) {
        return { ...prev, genres: [...prev.genres, genre] };
      } else if (isIncluded) {
        return { 
          ...prev, 
          genres: prev.genres.filter(g => g !== genre),
          excludedGenres: [...prev.excludedGenres, genre]
        };
      } else {
        return { 
          ...prev, 
          excludedGenres: prev.excludedGenres.filter(g => g !== genre)
        };
      }
    });
  };

  const SectionLabel = ({ children, hint }: { children: React.ReactNode, hint?: string }) => (
    <div className="flex items-center gap-2 mb-3">
      <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 ml-1">{children}</Label>
      {hint && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3 w-3 text-white/20 hover:text-white/40 transition-colors" />
            </TooltipTrigger>
            <TooltipContent className="sakura-glass border-white/10 text-[10px] uppercase font-bold tracking-wider">
              {hint}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" icon={Filter} className="sakura-glass border-white/10 hover:border-primary/40 transition-all duration-300">
          Filters
          {(filters.genres.length > 0 || filters.excludedGenres.length > 0 || filters.format.length > 0 || filters.status.length > 0) && (
            <span className="ml-2 flex h-2 w-2 rounded-full bg-primary animate-pulse" />
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md p-0 border-l border-white/10 bg-[hsl(335_24%_8%_/_0.95)] backdrop-blur-xl">
        <div className="flex flex-col h-full">
          <SheetHeader className="p-6 border-b border-white/5">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-2xl font-black uppercase tracking-widest text-white sakura-title">
                Filters
              </SheetTitle>
              <Button variant="ghost" size="sm" onClick={resetFilters} icon={RotateCcw} className="text-[10px] h-8 opacity-50 hover:opacity-100">
                Reset
              </Button>
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1 p-6">
            <div className="space-y-10 pb-10">
              {/* Search */}
              <div className="space-y-1">
                <SectionLabel>Search</SectionLabel>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                  <Input 
                    value={filters.search}
                    onChange={(e) => updateFilters({ search: e.target.value })}
                    placeholder="Search by title..."
                    className="sakura-input pl-10 h-12 border-white/5 focus:border-primary/40"
                  />
                </div>
              </div>

              {/* Adult Toggle */}
              <div className="flex items-center justify-between sakura-glass-light p-4 rounded-2xl border border-white/5">
                <div className="space-y-0.5">
                  <Label className="text-[11px] font-black uppercase tracking-widest text-white/80">Adult Content</Label>
                  <p className="text-[9px] text-white/40 font-bold uppercase tracking-tight">Show 18+ restricted entries</p>
                </div>
                <Switch 
                  checked={filters.isAdult}
                  onCheckedChange={(checked) => updateFilters({ isAdult: checked })}
                />
              </div>

              {/* Sort */}
              <div className="space-y-1">
                <SectionLabel>Sort By</SectionLabel>
                <Select value={filters.sort} onValueChange={(val) => updateFilters({ sort: val })}>
                  <SelectTrigger className="sakura-select-trigger h-12 bg-white/5 border-white/5">
                    <SelectValue placeholder="Sort by..." />
                  </SelectTrigger>
                  <SelectContent className="sakura-select-content">
                    {SORT_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Genres - Tri-state Include/Exclude */}
              <div className="space-y-1">
                <SectionLabel hint="Click once to include, twice to exclude, three times to reset">
                  Genres (Include / Exclude)
                </SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {GENRES.map(genre => {
                    const isIncluded = filters.genres.includes(genre);
                    const isExcluded = filters.excludedGenres.includes(genre);
                    return (
                      <button
                        key={genre}
                        onClick={() => handleGenreToggle(genre)}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all duration-200 border",
                          isIncluded 
                            ? "bg-primary/20 border-primary text-primary shadow-[0_0_15px_rgba(255,46,126,0.3)]"
                            : isExcluded
                            ? "bg-destructive/20 border-destructive text-destructive shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                            : "bg-white/5 border-white/10 text-white/50 hover:bg-white/10 hover:text-white/80"
                        )}
                      >
                        {isIncluded && <Check className="h-3 w-3" />}
                        {isExcluded && <MinusCircle className="h-3 w-3" />}
                        {genre}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Format */}
              <div className="space-y-1">
                <SectionLabel>Format</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {formats.map(format => {
                    const isActive = filters.format.includes(format);
                    return (
                      <button
                        key={format}
                        onClick={() => {
                          updateFilters(prev => ({
                            format: isActive ? prev.format.filter(f => f !== format) : [...prev.format, format]
                          }));
                        }}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border",
                          isActive 
                            ? "bg-white/10 border-white/40 text-white shadow-glow-sm" 
                            : "border-white/10 bg-white/5 text-white/40 hover:bg-white/10"
                        )}
                      >
                        {format.replace('_', ' ')}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status */}
              <div className="space-y-1">
                <SectionLabel>Status</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {MEDIA_STATUSES.map(status => {
                    const isActive = filters.status.includes(status);
                    return (
                      <button
                        key={status}
                        onClick={() => {
                          updateFilters(prev => ({
                            status: isActive ? prev.status.filter(s => s !== status) : [...prev.status, status]
                          }));
                        }}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border",
                          isActive 
                            ? "bg-white/10 border-white/40 text-white shadow-glow-sm" 
                            : "border-white/10 bg-white/5 text-white/40 hover:bg-white/10"
                        )}
                      >
                        {status.replace(/_/g, ' ')}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Season (Anime Only) */}
              {type === "ANIME" && (
                <div className="space-y-1">
                  <SectionLabel>Season</SectionLabel>
                  <div className="flex flex-wrap gap-2">
                    {SEASONS.map(season => {
                      const isActive = filters.season === season;
                      return (
                        <button
                          key={season}
                          onClick={() => updateFilters({ season: isActive ? null : season })}
                          className={cn(
                            "px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border",
                            isActive 
                              ? "bg-white/10 border-white/40 text-white shadow-glow-sm" 
                              : "border-white/10 bg-white/5 text-white/40 hover:bg-white/10"
                          )}
                        >
                          {season}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Score Range */}
              <div className="space-y-5 px-1">
                <div className="flex items-center justify-between">
                  <SectionLabel>Score Range</SectionLabel>
                  <span className="text-[11px] font-black text-primary tracking-tighter">{filters.scoreRange[0]} - {filters.scoreRange[1]}%</span>
                </div>
                <Slider
                  value={filters.scoreRange}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={(val) => updateFilters({ scoreRange: val as [number, number] })}
                  className="py-2"
                />
              </div>

              {/* Year Range */}
              <div className="space-y-5 px-1">
                <div className="flex items-center justify-between">
                  <SectionLabel>Year Range</SectionLabel>
                  <span className="text-[11px] font-black text-primary tracking-tighter">{filters.yearRange[0]} - {filters.yearRange[1]}</span>
                </div>
                <Slider
                  value={filters.yearRange}
                  min={1970}
                  max={new Date().getFullYear() + 2}
                  step={1}
                  onValueChange={(val) => updateFilters({ yearRange: val as [number, number] })}
                  className="py-2"
                />
              </div>

              {/* Country */}
              <div className="space-y-1">
                <SectionLabel>Country of Origin</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {COUNTRIES.map(c => {
                    const isActive = filters.country.includes(c.code);
                    return (
                      <button
                        key={c.code}
                        onClick={() => {
                          updateFilters(prev => ({
                            country: isActive ? prev.country.filter(x => x !== c.code) : [...prev.country, c.code]
                          }));
                        }}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border",
                          isActive 
                            ? "bg-white/10 border-white/40 text-white shadow-glow-sm" 
                            : "border-white/10 bg-white/5 text-white/40 hover:bg-white/10"
                        )}
                      >
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Source */}
              <div className="space-y-1">
                <SectionLabel>Source Material</SectionLabel>
                <div className="flex flex-wrap gap-2">
                  {SOURCES.map(source => {
                    const isActive = filters.source.includes(source);
                    return (
                      <button
                        key={source}
                        onClick={() => {
                          updateFilters(prev => ({
                            source: isActive ? prev.source.filter(s => s !== source) : [...prev.source, source]
                          }));
                        }}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all border",
                          isActive 
                            ? "bg-white/10 border-white/40 text-white shadow-glow-sm" 
                            : "border-white/10 bg-white/5 text-white/40 hover:bg-white/10"
                        )}
                      >
                        {source.replace(/_/g, ' ')}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </ScrollArea>

          <div className="p-6 border-t border-white/5 bg-black/20 backdrop-blur-md">
            <Button 
              fullWidth 
              onClick={() => (document.querySelector('[data-state="open"]') as any)?.click()}
              className="h-12 rounded-2xl shadow-glow font-black uppercase tracking-[0.2em] text-[11px]"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

