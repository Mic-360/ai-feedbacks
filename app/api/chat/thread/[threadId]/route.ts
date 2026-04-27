import { type NextRequest, NextResponse } from "next/server";
import { getThread } from "@/lib/chat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ threadId: string }> },
): Promise<NextResponse> {
  const projectSlug = req.nextUrl.searchParams.get("projectSlug");
  if (!projectSlug) {
    return NextResponse.json(
      { error: "projectSlug query param is required" },
      { status: 400 },
    );
  }
  const { threadId } = await params;
  try {
    const thread = await getThread(projectSlug, threadId);
    return NextResponse.json({ thread });
  } catch (err) {
    console.error("[api/chat/thread/[threadId]]", err);
    return NextResponse.json({ error: "failed to load thread" }, { status: 500 });
  }
}
