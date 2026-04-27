import { type NextRequest, NextResponse } from "next/server";
import { getContextJob } from "@/lib/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
): Promise<NextResponse> {
  const { slug } = await params;
  try {
    const job = await getContextJob(slug);
    return NextResponse.json({ job });
  } catch (err) {
    console.error("[api/project/[slug]/context-job]", err);
    return NextResponse.json({ error: "failed to load job" }, { status: 500 });
  }
}
