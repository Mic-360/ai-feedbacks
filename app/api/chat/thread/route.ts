import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createThread } from "@/lib/chat";
import { getProject } from "@/lib/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({ projectSlug: z.string().min(1) });

export async function POST(req: NextRequest): Promise<NextResponse> {
  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "projectSlug is required" }, { status: 400 });
  }
  try {
    const project = await getProject(parsed.projectSlug);
    if (!project) {
      return NextResponse.json({ error: "project not found" }, { status: 404 });
    }
    const thread = await createThread(parsed.projectSlug);
    return NextResponse.json({ threadId: thread.threadId });
  } catch (err) {
    console.error("[api/chat/thread]", err);
    return NextResponse.json({ error: "failed to create thread" }, { status: 500 });
  }
}
