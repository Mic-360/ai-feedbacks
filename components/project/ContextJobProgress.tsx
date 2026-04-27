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
      <div className="border border-(--marker) p-4 text-xs">
        <p className="eyebrow marker mb-1">Indexing Filed for Failure</p>
        {job.error && <p className="serif-body text-(--ink-soft) mt-1">{job.error}</p>}
      </div>
    );
  }

  const activeIdx = job.stage ? stageOrder.indexOf(job.stage) : -1;
  const stageNum = activeIdx >= 0 ? activeIdx + 1 : 1;
  const stageText = job.stage ? stageLabels[job.stage] : "Queued for indexing";

  return (
    <div className="border border-(--rule) p-4 flex flex-col gap-3">
      <div className="eyebrow tnum">
        Indexing in Progress — Stage {String(stageNum).padStart(2, "0")} of 04
      </div>
      <div className="grid grid-cols-4 border border-(--rule)">
        {stageOrder.map((s, i) => {
          const active = i === activeIdx;
          const done = i < activeIdx;
          return (
            <div
              key={s}
              className={`px-2 py-2 text-center ms-cap tnum ${i > 0 ? "border-l border-(--rule)" : ""}`}
              style={{
                background: active ? "var(--ink)" : done ? "var(--secondary)" : "transparent",
                color: active ? "var(--paper)" : done ? "var(--ink)" : "var(--mute)",
              }}
            >
              0{i + 1}
            </div>
          );
        })}
      </div>
      <p className="serif-body italic text-(--ink-soft) text-sm">{stageText}…</p>
    </div>
  );
}
