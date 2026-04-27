import { type NextRequest, NextResponse } from "next/server";
import { streamText } from "ai";
import {
  appendFix,
  getFeedbackLogsText,
  imageKey,
  requireFeedback,
} from "@/lib/feedbacks";
import { getObject, tryGetText } from "@/lib/rustfs";
import { contextKey } from "@/lib/projects";
import { fixModel, MODEL_IDS } from "@/lib/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SYSTEM_PROMPT =
  "You generate copy-pasteable fix prompts for an AI coding agent (Claude Code, Cursor, etc.). Output Markdown with exactly three sections: (1) a single one-line problem statement, (2) a short 'Hypothesis' paragraph identifying the root cause, (3) a 'Fix' section with concrete edit instructions that cite specific files and symbols from the project context whenever possible. Be precise, do not speculate beyond the evidence in the screenshot, logs, and context.";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  const projectSlug = req.nextUrl.searchParams.get("projectSlug");
  if (!projectSlug) {
    return NextResponse.json(
      { error: "projectSlug query param is required" },
      { status: 400 },
    );
  }
  const { id } = await params;

  let feedback;
  let logsText: string;
  let imageBuffer: Buffer;
  let contextMd: string | null;
  try {
    feedback = await requireFeedback(projectSlug, id);
    [contextMd, logsText, imageBuffer] = await Promise.all([
      tryGetText(contextKey(projectSlug)),
      getFeedbackLogsText(projectSlug, id),
      getObject(imageKey(projectSlug, id)),
    ]);
  } catch (err) {
    if (err instanceof Error && err.message === "feedback not found") {
      return NextResponse.json({ error: "feedback not found" }, { status: 404 });
    }
    console.error("[api/feedback/[id]/generate-fix] load", err);
    return NextResponse.json({ error: "failed to load feedback" }, { status: 500 });
  }

  const contextText =
    contextMd ?? "(no context.md available — proceed with logs and image only)";

  try {
    const result = streamText({
      model: fixModel(),
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Project context follows:\n\n${contextText}`,
            },
            {
              type: "image",
              image: imageBuffer,
              mediaType: "image/png",
            },
            {
              type: "text",
              text: `User description:\n${feedback.description}\n\nCaptured logs:\n${logsText}`,
            },
          ],
        },
      ],
      onFinish: ({ text }) => {
        appendFix(projectSlug, id, { modelId: MODEL_IDS.fix, body: text }).catch(
          (err) => {
            console.error("[api/feedback/[id]/generate-fix] appendFix", err);
          },
        );
      },
    });

    return result.toTextStreamResponse({
      headers: { "X-Feedback-Id": id },
    });
  } catch (err) {
    console.error("[api/feedback/[id]/generate-fix] stream", err);
    return NextResponse.json({ error: "failed to generate fix" }, { status: 500 });
  }
}
