"use client";

import type { ContextJob } from "@/lib/projects";

type State = ContextJob["state"] | "none";

export function ContextStatusBadge({ state }: { state: State }) {
  const baseCls = "inline-flex items-center gap-1.5 px-2 py-0.5 border text-[10px] font-medium uppercase";
  const monoStyle: React.CSSProperties = {
    fontFamily: "var(--font-ui), system-ui, sans-serif",
    letterSpacing: "0.16em",
  };

  if (state === "done") {
    return (
      <span
        className={baseCls}
        style={{ ...monoStyle, color: "var(--accent-sage)", borderColor: "var(--accent-soft)" }}
      >
        Ready
      </span>
    );
  }
  if (state === "failed") {
    return (
      <span
        className={baseCls}
        style={{ ...monoStyle, color: "var(--marker)", borderColor: "var(--marker)" }}
      >
        Retired
      </span>
    );
  }
  if (state === "queued" || state === "running") {
    return (
      <span
        className={baseCls}
        style={{ ...monoStyle, color: "var(--mute)", borderColor: "var(--rule)" }}
      >
        Indexing
        <span className="inline-flex gap-[2px]">
          <span className="pulse-dot inline-block w-[3px] h-[3px] bg-(--mute)" />
          <span className="pulse-dot inline-block w-[3px] h-[3px] bg-(--mute)" />
          <span className="pulse-dot inline-block w-[3px] h-[3px] bg-(--mute)" />
        </span>
      </span>
    );
  }
  return (
    <span
      className={baseCls}
      style={{ ...monoStyle, color: "var(--mute)", borderColor: "var(--rule)" }}
    >
      Unfiled
    </span>
  );
}
