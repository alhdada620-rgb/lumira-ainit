import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

export type SkinProfile = {
  hydration: number;
  smoothness: number;
  tone: number;
  /** ms since epoch when scan completed; null = no completed scan yet */
  completedAt: number | null;
};

type Ctx = SkinProfile & {
  setSkinProfile: (p: Omit<SkinProfile, "completedAt">) => void;
  clearSkinProfile: () => void;
};

const SkinContext = createContext<Ctx | null>(null);

export function SkinProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<SkinProfile>({
    hydration: 0,
    smoothness: 0,
    tone: 0,
    completedAt: null,
  });

  const setSkinProfile = useCallback((p: Omit<SkinProfile, "completedAt">) => {
    setProfile({ ...p, completedAt: Date.now() });
  }, []);

  const clearSkinProfile = useCallback(() => {
    setProfile({ hydration: 0, smoothness: 0, tone: 0, completedAt: null });
  }, []);

  const value = useMemo<Ctx>(
    () => ({ ...profile, setSkinProfile, clearSkinProfile }),
    [profile, setSkinProfile, clearSkinProfile],
  );

  return <SkinContext.Provider value={value}>{children}</SkinContext.Provider>;
}

export function useSkin(): Ctx {
  const ctx = useContext(SkinContext);
  if (!ctx) {
    // Safe fallback so components don't crash if provider is missing.
    return {
      hydration: 0,
      smoothness: 0,
      tone: 0,
      completedAt: null,
      setSkinProfile: () => {},
      clearSkinProfile: () => {},
    };
  }
  return ctx;
}

/**
 * Map a skin "tone" metric (0-100, higher = more even/lighter in our sim)
 * to a warm/cool hue bias that flatters the user, plus a chroma boost
 * derived from hydration (more hydrated skin → richer fabric saturation).
 *
 * Returns a CSS gradient that can be layered/overlaid on a garment color.
 */
export function deriveGarmentTint({
  hydration,
  smoothness,
  tone,
  completedAt,
}: SkinProfile): { tint: string | null; hue: number; chroma: number; lightness: number } {
  if (!completedAt) return { tint: null, hue: 0, chroma: 0, lightness: 0 };

  // tone 0..100 → hue range from warm (30 = amber) to cool (220 = teal)
  const hue = 30 + ((100 - tone) / 100) * 190;
  // hydration drives chroma (saturation) 0.06..0.18
  const chroma = 0.06 + (hydration / 100) * 0.12;
  // smoothness lifts lightness slightly 0.55..0.75
  const lightness = 0.55 + (smoothness / 100) * 0.2;

  const c1 = `oklch(${lightness.toFixed(3)} ${chroma.toFixed(3)} ${hue.toFixed(1)})`;
  const c2 = `oklch(${(lightness - 0.08).toFixed(3)} ${chroma.toFixed(3)} ${(hue + 25).toFixed(1)})`;
  const tint = `linear-gradient(135deg, ${c1}, ${c2})`;
  return { tint, hue, chroma, lightness };
}
