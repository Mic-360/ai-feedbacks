"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Code2, Globe, RefreshCw, MessageCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContextStatusBadge } from "@/components/project/ContextStatusBadge";
import { ContextJobProgress } from "@/components/project/ContextJobProgress";
import { FeedbackCard } from "@/components/feedback/FeedbackCard";
import { FeedbackDetailSheet } from "@/components/feedback/FeedbackDetailSheet";
import { SearchBar } from "@/components/feedback/SearchBar";
import { ChatModal } from "@/components/chat/ChatModal";
import type { ContextJob, Project } from "@/lib/projects";
import type { Feedback } from "@/lib/feedbacks";

export function ProjectClient({
  project,
  feedbacks: initialFeedbacks,
  initialJob,
}: {
  project: Project;
  feedbacks: Feedback[];
  initialJob: ContextJob | null;
}) {
  const router = useRouter();
  const [job, setJob] = useState<ContextJob | null>(initialJob);
  const [matchingIds, setMatchingIds] = useState<string[] | null>(null);
  const [openFeedbackId, setOpenFeedbackId] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const contextReady = job?.state === "done" || project.contextGeneratedAt !== null;

  const filteredFeedbacks = useMemo(() => {
    if (!matchingIds) return initialFeedbacks;
    const set = new Set(matchingIds);
    return initialFeedbacks.filter((f) => set.has(f.id));
  }, [initialFeedbacks, matchingIds]);

  async function regenerate() {
    setRegenerating(true);
    try {
      await fetch(`/api/project/${project.slug}/regenerate-context`, {
        method: "POST",
      });
      const res = await fetch(`/api/project/${project.slug}/context-job`, {
        cache: "no-store",
      });
      const data = (await res.json()) as { job: ContextJob | null };
      setJob(data.job);
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <div className="container mx-auto w-full px-4 py-8 flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex flex-col gap-1 min-w-0">
            <h1 className="font-heading text-2xl font-bold tracking-tight truncate">
              {project.slug}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <a
                href={project.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:text-foreground"
              >
                <Globe className="size-3.5" />
                {project.websiteUrl}
              </a>
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 hover:text-foreground"
              >
                <Code2 className="size-3.5" />
                {project.repoOwner}/{project.repoName}
              </a>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ContextStatusBadge state={job?.state ?? "none"} />
            <Button
              variant="outline"
              onClick={regenerate}
              disabled={regenerating || job?.state === "running" || job?.state === "queued"}
            >
              {regenerating ? <Loader2 className="animate-spin" /> : <RefreshCw />}
              Regenerate context
            </Button>
            <Button onClick={() => setChatOpen(true)}>
              <MessageCircle />
              Chat
            </Button>
          </div>
        </div>

        {(job?.state === "queued" || job?.state === "running" || job?.state === "failed") && (
          <ContextJobProgress
            slug={project.slug}
            initialJob={job}
            onDone={() => router.refresh()}
          />
        )}
      </div>

      <SearchBar projectSlug={project.slug} onResults={setMatchingIds} />

      {filteredFeedbacks.length === 0 ? (
        <div className="border border-dashed border-border/60 bg-muted/10 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {initialFeedbacks.length === 0
              ? "No feedbacks yet. Capture some via the browser extension."
              : "No feedbacks match your search."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredFeedbacks.map((f) => (
            <FeedbackCard
              key={f.id}
              feedback={f}
              onClick={() => setOpenFeedbackId(f.id)}
            />
          ))}
        </div>
      )}

      <FeedbackDetailSheet
        open={openFeedbackId !== null}
        onOpenChange={(o) => !o && setOpenFeedbackId(null)}
        projectSlug={project.slug}
        feedbackId={openFeedbackId}
        contextReady={contextReady}
      />

      <ChatModal
        open={chatOpen}
        onOpenChange={setChatOpen}
        initialProjectSlug={project.slug}
      />
    </div>
  );
}
