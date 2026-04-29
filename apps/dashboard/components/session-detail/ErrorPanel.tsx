"use client";

import { Badge } from "@/components/ui/badge";

interface BSONElement {
  Key?: string;
  Value?: unknown;
}

interface ErrorEvent {
  type: string;
  timestamp?: number;
  payload?: unknown;
}

interface ErrorPanelProps {
  events: ErrorEvent[];
}

function formatTimestamp(ms?: number): string {
  if (ms == null || Number.isNaN(ms)) return "0ms";
  return `${Math.round(ms)}ms`;
}

// Handle both proper JSON objects and BSON key-value array format
function getPayloadValue(payload: unknown, key: string): unknown {
  if (!payload) return undefined;

  // Handle proper JSON object format: { message: "...", type: "..." }
  if (typeof payload === "object" && !Array.isArray(payload)) {
    return (payload as Record<string, unknown>)[key];
  }

  // Handle BSON key-value array format: [{ Key: "message", Value: "..." }]
  if (Array.isArray(payload)) {
    const found = (payload as BSONElement[]).find((el) => el.Key === key);
    return found?.Value;
  }

  return undefined;
}

function getSeverityColor(severity?: string): string {
  switch (severity) {
    case "unhandledrejection":
      return "bg-orange-500/10 text-orange-400 border-orange-500/20";
    case "error":
    default:
      return "bg-destructive/10 text-destructive border-destructive/20";
  }
}

export function ErrorPanel({ events }: ErrorPanelProps) {
  const errorEvents = events.filter((e) => e.type === "error");

  if (errorEvents.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        No JavaScript errors captured.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground">
        {errorEvents.length} error{errorEvents.length !== 1 ? "s" : ""} captured
      </div>

      <div className="rounded-lg border border-destructive/30 bg-card overflow-hidden">
        <div className="max-h-[500px] overflow-auto">
          <div className="divide-y divide-border">
            {errorEvents.map((event, i) => {
              const message = getPayloadValue(event.payload, "message");
              const stack = getPayloadValue(event.payload, "stack");
              const errorType = getPayloadValue(event.payload, "type");
              const severity = getPayloadValue(event.payload, "severity");
              const source = getPayloadValue(event.payload, "source");
              const line = getPayloadValue(event.payload, "line");
              const column = getPayloadValue(event.payload, "column");

              const color = getSeverityColor(severity as string);

              return (
                <div key={i} className={`p-3 ${color} border-l-2`}>
                  <div className="flex items-start gap-3">
                    <span className="text-[10px] font-mono text-muted-foreground shrink-0 w-14 text-right">
                      {formatTimestamp(event.timestamp)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Badge variant="destructive" className="text-[10px] capitalize h-5">
                          {String(severity || "error")}
                        </Badge>
                        {!!errorType && (
                          <span className="text-xs text-muted-foreground">
                            {String(errorType)}
                          </span>
                        )}
                        {!!source && (
                          <span className="text-xs text-muted-foreground font-mono">
                            {String(source)}
                            {!!line ? `:${line}` : ''}
                            {!!column ? `:${column}` : ''}
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-mono break-all">
                        {message ? String(message) : "Unknown error"}
                      </div>
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
        </div>
      </div>
    </div>
  );
}