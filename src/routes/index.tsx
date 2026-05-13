import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CameraProvider } from "@/components/lumira/camera-context";
import { WalletProvider } from "@/components/lumira/wallet-context";
import { ProfileProvider } from "@/components/lumira/profile-context";
import { SkinProvider } from "@/components/lumira/skin-context";
import { LanguageProvider } from "@/components/lumira/i18n";
import { PiAuthProvider } from "@/components/lumira/pi-auth-context";
import { OutfitProvider } from "@/components/lumira/outfit-context";
import { LandingGate } from "@/components/lumira/LandingGate";
import { MirrorStageLayout } from "@/components/lumira/MirrorStageLayout";
import { CaptionsOverlay } from "@/components/lumira/CaptionsOverlay";
import bgImg from "@/assets/lumira-bg.jpg";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Lumira · Health & Elegance Smart Mirror" },
      { name: "description", content: "Choose your avatar and step into the Lumira Smart Mirror — AI skin care, makeup, hair and style with Pi Network wallet." },
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

  return (
    <>
      <CaptionsOverlay />
      <div
        className="fixed inset-0 -z-10 bg-cover bg-center animate-bg-zoom"
        style={{ backgroundImage: `url(${bgImg})`, filter: "blur(2px) brightness(0.7) saturate(1.1)" }}
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
        <MirrorStageLayout onBack={() => setStage("landing")} />
      )}
    </>
  );
}
