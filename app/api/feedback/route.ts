import { NextResponse } from "next/server";
import { getFeedbacks } from "@/lib/storage";

export async function GET() {
    try {
        const data = getFeedbacks();

        // Convert object to array and sort by newest first
        const feedbacksArray = Object.entries(data.feedbacks)
            .map(([key, value]) => ({
                key,
                ...value
            }))
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return NextResponse.json({ feedbacks: feedbacksArray });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch feedbacks" }, { status: 500 });
    }
}
