import { Mic } from "lucide-react";
import { GlassPanel } from "./GlassPanel";

export function VoiceVisualizer() {
  const bars = Array.from({ length: 32 });
  return (
    <GlassPanel title="Voice Assistant" icon={<Mic className="h-3.5 w-3.5" />}>
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 animate-ring-rotate rounded-full border border-dashed border-primary/40" />
          <div className="absolute -inset-2 animate-pulse-glow rounded-full bg-primary/20 blur-xl" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent shadow-[var(--glow-primary)]">
            <Mic className="h-7 w-7 text-primary-foreground" />
          </div>
        </div>

        <div className="flex h-12 w-full items-center justify-center gap-1">
          {bars.map((_, i) => (
            <span
              key={i}
              className="w-1 rounded-full bg-gradient-to-t from-primary to-accent animate-voice-wave"
              style={{
                height: `${(30 + Math.sin(i * 0.5) * 30 + 30).toFixed(2)}%`,
                animationDelay: `${(i * 0.05).toFixed(2)}s`,
                animationDuration: `${(0.6 + (i % 4) * 0.15).toFixed(2)}s`,
                boxShadow: "0 0 6px var(--primary)",
              }}
            />
          ))}
        </div>

        <div className="text-center">
          <div className="text-[10px] uppercase tracking-[0.3em] text-primary text-glow">Listening…</div>
          <div className="mt-1 text-xs text-muted-foreground">"Lumira, show today's skincare plan"</div>
        </div>
      </div>
    </GlassPanel>
  );
}
