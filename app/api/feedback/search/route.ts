import { type NextRequest, NextResponse } from "next/server";
import { generateText, Output } from "ai";
import { z } from "zod";
import { getFeedbackLogsText, listFeedbacks } from "@/lib/feedbacks";
import { searchModel } from "@/lib/gemini";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  projectSlug: z.string().min(1),
  query: z.string().min(1),
});

const LOG_EXCERPT_BYTES = 2048;
const SEARCH_CONCURRENCY = 5;

async function pMap<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const width = Math.max(1, Math.min(concurrency, items.length));
  const workers: Promise<void>[] = [];
  for (let w = 0; w < width; w++) {
    workers.push(
      (async () => {
        while (true) {
          const idx = cursor++;
          if (idx >= items.length) return;
          results[idx] = await fn(items[idx]!);
        }
      })(),
    );
  }
  await Promise.all(workers);
  return results;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let parsed: z.infer<typeof bodySchema>;
  try {
    parsed = bodySchema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: "projectSlug and query are required" },
      { status: 400 },
    );
  }

  const { projectSlug, query } = parsed;

  try {
    const feedbacks = await listFeedbacks(projectSlug);
    if (feedbacks.length === 0) {
      return NextResponse.json({ matchingIds: [] });
    }

    const items = await pMap(feedbacks, SEARCH_CONCURRENCY, async (f) => {
      let logExcerpt = "";
      try {
        const text = await getFeedbackLogsText(projectSlug, f.id);
        logExcerpt = text.slice(0, LOG_EXCERPT_BYTES);
      } catch (err) {
        console.warn(
          `[api/feedback/search-v2] logs unreadable for ${f.id}`,
          err,
        );
      }
      return { id: f.id, description: f.description, logExcerpt };
    });

    const result = await generateText({
      model: searchModel(),
      experimental_output: Output.object({
        schema: z.object({ matchingIds: z.array(z.string()) }),
      }),
      system:
        "You are a search engine over user-submitted bug feedback. Given a free-text query and a list of feedback items (id, description, log excerpt), return the IDs of items relevant to the query. Match on intent, not keyword overlap. Return an empty array when nothing matches.",
      prompt: JSON.stringify({ query, items }),
    });

    const known = new Set(feedbacks.map((f) => f.id));
    const raw: unknown = result.experimental_output?.matchingIds;
    const matchingIds = Array.isArray(raw)
      ? (raw.filter((x) => typeof x === "string" && known.has(x)) as string[])
      : [];

    return NextResponse.json({ matchingIds });
  } catch (err) {
    console.error("[api/feedback/search-v2]", err);
    return NextResponse.json({ error: "search failed" }, { status: 500 });
  }
}
