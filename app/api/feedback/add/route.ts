import { NextResponse } from "next/server";
import { streamText } from "ai";
import { google } from "@/lib/ai";
import { saveImageLocally, saveFeedback } from "@/lib/storage";

function generateRandomAlphanumeric(length: number) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const image = formData.get("image") as File;
        const description = formData.get("description") as string;

        if (!image || !description) {
            return NextResponse.json({ error: "Image and description are required" }, { status: 400 });
        }

        // Generate IDs
        const issueCode = generateRandomAlphanumeric(4);
        const feedbackKey = `issue-${issueCode}`;
        const id = generateRandomAlphanumeric(8);

        // Save image
        const imagePath = await saveImageLocally(image, id);

        // Generate AI Prompt
        const buffer = await image.arrayBuffer();
        const ui8 = new Uint8Array(buffer);

        const result = streamText({
            model: google("gemini-3-flash-preview"),
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: `You are an expert AI architect. A user is reporting an issue with their application. Analyze the provided screenshot and the user's issue description: "${description}". Provide a short, precise, and highly concise ready-to-use prompt that can be copy-pasted into a coding agent to perfectly resolve the issue shown in the image and described by the user. Write only the prompt cleanly formatted in markdown without any fluff.`
                        },
                        { type: "image", image: ui8 }
                    ]
                }
            ],
            onFinish: async ({ text }) => {
                const newFeedback = {
                    id,
                    image: imagePath,
                    description,
                    createdAt: new Date().toISOString(),
                    prompt: text
                };
                saveFeedback(feedbackKey, newFeedback);
            }
        });

        // Set headers so the client can immediately display correct optimistic data
        return result.toTextStreamResponse({
            headers: {
                "X-Feedback-Id": id,
                "X-Feedback-Key": feedbackKey,
                "X-Image-Path": imagePath,
            }
        });

    } catch (error) {
        console.error("Error adding feedback:", error);
        return NextResponse.json({ error: "Failed to process feedback" }, { status: 500 });
    }
}
