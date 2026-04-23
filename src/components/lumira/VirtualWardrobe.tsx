import { Shirt, Search, Sparkles, LayoutGrid, List } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { GlassPanel } from "./GlassPanel";
import { emitTryOnItem, type TryOnPayload } from "./voice-events";

type ViewMode = "grid" | "list";

type Brand = "Zara" | "H&M" | "Nike" | "Arabic Elegance";

interface WardrobeItem extends TryOnPayload {
  brand: Brand;
}

const BRAND_GLYPH: Record<Brand, string> = {
  Zara: "Z",
  "H&M": "H",
  Nike: "✓",
  "Arabic Elegance": "ع",
};

// Brand color tokens (oklch keeps it inside the design system palette feel)
const BRAND_STYLE: Record<Brand, { ring: string; chip: string; glyphBg: string; glyphText: string }> = {
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
  "Arabic Elegance": {
    ring: "border-[oklch(0.7_0.15_85)]/40",
    chip: "border-[oklch(0.7_0.15_85)]/40 text-[oklch(0.8_0.13_85)]",
    glyphBg: "bg-gradient-to-br from-[oklch(0.65_0.13_85)] to-[oklch(0.45_0.1_60)] text-background",
    glyphText: "font-bold",
  },
};

const ITEMS: WardrobeItem[] = [
  // Zara — Men & Women
  { id: "z1", brand: "Zara", category: "Men", name: "Tailored Wool Blazer", tag: "Smart Casual",
    gradient: "linear-gradient(135deg, oklch(0.3 0.02 260), oklch(0.5 0.04 260))" },
  { id: "z2", brand: "Zara", category: "Women", name: "Satin Slip Dress", tag: "Evening",
    gradient: "linear-gradient(135deg, oklch(0.55 0.12 350), oklch(0.7 0.1 320))" },
  { id: "z3", brand: "Zara", category: "Men", name: "Linen Resort Shirt", tag: "Summer",
    gradient: "linear-gradient(135deg, oklch(0.85 0.04 90), oklch(0.7 0.06 70))" },
  { id: "z4", brand: "Zara", category: "Women", name: "High-Waist Trousers", tag: "Office",
    gradient: "linear-gradient(135deg, oklch(0.4 0.03 240), oklch(0.55 0.05 220))" },

  // H&M — Casual
  { id: "h1", brand: "H&M", category: "Casual", name: "Oversized Cotton Tee", tag: "Everyday",
    gradient: "linear-gradient(135deg, oklch(0.9 0.02 90), oklch(0.78 0.04 80))" },
  { id: "h2", brand: "H&M", category: "Casual", name: "Relaxed Denim Jacket", tag: "Layering",
    gradient: "linear-gradient(135deg, oklch(0.45 0.08 240), oklch(0.6 0.1 230))" },
  { id: "h3", brand: "H&M", category: "Casual", name: "Knit Cardigan", tag: "Cozy",
    gradient: "linear-gradient(135deg, oklch(0.6 0.06 30), oklch(0.75 0.08 50))" },

  // Nike — Sportswear
  { id: "n1", brand: "Nike", category: "Sportswear", name: "Tech Fleece Hoodie", tag: "Training",
    gradient: "linear-gradient(135deg, oklch(0.25 0.02 260), oklch(0.4 0.04 260))" },
  { id: "n2", brand: "Nike", category: "Sportswear", name: "Dri-FIT Run Top", tag: "Running",
    gradient: "linear-gradient(135deg, oklch(0.7 0.2 150), oklch(0.55 0.18 170))" },
  { id: "n3", brand: "Nike", category: "Sportswear", name: "Aero Track Pants", tag: "Athleisure",
    gradient: "linear-gradient(135deg, oklch(0.3 0.02 260), oklch(0.5 0.06 250))" },

  // Arabic Elegance — Abayas & Kaftans
  { id: "a1", brand: "Arabic Elegance", category: "Abaya", name: "Onyx Embroidered Abaya", tag: "Formal",
    gradient: "linear-gradient(135deg, oklch(0.2 0.02 280), oklch(0.4 0.05 280))" },
  { id: "a2", brand: "Arabic Elegance", category: "Kaftan", name: "Royal Velvet Kaftan", tag: "Occasion",
    gradient: "linear-gradient(135deg, oklch(0.35 0.15 280), oklch(0.55 0.18 300))" },
  { id: "a3", brand: "Arabic Elegance", category: "Abaya", name: "Pearl Sleeve Abaya", tag: "Elegant",
    gradient: "linear-gradient(135deg, oklch(0.85 0.04 90), oklch(0.7 0.06 60))" },
  { id: "a4", brand: "Arabic Elegance", category: "Kaftan", name: "Gold Thread Kaftan", tag: "Heritage",
    gradient: "linear-gradient(135deg, oklch(0.45 0.1 70), oklch(0.7 0.15 80))" },
];

