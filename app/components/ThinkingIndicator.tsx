"use client";

import { Bot } from "lucide-react";

/**
 * Rendered between submit and the first assistant token.
 *
 * Mirrors the exact visual skeleton of an assistant message (avatar + card)
 * so the swap from "thinking" to "streaming" causes zero layout shift.
 */
export function ThinkingIndicator() {
  return (
    <div className="flex animate-fade-in items-start gap-3">
      <div className="neon-orb flex h-8 w-8 shrink-0 items-center justify-center rounded-full">
        <Bot className="relative z-10 h-4 w-4 text-white" />
      </div>
      <div className="neon-panel flex items-center gap-3 rounded-2xl px-4 py-3.5">
        <span className="hud-label text-[11px] font-semibold text-cyan-200">
          Thinking
        </span>
        <span className="flex items-center gap-1.5" aria-label="Thinking">
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-400 shadow-[0_0_8px_rgb(34_211_238)] [animation-delay:0ms]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-fuchsia-400 shadow-[0_0_8px_rgb(236_72_153)] [animation-delay:150ms]" />
          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-violet-400 shadow-[0_0_8px_rgb(167_139_250)] [animation-delay:300ms]" />
        </span>
      </div>
    </div>
  );
}
