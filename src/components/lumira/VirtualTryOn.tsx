import { Shirt, ChevronLeft, ChevronRight, Camera } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { GlassPanel } from "./GlassPanel";
import { useCamera } from "./camera-context";
import { onVoiceCommand, onTryOnItem, reportCommandResult } from "./voice-events";
import { useT } from "./i18n";

interface OutfitItem {
  nameKey: string;
  tagKey: string;
  color: string;
  brand?: string;
}

const defaultOutfits: OutfitItem[] = [
  { nameKey: "tryon.outfit.aurora", tagKey: "tryon.outfit.aurora.tag", color: "linear-gradient(135deg, oklch(0.6 0.18 280), oklch(0.7 0.2 320))" },
  { nameKey: "tryon.outfit.nebula", tagKey: "tryon.outfit.nebula.tag", color: "linear-gradient(135deg, oklch(0.5 0.15 200), oklch(0.65 0.18 180))" },
  { nameKey: "tryon.outfit.solstice", tagKey: "tryon.outfit.solstice.tag", color: "linear-gradient(135deg, oklch(0.7 0.15 60), oklch(0.6 0.18 30))" },
];

interface DynamicOutfit {
  name: string;
  tag: string;
  color: string;
  brand?: string;
}

export function VirtualTryOn() {
  const { t } = useT();
  const [presets] = useState<OutfitItem[]>(defaultOutfits);
  const [extras, setExtras] = useState<DynamicOutfit[]>([]);
  const outfits = useMemo<DynamicOutfit[]>(
    () => [
      ...extras,
      ...presets.map((p) => ({ name: t(p.nameKey), tag: t(p.tagKey), color: p.color })),
    ],
    [extras, presets, t],
  );
  const [idx, setIdx] = useState(0);
  const outfit = outfits[Math.min(idx, outfits.length - 1)] ?? outfits[0];
  const { stream, active, start, starting } = useCamera();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Voice / preset command integration
  useEffect(() => {
    return onVoiceCommand((cmd, source) => {
      if (cmd === "next-outfit") {
        setIdx((i) => {
          const next = (i + 1) % outfits.length;
          reportCommandResult({
            command: cmd, source, status: "success",
            message: t("tryon.cmd.nowShowing", { name: outfits[next].name }),
          });
          return next;
        });
      }
    });
  }, [outfits, t]);

  // Wardrobe item selection — inject into the carousel and focus it
  useEffect(() => {
    return onTryOnItem((item, source) => {
      const incoming: DynamicOutfit = {
        name: item.name,
        color: item.gradient,
        tag: `${item.brand} · ${item.tag}`,
        brand: item.brand,
      };
      setExtras((prev) => {
        const existing = prev.findIndex((o) => o.name === incoming.name);
        if (existing >= 0) {
          setIdx(existing);
          return prev;
        }
        const next = [incoming, ...prev].slice(0, 5);
        setIdx(0);
        return next;
      });
      reportCommandResult({
        command: "try-on-item", source, status: "success",
        message: t("tryon.cmd.trying", { brand: item.brand, name: item.name }),
      });
    });
  }, [t]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (stream) {
      v.srcObject = stream;
      v.play().catch(() => {});
    } else {
      v.srcObject = null;
    }
  }, [stream]);

  return (
    <GlassPanel title={t("tryon.title")} icon={<Shirt className="h-3.5 w-3.5" />} accent>
      <div className="space-y-4">
        <div className="relative h-44 overflow-hidden rounded-lg border border-accent/20">
          {/* Live camera feed */}
          <video
            ref={videoRef}
            playsInline
            muted
            className="absolute inset-0 h-full w-full object-cover"
            style={{
              transform: "scaleX(-1)",
              filter: "brightness(1.05) saturate(1.1)",
              opacity: active ? 1 : 0,
              transition: "opacity 0.5s ease",
            }}
          />

          {/* Outfit gradient overlay */}
          <div
            className="absolute inset-0 transition-opacity"
            style={{ background: outfit.color, opacity: active ? 0.45 : 0.6, mixBlendMode: active ? "overlay" : "normal" }}
          />
          <div className="absolute inset-0 hud-grid opacity-40" />

          {/* mannequin silhouette - only when no camera */}
          {!active && (
            <svg viewBox="0 0 100 120" className="absolute inset-0 h-full w-full text-foreground/70">
              <circle cx="50" cy="20" r="10" fill="currentColor" opacity="0.5" />
              <path d="M30,40 L70,40 L75,90 L60,90 L55,55 L45,55 L40,90 L25,90 Z" fill="currentColor" opacity="0.5" />
            </svg>
          )}

          {/* scan line */}
          <div className="absolute inset-x-0 h-12 animate-scan bg-gradient-to-b from-transparent via-accent/30 to-transparent" />

          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-accent/40 bg-background/40 px-2 py-0.5 text-[9px] uppercase tracking-widest text-accent backdrop-blur">
            <span className={`h-1 w-1 rounded-full ${active ? "bg-emerald-400" : "bg-accent"}`} />
            {active ? t("tryon.live") : t("tryon.preview")}
          </div>

          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-foreground/80">{outfit.tag}</div>
              <div className="text-sm text-foreground text-glow-accent">{outfit.name}</div>
            </div>
            <div className="text-[10px] text-muted-foreground">{t("tryon.match")}</div>
          </div>

          {!active && (
            <button
              onClick={start}
              disabled={starting}
              className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-primary/50 bg-background/60 px-2 py-1 text-[9px] uppercase tracking-widest text-primary backdrop-blur transition hover:bg-primary/10 disabled:opacity-60"
            >
              <Camera className="h-3 w-3" /> {starting ? t("tryon.starting") : t("tryon.live.btn")}
            </button>
          )}
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => setIdx((i) => (i - 1 + outfits.length) % outfits.length)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/30 bg-card/40 text-primary transition hover:bg-primary/10 hover:shadow-[var(--glow-soft)]"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div className="flex gap-1.5">
            {outfits.map((_, i) => (
              <span key={i} className={`h-1 w-6 rounded-full transition-all ${i === idx ? "bg-accent shadow-[0_0_8px_var(--accent)]" : "bg-muted"}`} />
            ))}
          </div>
          <button
            onClick={() => setIdx((i) => (i + 1) % outfits.length)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/30 bg-card/40 text-primary transition hover:bg-primary/10 hover:shadow-[var(--glow-soft)]"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </GlassPanel>
  );
}
