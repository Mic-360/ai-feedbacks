import { type NextRequest, NextResponse } from "next/server";
import { getText } from "@/lib/rustfs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KEY_RE =
  /^projects\/[^/]+\/(context\.md|context-job\.json|feedbacks\/[^/]+\/(logs\.txt|fix-prompt\.md))$/;

function contentTypeFor(key: string): string {
  if (key.endsWith(".md")) return "text/markdown; charset=utf-8";
  if (key.endsWith(".json")) return "application/json; charset=utf-8";
  return "text/plain; charset=utf-8";
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ key: string[] }> },
): Promise<Response> {
  const { key: segments } = await params;
  const key = segments.join("/");
  if (!KEY_RE.test(key)) {
    return NextResponse.json({ error: "invalid key" }, { status: 400 });
  }

  try {
    const text = await getText(key);
    return new Response(text, {
      headers: {
        "Content-Type": contentTypeFor(key),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    if (err instanceof Error && /no such key|notfound|404/i.test(err.message)) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    console.error("[api/file] read", err);
    return NextResponse.json({ error: "failed to load file" }, { status: 500 });
  }
}
