"use client";

import { useEffect, useState } from "react";
import type { ContextJob } from "@/lib/projects";

const stageOrder: NonNullable<ContextJob["stage"]>[] = [
  "fetching-tree",
  "selecting-files",
  "fetching-content",
  "generating",
];

const stageLabels: Record<NonNullable<ContextJob["stage"]>, string> = {
  "fetching-tree": "Fetching repository tree",
  "selecting-files": "Selecting files of consequence",
  "fetching-content": "Fetching file contents",
  "generating": "Composing context.md",
};

export function ContextJobProgress({
  slug,
  initialJob,
  onDone,
}: {
  slug: string;
  initialJob: ContextJob | null;
  onDone?: () => void;
}) {
  const [job, setJob] = useState<ContextJob | null>(initialJob);

  useEffect(() => {
    if (!job || (job.state !== "queued" && job.state !== "running")) {
      return;
    }
    let cancelled = false;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/project/${slug}/context-job`, { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { job: ContextJob | null };
        if (cancelled) return;
        setJob(data.job);
        if (data.job && (data.job.state === "done" || data.job.state === "failed")) {
          clearInterval(interval);
          onDone?.();
        }
      } catch {
        // ignore
      }
    }, 2000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [slug, job, onDone]);

  if (!job) return null;
  if (job.state === "done") return null;

  if (job.state === "failed") {
    return (
      <div className="border border-destructive/40 bg-destructive/5 p-3 text-xs">
        <p className="font-medium text-destructive">Context generation failed</p>
        {job.error && <p className="mt-1 text-muted-foreground">{job.error}</p>}
      </div>
    );
  }

  const pct = Math.max(2, Math.min(100, Math.round(job.progress * 100)));
  const stage = job.stage ? stageLabels[job.stage] : "Queued";

  return (
    <div className="border border-border/60 bg-card p-3 text-xs">
      <div className="flex items-center gap-2 mb-2">
        <Loader2 className="size-3.5 animate-spin text-primary" />
        <span className="font-medium">{stage}</span>
        <span className="ml-auto text-muted-foreground">{pct}%</span>
      </div>
      <div className="h-1.5 w-full bg-muted overflow-hidden">
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
