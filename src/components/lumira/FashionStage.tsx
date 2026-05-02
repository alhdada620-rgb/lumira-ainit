import { useState } from "react";
import { GlassPanel } from "./GlassPanel";
import { Sparkles } from "lucide-react";
import avatarImg from "@/assets/lumira-avatar.jpg";
import { useT } from "./i18n";

interface Brand {
  id: string;
  name: string;
  tint: string;
  outfit: string;
}

const BRANDS: Brand[] = [
  { id: "hm", name: "H&M", tint: "linear-gradient(135deg, oklch(0.55 0.2 25 / 0.55), oklch(0.4 0.15 25 / 0.4))", outfit: "Casual Crew" },
  { id: "nike", name: "NIKE", tint: "linear-gradient(135deg, oklch(0.5 0.1 230 / 0.55), oklch(0.3 0.05 230 / 0.45))", outfit: "Sporty Tech Fleece" },
  { id: "zara", name: "ZARA", tint: "linear-gradient(135deg, oklch(0.35 0.04 60 / 0.55), oklch(0.2 0.02 60 / 0.45))", outfit: "Minimal Tailoring" },
  { id: "namshi", name: "NAMSHI", tint: "linear-gradient(135deg, oklch(0.6 0.18 320 / 0.5), oklch(0.4 0.12 280 / 0.4))", outfit: "Modern Abaya" },
  { id: "adidas", name: "ADIDAS", tint: "linear-gradient(135deg, oklch(0.45 0.08 250 / 0.55), oklch(0.25 0.04 250 / 0.45))", outfit: "Track Suit" },
  { id: "sephora", name: "SEPHORA", tint: "linear-gradient(135deg, oklch(0.6 0.2 0 / 0.5), oklch(0.4 0.18 350 / 0.4))", outfit: "Beauty Glow" },
];

export function FashionStage() {
  const { lang } = useT();
  const isAr = lang === "ar";
  const [active, setActive] = useState(0);
  const [progress, setProgress] = useState(0);
  const [trying, setTrying] = useState(false);
  const brand = BRANDS[active];

  const tryOn = () => {
    if (trying) return;
    setTrying(true);
    setProgress(0);
    const start = Date.now();
    const id = setInterval(() => {
      const p = Math.min(100, ((Date.now() - start) / 1500) * 100);
      setProgress(p);
      if (p >= 100) {
        clearInterval(id);
        setTimeout(() => setTrying(false), 400);
      }
    }, 50);
  };

  return (
    <GlassPanel
      title={isAr ? "فيديو الواقع المعزز" : "AR Video"}
      icon={<Sparkles className="h-3.5 w-3.5" />}
      accent
      className="lg:col-span-1"
    >
      <div className="space-y-4">
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl border border-accent/30 bg-background/40">
          <div className="pointer-events-none absolute -inset-px rounded-xl shadow-[var(--glow-primary)]" />
          <div className="absolute inset-0 hud-grid opacity-25" />

          <img
            src={avatarImg}
            alt="Lumira virtual model"
            className="absolute inset-0 h-full w-full object-cover transition-all duration-500"
            style={{ filter: "brightness(1.05) contrast(1.05) saturate(1.05)" }}
            loading="lazy"
            width={512}
            height={768}
          />

          {/* outfit tint overlay */}
          <div
            key={brand.id}
            className="pointer-events-none absolute inset-0 transition-opacity duration-700"
            style={{ background: brand.tint, mixBlendMode: "overlay", opacity: 0.85 }}
          />

          {/* brand logo watermark on chest */}
          <div
            key={`wm-${brand.id}`}
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 text-2xl font-extrabold tracking-[0.15em] text-foreground/85 text-glow-accent drop-shadow-[0_0_12px_rgba(0,0,0,0.6)] animate-fade-in"
          >
            {brand.name}
          </div>

          {/* outfit name badge */}
          <div
            key={`of-${brand.id}`}
            className="absolute bottom-12 left-1/2 -translate-x-1/2 rounded-full border border-accent/50 bg-background/70 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-accent backdrop-blur animate-fade-in shadow-[var(--glow-accent)]"
          >
            {brand.outfit}
          </div>

          {/* AR tag */}
          <div className="absolute start-3 top-3 flex items-center gap-1 rounded border border-primary/40 bg-background/60 px-2 py-0.5 text-[9px] uppercase tracking-widest text-primary backdrop-blur">
            <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
            AR
          </div>

          {/* corner deco */}
          <div className="pointer-events-none absolute end-3 top-3 h-6 w-6 border-e border-t border-accent/60 rounded-se-md" />
          <div className="pointer-events-none absolute start-3 bottom-3 h-6 w-6 border-s border-b border-accent/60 rounded-es-md" />

          {/* scan line */}
          {trying && (
            <div className="pointer-events-none absolute inset-x-0 h-12 animate-scan bg-gradient-to-b from-transparent via-accent/40 to-transparent" />
          )}

          {/* progress bar */}
          {trying && (
            <div className="absolute bottom-3 left-3 right-3 rounded-full border border-accent/30 bg-background/70 p-0.5 backdrop-blur">
              <div
                className="h-1.5 rounded-full bg-gradient-to-r from-primary to-accent transition-all"
                style={{ width: `${progress}%`, boxShadow: "0 0 8px var(--accent)" }}
              />
            </div>
          )}
        </div>

        <button
          onClick={tryOn}
          disabled={trying}
          className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-full border border-primary/50 bg-gradient-to-r from-primary/30 via-accent/20 to-primary/30 px-5 py-2.5 text-xs uppercase tracking-[0.4em] text-foreground shadow-[var(--glow-soft)] transition hover:shadow-[var(--glow-primary)] active:scale-[0.98] disabled:opacity-70"
        >
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-foreground/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          <Sparkles className="h-3.5 w-3.5" />
          {trying
            ? isAr ? `جاري التركيب… ${Math.round(progress)}%` : `Fitting… ${Math.round(progress)}%`
            : isAr ? "جرّب الآن" : "Try On"}
        </button>

        {/* Brand carousel */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto rounded-lg border border-primary/20 bg-card/40 p-2">
          {BRANDS.map((b, i) => {
            const isActive = i === active;
            return (
              <button
                key={b.id}
                onClick={() => { setActive(i); tryOn(); }}
                title={b.outfit}
                className={`relative shrink-0 rounded-md px-3 py-2 text-[11px] font-bold tracking-widest transition-all active:scale-95 ${
                  isActive
                    ? "border border-accent/60 bg-accent/15 text-accent shadow-[var(--glow-accent)]"
                    : "border border-primary/15 bg-background/30 text-muted-foreground hover:border-primary/40 hover:text-primary"
                }`}
              >
                {b.name}
              </button>
            );
          })}
        </div>
      </div>
    </GlassPanel>
  );
}
