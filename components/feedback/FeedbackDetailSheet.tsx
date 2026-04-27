"use client";

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { LogsViewer } from "./LogsViewer";
import { FixPromptPanel } from "./FixPromptPanel";
import { Loader2 } from "lucide-react";
import type { Feedback } from "@/lib/feedbacks";
import type { FixVersion } from "@/lib/fix-prompt-md";

interface FeedbackDetailResponse {
  feedback: Feedback;
  logsText: string;
  fixPromptText: string;
  fixVersions: FixVersion[];
}

export function FeedbackDetailSheet({
  open,
  onOpenChange,
  projectSlug,
  feedbackId,
  contextReady,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectSlug: string;
  feedbackId: string | null;
  contextReady: boolean;
}) {
  const [state, setState] = useState<{
    data: FeedbackDetailResponse | null;
    loading: boolean;
    error: string | null;
  }>({ data: null, loading: false, error: null });
  const { data, loading, error } = state;

  useEffect(() => {
    if (!open || !feedbackId) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setState({ data: null, loading: true, error: null });
    fetch(`/api/feedback/${feedbackId}?projectSlug=${encodeURIComponent(projectSlug)}`, {
      cache: "no-store",
    })
      .then(async (r) => {
        const j = await r.json();
        if (cancelled) return;
        if (!r.ok) {
          setState({
            data: null,
            loading: false,
            error: (j as { error?: string }).error ?? "failed to load",
          });
          return;
        }
        setState({ data: j as FeedbackDetailResponse, loading: false, error: null });
      })
      .catch((err) => {
        if (!cancelled) {
          setState({
            data: null,
            loading: false,
            error: err instanceof Error ? err.message : "load failed",
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open, feedbackId, projectSlug]);

  const updateVersions = (versions: FixVersion[]) => {
    setState((prev) =>
      prev.data ? { ...prev, data: { ...prev.data, fixVersions: versions } } : prev,
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="!max-w-none w-full sm:w-[95vw] md:w-[90vw] lg:w-[85vw] xl:w-[1280px] sm:!max-w-[1280px] overflow-hidden"
      >
        <SheetHeader>
          <SheetTitle>Feedback detail</SheetTitle>
          <SheetDescription>
            Inspect the captured screenshot, logs, and generate a fix prompt.
          </SheetDescription>
        </SheetHeader>

        {loading && (
          <div className="flex items-center justify-center flex-1 text-muted-foreground text-xs">
            <Loader2 className="animate-spin size-4 mr-2" /> Loading…
          </div>
        )}

        {error && (
          <p className="text-destructive text-xs" role="alert">
            {error}
          </p>
        )}

        {data && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1 overflow-hidden">
            <div className="flex flex-col gap-3 overflow-y-auto pr-1">
              <div className="border border-border/60 bg-muted/20 overflow-hidden">
                <img
                  src={`/api/image/${data.feedback.imageKey}`}
                  alt="Feedback screenshot"
                  className="w-full h-auto object-contain"
                />
              </div>
              <div className="border border-border/60 bg-card p-3">
                <p className="text-xs font-semibold mb-1">Description</p>
                <p className="text-xs/relaxed whitespace-pre-wrap">
                  {data.feedback.description}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold mb-1">Logs</p>
                <LogsViewer text={data.logsText} />
              </div>
            </div>

            <div className="flex flex-col gap-3 overflow-hidden min-h-0">
              <p className="text-xs font-semibold">Fix prompt</p>
              <FixPromptPanel
                projectSlug={projectSlug}
                feedbackId={data.feedback.id}
                versions={data.fixVersions}
                contextReady={contextReady}
                onVersionsChanged={updateVersions}
              />
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
