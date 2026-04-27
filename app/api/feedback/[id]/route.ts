import { type NextRequest, NextResponse } from "next/server";
import {
  getFeedback,
  getFeedbackFixPromptText,
  getFeedbackLogsText,
} from "@/lib/feedbacks";
import { parseVersions } from "@/lib/fix-prompt-md";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const projectSlug = req.nextUrl.searchParams.get("projectSlug");
  if (!projectSlug) {
    return NextResponse.json(
      { error: "projectSlug query param is required" },
      { status: 400 },
    );
  }
  const { id } = await params;
  try {
    const feedback = await getFeedback(projectSlug, id);
    if (!feedback) {
      return NextResponse.json({ error: "feedback not found" }, { status: 404 });
    }
    const [logsText, fixPromptText] = await Promise.all([
      getFeedbackLogsText(projectSlug, id),
      getFeedbackFixPromptText(projectSlug, id),
    ]);
    const fixVersions = parseVersions(fixPromptText);
    return NextResponse.json({ feedback, logsText, fixPromptText, fixVersions });
  } catch (err) {
    console.error("[api/feedback/[id]]", err);
    return NextResponse.json({ error: "failed to load feedback" }, { status: 500 });
  }
}
