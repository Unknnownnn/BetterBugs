"use client";

import { Badge } from "@/components/ui/badge";
import { useState } from "react";

interface BSONElement {
  Key?: string;
  Value?: unknown;
}

interface StateEvent {
  type: string;
  timestamp?: number;
  payload?: unknown;
}

interface StatePanelProps {
  events: StateEvent[];
}

function formatTimestamp(ms?: number): string {
  if (ms == null || Number.isNaN(ms)) return "0ms";
  return `${Math.round(ms)}ms`;
}

// Handle both proper JSON objects and BSON key-value array format
function getPayloadValue(payload: unknown, key: string): unknown {
  if (!payload) return undefined;

  if (typeof payload === "object" && !Array.isArray(payload)) {
    return (payload as Record<string, unknown>)[key];
  }

  if (Array.isArray(payload)) {
    const found = (payload as BSONElement[]).find((el) => el.Key === key);
    return found?.Value;
  }

  return undefined;
}

function formatJson(value: unknown): string {
  if (value === undefined || value === null) return "null";
  try {
    const str = JSON.stringify(value, null, 2);
    return str.length > 2000 ? str.slice(0, 2000) + "..." : str;
  } catch {
    return String(value);
  }
}

function getReasonBadgeVariant(reason?: string): "default" | "secondary" | "outline" | "destructive" | "success" | "warning" {
  switch (reason) {
    case "init":
      return "secondary";
    case "adapter-error":
      return "destructive";
    case "flush":
      return "success";
    case "interval":
      return "outline";
    default:
      return "default";
  }
}

export function StatePanel({ events }: StatePanelProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [filterSource, setFilterSource] = useState<string | null>(null);

  const stateEvents = events.filter((e) => e.type === "state");

  if (stateEvents.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        No state snapshots captured.
      </div>
    );
  }

  const sources = Array.from(
    new Set(stateEvents.map((e) => String(getPayloadValue(e.payload, "source") || "unknown")))
  );

  const filtered = filterSource
    ? stateEvents.filter((e) => String(getPayloadValue(e.payload, "source")) === filterSource)
    : stateEvents;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setFilterSource(null)}
          className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
            filterSource === null
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-secondary text-muted-foreground border-border hover:text-foreground"
          }`}
        >
          all ({stateEvents.length})
        </button>
        {sources.map((source) => {
          const count = stateEvents.filter(
            (e) => String(getPayloadValue(e.payload, "source")) === source
          ).length;
          return (
            <button
              key={source}
              onClick={() => setFilterSource(source)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                filterSource === source
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              {source} ({count})
            </button>
          );
        })}
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="max-h-[500px] overflow-auto">
          <div className="divide-y divide-border">
            {filtered.map((event, i) => {
              const source = String(getPayloadValue(event.payload, "source") || "unknown");
              const reason = getPayloadValue(event.payload, "reason");
              const key = getPayloadValue(event.payload, "key");
              const adapterName = getPayloadValue(event.payload, "adapterName");
              const errorMessage = getPayloadValue(event.payload, "errorMessage");
              const data = getPayloadValue(event.payload, "data");

              const isExpanded = expandedIndex === i;

              return (
                <div
                  key={i}
                  className={`cursor-pointer transition-colors ${
                    isExpanded ? "bg-secondary/50" : "hover:bg-secondary/30"
                  }`}
                >
                  <div
                    className="flex items-center gap-3 px-4 py-3"
                    onClick={() => setExpandedIndex(isExpanded ? null : i)}
                  >
                    <span className="text-[10px] font-mono text-muted-foreground shrink-0 w-14 text-right">
                      {formatTimestamp(event.timestamp)}
                    </span>
                    <Badge variant={getReasonBadgeVariant(reason as string)} className="text-[10px] shrink-0">
                      {String(reason || "state")}
                    </Badge>
                    <span className="text-sm font-medium shrink-0 text-foreground">
                      {source}
                    </span>
                    {!!key && (
                      <span className="text-xs text-muted-foreground font-mono truncate">
                        {String(key)}
                      </span>
                    )}
                    {!!adapterName && (
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {String(adapterName)}
                      </Badge>
                    )}
                    {!!errorMessage && (
                      <span className="text-xs text-destructive truncate">
                        {String(errorMessage)}
                      </span>
                    )}
                    <span className="ml-auto text-xs text-muted-foreground shrink-0">
                      {isExpanded ? "▼" : "▶"}
                    </span>
                  </div>

                  {!!isExpanded && !!data && (
                    <div className="px-4 pb-3 border-t border-border/50 bg-background/50">
                      <pre className="mt-3 text-xs font-mono bg-secondary/50 rounded p-2 overflow-auto max-h-60 whitespace-pre-wrap">
                        {String(formatJson(data))}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}