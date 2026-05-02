import { Sparkles, Lock, Shirt, Palette, Brush, Eye, Heart, Camera } from "lucide-react";
import { useState, type ComponentType } from "react";
import { GlassPanel } from "./GlassPanel";
import { useCamera, type AROverlayKind } from "./camera-context";
import { useWallet } from "./wallet-context";
import { useT } from "./i18n";

type CatalogTab = "wardrobe" | "makeup";

type WardrobeBrand = "Zara" | "H&M" | "Nike" | "Namshi";
type MakeupCategory = "Lipstick" | "Eyeliner" | "Blush";

interface BaseItem {
  id: string;
  name: string;
  tag: string;
  /** Premium items require unlocking with Pi */
  premium?: boolean;
  /** Cost in π — required when premium */
  price?: number;
}

interface WardrobeProduct extends BaseItem {
  brand: WardrobeBrand;
  /** CSS gradient for the AR placeholder */
  gradient: string;
}

interface MakeupProduct extends BaseItem {
  category: MakeupCategory;
  /** Hex / oklch color used as the AR tint */
  shade: string;
  shadeName: string;
}

const WARDROBE: WardrobeProduct[] = [
  // Zara
  { id: "w-zara-1", brand: "Zara", name: "Tailored Wool Blazer", tag: "Smart Casual",
    gradient: "linear-gradient(135deg, oklch(0.3 0.02 260), oklch(0.5 0.04 260))" },
  { id: "w-zara-2", brand: "Zara", name: "Satin Slip Dress", tag: "Evening", premium: true, price: 18.5,
    gradient: "linear-gradient(135deg, oklch(0.55 0.12 350), oklch(0.7 0.1 320))" },
  // H&M
  { id: "w-hm-1", brand: "H&M", name: "Oversized Cotton Tee", tag: "Everyday",
    gradient: "linear-gradient(135deg, oklch(0.9 0.02 90), oklch(0.78 0.04 80))" },
  { id: "w-hm-2", brand: "H&M", name: "Relaxed Denim Jacket", tag: "Layering",
    gradient: "linear-gradient(135deg, oklch(0.45 0.08 240), oklch(0.6 0.1 230))" },
  // Nike
  { id: "w-nike-1", brand: "Nike", name: "Tech Fleece Hoodie", tag: "Training",
    gradient: "linear-gradient(135deg, oklch(0.25 0.02 260), oklch(0.4 0.04 260))" },
  { id: "w-nike-2", brand: "Nike", name: "Aero Run Vest", tag: "Performance", premium: true, price: 22,
    gradient: "linear-gradient(135deg, oklch(0.7 0.2 150), oklch(0.55 0.18 170))" },
  // Namshi · Arabic Styles
  { id: "w-nam-1", brand: "Namshi", name: "Onyx Embroidered Abaya", tag: "Arabic · Formal",
    gradient: "linear-gradient(135deg, oklch(0.2 0.02 280), oklch(0.4 0.05 280))" },
  { id: "w-nam-2", brand: "Namshi", name: "Royal Velvet Kaftan", tag: "Arabic · Occasion", premium: true, price: 32,
    gradient: "linear-gradient(135deg, oklch(0.35 0.15 280), oklch(0.55 0.18 300))" },
];

