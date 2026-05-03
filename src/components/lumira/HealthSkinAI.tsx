import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { GlassPanel } from "./GlassPanel";
import { useT } from "./i18n";
import skinScan from "@/assets/skin-scan.jpg";

function jitter(base: number, range = 3, min = 0, max = 100) {
  const v = base + (Math.random() - 0.5) * range * 2;
  return Math.max(min, Math.min(max, v));
}

function Ring({
  value,
  color,
  label,
}: {
  value: number;
  color: string;
  label: string;
}) {
  const radius = 32;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (value / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative">
        <svg width="78" height="78" viewBox="0 0 78 78">
          <circle
            cx="39"
            cy="39"
            r={radius}
            stroke="oklch(1 0 0 / 0.08)"
            strokeWidth="5"
            fill="none"
          />
          <circle
            cx="39"
            cy="39"
            r={radius}
            stroke={color}
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            transform="rotate(-90 39 39)"
            style={{
              filter: `drop-shadow(0 0 8px ${color})`,
              transition: "stroke-dashoffset 1s ease",
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-light tabular-nums text-foreground text-glow">
            {value}
          </span>
        </div>
      </div>
      <span className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

export function HealthSkinAI() {
  const { lang } = useT();
  const isAr = lang === "ar";

  const [hydration, setHydration] = useState(87);
  const [smoothness, setSmoothness] = useState(92);
  const [tone, setTone] = useState(78);
  const [scanPct, setScanPct] = useState(98.2);

  useEffect(() => {
    const id = setInterval(() => {
      setHydration((v) => Math.round(jitter(v, 2, 78, 95)));
      setSmoothness((v) => Math.round(jitter(v, 2, 82, 97)));
      setTone((v) => Math.round(jitter(v, 2, 70, 88)));
      setScanPct((v) => +jitter(v, 0.4, 96.5, 99.4).toFixed(1));
    }, 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <GlassPanel
      title={isAr ? "تحليل البشرة بالذكاء" : "AI Skin Analysis"}
      icon={<Sparkles className="h-3.5 w-3.5" />}
    >
      <div className="-mt-1 mb-3 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        {isAr ? "فحص جلدي · v3.2" : "Dermal scan · v3.2"}
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-4">
        {/* Scan image */}
        <div className="relative overflow-hidden rounded-2xl border border-primary/30 shadow-[0_0_24px_oklch(0.85_0.15_200/0.25)_inset]">
          <img
            src={skinScan}
            alt={isAr ? "تصوير تحليل البشرة" : "Skin analysis scan"}
            width={768}
            height={1024}
            loading="lazy"
            className="h-56 w-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
          {/* scan line */}
          <div
            className="pointer-events-none absolute inset-x-0 h-px bg-primary/80"
            style={{
              top: "50%",
              boxShadow: "0 0 14px var(--primary)",
              animation: "scan-line 3.6s linear infinite",
            }}
          />
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] uppercase tracking-widest">
            <span className="text-primary text-glow">
              {isAr ? "جارٍ الفحص..." : "Scanning..."}
            </span>
            <span className="text-accent tabular-nums">{scanPct}%</span>
          </div>
        </div>

        {/* Rings */}
        <div className="flex flex-col items-center justify-between gap-2 py-1">
          <Ring
            value={hydration}
            color="oklch(0.82 0.14 195)"
            label={isAr ? "ترطيب" : "Hydration"}
          />
          <Ring
            value={smoothness}
            color="oklch(0.85 0.15 165)"
            label={isAr ? "نعومة" : "Smoothness"}
          />
          <Ring
            value={tone}
            color="oklch(0.78 0.12 15)"
            label={isAr ? "تجانس اللون" : "Tone Evenness"}
          />
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-accent/30 bg-accent/5 p-3">
        <p className="text-xs text-foreground/85">
          <span className="font-semibold text-accent">
            {isAr ? "توصية:" : "Recommendation:"}
          </span>{" "}
          {isAr
            ? "ضع سيروم حمض الهيالورونيك الليلة. التعرض للأشعة منخفض."
            : "Apply hyaluronic serum tonight. UV exposure low."}
        </p>
      </div>
    </GlassPanel>
  );
}
