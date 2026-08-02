"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import {
  KeyRound,
  LogIn,
  Sparkles,
  User as UserIcon,
  UserPlus,
} from "lucide-react";
import { getUser, login, setUser, signup } from "@/lib/auth";
import { HudCorners } from "@/app/components/HudCorners";

const Hologram = dynamic(() => import("@/app/components/Hologram"), {
  ssr: false,
});

type AuthMode = "login" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [checking, setChecking] = useState(true);

  // Already signed in? Skip straight to the chat.
  useEffect(() => {
    if (getUser()) {
      router.replace("/");
    } else {
      setChecking(false);
    }
  }, [router]);

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError("");
    setSuccess("");
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = name.trim();
    setError("");
    setSuccess("");

    if (!trimmed || !password) {
      setError("Enter both a username and a password to continue.");
      return;
    }

    if (mode === "signup") {
      if (password !== confirm) {
        setError("Passwords do not match.");
        return;
      }
      const result = signup(trimmed, password);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      // Account created — take the user to the login step so they can sign in.
      setMode("login");
      setPassword("");
      setConfirm("");
      setSuccess(
        `Account "${trimmed}" created. Now sign in with your credentials.`,
      );
      return;
    }

    const result = login(trimmed, password);
    if (!result.ok) {
      setError(
        `${result.error} If the account was not created with that name, sign up again to recreate it.`,
      );
      return;
    }
    setUser(trimmed);
    router.replace("/");
  };

  if (checking) {
    return (
      <div className="cyber-bg flex h-dvh items-center justify-center">
        <div className="neon-orb h-12 w-12 animate-soft-pulse rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="cyber-bg relative flex h-dvh flex-col overflow-hidden">
      {/* Background layers */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="starfield absolute inset-0" />
        <div className="neon-grid absolute inset-x-[-12%] bottom-0 h-72 opacity-80" />
        <div className="scanlines absolute inset-0 opacity-70" />
      </div>
      <Hologram />

      <div className="relative z-10 flex flex-1 items-center justify-center px-4">
        <div className="neon-panel neon-border relative w-full max-w-sm rounded-2xl p-7">
          <HudCorners />

          <div className="mb-6 flex flex-col items-center text-center">
            <div className="neon-orb relative mb-4 flex h-14 w-14 items-center justify-center rounded-2xl">
              <Sparkles className="h-6 w-6 animate-soft-pulse text-white" />
            </div>
            <h1 className="font-display text-2xl font-bold text-cyan-100">
              STREAM<span className="text-fuchsia-400">AI</span>
            </h1>
            <p className="hud-label mt-1.5 text-[10px] text-zinc-500">
              Neural interface ·{" "}
              {mode === "login" ? "Sign in" : "Create account"}
            </p>
          </div>

          {/* Login / Signup toggle */}
          <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-white/[0.03] p-1">
            {(["login", "signup"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => switchMode(option)}
                aria-pressed={mode === option}
                className={`hud-label rounded-lg px-3 py-2 text-[10px] font-semibold transition-all duration-200 ${
                  mode === option
                    ? "bg-gradient-to-br from-cyan-500 to-fuchsia-500 text-white shadow-[0_0_16px_-4px_rgb(34_211_238/0.8)]"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                {option === "login" ? "Login" : "Sign up"}
              </button>
            ))}
          </div>

          <form onSubmit={onSubmit} className="space-y-3.5">
            <div className="relative">
              <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-400/60" />
              <input
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setError("");
                }}
                placeholder="Username"
                autoComplete="username"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-9 pr-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-all focus:border-cyan-400/50 focus:shadow-[0_0_20px_-6px_rgb(34_211_238/0.5)]"
              />
            </div>
            <div className="relative">
              <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-400/60" />
              <input
                type="password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError("");
                }}
                placeholder="Password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-9 pr-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-all focus:border-cyan-400/50 focus:shadow-[0_0_20px_-6px_rgb(34_211_238/0.5)]"
              />
            </div>
            {mode === "signup" && (
              <div className="relative">
                <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-400/60" />
                <input
                  type="password"
                  value={confirm}
                  onChange={(event) => {
                    setConfirm(event.target.value);
                    setError("");
                  }}
                  placeholder="Confirm password"
                  autoComplete="new-password"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-9 pr-3 text-sm text-zinc-100 placeholder-zinc-500 outline-none transition-all focus:border-cyan-400/50 focus:shadow-[0_0_20px_-6px_rgb(34_211_238/0.5)]"
                />
              </div>
            )}

            {error && <p className="text-xs text-red-400">{error}</p>}
            {success && (
              <p className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-300">
                {success}
              </p>
            )}

            <button
              type="submit"
              className="hud-label inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-cyan-500 via-indigo-500 to-fuchsia-500 px-4 py-3 text-[11px] font-bold text-white shadow-[0_0_24px_-6px_rgb(34_211_238/0.8)] transition-all duration-200 hover:shadow-[0_0_34px_-6px_rgb(236_72_153/0.9)]"
            >
              {mode === "login" ? (
                <>
                  <LogIn className="h-4 w-4" />
                  Sign in
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Create account
                </>
              )}
            </button>
          </form>

          <p className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-zinc-600">
            Developed by{" "}
            <span className="font-medium text-cyan-300">Muhammad Asif Nawaz</span>
          </p>
        </div>
      </div>
    </div>
  );
}
