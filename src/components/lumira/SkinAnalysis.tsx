import { Sparkles } from "lucide-react";
import { GlassPanel } from "./GlassPanel";

const metrics = [
  { label: "Hydration", value: 87, color: "oklch(0.8 0.15 200)" },
  { label: "Smoothness", value: 92, color: "oklch(0.8 0.18 160)" },
  { label: "Skin Tone", value: 78, color: "oklch(0.78 0.18 320)" },
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
  return (
    <GlassPanel title="AI Skin Analysis" icon={<Sparkles className="h-3.5 w-3.5" />} accent>
      <div className="flex justify-around">
        {metrics.map((m) => (
          <CircularGauge key={m.label} {...m} />
        ))}
      </div>
      <div className="mt-5 rounded-md border border-accent/20 bg-accent/5 p-3">
        <p className="text-xs leading-relaxed text-muted-foreground">
          <span className="text-accent">AI Insight:</span> Your skin barrier is performing well. Consider applying SPF before noon for optimal UV protection.
        </p>
      </div>
    </GlassPanel>
  );
}
