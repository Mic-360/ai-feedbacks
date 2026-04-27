import { createGoogleGenerativeAI } from "@ai-sdk/google";

export const MODEL_IDS = {
  context: "gemini-3.1-pro-preview",
  fix: "gemini-3-flash-preview",
  search: "gemini-3-flash-preview",
  chat: "gemini-3.1-flash-lite-preview",
} as const;

let cachedProvider: ReturnType<typeof createGoogleGenerativeAI> | null = null;

function ensure(): void {
  if (!process.env.GEMINI_AI_API_KEY) {
    throw new Error("GEMINI_AI_API_KEY is not set");
  }
}

function provider(): ReturnType<typeof createGoogleGenerativeAI> {
  ensure();
  if (!cachedProvider) {
    cachedProvider = createGoogleGenerativeAI({
      apiKey: process.env.GEMINI_AI_API_KEY,
    });
  }
  return cachedProvider;
}

export const contextModel = () => provider()(MODEL_IDS.context);
export const fixModel = () => provider()(MODEL_IDS.fix);
export const searchModel = () => provider()(MODEL_IDS.search);
export const chatModel = () => provider()(MODEL_IDS.chat);
