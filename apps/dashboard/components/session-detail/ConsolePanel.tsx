"use client";

import { Badge } from "@/components/ui/badge";
import { useState } from "react";

interface BSONElement {
  Key?: string;
  Value?: unknown;
}

interface ConsoleEvent {
  type: string;
  timestamp?: number;
  payload?: unknown;
}

interface ConsolePanelProps {
  events: ConsoleEvent[];
}

const LEVEL_COLORS: Record<string, string> = {
  error: "bg-destructive/10 text-destructive border-destructive/20",
  warn: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  log: "bg-secondary/50 text-muted-foreground border-border",
  debug: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

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

function formatArgs(args: unknown[]): string {
  if (!args || args.length === 0) return "";

  return args
    .map((arg) => {
      if (arg === null) return "null";
      if (arg === undefined) return "undefined";
      if (typeof arg === "string") return arg;
      if (typeof arg === "number" || typeof arg === "boolean") return String(arg);

      try {
        return JSON.stringify(arg, null, 0);
      } catch {
        return String(arg);
      }
    })
    .join(" ");
}

export function ConsolePanel({ events }: ConsolePanelProps) {
  const [filter, setFilter] = useState<string | null>(null);

  const consoleEvents = events.filter((e) => e.type === "console");
  const levels = Array.from(
    new Set(consoleEvents.map((e) => String(getPayloadValue(e.payload, "level") || "log")))
  );

  const filtered = filter
    ? consoleEvents.filter((e) => String(getPayloadValue(e.payload, "level") || "log") === filter)
    : consoleEvents;

  if (consoleEvents.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        No console events captured.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setFilter(null)}
          className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
            filter === null
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-secondary text-muted-foreground border-border hover:text-foreground"
          }`}
        >
          all ({consoleEvents.length})
        </button>
        {levels.map((level) => {
          const count = consoleEvents.filter(
            (e) => String(getPayloadValue(e.payload, "level") || "log") === level
          ).length;
          return (
            <button
              key={level}
              onClick={() => setFilter(level)}
              className={`text-xs px-2.5 py-1 rounded-full border transition-colors capitalize ${
                filter === level
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              {level} ({count})
            </button>
          );
        })}
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="max-h-[500px] overflow-auto">
          {filtered.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No events match the selected filter.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((event, i) => {
                const level = String(getPayloadValue(event.payload, "level") || "log");
                const color = LEVEL_COLORS[level] || LEVEL_COLORS.log;
                const message = getPayloadValue(event.payload, "message");
                const args = getPayloadValue(event.payload, "args");
                const stack = getPayloadValue(event.payload, "stack");
                const sequence = getPayloadValue(event.payload, "sequence");

                const argsStr = Array.isArray(args) ? formatArgs(args) : "";
                const displayContent = argsStr && !message ? argsStr : (message ? `${String(message)}${argsStr ? ` ${argsStr}` : ""}` : "");

                return (
                  <div key={i} className={`p-3 ${color} border-l-2`}>
                    <div className="flex items-start gap-3">
                      <span className="text-[10px] font-mono text-muted-foreground shrink-0 w-14 text-right">
                        {formatTimestamp(event.timestamp)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-[10px] capitalize h-5">
                            {level}
                          </Badge>
                          {sequence != null && (
                            <span className="text-[10px] text-muted-foreground">
                              #{String(sequence)}
                            </span>
                          )}
                        </div>
                        {displayContent ? (
                          <div className="text-sm font-mono break-all whitespace-pre-wrap">
                            {displayContent}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground italic">
                            (empty)
                          </div>
                        )}
                        {!!stack && (
                          <pre className="mt-2 text-xs font-mono text-muted-foreground whitespace-pre-wrap overflow-auto max-h-40">
                            {String(stack)}
                          </pre>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}