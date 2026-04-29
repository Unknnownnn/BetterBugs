"use client";

import { Badge } from "@/components/ui/badge";
import { useState } from "react";

interface BSONElement {
  Key?: string;
  Value?: unknown;
}

interface NetworkEvent {
  type: string;
  timestamp?: number;
  payload?: unknown;
}

interface NetworkPanelProps {
  events: NetworkEvent[];
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

function getStatusColor(status?: number): string {
  if (!status) return "text-muted-foreground";
  if (status >= 200 && status < 300) return "text-emerald-400";
  if (status >= 300 && status < 400) return "text-amber-400";
  if (status >= 400) return "text-destructive";
  return "text-muted-foreground";
}

function getStatusBadge(status?: number): "success" | "warning" | "destructive" | "outline" {
  if (!status) return "outline";
  if (status >= 200 && status < 300) return "success";
  if (status >= 300 && status < 400) return "warning";
  if (status >= 400) return "destructive";
  return "outline";
}

function formatBody(body: unknown): string {
  if (!body) return "—";
  if (typeof body === "string") return body;
  try {
    return JSON.stringify(body, null, 2);
  } catch {
    return String(body);
  }
}

export function NetworkPanel({ events }: NetworkPanelProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const networkEvents = events.filter((e) => e.type === "network");

  if (networkEvents.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground text-sm">
        No network events captured.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground">
        {networkEvents.length} request{networkEvents.length !== 1 ? "s" : ""} captured
      </div>

      <div className="rounded-lg border border-border bg-card overflow-hidden">
        <div className="max-h-[500px] overflow-auto">
          <div className="divide-y divide-border">
            {networkEvents.map((event, i) => {
              const method = String(getPayloadValue(event.payload, "method") || "GET");
              const url = String(getPayloadValue(event.payload, "url") || "unknown");
              const status = getPayloadValue(event.payload, "status") as number | undefined;
              const duration = getPayloadValue(event.payload, "duration") as number | undefined;

              const isSelected = selectedIndex === i;

              return (
                <div
                  key={i}
                  className={`cursor-pointer transition-colors ${
                    isSelected ? "bg-secondary/50" : "hover:bg-secondary/30"
                  }`}
                >
                  <div
                    className="flex items-center gap-3 px-4 py-3"
                    onClick={() => setSelectedIndex(isSelected ? null : i)}
                  >
                    <Badge
                      variant={getStatusBadge(status)}
                      className="text-[10px] shrink-0 w-12 justify-center"
                    >
                      {method}
                    </Badge>
                    <span
                      className={`text-sm font-medium shrink-0 w-10 text-right ${getStatusColor(status)}`}
                    >
                      {status || "—"}
                    </span>
                    <span className="text-sm text-foreground truncate flex-1 min-w-0 font-mono">
                      {url}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0 w-16 text-right">
                      {duration != null ? `${duration}ms` : "—"}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0 w-14 text-right">
                      {formatTimestamp(event.timestamp)}
                    </span>
                  </div>

                  {isSelected && (
                    <div className="px-4 pb-4 space-y-3 border-t border-border/50 bg-background/50">
                      {/* Request Headers */}
                      <div>
                        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                          Request Headers
                        </h4>
                        {(() => {
                          const reqHeaders = getPayloadValue(event.payload, "requestHeaders");
                          const reqBody = getPayloadValue(event.payload, "requestBody");
                          if (reqHeaders || reqBody) {
                            return (
                              <>
                                {reqHeaders && (
                                  <pre className="text-xs font-mono bg-secondary/50 rounded p-2 overflow-auto max-h-32 whitespace-pre-wrap">
                                    {JSON.stringify(reqHeaders, null, 2)}
                                  </pre>
                                )}
                                {reqBody && (
                                  <pre className="text-xs font-mono bg-secondary/50 rounded p-2 overflow-auto max-h-32 whitespace-pre-wrap mt-2">
                                    {formatBody(reqBody)}
                                  </pre>
                                )}
                              </>
                            );
                          }
                          return <span className="text-xs text-muted-foreground">No request data</span>;
                        })()}
                      </div>

                      {/* Response Headers */}
                      <div>
                        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                          Response
                        </h4>
                        {(() => {
                          const resHeaders = getPayloadValue(event.payload, "responseHeaders");
                          const resBody = getPayloadValue(event.payload, "responseBody");
                          const size = getPayloadValue(event.payload, "size");
                          if (resHeaders || resBody || size != null) {
                            return (
                              <>
                                {resHeaders && (
                                  <pre className="text-xs font-mono bg-secondary/50 rounded p-2 overflow-auto max-h-32 whitespace-pre-wrap">
                                    {JSON.stringify(resHeaders, null, 2)}
                                  </pre>
                                )}
                                {resBody && (
                                  <pre className="text-xs font-mono bg-secondary/50 rounded p-2 overflow-auto max-h-32 whitespace-pre-wrap mt-2">
                                    {formatBody(resBody)}
                                  </pre>
                                )}
                                {size != null && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    Size: {String(size)} bytes
                                  </div>
                                )}
                              </>
                            );
                          }
                          return <span className="text-xs text-muted-foreground">No response data</span>;
                        })()}
                      </div>
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