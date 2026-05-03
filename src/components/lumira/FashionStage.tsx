import { useEffect, useRef, useState } from "react";
import { GlassPanel } from "./GlassPanel";
import {
  Sparkles, Camera, CameraOff, Loader2, X, ShoppingBag,
  Video, User2, Upload, Image as ImageIcon,
} from "lucide-react";
import { useCamera } from "./camera-context";
import { useT } from "./i18n";
import { useProfile } from "./profile-context";

import mannequinMale from "@/assets/mannequin-male.png";
import mannequinFemale from "@/assets/mannequin-female.png";
import closetBackdrop from "@/assets/closet-backdrop.jpg";
import amazonLogo from "@/assets/amazon-logo.png";
import imgHmTee from "@/assets/garments/hm-tee.png";
import imgNikeHoodie from "@/assets/garments/nike-hoodie.png";
import imgZaraBlazer from "@/assets/garments/zara-blazer.png";
import imgNamshiAbaya from "@/assets/garments/namshi-abaya.png";
import imgAdidasJacket from "@/assets/garments/adidas-jacket.png";
import imgSephoraLipstick from "@/assets/garments/sephora-lipstick.png";

const AMAZON_TAG = "lumiraai-20";

type Category = "top" | "bottom" | "dress" | "accessory" | "lips" | "cheeks" | "eyes";

interface CatalogItem {
  id: string;
  name: string;
  tag: string;
  gradient: string;
  query: string;
  category: Category;
  /** Primary fabric color (hex or oklch) used by the SVG garment */
  color: string;
  /** Hi-res transparent PNG of the garment for AR overlay & catalog */
  image?: string;
}

interface Brand {
  id: string;
  name: string;
  outfit: string;
  tint: string;
  items: CatalogItem[];
}

