# Visual Regression Tests (Playwright)

Real-browser screenshot tests for FashionStage and the key panels in both
LTR (English) and RTL (Arabic). These complement the jsdom DOM snapshots in
`src/test/rtl-snapshots.test.tsx` by catching actual rendering regressions
(layout flips, mirrored padding, font fallback, image breakage).

## Running locally

First time only — install browser binaries:

```bash
bunx playwright install chromium
```

Run the suite (Playwright builds the app and serves it on port 4173):

```bash
bunx playwright test
```

Update baselines after an intentional UI change:

```bash
bunx playwright test --update-snapshots
```

Open the HTML report:

```bash
bunx playwright show-report
```

## What's covered

- Full `/index` page screenshot in EN and AR
- Per-panel screenshots: FashionStage, HealthSkinAI, PiPayWallet, MiniDashboard
- Two viewports: desktop (1280×900) and mobile (iPhone 13)
- Animations are disabled and `Date.now()` is frozen so screenshots are stable

## CI

Baselines are committed under `tests/visual/__screenshots__/`. CI fails when
a rendered panel diverges from its baseline beyond the configured tolerance
(`maxDiffPixelRatio: 0.02`).
