import { test, expect, type Page } from "@playwright/test";

const PANELS = [
  { id: "fashion-stage", titleEn: /Style Lab/i, titleAr: /مختبر التصميم/ },
  { id: "health-skin", titleEn: /AI Skin Analysis|Health.*Skin/i, titleAr: /تحليل البشرة/ },
  { id: "pi-pay", titleEn: /Pi Network Wallet|Pi Pay/i, titleAr: /محفظة شبكة Pi/ },
  { id: "mini-dashboard", titleEn: /Daily Dashboard/i, titleAr: /اللوحة اليومية/ },
  { id: "virtual-tryon", titleEn: /Virtual Try-?On.*AR/i, titleAr: /تجربة افتراضية.*واقع معزز/ },
] as const;

async function setLang(page: Page, lang: "en" | "ar") {
  await page.addInitScript((l) => {
    try {
      localStorage.setItem("lumira:lang", l);
    } catch {}
  }, lang);
}

async function freezeUI(page: Page) {
  // Pause time-sensitive UI (clock in MiniDashboard) and disable animations.
  await page.addStyleTag({
    content: `
      *, *::before, *::after {
        animation-duration: 0s !important;
        animation-delay: 0s !important;
        transition-duration: 0s !important;
        transition-delay: 0s !important;
      }
    `,
  });
  await page.evaluate(() => {
    const fixed = new Date("2026-05-07T12:34:00Z").getTime();
    // Stop the dashboard interval from advancing the clock.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).Date.now = () => fixed;
  });
}

async function gotoIndex(page: Page, lang: "en" | "ar") {
  await setLang(page, lang);
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await expect(page.locator("html")).toHaveAttribute("dir", lang === "ar" ? "rtl" : "ltr");
  await freezeUI(page);
  // Allow images to settle
  await page.evaluate(() =>
    Promise.all(
      Array.from(document.images).map((img) =>
        img.complete ? null : new Promise((r) => (img.onload = img.onerror = () => r(null))),
      ),
    ),
  );
}

function panelLocator(page: Page, title: RegExp) {
  // GlassPanel renders title text inside an <h3> within a `.glass-panel`.
  return page.locator(".glass-panel").filter({ has: page.getByRole("heading", { name: title }) }).first();
}

for (const lang of ["en", "ar"] as const) {
  test.describe(`Visual — ${lang.toUpperCase()}`, () => {
    test.beforeEach(async ({ page }) => {
      await gotoIndex(page, lang);
    });

    test(`full page — ${lang}`, async ({ page }) => {
      await expect(page).toHaveScreenshot(`index-${lang}.png`, { fullPage: true });
    });

    for (const panel of PANELS) {
      test(`${panel.id} — ${lang}`, async ({ page }) => {
        const title = lang === "ar" ? panel.titleAr : panel.titleEn;
        const locator = panelLocator(page, title);
        await locator.scrollIntoViewIfNeeded();
        await expect(locator).toBeVisible();
        await expect(locator).toHaveScreenshot(`${panel.id}-${lang}.png`);
      });
    }
  });
}
