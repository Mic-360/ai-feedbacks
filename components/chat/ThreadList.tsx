"use client";

import { cn } from "@/lib/utils";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ThreadStub {
  threadId: string;
  createdAt?: string;
}

export function ThreadList({
  threads,
  activeId,
  onSelect,
  onNewThread,
  loading,
}: {
  threads: ThreadStub[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNewThread: () => void;
  loading?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1 border-r border-border/40 w-48 overflow-y-auto p-2 shrink-0">
      <Button
        variant="outline"
        size="sm"
        onClick={onNewThread}
        disabled={loading}
      >
        {loading ? <Loader2 className="animate-spin" /> : <Plus />} New thread
      </Button>
      <div className="flex flex-col gap-0.5 mt-2">
        {threads.length === 0 && (
          <p className="text-[11px] text-muted-foreground text-center mt-2">
            No threads yet.
          </p>
        )}
        {threads.map((t) => (
          <button
            key={t.threadId}
            type="button"
            onClick={() => onSelect(t.threadId)}
            className={cn(
              "text-left text-xs px-2 py-1.5 truncate transition-colors",
              activeId === t.threadId
                ? "bg-primary/10 text-foreground"
                : "hover:bg-muted text-muted-foreground",
            )}
          >
            {t.threadId}
          </button>
        ))}
      </div>
    </div>
  );
}
