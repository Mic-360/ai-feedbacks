import { type NextRequest, NextResponse } from "next/server";
import { listFeedbacks } from "@/lib/feedbacks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest): Promise<NextResponse> {
  const projectSlug = req.nextUrl.searchParams.get("projectSlug");
  if (!projectSlug) {
    return NextResponse.json(
      { error: "projectSlug query param is required" },
      { status: 400 },
    );
  }
  try {
    const feedbacks = await listFeedbacks(projectSlug);
    return NextResponse.json({ feedbacks });
  } catch (err) {
    console.error("[api/feedback/list]", err);
    return NextResponse.json({ error: "failed to list feedbacks" }, { status: 500 });
  }
}