const CATEGORIES = [
  { key: "all", label: "All" },
  { key: "Zara", label: "Zara · M & W" },
  { key: "H&M", label: "H&M · Casual" },
  { key: "Nike", label: "Nike · Sport" },
  { key: "Arabic Elegance", label: "Arabic Elegance" },
] as const;

type CategoryKey = (typeof CATEGORIES)[number]["key"];

export function VirtualWardrobe() {
  const [query, setQuery] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem("lumira:wardrobe-query") ?? "";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (query) {
        window.localStorage.setItem("lumira:wardrobe-query", query);
      } else {
        window.localStorage.removeItem("lumira:wardrobe-query");
      }
    } catch {
      // ignore quota / privacy-mode failures
    }
  }, [query]);
  const [cat, setCat] = useState<CategoryKey>(() => {
    if (typeof window === "undefined") return "all";
    const saved = window.localStorage.getItem("lumira:wardrobe-category");
    const valid = CATEGORIES.some((c) => c.key === saved);
    return valid ? (saved as CategoryKey) : "all";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem("lumira:wardrobe-category", cat);
    } catch {
      // ignore quota / privacy-mode failures
    }
  }, [cat]);
  const [lastTried, setLastTried] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>(() => {
    if (typeof window === "undefined") return "grid";
    const saved = window.localStorage.getItem("lumira:wardrobe-view");
    return saved === "list" || saved === "grid" ? saved : "grid";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem("lumira:wardrobe-view", view);
    } catch {
      // ignore quota / privacy-mode failures
    }
  }, [view]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ITEMS.filter((it) => {
      const inCat = cat === "all" || it.brand === cat;
      if (!inCat) return false;
      if (!q) return true;
      return (
        it.name.toLowerCase().includes(q) ||
        it.brand.toLowerCase().includes(q) ||
        it.category.toLowerCase().includes(q) ||
        it.tag.toLowerCase().includes(q)
      );
    });
  }, [query, cat]);

  const handleTryOn = (item: WardrobeItem) => {
    emitTryOnItem(item, "tap");
    setLastTried(item.id);
    window.setTimeout(() => setLastTried((cur) => (cur === item.id ? null : cur)), 1200);
  };

  return (
    <GlassPanel
      title="Virtual Wardrobe"
      icon={<Shirt className="h-3.5 w-3.5" />}
      className="lg:col-span-3"
      accent
    >
      {/* Controls */}
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="relative flex-1 md:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/70" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search items, brands, occasions…"
            className="w-full rounded-full border border-primary/25 bg-card/40 py-2 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground/60 backdrop-blur transition focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {CATEGORIES.map((c) => {
            const isActive = cat === c.key;
            return (
              <button
                key={c.key}
                onClick={() => setCat(c.key)}
                className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-widest transition ${
                  isActive
                    ? "border-accent/60 bg-accent/15 text-accent shadow-[var(--glow-soft)]"
                    : "border-primary/25 bg-card/30 text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }`}
              >
                {c.label}
              </button>
            );
          })}

          {/* View toggle */}
          <div
            role="group"
            aria-label="Wardrobe view"
            className="ml-1 inline-flex overflow-hidden rounded-full border border-primary/25 bg-card/30 backdrop-blur"
          >
            <button
              type="button"
              onClick={() => setView("grid")}
              aria-pressed={view === "grid"}
              title="Grid view"
              className={`flex h-7 w-7 items-center justify-center transition ${
                view === "grid"
                  ? "bg-accent/15 text-accent shadow-[var(--glow-soft)]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setView("list")}
              aria-pressed={view === "list"}
              title="List view"
              className={`flex h-7 w-7 items-center justify-center border-l border-primary/25 transition ${
                view === "list"
                  ? "bg-accent/15 text-accent shadow-[var(--glow-soft)]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <List className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
          <Search className="h-6 w-6 text-muted-foreground/40" />
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground/60">
            No matches
          </p>
          <p className="text-[10px] text-muted-foreground/50">
            Try a different brand or keyword
          </p>
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((item) => {
            const style = BRAND_STYLE[item.brand];
            const wasTried = lastTried === item.id;
            return (
              <article
                key={item.id}
                className={`group relative overflow-hidden rounded-lg border ${style.ring} bg-card/30 backdrop-blur transition hover:shadow-[var(--glow-soft)]`}
              >
                {/* Visual */}
                <div className="relative h-28">
                  <div
                    className="absolute inset-0"
                    style={{ background: item.gradient }}
                  />
                  <div className="absolute inset-0 hud-grid opacity-30" />

                  {/* Brand glyph (corner) */}
                  <div
                    className={`absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-md text-[11px] leading-none shadow-md ${style.glyphBg} ${style.glyphText}`}
                    aria-label={`${item.brand} logo`}
                    title={item.brand}
                  >
                    {BRAND_GLYPH[item.brand]}
                  </div>

                  {/* Category chip */}
                  <span
                    className={`absolute left-2 top-2 rounded-full border bg-background/40 px-1.5 py-0.5 text-[8px] uppercase tracking-widest backdrop-blur ${style.chip}`}
                  >
                    {item.category}
                  </span>

                  {/* Mannequin silhouette */}
                  <svg viewBox="0 0 100 120" className="absolute inset-0 mx-auto h-full text-foreground/40">
                    <circle cx="50" cy="22" r="9" fill="currentColor" opacity="0.4" />
                    <path
                      d="M30,42 L70,42 L74,92 L60,92 L55,58 L45,58 L40,92 L26,92 Z"
                      fill="currentColor"
                      opacity="0.4"
                    />
                  </svg>

                  {/* Try-on flash */}
                  {wasTried && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-sm">
                      <span className="inline-flex items-center gap-1 rounded-full border border-accent/60 bg-background/60 px-2 py-1 text-[9px] uppercase tracking-widest text-accent">
                        <Sparkles className="h-3 w-3" /> Sent to AR
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-xs text-foreground">{item.name}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {item.brand} · {item.tag}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleTryOn(item)}
                    className="mt-2 inline-flex w-full items-center justify-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-2 py-1.5 text-[10px] uppercase tracking-widest text-primary transition hover:bg-primary/20 hover:shadow-[var(--glow-soft)]"
                  >
                    <Sparkles className="h-3 w-3" /> Try On
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <ul className="divide-y divide-primary/10 overflow-hidden rounded-lg border border-primary/20 bg-card/20 backdrop-blur">
          {filtered.map((item) => {
            const style = BRAND_STYLE[item.brand];
            const wasTried = lastTried === item.id;
            return (
              <li
                key={item.id}
                className="flex items-center gap-3 px-2.5 py-2 transition hover:bg-primary/5"
              >
                {/* Swatch + brand glyph */}
                <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md border border-primary/20">
                  <div className="absolute inset-0" style={{ background: item.gradient }} />
                  <span
                    className={`absolute inset-0 flex items-center justify-center text-[11px] leading-none ${style.glyphBg} ${style.glyphText}`}
                    style={{ clipPath: "inset(35% 35% 0 0)" }}
                    aria-label={`${item.brand} logo`}
                    title={item.brand}
                  >
                    {BRAND_GLYPH[item.brand]}
                  </span>
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs text-foreground">{item.name}</p>
                  <p className="truncate text-[10px] text-muted-foreground">
                    {item.brand} · {item.category} · {item.tag}
                  </p>
                </div>

                {/* Try On */}
                <button
                  onClick={() => handleTryOn(item)}
                  className={`inline-flex shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-[10px] uppercase tracking-widest transition ${
                    wasTried
                      ? "border-accent/60 bg-accent/15 text-accent shadow-[var(--glow-soft)]"
                      : "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
                  }`}
                >
                  <Sparkles className="h-3 w-3" />
                  {wasTried ? "Sent" : "Try On"}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </GlassPanel>
  );
}
