import { Cloud } from "lucide-react";
import { useEffect, useState } from "react";
import { GlassPanel } from "./GlassPanel";
import { useT } from "./i18n";

export function MiniDashboard() {
  const { lang } = useT();
  const isAr = lang === "ar";
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const locale = isAr ? "ar-EG" : "en-US";
  const time = now
    ? now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })
    : "--:-- --";
  const date = now ? now.toLocaleDateString(locale, { weekday: "long", month: "long", day: "numeric", year: "numeric" }) : "\u00a0";

  return (
    <GlassPanel title={isAr ? "اللوحة اليومية" : "Daily Dashboard"}>
      <div className="space-y-4">
        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            {isAr ? "الوقت المحلي" : "Local Time"}
          </div>
          <div className="mt-1 font-light text-4xl tabular-nums text-foreground text-glow tracking-tight">
            {time}
          </div>
          <div className="mt-1 text-[11px] text-muted-foreground">{date}</div>
        </div>

        <div className="flex items-center justify-between rounded-lg border border-primary/15 bg-card/40 p-3">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">
              {isAr ? "القاهرة" : "CAIRO"}
            </div>
            <div className="text-lg font-light text-glow">22°C</div>
            <div className="text-[10px] text-muted-foreground">
              {isAr ? "غائم جزئيًا" : "Mostly Sunny"}
            </div>
            <div className="text-[10px] text-muted-foreground">
              {isAr ? "الرطوبة 54%" : "Humidity 54%"}
            </div>
          </div>
          <Cloud className="h-10 w-10 text-primary animate-float-slow" style={{ filter: "drop-shadow(0 0 12px var(--primary))" }} />
        </div>
      </div>
    </GlassPanel>
  );
}
