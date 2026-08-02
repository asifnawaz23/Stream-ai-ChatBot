"use client";

import {
  History,
  LogOut,
  MessageSquare,
  Plus,
  Trash2,
  User as UserIcon,
  X,
} from "lucide-react";
import type { StoredConversation } from "@/lib/chat-history";
import { timeAgo } from "@/lib/chat-history";
import { MODEL_BY_ID } from "@/lib/chat-meta";

interface HistorySidebarProps {
  open: boolean;
  onClose: () => void;
  conversations: StoredConversation[];
  activeChatId: string | null;
  userName: string;
  onSelect: (conversation: StoredConversation) => void;
  onNewChat: () => void;
  onDelete: (id: string) => void;
  onLogout: () => void;
}

export function HistorySidebar({
  open,
  onClose,
  conversations,
  activeChatId,
  userName,
  onSelect,
  onNewChat,
  onDelete,
  onLogout,
}: HistorySidebarProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Panel */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-80 max-w-[85vw] flex-col border-r border-cyan-400/15 bg-[#070912]/95 backdrop-blur-2xl transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 px-4 py-4">
          <div className="flex items-center gap-2.5">
            <div className="neon-orb flex h-8 w-8 items-center justify-center rounded-lg">
              <History className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="hud-label text-[11px] font-semibold text-cyan-100">
                Chat history
              </p>
              <p className="text-[10px] text-zinc-500">Session archive</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close history"
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-white/5 hover:text-cyan-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* New chat */}
        <button
          type="button"
          onClick={onNewChat}
          className="hud-label mx-3 mt-3 mb-1 inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-400/30 bg-cyan-400/10 px-3 py-2.5 text-[10px] font-semibold text-cyan-200 transition-all duration-200 hover:bg-cyan-400/20 hover:text-white"
        >
          <Plus className="h-4 w-4" />
          New chat
        </button>

        {/* Conversation list */}
        <div className="scroll-slim flex-1 overflow-y-auto px-3 py-2">
          {conversations.length === 0 ? (
            <p className="px-2 py-10 text-center text-xs text-zinc-600">
              No conversations yet.
            </p>
          ) : (
            conversations.map((conversation) => {
              const isActive = conversation.id === activeChatId;
              const modelBadge = MODEL_BY_ID[conversation.model]?.badge ?? "";
              return (
                <div
                  key={conversation.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelect(conversation)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelect(conversation);
                    }
                  }}
                  className={`group relative mb-1.5 flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 transition-all duration-150 ${
                    isActive
                      ? "border-cyan-400/40 bg-cyan-400/10 shadow-[0_0_16px_-6px_rgb(34_211_238/0.5)]"
                      : "border-white/5 bg-white/[0.03] hover:border-cyan-400/20 hover:bg-white/[0.06]"
                  }`}
                >
                  <MessageSquare className="h-3.5 w-3.5 shrink-0 text-cyan-400/70" />
                  <div className="min-w-0 flex-1">
                    <p
                      className={`truncate text-xs ${
                        isActive ? "font-medium text-white" : "text-zinc-200"
                      }`}
                    >
                      {conversation.title}
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      {timeAgo(conversation.updatedAt)} · {modelBadge}
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label="Delete conversation"
                    onClick={(event) => {
                      event.stopPropagation();
                      onDelete(conversation.id);
                    }}
                    className="shrink-0 rounded-md p-1 text-red-400/60 opacity-0 transition-all hover:bg-red-500/10 hover:text-red-300 focus:opacity-100 group-hover:opacity-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* User footer */}
        <div className="border-t border-white/5 px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-fuchsia-600 shadow-[0_0_14px_-4px_rgb(34_211_238/0.7)]">
              <UserIcon className="h-4 w-4 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-medium text-zinc-200">
                {userName}
              </p>
              <p className="text-[10px] text-zinc-500">Operator</p>
            </div>
            <button
              type="button"
              onClick={onLogout}
              title="Log out"
              aria-label="Log out"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-red-500/10 hover:text-red-300"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
