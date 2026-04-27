import { type NextRequest, NextResponse } from "next/server";
import { createFeedback } from "@/lib/feedbacks";
import { requireProject } from "@/lib/projects";
import type { LogsPayload } from "@/lib/logs-txt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, *",
};

export async function OPTIONS(): Promise<Response> {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "invalid multipart form" },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const image = form.get("image");
  const description = form.get("description");
  const logsRaw = form.get("logs");
  const projectSlug = form.get("projectSlug");

  if (!(image instanceof File)) {
    return NextResponse.json(
      { error: "image file is required" },
      { status: 400, headers: CORS_HEADERS },
    );
  }
  if (typeof description !== "string" || description.length === 0) {
    return NextResponse.json(
      { error: "description is required" },
      { status: 400, headers: CORS_HEADERS },
    );
  }
  if (typeof logsRaw !== "string") {
    return NextResponse.json(
      { error: "logs is required" },
      { status: 400, headers: CORS_HEADERS },
    );
  }
  if (typeof projectSlug !== "string" || projectSlug.length === 0) {
    return NextResponse.json(
      { error: "projectSlug is required" },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  let logs: LogsPayload;
  try {
    logs = JSON.parse(logsRaw) as LogsPayload;
  } catch {
    return NextResponse.json(
      { error: "logs is not valid JSON" },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  try {
    await requireProject(projectSlug);
  } catch {
    return NextResponse.json(
      { error: "project not found" },
      { status: 404, headers: CORS_HEADERS },
    );
  }

  try {
    const imageBuffer = Buffer.from(await image.arrayBuffer());
    const feedback = await createFeedback({
      projectSlug,
      description,
      imageBuffer,
      logs,
    });
    return NextResponse.json(
      { feedbackId: feedback.id },
      { status: 201, headers: CORS_HEADERS },
    );
  } catch (err) {
    console.error("[api/feedback/add-v2]", err);
    return NextResponse.json(
      { error: "failed to create feedback" },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}
