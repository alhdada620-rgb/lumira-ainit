import { Wallet, Loader2, CheckCircle2, AlertTriangle, Share2 } from "lucide-react";
import { useEffect, useState } from "react";
import { GlassPanel } from "./GlassPanel";
import { useWallet } from "./wallet-context";
import { useT } from "./i18n";
import { approvePiPayment, completePiPayment } from "@/server/pi.functions";

type PayState = "idle" | "auth" | "creating" | "approved" | "completed" | "error";

// Pi SDK types (loaded from https://sdk.minepi.com/pi-sdk.js)
interface PiAuthResult {
  user: { uid: string; username: string };
  accessToken: string;
}
interface PiPaymentDTO {
  identifier: string;
  amount: number;
  memo: string;
  metadata: Record<string, unknown>;
}
interface PiPaymentCallbacks {
  onReadyForServerApproval: (paymentId: string) => void;
  onReadyForServerCompletion: (paymentId: string, txid: string) => void;
  onCancel: (paymentId: string) => void;
  onError: (error: Error, payment?: unknown) => void;
}
interface PiSDK {
  init(opts: { version: "2.0"; sandbox?: boolean }): void;
  authenticate(
    scopes: string[],
    onIncompletePaymentFound: (p: { identifier: string; transaction?: { txid: string } }) => void,
  ): Promise<PiAuthResult>;
  createPayment(payment: PiPaymentDTO, callbacks: PiPaymentCallbacks): void;
}
declare global {
  interface Window { Pi?: PiSDK }
}

export function PiPayWallet() {
  const { lang } = useT();
  const isAr = lang === "ar";
  const { balance, todayDelta } = useWallet();
  const [state, setState] = useState<PayState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Initialize Pi SDK in sandbox mode (Testnet) once available
  useEffect(() => {
    let cancelled = false;
    const tryInit = () => {
      if (cancelled) return;
      if (window.Pi) {
        try { window.Pi.init({ version: "2.0", sandbox: true }); } catch { /* already inited */ }
        return;
      }
      setTimeout(tryInit, 300);
    };
    tryInit();
    return () => { cancelled = true; };
  }, []);

  const usd = (balance * 0.336).toFixed(2);

  const handleIncomplete = async (p: { identifier: string; transaction?: { txid: string } }) => {
    if (p.transaction?.txid) {
      try { await completePiPayment({ data: { paymentId: p.identifier, txid: p.transaction.txid } }); }
      catch { /* swallow — incomplete cleanup */ }
    }
  };

  const payWithPi = async () => {
    if (state !== "idle" && state !== "error" && state !== "completed") return;
    setErrorMsg(null);

    if (!window.Pi) {
      setErrorMsg(isAr ? "افتح التطبيق داخل متصفح Pi" : "Open this app inside the Pi Browser");
      setState("error");
      return;
    }

    try {
      setState("auth");
      await window.Pi.authenticate(["username", "payments"], handleIncomplete);

      setState("creating");
      window.Pi.createPayment(
        {
          amount: 0.01,
          memo: "Lumira test transaction (Step 10)",
          metadata: { kind: "lumira_test", ts: Date.now() },
          identifier: `lumira-${Date.now()}`,
        },
        {
          onReadyForServerApproval: async (paymentId) => {
            try {
              await approvePiPayment({ data: { paymentId } });
              setState("approved");
            } catch (e) {
              setErrorMsg((e as Error).message);
              setState("error");
            }
          },
          onReadyForServerCompletion: async (paymentId, txid) => {
            try {
              await completePiPayment({ data: { paymentId, txid } });
              setState("completed");
              setTimeout(() => setState("idle"), 2200);
            } catch (e) {
              setErrorMsg((e as Error).message);
              setState("error");
            }
          },
          onCancel: () => { setState("idle"); },
          onError: (err) => { setErrorMsg(err.message); setState("error"); },
        },
      );
    } catch (e) {
      setErrorMsg((e as Error).message);
      setState("error");
    }
  };

  const labels: Record<PayState, string> = isAr
    ? {
        idle: "ادفع بـ Pi",
        auth: "مصادقة Pi…",
        creating: "إنشاء الدفعة…",
        approved: "بانتظار التأكيد…",
        completed: "تم الدفع ✓",
        error: "حاول مرة أخرى",
      }
    : {
        idle: "Pay with Pi",
        auth: "Authenticating…",
        creating: "Creating payment…",
        approved: "Awaiting confirmation…",
        completed: "Payment Complete ✓",
        error: "Retry",
      };

  const isBusy = state === "auth" || state === "creating" || state === "approved";

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
          ) : state === "error" ? (
            <AlertTriangle className="h-4 w-4 text-destructive" />
          ) : (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          {labels[state]}
        </button>

        {errorMsg && (
          <p className="text-[10px] leading-relaxed text-destructive/90 break-words">{errorMsg}</p>
        )}

        <p className="text-[10px] leading-relaxed text-muted-foreground">
          {isAr
            ? "Pi SDK · الوضع الاختباري — Pi.createPayment()"
            : "Pi SDK · Sandbox (Testnet) — Pi.createPayment()"}
        </p>
      </div>
    </GlassPanel>
  );
}
