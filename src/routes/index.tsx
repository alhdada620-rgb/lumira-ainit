// انسخ الكود ده بالكامل وحطه في ملف Index.tsx عندك
import { createFileRoute } from "@tanstack/react-router";
import { HealthSkinAI } from "@/components/lumira/HealthSkinAI";
import { FashionStage } from "@/components/lumira/FashionStage";
import { PiPayWallet } from "@/components/lumira/PiPayWallet";
import { MiniDashboard } from "@/components/lumira/MiniDashboard";
import { VoiceVisualizer } from "@/components/lumira/VoiceVisualizer";
import { CameraProvider } from "@/components/lumira/camera-context";
import { WalletProvider } from "@/components/lumira/wallet-context";
import { ProfileProvider } from "@/components/lumira/profile-context";
import { SkinProvider } from "@/components/lumira/skin-context";
import { ProfileData } from "@/components/lumira/ProfileData";
import { SmartShopping } from "@/components/lumira/SmartShopping";
import { LanguageProvider, useT } from "@/components/lumira/i18n";
import { LanguageToggle } from "@/components/lumira/LanguageToggle";
import { CaptionsOverlay } from "@/components/lumira/CaptionsOverlay";
import { HudJump } from "@/components/lumira/HudJump";
import bgImg from "@/assets/lumira-bg.jpg";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <LanguageProvider>
      <WalletProvider>
        <ProfileProvider>
          <SkinProvider>
            <CameraProvider>
              <IndexShell />
            </CameraProvider>
          </SkinProvider>
        </ProfileProvider>
      </WalletProvider>
    </LanguageProvider>
  );
}

function IndexShell() {
  const { t, lang } = useT();
  const isAr = lang === "ar";
  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 -z-10 bg-cover bg-center" style={{ backgroundImage: `url(${bgImg})` }} />
      <main className="relative z-10 p-4">
        <header className="flex justify-between items-center mb-6">
          <h1 className="text-xl font-bold">LUMIRA</h1>
          <LanguageToggle />
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-3"><HealthSkinAI /></div>
          <div className="lg:col-span-6"><FashionStage /></div>
          <div className="lg:col-span-3"><PiPayWallet /></div>
        </div>
      </main>
    </div>
  );
}
