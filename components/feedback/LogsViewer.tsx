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
      <div className="border border-[var(--rule)] p-3 ms-cap text-[var(--mute)]">
        (logs unparseable)
      </div>
    );
  }

  const { logs } = parsed;
  const networkText = logs.networkSummary && logs.networkSummary.length
    ? logs.networkSummary
        .map((n) => `${n.method} ${n.url} → ${n.status} (${n.durationMs}ms) @ ${n.timestamp}`)
        .join("\n")
    : "(none)";

  const triggerCls =
    "px-3 py-1.5 ms-cap border border-[var(--rule)] data-[state=active]:bg-[var(--ink)] data-[state=active]:text-[var(--paper)] data-[state=active]:border-[var(--ink)] hover:border-[var(--rule-strong)] -ml-px first:ml-0 transition-colors";
  const paneCls =
    "border border-[var(--rule)] bg-[var(--secondary)]";
  const preCls =
    "p-3 text-[11px] whitespace-pre-wrap break-all";

  const monoFont = { fontFamily: "var(--font-mono), ui-monospace, monospace" } as React.CSSProperties;

  return (
    <Tabs defaultValue="console" className="w-full flex flex-col gap-2">
      <TabsList variant="line" className="!gap-0 !border-0 flex flex-wrap">
        <TabsTrigger value="console" className={triggerCls}>
          I. Console ({logs.console.length})
        </TabsTrigger>
        <TabsTrigger value="rejections" className={triggerCls}>
          II. Rejections ({logs.unhandledRejections.length})
        </TabsTrigger>
        <TabsTrigger value="dom" className={triggerCls}>
          III. DOM
        </TabsTrigger>
        <TabsTrigger value="network" className={triggerCls}>
          IV. Network ({logs.networkSummary?.length ?? 0})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="console">
        <ScrollArea className={`h-64 ${paneCls}`}>
          <pre className={preCls} style={monoFont}>
            {logs.console.length ? logs.console.join("\n") : "(none)"}
          </pre>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="rejections">
        <ScrollArea className={`h-64 ${paneCls}`}>
          <pre className={preCls} style={monoFont}>
            {logs.unhandledRejections.length ? logs.unhandledRejections.join("\n") : "(none)"}
          </pre>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="dom">
        <ScrollArea className={`h-64 ${paneCls}`}>
          <pre className={preCls} style={monoFont}>
            {`length: ${logs.domLength}\n\n${logs.domExcerpt}`}
          </pre>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="network">
        <ScrollArea className={`h-64 ${paneCls}`}>
          <pre className={preCls} style={monoFont}>
            {networkText}
          </pre>
        </ScrollArea>
      </TabsContent>
    </Tabs>
  );
}
