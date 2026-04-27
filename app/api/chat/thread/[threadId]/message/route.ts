import { type NextRequest, NextResponse } from "next/server";
import { streamText } from "ai";
import { appendMessages, requireThread, type ChatMessage } from "@/lib/chat";
import { contextKey } from "@/lib/projects";
import { tryGetText } from "@/lib/rustfs";
import { chatModel, MODEL_IDS } from "@/lib/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function nowIso(): string {
  return new Date().toISOString();
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ threadId: string }> },
): Promise<Response> {
  const projectSlug = req.nextUrl.searchParams.get("projectSlug");
  if (!projectSlug) {
    return NextResponse.json(
      { error: "projectSlug query param is required" },
      { status: 400 },
    );
  }
  const { threadId } = await params;

  let body: { content?: unknown };
  try {
    body = (await req.json()) as { content?: unknown };
  } catch {
    return NextResponse.json({ error: "invalid json body" }, { status: 400 });
  }
  const content = typeof body.content === "string" ? body.content.trim() : "";
  if (!content) {
    return NextResponse.json(
      { error: "content is required" },
      { status: 400 },
    );
  }

  let thread;
  let contextMd: string | null;
  try {
    thread = await requireThread(projectSlug, threadId);
    contextMd = await tryGetText(contextKey(projectSlug));
  } catch (err) {
    if (err instanceof Error && err.message === "thread not found") {
      return NextResponse.json({ error: "thread not found" }, { status: 404 });
    }
    console.error("[api/chat/message] load", err);
    return NextResponse.json({ error: "failed to load thread" }, { status: 500 });
  }

  const userMessage: ChatMessage = {
    role: "user",
    content,
    ts: nowIso(),
  };

  try {
    await appendMessages(projectSlug, threadId, [userMessage]);
  } catch (err) {
    console.error("[api/chat/message] persist user", err);
    return NextResponse.json(
      { error: "failed to persist user message" },
      { status: 500 },
    );
  }

  const systemPrompt = `You are a helpful assistant answering questions about the following project. Use the context as ground truth.\n\n${contextMd ?? "(no context available)"}`;

  const priorMessages = thread.messages.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  try {
    const result = streamText({
      model: chatModel(),
      system: systemPrompt,
      messages: [...priorMessages, { role: "user" as const, content }],
      onFinish: ({ text }) => {
        const assistantMessage: ChatMessage = {
          role: "assistant",
          content: text,
          ts: nowIso(),
          modelId: MODEL_IDS.chat,
        };
        appendMessages(projectSlug, threadId, [assistantMessage]).catch((err) => {
          console.error("[api/chat/message] persist assistant", err);
        });
      },
    });

    return result.toTextStreamResponse({
      headers: { "X-Thread-Id": threadId },
    });
  } catch (err) {
    console.error("[api/chat/message] stream", err);
    return NextResponse.json(
      { error: "failed to generate reply" },
      { status: 500 },
    );
  }
}
