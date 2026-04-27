import { NextResponse } from "next/server";
import { listProjects } from "@/lib/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  try {
    const projects = await listProjects();
    return NextResponse.json({ projects });
  } catch (err) {
    console.error("[api/project/list]", err);
    return NextResponse.json({ error: "failed to list projects" }, { status: 500 });
  }
}
