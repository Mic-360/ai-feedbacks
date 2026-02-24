import fs from "fs";
import path from "path";

export interface Feedback {
    id: string;
    image: string;
    description: string;
    createdAt: string; // ISO date string
    prompt: string;
}

export interface FeedbackData {
    feedbacks: {
        [key: string]: Feedback;
    };
}

const dataDir = path.join(process.cwd(), "data");
const filePath = path.join(dataDir, "feedbacks.json");

// Ensure directory and file exist
function initStorage() {
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, JSON.stringify({ feedbacks: {} }, null, 2));
    }
}

export function getFeedbacks(): FeedbackData {
    initStorage();
    try {
        const data = fs.readFileSync(filePath, "utf-8");
        return JSON.parse(data);
    } catch (error) {
        console.error("Error reading feedbacks.json", error);
        return { feedbacks: {} };
    }
}

export function saveFeedback(feedbackKey: string, feedback: Feedback): void {
    initStorage();
    const data = getFeedbacks();
    data.feedbacks[feedbackKey] = feedback;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export async function saveImageLocally(file: File, id: string): Promise<string> {
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create a safe filename with original extension
    const ext = file.name.split('.').pop() || 'png';
    const fileName = `img-${id}.${ext}`;
    const absolutePath = path.join(uploadsDir, fileName);

    fs.writeFileSync(absolutePath, buffer);

    // Return the public URL path
    return `/uploads/${fileName}`;
}
