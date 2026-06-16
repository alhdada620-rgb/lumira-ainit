import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Expand, Shirt, MapPin, Wand2, Smile, Scissors, Sparkles,
  Globe2, Video, Glasses, Gift, Brain, Wallet, Loader2, CheckCircle2, AlertTriangle, ShieldCheck,
} from "lucide-react";
import { LanguageProvider, useT } from "@/components/lumira/i18n";
import { WalletProvider } from "@/components/lumira/wallet-context";
import { PiAuthProvider, usePiAuth } from "@/components/lumira/pi-auth-context";
import { approvePiPayment, completePiPayment } from "@/lib/pi.functions";

export const Route = createFileRoute("/")({
  component: Index,
  ssr: false,
  head: () => ({
    meta: [
      { title: "Lumira 2026 · AI Fashion Dashboard" },
      { name: "description", content: "Lumira 2026 glassmorphic AI fashion dashboard with Pi Network payments and KYC Pioneer 7-day free trial." },
    ],
  }),
});

function Index() {
  return (
    <LanguageProvider>
      <PiAuthProvider>
        <WalletProvider>
          <DashboardShell />
        </WalletProvider>
      </PiAuthProvider>
    </LanguageProvider>
  );
}

const TRIAL_KEY = "lumira:kyc-trial-start";
const TRIAL_DAYS = 7;

function useKycTrial(eligible: boolean) {
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  useEffect(() => {
    if (!eligible || typeof window === "undefined") return;
    let start = Number(window.localStorage.getItem(TRIAL_KEY) || 0);
    if (!start) {
      start = Date.now();
      window.localStorage.setItem(TRIAL_KEY, String(start));
    }
    const elapsed = (Date.now() - start) / 86_400_000;
    setDaysLeft(Math.max(0, Math.ceil(TRIAL_DAYS - elapsed)));
  }, [eligible]);
  return daysLeft;
}

type PayState = "idle" | "auth" | "creating" | "approved" | "completed" | "error";

