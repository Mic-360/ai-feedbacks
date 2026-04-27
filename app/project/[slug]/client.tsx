"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContextStatusBadge } from "@/components/project/ContextStatusBadge";
import { ContextJobProgress } from "@/components/project/ContextJobProgress";
import { FeedbackCard } from "@/components/feedback/FeedbackCard";
import { FeedbackDetailSheet } from "@/components/feedback/FeedbackDetailSheet";
import { SearchBar } from "@/components/feedback/SearchBar";
import { ChatModal } from "@/components/chat/ChatModal";
import type { ContextJob, Project } from "@/lib/projects";
import type { Feedback } from "@/lib/feedbacks";

function hostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function longDate(iso: string): string {
  try {
    const d = new Date(iso);
    const month = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
    return `${String(d.getDate()).padStart(2, "0")} ${month} · ${d.getFullYear()}`;
  } catch {
    return iso;
  }
}

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
    <div className="container mx-auto w-full px-4 py-10 flex flex-col gap-10">
      {/* Masthead-style header */}
      <header className="flex flex-col gap-6">
        <div className="eyebrow-mute">№ {project.slug.slice(0, 4).toUpperCase()} — The Publication</div>
        <h1
          className="serif-display"
          style={{
            fontSize: "clamp(36px, 6vw, 56px)",
            lineHeight: 0.95,
            letterSpacing: "-0.025em",
            fontVariationSettings: '"SOFT" 30',
          }}
        >
          {hostname(project.websiteUrl)}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2 border-t border-[var(--rule)]">
          <div className="lg:col-span-5 flex flex-col gap-2 pt-3">
            <div className="ms-cap text-[var(--mute)]">
              Established &nbsp;·&nbsp; <span className="text-[var(--ink)]">{longDate(project.createdAt)}</span>
            </div>
            <div className="ms-cap text-[var(--mute)] truncate">
              Repository &nbsp;·&nbsp;{" "}
              <a
                href={project.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--ink)] hover:underline"
              >
                {project.repoOwner} / {project.repoName}
              </a>
            </div>
          </div>
          <div className="lg:col-span-7 flex flex-col gap-2 pt-3 lg:border-l lg:border-[var(--rule)] lg:pl-6">
            <div className="ms-cap text-[var(--mute)] truncate">
              Masthead URL &nbsp;·&nbsp;{" "}
              <a
                href={project.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--ink)] hover:underline"
              >
                {project.websiteUrl}
              </a>
            </div>
            <div className="flex items-center gap-2">
              <span className="ms-cap text-[var(--mute)]">House Style &nbsp;·&nbsp;</span>
              <ContextStatusBadge state={job?.state ?? "none"} />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          <Button
            variant="editorial-ghost"
            onClick={regenerate}
            disabled={regenerating || job?.state === "running" || job?.state === "queued"}
            className="h-9 px-4"
          >
            {regenerating ? <Loader2 className="animate-spin size-3" /> : null}
            Regenerate Context →
          </Button>
          <Button variant="editorial" onClick={() => setChatOpen(true)} className="h-9 px-4">
            Open Correspondence →
          </Button>
        </div>

        {(job?.state === "queued" || job?.state === "running" || job?.state === "failed") && (
          <ContextJobProgress
            slug={project.slug}
            initialJob={job}
            onDone={() => router.refresh()}
          />
        )}
      </header>

      <hr className="border-t border-[var(--rule-strong)]" />

      {/* Search */}
      <section className="flex flex-col gap-3">
        <div className="eyebrow">Search the Archive</div>
        <SearchBar projectSlug={project.slug} onResults={setMatchingIds} />
      </section>

      <hr className="border-t border-[var(--rule)]" />

      {/* Dispatches */}
      <section className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between">
          <h2 className="eyebrow">№ 02 — The Dispatches</h2>
          <span className="ms-cap tnum text-[var(--mute)]">
            {String(filteredFeedbacks.length).padStart(2, "0")} on file
          </span>
        </div>
        <div className="border-t border-[var(--rule-strong)]" />

        {filteredFeedbacks.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3 text-center">
            <div className="flex items-center gap-3">
              <span className="marker text-2xl serif-display">§</span>
              <p className="serif-display italic" style={{ fontSize: "20px" }}>
                {initialFeedbacks.length === 0
                  ? "“No dispatches yet. The wire is quiet.”"
                  : "“No dispatches match the present query.”"}
              </p>
              <span className="marker text-2xl serif-display">§</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col">
            {filteredFeedbacks.map((f, idx) => (
              <FeedbackCard
                key={f.id}
                feedback={f}
                index={idx + 1}
                onClick={() => setOpenFeedbackId(f.id)}
              />
            ))}
          </div>
        )}
      </section>

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
