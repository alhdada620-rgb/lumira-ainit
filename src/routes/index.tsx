»import { createFileRoute, Link } from "@tanstack/react-router";
import { HealthSkinAI } from "@/components/lumira/HealthSkinAI";
import { FashionStage } from "@/components/lumira/FashionStage";
import { PiPayWallet } from "@/components/lumira/PiPayWallet";
import { LanguageProvider, useT } from "@/components/lumira/i18n";
import { WalletProvider } from "@/components/lumira/wallet-context";
import { ProfileProvider } from "@/components/lumira/profile-context";
import { SkinProvider } from "@/components/lumira/skin-context";
import { CameraProvider } from "@/components/lumira/camera-context";

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
              <LumiraCleanLayout />
            </CameraProvider>
          </SkinProvider>
        </ProfileProvider>
      </WalletProvider>
    </LanguageProvider>
  );
}

function LumiraCleanLayout() {
  const { t, lang } = useT();
  const isAr = lang === "ar";

  return (
    <div className="min-h-screen bg-[#050a15] text-white p-4 font-sans">
      {/* Header الاحترافي مع توقيعك */}
      <header className="max-w-6xl mx-auto flex justify-between items-center mb-8 glass p-4 rounded-2xl border border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_10px_#06b6d4]"></div>
          <h1 className="text-xl font-bold tracking-widest">LUMIRA <span className="text-cyan-400">AI</span></h1>
        </div>
        <div className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
           {isAr ? "تطوير إسلام علي" : "Dev: Islam Ali"} | #إسلام_علي
        </div>
      </header>

      {/* Grid نظيف لمنع الكعبله */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* العمود الجانبي - الصحة والبشرة (Sliders عمودية) */}
        <div className="lg:col-span-3 order-2 lg:order-1">
          <HealthSkinAI />
        </div>

        {/* المسرح الرئيسي - الموديل والملابس (منع التداخل) */}
        <div className="lg:col-span-6 order-1 lg:order-2 flex flex-col gap-4">
          <FashionStage />
        </div>

        {/* العمود الجانبي - المحفظة والبيانات */}
        <div className="lg:col-span-3 order-3 flex flex-col gap-4">
          <PiPayWallet />
          <div className="glass p-4 rounded-3xl border border-cyan-500/10 text-center">
            <p className="text-[10px] text-cyan-400/60 uppercase tracking-tighter">Pi Network Subdomain</p>
            <p className="text-sm font-mono text-white/80">lumira4394.pinet.com</p>
          </div>
        </div>
      </main>

      {/* Footer بسيط */}
      <footer className="mt-12 text-center opacity-30 text-[9px] tracking-[0.4em] uppercase">
        Lumira Smart Mirror · 2026 · Islam Ali Edition
      </footer>
    </div>
  );
}