function DashboardShell() {
  const { lang, toggleLang } = useT();
  const isAr = lang === "ar";
  const { user, isDemo, signIn } = usePiAuth();
  const eligible = !!user && !isDemo;
  const daysLeft = useKycTrial(eligible);

  const [payState, setPayState] = useState<PayState>("idle");
  const [payError, setPayError] = useState<string | null>(null);
  const piSandbox = (import.meta.env.VITE_PI_SANDBOX ?? "true") !== "false";

  const payWithPi = async () => {
    setPayError(null);
    if (!window.Pi) {
      setPayError(isAr ? "افتح التطبيق داخل متصفح Pi" : "Open inside the Pi Browser");
      setPayState("error");
      return;
    }
    try {
      setPayState("auth");
      await Promise.resolve(window.Pi.init({ version: "2.0", sandbox: piSandbox }));
      await window.Pi.authenticate(["username", "payments"], async (p) => {
        if (p.transaction?.txid) {
          try { await completePiPayment({ data: { paymentId: p.identifier, txid: p.transaction.txid } }); } catch { /* noop */ }
        }
      });
      setPayState("creating");
      setTimeout(() => {
        window.Pi?.createPayment(
          { amount: 0.01, memo: "Lumira Smart World access", metadata: { kind: "smart-world" }, identifier: `lumira-sw-${Date.now()}` },
          {
            onReadyForServerApproval: async (id) => {
              try { await approvePiPayment({ data: { paymentId: id } }); setPayState("approved"); }
              catch { setPayError(isAr ? "تعذّر معالجة الدفع" : "Approval failed"); setPayState("error"); }
            },
            onReadyForServerCompletion: async (id, txid) => {
              try {
                await completePiPayment({ data: { paymentId: id, txid } });
                setPayState("completed");
                setTimeout(() => setPayState("idle"), 2500);
              } catch { setPayError(isAr ? "تعذّر إكمال الدفع" : "Completion failed"); setPayState("error"); }
            },
            onCancel: () => setPayState("idle"),
            onError: () => { setPayError(isAr ? "خطأ في الدفع" : "Payment error"); setPayState("error"); },
          },
        );
      }, 50);
    } catch {
      setPayError(isAr ? "تعذّر بدء الدفع" : "Could not start payment");
      setPayState("error");
    }
  };

  const isBusy = payState === "auth" || payState === "creating" || payState === "approved";

  return (
    <div
      className="min-h-screen w-full flex justify-center p-5"
      style={{
        backgroundColor: "#020617",
        color: "#f8fafc",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <div
        className="w-full max-w-[480px] rounded-[32px] p-6 border"
        style={{
          background: "#0f172a",
          backgroundImage:
            "radial-gradient(at 0% 0%, hsla(263,70%,50%,0.15) 0px, transparent 50%), radial-gradient(at 100% 100%, hsla(171,70%,50%,0.10) 0px, transparent 50%)",
          borderColor: "rgba(255,255,255,0.05)",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <span className="text-[10px] tracking-[0.3em] text-slate-400">
            LUMIRA
          </span>
          <button onClick={toggleLang} className="text-[10px] tracking-[0.3em] text-slate-400 hover:text-teal-300 transition">
            {isAr ? "EN" : "AR"}
          </button>
        </div>

        {/* Pi auth strip */}
        <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-md px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <ShieldCheck className={`h-4 w-4 shrink-0 ${eligible ? "text-emerald-400" : "text-slate-500"}`} />
            <div className="min-w-0">
              <div className="text-[11px] font-semibold truncate" style={{ fontFamily: "'Poppins', sans-serif" }}>
                {user ? `@${user.username}` : (isAr ? "غير موثّق" : "Not verified")}
              </div>
              <div className="text-[9px] text-slate-400">
                {eligible ? (isAr ? "Pioneer KYC موثّق" : "KYC Verified Pioneer") : (isAr ? "سجّل عبر Pi" : "Sign in with Pi")}
              </div>
            </div>
          </div>
          {!eligible && (
            <button
              onClick={signIn}
              className="shrink-0 text-[10px] font-semibold px-3 py-1.5 rounded-lg bg-gradient-to-r from-teal-400 to-violet-500 text-white shadow-[0_4px_15px_rgba(45,212,191,0.3)]"
            >
              {isAr ? "دخول Pi" : "Sign In"}
            </button>
          )}
        </div>

        {/* 7 tiles grid */}
        <div className="grid grid-cols-2 gap-4 mb-5">
          <Tile icons={[Expand, Shirt, MapPin]} title={isAr ? "المرآة وقياس الملابس" : "AI Mirror & Clothes Measurement"} desc={isAr ? "قياس دقيق وتنسيق ذكي وخرائط تجربة." : "Precision measurement, smart coordination & trial maps."} />
          <Tile icons={[Wand2, Smile]} title={isAr ? "الجمال والمكياج" : "Beauty & Makeup"} desc={isAr ? "تحليل وتوصيات وتجربة افتراضية." : "Analysis & recommendations, virtual trial."} />
          <Tile icons={[Scissors, Sparkles]} title={isAr ? "تصفيف الشعر والجمال" : "Hair Styling & Beauty"} desc={isAr ? "أنماط جديدة، استشارة بشرة." : "New styles, skin consultation."} />
          <Tile
            icons={[Globe2]}
            title={isAr ? "ماركات عالمية" : "Global Retailers"}
            desc={isAr ? "اكتشف ماركاتك المفضلة." : "Discover your favorite brands."}
            badges={["DIOR", "CHANEL", "LV"]}
          />
          <Tile icons={[Video, Glasses]} title={isAr ? "تجارب مباشرة" : "Live Trials"} desc={isAr ? "تجارب متاجر حقيقية وبث مباشر." : "Real store trials, live broadcast."} />

          {/* Lumira Smart World — special tile */}
          <div
            className="rounded-3xl p-5 text-center flex flex-col items-center justify-center gap-2 border relative overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.03)",
              borderColor: "rgba(45,212,191,0.35)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              boxShadow: eligible ? "0 0 24px rgba(45,212,191,0.25), inset 0 0 12px rgba(139,92,246,0.15)" : undefined,
            }}
          >
            <div className="flex gap-2 mb-1">
              <Gift className="h-5 w-5 text-teal-300" />
              <Brain className="h-5 w-5 text-teal-300" />
            </div>
            <h3 className="text-[13px] font-semibold text-slate-100" style={{ fontFamily: "'Poppins', sans-serif" }}>
              {isAr ? "عالم لوميرا الذكي" : "Lumira Smart World"}
            </h3>
            <p className="text-[10px] text-slate-400 leading-snug">
              {isAr ? "هدايا، تحديثات، وتكنولوجيا." : "Gifts, updates, and technology."}
            </p>

            {eligible && daysLeft !== null && daysLeft > 0 && (
              <div
                className="mt-1 text-[8.5px] font-bold tracking-wider px-2.5 py-1 rounded-full border"
                style={{
                  borderColor: "rgba(45,212,191,0.6)",
                  color: "#5eead4",
                  background: "rgba(45,212,191,0.08)",
                  textShadow: "0 0 8px rgba(45,212,191,0.8)",
                  boxShadow: "0 0 12px rgba(45,212,191,0.4), inset 0 0 6px rgba(45,212,191,0.2)",
                  animation: "pulse 2s ease-in-out infinite",
                }}
              >
                {isAr ? `تجربة KYC: ${daysLeft} يوم متبقي` : `KYC TRIAL ACTIVE: ${daysLeft} DAYS LEFT`}
              </div>
            )}

            <button
              onClick={payWithPi}
              disabled={isBusy}
              className="mt-1 w-full flex items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-[10px] font-bold tracking-wider border border-white/15 bg-white/5 backdrop-blur-md text-slate-100 hover:border-teal-300/60 transition disabled:opacity-70"
              style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)" }}
            >
              {payState === "idle" && <Wallet className="h-3.5 w-3.5 text-teal-300" />}
              {payState === "completed" && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />}
              {payState === "error" && <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />}
              {isBusy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {payState === "idle" && (isAr ? "ادفع بـ Pi" : "PAY WITH PI")}
              {payState === "auth" && (isAr ? "مصادقة…" : "AUTH…")}
              {payState === "creating" && (isAr ? "إنشاء…" : "CREATING…")}
              {payState === "approved" && (isAr ? "تأكيد…" : "CONFIRMING…")}
              {payState === "completed" && (isAr ? "تم ✓" : "PAID ✓")}
              {payState === "error" && (isAr ? "إعادة" : "RETRY")}
            </button>
            {payError && <p className="text-[8.5px] text-rose-300/90 leading-snug">{payError}</p>}
          </div>
        </div>

        {/* Premium banner */}
        <div
          className="rounded-[28px] p-6 text-center border relative overflow-hidden"
          style={{
            background: "rgba(255,255,255,0.03)",
            borderColor: "rgba(255,255,255,0.10)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          }}
        >
          <div
            className="text-[18px] font-bold mb-2"
            style={{
              fontFamily: "'Poppins', sans-serif",
              background: "linear-gradient(to right, #2dd4bf, #8b5cf6)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {isAr ? "تطبيق لوميرا الذكي — LUMIRA" : "LUMIRA SMART APPLICATION — LUMIRA"}
          </div>
          <div className="text-[12px] text-slate-300 leading-relaxed mb-4">
            {isAr
              ? "تجربة تسوّق ذكية موحّدة: قياس دقيق، تنسيق ذكي، تحليل البشرة والوجه بالذكاء الاصطناعي، متاجر افتراضية وتجربة مباشرة، أسواق عالمية، وملابس افتراضية."
              : "Unified and smart shopping experience: Precision measurement, smart coordination, AI skin & facial analysis, virtual stores & live experience, global markets, and virtual clothing."}
          </div>
          <span
            className="inline-block text-white border-0 px-8 py-3 rounded-xl font-semibold text-sm"
            style={{
              background: "linear-gradient(135deg, #2dd4bf, #8b5cf6)",
              boxShadow: "0 4px 15px rgba(45,212,191,0.3)",
            }}
          >
            {isAr ? "اكتشف أكثر" : "DISCOVER MORE"}
          </span>
        </div>

        <p className="mt-4 text-center text-[9px] text-slate-500 tracking-wider">
          {isAr ? "مدفوعات Pi من نظير إلى تطبيق — بدون عملات ورقية" : "Peer-to-app Pi payments only — no fiat"}
        </p>
      </div>
    </div>
  );
}

function Tile({
  icons, title, desc, badges,
}: {
  icons: Array<React.ComponentType<{ className?: string }>>;
  title: string;
  desc: string;
  badges?: string[];
}) {
  return (
    <div
      className="rounded-3xl p-5 text-center flex flex-col items-center justify-center border"
      style={{
        background: "rgba(255,255,255,0.03)",
        borderColor: "rgba(255,255,255,0.08)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
      }}
    >
      {badges && (
        <div className="grid grid-cols-3 gap-1 mb-2 w-full">
          {badges.map((b) => (
            <span key={b} className="text-[9px] font-bold bg-white/10 px-1 py-0.5 rounded text-white">{b}</span>
          ))}
        </div>
      )}
      <div className="flex gap-2 mb-3 justify-center">
        {icons.map((Icon, i) => <Icon key={i} className="h-6 w-6 text-teal-300" />)}
      </div>
      <h3 className="text-[13px] font-semibold mb-1 text-slate-100" style={{ fontFamily: "'Poppins', sans-serif" }}>
        {title}
      </h3>
      <p className="text-[10px] text-slate-400 leading-snug">{desc}</p>
    </div>
  );
}
