import { type NextRequest, NextResponse } from "next/server";
import { contextKey } from "@/lib/projects";
import { tryGetText } from "@/lib/rustfs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
): Promise<NextResponse> {
  const { slug } = await params;
  try {
    const markdown = await tryGetText(contextKey(slug));
    return NextResponse.json({ markdown });
  } catch (err) {
    console.error("[api/project/[slug]/context]", err);
    return NextResponse.json({ error: "failed to load context" }, { status: 500 });
  }
}
