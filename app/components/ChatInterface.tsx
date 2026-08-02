"use client";

import {
  type FormEvent,
  type KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { flushSync } from "react-dom";
import { useChat } from "@ai-sdk/react";
import {
  AlertTriangle,
  ArrowDown,
  ChevronDown,
  Cpu,
  Heart,
  Menu,
  RotateCcw,
  Send,
  Sparkles,
  Square,
  Trash2,
} from "lucide-react";
import { ChatMessage } from "./ChatMessage";
import { ThinkingIndicator } from "./ThinkingIndicator";
import { HudCorners } from "./HudCorners";
import { HistorySidebar } from "./HistorySidebar";
import {
  DEFAULT_MODEL,
  MODEL_BY_ID,
  MODELS,
  type ChatModelId,
} from "@/lib/chat-meta";
import { clearUser, getUser } from "@/lib/auth";
import {
  conversationTitle,
  deleteConversation,
  loadConversations,
  newConversationId,
  saveConversations,
  upsertConversation,
  type StoredConversation,
} from "@/lib/chat-history";

const Hologram = dynamic(() => import("./Hologram"), { ssr: false });

/** Keep auto-scroll pinned only when the user is this close to the bottom. */
const SCROLL_THRESHOLD_PX = 100;

const SUGGESTIONS = [
  "Explain React Server Components in simple terms",
  "Write a debounce function in TypeScript",
  "Draft a short product launch email",
  "Give me 3 ideas for a weekend side project",
];

interface ModelSelectorProps {
  value: ChatModelId;
  onChange: (model: ChatModelId) => void;
}

/** Cyberpunk neon dropdown for picking the chat model. */
function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const selected = MODEL_BY_ID[value];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((isOpen) => !isOpen)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="hud-label neon-panel inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[10px] font-semibold text-cyan-200 transition-all duration-200 hover:text-white hover:shadow-[0_0_18px_-6px_rgb(34_211_238/0.7)]"
      >
        <Cpu className="h-3.5 w-3.5 text-cyan-300" />
        <span>{selected.name}</span>
        <span className="rounded-md border border-cyan-400/20 bg-cyan-400/10 px-1.5 py-0.5 text-[9px] tracking-wider text-cyan-300">
          {selected.badge}
        </span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-cyan-400 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          className="neon-panel neon-border absolute bottom-full left-0 z-30 mb-2 w-64 overflow-hidden rounded-xl p-1.5"
        >
          <li className="hud-label px-3 pb-1.5 pt-2 text-[9px] font-semibold text-zinc-500">
            // Select model
          </li>
          {MODELS.map((model) => {
            const isActive = model.id === value;
            return (
              <li key={model.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  onClick={() => {
                    onChange(model.id);
                    setOpen(false);
                  }}
                  className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left transition-colors duration-150 hover:bg-cyan-400/10"
                >
                  <span className="flex items-center gap-2.5">
                    <span
                      className={`h-1.5 w-1.5 rounded-full transition-all ${
                        isActive
                          ? "bg-cyan-300 shadow-[0_0_8px_rgb(34_211_238)]"
                          : "bg-zinc-600"
                      }`}
                    />
                    <span
                      className={`text-xs ${
                        isActive ? "font-medium text-white" : "text-zinc-300"
                      }`}
                    >
                      {model.name}
                    </span>
                  </span>
                  <span className="text-[10px] text-zinc-500">{model.badge}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function ChatInterface() {
  const router = useRouter();

  // --- Auth gate ---------------------------------------------------------
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    setAuthed(getUser() !== null);
    setUserName(getUser()?.name ?? "");
  }, []);

  useEffect(() => {
    if (authed === false) router.replace("/login");
  }, [authed, router]);

  // --- Chat state --------------------------------------------------------
  const [model, setModel] = useState<ChatModelId>(DEFAULT_MODEL);

  const {
    messages,
    input,
    setInput,
    handleSubmit,
    status,
    error,
    stop,
    reload,
    setMessages,
  } = useChat({
    api: "/api/chat",
    streamProtocol: "text",
    body: { model },
  });

  const scrollRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);
  const isNearBottomRef = useRef(true);
  const [showJumpButton, setShowJumpButton] = useState(false);

  // --- Chat history ------------------------------------------------------
  const [conversations, setConversations] = useState<StoredConversation[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setConversations(loadConversations());
  }, []);

  // Debounced persistence of the active conversation.
  useEffect(() => {
    if (!activeChatId) return;
    const timer = window.setTimeout(() => {
      setConversations((previous) => {
        const next = upsertConversation(previous, {
          id: activeChatId,
          title: conversationTitle(messages),
          updatedAt: Date.now(),
          model,
          messages,
        });
        saveConversations(next);
        return next;
      });
    }, 500);
    return () => window.clearTimeout(timer);
  }, [messages, model, activeChatId]);

  // status: 'submitted' (sent, awaiting first token) -> 'streaming' -> 'ready' | 'error'
  const isStreaming = status === "streaming";
  const isThinking = status === "submitted";
  const isBusy = isThinking || isStreaming;
  const canSend = input.trim().length > 0 && !isBusy;

  // --- Smart auto-scroll engine -----------------------------------------
  // Track proximity to the bottom; only auto-scroll while pinned there.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onScroll = () => {
      const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
      isNearBottomRef.current = distance < SCROLL_THRESHOLD_PX;
      setShowJumpButton(!isNearBottomRef.current);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // Pin scroll to the latest content while the user is near the bottom.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !isNearBottomRef.current) return;
    el.scrollTo({
      top: el.scrollHeight,
      behavior: isStreaming ? "auto" : "smooth",
    });
  }, [messages, isStreaming]);

  const scrollToBottom = () => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  };

  // --- Input helpers -----------------------------------------------------
  const resizeTextarea = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  };

  const onFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!input.trim() || isBusy) return;
    if (!activeChatId) setActiveChatId(newConversationId());
    handleSubmit(event);
    window.requestAnimationFrame(() => resizeTextarea());
  };

  const onTextareaKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  };

  const submitPrompt = (prompt: string) => {
    flushSync(() => setInput(prompt));
    formRef.current?.requestSubmit();
  };

  // --- History actions ---------------------------------------------------
  const startNewChat = () => {
    setActiveChatId(null);
    setMessages([]);
    setInput("");
    isNearBottomRef.current = true;
    setShowJumpButton(false);
    setSidebarOpen(false);
  };

  const selectConversation = (conversation: StoredConversation) => {
    setActiveChatId(conversation.id);
    setModel(conversation.model);
    setMessages(conversation.messages);
    setInput("");
    isNearBottomRef.current = true;
    setShowJumpButton(false);
    setSidebarOpen(false);
    window.requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el) el.scrollTo({ top: el.scrollHeight });
    });
  };

  const removeConversation = (id: string) => {
    setConversations((previous) => {
      const next = deleteConversation(previous, id);
      saveConversations(next);
      return next;
    });
    if (activeChatId === id) startNewChat();
  };

  const handleLogout = () => {
    clearUser();
    router.replace("/login");
  };

  // --- Render ------------------------------------------------------------
  if (authed !== true) {
    return (
      <div className="cyber-bg flex h-dvh items-center justify-center">
        <div className="neon-orb h-12 w-12 animate-soft-pulse rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="cyber-bg relative flex h-dvh flex-col overflow-hidden">
      {/* Background layers: starfield + neon grid + scanlines + 3D hologram */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="starfield absolute inset-0" />
        <div className="neon-grid absolute inset-x-[-12%] bottom-0 h-72 opacity-80" />
        <div className="scanlines absolute inset-0 opacity-70" />
      </div>
      <Hologram />

      <HistorySidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        conversations={conversations}
        activeChatId={activeChatId}
        userName={userName}
        onSelect={selectConversation}
        onNewChat={startNewChat}
        onDelete={removeConversation}
        onLogout={handleLogout}
      />

      <div className="relative z-10 flex h-full flex-col">
        {/* Neon HUD header */}
        <div className="shrink-0 px-4 pt-4">
          <header className="neon-panel neon-border relative mx-auto flex w-full max-w-3xl items-center gap-3 rounded-2xl px-3 py-3">
            <HudCorners />
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              title="Chat history"
              aria-label="Open chat history"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition-all duration-200 hover:bg-white/5 hover:text-cyan-300"
            >
              <Menu className="h-4 w-4" />
            </button>
            <div className="neon-orb flex h-9 w-9 shrink-0 items-center justify-center rounded-xl">
              <Sparkles className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="font-display truncate text-sm font-semibold tracking-wide text-cyan-100">
                STREAM<span className="text-fuchsia-400">AI</span>
              </h1>
              <p className="hud-label truncate text-[9px] text-zinc-500">
                Neural interface · {MODEL_BY_ID[model].badge}
              </p>
            </div>
            {/* Operator identity */}
            <div className="hidden shrink-0 items-center gap-2 lg:flex">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-fuchsia-600 text-[11px] font-bold text-white shadow-[0_0_12px_-4px_rgb(34_211_238/0.8)]">
                {(userName.charAt(0) || "?").toUpperCase()}
              </div>
              <span className="max-w-[110px] truncate text-xs font-medium text-zinc-200">
                {userName}
              </span>
            </div>
            <span className="hud-label hidden shrink-0 items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-[10px] font-semibold text-emerald-300 shadow-[0_0_16px_-4px_rgb(52_211_153/0.6)] sm:inline-flex">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgb(52_211_153)]" />
              </span>
              {MODEL_BY_ID[model].name} · LIVE
            </span>
            <button
              type="button"
              onClick={startNewChat}
              title="New chat"
              aria-label="New chat"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-white/5 hover:text-cyan-300"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </header>
        </div>

        {/* Scrollable message pane */}
        <main ref={scrollRef} className="scroll-slim relative flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl px-4 pb-10 pt-6">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center px-4 pt-[10vh] text-center">
                <div className="relative mb-8 flex items-center justify-center">
                  <div
                    aria-hidden
                    className="absolute h-24 w-24 animate-ring-spin rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,rgb(34_211_238/0.7)_90deg,transparent_180deg,rgb(236_72_153/0.6)_270deg,transparent_360deg)] opacity-80 blur-md"
                  />
                  <div
                    aria-hidden
                    className="absolute h-40 w-40 animate-ring-spin rounded-full bg-[conic-gradient(from_180deg,transparent_0deg,rgb(124_58_237/0.5)_120deg,transparent_240deg)] opacity-50 blur-xl [animation-direction:reverse]"
                  />
                  <div className="neon-orb relative flex h-20 w-20 animate-float-y items-center justify-center rounded-2xl">
                    <Sparkles className="h-9 w-9 animate-soft-pulse text-white" />
                  </div>
                </div>
                <h2 className="text-neon font-display animate-flicker text-3xl font-bold sm:text-4xl">
                  How can I help you today?
                </h2>
                <p className="hud-label mt-3 text-[10px] font-semibold text-cyan-400/80">
                  // Welcome back, {userName}
                </p>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-zinc-400">
                  <span className="text-cyan-400">// </span>
                  Select your model below and start the conversation —
                  responses stream in real time.
                </p>
                <div className="mt-8 grid w-full max-w-lg gap-2.5 sm:grid-cols-2">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => submitPrompt(suggestion)}
                      className="neon-panel group relative overflow-hidden rounded-xl px-4 py-3 text-left text-sm text-zinc-300 transition-all duration-200 hover:-translate-y-1 hover:border-cyan-400/40 hover:text-cyan-100 hover:shadow-[0_0_24px_-6px_rgb(34_211_238/0.5)]"
                    >
                      <span className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/70 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {messages.map((message, index) => (
                  <ChatMessage
                    key={message.id}
                    message={message}
                    isStreaming={isStreaming && index === messages.length - 1}
                    userName={userName}
                  />
                ))}
              </div>
            )}

            {isThinking && <ThinkingIndicator />}

            {error && (
              <div className="mt-4 rounded-xl border border-red-500/40 bg-red-950/40 px-4 py-3 shadow-[0_0_24px_-8px_rgb(239_68_68/0.5)] backdrop-blur-md">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-red-200">
                      Something went wrong while generating the response.
                    </p>
                    {error.message && error.message !== "An error occurred." && (
                      <p className="mt-1 line-clamp-3 break-words text-xs leading-relaxed text-red-300/80">
                        {error.message}
                      </p>
                    )}
                    <p className="mt-1 text-xs text-red-300/60">
                      The selected provider may be temporarily unavailable or
                      rate-limited. Try again in a moment, or switch models.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => reload()}
                    className="hud-label inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-red-400/40 px-2.5 py-1.5 text-[10px] font-semibold text-red-200 transition-colors hover:bg-red-500/20"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Retry
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Floating jump-to-bottom button */}
          <button
            type="button"
            onClick={scrollToBottom}
            aria-label="Jump to latest"
            title="Jump to latest"
            className={`absolute bottom-5 right-5 inline-flex h-10 w-10 items-center justify-center rounded-full border border-cyan-400/30 bg-[#0b0e1c]/80 text-cyan-300 shadow-[0_0_18px_-4px_rgb(34_211_238/0.7)] backdrop-blur-md transition-all duration-300 hover:text-cyan-100 ${
              showJumpButton
                ? "translate-y-0 scale-100 opacity-100"
                : "pointer-events-none translate-y-2 scale-95 opacity-0"
            }`}
          >
            <ArrowDown className="h-4 w-4" />
          </button>
        </main>

        {/* Composer */}
        <div className="shrink-0 border-t border-white/5 px-4 pb-3 pt-3">
          <form
            ref={formRef}
            onSubmit={onFormSubmit}
            className="neon-panel neon-border relative mx-auto w-full max-w-3xl rounded-2xl transition-shadow duration-300 focus-within:shadow-[0_0_44px_-10px_rgb(34_211_238/0.6)]"
          >
            <HudCorners />
            <div className="flex items-end gap-2 p-2.5">
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(event) => {
                  setInput(event.target.value);
                  resizeTextarea();
                }}
                onKeyDown={onTextareaKeyDown}
                placeholder="Ask anything…"
                aria-label="Ask anything"
                className="max-h-40 flex-1 resize-none bg-transparent px-2 py-2.5 text-sm leading-relaxed text-zinc-100 placeholder-zinc-500 outline-none"
              />
              {isBusy ? (
                <button
                  type="button"
                  onClick={stop}
                  title="Stop generating"
                  aria-label="Stop generating"
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/15 text-red-300 ring-1 ring-red-500/40 transition-all duration-200 hover:bg-red-500/25 hover:text-red-200"
                >
                  <Square className="h-4 w-4 fill-current" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!canSend}
                  aria-label="Send message"
                  className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 via-indigo-500 to-fuchsia-500 text-white shadow-[0_0_20px_-4px_rgb(34_211_238/0.8)] transition-all duration-200 hover:shadow-[0_0_30px_-4px_rgb(236_72_153/0.9)] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                >
                  <Send className="h-4 w-4" />
                </button>
              )}
            </div>
          </form>

          {/* Model picker + developer credit, just beneath the composer */}
          <div className="mx-auto mt-2.5 flex w-full max-w-3xl flex-wrap items-center justify-between gap-2">
            <ModelSelector value={model} onChange={setModel} />
            <p className="flex items-center gap-1.5 text-[11px] text-zinc-500">
              <Heart className="h-3 w-3 text-fuchsia-400 drop-shadow-[0_0_6px_rgb(236_72_153)]" />
              Developed by{" "}
              <span className="font-medium text-cyan-300">
                Muhammad Asif Nawaz
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
