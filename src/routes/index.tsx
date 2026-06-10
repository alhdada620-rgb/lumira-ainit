import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CameraProvider } from "@/components/lumira/camera-context";
import { WalletProvider } from "@/components/lumira/wallet-context";
import { ProfileProvider } from "@/components/lumira/profile-context";
import { SkinProvider } from "@/components/lumira/skin-context";
import { LanguageProvider, useT } from "@/components/lumira/i18n";
import { PiAuthProvider, usePiAuth } from "@/components/lumira/pi-auth-context";
import { OutfitProvider } from "@/components/lumira/outfit-context";
import { LandingGate } from "@/components/lumira/LandingGate";
import { MirrorStageLayout } from "@/components/lumira/MirrorStageLayout";
import { CaptionsOverlay } from "@/components/lumira/CaptionsOverlay";
import { HealthSkinAI } from "@/components/lumira/HealthSkinAI";
import { FashionStage } from "@/components/lumira/FashionStage";
import { PiPayWallet } from "@/components/lumira/PiPayWallet";
import { MiniDashboard } from "@/components/lumira/MiniDashboard";
import { VoiceVisualizer } from "@/components/lumira/VoiceVisualizer";
import { ProfileData } from "@/components/lumira/ProfileData";
import { SmartShopping } from "@/components/lumira/SmartShopping";
import { LanguageToggle } from "@/components/lumira/LanguageToggle";
import { HudJump } from "@/components/lumira/HudJump";
import bgImg from "@/assets/lumira-bg.jpg";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Lumira · Health & Elegance Smart Mirror" },
      { name: "description", content: "Smart Mirror with Pi Network authentication, AI fashion, health dashboard, and AR try-on." },
    ],
  }),
});

function Index() {
  return (
    <LanguageProvider>
      <PiAuthProvider>
        <WalletProvider>
          <ProfileProvider>
            <SkinProvider>
              <CameraProvider>
                <OutfitProvider>
                  <Shell />
                </OutfitProvider>
              </CameraProvider>
            </SkinProvider>
          </ProfileProvider>
        </WalletProvider>
      </PiAuthProvider>
    </LanguageProvider>
  );
}

function Shell() {
  const [stage, setStage] = useState<"landing" | "mirror">("landing");
  const { t, lang } = useT();
  const isAr = lang === "ar";
  const { user } = usePiAuth();

  // Auto-enter dashboard once Pi auth resolves (real user OR demo fallback after timeout).
  useEffect(() => {
    if (user && stage === "landing") setStage("mirror");
  }, [user, stage]);

  return (
    <>
      <CaptionsOverlay />
      {/* الخلفية الفاخرة */}
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center animate-bg-zoom"
        style={{ backgroundImage: `url(${bgImg})`, filter: "blur(6px) brightness(0.6) saturate(1.1)" }}
        aria-hidden
      />
      <div
        className="fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse at center, oklch(0.12 0.04 240 / 0.4) 0%, oklch(0.05 0.02 250 / 0.85) 100%)",
        }}
        aria-hidden
      />

      {stage === "landing" ? (
        <LandingGate onContinue={() => setStage("mirror")} />
      ) : (
        <MirrorStageLayout onBack={() => setStage("landing")}>
          {/* الهيدر */}
          <header className="mb-6 flex flex-col items-center justify-center gap-2">
            <div className="flex items-center gap-3">
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
              <Link to="/mall" className="inline-flex items-center gap-2 rounded-full border border-accent/50 bg-card/40 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-accent backdrop-blur">
                {isAr ? "متجر" : "Mall"}
              </Link>
              <HudJump />
              <LanguageToggle />
            </div>
          </header>

          {/* الـ Dashboard */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <div className="order-1 lg:order-2 lg:col-span-6 space-y-5">
              <FashionStage />
              <SmartShopping />
            </div>
            <div className="order-2 lg:order-1 lg:col-span-3 space-y-5">
              <HealthSkinAI />
              <VoiceVisualizer />
            </div>
            <div className="order-3 lg:col-span-3 space-y-5">
              <MiniDashboard />
              <PiPayWallet />
              <ProfileData />
            </div>
          </div>

          {/* الفوتر */}
          <footer className="fixed bottom-3 end-4 z-20 flex items-center gap-2 rounded-full border border-primary/20 bg-background/40 px-3 py-1.5 backdrop-blur-md">
            <span className="h-1 w-1 rounded-full bg-accent shadow-[0_0_6px_var(--accent)]" />
            <p className="text-[10px] tracking-[0.2em] text-foreground/85 text-glow">
              {isAr ? "تطوير" : "Developed by:"} <span className="font-medium text-primary">eslam Ali</span> · <span className="text-accent">#إسلام_علي</span>
            </p>
          </footer>
        </MirrorStageLayout>
      )}
    </>
  );
}
