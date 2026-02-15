import { DrillDownModal } from "@/components/stats/DrillDownModal";
import { PageContent, PageHeader, PageWrapper } from "@/components/layout/PageWrapper";
import { YuraCard, YuraRow, YuraSection } from "@/components/yura";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useData } from "@/context/DataContext";
import type { DisplayMedia } from "@/types/display";
import { safeArray } from "@/utils/safeArray";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3, ChevronDown, Download, RotateCcw } from "lucide-react";
import { useMemo, useState } from "react";

type DrillState = {
  title: string;
  subtitle?: string;
  items: DisplayMedia[];
} | null;

type SortMode = "count" | "score";

const ALL = "all";

const STATUS_LABEL: Record<string, string> = {
  CURRENT: "In Progress",
  PLANNING: "Planned",
  COMPLETED: "Completed",
  DROPPED: "Dropped",
  PAUSED: "Paused",
  REPEATING: "Rewatching",
};

function titleOf(media: DisplayMedia): string {
  return media.title?.english || media.title?.romaji || media.title?.native || "Untitled";
}

function safeDate(media: DisplayMedia): Date {
  return new Date(media.completedAt || media.updatedAt || media.createdAt);
}

function animeMinutes(media: DisplayMedia): number {
  if (media.mediaType !== "ANIME") return 0;
  return Math.max(0, media.progress) * (media.duration || 24);
}

function mangaMinutes(media: DisplayMedia): number {
  if (media.mediaType !== "MANGA") return 0;
  return Math.max(0, media.progress) * 6;
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const m = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[m] : (sorted[m - 1] + sorted[m]) / 2;
}

