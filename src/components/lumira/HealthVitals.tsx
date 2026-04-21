import { Heart, Moon, Footprints } from "lucide-react";
import { useEffect, useState } from "react";
import { GlassPanel } from "./GlassPanel";

function Heartbeat() {
  return (
    <svg viewBox="0 0 200 40" className="h-10 w-full text-primary">
      <path
        d="M0,20 L40,20 L50,5 L60,35 L70,20 L100,20 L110,10 L120,30 L130,20 L200,20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        style={{ filter: "drop-shadow(0 0 4px currentColor)" }}
      />
    </svg>
  );
}

export function HealthVitals() {
  const [bpm, setBpm] = useState(72);
  useEffect(() => {
    const t = setInterval(() => setBpm(68 + Math.floor(Math.random() * 8)), 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <GlassPanel title="Health Vitals" icon={<Heart className="h-3.5 w-3.5" />}>
      <div className="space-y-4">
        <div className="rounded-lg border border-primary/15 bg-primary/5 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 fill-primary text-primary animate-pulse-glow" />
              <span className="text-xs uppercase tracking-widest text-muted-foreground">Heart Rate</span>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-light text-glow">{bpm}</span>
              <span className="text-[10px] text-muted-foreground">BPM</span>
            </div>
          </div>
          <Heartbeat />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-primary/15 bg-card/40 p-3">
            <Moon className="mb-2 h-4 w-4 text-primary" />
            <div className="text-xl font-light text-glow">7.8h</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Sleep</div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-[88%] bg-gradient-to-r from-primary to-accent" style={{ boxShadow: "0 0 8px var(--primary)" }} />
            </div>
          </div>
          <div className="rounded-lg border border-primary/15 bg-card/40 p-3">
            <Footprints className="mb-2 h-4 w-4 text-primary" />
            <div className="text-xl font-light text-glow">8,247</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Steps</div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full w-[82%] bg-gradient-to-r from-primary to-accent" style={{ boxShadow: "0 0 8px var(--primary)" }} />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Apple Watch · Connected
          </span>
          <span>Synced 2m ago</span>
        </div>
      </div>
    </GlassPanel>
  );
}
