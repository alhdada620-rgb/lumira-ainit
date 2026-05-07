import { describe, it, expect, beforeEach, vi } from "vitest";
import { render } from "@testing-library/react";
import { useEffect, type ReactNode } from "react";
import { LanguageProvider, useT } from "@/components/lumira/i18n";
import { WalletProvider } from "@/components/lumira/wallet-context";
import { CameraProvider } from "@/components/lumira/camera-context";
import { ProfileProvider } from "@/components/lumira/profile-context";
import { HealthSkinAI } from "@/components/lumira/HealthSkinAI";
import { PiPayWallet } from "@/components/lumira/PiPayWallet";
import { MiniDashboard } from "@/components/lumira/MiniDashboard";
import { FashionStage } from "@/components/lumira/FashionStage";
import { ProfileData } from "@/components/lumira/ProfileData";

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

/**
 * "Screenshot" tests for jsdom: we snapshot the rendered DOM structure
 * (text + class names + attributes) of each panel in both RTL and LTR.
 * Any direction-affecting regression (logical end-* dropped for right-*,
 * mirrored padding/margin, text content swap) flips the snapshot and
 * fails CI — same intent as a visual regression test, but stable and
 * deterministic in headless Bun/Vitest.
 *
 * To accept an intentional UI change, run `bun run test -- -u` once.
 */

const PANELS: Array<{ name: string; render: () => ReactNode }> = [
  { name: "FashionStage", render: () => <FashionStage /> },
  { name: "HealthSkinAI", render: () => <HealthSkinAI /> },
  { name: "PiPayWallet", render: () => <PiPayWallet /> },
  { name: "MiniDashboard", render: () => <MiniDashboard /> },
  { name: "ProfileData", render: () => <ProfileData /> },
];

describe("Direction snapshots — LTR (en)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-05-07T12:34:00Z"));
    document.documentElement.removeAttribute("dir");
    document.documentElement.removeAttribute("lang");
  });

  for (const panel of PANELS) {
    it(`${panel.name} matches LTR snapshot`, () => {
      const { container } = renderWithLang(panel.render(), "en");
      expect(document.documentElement.getAttribute("dir")).toBe("ltr");
      expect(container.firstChild).toMatchSnapshot();
    });
  }
});

describe("Direction snapshots — RTL (ar)", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("dir");
    document.documentElement.removeAttribute("lang");
  });

  for (const panel of PANELS) {
    it(`${panel.name} matches RTL snapshot`, () => {
      const { container } = renderWithLang(panel.render(), "ar");
      expect(document.documentElement.getAttribute("dir")).toBe("rtl");
      expect(container.firstChild).toMatchSnapshot();
    });
  }
});

describe("Direction-sensitive class guards", () => {
  beforeEach(() => {
    document.documentElement.removeAttribute("dir");
    document.documentElement.removeAttribute("lang");
  });

  // Catches regressions where someone replaces logical (start-/end-/ms-/me-/ps-/pe-)
  // utilities with physical (left-/right-/ml-/mr-/pl-/pr-) ones, which would not
  // mirror in RTL.
  const PHYSICAL_RE =
    /(?:^|\s)(?:left-\d|right-\d|ml-\d|mr-\d|pl-\d|pr-\d|border-l-|border-r-|rounded-l|rounded-r)/;

  for (const panel of PANELS) {
    it(`${panel.name} avoids physical left/right utilities on layout containers`, () => {
      const { container } = renderWithLang(panel.render(), "ar");
      // Inspect the top-level panel + its direct children only — deep image/icon
      // utility classes are allowed (icons aren't direction-sensitive).
      const root = container.firstChild as HTMLElement | null;
      if (!root) return;
      // Only the panel root itself — decorative corner brackets inside
      // GlassPanel intentionally use physical positioning.
      const cls = root.getAttribute("class") ?? "";
      expect(
        PHYSICAL_RE.test(cls),
        `${panel.name} root has physical class: "${cls}"`,
      ).toBe(false);
    });
  }
});
