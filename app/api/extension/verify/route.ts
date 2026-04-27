import { type NextRequest, NextResponse } from "next/server";
import { findProjectBySiteUrl } from "@/lib/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS(): Promise<Response> {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json(
      { error: "url query param is required" },
      { status: 400, headers: CORS_HEADERS },
    );
  }
  try {
    new URL(url);
  } catch {
    return NextResponse.json(
      { error: "invalid url" },
      { status: 400, headers: CORS_HEADERS },
    );
  }
  try {
    const match = await findProjectBySiteUrl(url);
    if (match) {
      return NextResponse.json(
        { match: true, slug: match.slug },
        { status: 200, headers: CORS_HEADERS },
      );
    }
    return NextResponse.json({ match: false }, { status: 200, headers: CORS_HEADERS });
  } catch (err) {
    console.error("[api/extension/verify]", err);
    return NextResponse.json(
      { error: "verification failed" },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}
