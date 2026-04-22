import { Shirt, ChevronLeft, ChevronRight, Camera } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { GlassPanel } from "./GlassPanel";
import { useCamera } from "./camera-context";
import { onVoiceCommand, reportCommandResult } from "./voice-events";

const outfits = [
  { name: "Aurora Coat", color: "linear-gradient(135deg, oklch(0.6 0.18 280), oklch(0.7 0.2 320))", tag: "Couture" },
  { name: "Nebula Silk", color: "linear-gradient(135deg, oklch(0.5 0.15 200), oklch(0.65 0.18 180))", tag: "Evening" },
  { name: "Solstice Knit", color: "linear-gradient(135deg, oklch(0.7 0.15 60), oklch(0.6 0.18 30))", tag: "Casual" },
];

export function VirtualTryOn() {
  const [idx, setIdx] = useState(0);
  const outfit = outfits[idx];
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
            message: `Now showing ${outfits[next].name}`,
          });
          return next;
        });
      }
    });
  }, []);

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
    <GlassPanel title="Virtual Try-On · AR" icon={<Shirt className="h-3.5 w-3.5" />} accent>
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
            {active ? "AR · Live" : "AR Preview"}
          </div>

          <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
            <div>
              <div className="text-[10px] uppercase tracking-widest text-foreground/80">{outfit.tag}</div>
              <div className="text-sm text-foreground text-glow-accent">{outfit.name}</div>
            </div>
            <div className="text-[10px] text-muted-foreground">Match · 94%</div>
          </div>

          {!active && (
            <button
              onClick={start}
              disabled={starting}
              className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full border border-primary/50 bg-background/60 px-2 py-1 text-[9px] uppercase tracking-widest text-primary backdrop-blur transition hover:bg-primary/10 disabled:opacity-60"
            >
              <Camera className="h-3 w-3" /> {starting ? "…" : "Live"}
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
