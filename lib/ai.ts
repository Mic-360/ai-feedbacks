import { createGoogleGenerativeAI } from "@ai-sdk/google";

/**
 * Configure the Google Gemini provider with the API key from environment variables.
 * Note: The Vercel AI SDK (and @ai-sdk/google) looks for GOOGLE_GENERATIVE_AI_API_KEY 
 * by default. We're explicitly mapping it here from GEMINI_AI_API_KEY for consistency 
 * with the existing .env setup.
 */
export const google = createGoogleGenerativeAI({
    apiKey: process.env.GEMINI_AI_API_KEY,
});