const MAKEUP: MakeupProduct[] = [
  // Lipstick
  { id: "m-lip-1", category: "Lipstick", name: "Velvet Matte", shadeName: "Crimson Muse", tag: "Sephora · Bestseller",
    shade: "oklch(0.55 0.22 25)" },
  { id: "m-lip-2", category: "Lipstick", name: "Liquid Glow", shadeName: "Rose Aurora", tag: "Sephora · New",
    shade: "oklch(0.7 0.16 15)" },
  { id: "m-lip-3", category: "Lipstick", name: "Couture Lacquer", shadeName: "Plum Reverie", tag: "Sephora · Limited", premium: true, price: 9,
    shade: "oklch(0.45 0.18 350)" },
  // Eyeliner
  { id: "m-eye-1", category: "Eyeliner", name: "Precision Liner", shadeName: "Carbon Noir", tag: "Sephora · Pro",
    shade: "oklch(0.18 0.02 260)" },
  { id: "m-eye-2", category: "Eyeliner", name: "Kohl Smoulder", shadeName: "Smoke Quartz", tag: "Sephora · Smudge-proof",
    shade: "oklch(0.32 0.04 260)" },
  { id: "m-eye-3", category: "Eyeliner", name: "Galaxy Liner", shadeName: "Cosmic Indigo", tag: "Sephora · Limited", premium: true, price: 7.5,
    shade: "oklch(0.4 0.18 280)" },
  // Blush
  { id: "m-blush-1", category: "Blush", name: "Cloud Blush", shadeName: "Petal Pink", tag: "Sephora · Sheer",
    shade: "oklch(0.78 0.12 15)" },
  { id: "m-blush-2", category: "Blush", name: "Sunlit Powder", shadeName: "Peach Halo", tag: "Sephora · Glow",
    shade: "oklch(0.78 0.13 50)" },
  { id: "m-blush-3", category: "Blush", name: "Couture Cheek", shadeName: "Berry Crush", tag: "Sephora · Limited", premium: true, price: 6,
    shade: "oklch(0.6 0.18 10)" },
];

const BRAND_GLYPH: Record<WardrobeBrand, string> = {
  Zara: "Z",
  "H&M": "H",
  Nike: "✓",
  Namshi: "ن",
};

const BRAND_STYLE: Record<WardrobeBrand, { ring: string; chip: string; glyphBg: string; glyphText: string }> = {
  Zara: {
    ring: "border-foreground/40",
    chip: "border-foreground/30 text-foreground/90",
    glyphBg: "bg-foreground text-background",
    glyphText: "font-serif",
  },
  "H&M": {
    ring: "border-[oklch(0.65_0.22_25)]/50",
    chip: "border-[oklch(0.65_0.22_25)]/40 text-[oklch(0.75_0.2_25)]",
    glyphBg: "bg-[oklch(0.6_0.22_25)] text-white",
    glyphText: "font-bold italic",
  },
  Nike: {
    ring: "border-accent/40",
    chip: "border-accent/40 text-accent",
    glyphBg: "bg-accent text-background",
    glyphText: "font-black",
  },
  Namshi: {
    ring: "border-[oklch(0.7_0.15_85)]/40",
    chip: "border-[oklch(0.7_0.15_85)]/40 text-[oklch(0.8_0.13_85)]",
    glyphBg: "bg-gradient-to-br from-[oklch(0.65_0.13_85)] to-[oklch(0.45_0.1_60)] text-background",
    glyphText: "font-bold",
  },
};

const MAKEUP_ICON: Record<MakeupCategory, ComponentType<{ className?: string }>> = {
  Lipstick: Heart,
  Eyeliner: Eye,
  Blush: Brush,
};

const MAKEUP_KIND: Record<MakeupCategory, AROverlayKind> = {
  Lipstick: "lipstick",
  Eyeliner: "eyeliner",
  Blush: "blush",
};