const BRANDS: Brand[] = [
  {
    id: "hm", name: "H&M", outfit: "Casual Crew",
    tint: "linear-gradient(135deg, oklch(0.55 0.2 25 / 0.55), oklch(0.4 0.15 25 / 0.4))",
    items: [
      { id: "hm-1", name: "Oversized Cotton Tee", tag: "Everyday", category: "top", color: "#e8d9b8", image: imgHmTee, query: "h&m oversized cotton tee", gradient: "linear-gradient(135deg, oklch(0.9 0.02 90 / 0.5), oklch(0.78 0.04 80 / 0.4))" },
      { id: "hm-2", name: "Relaxed Denim Jacket", tag: "Layering", category: "top", color: "#3a5a82", query: "h&m relaxed denim jacket", gradient: "linear-gradient(135deg, oklch(0.45 0.08 240 / 0.5), oklch(0.6 0.1 230 / 0.45))" },
      { id: "hm-3", name: "Linen Blazer", tag: "Smart Casual", category: "top", color: "#c2a878", query: "h&m linen blazer", gradient: "linear-gradient(135deg, oklch(0.7 0.05 70 / 0.5), oklch(0.55 0.06 60 / 0.4))" },
      { id: "hm-4", name: "Knit Mock-Neck Sweater", tag: "Winter", category: "top", color: "#7a3030", query: "h&m knit mock neck sweater", gradient: "linear-gradient(135deg, oklch(0.5 0.08 25 / 0.5), oklch(0.35 0.1 20 / 0.45))" },
    ],
  },
  {
    id: "nike", name: "NIKE", outfit: "Sporty Tech Fleece",
    tint: "linear-gradient(135deg, oklch(0.5 0.1 230 / 0.55), oklch(0.3 0.05 230 / 0.45))",
    items: [
      { id: "nike-1", name: "Tech Fleece Hoodie", tag: "Training", category: "top", color: "#1a1f2e", image: imgNikeHoodie, query: "nike tech fleece hoodie", gradient: "linear-gradient(135deg, oklch(0.25 0.02 260 / 0.55), oklch(0.4 0.04 260 / 0.45))" },
      { id: "nike-2", name: "Aero Run Vest", tag: "Performance", category: "top", color: "#2ec27e", query: "nike aero run vest", gradient: "linear-gradient(135deg, oklch(0.7 0.2 150 / 0.5), oklch(0.55 0.18 170 / 0.4))" },
      { id: "nike-3", name: "Dri-FIT Tee", tag: "Sport", category: "top", color: "#c0392b", query: "nike dri-fit shirt", gradient: "linear-gradient(135deg, oklch(0.5 0.18 25 / 0.5), oklch(0.4 0.16 20 / 0.4))" },
      { id: "nike-4", name: "Tech Pack Joggers", tag: "Lifestyle", category: "bottom", color: "#0f1420", query: "nike tech pack joggers", gradient: "linear-gradient(135deg, oklch(0.2 0.02 260 / 0.55), oklch(0.35 0.04 260 / 0.45))" },
    ],
  },
  {
    id: "zara", name: "ZARA", outfit: "Minimal Tailoring",
    tint: "linear-gradient(135deg, oklch(0.35 0.04 60 / 0.55), oklch(0.2 0.02 60 / 0.45))",
    items: [
      { id: "zara-1", name: "Tailored Wool Blazer", tag: "Smart Casual", category: "top", color: "#2a2f3d", image: imgZaraBlazer, query: "zara tailored wool blazer", gradient: "linear-gradient(135deg, oklch(0.3 0.02 260 / 0.55), oklch(0.5 0.04 260 / 0.45))" },
      { id: "zara-2", name: "Satin Slip Dress", tag: "Evening", category: "dress", color: "#a23864", query: "zara satin slip dress", gradient: "linear-gradient(135deg, oklch(0.55 0.12 350 / 0.5), oklch(0.7 0.1 320 / 0.4))" },
      { id: "zara-3", name: "Pleated Wide-Leg Trousers", tag: "Modern", category: "bottom", color: "#5b513e", query: "zara pleated wide leg trousers", gradient: "linear-gradient(135deg, oklch(0.4 0.03 80 / 0.55), oklch(0.25 0.02 80 / 0.45))" },
      { id: "zara-4", name: "Cropped Leather Jacket", tag: "Statement", category: "top", color: "#1a0f0a", query: "zara cropped leather jacket", gradient: "linear-gradient(135deg, oklch(0.18 0.02 30 / 0.55), oklch(0.3 0.04 30 / 0.45))" },
    ],
  },
  {
    id: "namshi", name: "NAMSHI", outfit: "Modern Abaya",
    tint: "linear-gradient(135deg, oklch(0.6 0.18 320 / 0.5), oklch(0.4 0.12 280 / 0.4))",
    items: [
      { id: "nam-1", name: "Onyx Embroidered Abaya", tag: "Formal", category: "dress", color: "#0d0a1a", image: imgNamshiAbaya, query: "namshi embroidered abaya", gradient: "linear-gradient(135deg, oklch(0.2 0.02 280 / 0.55), oklch(0.4 0.05 280 / 0.45))" },
      { id: "nam-2", name: "Royal Velvet Kaftan", tag: "Occasion", category: "dress", color: "#5e2a82", query: "namshi velvet kaftan", gradient: "linear-gradient(135deg, oklch(0.35 0.15 280 / 0.5), oklch(0.55 0.18 300 / 0.4))" },
      { id: "nam-3", name: "Silk Hijab Set", tag: "Daily", category: "accessory", color: "#d8b4d4", query: "namshi silk hijab", gradient: "linear-gradient(135deg, oklch(0.7 0.08 320 / 0.5), oklch(0.55 0.1 300 / 0.4))" },
      { id: "nam-4", name: "Pearl Detail Jalabiya", tag: "Festive", category: "dress", color: "#ece4cf", query: "namshi pearl jalabiya", gradient: "linear-gradient(135deg, oklch(0.85 0.04 80 / 0.5), oklch(0.7 0.06 60 / 0.4))" },
    ],
  },
  {
    id: "adidas", name: "ADIDAS", outfit: "Track Suit",
    tint: "linear-gradient(135deg, oklch(0.45 0.08 250 / 0.55), oklch(0.25 0.04 250 / 0.45))",
    items: [
      { id: "adi-1", name: "Originals Track Jacket", tag: "Retro", category: "top", color: "#2c4a82", image: imgAdidasJacket, query: "adidas originals track jacket", gradient: "linear-gradient(135deg, oklch(0.3 0.05 250 / 0.55), oklch(0.5 0.08 250 / 0.45))" },
      { id: "adi-2", name: "Tiro Training Pants", tag: "Sport", category: "bottom", color: "#1a1d28", query: "adidas tiro training pants", gradient: "linear-gradient(135deg, oklch(0.2 0.02 260 / 0.55), oklch(0.35 0.04 260 / 0.45))" },
      { id: "adi-3", name: "Ultraboost Tee", tag: "Run", category: "top", color: "#3aa2c4", query: "adidas ultraboost shirt", gradient: "linear-gradient(135deg, oklch(0.7 0.15 200 / 0.5), oklch(0.5 0.18 220 / 0.4))" },
      { id: "adi-4", name: "Three-Stripe Hoodie", tag: "Lifestyle", category: "top", color: "#222530", query: "adidas three stripe hoodie", gradient: "linear-gradient(135deg, oklch(0.25 0.03 260 / 0.55), oklch(0.4 0.05 260 / 0.45))" },
    ],
  },
  {
    id: "sephora", name: "SEPHORA", outfit: "Beauty Glow",
    tint: "linear-gradient(135deg, oklch(0.6 0.2 0 / 0.5), oklch(0.4 0.18 350 / 0.4))",
    items: [
      { id: "sep-1", name: "Velvet Matte Lipstick", tag: "Bestseller", category: "lips", color: "#a8254a", image: imgSephoraLipstick, query: "sephora velvet matte lipstick", gradient: "linear-gradient(135deg, oklch(0.55 0.22 25 / 0.5), oklch(0.4 0.18 15 / 0.4))" },
      { id: "sep-2", name: "Liquid Glow Highlighter", tag: "New", category: "cheeks", color: "#f0d090", query: "sephora liquid glow highlighter", gradient: "linear-gradient(135deg, oklch(0.85 0.1 80 / 0.5), oklch(0.7 0.12 60 / 0.4))" },
      { id: "sep-3", name: "Precision Eyeliner", tag: "Pro", category: "eyes", color: "#15161e", query: "sephora precision eyeliner", gradient: "linear-gradient(135deg, oklch(0.18 0.02 260 / 0.55), oklch(0.3 0.04 260 / 0.45))" },
      { id: "sep-4", name: "Cloud Blush", tag: "Sheer", category: "cheeks", color: "#e69aa2", query: "sephora cloud blush", gradient: "linear-gradient(135deg, oklch(0.78 0.12 15 / 0.5), oklch(0.65 0.14 10 / 0.4))" },
    ],
  },
];

type Mode = "live" | "avatar" | "photo";

