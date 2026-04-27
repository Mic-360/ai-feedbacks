import { type NextRequest, NextResponse } from "next/server";
import { getObjectStream } from "@/lib/rustfs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KEY_RE = /^projects\/[^/]+\/feedbacks\/[^/]+\/image\.png$/;

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
    const { stream, contentType } = await getObjectStream(key);
    return new Response(stream, {
      headers: {
        "Content-Type": contentType ?? "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    if (err instanceof Error && /no such key|notfound|404/i.test(err.message)) {
      return NextResponse.json({ error: "not found" }, { status: 404 });
    }
    console.error("[api/image] stream", err);
    return NextResponse.json({ error: "failed to load image" }, { status: 500 });
  }
}
