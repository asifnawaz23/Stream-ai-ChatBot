/**
 * Client-safe registry of selectable chat models.
 *
 * Keep model ids in sync with the provider wiring in `lib/ai-config.ts` and
 * `app/api/chat/route.ts`:
 *   - `gemini`   → Google Gemini (all `GOOGLE_GENERATIVE_AI_API_KEY*` keys)
 *   - `nemotron` → OpenRouter free Nemotron (all `OPENROUTER_API_KEY*` keys)
 */
export const MODELS = [
  { id: "gemini", name: "Gemini 3.5 Flash", badge: "Google" },
  { id: "nemotron", name: "Nemotron 3 Nano 30B", badge: "OpenRouter" },
] as const;

export type ChatModelId = (typeof MODELS)[number]["id"];

export const DEFAULT_MODEL: ChatModelId = "gemini";

export const MODEL_BY_ID = Object.fromEntries(
  MODELS.map((model) => [model.id, model]),
) as Record<ChatModelId, (typeof MODELS)[number]>;
