import { NextResponse } from "next/server";
import { generateText, Output } from "ai";
import { google } from "@/lib/ai";
import { getFeedbacks } from "@/lib/storage";
import { z } from "zod";

export async function POST(req: Request) {
    try {
        const { query } = await req.json();

        if (!query || typeof query !== 'string') {
            return NextResponse.json({ error: "Query is required" }, { status: 400 });
        }

        const { feedbacks } = getFeedbacks();

        // We only need to send the descriptions to Gemini
        const searchData = Object.entries(feedbacks).map(([key, value]) => ({
            key,
            description: value.description
        }));

        if (searchData.length === 0) {
            return NextResponse.json({ results: [] });
        }

        const { output } = await generateText({
            model: google("gemini-3-flash"),
            output: Output.object({
                schema: z.object({
                    matchingKeys: z.array(z.string()).describe("The array of 'key' values (like 'issue-xyz1') from the provided JSON that are semantically relevant to the user's natural language search query.")
                })
            }),
            prompt: `Given this user search query: "${query}"\n\nAnd this JSON list of feedbacks:\n${JSON.stringify(searchData, null, 2)}\n\nReturn the keys of the feedbacks that semantically match or are highly relevant to the search query. Return an empty array if none match.`
        });

        // Filter the original feedbacks based on the returned keys
        const matchedFeedbacks = output.matchingKeys
            .map(key => ({
                key,
                ...feedbacks[key]
            }))
            .filter(f => f.id)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return NextResponse.json({ results: matchedFeedbacks });

    } catch (error) {
        console.error("Error in natural language search:", error);
        return NextResponse.json({ error: "Search failed" }, { status: 500 });
    }
}
