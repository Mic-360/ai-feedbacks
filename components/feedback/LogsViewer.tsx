"use client";

import { useMemo } from "react";
import { parseLogs } from "@/lib/logs-txt";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";

export function LogsViewer({ text }: { text: string }) {
  const parsed = useMemo(() => {
    try {
      return parseLogs(text);
    } catch {
      return null;
    }
  }, [text]);

  if (!parsed) {
    return (
      <div className="border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground">
        Could not parse logs.
      </div>
    );
  }

  const { logs } = parsed;
  const networkText = logs.networkSummary && logs.networkSummary.length
    ? logs.networkSummary
        .map((n) => `${n.method} ${n.url} → ${n.status} (${n.durationMs}ms) @ ${n.timestamp}`)
        .join("\n")
    : "(none)";

  return (
    <Tabs defaultValue="console" className="w-full">
      <TabsList variant="line">
        <TabsTrigger value="console">Console ({logs.console.length})</TabsTrigger>
        <TabsTrigger value="rejections">
          Rejections ({logs.unhandledRejections.length})
        </TabsTrigger>
        <TabsTrigger value="dom">DOM</TabsTrigger>
        <TabsTrigger value="network">
          Network ({logs.networkSummary?.length ?? 0})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="console">
        <ScrollArea className="h-64 border border-border/40 bg-muted/30">
          <pre className="p-2 text-[11px] whitespace-pre-wrap break-all">
            {logs.console.length ? logs.console.join("\n") : "(none)"}
          </pre>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="rejections">
        <ScrollArea className="h-64 border border-border/40 bg-muted/30">
          <pre className="p-2 text-[11px] whitespace-pre-wrap break-all">
            {logs.unhandledRejections.length ? logs.unhandledRejections.join("\n") : "(none)"}
          </pre>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="dom">
        <ScrollArea className="h-64 border border-border/40 bg-muted/30">
          <pre className="p-2 text-[11px] whitespace-pre-wrap break-all">
            {`length: ${logs.domLength}\n\n${logs.domExcerpt}`}
          </pre>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="network">
        <ScrollArea className="h-64 border border-border/40 bg-muted/30">
          <pre className="p-2 text-[11px] whitespace-pre-wrap break-all">
            {networkText}
          </pre>
        </ScrollArea>
      </TabsContent>
    </Tabs>
  );
}
