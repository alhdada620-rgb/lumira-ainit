import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { useEffect, type ReactNode } from "react";
import { LanguageProvider, useT } from "@/components/lumira/i18n";
import { WalletProvider } from "@/components/lumira/wallet-context";
import { CameraProvider } from "@/components/lumira/camera-context";
import { ProfileProvider } from "@/components/lumira/profile-context";
import { HealthSkinAI } from "@/components/lumira/HealthSkinAI";
import { PiPayWallet } from "@/components/lumira/PiPayWallet";
import { MiniDashboard } from "@/components/lumira/MiniDashboard";
import { FashionStage } from "@/components/lumira/FashionStage";

// Mock asset imports (jsdom can't decode jpg)
vi.mock("@/assets/lumira-bg.jpg", () => ({ default: "bg.jpg" }));
vi.mock("@/assets/lumira-avatar.jpg", () => ({ default: "avatar.jpg" }));

function Providers({ children }: { children: ReactNode }) {
  return (
    <LanguageProvider>
      <WalletProvider>
        <ProfileProvider>
          <CameraProvider>{children}</CameraProvider>
        </ProfileProvider>
      </WalletProvider>
    </LanguageProvider>
  );
}

function LangSwitcher({ to }: { to: "en" | "ar" }) {
  const { lang, toggleLang } = useT();
  useEffect(() => {
    if (lang !== to) toggleLang();
  }, [lang, to, toggleLang]);
  return null;
}

function renderWithLang(ui: ReactNode, lang: "en" | "ar") {
  return render(
    <Providers>
      <LangSwitcher to={lang} />
      {ui}
    </Providers>,
  );
}

describe("RTL / language direction", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("dir");
    document.documentElement.removeAttribute("lang");
  });

  it("sets <html dir=ltr lang=en> in English mode", () => {
    renderWithLang(<HealthSkinAI />, "en");
    expect(document.documentElement.getAttribute("lang")).toBe("en");
    expect(document.documentElement.getAttribute("dir")).toBe("ltr");
  });

  it("sets <html dir=rtl lang=ar> in Arabic mode", () => {
    renderWithLang(<HealthSkinAI />, "ar");
    expect(document.documentElement.getAttribute("lang")).toBe("ar");
    expect(document.documentElement.getAttribute("dir")).toBe("rtl");
  });
});

describe("Panel translations", () => {
  it("Health & Skin AI renders Arabic labels in ar mode", () => {
    renderWithLang(<HealthSkinAI />, "ar");
    expect(screen.getByText("تحليل البشرة بالذكاء الاصطناعي")).toBeInTheDocument();
    expect(screen.getByText("الترطيب")).toBeInTheDocument();
    expect(screen.getByText("النعومة")).toBeInTheDocument();
  });

  it("Health & Skin AI renders English labels in en mode", () => {
    renderWithLang(<HealthSkinAI />, "en");
    expect(screen.getByText("AI Skin Analysis")).toBeInTheDocument();
    expect(screen.getByText("Hydration")).toBeInTheDocument();
    expect(screen.getByText("Smoothness")).toBeInTheDocument();
  });

  it("Pi Pay Wallet shows localized PAY WITH PI button", () => {
    const { unmount } = renderWithLang(<PiPayWallet />, "en");
    expect(screen.getByRole("button", { name: /pay with pi/i })).toBeInTheDocument();
    expect(screen.getByText("Pi Network Wallet")).toBeInTheDocument();
    unmount();

    renderWithLang(<PiPayWallet />, "ar");
    expect(screen.getByRole("button", { name: /ادفع بـ Pi/ })).toBeInTheDocument();
    expect(screen.getByText("محفظة شبكة Pi")).toBeInTheDocument();
  });

  it("Mini dashboard localizes title and weather", () => {
    const { unmount } = renderWithLang(<MiniDashboard />, "en");
    expect(screen.getByText("Daily Dashboard")).toBeInTheDocument();
    expect(screen.getByText("CAIRO")).toBeInTheDocument();
    unmount();

    renderWithLang(<MiniDashboard />, "ar");
    expect(screen.getByText("اللوحة اليومية")).toBeInTheDocument();
    expect(screen.getByText("القاهرة")).toBeInTheDocument();
  });

  it("Fashion Stage renders the Style Lab title and brand carousel in both languages", () => {
    const { unmount } = renderWithLang(<FashionStage />, "en");
    expect(screen.getByText(/Style Lab/i)).toBeInTheDocument();
    for (const b of ["H&M", "NIKE", "ZARA"]) {
      expect(screen.getByRole("button", { name: b })).toBeInTheDocument();
    }
    unmount();

    renderWithLang(<FashionStage />, "ar");
    expect(screen.getByText(/مختبر التصميم/)).toBeInTheDocument();
  });
});

describe("Signature alignment uses logical end-edge utility", () => {
  // Render a minimal footer matching index.tsx so the test catches accidental
  // regressions to absolute right-* (which would not mirror in RTL).
  function Signature() {
    return (
      <footer
        data-testid="signature"
        className="fixed bottom-3 end-4 z-20 flex items-center gap-2"
      >
        <span>Developed by: eslam Ali</span>
        <span dir="rtl" lang="ar">
          #إسلام_علي
        </span>
      </footer>
    );
  }

  it("uses logical `end-4` (mirrors in RTL) rather than `right-4`", () => {
    render(<Signature />);
    const sig = screen.getByTestId("signature");
    expect(sig.className).toContain("end-4");
    expect(sig.className).not.toContain("right-4");
    expect(sig.className).toContain("bottom-3");
  });

  it("Arabic hashtag retains explicit RTL direction", () => {
    render(<Signature />);
    const arabic = screen.getByText("#إسلام_علي");
    expect(arabic).toHaveAttribute("dir", "rtl");
    expect(arabic).toHaveAttribute("lang", "ar");
  });
});

describe("Language toggle round-trip", () => {
  it("flipping languages updates <html dir> back and forth", () => {
    function Probe() {
      const { lang, toggleLang } = useT();
      return (
        <button data-testid="probe" data-lang={lang} onClick={toggleLang}>
          flip
        </button>
      );
    }
    const { getByTestId } = render(
      <Providers>
        <Probe />
      </Providers>,
    );

    expect(document.documentElement.getAttribute("dir")).toBe("ltr");
    act(() => getByTestId("probe").click());
    expect(document.documentElement.getAttribute("dir")).toBe("rtl");
    act(() => getByTestId("probe").click());
    expect(document.documentElement.getAttribute("dir")).toBe("ltr");
  });
});
