import { type NextRequest, NextResponse } from "next/server";
import { getProject } from "@/lib/projects";
import { startContextGeneration } from "@/lib/context-jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
): Promise<NextResponse> {
  const { slug } = await params;
  try {
    const project = await getProject(slug);
    if (!project) {
      return NextResponse.json({ error: "project not found" }, { status: 404 });
    }
    const { jobId } = await startContextGeneration(slug);
    return NextResponse.json({ jobId });
  } catch (err) {
    console.error("[api/project/[slug]/regenerate-context]", err);
    return NextResponse.json({ error: "failed to start regeneration" }, { status: 500 });
  }
}
