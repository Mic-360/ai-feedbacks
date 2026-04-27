import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createProject } from "@/lib/projects";
import { startContextGeneration } from "@/lib/context-jobs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  websiteUrl: z.string().min(1),
  repoUrl: z.string().min(1),
});

export async function POST(req: NextRequest): Promise<NextResponse> {
  let parsed: z.infer<typeof bodySchema>;
  try {
    const json = await req.json();
    parsed = bodySchema.parse(json);
  } catch {
    return NextResponse.json(
      { error: "websiteUrl and repoUrl are required strings" },
      { status: 400 },
    );
  }

  try {
    const project = await createProject(parsed);
    const { jobId } = await startContextGeneration(project.slug);
    return NextResponse.json({ slug: project.slug, jobId }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "project already exists") {
      return NextResponse.json({ error: "project already exists" }, { status: 409 });
    }
    console.error("[api/project/create]", err);
    return NextResponse.json({ error: "failed to create project" }, { status: 500 });
  }
}
