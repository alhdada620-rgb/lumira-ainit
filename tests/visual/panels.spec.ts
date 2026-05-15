import { test, expect, type Page } from "@playwright/test";

/**
 * Visual regression for the new Lumira flow:
 *   1. LandingGate (/) — pick a gender pill → transitions to MirrorStageLayout.
 *   2. MirrorStageLayout — three category buttons open Sheet panels:
 *        Skin Care (HealthSkinAI), Makeup/Hair (FashionStage), Style (VirtualTryOn + FashionStage).
 *
 * Each panel is captured in both English (LTR) and Arabic (RTL).
 */

const PANELS = [
  {
    id: "skin",
    btnEn: /Skin Care/i,
    btnAr: /العناية بالبشرة/,
    titleEn: /Skin Care/i,
    titleAr: /العناية بالبشرة/,
  },
  {
    id: "makeup",
    btnEn: /Makeup\s*\/\s*Hair/i,
    btnAr: /المكياج\s*\/\s*الشعر/,
    titleEn: /Makeup & Hair/i,
    titleAr: /المكياج والشعر/,
  },
  {
    id: "style",
    // Category button accessible name concatenates title + subtitle
    btnEn: /Style\s+Custom outfit/i,
    btnAr: /الستايل\s+مولّد إطلالات/,
    titleEn: /Style Studio/i,
    titleAr: /ستوديو الستايل/,
  },
] as const;

async function setLang(page: Page, lang: "en" | "ar") {
  await page.addInitScript((l) => {
    try {
      localStorage.setItem("lumira:lang", l);
    } catch {}
  }, lang);
}

async function freezeUI(page: Page) {
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).Date.now = () => fixed;
  });
}

async function gotoLanding(page: Page, lang: "en" | "ar") {
  await setLang(page, lang);
  await page.goto("/");
  await page.waitForLoadState("networkidle");
  await expect(page.locator("html")).toHaveAttribute("dir", lang === "ar" ? "rtl" : "ltr");
  await freezeUI(page);
  // Wait for landing heading (EN: "Enter the Smart Mirror" / AR: "ابدأ تجربة المرآة الذكية")
  const landingHeading = lang === "ar" ? /ابدأ تجربة المرآة الذكية/ : /Enter the Smart Mirror/i;
  await expect(page.getByRole("heading", { name: landingHeading })).toBeVisible();
}

async function enterMirror(page: Page, lang: "en" | "ar") {
  // Click the gender pill — LandingGate auto-transitions after 280ms.
  const maleLabel = lang === "ar" ? /^ذكر$/ : /^Male$/i;
  await page.getByRole("button", { name: maleLabel }).first().click();
  // Mirror header: EN "SMART MIRROR" / AR "المرآة الذكية"
  const mirrorHeading = lang === "ar" ? /المرآة الذكية/ : /SMART MIRROR/i;
  await expect(page.getByRole("heading", { name: mirrorHeading })).toBeVisible({ timeout: 5000 });
  // Let images settle so screenshots are stable
  await page.evaluate(() =>
    Promise.all(
      Array.from(document.images).map((img) =>
        img.complete ? null : new Promise((r) => (img.onload = img.onerror = () => r(null))),
      ),
    ),
  );
}

async function openPanel(page: Page, btnName: RegExp) {
  await page.getByRole("button", { name: btnName }).first().click();
}

async function closePanel(page: Page) {
  // Radix Sheet renders a close button labelled "Close"
  const closeBtn = page.getByRole("button", { name: /^close$/i }).last();
  if (await closeBtn.isVisible().catch(() => false)) {
    await closeBtn.click();
  } else {
    await page.keyboard.press("Escape");
  }
  await expect(page.getByRole("dialog")).toHaveCount(0, { timeout: 5000 });
}

for (const lang of ["en", "ar"] as const) {
  test.describe(`Visual — ${lang.toUpperCase()}`, () => {
    test(`landing — ${lang}`, async ({ page }) => {
      await gotoLanding(page, lang);
      await expect(page).toHaveScreenshot(`landing-${lang}.png`, { fullPage: true });
    });

    test(`mirror — ${lang}`, async ({ page }) => {
      await gotoLanding(page, lang);
      await enterMirror(page, lang);
      await expect(page).toHaveScreenshot(`mirror-${lang}.png`, { fullPage: true });
    });

    for (const panel of PANELS) {
      test(`${panel.id} panel — ${lang}`, async ({ page }) => {
        await gotoLanding(page, lang);
        await enterMirror(page, lang);
        const btn = lang === "ar" ? panel.btnAr : panel.btnEn;
        const title = lang === "ar" ? panel.titleAr : panel.titleEn;
        await openPanel(page, btn);

        const dialog = page.getByRole("dialog").filter({
          has: page.getByRole("heading", { name: title }),
        }).first();
        await expect(dialog).toBeVisible();
        // Allow images / dynamic content inside the sheet to settle
        await page.waitForTimeout(150);
        await expect(dialog).toHaveScreenshot(`${panel.id}-${lang}.png`);
        await closePanel(page);
      });
    }
  });
}
