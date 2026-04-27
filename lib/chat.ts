import { putJSON, tryGetJSON } from "@/lib/rustfs";
import { newThreadId } from "@/lib/ids";
import { addChatThreadId, requireProject } from "@/lib/projects";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  ts: string;
  modelId?: string;
}

export interface ChatThread {
  threadId: string;
  projectSlug: string;
  createdAt: string;
  messages: ChatMessage[];
}

export function threadKey(slug: string, threadId: string): string {
  return `projects/${slug}/chats/${threadId}.json`;
}

function nowIso(): string {
  return new Date().toISOString();
}

export async function createThread(slug: string): Promise<ChatThread> {
  const threadId = newThreadId();
  const thread: ChatThread = {
    threadId,
    projectSlug: slug,
    createdAt: nowIso(),
    messages: [],
  };
  await putJSON(threadKey(slug, threadId), thread);
  await addChatThreadId(slug, threadId);
  return thread;
}

export async function getThread(
  slug: string,
  threadId: string,
): Promise<ChatThread | null> {
  return tryGetJSON<ChatThread>(threadKey(slug, threadId));
}

export async function requireThread(slug: string, threadId: string): Promise<ChatThread> {
  const t = await getThread(slug, threadId);
  if (!t) throw new Error("thread not found");
  return t;
}

export async function appendMessages(
  slug: string,
  threadId: string,
  messages: ChatMessage[],
): Promise<void> {
  const thread = await requireThread(slug, threadId);
  thread.messages.push(...messages);
  await putJSON(threadKey(slug, threadId), thread);
}

export async function listThreads(
  slug: string,
): Promise<Array<{ threadId: string; createdAt: string; messageCount: number; preview: string }>> {
  const project = await requireProject(slug);
  const out: Array<{
    threadId: string;
    createdAt: string;
    messageCount: number;
    preview: string;
  }> = [];
  for (const id of project.chatThreadIds) {
    const t = await getThread(slug, id);
    if (!t) continue;
    const firstUser = t.messages.find((m) => m.role === "user");
    const preview = firstUser ? firstUser.content.slice(0, 80) : "";
    out.push({
      threadId: t.threadId,
      createdAt: t.createdAt,
      messageCount: t.messages.length,
      preview,
    });
  }
  out.sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
  return out;
}
