import { createFileRoute } from "@tanstack/react-router";
import { DailyDashboard } from "@/components/lumira/DailyDashboard";
import { SkinAnalysis } from "@/components/lumira/SkinAnalysis";
import { HealthVitals } from "@/components/lumira/HealthVitals";
import { VirtualTryOn } from "@/components/lumira/VirtualTryOn";
import { VirtualWardrobe } from "@/components/lumira/VirtualWardrobe";
import { VoiceVisualizer } from "@/components/lumira/VoiceVisualizer";
import { MirrorCamera } from "@/components/lumira/MirrorCamera";
import { PiWallet } from "@/components/lumira/PiWallet";
import { CommandLog } from "@/components/lumira/CommandLog";
import { SmartCatalog } from "@/components/lumira/SmartCatalog";
import { PiVerification } from "@/components/lumira/PiVerification";
import { CameraProvider } from "@/components/lumira/camera-context";
import { WalletProvider } from "@/components/lumira/wallet-context";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Lumira · Health & Elegance Smart Mirror" },
      { name: "description", content: "Futuristic glass-morphic smart mirror dashboard with live camera, AI skin analysis, voice control, AR try-on, and Pi Network wallet." },
    ],
  }),
});

function Index() {
  return (
    <WalletProvider>
      <CameraProvider>
        <main className="relative z-10 min-h-screen px-6 py-8 md:px-10 md:py-10">
          {/* Header */}
          <header className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10">
                <div className="absolute inset-0 animate-ring-rotate rounded-full border border-dashed border-primary/50" />
                <div className="absolute inset-1.5 rounded-full bg-gradient-to-br from-primary to-accent shadow-[var(--glow-primary)]" />
                <div className="absolute inset-3 rounded-full bg-background" />
              </div>
              <div>
                <h1 className="font-light text-xl tracking-[0.3em] text-foreground text-glow">
                  LUMIRA
                </h1>
                <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
                  Health & Elegance
                </p>
              </div>
            </div>
            <div className="hidden items-center gap-2 rounded-full border border-primary/20 bg-card/40 px-3 py-1.5 backdrop-blur md:flex">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400 shadow-[0_0_8px_oklch(0.7_0.2_150)]" />
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">System Online · Mirror v2.4</span>
            </div>
          </header>

          {/* Grid */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <MirrorCamera />
            <VoiceVisualizer />
            {/* Smart Catalog directly below the mirror */}
            <SmartCatalog />
            <DailyDashboard />
            <SkinAnalysis />
            <HealthVitals />
            <VirtualTryOn />
            <PiWallet />
            <CommandLog />
            <VirtualWardrobe />
          </div>

          {/* Signature Footer */}
          <footer className="mt-14 flex flex-col items-center justify-center gap-3">
            <div className="h-px w-40 bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
            <p
              className="text-center text-sm tracking-[0.2em] text-foreground/90 text-glow"
              style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 300 }}
            >
              Developed &amp; Designed by{" "}
              <span className="font-medium text-primary">Islam Ali</span>
              <span className="mx-2 text-muted-foreground/60">—</span>
              <span
                dir="rtl"
                lang="ar"
                className="text-accent text-glow-accent"
                style={{ fontFamily: "'Tajawal','Noto Kufi Arabic','Cairo',system-ui,sans-serif", fontWeight: 500 }}
              >
                إسلام علي
              </span>
            </p>
            <div className="text-[9px] tracking-[0.3em] text-muted-foreground/60">
              © {new Date().getFullYear()} · LUMIRA SMART MIRROR
            </div>
            <PiVerification />
          </footer>
        </main>
      </CameraProvider>
    </WalletProvider>
  );
}

