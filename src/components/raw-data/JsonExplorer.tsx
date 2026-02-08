import { useState, useMemo, useCallback } from "react";
import { ChevronRight, ChevronDown, Copy, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface JsonExplorerProps {
  data: unknown;
}

export function JsonExplorer({ data }: JsonExplorerProps) {
  const [search, setSearch] = useState("");

  return (
    <div className="bg-card rounded-lg border border-border/50 overflow-hidden">
      {/* Search bar */}
      <div className="flex items-center gap-2 p-3 border-b border-border/50 bg-surface-1">
        <Search className="w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search keys or values…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none flex-1"
        />
      </div>

      {/* Tree view */}
      <div className="p-3 max-h-[70vh] overflow-auto font-mono text-sm">
        <JsonNode value={data} path="" depth={0} search={search} defaultExpanded />
      </div>
    </div>
  );
}

interface JsonNodeProps {
  value: unknown;
  path: string;
  depth: number;
  search: string;
  keyName?: string;
  defaultExpanded?: boolean;
}

function JsonNode({
  value,
  path,
  depth,
  search,
  keyName,
  defaultExpanded = false,
}: JsonNodeProps) {
  const [expanded, setExpanded] = useState(defaultExpanded || depth < 1);

  const matchesSearch = useCallback(
    (str: string) => {
      if (!search) return true;
      return str.toLowerCase().includes(search.toLowerCase());
    },
    [search]
  );

  const copyValue = useCallback(() => {
    navigator.clipboard.writeText(JSON.stringify(value, null, 2));
  }, [value]);

  if (value === null) {
    return (
      <span className="text-muted-foreground">
        {keyName !== undefined && (
          <span className="text-primary/80">"{keyName}": </span>
        )}
        <span className="text-status-dropped italic">null</span>
      </span>
    );
  }

  if (typeof value === "boolean") {
    return (
      <span>
        {keyName !== undefined && (
          <span className="text-primary/80">"{keyName}": </span>
        )}
        <span className="text-status-current">{String(value)}</span>
      </span>
    );
  }

  if (typeof value === "number") {
    return (
      <span>
        {keyName !== undefined && (
          <span className="text-primary/80">"{keyName}": </span>
        )}
        <span className="text-score-mid">{value}</span>
      </span>
    );
  }

  if (typeof value === "string") {
    const truncated = value.length > 100 ? value.slice(0, 100) + "…" : value;
    return (
      <span>
        {keyName !== undefined && (
          <span className="text-primary/80">"{keyName}": </span>
        )}
        <span className="text-status-current">"{truncated}"</span>
      </span>
    );
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return (
        <span>
          {keyName !== undefined && (
            <span className="text-primary/80">"{keyName}": </span>
          )}
          <span className="text-muted-foreground">[]</span>
        </span>
      );
    }

    const filteredIndices = search
      ? value
          .map((_, i) => i)
          .filter((i) => {
            const v = value[i];
            if (typeof v === "string") return matchesSearch(v);
            if (typeof v === "object") return matchesSearch(JSON.stringify(v));
            return matchesSearch(String(v));
          })
      : value.map((_, i) => i);

    return (
      <div>
        <div
          className="flex items-center gap-1 cursor-pointer hover:bg-secondary/50 rounded px-1 -ml-1 group"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-3 h-3 text-muted-foreground" />
          )}
          {keyName !== undefined && (
            <span className="text-primary/80">"{keyName}": </span>
          )}
          <span className="text-muted-foreground">
            Array[{value.length}]
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              copyValue();
            }}
            className="opacity-0 group-hover:opacity-100 ml-1"
          >
            <Copy className="w-3 h-3 text-muted-foreground hover:text-foreground" />
          </button>
        </div>
        {expanded && (
          <div className="ml-4 border-l border-border/30 pl-3">
            {filteredIndices.slice(0, 100).map((i) => (
              <div key={i} className="py-0.5">
                <JsonNode
                  value={value[i]}
                  path={`${path}[${i}]`}
                  depth={depth + 1}
                  search={search}
                  keyName={String(i)}
                />
              </div>
            ))}
            {filteredIndices.length > 100 && (
              <div className="text-muted-foreground text-xs py-1">
                … and {filteredIndices.length - 100} more items
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>);

    if (entries.length === 0) {
      return (
        <span>
          {keyName !== undefined && (
            <span className="text-primary/80">"{keyName}": </span>
          )}
          <span className="text-muted-foreground">{"{}"}</span>
        </span>
      );
    }

    const filteredEntries = search
      ? entries.filter(
          ([k, v]) =>
            matchesSearch(k) ||
            (typeof v === "string" && matchesSearch(v)) ||
            (typeof v === "object" && matchesSearch(JSON.stringify(v)))
        )
      : entries;

    return (
      <div>
        <div
          className="flex items-center gap-1 cursor-pointer hover:bg-secondary/50 rounded px-1 -ml-1 group"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? (
            <ChevronDown className="w-3 h-3 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-3 h-3 text-muted-foreground" />
          )}
          {keyName !== undefined && (
            <span className="text-primary/80">"{keyName}": </span>
          )}
          <span className="text-muted-foreground">
            Object {"{"}
            {entries.length}
            {"}"}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              copyValue();
            }}
            className="opacity-0 group-hover:opacity-100 ml-1"
          >
            <Copy className="w-3 h-3 text-muted-foreground hover:text-foreground" />
          </button>
        </div>
        {expanded && (
          <div className="ml-4 border-l border-border/30 pl-3">
            {filteredEntries.slice(0, 200).map(([k, v]) => (
              <div key={k} className="py-0.5">
                <JsonNode
                  value={v}
                  path={`${path}.${k}`}
                  depth={depth + 1}
                  search={search}
                  keyName={k}
                />
              </div>
            ))}
            {filteredEntries.length > 200 && (
              <div className="text-muted-foreground text-xs py-1">
                … and {filteredEntries.length - 200} more keys
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <span>
      {keyName !== undefined && (
        <span className="text-primary/80">"{keyName}": </span>
      )}
      <span className="text-foreground">{String(value)}</span>
    </span>
  );
}