function mode(values: number[]): number {
  if (values.length === 0) return 0;
  const freq = new Map<number, number>();
  values.forEach((v) => freq.set(v, (freq.get(v) || 0) + 1));
  return Array.from(freq.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 0;
}

function stdDev(values: number[]): number {
  if (values.length <= 1) return 0;
  const m = mean(values);
  const variance = values.reduce((acc, v) => acc + (v - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function csvExport(filename: string, rows: string[][]) {
  const csv = rows
    .map((row) =>
      row
        .map((cell) => {
          const escaped = String(cell).replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(","),
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function sourceOf(media: DisplayMedia): "Original" | "Manga" | "Novel" | "Game" | "Unknown" {
  const tags = safeArray(media.tags).map((t) => t.toLowerCase());
  if (tags.some((t) => t.includes("original"))) return "Original";
  if (tags.some((t) => t.includes("light novel") || t.includes("novel"))) return "Novel";
  if (
    tags.some(
      (t) => t.includes("manga") || t.includes("manhwa") || t.includes("manhua") || t.includes("webtoon"),
    )
  ) {
    return "Manga";
  }
  if (tags.some((t) => t.includes("game") || t.includes("visual novel"))) return "Game";
  return "Unknown";
}

function creatorSignals(media: DisplayMedia): string[] {
  const fromTags = safeArray(media.tags).filter((t) => {
    const label = t.toLowerCase();
    return label.includes("studio") || label.includes("author") || label.includes("mangaka");
  });
  return Array.from(new Set(fromTags));
}

function KpiButton({
  label,
  value,
  hint,
  onClick,
}: {
  label: string;
  value: string | number;
  hint?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl border border-border/80 bg-card px-3 py-2 text-left shadow-sm transition duration-150 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md active:scale-[0.99]"
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold tracking-tight text-foreground">{value}</p>
      {hint ? <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p> : null}
    </button>
  );
}

function DistributionList({
  rows,
  onOpen,
}: {
  rows: Array<{ key: string; label: string; count: number; aux?: number; items: DisplayMedia[] }>;
  onOpen: (label: string, items: DisplayMedia[]) => void;
}) {
  return (
    <div className="space-y-2">
      {rows.map((row) => (
        <button
          key={row.key}
          onClick={() => onOpen(row.label, row.items)}
          className="flex w-full items-center justify-between rounded-lg border border-border/75 bg-card px-3 py-2 text-sm transition duration-150 hover:border-primary/30 hover:bg-muted/35 active:scale-[0.995]"
        >
          <span className="truncate pr-2 text-foreground">{row.label}</span>
          <span className="text-xs text-muted-foreground">
            {row.count}
            {typeof row.aux === "number" ? ` • ${row.aux}` : ""}
          </span>
        </button>
      ))}
    </div>
  );
}

function ProgressiveDistribution({
  rows,
  onOpen,
  initialCount = 5,
}: {
  rows: Array<{ key: string; label: string; count: number; aux?: number; items: DisplayMedia[] }>;
  onOpen: (label: string, items: DisplayMedia[]) => void;
  initialCount?: number;
}) {
  const primaryRows = rows.slice(0, initialCount);
  const secondaryRows = rows.slice(initialCount);

  if (secondaryRows.length === 0) {
    return <DistributionList rows={primaryRows} onOpen={onOpen} />;
  }

  return (
    <div className="space-y-2">
      <DistributionList rows={primaryRows} onOpen={onOpen} />
      <Collapsible>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 gap-1 px-2 text-muted-foreground hover:text-foreground">
            Show full breakdown
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-1">
          <DistributionList rows={secondaryRows} onOpen={onOpen} />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

export default function Stats() {
  const { animeList, mangaList, user } = useData();
  const [drill, setDrill] = useState<DrillState>(null);

  const [typeFilter, setTypeFilter] = useState(ALL);
  const [yearFilter, setYearFilter] = useState(ALL);
  const [genreFilter, setGenreFilter] = useState(ALL);
  const [tagFilter, setTagFilter] = useState(ALL);
  const [tierFilter, setTierFilter] = useState(ALL);
  const [studioFilter, setStudioFilter] = useState(ALL);
  const [formatFilter, setFormatFilter] = useState(ALL);
  const [sortMode, setSortMode] = useState<SortMode>("count");

  const allMedia = useMemo(
    () => [...safeArray<DisplayMedia>(animeList), ...safeArray<DisplayMedia>(mangaList)],
    [animeList, mangaList],
  );

  const filterOptions = useMemo(() => {
    const years = Array.from(new Set(allMedia.map((m) => m.seasonYear || safeDate(m).getFullYear())))
      .filter((y): y is number => Number.isFinite(y))
      .sort((a, b) => b - a);
    const genres = Array.from(new Set(allMedia.flatMap((m) => safeArray(m.genres)))).sort((a, b) => a.localeCompare(b));
    const tags = Array.from(new Set(allMedia.flatMap((m) => safeArray(m.tags)))).sort((a, b) => a.localeCompare(b));
    const tiers = Array.from(
      new Set(
        allMedia
          .map((m) => (m.tierId == null ? "" : String(m.tierId)))
          .filter(Boolean),
      ),
    ).sort((a, b) => a.localeCompare(b));
    const formats = Array.from(new Set(allMedia.map((m) => m.format || "Unknown"))).sort((a, b) => a.localeCompare(b));
    const studios = Array.from(new Set(allMedia.flatMap((m) => creatorSignals(m)))).sort((a, b) => a.localeCompare(b));
    return { years, genres, tags, tiers, formats, studios };
  }, [allMedia]);

  const filtered = useMemo(() => {
    return allMedia.filter((m) => {
      if (typeFilter !== ALL && m.mediaType !== typeFilter) return false;
      if (yearFilter !== ALL && String(m.seasonYear || safeDate(m).getFullYear()) !== yearFilter) return false;
      if (genreFilter !== ALL && !safeArray(m.genres).includes(genreFilter)) return false;
      if (tagFilter !== ALL && !safeArray(m.tags).includes(tagFilter)) return false;
      if (tierFilter !== ALL && String(m.tierId) !== tierFilter) return false;
      if (studioFilter !== ALL && !creatorSignals(m).includes(studioFilter)) return false;
      if (formatFilter !== ALL && (m.format || "Unknown") !== formatFilter) return false;
      return true;
    });
  }, [allMedia, typeFilter, yearFilter, genreFilter, tagFilter, tierFilter, studioFilter, formatFilter]);

  const anime = useMemo(() => filtered.filter((m) => m.mediaType === "ANIME"), [filtered]);
  const manga = useMemo(() => filtered.filter((m) => m.mediaType === "MANGA"), [filtered]);

  const statusGroups = useMemo(() => {
    const map = new Map<string, DisplayMedia[]>();
    filtered.forEach((m) => {
      if (!map.has(m.status)) map.set(m.status, []);
      map.get(m.status)!.push(m);
    });
    return map;
  }, [filtered]);

  const rated = useMemo(() => filtered.filter((m) => m.score > 0), [filtered]);
  const ratedValues = useMemo(() => rated.map((m) => m.score), [rated]);

  const scoreSummary = useMemo(
    () => ({
      mean: Math.round(mean(ratedValues) * 10) / 10,
      median: Math.round(median(ratedValues) * 10) / 10,
      mode: mode(ratedValues),
      std: Math.round(stdDev(ratedValues) * 10) / 10,
    }),
    [ratedValues],
  );

  const scoreHistogram = useMemo(() => {
    const format = user?.scoreFormat || "POINT_10";
    const buckets: { label: string; count: number; items: DisplayMedia[] }[] = [];

    if (format === "POINT_100") {
      for (let i = 1; i <= 100; i++) buckets.push({ label: String(i), count: 0, items: [] });
      rated.forEach((m) => {
        const idx = Math.max(1, Math.min(100, Math.round(m.score))) - 1;
        buckets[idx].count += 1;
        buckets[idx].items.push(m);
      });
      return buckets.filter((b) => b.count > 0);
    }

    if (format === "POINT_5") {
      for (let i = 1; i <= 5; i++) buckets.push({ label: String(i), count: 0, items: [] });
      rated.forEach((m) => {
        const idx = Math.max(1, Math.min(5, Math.round(m.score / 20))) - 1;
        buckets[idx].count += 1;
        buckets[idx].items.push(m);
      });
      return buckets.filter((b) => b.count > 0);
    }

    if (format === "POINT_3") {
      for (let i = 1; i <= 3; i++) buckets.push({ label: String(i), count: 0, items: [] });
      rated.forEach((m) => {
        const idx = Math.max(1, Math.min(3, Math.round(m.score / 33.33))) - 1;
        buckets[idx].count += 1;
        buckets[idx].items.push(m);
      });
      return buckets.filter((b) => b.count > 0);
    }

    for (let i = 1; i <= 10; i++) buckets.push({ label: String(i), count: 0, items: [] });
    rated.forEach((m) => {
      const idx = Math.max(1, Math.min(10, Math.round(m.score / 10))) - 1;
      buckets[idx].count += 1;
      buckets[idx].items.push(m);
    });
    return buckets.filter((b) => b.count > 0);
  }, [rated, user?.scoreFormat]);

  const episodesWatched = useMemo(() => anime.reduce((sum, m) => sum + Math.max(0, m.progress), 0), [anime]);
  const chaptersRead = useMemo(() => manga.reduce((sum, m) => sum + Math.max(0, m.progress), 0), [manga]);

  const episodesRemaining = useMemo(
    () => anime.reduce((sum, m) => sum + Math.max(0, (m.episodes || 0) - m.progress), 0),
    [anime],
  );
  const chaptersRemaining = useMemo(
    () => manga.reduce((sum, m) => sum + Math.max(0, (m.chapters || 0) - m.progress), 0),
    [manga],
  );

  const averageLength = useMemo(() => {
    const lengths = filtered
      .map((m) => (m.mediaType === "ANIME" ? m.episodes || 0 : m.chapters || 0))
      .filter((len) => len > 0);
    return lengths.length ? Math.round((lengths.reduce((a, b) => a + b, 0) / lengths.length) * 10) / 10 : 0;
  }, [filtered]);

  const longest = useMemo(
    () =>
      filtered
        .map((m) => ({ media: m, len: m.mediaType === "ANIME" ? m.episodes || 0 : m.chapters || 0 }))
        .filter((x) => x.len > 0)
        .sort((a, b) => b.len - a.len)[0],
    [filtered],
  );

  const shortest = useMemo(
    () =>
      filtered
        .map((m) => ({ media: m, len: m.mediaType === "ANIME" ? m.episodes || 0 : m.chapters || 0 }))
        .filter((x) => x.len > 0)
        .sort((a, b) => a.len - b.len)[0],
    [filtered],
  );

  const totalMinutes = useMemo(() => filtered.reduce((sum, m) => sum + animeMinutes(m) + mangaMinutes(m), 0), [filtered]);
  const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
  const daysWatched = Math.round((totalMinutes / 1440) * 10) / 10;

  const yearlyTime = useMemo(() => {
    const map = new Map<number, { minutes: number; items: DisplayMedia[] }>();
    filtered.forEach((m) => {
      const year = safeDate(m).getFullYear();
      if (!map.has(year)) map.set(year, { minutes: 0, items: [] });
      const bucket = map.get(year)!;
      bucket.minutes += animeMinutes(m) + mangaMinutes(m);
      bucket.items.push(m);
    });
    return Array.from(map.entries())
      .map(([year, bucket]) => ({
        year,
        hours: Math.round((bucket.minutes / 60) * 10) / 10,
        items: bucket.items,
      }))
      .sort((a, b) => a.year - b.year);
  }, [filtered]);

  const monthlyTime = useMemo(() => {
    const map = new Map<string, { minutes: number; items: DisplayMedia[] }>();
    filtered.forEach((m) => {
      const date = safeDate(m);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!map.has(month)) map.set(month, { minutes: 0, items: [] });
      const bucket = map.get(month)!;
      bucket.minutes += animeMinutes(m) + mangaMinutes(m);
      bucket.items.push(m);
    });
    return Array.from(map.entries())
      .map(([month, bucket]) => ({
        month,
        hours: Math.round((bucket.minutes / 60) * 10) / 10,
        items: bucket.items,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12);
  }, [filtered]);

  const weekdayTime = useMemo(() => {
    const labels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const rows = labels.map((day, index) => ({ day, index, minutes: 0, items: [] as DisplayMedia[] }));

    filtered.forEach((m) => {
      const index = safeDate(m).getDay();
      rows[index].minutes += animeMinutes(m) + mangaMinutes(m);
      rows[index].items.push(m);
    });

    return rows.map((row) => ({
      day: row.day,
      hours: Math.round((row.minutes / 60) * 10) / 10,
      items: row.items,
    }));
  }, [filtered]);

  const statusRows = useMemo(
    () =>
      Array.from(statusGroups.entries())
        .map(([status, items]) => ({
          key: status,
          label: STATUS_LABEL[status] || status,
          count: items.length,
          pct: filtered.length ? Math.round((items.length / filtered.length) * 100) : 0,
          items,
        }))
        .sort((a, b) => b.count - a.count),
    [statusGroups, filtered.length],
  );

  const formatRows = useMemo(() => {
    const map = new Map<string, DisplayMedia[]>();
    filtered.forEach((m) => {
      const key = m.format || "Unknown";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    });
    return Array.from(map.entries())
      .map(([format, items]) => ({ key: format, label: format, count: items.length, items }))
      .sort((a, b) => b.count - a.count);
  }, [filtered]);

  const lengthRows = useMemo(() => {
    const buckets = [
      { key: "one_cour", label: "1 Cour / Short", items: [] as DisplayMedia[] },
      { key: "two_cour", label: "2 Cour / Mid", items: [] as DisplayMedia[] },
      { key: "long_runner", label: "Long Runners", items: [] as DisplayMedia[] },
      { key: "one_shot", label: "One Shots", items: [] as DisplayMedia[] },
    ];

    filtered.forEach((m) => {
      if (m.mediaType === "ANIME") {
        const episodes = m.episodes || 0;
        if (episodes > 0 && episodes <= 13) buckets[0].items.push(m);
        else if (episodes <= 26) buckets[1].items.push(m);
        else buckets[2].items.push(m);
      } else {
        const chapters = m.chapters || 0;
        if (chapters > 0 && chapters <= 10) buckets[3].items.push(m);
        else if (chapters <= 50) buckets[0].items.push(m);
        else if (chapters <= 200) buckets[1].items.push(m);
        else buckets[2].items.push(m);
      }
    });

    return buckets.map((bucket) => ({ ...bucket, count: bucket.items.length }));
  }, [filtered]);

  const seasonRows = useMemo(() => {
    const map = new Map<string, DisplayMedia[]>();
    filtered.forEach((m) => {
      const season = m.season || "Unknown";
      const year = m.seasonYear || safeDate(m).getFullYear();
      const key = `${year} ${season}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    });
    return Array.from(map.entries())
      .map(([label, items]) => ({ key: label, label, count: items.length, items }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 16);
  }, [filtered]);

  const genreRows = useMemo(() => {
    const map = new Map<string, { items: DisplayMedia[]; scoreSum: number; scored: number }>();
    filtered.forEach((m) => {
      safeArray(m.genres).forEach((genre) => {
        if (!map.has(genre)) map.set(genre, { items: [], scoreSum: 0, scored: 0 });
        const bucket = map.get(genre)!;
        bucket.items.push(m);
        if (m.score > 0) {
          bucket.scoreSum += m.score;
          bucket.scored += 1;
        }
      });
    });

    return Array.from(map.entries())
      .map(([genre, bucket]) => ({
        key: genre,
        label: genre,
        count: bucket.items.length,
        aux: bucket.scored > 0 ? Math.round((bucket.scoreSum / bucket.scored) * 10) / 10 : 0,
        items: bucket.items,
      }))
      .sort((a, b) => (sortMode === "count" ? b.count - a.count : (b.aux || 0) - (a.aux || 0)));
  }, [filtered, sortMode]);

  const tagRows = useMemo(() => {
    const map = new Map<string, { items: DisplayMedia[]; scoreSum: number; scored: number }>();
    filtered.forEach((m) => {
      safeArray(m.tags).forEach((tag) => {
        if (!map.has(tag)) map.set(tag, { items: [], scoreSum: 0, scored: 0 });
        const bucket = map.get(tag)!;
        bucket.items.push(m);
        if (m.score > 0) {
          bucket.scoreSum += m.score;
          bucket.scored += 1;
        }
      });
    });

    return Array.from(map.entries())
      .map(([tag, bucket]) => ({
        key: tag,
        label: tag,
        count: bucket.items.length,
        aux: bucket.scored > 0 ? Math.round((bucket.scoreSum / bucket.scored) * 10) / 10 : 0,
        items: bucket.items,
      }))
      .sort((a, b) => (sortMode === "count" ? b.count - a.count : (b.aux || 0) - (a.aux || 0)))
      .slice(0, 24);
  }, [filtered, sortMode]);

  const studioRows = useMemo(() => {
    const map = new Map<string, { items: DisplayMedia[]; scoreSum: number; scored: number }>();
    filtered.forEach((m) => {
      creatorSignals(m).forEach((studio) => {
        if (!map.has(studio)) map.set(studio, { items: [], scoreSum: 0, scored: 0 });
        const bucket = map.get(studio)!;
        bucket.items.push(m);
        if (m.score > 0) {
          bucket.scoreSum += m.score;
          bucket.scored += 1;
        }
      });
    });

    return Array.from(map.entries())
      .map(([studio, bucket]) => ({
        key: studio,
        label: studio,
        count: bucket.items.length,
        aux: bucket.scored > 0 ? Math.round((bucket.scoreSum / bucket.scored) * 10) / 10 : 0,
        items: bucket.items,
      }))
      .sort((a, b) => (sortMode === "count" ? b.count - a.count : (b.aux || 0) - (a.aux || 0)))
      .slice(0, 16);
  }, [filtered, sortMode]);

  const sourceRows = useMemo(() => {
    const map = new Map<string, DisplayMedia[]>();
    filtered.forEach((m) => {
      const key = sourceOf(m);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    });

    return Array.from(map.entries())
      .map(([source, items]) => ({
        key: source,
        label: source,
        count: items.length,
        aux: filtered.length ? Math.round((items.length / filtered.length) * 100) : 0,
        items,
      }))
      .sort((a, b) => b.count - a.count);
  }, [filtered]);

  const countryRows = useMemo(() => {
    const map = new Map<string, DisplayMedia[]>();
    filtered.forEach((m) => {
      let key = "Japan";
      if (m.mediaType === "MANGA") {
        key = m.originType === "manhwa" ? "Korea" : m.originType === "manhua" ? "China" : "Japan";
      }
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    });

    return Array.from(map.entries())
      .map(([country, items]) => ({
        key: country,
        label: country,
        count: items.length,
        aux: filtered.length ? Math.round((items.length / filtered.length) * 100) : 0,
        items,
      }))
      .sort((a, b) => b.count - a.count);
  }, [filtered]);

  const tierRows = useMemo(() => {
    const map = new Map<string, DisplayMedia[]>();
    filtered.forEach((m) => {
      const key = m.tierId == null ? "Unassigned" : String(m.tierId);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    });

    return Array.from(map.entries())
      .map(([tier, items]) => ({
        key: tier,
        label: tier,
        count: items.length,
        aux: filtered.length ? Math.round((items.length / filtered.length) * 100) : 0,
        items,
      }))
      .sort((a, b) => b.count - a.count);
  }, [filtered]);

  const ratingTrend = useMemo(() => {
    const map = new Map<string, { scores: number[]; items: DisplayMedia[] }>();
    rated.forEach((m) => {
      const date = safeDate(m);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      if (!map.has(key)) map.set(key, { scores: [], items: [] });
      const row = map.get(key)!;
      row.scores.push(m.score);
      row.items.push(m);
    });

    return Array.from(map.entries())
      .map(([month, row]) => ({
        month,
        avg: Math.round(mean(row.scores) * 10) / 10,
        items: row.items,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12);
  }, [rated]);

  const comparisons = useMemo(() => {
    const old = filtered.filter((m) => (m.seasonYear || safeDate(m).getFullYear()) < 2015);
    const newer = filtered.filter((m) => (m.seasonYear || safeDate(m).getFullYear()) >= 2015);
    const high = filtered.filter((m) => m.score >= 80);
    const low = filtered.filter((m) => m.score > 0 && m.score <= 60);

    const avgScore = (items: DisplayMedia[]) => {
      const values = items.filter((m) => m.score > 0).map((m) => m.score);
      return Math.round(mean(values) * 10) / 10;
    };

    const completionRate = (items: DisplayMedia[]) => {
      const started = items.filter((m) => ["CURRENT", "COMPLETED", "PAUSED", "DROPPED"].includes(m.status));
      const completed = items.filter((m) => m.status === "COMPLETED");
      return started.length ? Math.round((completed.length / started.length) * 100) : 0;
    };

    return {
      animeVsManga: {
        left: { label: "Anime", count: anime.length, mean: avgScore(anime), completion: completionRate(anime), items: anime },
        right: {
          label: "Manga",
          count: manga.length,
          mean: avgScore(manga),
          completion: completionRate(manga),
          items: manga,
        },
      },
      oldVsNew: {
        left: { label: "< 2015", count: old.length, mean: avgScore(old), items: old },
        right: { label: ">= 2015", count: newer.length, mean: avgScore(newer), items: newer },
      },
      highVsLow: {
        left: { label: "High (80+)", count: high.length, items: high },
        right: { label: "Low (<=60)", count: low.length, items: low },
      },
    };
  }, [anime, filtered, manga]);

  const completionRate = useMemo(() => {
    const started = filtered.filter((m) => ["CURRENT", "COMPLETED", "PAUSED", "DROPPED"].includes(m.status));
    const completed = filtered.filter((m) => m.status === "COMPLETED");
    return started.length ? Math.round((completed.length / started.length) * 100) : 0;
  }, [filtered]);

  const dropRate = useMemo(() => {
    const started = filtered.filter((m) => ["CURRENT", "COMPLETED", "PAUSED", "DROPPED"].includes(m.status));
    const dropped = filtered.filter((m) => m.status === "DROPPED");
    return started.length ? Math.round((dropped.length / started.length) * 100) : 0;
  }, [filtered]);

  const avgProgress = filtered.length
    ? Math.round((filtered.reduce((sum, m) => sum + m.progress, 0) / filtered.length) * 10) / 10
    : 0;

  const vaultBand = useMemo(() => {
    if (filtered.length < 50) {
      return {
        label: "Growth Mode",
        detail: "Build your base. Focus on completion and consistency.",
      };
    }
    if (filtered.length <= 300) {
      return {
        label: "Pattern Mode",
        detail: "You have enough volume to track preference and trend shifts.",
      };
    }
    return {
      label: "Mastery Mode",
      detail: "Large vault detected. Compare cohorts and optimize your quality bar.",
    };
  }, [filtered.length]);

  const uniqueStudios = studioRows.length;

  const yearDelta = useMemo(() => {
    const years = Array.from(
      new Set(filtered.map((m) => m.seasonYear || safeDate(m).getFullYear())),
    )
      .filter((year): year is number => Number.isFinite(year))
      .sort((a, b) => b - a);

    const latestYear = years[0];
    const previousYear = years[1];

    if (!latestYear || !previousYear) {
      return { yearLabel: "N/A", daysDiff: 0, meanDiff: 0 };
    }

    const forYear = (year: number) =>
      filtered.filter((m) => (m.seasonYear || safeDate(m).getFullYear()) === year);

    const currentSet = forYear(latestYear);
    const previousSet = forYear(previousYear);

    const daysFor = (items: DisplayMedia[]) =>
      Math.round(
        (items.reduce((sum, item) => sum + animeMinutes(item) + mangaMinutes(item), 0) / 1440) * 10,
      ) / 10;

    const meanFor = (items: DisplayMedia[]) => {
      const scores = items.filter((m) => m.score > 0).map((m) => m.score);
      return Math.round(mean(scores) * 10) / 10;
    };

    return {
      yearLabel: `${latestYear} vs ${previousYear}`,
      daysDiff: Math.round((daysFor(currentSet) - daysFor(previousSet)) * 10) / 10,
      meanDiff: Math.round((meanFor(currentSet) - meanFor(previousSet)) * 10) / 10,
    };
  }, [filtered]);

  const openDrill = (title: string, items: DisplayMedia[], subtitle?: string) => {
    setDrill({ title, subtitle, items });
  };

  const kpiRows = [
    {
      label: "Total Entries",
      value: filtered.length,
      hint: filtered.length < 50 ? "Vault building stage" : filtered.length <= 300 ? "Pattern-ready volume" : "Master-scale vault",
      onClick: () => openDrill("All filtered entries", filtered),
    },
    {
      label: "Completed",
      value: statusGroups.get("COMPLETED")?.length || 0,
      onClick: () => openDrill("Completed", statusGroups.get("COMPLETED") || []),
    },
    {
      label: "In Progress",
      value: statusGroups.get("CURRENT")?.length || 0,
      onClick: () => openDrill("In progress", statusGroups.get("CURRENT") || []),
    },
    {
      label: "Planned",
      value: statusGroups.get("PLANNING")?.length || 0,
      onClick: () => openDrill("Planned", statusGroups.get("PLANNING") || []),
    },
    {
      label: "Dropped",
      value: statusGroups.get("DROPPED")?.length || 0,
      onClick: () => openDrill("Dropped", statusGroups.get("DROPPED") || []),
    },
    {
      label: "Mean Score",
      value: scoreSummary.mean || 0,
      hint: yearDelta.meanDiff === 0 ? "Stable vs prior year" : `${yearDelta.meanDiff > 0 ? "+" : ""}${yearDelta.meanDiff} vs prior year`,
      onClick: () => openDrill("Rated items", rated),
    },
    {
      label: "Total Episodes",
      value: episodesWatched,
      onClick: () => openDrill("Episode progress", anime.filter((m) => m.progress > 0)),
    },
    {
      label: "Total Chapters",
      value: chaptersRead,
      onClick: () => openDrill("Chapter progress", manga.filter((m) => m.progress > 0)),
    },
    {
      label: "Days Watched",
      value: daysWatched,
      hint: yearDelta.daysDiff === 0 ? "Flat year-over-year" : `${yearDelta.daysDiff > 0 ? "+" : ""}${yearDelta.daysDiff} YoY`,
      onClick: () => openDrill("Time contributors", filtered),
    },
    {
      label: "Unique Studios",
      value: uniqueStudios,
      hint: "Studio/author signal coverage",
      onClick: () => openDrill("Studio/author coverage", filtered.filter((m) => creatorSignals(m).length > 0)),
    },
  ];

  return (
    <PageWrapper>
      <PageHeader
        title="Stats"
        subtitle="Fast, drillable, precise vault analytics"
        icon={BarChart3}
        action={
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              const rows = [
                ["title", "type", "status", "score", "progress", "format", "tier", "year"],
                ...filtered.map((m) => [
                  titleOf(m),
                  m.mediaType,
                  m.status,
                  String(m.score),
                  String(m.progress),
                  m.format || "Unknown",
                  m.tierId == null ? "" : String(m.tierId),
                  String(m.seasonYear || safeDate(m).getFullYear()),
                ]),
              ];
              csvExport("yura-stats-export.csv", rows);
            }}
          >
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        }
      />

      <PageContent className="space-y-5">
        <YuraSection
          title="At A Glance"
          description="Summary first, then trends, then deep breakdowns."
          contentClassName="space-y-3"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="border border-border/70 bg-muted/60 text-foreground">
              {vaultBand.label}
            </Badge>
            <Badge variant="outline" className="border-border/80 text-muted-foreground">
              {yearDelta.yearLabel}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">{vaultBand.detail}</p>
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            <YuraRow compact className="border-border/75 bg-card shadow-sm">
              <button className="w-full text-left" onClick={() => openDrill("Time contributors", filtered)}>
                <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Days Watched Momentum</p>
                <p className="text-sm font-semibold text-foreground">
                  {yearDelta.daysDiff > 0 ? "+" : ""}
                  {yearDelta.daysDiff} days vs prior year
                </p>
              </button>
            </YuraRow>
            <YuraRow compact className="border-border/75 bg-card shadow-sm">
              <button className="w-full text-left" onClick={() => openDrill("Rated items", rated)}>
                <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Scoring Direction</p>
                <p className="text-sm font-semibold text-foreground">
                  {yearDelta.meanDiff > 0 ? "+" : ""}
                  {yearDelta.meanDiff} mean score vs prior year
                </p>
              </button>
            </YuraRow>
            <YuraRow compact className="border-border/75 bg-card shadow-sm">
              <button className="w-full text-left" onClick={() => openDrill("Studio/author coverage", filtered.filter((m) => creatorSignals(m).length > 0))}>
                <p className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground">Collection Breadth</p>
                <p className="text-sm font-semibold text-foreground">{uniqueStudios} unique studio/author signals</p>
              </button>
            </YuraRow>
          </div>
        </YuraSection>

        <YuraSection
          title="Global Filters"
          description="Type, year, genre, tag, tier, studio signal, and format."
          action={
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => {
                setTypeFilter(ALL);
                setYearFilter(ALL);
                setGenreFilter(ALL);
                setTagFilter(ALL);
                setTierFilter(ALL);
                setStudioFilter(ALL);
                setFormatFilter(ALL);
              }}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset
            </Button>
          }
        >
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-7">
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All Types</SelectItem>
                <SelectItem value="ANIME">Anime</SelectItem>
                <SelectItem value="MANGA">Manga</SelectItem>
              </SelectContent>
            </Select>

            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All Years</SelectItem>
                {filterOptions.years.map((year) => (
                  <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={genreFilter} onValueChange={setGenreFilter}>
              <SelectTrigger><SelectValue placeholder="Genre" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All Genres</SelectItem>
                {filterOptions.genres.map((genre) => (
                  <SelectItem key={genre} value={genre}>{genre}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={tagFilter} onValueChange={setTagFilter}>
              <SelectTrigger><SelectValue placeholder="Tag" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All Tags</SelectItem>
                {filterOptions.tags.map((tag) => (
                  <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={tierFilter} onValueChange={setTierFilter}>
              <SelectTrigger><SelectValue placeholder="Tier" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All Tiers</SelectItem>
                {filterOptions.tiers.map((tier) => (
                  <SelectItem key={tier} value={tier}>{tier}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={studioFilter} onValueChange={setStudioFilter}>
              <SelectTrigger><SelectValue placeholder="Studio" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All Studio Signals</SelectItem>
                {filterOptions.studios.map((studio) => (
                  <SelectItem key={studio} value={studio}>{studio}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={formatFilter} onValueChange={setFormatFilter}>
              <SelectTrigger><SelectValue placeholder="Format" /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL}>All Formats</SelectItem>
                {filterOptions.formats.map((format) => (
                  <SelectItem key={format} value={format}>{format}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </YuraSection>

        <YuraSection title="Header KPIs" description="Compact metric strip. Every tile opens its source items." contentClassName="pt-2">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-10">
            {kpiRows.map((kpi) => (
              <KpiButton key={kpi.label} label={kpi.label} value={kpi.value} hint={kpi.hint} onClick={kpi.onClick} />
            ))}
          </div>
        </YuraSection>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          <KpiButton
            label="Completion Rate"
            value={`${completionRate}%`}
            onClick={() =>
              openDrill(
                "Completion denominator",
                filtered.filter((m) => ["CURRENT", "COMPLETED", "PAUSED", "DROPPED"].includes(m.status)),
              )
            }
          />
          <KpiButton
            label="Drop Rate"
            value={`${dropRate}%`}
            onClick={() => openDrill("Dropped titles", statusGroups.get("DROPPED") || [])}
          />
          <KpiButton
            label="Avg Progress / Title"
            value={avgProgress}
            onClick={() => openDrill("Progress contributors", filtered.filter((m) => m.progress > 0))}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <YuraSection title="Score Distribution" description="Histogram + mean, median, mode, and standard deviation.">
            <div className="h-60 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreHistogram}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                  <YAxis allowDecimals={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 10,
                      border: "1px solid hsl(var(--border))",
                      background: "hsl(var(--card))",
                    }}
                    formatter={(value: number) => [`${value} titles`, "Count"]}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]} onClick={(_, index) => openDrill(`Score ${scoreHistogram[index]?.label}`, scoreHistogram[index]?.items || [])}>
                    {scoreHistogram.map((_, index) => (
                      <Cell key={index} fill={`hsl(var(--primary) / ${0.25 + (index % 8) * 0.08})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-3 md:grid-cols-4">
              <KpiButton label="Mean" value={scoreSummary.mean || 0} onClick={() => openDrill("Rated items", rated)} />
              <KpiButton label="Median" value={scoreSummary.median || 0} onClick={() => openDrill("Rated items", rated)} />
              <KpiButton
                label="Mode"
                value={scoreSummary.mode || 0}
                onClick={() => openDrill("Mode titles", rated.filter((m) => Math.round(m.score) === scoreSummary.mode))}
              />
              <KpiButton label="Std Dev" value={scoreSummary.std || 0} onClick={() => openDrill("Rated items", rated)} />
            </div>
          </YuraSection>

          <YuraSection title="Episodes / Chapters" description="Watched, remaining, average, and range.">
            <div className="grid grid-cols-2 gap-2">
              <KpiButton
                label="Watched Episodes"
                value={episodesWatched}
                onClick={() => openDrill("Anime progress", anime.filter((m) => m.progress > 0))}
              />
              <KpiButton
                label="Read Chapters"
                value={chaptersRead}
                onClick={() => openDrill("Manga progress", manga.filter((m) => m.progress > 0))}
              />
              <KpiButton
                label="Episodes Remaining"
                value={episodesRemaining}
                onClick={() => openDrill("Anime with remaining", anime.filter((m) => (m.episodes || 0) > m.progress))}
              />
              <KpiButton
                label="Chapters Remaining"
                value={chaptersRemaining}
                onClick={() => openDrill("Manga with remaining", manga.filter((m) => (m.chapters || 0) > m.progress))}
              />
              <KpiButton label="Average Length" value={averageLength} onClick={() => openDrill("Entries with known length", filtered.filter((m) => (m.episodes || m.chapters || 0) > 0))} />
              <KpiButton
                label="Longest"
                value={longest?.len || 0}
                hint={longest ? titleOf(longest.media) : "N/A"}
                onClick={() => openDrill("Longest entry", longest ? [longest.media] : [])}
              />
              <KpiButton
                label="Shortest"
                value={shortest?.len || 0}
                hint={shortest ? titleOf(shortest.media) : "N/A"}
                onClick={() => openDrill("Shortest entry", shortest ? [shortest.media] : [])}
              />
            </div>
          </YuraSection>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <YuraSection title="Time Watched" description="Total hours with year, month, and weekday breakdowns.">
            <div className="grid grid-cols-2 gap-2 pb-3">
              <KpiButton label="Total Hours" value={totalHours} onClick={() => openDrill("Time contributors", filtered)} />
              <KpiButton label="Total Days" value={daysWatched} onClick={() => openDrill("Time contributors", filtered)} />
            </div>

            <div className="h-44 w-full pb-3">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 10, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                    formatter={(value: number) => [`${value}h`, "Hours"]}
                  />
                  <Line
                    dataKey="hours"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2.2}
                    dot={{ r: 3 }}
                    onClick={(_, index) => openDrill(`Month ${monthlyTime[index]?.month}`, monthlyTime[index]?.items || [])}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              <DistributionList
                rows={yearlyTime.slice(-6).map((row) => ({ key: String(row.year), label: String(row.year), count: row.hours, items: row.items }))}
                onOpen={(label, items) => openDrill(`Year ${label}`, items)}
              />
              <DistributionList
                rows={monthlyTime.slice(-6).map((row) => ({ key: row.month, label: row.month, count: row.hours, items: row.items }))}
                onOpen={(label, items) => openDrill(`Month ${label}`, items)}
              />
              <DistributionList
                rows={weekdayTime.map((row) => ({ key: row.day, label: row.day, count: row.hours, items: row.items }))}
                onOpen={(label, items) => openDrill(`${label} contributors`, items)}
              />
            </div>
          </YuraSection>

          <YuraSection title="Status Breakdown" description="Absolute counts with percentages and chart traceability.">
            <div className="h-52 w-full pb-3">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusRows.map((row) => ({ ...row, value: row.count }))}
                    dataKey="value"
                    nameKey="label"
                    outerRadius={84}
                    onClick={(_, index) => openDrill(statusRows[index]?.label || "Status", statusRows[index]?.items || [])}
                  >
                    {statusRows.map((_, index) => (
                      <Cell key={index} fill={`hsl(var(--primary) / ${0.2 + index * 0.11})`} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ borderRadius: 10, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                    formatter={(value: number) => [`${value} items`, "Count"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <DistributionList
              rows={statusRows.map((row) => ({
                key: row.key,
                label: row.label,
                count: row.count,
                aux: row.pct,
                items: row.items,
              }))}
              onOpen={(label, items) => openDrill(label, items)}
            />
          </YuraSection>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <YuraSection title="Formats" description="TV, Movie, ONA, OVA, Manga, Novel and more.">
            <ProgressiveDistribution rows={formatRows} onOpen={(label, items) => openDrill(`Format: ${label}`, items)} />
          </YuraSection>

          <YuraSection title="Length Buckets" description="1 cour, 2 cour, long runners, one shots.">
            <ProgressiveDistribution
              rows={lengthRows.map((row) => ({ key: row.key, label: row.label, count: row.count, items: row.items }))}
              onOpen={(label, items) => openDrill(`Length: ${label}`, items)}
            />
          </YuraSection>

          <YuraSection title="Season / Year" description="Top seasonal concentration windows.">
            <ProgressiveDistribution rows={seasonRows} onOpen={(label, items) => openDrill(`Season-Year: ${label}`, items)} />
          </YuraSection>
        </div>

        <YuraSection
          title="Genres, Tags, Studios"
          description="Sortable by count or weighted average score."
          action={
            <Select value={sortMode} onValueChange={(value) => setSortMode(value as SortMode)}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="count">Sort by Count</SelectItem>
                <SelectItem value="score">Sort by Avg Score</SelectItem>
              </SelectContent>
            </Select>
          }
        >
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <YuraCard className="rounded-xl border-border/70 p-3 shadow-sm">
              <p className="pb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Genres</p>
              <ProgressiveDistribution rows={genreRows} onOpen={(label, items) => openDrill(`Genre: ${label}`, items)} />
            </YuraCard>

            <YuraCard className="rounded-xl border-border/70 p-3 shadow-sm">
              <p className="pb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Tags</p>
              <ProgressiveDistribution rows={tagRows} onOpen={(label, items) => openDrill(`Tag: ${label}`, items)} />
            </YuraCard>

            <YuraCard className="rounded-xl border-border/70 p-3 shadow-sm">
              <p className="pb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Studios / Authors</p>
              {studioRows.length === 0 ? (
                <p className="text-sm text-muted-foreground">No studio or author signal tags available for current filter.</p>
              ) : (
                <ProgressiveDistribution
                  rows={studioRows}
                  onOpen={(label, items) => openDrill(`Studio/Author: ${label}`, items)}
                />
              )}
            </YuraCard>
          </div>
        </YuraSection>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <YuraSection title="Source Material" description="Original, manga, novel, game heuristics.">
            <ProgressiveDistribution rows={sourceRows} onOpen={(label, items) => openDrill(`Source: ${label}`, items)} />
          </YuraSection>

          <YuraSection title="Country / Origin" description="Japan, Korea, China split.">
            <ProgressiveDistribution rows={countryRows} onOpen={(label, items) => openDrill(`Origin: ${label}`, items)} />
          </YuraSection>

          <YuraSection title="Tier Spread" description="Tier distribution with absolute and percent context.">
            <ProgressiveDistribution rows={tierRows} onOpen={(label, items) => openDrill(`Tier: ${label}`, items)} />
          </YuraSection>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <YuraSection title="Recent Rate Trend" description="Average rating by month for recent activity.">
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ratingTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 10, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }}
                    formatter={(value: number) => [`${value}`, "Avg score"]}
                  />
                  <Line
                    dataKey="avg"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2.2}
                    dot={{ r: 3 }}
                    onClick={(_, index) => openDrill(`Trend ${ratingTrend[index]?.month}`, ratingTrend[index]?.items || [])}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </YuraSection>

          <YuraSection title="Comparison Mode" description="Anime vs manga, old vs new, and high vs low cohorts.">
            <div className="space-y-2">
              <YuraRow compact className="border-border/75 bg-card shadow-sm">
                <button className="text-left" onClick={() => openDrill("Anime cohort", comparisons.animeVsManga.left.items)}>
                  <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{comparisons.animeVsManga.left.label}</p>
                  <p className="text-sm font-semibold text-foreground">
                    {comparisons.animeVsManga.left.count} items • {comparisons.animeVsManga.left.mean} mean • {comparisons.animeVsManga.left.completion}% complete
                  </p>
                </button>
              </YuraRow>

              <YuraRow compact className="border-border/75 bg-card shadow-sm">
                <button className="text-left" onClick={() => openDrill("Manga cohort", comparisons.animeVsManga.right.items)}>
                  <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{comparisons.animeVsManga.right.label}</p>
                  <p className="text-sm font-semibold text-foreground">
                    {comparisons.animeVsManga.right.count} items • {comparisons.animeVsManga.right.mean} mean • {comparisons.animeVsManga.right.completion}% complete
                  </p>
                </button>
              </YuraRow>

              <YuraRow compact className="border-border/75 bg-card shadow-sm">
                <button className="text-left" onClick={() => openDrill("Older cohort", comparisons.oldVsNew.left.items)}>
                  <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{comparisons.oldVsNew.left.label}</p>
                  <p className="text-sm font-semibold text-foreground">
                    {comparisons.oldVsNew.left.count} items • {comparisons.oldVsNew.left.mean} mean
                  </p>
                </button>
              </YuraRow>

              <YuraRow compact className="border-border/75 bg-card shadow-sm">
                <button className="text-left" onClick={() => openDrill("Newer cohort", comparisons.oldVsNew.right.items)}>
                  <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{comparisons.oldVsNew.right.label}</p>
                  <p className="text-sm font-semibold text-foreground">
                    {comparisons.oldVsNew.right.count} items • {comparisons.oldVsNew.right.mean} mean
                  </p>
                </button>
              </YuraRow>

              <YuraRow compact className="border-border/75 bg-card shadow-sm">
                <button className="text-left" onClick={() => openDrill("High score cohort", comparisons.highVsLow.left.items)}>
                  <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{comparisons.highVsLow.left.label}</p>
                  <p className="text-sm font-semibold text-foreground">{comparisons.highVsLow.left.count} items</p>
                </button>
              </YuraRow>

              <YuraRow compact className="border-border/75 bg-card shadow-sm">
                <button className="text-left" onClick={() => openDrill("Low score cohort", comparisons.highVsLow.right.items)}>
                  <p className="text-xs uppercase tracking-[0.12em] text-muted-foreground">{comparisons.highVsLow.right.label}</p>
                  <p className="text-sm font-semibold text-foreground">{comparisons.highVsLow.right.count} items</p>
                </button>
              </YuraRow>
            </div>
          </YuraSection>
        </div>
      </PageContent>

      {drill ? (
        <DrillDownModal
          title={drill.title}
          subtitle={drill.subtitle}
          items={drill.items}
          onClose={() => setDrill(null)}
        />
      ) : null}
    </PageWrapper>
  );
}
