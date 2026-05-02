import { createFileRoute } from "@tanstack/react-router";
import { HealthSkinAI } from "@/components/lumira/HealthSkinAI";
import { FashionStage } from "@/components/lumira/FashionStage";
import { PiPayWallet } from "@/components/lumira/PiPayWallet";
import { MiniDashboard } from "@/components/lumira/MiniDashboard";
import { VoiceVisualizer } from "@/components/lumira/VoiceVisualizer";
import { CameraProvider } from "@/components/lumira/camera-context";
import { WalletProvider } from "@/components/lumira/wallet-context";
import { LanguageProvider, useT } from "@/components/lumira/i18n";
import { LanguageToggle } from "@/components/lumira/LanguageToggle";
import bgImg from "@/assets/lumira-bg.jpg";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Lumira · Health & Elegance Smart Mirror" },
      { name: "description", content: "Luxury AI fashion & health dashboard with Pi Network wallet, AR try-on, and live voice assistant." },
    ],
  }),
});

function Index() {
  return (
    <LanguageProvider>
      <WalletProvider>
        <CameraProvider>
          <IndexShell />
        </CameraProvider>
      </WalletProvider>
    </LanguageProvider>
  );
}

function IndexShell() {
  const { t, lang } = useT();
  const isAr = lang === "ar";

  return (
    <>
      {/* Cinematic luxury background */}
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center"
        style={{
          backgroundImage: `url(${bgImg})`,
          filter: "blur(8px) brightness(0.55) saturate(1.1)",
          transform: "scale(1.08)",
        }}
        aria-hidden
      />
      <div
        className="fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse at center, oklch(0.15 0.03 230 / 0.55) 0%, oklch(0.08 0.02 235 / 0.85) 100%)",
        }}
        aria-hidden
      />

      <main className="relative z-10 min-h-screen px-4 py-6 md:px-8 md:py-8">
        {/* Top centered title with logo */}
        <header className="mb-6 flex flex-col items-center justify-center gap-2">
          <div className="flex items-center gap-3">
            <div className="relative h-9 w-9 shrink-0">
              <div className="absolute inset-0 animate-ring-rotate rounded-full border border-dashed border-primary/60" />
              <div className="absolute inset-1.5 rounded-full bg-gradient-to-br from-primary to-accent shadow-[var(--glow-primary)]" />
              <div className="absolute inset-3 rounded-full bg-background" />
            </div>
            <h1
              className="font-light text-lg md:text-xl tracking-[0.4em] text-foreground text-glow"
              style={
                isAr
                  ? { fontFamily: "'Tajawal','Noto Kufi Arabic','Cairo',system-ui,sans-serif", letterSpacing: "0.2em" }
                  : undefined
              }
            >
              {isAr ? "لوميرا — صحة وأناقة" : "LUMIRA — HEALTH & ELEGANCE"}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="hidden md:inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card/40 px-3 py-1 backdrop-blur">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_8px_oklch(0.7_0.2_150)]" />
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                {t("header.systemOnline")}
              </span>
            </span>
            <LanguageToggle />
          </div>
        </header>

        {/* Three-column hero layout */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          {/* Left column */}
          <div className="space-y-5 lg:col-span-3">
            <HealthSkinAI />
            <VoiceVisualizer />
          </div>

          {/* Center stage */}
          <div className="lg:col-span-6">
            <FashionStage />
          </div>

          {/* Right column */}
          <div className="space-y-5 lg:col-span-3">
            <PiPayWallet />
            <MiniDashboard />
          </div>
        </div>

        {/* Footer signature */}
        <footer className="mt-10 flex flex-col items-center justify-center gap-2">
          <div className="h-px w-40 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
          <p
            className="text-center text-xs tracking-[0.25em] text-foreground/90 text-glow"
            style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 300 }}
          >
            {isAr ? "تطوير وتصميم" : "Developed by"}{" "}
            <span className="font-medium text-primary">eslam Ali</span>
            <span className="mx-2 text-muted-foreground/60">—</span>
            <span
              dir="rtl"
              lang="ar"
              className="text-accent text-glow-accent"
              style={{ fontFamily: "'Tajawal','Noto Kufi Arabic','Cairo',system-ui,sans-serif", fontWeight: 500 }}
            >
              #إسلام_علي
            </span>
          </p>
          <div className="text-[9px] tracking-[0.3em] text-muted-foreground/60">
            © {new Date().getFullYear()} · LUMIRA
          </div>
        </footer>
      </main>
    </>
  );
}
