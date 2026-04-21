import { Sparkles, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { GlassPanel } from "./GlassPanel";
import { useServerFn } from "@tanstack/react-start";
import { generateSkinInsight } from "@/utils/skin-insight.functions";

type MetricKey = "hydration" | "smoothness" | "skinTone";

const metricConfig: { label: string; key: MetricKey; color: string }[] = [
  { label: "Hydration", key: "hydration", color: "oklch(0.8 0.15 200)" },
  { label: "Smoothness", key: "smoothness", color: "oklch(0.8 0.18 160)" },
  { label: "Skin Tone", key: "skinTone", color: "oklch(0.78 0.18 320)" },
];

const initialValues: Record<MetricKey, number> = {
  hydration: 87,
  smoothness: 92,
  skinTone: 78,
};

function CircularGauge({
  value,
  color,
  label,
  onClick,
}: {
  value: number;
  color: string;
  label: string;
  onClick: () => void;
}) {
  const circumference = 2 * Math.PI * 32;
  const offset = circumference - (value / 100) * circumference;
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-center gap-2 rounded-lg p-1 transition hover:bg-accent/5 focus:outline-none focus-visible:ring-1 focus-visible:ring-accent/40"
      title={`Tap to simulate a new ${label} reading`}
      aria-label={`Simulate new ${label} reading. Current value ${value}`}
    >
      <div className="relative h-20 w-20">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="32" fill="none" stroke="oklch(0.3 0.04 230 / 0.4)" strokeWidth="4" />
          <circle
            cx="40" cy="40" r="32" fill="none" stroke={color} strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: "stroke-dashoffset 0.8s ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-light text-foreground text-glow transition group-hover:scale-110">
            {value}
          </span>
        </div>
      </div>
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground group-hover:text-accent">
        {label}
      </span>
    </button>
  );
}

export function SkinAnalysis() {
  const generate = useServerFn(generateSkinInsight);
  const [values, setValues] = useState<Record<MetricKey, number>>(initialValues);
  const [insight, setInsight] = useState<string>("Analyzing your skin profile…");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reqIdRef = useRef(0);

  const fetchInsight = async (next: Record<MetricKey, number>) => {
    const myReq = ++reqIdRef.current;
    setLoading(true);
    setError(null);
    try {
      const res = await generate({ data: next });
      if (myReq !== reqIdRef.current) return;
      setInsight(res.insight);
      setError(res.error);
    } catch (e) {
      if (myReq !== reqIdRef.current) return;
      console.error(e);
      setInsight("Unable to generate insight right now.");
      setError("network_error");
    } finally {
      if (myReq === reqIdRef.current) setLoading(false);
    }
  };

  // Debounce AI calls so rapid taps don't spam the gateway
  useEffect(() => {
    const t = setTimeout(() => {
      fetchInsight(values);
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values]);

  const simulate = (key: MetricKey) => {
    setValues((prev) => {
      const current = prev[key];
      let next = current;
      let tries = 0;
      while (next === current && tries < 5) {
        const delta = Math.round((Math.random() - 0.5) * 30);
        next = Math.max(40, Math.min(99, current + delta));
        tries++;
      }
      return { ...prev, [key]: next };
    });
  };

  return (
    <GlassPanel title="AI Skin Analysis" icon={<Sparkles className="h-3.5 w-3.5" />} accent>
      <div className="flex justify-around">
        {metricConfig.map((m) => (
          <CircularGauge
            key={m.key}
            value={values[m.key]}
            color={m.color}
            label={m.label}
            onClick={() => simulate(m.key)}
          />
        ))}
      </div>
      <p className="mt-2 text-center text-[9px] uppercase tracking-widest text-muted-foreground/60">
        Tap a gauge to simulate a new reading
      </p>
      <div className="mt-5 rounded-md border border-accent/20 bg-accent/5 p-3">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs leading-relaxed text-muted-foreground">
            <span className="text-accent">AI Insight:</span>{" "}
            {loading ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1 w-1 animate-pulse rounded-full bg-accent" />
                <span className="h-1 w-1 animate-pulse rounded-full bg-accent [animation-delay:150ms]" />
                <span className="h-1 w-1 animate-pulse rounded-full bg-accent [animation-delay:300ms]" />
                <span className="ml-1">Lumira is thinking…</span>
              </span>
            ) : (
              insight
            )}
          </p>
          <button
            onClick={() => fetchInsight(values)}
            disabled={loading}
            className="shrink-0 rounded-full p-1 text-accent/70 transition hover:bg-accent/10 hover:text-accent disabled:opacity-40"
            title="Refresh insight"
            aria-label="Refresh insight"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
        {error && !loading && (
          <p className="mt-1.5 text-[10px] uppercase tracking-widest text-destructive/70">
            {error === "rate_limit" && "Rate limited · retry soon"}
            {error === "payment_required" && "AI credits exhausted"}
            {error === "missing_key" && "AI not configured"}
            {(error === "gateway_error" || error === "network_error") && "Service unavailable"}
          </p>
        )}
      </div>
    </GlassPanel>
  );
}
