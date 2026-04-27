"use client";

import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import type { ContextJob } from "@/lib/projects";

type State = ContextJob["state"] | "none";

const labels: Record<State, string> = {
  queued: "queued",
  running: "running",
  done: "context ready",
  failed: "context failed",
  none: "no context",
};

export function ContextStatusBadge({ state }: { state: State }) {
  if (state === "done") {
    return (
      <Badge variant="default" className="bg-primary/15 text-primary border-primary/20">
        {labels.done}
      </Badge>
    );
  }
  if (state === "failed") {
    return <Badge variant="destructive">{labels.failed}</Badge>;
  }
  if (state === "queued") {
    return <Badge variant="outline">{labels.queued}</Badge>;
  }
  if (state === "running") {
    return (
      <Badge variant="outline" className="border-primary/30 text-primary">
        <Loader2 className="size-3 animate-spin" />
        {labels.running}
      </Badge>
    );
  }
  return <Badge variant="ghost">{labels.none}</Badge>;
}
