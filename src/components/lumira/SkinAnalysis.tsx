import { Sparkles, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { GlassPanel } from "./GlassPanel";
import { useServerFn } from "@tanstack/react-start";
import { generateSkinInsight } from "@/utils/skin-insight.functions";

const metrics = [
  { label: "Hydration", key: "hydration" as const, value: 87, color: "oklch(0.8 0.15 200)" },
  { label: "Smoothness", key: "smoothness" as const, value: 92, color: "oklch(0.8 0.18 160)" },
  { label: "Skin Tone", key: "skinTone" as const, value: 78, color: "oklch(0.78 0.18 320)" },
];

function CircularGauge({ value, color, label }: { value: number; color: string; label: string }) {
  const circumference = 2 * Math.PI * 32;
  const offset = circumference - (value / 100) * circumference;
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative h-20 w-20">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="32" fill="none" stroke="oklch(0.3 0.04 230 / 0.4)" strokeWidth="4" />
          <circle
            cx="40" cy="40" r="32" fill="none" stroke={color} strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: "stroke-dashoffset 1s ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-light text-foreground text-glow">{value}</span>
        </div>
      </div>
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
    </div>
  );
}

export function SkinAnalysis() {
  const generate = useServerFn(generateSkinInsight);
  const [insight, setInsight] = useState<string>("Analyzing your skin profile…");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsight = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await generate({
        data: {
          hydration: metrics[0].value,
          smoothness: metrics[1].value,
          skinTone: metrics[2].value,
        },
      });
      setInsight(res.insight);
      setError(res.error);
    } catch (e) {
      console.error(e);
      setInsight("Unable to generate insight right now.");
      setError("network_error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsight();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <GlassPanel title="AI Skin Analysis" icon={<Sparkles className="h-3.5 w-3.5" />} accent>
      <div className="flex justify-around">
        {metrics.map((m) => (
          <CircularGauge key={m.label} value={m.value} color={m.color} label={m.label} />
        ))}
      </div>
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
            onClick={fetchInsight}
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
