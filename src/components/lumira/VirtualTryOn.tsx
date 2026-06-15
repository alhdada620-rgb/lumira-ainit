import { Shirt, ChevronLeft, ChevronRight, Camera, Sparkles, X, Download } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { GlassPanel } from "./GlassPanel";
import { useCamera } from "./camera-context";
import { useProfile } from "./profile-context";
import { useSkin, deriveGarmentTint } from "./skin-context";
import { onVoiceCommand, onTryOnItem, reportCommandResult } from "./voice-events";
import { useT } from "./i18n";
import { useOutfit } from "./outfit-context";
import { generatePhotorealLook } from "@/lib/vton.functions";

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
  const { prompt: outfitPrompt, color: outfitColor, accent: outfitAccent, label: outfitLabel } = useOutfit();

  // Inject the live "Ask Lumira" prompt as the top dynamic outfit so the
  // text description instantly changes the clothes shown in the try-on view.
  useEffect(() => {
    if (!outfitPrompt) return;
    const incoming: DynamicOutfit = {
      name: outfitLabel || outfitPrompt,
      tag: t("tryon.askLumira") || "Ask Lumira",
      color: `linear-gradient(135deg, ${outfitColor}, ${outfitAccent})`,
    };
    setExtras((prev) => {
      if (prev[0]?.name === incoming.name) return prev;
      return [incoming, ...prev.filter((o) => o.name !== incoming.name)].slice(0, 5);
    });
    setIdx(0);
  }, [outfitPrompt, outfitColor, outfitAccent, outfitLabel, t]);

  const outfit = outfits[Math.min(idx, outfits.length - 1)] ?? outfits[0];
  const { stream, active, start, starting } = useCamera();
  const { height, weight, gender } = useProfile();
  const skin = useSkin();
  const skinTint = useMemo(() => deriveGarmentTint(skin), [skin]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [skinTuneEnabled, setSkinTuneEnabled] = useState(true);
  const skinTuneActive = skinTuneEnabled && !!skin.completedAt;

  // Photoreal generation state
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [genImage, setGenImage] = useState<string | null>(null);

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

  const captureFrame = (): string | null => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return null;
    const w = Math.min(v.videoWidth, 768);
    const h = Math.round((v.videoHeight / v.videoWidth) * w);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    // mirror to match the on-screen preview
    ctx.translate(w, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(v, 0, 0, w, h);
    return canvas.toDataURL("image/jpeg", 0.85);
  };

  const handleGenerate = async () => {
    setGenError(null);
    setGenImage(null);
    if (!active) {
      await start();
    }
    // small wait for the first frame after starting
    await new Promise((r) => setTimeout(r, 250));
    const frame = captureFrame();
    if (!frame) {
      setGenError(t("tryon.gen.noFrame") || "Camera frame not ready");
      return;
    }
    setGenerating(true);
    try {
      const baseGarment = outfit.brand
        ? `${outfit.brand} ${outfit.name} (${outfit.tag})`
        : `${outfit.name} (${outfit.tag})`;
      const skinHint = skinTuneActive
        ? `, color-matched to a skin tone profile (hydration ${skin.hydration}, smoothness ${skin.smoothness}, tone evenness ${skin.tone}) — favor a complementary hue around ${skinTint.hue.toFixed(0)}° in OKLCH for flattering contrast`
        : "";
      const res = await generatePhotorealLook({
        data: {
          userImage: frame,
          garmentPrompt: `${baseGarment}${skinHint}`,
          heightCm: height,
          weightKg: weight,
          gender,
        },
      });
      if (res.error || !res.image) {
        setGenError(res.error || "Generation failed");
      } else {
        setGenImage(res.image);
      }
    } catch (e) {
      setGenError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <GlassPanel title={t("tryon.title")} icon={<Shirt className="h-3.5 w-3.5" />} accent>
      <div className="space-y-4">
        <div
          suppressHydrationWarning
          className="relative h-44 overflow-hidden rounded-lg border border-accent/20"
        >
          <video
            suppressHydrationWarning
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

          <div
            className="absolute inset-0 transition-opacity"
            style={{ background: outfit.color, opacity: active ? 0.45 : 0.6, mixBlendMode: active ? "overlay" : "normal" }}
          />
          {/* Skin-tone driven color match overlay */}
          {skinTint.tint && skinTuneActive && (
            <div
              className="pointer-events-none absolute inset-0 transition-opacity"
              style={{
                background: skinTint.tint,
                opacity: active ? 0.22 : 0.3,
                mixBlendMode: "color",
              }}
              aria-hidden
            />
          )}
          <div className="absolute inset-0 hud-grid opacity-40" />

          {!active && (
            <svg suppressHydrationWarning viewBox="0 0 100 120" className="absolute inset-0 h-full w-full text-foreground/70">
              <circle cx="50" cy="20" r="10" fill="currentColor" opacity="0.5" />
              <path d="M30,40 L70,40 L75,90 L60,90 L55,55 L45,55 L40,90 L25,90 Z" fill="currentColor" opacity="0.5" />
            </svg>
          )}

          <div className="absolute inset-x-0 h-12 animate-scan bg-gradient-to-b from-transparent via-accent/30 to-transparent" />

          <div className="absolute start-3 top-3 flex items-center gap-1.5 rounded-full border border-accent/40 bg-background/40 px-2 py-0.5 text-[9px] uppercase tracking-widest text-accent backdrop-blur">
            <span className={`h-1 w-1 rounded-full ${active ? "bg-emerald-400" : "bg-accent"}`} />
            {active ? t("tryon.live") : t("tryon.preview")}
          </div>

          <div className="absolute bottom-3 start-3 end-3 flex items-end justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-foreground/80">{outfit.tag}</div>
              <div className="text-sm text-foreground text-glow-accent">{outfit.name}</div>
            </div>
            <div className="text-end text-[10px] text-muted-foreground">
              {skinTuneActive ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-background/40 px-2 py-0.5 text-accent backdrop-blur">
                  <span className="h-1 w-1 rounded-full bg-accent shadow-[0_0_6px_var(--accent)]" />
                  {t("tryon.skinTuned") || "Skin-tuned"}
                </span>
              ) : (
                t("tryon.match")
              )}
            </div>
          </div>

          {!active && (
            <button
              onClick={start}
              disabled={starting}
              className="absolute end-3 top-3 inline-flex items-center gap-1 rounded-full border border-primary/50 bg-background/60 px-2 py-1 text-[9px] uppercase tracking-widest text-primary backdrop-blur transition hover:bg-primary/10 disabled:opacity-60"
            >
              <Camera className="h-3 w-3" /> {starting ? t("tryon.starting") : t("tryon.live.btn")}
            </button>
          )}

          {generating && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/70 backdrop-blur-sm">
              <Sparkles className="h-5 w-5 animate-pulse text-accent" />
              <div className="text-[10px] uppercase tracking-widest text-accent">
                {t("tryon.gen.working") || "Generating photoreal look…"}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <button
            onClick={() => setIdx((i) => (i - 1 + outfits.length) % outfits.length)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-primary/30 bg-card/40 text-primary transition hover:bg-primary/10 hover:shadow-[var(--glow-soft)]"
          >
            <ChevronLeft className="h-4 w-4 rtl:-scale-x-100" />
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
            <ChevronRight className="h-4 w-4 rtl:-scale-x-100" />
          </button>
        </div>

        {/* Skin-tuned color overlay toggle */}
        <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-card/30 px-3 py-2">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-[0.25em] text-foreground/85">
              {t("tryon.skinTune.label") || "Skin-tuned color"}
            </span>
            <span className="text-[9px] text-muted-foreground">
              {!skin.completedAt
                ? (t("tryon.skinTune.needScan") || "Run a skin scan to enable")
                : skinTuneEnabled
                ? (t("tryon.skinTune.on") || "Matching garment to your skin")
                : (t("tryon.skinTune.off") || "Using original garment color")}
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={skinTuneActive}
            disabled={!skin.completedAt}
            onClick={() => setSkinTuneEnabled((v) => !v)}
            className={`relative h-5 w-9 shrink-0 rounded-full border transition-all ${
              skinTuneActive
                ? "border-accent/60 bg-accent/30 shadow-[var(--glow-accent)]"
                : "border-border/40 bg-muted/30"
            } ${!skin.completedAt ? "cursor-not-allowed opacity-50" : "cursor-pointer"}`}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full transition-all ${
                skinTuneActive ? "start-[18px] bg-accent shadow-[0_0_8px_var(--accent)]" : "start-0.5 bg-muted-foreground"
              }`}
            />
          </button>
        </div>

        {/* Photoreal CTA */}
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="group relative w-full overflow-hidden rounded-lg border border-accent/50 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 px-3 py-2 text-[11px] uppercase tracking-[0.2em] text-foreground backdrop-blur transition hover:shadow-[var(--glow-accent)] disabled:opacity-60"
        >
          <span className="inline-flex items-center justify-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            {generating
              ? (t("tryon.gen.working") || "Generating…")
              : (t("tryon.gen.cta") || "Generate photoreal look")}
          </span>
        </button>

        {genError && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 px-2 py-1 text-[10px] text-destructive">
            {genError}
          </div>
        )}

        {genImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-md">
            <div className="relative max-h-[90vh] w-full max-w-md overflow-hidden rounded-xl border border-accent/40 bg-card shadow-[var(--glow-accent)]">
              <img src={genImage} alt={outfit.name} className="h-auto w-full object-contain" />
              <div className="flex items-center justify-between gap-2 border-t border-accent/20 bg-background/60 p-3">
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground truncate">
                  {outfit.brand ? `${outfit.brand} · ` : ""}{outfit.name}
                </div>
                <div className="flex gap-2">
                  <a
                    href={genImage}
                    download={`lumira-tryon-${Date.now()}.png`}
                    className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-card/40 px-2 py-1 text-[10px] uppercase tracking-widest text-primary hover:bg-primary/10"
                  >
                    <Download className="h-3 w-3" /> Save
                  </a>
                  <button
                    onClick={() => setGenImage(null)}
                    className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-card/40 px-2 py-1 text-[10px] uppercase tracking-widest text-accent hover:bg-accent/10"
                  >
                    <X className="h-3 w-3" /> Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </GlassPanel>
  );
}
