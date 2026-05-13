import { createContext, useContext, useState, type ReactNode } from "react";

interface OutfitState {
  prompt: string;
  color: string; // CSS color
  accent: string;
  label: string;
}

interface OutfitCtx extends OutfitState {
  applyPrompt: (prompt: string) => void;
  reset: () => void;
}

const DEFAULT: OutfitState = {
  prompt: "",
  color: "oklch(0.45 0.08 230)",
  accent: "oklch(0.7 0.12 230)",
  label: "",
};

// Map of color words → oklch values
const COLOR_MAP: Record<string, [string, string]> = {
  red:    ["oklch(0.55 0.22 25)",  "oklch(0.78 0.18 25)"],
  pink:   ["oklch(0.7 0.18 350)",  "oklch(0.85 0.12 350)"],
  blue:   ["oklch(0.45 0.18 240)", "oklch(0.7 0.15 240)"],
  navy:   ["oklch(0.28 0.1 250)",  "oklch(0.5 0.1 250)"],
  green:  ["oklch(0.55 0.18 150)", "oklch(0.78 0.15 150)"],
  black:  ["oklch(0.18 0.01 260)", "oklch(0.35 0.01 260)"],
  white:  ["oklch(0.95 0.01 260)", "oklch(0.85 0.01 260)"],
  gold:   ["oklch(0.7 0.16 85)",   "oklch(0.88 0.15 90)"],
  silver: ["oklch(0.78 0.02 250)", "oklch(0.92 0.02 250)"],
  purple: ["oklch(0.5 0.2 300)",   "oklch(0.72 0.18 300)"],
  yellow: ["oklch(0.85 0.18 95)",  "oklch(0.92 0.15 100)"],
  orange: ["oklch(0.7 0.18 60)",   "oklch(0.85 0.15 65)"],
  beige:  ["oklch(0.82 0.05 80)",  "oklch(0.9 0.04 80)"],
  brown:  ["oklch(0.4 0.07 50)",   "oklch(0.55 0.07 50)"],
  أحمر:   ["oklch(0.55 0.22 25)",  "oklch(0.78 0.18 25)"],
  أزرق:   ["oklch(0.45 0.18 240)", "oklch(0.7 0.15 240)"],
  أخضر:   ["oklch(0.55 0.18 150)", "oklch(0.78 0.15 150)"],
  أسود:   ["oklch(0.18 0.01 260)", "oklch(0.35 0.01 260)"],
  أبيض:   ["oklch(0.95 0.01 260)", "oklch(0.85 0.01 260)"],
  ذهبي:   ["oklch(0.7 0.16 85)",   "oklch(0.88 0.15 90)"],
  وردي:   ["oklch(0.7 0.18 350)",  "oklch(0.85 0.12 350)"],
};

const Ctx = createContext<OutfitCtx | null>(null);

export function OutfitProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<OutfitState>(DEFAULT);

  function applyPrompt(prompt: string) {
    const lower = prompt.toLowerCase();
    let match: [string, string] | null = null;
    for (const key of Object.keys(COLOR_MAP)) {
      if (lower.includes(key)) {
        match = COLOR_MAP[key];
        break;
      }
    }
    const [color, accent] = match ?? [DEFAULT.color, DEFAULT.accent];
    setState({ prompt, color, accent, label: prompt.trim().slice(0, 60) });
  }

  function reset() { setState(DEFAULT); }

  return (
    <Ctx.Provider value={{ ...state, applyPrompt, reset }}>{children}</Ctx.Provider>
  );
}

export function useOutfit() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useOutfit must be used inside OutfitProvider");
  return ctx;
}