export function FashionStage() {
  const { lang } = useT();
  const isAr = lang === "ar";
  const { stream, active, error, starting, start, stop } = useCamera();
  const profile = useProfile();
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<Mode>("live");
  const [activeBrandIdx, setActiveBrandIdx] = useState(0);
  const [openMall, setOpenMall] = useState<Brand | null>(null);
  const [overlay, setOverlay] = useState<{ id: string; name: string; brand: string; gradient: string; category: Category; color: string; image?: string } | null>(null);
  const [progress, setProgress] = useState(0);
  const [trying, setTrying] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [debugZones, setDebugZones] = useState(false);

  const brand = BRANDS[activeBrandIdx];

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (stream && mode === "live") {
      v.srcObject = stream;
      v.play().catch(() => {});
    } else {
      v.srcObject = null;
    }
  }, [stream, mode]);

  // Pulse SCANNING grid when sliders move
  useEffect(() => {
    if (mode !== "avatar") return;
    setScanning(true);
    const id = setTimeout(() => setScanning(false), 900);
    return () => clearTimeout(id);
  }, [profile.weight, profile.height, profile.gender, mode]);

  const runProgress = () => {
    setTrying(true);
    setProgress(0);
    const startTs = Date.now();
    const id = setInterval(() => {
      const p = Math.min(100, ((Date.now() - startTs) / 1500) * 100);
      setProgress(p);
      if (p >= 100) {
        clearInterval(id);
        setTimeout(() => setTrying(false), 400);
      }
    }, 50);
  };

  const tryItem = (b: Brand, item: CatalogItem) => {
    setOverlay({ id: item.id, name: item.name, brand: b.name, gradient: item.gradient, category: item.category, color: item.color, image: item.image });
    runProgress();
  };

  const tryBrandDefault = () => {
    const item = brand.items[0];
    setOverlay({ id: brand.id, name: brand.outfit, brand: brand.name, gradient: brand.tint, category: item.category, color: item.color, image: item.image });
    runProgress();
  };

  const amazonUrl = (q: string) =>
    `https://www.amazon.com/s?k=${encodeURIComponent(q)}&tag=${AMAZON_TAG}`;

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => profile.setUploadedPhoto(reader.result as string);
    reader.readAsDataURL(file);
  };

  // Avatar dynamic dimensions based on height/weight
  const baseHeightPct = 92; // % of frame height at 178cm
  const heightScale = profile.height / 178;
  const widthScale = 0.55 + (profile.weight - 75) / 260; // overall widens slightly with weight
  const avatarHeightPct = Math.min(98, baseHeightPct * heightScale);
  const avatarWidthPct = Math.max(28, 42 * widthScale);
  const avatarHeight = `${avatarHeightPct}%`;
  const avatarWidth = `${avatarWidthPct}%`;
  // Midsection anatomical bulge (independent of overall width) — driven mostly by weight
  const midBulge = Math.max(0.82, Math.min(1.35, 1 + (profile.weight - 75) / 130));
  // Limbs slightly thicken with weight too
  const limbBulge = Math.max(0.9, Math.min(1.18, 1 + (profile.weight - 75) / 240));

  // Anatomical zones (fractions of mannequin height; w = multiplier on mannequin width)
  const AVATAR_ZONES: Record<Category, { y0: number; y1: number; w: number }> = {
    top:       { y0: 0.18, y1: 0.55, w: 1.05 },
    bottom:    { y0: 0.52, y1: 0.95, w: 0.95 },
    dress:     { y0: 0.20, y1: 0.85, w: 1.10 },
    accessory: { y0: 0.05, y1: 0.22, w: 0.70 },
    lips:      { y0: 0.08, y1: 0.13, w: 0.30 },
    cheeks:    { y0: 0.07, y1: 0.15, w: 0.45 },
    eyes:      { y0: 0.06, y1: 0.11, w: 0.40 },
  };

  const mannBottomPct = 2;
  const mannTopPct = 100 - (mannBottomPct + avatarHeightPct);

  /**
   * Compute garment placement (% of frame) based on the active mode,
   * the garment category, and — for the avatar — the live mannequin box.
   */
  const garmentFit = (category: Category | undefined) => {
    if (!category) return { top: 18, bottom: 14, width: 80 };

    if (mode === "avatar") {
      const z = AVATAR_ZONES[category];
      const top = mannTopPct + z.y0 * avatarHeightPct;
      const bottom = 100 - (mannTopPct + z.y1 * avatarHeightPct);
      const width = Math.min(98, avatarWidthPct * z.w);
      return { top, bottom, width };
    }

    const zones: Record<Category, { top: number; bottom: number; width: number }> = {
      top:       { top: 26, bottom: 38, width: 72 },
      bottom:    { top: 56, bottom: 6,  width: 62 },
      dress:     { top: 24, bottom: 8,  width: 76 },
      accessory: { top: 8,  bottom: 70, width: 48 },
      lips:      { top: 22, bottom: 70, width: 18 },
      cheeks:    { top: 18, bottom: 66, width: 32 },
      eyes:      { top: 16, bottom: 72, width: 28 },
    };
    return zones[category];
  };

  const fit = garmentFit(overlay?.category);

  // Color-coded zones for the debug overlay
  const ZONE_COLORS: Record<Category, string> = {
    top: "#22d3ee",
    bottom: "#a78bfa",
    dress: "#f472b6",
    accessory: "#facc15",
    lips: "#fb7185",
    cheeks: "#fda4af",
    eyes: "#34d399",
  };

  const tabs: { id: Mode; label: string; labelAr: string; icon: any }[] = [
    { id: "live", label: "Live Mirror", labelAr: "المرآة المباشرة", icon: Video },
    { id: "avatar", label: "3D Avatar", labelAr: "أفاتار ثلاثي", icon: User2 },
    { id: "photo", label: "Photo Upload", labelAr: "صورة", icon: ImageIcon },
  ];

  return (
    <GlassPanel
      title={isAr ? "مختبر التصميم الشخصي" : "Personal Styling Lab"}
      icon={<Sparkles className="h-3.5 w-3.5" />}
      accent
      className="lg:col-span-1"
    >
      <div className="space-y-3">
        {/* Mode tabs */}
        <div className="grid grid-cols-3 gap-1 rounded-lg border border-primary/25 bg-card/40 p-1 backdrop-blur">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = mode === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setMode(t.id)}
                className={`flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[10px] font-medium uppercase tracking-[0.18em] transition active:scale-95 ${
                  isActive
                    ? "border border-accent/60 bg-accent/15 text-accent shadow-[var(--glow-accent)]"
                    : "border border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="h-3 w-3" />
                <span className="hidden sm:inline">{isAr ? t.labelAr : t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Frame */}
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-2xl border border-accent/30 bg-background/40">
          {/* Luxury closet backdrop */}
          <img
            src={closetBackdrop}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover"
            style={{ filter: "brightness(0.55) saturate(1.15)" }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-background/60" />
          <div className="pointer-events-none absolute -inset-px rounded-2xl shadow-[var(--glow-primary)]" />
          <div className="absolute inset-0 hud-grid opacity-15" />

          {/* LIVE MIRROR */}
          {mode === "live" && (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                className="absolute inset-0 h-full w-full object-cover"
                style={{
                  transform: "scaleX(-1)",
                  filter: "brightness(1.05) contrast(1.05) saturate(1.1) drop-shadow(0 0 18px var(--primary))",
                  opacity: active ? 1 : 0,
                  transition: "opacity 0.6s ease",
                }}
              />
              {!active && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-6">
                  <div className="relative h-20 w-20">
                    <div className="absolute inset-0 animate-ring-rotate rounded-full border border-dashed border-primary/40" />
                    <div className="absolute inset-3 rounded-full bg-gradient-to-br from-primary/40 to-accent/40 shadow-[var(--glow-soft)]" />
                    <Camera className="absolute inset-0 m-auto h-8 w-8 text-primary" />
                  </div>
                  <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground">
                    {isAr ? "المرآة في وضع الاستعداد" : "Mirror Standby"}
                  </p>
                  <button
                    onClick={start}
                    disabled={starting}
                    className="inline-flex items-center gap-2 rounded-full border border-primary/50 bg-gradient-to-r from-primary/20 to-accent/20 px-4 py-2 text-[11px] uppercase tracking-[0.3em] text-primary shadow-[var(--glow-soft)] hover:shadow-[var(--glow-primary)] disabled:opacity-60"
                  >
                    {starting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                    {starting ? (isAr ? "جاري التشغيل…" : "Starting…") : (isAr ? "تشغيل الكاميرا" : "Start Mirror")}
                  </button>
                  {error && <p className="text-[10px] text-destructive/80">{error}</p>}
                </div>
              )}
              {active && (
                <button
                  onClick={stop}
                  className="absolute end-3 top-3 inline-flex items-center gap-1 rounded-full border border-destructive/40 bg-background/60 px-2 py-1 text-[9px] uppercase tracking-widest text-destructive backdrop-blur hover:bg-destructive/15"
                >
                  <CameraOff className="h-3 w-3" />
                  {isAr ? "إيقاف" : "Stop"}
                </button>
              )}
            </>
          )}

          {/* 3D AVATAR */}
          {mode === "avatar" && (
            <div className="absolute inset-0 flex flex-col">
              {/* Gender select */}
              <div className="absolute left-1/2 top-3 z-20 flex -translate-x-1/2 gap-1 rounded-full border border-primary/30 bg-background/70 p-1 backdrop-blur">
                {(["male", "female"] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => profile.setGender(g)}
                    className={`rounded-full px-3 py-1 text-[9px] uppercase tracking-[0.25em] transition ${
                      profile.gender === g
                        ? "bg-accent/20 text-accent shadow-[var(--glow-accent)]"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {g === "male" ? (isAr ? "ذكر" : "Male") : (isAr ? "أنثى" : "Female")}
                  </button>
                ))}
              </div>

              {/* Avatar stage */}
              <div className="relative flex-1">
                {/* Glossy floor reflection */}
                <div className="absolute inset-x-6 bottom-0 h-12 rounded-[50%] bg-gradient-to-t from-accent/20 to-transparent blur-md" />

                {/* Photoreal mannequin */}
                <div
                  className="absolute bottom-2 left-1/2 -translate-x-1/2 transition-all duration-500 ease-out"
                  style={{ width: avatarWidth, height: avatarHeight }}
                >
                  <img
                    src={profile.gender === "female" ? mannequinFemale : mannequinMale}
                    alt="3D Mannequin"
                    className="h-full w-full object-contain"
                    style={{
                      filter: `drop-shadow(0 24px 30px rgba(0,0,0,0.55)) drop-shadow(0 0 22px var(--primary))`,
                    }}
                  />
                </div>

                {/* Debug overlay: mannequin box + anatomical garment zones */}
                {debugZones && (
                  <div className="pointer-events-none absolute inset-0 z-10">
                    {/* Mannequin bounding box */}
                    <div
                      className="absolute left-1/2 -translate-x-1/2 border border-dashed border-accent/80 transition-all duration-500 ease-out"
                      style={{
                        bottom: `${mannBottomPct}%`,
                        height: `${avatarHeightPct}%`,
                        width: `${avatarWidthPct}%`,
                        boxShadow: "0 0 12px oklch(0.78 0.18 320 / 0.5) inset",
                      }}
                    >
                      <span className="absolute -top-4 left-0 rounded bg-accent/80 px-1 text-[8px] font-bold uppercase tracking-widest text-background">
                        Mannequin {avatarWidthPct.toFixed(0)}×{avatarHeightPct.toFixed(0)}%
                      </span>
                    </div>
                    {/* Anatomical zones */}
                    {(Object.keys(AVATAR_ZONES) as Category[]).map((cat) => {
                      const z = AVATAR_ZONES[cat];
                      const top = mannTopPct + z.y0 * avatarHeightPct;
                      const bottom = 100 - (mannTopPct + z.y1 * avatarHeightPct);
                      const width = Math.min(98, avatarWidthPct * z.w);
                      const color = ZONE_COLORS[cat];
                      return (
                        <div
                          key={cat}
                          className="absolute left-1/2 -translate-x-1/2 transition-all duration-500 ease-out"
                          style={{
                            top: `${top}%`,
                            bottom: `${bottom}%`,
                            width: `${width}%`,
                            border: `1px solid ${color}`,
                            background: `${color}1f`,
                            boxShadow: `0 0 6px ${color}80`,
                          }}
                        >
                          <span
                            className="absolute -top-0.5 left-1 text-[8px] font-bold uppercase tracking-wider"
                            style={{ color, textShadow: "0 0 4px rgba(0,0,0,0.8)" }}
                          >
                            {cat}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Pulsating scanning grid */}
                {scanning && (
                  <div className="pointer-events-none absolute inset-0">
                    <div className="absolute inset-0 hud-grid opacity-60 animate-pulse" />
                    <div className="absolute inset-x-0 h-12 animate-scan bg-gradient-to-b from-transparent via-accent/40 to-transparent" />
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-accent/40 bg-background/70 px-3 py-0.5 text-[9px] uppercase tracking-widest text-accent backdrop-blur">
                      {isAr ? "مسح الذكاء الاصطناعي…" : "Scanning AI…"}
                    </div>
                  </div>
                )}

                {/* Stats badge + debug toggle */}
                <div className="absolute end-3 top-3 z-20 flex flex-col items-end gap-1">
                  <div className="rounded-md border border-primary/30 bg-background/70 px-2 py-1 text-[9px] uppercase tracking-widest text-primary backdrop-blur">
                    {profile.height}cm · {profile.weight}kg
                  </div>
                  <button
                    onClick={() => setDebugZones((v) => !v)}
                    className={`rounded-md border px-2 py-1 text-[9px] uppercase tracking-widest backdrop-blur transition ${
                      debugZones
                        ? "border-accent/60 bg-accent/20 text-accent shadow-[var(--glow-accent)]"
                        : "border-primary/30 bg-background/70 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {isAr ? (debugZones ? "إخفاء المناطق" : "إظهار المناطق") : (debugZones ? "Hide Zones" : "Show Zones")}
                  </button>
                </div>
              </div>

              {/* Sliders */}
              <div className="absolute inset-x-3 bottom-3 z-20 space-y-1.5 rounded-lg border border-primary/25 bg-background/70 p-2 backdrop-blur">
                <SliderRow
                  label={isAr ? "الوزن" : "Weight"}
                  value={profile.weight} unit="kg" min={40} max={140}
                  onChange={profile.setWeight}
                />
                <SliderRow
                  label={isAr ? "الطول" : "Height"}
                  value={profile.height} unit="cm" min={140} max={210}
                  onChange={profile.setHeight}
                />
              </div>
            </div>
          )}

          {/* PHOTO UPLOAD */}
          {mode === "photo" && (
            <>
              {profile.uploadedPhoto ? (
                <img
                  src={profile.uploadedPhoto}
                  alt="uploaded"
                  className="absolute inset-0 h-full w-full object-cover"
                  style={{ filter: "drop-shadow(0 0 18px var(--primary))" }}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center px-6">
                  <div className="relative h-20 w-20">
                    <div className="absolute inset-0 animate-ring-rotate rounded-full border border-dashed border-primary/40" />
                    <Upload className="absolute inset-0 m-auto h-8 w-8 text-primary" />
                  </div>
                  <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground">
                    {isAr ? "ارفع صورتك للتجربة" : "Upload your photo to try on"}
                  </p>
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-full border border-primary/50 bg-gradient-to-r from-primary/20 to-accent/20 px-4 py-2 text-[11px] uppercase tracking-[0.3em] text-primary shadow-[var(--glow-soft)] hover:shadow-[var(--glow-primary)]"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    {isAr ? "اختر صورة" : "Choose Image"}
                  </button>
                </div>
              )}
              {profile.uploadedPhoto && (
                <button
                  onClick={() => profile.setUploadedPhoto(null)}
                  className="absolute end-3 top-3 inline-flex items-center gap-1 rounded-full border border-destructive/40 bg-background/60 px-2 py-1 text-[9px] uppercase tracking-widest text-destructive backdrop-blur hover:bg-destructive/15"
                >
                  <X className="h-3 w-3" />
                  {isAr ? "حذف" : "Remove"}
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhoto}
              />
            </>
          )}

          {/* AR garment overlay */}
          {overlay && (
            <>
              {/* Subtle scene tint to unify lighting */}
              <div
                key={`tint-${overlay.id}`}
                className="pointer-events-none absolute inset-0 transition-opacity duration-700 animate-fade-in"
                style={{ background: overlay.gradient, mixBlendMode: "overlay", opacity: 0.35 }}
              />
              {/* Garment image — calibrated per category & target */}
              <div
                key={`gar-${overlay.id}`}
                className="pointer-events-none absolute left-1/2 -translate-x-1/2 flex items-center justify-center animate-fade-in transition-all duration-500 ease-out"
                style={{
                  top: `${fit.top}%`,
                  bottom: `${fit.bottom}%`,
                  width: `${fit.width}%`,
                }}
              >
                {overlay.image ? (
                  <img
                    src={overlay.image}
                    alt={overlay.name}
                    className="h-full w-full object-contain"
                    style={{
                      filter: "drop-shadow(0 12px 24px rgba(0,0,0,0.55)) drop-shadow(0 0 14px var(--accent))",
                      mixBlendMode: mode === "live" || mode === "photo" ? "multiply" : "normal",
                    }}
                  />
                ) : (
                  <GarmentSVG
                    category={overlay.category}
                    color={overlay.color}
                    brand={overlay.brand}
                  />
                )}
              </div>
              <div
                key={`of-${overlay.id}`}
                className="absolute bottom-12 left-1/2 -translate-x-1/2 rounded-full border border-accent/50 bg-background/70 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-accent backdrop-blur animate-fade-in shadow-[var(--glow-accent)]"
              >
                {overlay.brand} · {overlay.name}
              </div>
            </>
          )}

          {/* Mode tag */}
          <div className="absolute start-3 top-3 flex items-center gap-1 rounded border border-primary/40 bg-background/60 px-2 py-0.5 text-[9px] uppercase tracking-widest text-primary backdrop-blur">
            <span className={`h-1 w-1 rounded-full ${
              (mode === "live" && active) || (mode === "photo" && profile.uploadedPhoto)
                ? "bg-emerald-400 animate-pulse" : "bg-muted-foreground/50"
            }`} />
            {mode === "live" ? (active ? (isAr ? "مباشر" : "LIVE") : "AR") :
              mode === "avatar" ? "3D" : (isAr ? "صورة" : "PHOTO")}
          </div>

          {trying && (
            <>
              <div className="pointer-events-none absolute inset-x-0 h-12 animate-scan bg-gradient-to-b from-transparent via-accent/40 to-transparent" />
              <div className="absolute bottom-3 left-3 right-3 rounded-full border border-accent/30 bg-background/70 p-0.5 backdrop-blur">
                <div
                  className="h-1.5 rounded-full bg-gradient-to-r from-primary to-accent transition-all"
                  style={{ width: `${progress}%`, boxShadow: "0 0 8px var(--accent)" }}
                />
              </div>
            </>
          )}
        </div>

        {/* Try-on / Clear */}
        <div className="flex items-center gap-2">
          <button
            onClick={tryBrandDefault}
            disabled={trying}
            className="group relative flex flex-1 items-center justify-center gap-2 overflow-hidden rounded-full border border-primary/50 bg-gradient-to-r from-primary/30 via-accent/20 to-primary/30 px-5 py-2.5 text-xs uppercase tracking-[0.4em] text-foreground shadow-[var(--glow-soft)] transition hover:shadow-[var(--glow-primary)] active:scale-[0.98] disabled:opacity-70"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {trying
              ? isAr ? `جاري التركيب… ${Math.round(progress)}%` : `Fitting… ${Math.round(progress)}%`
              : isAr ? "جرّب الآن" : "Try On"}
          </button>
          {overlay && (
            <button
              onClick={() => setOverlay(null)}
              className="rounded-full border border-destructive/40 bg-destructive/10 p-2.5 text-destructive hover:bg-destructive/20"
              title={isAr ? "مسح" : "Clear"}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Brand carousel */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto rounded-lg border border-primary/20 bg-card/40 p-2">
          {BRANDS.map((b, i) => {
            const isActive = i === activeBrandIdx;
            return (
              <button
                key={b.id}
                onClick={() => { setActiveBrandIdx(i); setOpenMall(b); }}
                title={b.outfit}
                className={`relative shrink-0 rounded-md px-3 py-2 text-[11px] font-bold tracking-widest transition-all active:scale-95 ${
                  isActive
                    ? "border border-accent/60 bg-accent/15 text-accent shadow-[var(--glow-accent)]"
                    : "border border-primary/15 bg-background/30 text-muted-foreground hover:border-primary/40 hover:text-primary"
                }`}
              >
                {b.name}
              </button>
            );
          })}
        </div>

        <p className="text-center text-[9px] uppercase tracking-[0.3em] text-muted-foreground/70">
          {isAr ? "انقر على ماركة لفتح المتجر" : "Tap a brand to open the mall"}
        </p>
      </div>

      {/* Mall modal */}
      {openMall && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 backdrop-blur-sm sm:items-center"
          onClick={() => setOpenMall(null)}
        >
          <div
            className="glass-panel relative max-h-[88vh] w-full max-w-2xl overflow-y-auto p-5 sm:rounded-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between border-b border-primary/15 pb-3">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-4 w-4 text-accent" />
                <h3 className="text-sm font-medium uppercase tracking-[0.25em] text-foreground text-glow-accent">
                  {openMall.name} · {isAr ? "المتجر" : "Mall"}
                </h3>
              </div>
              <button
                onClick={() => setOpenMall(null)}
                className="rounded-full border border-primary/30 bg-card/40 p-1.5 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
              {openMall.items.map((item) => (
                <article
                  key={item.id}
                  className="group relative overflow-hidden rounded-lg border border-accent/30 bg-card/40 backdrop-blur transition hover:shadow-[var(--glow-soft)]"
                >
                  <div className="relative h-36 overflow-hidden">
                    <div className="absolute inset-0" style={{ background: item.gradient }} />
                    <div className="absolute inset-0 hud-grid opacity-25" />
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        loading="lazy"
                        className="absolute inset-0 mx-auto h-full w-full object-contain p-2 transition-transform duration-500 group-hover:scale-105"
                        style={{ filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.5))" }}
                      />
                    ) : (
                      <svg viewBox="0 0 100 120" className="absolute inset-0 mx-auto h-full text-foreground/40">
                        <circle cx="50" cy="22" r="9" fill="currentColor" opacity="0.4" />
                        <path d="M30,42 L70,42 L74,92 L60,92 L55,58 L45,58 L40,92 L26,92 Z" fill="currentColor" opacity="0.4" />
                      </svg>
                    )}
                  </div>
                  <div className="space-y-1.5 p-2.5">
                    <p className="truncate text-xs text-foreground">{item.name}</p>
                    <p className="text-[10px] text-muted-foreground">{openMall.name} · {item.tag}</p>
                    <div className="flex flex-col gap-1.5 pt-1">
                      <button
                        onClick={() => { tryItem(openMall, item); setOpenMall(null); if (mode === "live" && !active) start(); }}
                        className="inline-flex w-full items-center justify-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-2 py-1.5 text-[10px] uppercase tracking-widest text-primary transition hover:bg-primary/20 hover:shadow-[var(--glow-soft)]"
                      >
                        <Sparkles className="h-3 w-3" /> {isAr ? "جرّب" : "Try On"}
                      </button>
                      <AmazonButton href={amazonUrl(item.query)} isAr={isAr} />
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}
    </GlassPanel>
  );
}

function SliderRow({
  label, value, unit, min, max, onChange,
}: { label: string; value: number; unit: string; min: number; max: number; onChange: (n: number) => void }) {
  return (
    <div>
      <div className="mb-0.5 flex items-center justify-between text-[9px] uppercase tracking-[0.25em] text-muted-foreground">
        <span>{label}</span>
        <span className="text-primary">{value} {unit}</span>
      </div>
      <input
        type="range" min={min} max={max} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[oklch(0.85_0.15_200)]"
      />
    </div>
  );
}

function AvatarSilhouette({ gender, skin }: { gender: "male" | "female"; skin: string }) {
  // Glossy gradient for skin
  const gradId = `skin-${gender}`;
  const glossId = `gloss-${gender}`;
  return (
    <svg viewBox="0 0 100 220" className="h-full w-full drop-shadow-[0_0_18px_var(--primary)]" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={skin} stopOpacity="1" />
          <stop offset="100%" stopColor={skin} stopOpacity="0.55" />
        </linearGradient>
        <linearGradient id={glossId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.45" />
          <stop offset="40%" stopColor="#ffffff" stopOpacity="0.05" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.25" />
        </linearGradient>
      </defs>
      {/* Head */}
      <ellipse cx="50" cy="22" rx="13" ry="15" fill={`url(#${gradId})`} />
      <ellipse cx="50" cy="22" rx="13" ry="15" fill={`url(#${glossId})`} />
      {gender === "female" ? (
        <>
          {/* Hair */}
          <path d="M37,18 Q50,2 63,18 Q66,30 60,32 L40,32 Q34,30 37,18 Z" fill="#1a1a1a" opacity="0.85" />
          {/* Torso (dress shape) */}
          <path d="M38,38 L62,38 L66,90 Q50,98 34,90 Z" fill={`url(#${gradId})`} />
          <path d="M38,38 L62,38 L66,90 Q50,98 34,90 Z" fill={`url(#${glossId})`} />
          {/* Hips/skirt */}
          <path d="M34,90 L66,90 L72,140 L28,140 Z" fill={`url(#${gradId})`} opacity="0.9" />
          <path d="M34,90 L66,90 L72,140 L28,140 Z" fill={`url(#${glossId})`} />
          {/* Legs */}
          <rect x="36" y="140" width="11" height="70" rx="5" fill={`url(#${gradId})`} />
          <rect x="53" y="140" width="11" height="70" rx="5" fill={`url(#${gradId})`} />
        </>
      ) : (
        <>
          {/* Hair */}
          <path d="M38,15 Q50,5 62,15 Q63,22 58,24 L42,24 Q37,22 38,15 Z" fill="#1a1a1a" opacity="0.85" />
          {/* Torso (broader) */}
          <path d="M34,38 L66,38 L70,98 L30,98 Z" fill={`url(#${gradId})`} />
          <path d="M34,38 L66,38 L70,98 L30,98 Z" fill={`url(#${glossId})`} />
          {/* Hips */}
          <path d="M30,98 L70,98 L66,135 L34,135 Z" fill={`url(#${gradId})`} opacity="0.9" />
          {/* Legs */}
          <rect x="34" y="135" width="13" height="75" rx="5" fill={`url(#${gradId})`} />
          <rect x="53" y="135" width="13" height="75" rx="5" fill={`url(#${gradId})`} />
        </>
      )}
      {/* Arms */}
      <rect x="22" y="40" width="9" height="60" rx="4" fill={`url(#${gradId})`} />
      <rect x="69" y="40" width="9" height="60" rx="4" fill={`url(#${gradId})`} />
    </svg>
  );
}

function GarmentSVG({ category, color, brand }: { category: Category; color: string; brand: string }) {
  const gloss = "rgba(255,255,255,0.35)";
  const shade = "rgba(0,0,0,0.35)";
  const filter = "drop-shadow(0 4px 14px rgba(0,0,0,0.45))";

  if (category === "lips") {
    return (
      <svg viewBox="0 0 100 200" className="h-full w-full" preserveAspectRatio="xMidYMid meet" style={{ filter }}>
        <g transform="translate(50 60)">
          <path d="M-14,0 Q-7,-8 0,-3 Q7,-8 14,0 Q7,8 0,4 Q-7,8 -14,0 Z" fill={color} />
          <path d="M-14,0 Q-7,-8 0,-3 Q7,-8 14,0" stroke={gloss} strokeWidth="0.6" fill="none" opacity="0.7" />
        </g>
      </svg>
    );
  }
  if (category === "cheeks") {
    return (
      <svg viewBox="0 0 100 200" className="h-full w-full" preserveAspectRatio="xMidYMid meet" style={{ filter }}>
        <g transform="translate(50 55)">
          <ellipse cx="-15" cy="0" rx="10" ry="6" fill={color} opacity="0.55" />
          <ellipse cx="15" cy="0" rx="10" ry="6" fill={color} opacity="0.55" />
        </g>
      </svg>
    );
  }
  if (category === "eyes") {
    return (
      <svg viewBox="0 0 100 200" className="h-full w-full" preserveAspectRatio="xMidYMid meet" style={{ filter }}>
        <g transform="translate(50 48)">
          <path d="M-18,-2 Q-12,-6 -6,-2" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round" />
          <path d="M6,-2 Q12,-6 18,-2" stroke={color} strokeWidth="1.4" fill="none" strokeLinecap="round" />
        </g>
      </svg>
    );
  }
  if (category === "accessory") {
    // hijab/scarf draped around head/shoulders
    return (
      <svg viewBox="0 0 100 200" className="h-full w-full" preserveAspectRatio="xMidYMid meet" style={{ filter }}>
        <path d="M30,30 Q50,8 70,30 Q78,55 65,68 L35,68 Q22,55 30,30 Z" fill={color} />
        <path d="M30,30 Q50,8 70,30" stroke={gloss} strokeWidth="1" fill="none" opacity="0.6" />
        <path d="M35,68 Q50,76 65,68 L60,90 L40,90 Z" fill={color} opacity="0.85" />
      </svg>
    );
  }
  if (category === "bottom") {
    return (
      <svg viewBox="0 0 100 200" className="h-full w-full" preserveAspectRatio="xMidYMid meet" style={{ filter }}>
        <path d="M28,90 L72,90 L70,180 L55,180 L52,120 L48,120 L45,180 L30,180 Z" fill={color} />
        <path d="M28,90 L72,90 L70,108 L30,108 Z" fill={shade} opacity="0.4" />
        <path d="M50,108 L50,178" stroke={gloss} strokeWidth="0.6" opacity="0.5" />
      </svg>
    );
  }
  if (category === "dress") {
    return (
      <svg viewBox="0 0 100 200" className="h-full w-full" preserveAspectRatio="xMidYMid meet" style={{ filter }}>
        <path d="M35,40 Q50,32 65,40 L70,90 Q78,150 80,180 L20,180 Q22,150 30,90 Z" fill={color} />
        <path d="M35,40 Q50,32 65,40 L62,55 Q50,50 38,55 Z" fill={gloss} opacity="0.25" />
        <text x="50" y="115" textAnchor="middle" fontSize="6" fill={gloss} opacity="0.6"
          style={{ fontFamily: "system-ui", letterSpacing: 2 }}>{brand}</text>
      </svg>
    );
  }
  // top (default)
  return (
    <svg viewBox="0 0 100 200" className="h-full w-full" preserveAspectRatio="xMidYMid meet" style={{ filter }}>
      <path d="M22,42 L40,32 Q50,38 60,32 L78,42 L72,60 L66,55 L66,110 L34,110 L34,55 L28,60 Z" fill={color} />
      <path d="M40,32 Q50,38 60,32 L58,46 Q50,50 42,46 Z" fill={shade} opacity="0.45" />
      <path d="M22,42 L28,60 L34,55" stroke={gloss} strokeWidth="0.6" fill="none" opacity="0.5" />
      <path d="M78,42 L72,60 L66,55" stroke={gloss} strokeWidth="0.6" fill="none" opacity="0.5" />
      <text x="50" y="85" textAnchor="middle" fontSize="6" fill={gloss} opacity="0.7"
        style={{ fontFamily: "system-ui", letterSpacing: 2 }}>{brand}</text>
    </svg>
  );
}

function AmazonButton({ href, isAr }: { href: string; isAr: boolean }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={isAr ? "اشترِ من أمازون" : "Buy on Amazon"}
      className="group relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-md border border-primary/50 bg-white px-2 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#131921] shadow-[0_0_0_1px_var(--primary),0_0_14px_oklch(0.85_0.15_200/0.45)] transition hover:shadow-[0_0_0_1px_var(--primary),0_0_22px_oklch(0.85_0.15_200/0.85)] active:scale-[0.98]"
    >
      <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-primary/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      <span className="text-[9px] tracking-[0.2em] text-[#131921]/80">
        {isAr ? "اشترِ على" : "Shop on"}
      </span>
      <img src={amazonLogo} alt="Amazon" className="h-3.5 w-auto" loading="lazy" />
    </a>
  );
}
