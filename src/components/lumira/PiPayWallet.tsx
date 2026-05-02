import { Wallet, Loader2, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { GlassPanel } from "./GlassPanel";
import { useWallet } from "./wallet-context";
import { useT } from "./i18n";

type PayState = "idle" | "auth" | "creating" | "approved" | "completed";

export function PiPayWallet() {
  const { lang } = useT();
  const isAr = lang === "ar";
  const { balance, todayDelta } = useWallet();
  const [state, setState] = useState<PayState>("idle");

  const usd = (balance * 0.336).toFixed(2);

  const payWithPi = async () => {
    if (state !== "idle") return;
    // Mock Pi.createPayment flow
    setState("auth");
    await new Promise((r) => setTimeout(r, 700));
    setState("creating");
    await new Promise((r) => setTimeout(r, 900));
    setState("approved");
    await new Promise((r) => setTimeout(r, 700));
    setState("completed");
    await new Promise((r) => setTimeout(r, 1400));
    setState("idle");
  };

  const labels: Record<PayState, string> = isAr
    ? {
        idle: "ادفع بـ Pi",
        auth: "مصادقة Pi…",
        creating: "إنشاء الدفعة…",
        approved: "بانتظار الموافقة…",
        completed: "تم الدفع ✓",
      }
    : {
        idle: "Pay with Pi",
        auth: "Authenticating…",
        creating: "Creating payment…",
        approved: "Awaiting approval…",
        completed: "Payment Complete ✓",
      };

  const isBusy = state !== "idle";

  return (
    <GlassPanel
      title={isAr ? "محفظة شبكة Pi" : "Pi Network Wallet"}
      icon={<Wallet className="h-3.5 w-3.5" />}
      accent
    >
      <div className="space-y-4">
        <div
          className="relative overflow-hidden rounded-xl border border-accent/30 p-4"
          style={{ background: "var(--gradient-aurora)" }}
        >
          <div className="absolute inset-0 hud-grid opacity-30" />
          <div className="relative">
            <div className="text-[9px] uppercase tracking-[0.35em] text-foreground/70">
              {isAr ? "الرصيد" : "Balance"}
            </div>
            <div className="mt-1 flex items-baseline gap-1.5">
              <span className="text-2xl font-light text-glow-accent">π</span>
              <span className="text-3xl font-light text-foreground text-glow-accent tabular-nums">
                {balance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-[10px]">
              <span className={`uppercase tracking-widest ${todayDelta >= 0 ? "text-emerald-400" : "text-destructive"}`}>
                {todayDelta >= 0 ? "+" : "−"}
                {Math.abs(todayDelta).toFixed(2)} {isAr ? "اليوم" : "TODAY"}
              </span>
              <span className="text-muted-foreground">≈ ${usd} USD</span>
            </div>
          </div>
        </div>

        <button
          onClick={payWithPi}
          disabled={isBusy}
          className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-full border border-accent/60 bg-gradient-to-r from-accent/30 via-primary/20 to-accent/30 px-5 py-3 text-xs uppercase tracking-[0.35em] text-foreground shadow-[var(--glow-accent)] transition hover:shadow-[var(--glow-primary)] active:scale-[0.98] disabled:opacity-80"
        >
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-foreground/15 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          {state === "idle" ? (
            <Wallet className="h-4 w-4" />
          ) : state === "completed" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          ) : (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          {labels[state]}
        </button>

        <p className="text-[10px] leading-relaxed text-muted-foreground">
          {isAr
            ? "تكامل Pi SDK · الوضع الاختباري نشط — Pi.createPayment()"
            : "Pi SDK · Sandbox active — Pi.createPayment()"}
        </p>
      </div>
    </GlassPanel>
  );
}
