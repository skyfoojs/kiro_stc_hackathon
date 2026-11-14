import { createOpenRouter } from "@openrouter/ai-sdk-provider";

// Single place to switch models. Server-side only (uses a secret key).
// No ":free" DeepSeek models exist on OpenRouter right now; this is the
// cheapest DeepSeek option (~$0.04 per 1M input tokens).
export const AI_MODEL = "deepseek/deepseek-v4.1-flash-1017";

export const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

export const model = openrouter(AI_MODEL);
