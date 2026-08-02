import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        "soft-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.45" },
        },
        "float-y": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        sheen: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "ring-spin": {
          to: { transform: "rotate(360deg)" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
        flicker: {
          "0%, 93%, 100%": { opacity: "1" },
          "94%": { opacity: "0.55" },
          "96%": { opacity: "0.85" },
          "97%": { opacity: "0.6" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.35s ease-out both",
        "fade-in-up": "fade-in-up 0.45s cubic-bezier(0.22, 1, 0.36, 1) both",
        blink: "blink 1s step-end infinite",
        "soft-pulse": "soft-pulse 2.2s ease-in-out infinite",
        "float-y": "float-y 5s ease-in-out infinite",
        sheen: "sheen 6s linear infinite",
        "ring-spin": "ring-spin 14s linear infinite",
        "glow-pulse": "glow-pulse 2.4s ease-in-out infinite",
        flicker: "flicker 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
