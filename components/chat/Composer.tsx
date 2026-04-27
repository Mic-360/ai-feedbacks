"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function Composer({
  projectSlug,
  threadId,
  onPending,
  onAssistantChunk,
  onDone,
}: {
  projectSlug: string;
  threadId: string;
  onPending: (userText: string) => void;
  onAssistantChunk: (text: string) => void;
  onDone: () => void;
}) {
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send() {
    const content = value.trim();
    if (!content || sending) return;
    setSending(true);
    setError(null);
    setValue("");
    onPending(content);
    try {
      const res = await fetch(
        `/api/chat/thread/${threadId}/message?projectSlug=${encodeURIComponent(projectSlug)}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content }),
        },
      );
      if (!res.ok || !res.body) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "send failed");
        setSending(false);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { value: chunk, done } = await reader.read();
        if (done) break;
        acc += decoder.decode(chunk, { stream: true });
        onAssistantChunk(acc);
      }
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "network error");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col gap-1 border-t border-border/40 p-2">
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2 items-end">
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Ask anything about the codebase…"
          className="flex-1 min-h-12 max-h-32"
        />
        <Button
          onClick={send}
          disabled={sending || !value.trim()}
          size="icon"
        >
          {sending ? <Loader2 className="animate-spin" /> : <Send />}
        </Button>
      </div>
    </div>
  );
}