export function SmartCatalog() {
  const { t } = useT();
  const [tab, setTab] = useState<CatalogTab>("wardrobe");
  const [brandFilter, setBrandFilter] = useState<"All" | WardrobeBrand>("All");
  const [makeupFilter, setMakeupFilter] = useState<"All" | MakeupCategory>("All");
  const [flash, setFlash] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ id: string; type: "ok" | "err"; msg: string } | null>(null);

  const { setAROverlay, active, start, starting } = useCamera();
  const { balance, isUnlocked, unlock } = useWallet();

  const flashItem = (id: string) => {
    setFlash(id);
    window.setTimeout(() => setFlash((cur) => (cur === id ? null : cur)), 1100);
  };

  const showFeedback = (id: string, type: "ok" | "err", msg: string) => {
    setFeedback({ id, type, msg });
    window.setTimeout(() => setFeedback((cur) => (cur?.id === id ? null : cur)), 1800);
  };

  const handleTryWardrobe = (item: WardrobeProduct) => {
    setAROverlay({
      id: item.id,
      kind: "outfit",
      label: item.name,
      sub: `${item.brand} · ${item.tag}`,
      color: item.gradient,
    });
    flashItem(item.id);
  };

  const handleTryMakeup = (item: MakeupProduct) => {
    setAROverlay({
      id: item.id,
      kind: MAKEUP_KIND[item.category],
      label: `${item.name} · ${item.shadeName}`,
      sub: `Sephora · ${item.category}`,
      color: item.shade,
    });
    flashItem(item.id);
  };

  const handleUnlock = (item: BaseItem) => {
    if (!item.price) return;
    const result = unlock({ id: item.id, name: item.name, price: item.price });
    if (result.ok) {
      showFeedback(item.id, "ok", t("catalog.unlocked", { price: item.price.toFixed(2) }));
    } else if (result.reason === "insufficient") {
      showFeedback(item.id, "err", t("catalog.insufficient"));
    } else {
      showFeedback(item.id, "ok", t("catalog.alreadyUnlocked"));
    }
  };

  const wardrobeFiltered = brandFilter === "All" ? WARDROBE : WARDROBE.filter((w) => w.brand === brandFilter);
  const makeupFiltered = makeupFilter === "All" ? MAKEUP : MAKEUP.filter((m) => m.category === makeupFilter);

  return (
    <GlassPanel
      title={t("catalog.title")}
      icon={<Sparkles className="h-3.5 w-3.5" />}
      className="lg:col-span-3"
      accent
    >
      {/* Tabs */}
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div
          role="tablist"
          aria-label="Catalog section"
          className="inline-flex overflow-hidden rounded-full border border-primary/25 bg-card/30 p-0.5 backdrop-blur"
        >
          <button
            role="tab"
            aria-selected={tab === "wardrobe"}
            onClick={() => setTab("wardrobe")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] uppercase tracking-widest transition ${
              tab === "wardrobe"
                ? "bg-primary/15 text-primary shadow-[var(--glow-soft)]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Shirt className="h-3 w-3" /> {t("catalog.tab.wardrobe")}
          </button>
          <button
            role="tab"
            aria-selected={tab === "makeup"}
            onClick={() => setTab("makeup")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] uppercase tracking-widest transition ${
              tab === "makeup"
                ? "bg-accent/15 text-accent shadow-[var(--glow-soft)]"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Palette className="h-3 w-3" /> {t("catalog.tab.makeup")}
          </button>
        </div>

        {/* Camera reminder */}
        {!active && (
          <button
            type="button"
            onClick={start}
            disabled={starting}
            className="inline-flex items-center gap-1.5 self-start rounded-full border border-primary/40 bg-background/40 px-3 py-1.5 text-[10px] uppercase tracking-widest text-primary backdrop-blur transition hover:bg-primary/10 disabled:opacity-60 md:self-auto"
          >
            <Camera className="h-3 w-3" /> {starting ? t("catalog.starting") : t("catalog.activateMirror")}
          </button>
        )}
      </div>

      {/* Filter chips */}
      {tab === "wardrobe" ? (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {(["All", "Zara", "H&M", "Nike", "Namshi"] as const).map((b) => (
            <button
              key={b}
              onClick={() => setBrandFilter(b)}
              className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-widest transition ${
                brandFilter === b
                  ? "border-accent/60 bg-accent/15 text-accent shadow-[var(--glow-soft)]"
                  : "border-primary/25 bg-card/30 text-muted-foreground hover:border-primary/50 hover:text-foreground"
              }`}
            >
              {b === "Namshi" ? t("catalog.brand.namshiArabic") : b}
            </button>
          ))}
        </div>
      ) : (
        <div className="mb-3 flex flex-wrap gap-1.5">
          {(["All", "Lipstick", "Eyeliner", "Blush"] as const).map((c) => (
            <button
              key={c}
              onClick={() => setMakeupFilter(c)}
              className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-widest transition ${
                makeupFilter === c
                  ? "border-accent/60 bg-accent/15 text-accent shadow-[var(--glow-soft)]"
                  : "border-primary/25 bg-card/30 text-muted-foreground hover:border-primary/50 hover:text-foreground"
              }`}
            >
              {c === "Lipstick" ? t("catalog.cat.lipstick") : c === "Eyeliner" ? t("catalog.cat.eyeliner") : c === "Blush" ? t("catalog.cat.blush") : c}
            </button>
          ))}
        </div>
      )}

      {/* Gallery */}
      {tab === "wardrobe" ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {wardrobeFiltered.map((item) => {
            const style = BRAND_STYLE[item.brand];
            const unlocked = isUnlocked(item.id);
            const locked = !!item.premium && !unlocked;
            const fb = feedback?.id === item.id ? feedback : null;
            const tried = flash === item.id;
            const canAfford = item.price ? balance >= item.price : true;

            return (
              <article
                key={item.id}
                className={`group relative overflow-hidden rounded-lg border ${style.ring} bg-card/30 backdrop-blur transition hover:shadow-[var(--glow-soft)]`}
              >
                <div className="relative h-28">
                  <div className="absolute inset-0" style={{ background: item.gradient }} />
                  <div className="absolute inset-0 hud-grid opacity-30" />

                  <div
                    className={`absolute end-2 top-2 flex h-6 w-6 items-center justify-center rounded-md text-[11px] leading-none shadow-md ${style.glyphBg} ${style.glyphText}`}
                    aria-label={`${item.brand} logo`}
                    title={item.brand}
                  >
                    {BRAND_GLYPH[item.brand]}
                  </div>

                  {item.premium && (
                    <span className="absolute start-2 top-2 inline-flex items-center gap-1 rounded-full border border-accent/60 bg-background/60 px-1.5 py-0.5 text-[8px] uppercase tracking-widest text-accent backdrop-blur">
                      <Lock className="h-2.5 w-2.5" /> {t("catalog.premium")}
                    </span>
                  )}

                  <svg viewBox="0 0 100 120" className="absolute inset-0 mx-auto h-full text-foreground/40">
                    <circle cx="50" cy="22" r="9" fill="currentColor" opacity="0.4" />
                    <path
                      d="M30,42 L70,42 L74,92 L60,92 L55,58 L45,58 L40,92 L26,92 Z"
                      fill="currentColor"
                      opacity="0.4"
                    />
                  </svg>

                  {tried && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-sm">
                      <span className="inline-flex items-center gap-1 rounded-full border border-accent/60 bg-background/60 px-2 py-1 text-[9px] uppercase tracking-widest text-accent">
                        <Sparkles className="h-3 w-3" /> {t("catalog.sentMirror")}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-xs text-foreground">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {item.brand} · {item.tag}
                    </p>
                  </div>

                  {locked ? (
                    <button
                      onClick={() => handleUnlock(item)}
                      disabled={!canAfford}
                      className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded-md border border-accent/50 bg-gradient-to-r from-accent/15 via-primary/15 to-accent/15 px-2 py-1.5 text-[10px] uppercase tracking-widest text-accent shadow-[var(--glow-soft)] transition hover:shadow-[var(--glow-accent)] disabled:opacity-50"
                      title={canAfford ? t("catalog.payTitle") : t("catalog.insufficient")}
                    >
                      <Lock className="h-3 w-3" /> {t("catalog.unlock")} · {item.price?.toFixed(2)} π
                    </button>
                  ) : (
                    <button
                      onClick={() => handleTryWardrobe(item)}
                      className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-2 py-1.5 text-[10px] uppercase tracking-widest text-primary transition hover:bg-primary/20 hover:shadow-[var(--glow-soft)]"
                    >
                      <Sparkles className="h-3 w-3" /> {t("catalog.tryOn")}
                    </button>
                  )}

                  {fb && (
                    <p
                      className={`mt-1.5 text-center text-[9px] uppercase tracking-widest ${
                        fb.type === "ok" ? "text-emerald-400" : "text-destructive"
                      }`}
                    >
                      {fb.msg}
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {makeupFiltered.map((item) => {
            const Icon = MAKEUP_ICON[item.category];
            const unlocked = isUnlocked(item.id);
            const locked = !!item.premium && !unlocked;
            const fb = feedback?.id === item.id ? feedback : null;
            const tried = flash === item.id;
            const canAfford = item.price ? balance >= item.price : true;

            return (
              <article
                key={item.id}
                className="group relative overflow-hidden rounded-lg border border-accent/30 bg-card/30 backdrop-blur transition hover:shadow-[var(--glow-soft)]"
              >
                <div className="relative h-28">
                  {/* Shade swatch */}
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `radial-gradient(circle at 35% 35%, oklch(0.95 0.02 220 / 0.25), transparent 55%), ${item.shade}`,
                    }}
                  />
                  <div className="absolute inset-0 hud-grid opacity-25" />

                  {/* Sephora chip */}
                  <span className="absolute start-2 top-2 inline-flex items-center gap-1 rounded-full border border-foreground/30 bg-background/50 px-1.5 py-0.5 text-[8px] uppercase tracking-[0.2em] text-foreground/90 backdrop-blur">
                    <span className="font-serif italic">S</span> Sephora
                  </span>

                  {item.premium && (
                    <span className="absolute end-2 top-2 inline-flex items-center gap-1 rounded-full border border-accent/60 bg-background/60 px-1.5 py-0.5 text-[8px] uppercase tracking-widest text-accent backdrop-blur">
                      <Lock className="h-2.5 w-2.5" /> {t("catalog.premium")}
                    </span>
                  )}

                  <Icon className="absolute inset-0 m-auto h-9 w-9 text-foreground/80" />

                  {tried && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-sm">
                      <span className="inline-flex items-center gap-1 rounded-full border border-accent/60 bg-background/60 px-2 py-1 text-[9px] uppercase tracking-widest text-accent">
                        <Sparkles className="h-3 w-3" /> {t("catalog.appliedMirror")}
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-xs text-foreground">{item.name}</p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      {item.shadeName} · {item.category}
                    </p>
                  </div>

                  {locked ? (
                    <button
                      onClick={() => handleUnlock(item)}
                      disabled={!canAfford}
                      className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded-md border border-accent/50 bg-gradient-to-r from-accent/15 via-primary/15 to-accent/15 px-2 py-1.5 text-[10px] uppercase tracking-widest text-accent shadow-[var(--glow-soft)] transition hover:shadow-[var(--glow-accent)] disabled:opacity-50"
                      title={canAfford ? t("catalog.payTitle") : t("catalog.insufficient")}
                    >
                      <Lock className="h-3 w-3" /> {t("catalog.unlock")} · {item.price?.toFixed(2)} π
                    </button>
                  ) : (
                    <button
                      onClick={() => handleTryMakeup(item)}
                      className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded-md border border-accent/40 bg-accent/10 px-2 py-1.5 text-[10px] uppercase tracking-widest text-accent transition hover:bg-accent/20 hover:shadow-[var(--glow-soft)]"
                    >
                      <Sparkles className="h-3 w-3" /> {t("catalog.tryOn")}
                    </button>
                  )}

                  {fb && (
                    <p
                      className={`mt-1.5 text-center text-[9px] uppercase tracking-widest ${
                        fb.type === "ok" ? "text-emerald-400" : "text-destructive"
                      }`}
                    >
                      {fb.msg}
                    </p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <p className="mt-3 text-[10px] leading-relaxed text-muted-foreground">
        {t("catalog.footnote.tap")} <span className="text-primary">{t("catalog.tryOn")}</span> {t("catalog.footnote.body")} <span className="text-accent">π</span> {t("catalog.footnote.suffix")}
      </p>
    </GlassPanel>
  );
}
