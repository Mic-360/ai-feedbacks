"use client";

import type { ChatMessage } from "@/lib/chat";
import { cn } from "@/lib/utils";

export function MessageList({
  messages,
  pending,
}: {
  messages: ChatMessage[];
  pending?: string | null;
}) {
  return (
    <div className="flex flex-col gap-3 overflow-y-auto p-3 flex-1">
      {messages.length === 0 && !pending && (
        <p className="text-xs text-muted-foreground text-center mt-8">
          Ask a question about this project.
        </p>
      )}
      {messages.map((m, i) => (
        <Bubble key={i} role={m.role} content={m.content} />
      ))}
      {pending && <Bubble role="assistant" content={pending} streaming />}
    </div>
  );
}

function Bubble({
  role,
  content,
  streaming,
}: {
  role: ChatMessage["role"];
  content: string;
  streaming?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex",
        role === "user" ? "justify-end" : "justify-start",
      )}
    >
      <div
        className={cn(
          "max-w-[85%] px-3 py-2 text-xs/relaxed whitespace-pre-wrap break-words",
          role === "user"
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground border border-border/40",
        )}
      >
        {content}
        {streaming && <span className="inline-block ml-1 animate-pulse">▍</span>}
      </div>
    </div>
  );
}
