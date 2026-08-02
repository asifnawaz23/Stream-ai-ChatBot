import type { UIMessage } from "@ai-sdk/ui-utils";
import type { ChatModelId } from "@/lib/chat-meta";

/**
 * Client-side chat history persistence (localStorage). Each conversation
 * stores the full UI message list plus the model it was generated with, so a
 * conversation can be resumed exactly as it was left.
 */

export interface StoredConversation {
  id: string;
  title: string;
  updatedAt: number;
  model: ChatModelId;
  messages: UIMessage[];
}

const STORAGE_KEY = "streamai.history.v1";

/** Collision-safe conversation id with a fallback for non-secure contexts. */
export function newConversationId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `chat_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function loadConversations(): StoredConversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as StoredConversation[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveConversations(conversations: StoredConversation[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  } catch {
    // Storage full or unavailable — fail silently.
  }
}

/** Insert or update a conversation, returning the list with it moved to front. */
export function upsertConversation(
  conversations: StoredConversation[],
  next: StoredConversation,
): StoredConversation[] {
  const index = conversations.findIndex((c) => c.id === next.id);
  if (index === -1) return [next, ...conversations];
  const copy = [...conversations];
  copy[index] = next;
  return [copy[index], ...copy.slice(0, index), ...copy.slice(index + 1)];
}

export function deleteConversation(
  conversations: StoredConversation[],
  id: string,
): StoredConversation[] {
  return conversations.filter((c) => c.id !== id);
}

/** Derive a sidebar title from the first user message. */
export function conversationTitle(messages: UIMessage[]): string {
  const firstUser = messages.find((message) => message.role === "user");
  const text =
    firstUser?.parts
      .filter((part): part is { type: "text"; text: string } => part.type === "text")
      .map((part) => part.text)
      .join(" ")
      .trim() ?? "";
  return text.length > 42 ? `${text.slice(0, 42)}…` : text || "New Chat";
}

/** Compact relative timestamp for the sidebar list. */
export function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
