import { Cloud, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { GlassPanel } from "./GlassPanel";

export function DailyDashboard() {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const time = now ? now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false }) : "--:--";
  const date = now ? now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) : "\u00a0";

  return (
    <GlassPanel className="col-span-full lg:col-span-2">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Time */}
        <div className="text-center md:text-left">
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">Local Time</div>
          <div className="mt-1 font-light text-6xl tabular-nums text-foreground text-glow tracking-tight">
            {time}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{date}</div>
        </div>

        {/* Weather */}
        <div className="flex flex-col items-center justify-center border-y border-primary/10 py-4 md:border-x md:border-y-0 md:py-0">
          <Cloud className="h-8 w-8 text-primary animate-float-slow" style={{ filter: "drop-shadow(0 0 12px var(--primary))" }} />
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-3xl font-light text-glow">22</span>
            <span className="text-sm text-muted-foreground">°C</span>
          </div>
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Partly Cloudy · Cairo</div>
          <div className="mt-2 flex gap-3 text-[10px] text-muted-foreground">
            <span>H 28°</span>
            <span>L 17°</span>
            <span>Hum 54%</span>
          </div>
        </div>

        {/* Pi Wallet */}
        <div className="text-center md:text-right">
          <div className="flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-[0.3em] text-muted-foreground md:justify-end">
            <Wallet className="h-3 w-3 text-accent" />
            Pi Network Wallet
          </div>
          <div className="mt-1 flex items-baseline justify-center gap-1.5 md:justify-end">
            <span className="text-3xl font-light text-glow-accent">π</span>
            <span className="font-light text-4xl tabular-nums text-glow-accent">1,247.83</span>
          </div>
          <div className="mt-1 text-xs uppercase tracking-widest text-emerald-400/90">+12.4 TODAY</div>
        </div>
      </div>
    </GlassPanel>
  );
}
