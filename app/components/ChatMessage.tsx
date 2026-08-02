"use client";

import { memo, useState } from "react";
import type { UIMessage } from "@ai-sdk/ui-utils";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { Bot, Check, Copy } from "lucide-react";

/** Concatenate the text parts of a (parts-based) UI message. */
function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
}

/**
 * Stream-safe markdown: closes a dangling code fence so unclosed "```"
 * blocks render as code instead of swallowing the rest of the stream.
 */
function toSafeMarkdown(text: string): string {
  const fenceCount = text.split("```").length - 1;
  return fenceCount % 2 === 1 ? `${text}\n\`\`\`` : text;
}

const markdownComponents: Components = {
  p: ({ children }) => (
    <p className="mb-3 leading-relaxed last:mb-0">{children}</p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-zinc-100">{children}</strong>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="font-medium text-cyan-300 underline decoration-cyan-500/40 underline-offset-2 transition-colors hover:text-cyan-200"
    >
      {children}
    </a>
  ),
  ul: ({ children }) => (
    <ul className="mb-3 list-disc space-y-1.5 pl-5 last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-3 list-decimal space-y-1.5 pl-5 last:mb-0">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  h1: ({ children }) => (
    <h1 className="mb-3 mt-1 text-xl font-bold text-zinc-100">{children}</h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-2.5 mt-1 text-lg font-bold text-zinc-100">{children}</h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-2 mt-1 text-base font-semibold text-zinc-100">
      {children}
    </h3>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mb-3 border-l-2 border-cyan-500/50 pl-4 text-zinc-400 italic last:mb-0">
      {children}
    </blockquote>
  ),
  hr: () => <hr className="my-4 border-zinc-800" />,
  table: ({ children }) => (
    <div className="scroll-slim mb-3 overflow-x-auto last:mb-0">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border border-cyan-400/15 bg-cyan-400/10 px-3 py-2 text-left font-medium text-cyan-200">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-cyan-400/10 px-3 py-2 text-zinc-300">{children}</td>
  ),
  pre: ({ children }) => (
    <pre className="scroll-slim mb-3 overflow-x-auto rounded-xl border border-cyan-400/10 bg-[#04050b]/90 p-4 text-[13px] leading-relaxed shadow-[inset_0_1px_0_rgb(255_255_255/0.04)] last:mb-0">
      {children}
    </pre>
  ),
  code: ({ className, children }) => {
    if (className) {
      // Block code: keep the language class (e.g. `language-ts`).
      return (
        <code className={`${className} font-mono text-[13px] text-cyan-200`}>
          {children}
        </code>
      );
    }
    // Inline code.
    return (
      <code className="rounded-md border border-cyan-400/20 bg-cyan-400/10 px-1.5 py-0.5 font-mono text-[0.85em] text-cyan-200">
        {children}
      </code>
    );
  },
};

interface ChatMessageProps {
  message: UIMessage;
  isStreaming: boolean;
  userName?: string;
}

export const ChatMessage = memo(function ChatMessage({
  message,
  isStreaming,
  userName,
}: ChatMessageProps) {
  const text = getMessageText(message);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (e.g. non-secure context) — fail silently.
    }
  };

  if (message.role === "data") {
    return null;
  }

  if (message.role === "user") {
    return (
      <div className="flex animate-fade-in flex-col items-end gap-1">
        {userName && (
          <span className="hud-label px-1 text-[9px] font-medium text-fuchsia-300/80">
            {userName}
          </span>
        )}
        <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-gradient-to-br from-fuchsia-600/90 via-purple-700/85 to-indigo-700/85 px-4 py-3 text-sm leading-relaxed text-white shadow-[0_0_24px_-8px_rgb(236_72_153/0.7)] ring-1 ring-white/15 sm:max-w-[75%]">
          {text}
        </div>
      </div>
    );
  }

  return (
    <div className="group flex animate-fade-in-up items-start gap-3">
      <div className="neon-orb flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
        <Bot className="relative z-10 h-4 w-4 text-white" />
      </div>
      <div className="neon-panel relative min-w-0 max-w-[85%] flex-1 rounded-2xl px-4 py-3.5 text-sm text-zinc-300 sm:max-w-[80%]">
        <button
          type="button"
          onClick={handleCopy}
          title="Copy response"
          aria-label="Copy response"
          className="absolute right-2.5 top-2.5 inline-flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 transition-all duration-200 hover:bg-white/10 hover:text-cyan-300 sm:opacity-0 sm:group-hover:opacity-100"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <Copy className="h-3.5 w-3.5" />
          )}
        </button>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={markdownComponents}
        >
          {toSafeMarkdown(text)}
        </ReactMarkdown>
        {isStreaming && (
          <span
            aria-hidden
            className="ml-1 inline-block h-[1.05em] w-[2px] translate-y-[2px] animate-blink rounded-full bg-cyan-300 shadow-[0_0_8px_rgb(34_211_238)]"
          />
        )}
      </div>
    </div>
  );
});
