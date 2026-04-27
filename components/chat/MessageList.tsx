"use client";

import type { ChatMessage } from "@/lib/chat";

function shortStamp(iso?: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    const month = d.toLocaleString("en-US", { month: "short" }).toUpperCase();
    const h = String(d.getHours()).padStart(2, "0");
    const m = String(d.getMinutes()).padStart(2, "0");
    return `${String(d.getDate()).padStart(2, "0")} ${month} · ${h}:${m}`;
  } catch {
    return "";
  }
}

export function MessageList({
  messages,
  pending,
}: {
  messages: ChatMessage[];
  pending?: string | null;
}) {
  return (
    <div className="flex flex-col gap-6 overflow-y-auto p-6 flex-1">
      {messages.length === 0 && !pending && (
        <p className="serif-display italic text-center mt-8" style={{ fontSize: "20px", color: "var(--mute)" }}>
          “Pose your first question to the wire.”
        </p>
      )}
      {messages.map((m, i) => (
        <MessageBlock key={i} role={m.role} content={m.content} ts={m.ts} />
      ))}
      {pending && <MessageBlock role="assistant" content={pending} streaming />}
    </div>
  );
}

function MessageBlock({
  role,
  content,
  ts,
  streaming,
}: {
  role: ChatMessage["role"];
  content: string;
  ts?: string;
  streaming?: boolean;
}) {
  const isUser = role === "user";
  return (
    <div className={`flex flex-col gap-1 ${isUser ? "items-end" : "items-start"}`}>
      <div className="ms-cap tnum text-[var(--mute)]">
        {isUser ? "You" : "The Wire"}
        {ts ? ` · ${shortStamp(ts)}` : ""}
      </div>
      <div
        className={`serif-body whitespace-pre-wrap break-words max-w-[85%] ${
          isUser ? "italic text-right" : ""
        }`}
        style={{
          fontSize: "16px",
          lineHeight: 1.55,
          color: isUser ? "var(--accent-sage)" : "var(--ink)",
        }}
      >
        {content}
        {streaming && <span className="inline-block ml-1 animate-pulse marker">▍</span>}
      </div>
    </div>
  );
}
