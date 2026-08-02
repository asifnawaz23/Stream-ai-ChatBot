import { convertToModelMessages, streamText, type UIMessage } from "ai";
import {
  CHAT_CONFIG,
  createChatModel,
  createOpenRouterModel,
  getApiKeys,
  getOpenRouterApiKeys,
} from "@/lib/ai-config";
import type { ChatModelId } from "@/lib/chat-meta";

// Allow the stream to run for up to a minute on serverless platforms.
export const maxDuration = 60;

/**
 * Probe a stream result without consuming the real response: reads a teed
 * copy of the stream until the first meaningful part. Returns `false` when
 * the provider errored BEFORE producing any content (invalid key, expired
 * OAuth token, quota exhaustion, model 404, …) — in which case the caller
 * transparently retries with the next credential. Errors AFTER the first
 * token are intentionally left to stream to the client with the partial
 * content.
 */
interface Probeable {
  fullStream: AsyncIterable<{ type: string; error?: unknown }>;
  toTextStreamResponse(): Response;
}

type StreamAttempt = () => Probeable;

async function isKeyUsable(result: Probeable): Promise<boolean> {
  for await (const part of result.fullStream) {
    if (part.type === "error") {
      return false;
    }
    if (
      part.type === "text-start" ||
      part.type === "text-delta" ||
      part.type === "reasoning-start"
    ) {
      return true;
    }
  }
  return true;
}

/**
 * Build the provider chain for a chosen model, in credential-priority order:
 *   - `gemini`   → every Google key
 *   - `nemotron` → every OpenRouter key
 * Only providers with a configured key are included. The client selects the
 * model, so failover stays within that model's provider.
 */
function getStreamAttempts(
  model: ChatModelId,
  messagesToSend: ReturnType<typeof convertToModelMessages>,
): StreamAttempt[] {
  if (model === "nemotron") {
    return getOpenRouterApiKeys().map(
      (key) => (): Probeable =>
        streamText({
          model: createOpenRouterModel(key),
          system: CHAT_CONFIG.systemPrompt,
          messages: messagesToSend,
          temperature: CHAT_CONFIG.temperature,
          maxRetries: 1,
        }),
    );
  }

  return getApiKeys().map((key) => (): Probeable => {
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = key;
    return streamText({
      model: createChatModel(),
      system: CHAT_CONFIG.systemPrompt,
      messages: messagesToSend,
      temperature: CHAT_CONFIG.temperature,
      maxRetries: 1,
    });
  });
}

/**
 * POST /api/chat
 *
 * Accepts the conversation history (UI messages) and the selected model from
 * the client, converts them into model messages, pipes them into the model,
 * and returns the plain text stream that the client's `useChat` hook consumes
 * token-by-token (streamProtocol "text").
 *
 * Credentials are tried in order within the selected model's provider:
 * invalid keys, expired tokens, and quota exhaustion all fall through
 * transparently.
 */
export async function POST(req: Request) {
  const { messages, model } = (await req.json()) as {
    messages: UIMessage[];
    model?: ChatModelId;
  };

  if (!Array.isArray(messages)) {
    return Response.json({ error: "Invalid messages payload." }, { status: 400 });
  }

  const selected: ChatModelId = model === "nemotron" ? "nemotron" : "gemini";
  const modelMessages = convertToModelMessages(messages);

  for (const attempt of getStreamAttempts(selected, modelMessages)) {
    const result = attempt();
    if (await isKeyUsable(result)) {
      return result.toTextStreamResponse();
    }
  }

  // Every credential for the selected model failed before producing a token.
  // Return a non-OK response whose body is the human-readable message: the
  // client throws `Error(response.text())` on a non-OK status and surfaces it
  // in the error banner, so the user sees a helpful message.
  const provider = selected === "nemotron" ? "OpenRouter" : "Google";
  return new Response(
    `The ${provider} provider is currently unavailable (all configured keys failed). Please try again later or switch models.`,
    { status: 500, headers: { "Content-Type": "text/plain; charset=utf-8" } },
  );
}
