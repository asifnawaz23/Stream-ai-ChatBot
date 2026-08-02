import { google } from "@ai-sdk/google";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

/**
 * Centralized AI configuration for the streaming chat.
 *
 * - Models are executed server-side ONLY (inside the Route Handler).
 * - API keys are read from `process.env` and NEVER ship to the browser.
 * - Do NOT import this module from any client component — it pulls the
 *   model providers into the server bundle on purpose.
 */

/**
 * Model id, overridable via `GOOGLE_GENERATIVE_AI_MODEL`.
 *
 * NOTE: Google has retired the older model lines for new users — both
 * `gemini-1.5-flash` (the originally requested model) and `gemini-2.5-flash`
 * return HTTP 404 at runtime. The default below (`gemini-3.5-flash`) was
 * verified to work with the current API key.
 *
 * To use a different model, set in `.env.local`:
 *   GOOGLE_GENERATIVE_AI_MODEL=gemini-3.5-flash
 */
const modelId = process.env.GOOGLE_GENERATIVE_AI_MODEL ?? "gemini-3.5-flash";

/**
 * All configured Google API keys, in priority order (primary first).
 *
 * Supports automatic failover between credentials:
 *   - `GOOGLE_GENERATIVE_AI_API_KEY`   — primary key
 *   - `GOOGLE_GENERATIVE_AI_API_KEY_2` — optional fallback key (used when the
 *     primary is expired, invalid, or quota-exhausted)
 *
 * Keys are only ever read on the server; nothing here ships to the browser.
 */
export function getApiKeys(): string[] {
  return [
    process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    process.env.GOOGLE_GENERATIVE_AI_API_KEY_2,
  ].filter((key): key is string => typeof key === "string" && key.trim().length > 0);
}

/**
 * Fresh Gemini model instance. The active key is resolved from the
 * environment at request time, which lets the route handler fail over to a
 * fallback key without re-instantiating the provider.
 */
export function createChatModel() {
  return google(modelId);
}

/**
 * All configured OpenRouter API keys, in priority order (primary first).
 *
 * Supports automatic failover between credentials:
 *   - `OPENROUTER_API_KEY`   — primary key
 *   - `OPENROUTER_API_KEY_2` — optional fallback key (used when the primary
 *     is invalid or rate-limited)
 *
 * Keys are only ever read on the server; nothing here ships to the browser.
 */
export function getOpenRouterApiKeys(): string[] {
  return [
    process.env.OPENROUTER_API_KEY,
    process.env.OPENROUTER_API_KEY_2,
  ].filter((key): key is string => typeof key === "string" && key.trim().length > 0);
}

/**
 * OpenRouter-compatible provider (OpenAI-compatible protocol).
 *
 * Serves as a final fallback when every Google key is dead or quota-exhausted.
 * The provider captures `apiKey` at creation time, so a fresh instance is
 * built per configured key. The model is overridable via `OPENROUTER_MODEL`
 * (default: a free Nemotron chat model — NOTE:
 * `nvidia/nemotron-3-embedd-1b` is an EMBEDDING model and cannot chat).
 */
export function createOpenRouterModel(apiKey: string) {
  return createOpenAICompatible({
    name: "openrouter",
    baseURL: "https://openrouter.ai/api/v1",
    apiKey,
  })(OPENROUTER_MODEL_ID);
}

export const OPENROUTER_MODEL_ID =
  process.env.OPENROUTER_MODEL ?? "nvidia/nemotron-3-nano-30b-a3b:free";

export const CHAT_CONFIG = {
  model: google(modelId),
  systemPrompt: `You are an elite, highly intelligent AI Assistant. Provide helpful, accurate, and structured answers. Format code snippets cleanly with language labels.`,
  temperature: 0.7,
} as const;
