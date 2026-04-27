"use client";

import { formatDistanceToNow } from "date-fns";
import { Sparkles, Clock } from "lucide-react";
import type { Feedback } from "@/lib/feedbacks";

function excerpt(s: string, n = 140): string {
  if (s.length <= n) return s;
  return s.slice(0, n).trimEnd() + "…";
}

export function FeedbackCard({
  feedback,
  onClick,
}: {
  feedback: Feedback;
  onClick?: () => void;
}) {
  const fixCount = feedback.fixVersions.length;
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col text-left border border-border/60 bg-card overflow-hidden transition-colors hover:border-primary/40"
    >
      <div className="aspect-video bg-muted/40 overflow-hidden border-b border-border/40">
        <img
          src={`/api/image/${feedback.imageKey}`}
          alt="Feedback screenshot"
          className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
          loading="lazy"
        />
      </div>
      <div className="flex flex-col gap-2 p-3">
        <p className="text-xs/relaxed text-foreground line-clamp-3 min-h-[3em]">
          {excerpt(feedback.description)}
        </p>
        <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-border/30">
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3" />
            {formatDistanceToNow(new Date(feedback.createdAt), { addSuffix: true })}
          </span>
          <span
            className={
              fixCount > 0
                ? "inline-flex items-center gap-1 text-primary"
                : "inline-flex items-center gap-1"
            }
          >
            <Sparkles className="size-3" />
            {fixCount > 0 ? `v${fixCount}` : "no fix"}
          </span>
        </div>
      </div>
    </button>
  );
}
