import { type NextRequest, NextResponse } from "next/server";
import { getProject } from "@/lib/projects";
import { listFeedbacks } from "@/lib/feedbacks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
): Promise<NextResponse> {
  const { slug } = await params;
  try {
    const project = await getProject(slug);
    if (!project) {
      return NextResponse.json({ error: "project not found" }, { status: 404 });
    }
    const feedbacks = await listFeedbacks(slug);
    return NextResponse.json({ project, feedbacks });
  } catch (err) {
    console.error("[api/project/[slug]]", err);
    return NextResponse.json({ error: "failed to load project" }, { status: 500 });
  }
}
