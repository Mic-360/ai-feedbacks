"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ThreadList, type ThreadStub } from "./ThreadList";
import { MessageList } from "./MessageList";
import { Composer } from "./Composer";
import {
  Combobox,
  ComboboxInput,
  ComboboxContent,
  ComboboxList,
  ComboboxItem,
  ComboboxEmpty,
} from "@/components/ui/combobox";
import { Loader2 } from "lucide-react";
import type { ProjectSummary } from "@/lib/projects";
import type { ChatThread, ChatMessage } from "@/lib/chat";

export function ChatModal({
  open,
  onOpenChange,
  initialProjectSlug,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialProjectSlug?: string;
}) {
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [slug, setSlug] = useState<string | null>(initialProjectSlug ?? null);
  const [threads, setThreads] = useState<ThreadStub[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [thread, setThread] = useState<ChatThread | null>(null);
  const [pendingUser, setPendingUser] = useState<string | null>(null);
  const [pendingAssistant, setPendingAssistant] = useState<string | null>(null);
  const [creatingThread, setCreatingThread] = useState(false);

  // Load projects when open
  useEffect(() => {
    if (!open) return;
    fetch("/api/project/list", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { projects?: ProjectSummary[] }) => {
        setProjects(d.projects ?? []);
        if (!slug && d.projects && d.projects[0]) {
          setSlug(d.projects[0].slug);
        }
      })
      .catch(() => {});
  }, [open, slug]);

  // Load project (for thread ids) when slug changes
  useEffect(() => {
    if (!open || !slug) return;
    setActiveThreadId(null);
    setThread(null);
    fetch(`/api/project/${slug}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d: { project?: { chatThreadIds: string[] } }) => {
        const ids = d.project?.chatThreadIds ?? [];
        const stubs: ThreadStub[] = ids.map((id) => ({ threadId: id }));
        setThreads(stubs);
      })
      .catch(() => {});
  }, [open, slug]);

  // Load active thread
  useEffect(() => {
    if (!slug || !activeThreadId) return;
    setPendingUser(null);
    setPendingAssistant(null);
    fetch(
      `/api/chat/thread/${activeThreadId}?projectSlug=${encodeURIComponent(slug)}`,
      { cache: "no-store" },
    )
      .then((r) => r.json())
      .then((d: { thread?: ChatThread | null }) => {
        if (d.thread) setThread(d.thread);
      })
      .catch(() => {});
  }, [slug, activeThreadId]);

  async function newThread() {
    if (!slug) return;
    setCreatingThread(true);
    try {
      const res = await fetch("/api/chat/thread", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectSlug: slug }),
      });
      const d = (await res.json()) as { threadId?: string };
      if (d.threadId) {
        setThreads((prev) => [{ threadId: d.threadId! }, ...prev]);
        setActiveThreadId(d.threadId);
      }
    } finally {
      setCreatingThread(false);
    }
  }

  async function refetchThread() {
    if (!slug || !activeThreadId) return;
    const res = await fetch(
      `/api/chat/thread/${activeThreadId}?projectSlug=${encodeURIComponent(slug)}`,
      { cache: "no-store" },
    );
    const d = (await res.json()) as { thread?: ChatThread | null };
    if (d.thread) setThread(d.thread);
    setPendingUser(null);
    setPendingAssistant(null);
  }

  const messages: ChatMessage[] = thread?.messages ?? [];
  const allMessages: ChatMessage[] = pendingUser
    ? [
        ...messages,
        { role: "user", content: pendingUser, ts: new Date().toISOString() },
      ]
    : messages;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-4xl w-full h-[80vh] sm:!max-w-4xl flex flex-col p-0 gap-0 bg-[var(--paper)] text-[var(--ink)] border border-[var(--rule-strong)] !rounded-none">
        <DialogHeader className="p-5 border-b border-[var(--rule)]">
          <div className="eyebrow-mute mb-1">№ III — The Correspondence</div>
          <DialogTitle
            className="serif-display !text-[26px]"
            style={{ letterSpacing: "-0.02em", lineHeight: 1, fontWeight: 500 }}
          >
            The Correspondence
          </DialogTitle>
          <div className="mt-3">
            <label className="eyebrow-mute block mb-1">Publication</label>
            <Combobox
              items={projects.map((p) => p.slug)}
              value={slug ?? ""}
              onValueChange={(v) => typeof v === "string" && setSlug(v)}
            >
              <ComboboxInput placeholder="Select a publication…" className="!border-0 !border-b !border-[var(--rule)] !rounded-none focus:!border-[var(--ink)] !bg-transparent !px-0" />
              <ComboboxContent>
                <ComboboxList>
                  <ComboboxEmpty>No publications.</ComboboxEmpty>
                  {projects.map((p) => (
                    <ComboboxItem key={p.slug} value={p.slug}>
                      {p.slug}
                    </ComboboxItem>
                  ))}
                </ComboboxList>
              </ComboboxContent>
            </Combobox>
          </div>
        </DialogHeader>

        {!slug ? (
          <div className="flex-1 flex items-center justify-center ms-cap text-[var(--mute)]">
            Choose a publication to begin correspondence.
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">
            <ThreadList
              threads={threads}
              activeId={activeThreadId}
              onSelect={setActiveThreadId}
              onNewThread={newThread}
              loading={creatingThread}
            />
            <div className="flex-1 flex flex-col overflow-hidden">
              {!activeThreadId ? (
                <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
                  Select or create a thread.
                </div>
              ) : !thread ? (
                <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
                  <Loader2 className="size-4 animate-spin mr-2" /> Loading…
                </div>
              ) : (
                <>
                  <MessageList
                    messages={allMessages}
                    pending={pendingAssistant}
                  />
                  <Composer
                    projectSlug={slug}
                    threadId={activeThreadId}
                    onPending={(t) => {
                      setPendingUser(t);
                      setPendingAssistant("");
                    }}
                    onAssistantChunk={(t) => setPendingAssistant(t)}
                    onDone={refetchThread}
                  />
                </>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
