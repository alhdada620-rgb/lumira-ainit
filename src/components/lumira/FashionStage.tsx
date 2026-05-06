import { useEffect, useRef, useState } from "react";
import { GlassPanel } from "./GlassPanel";
import {
  Sparkles, Camera, CameraOff, Loader2, X, ShoppingBag,
  Video, User2, Upload, Image as ImageIcon, RotateCw, Wand2, Lightbulb, Download,
} from "lucide-react";
import { toPng } from "html-to-image";
import { useCamera } from "./camera-context";
import { useT } from "./i18n";
import { useProfile } from "./profile-context";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Assets
import amazonLogo from "@/assets/amazon-logo.png";
import closetBackdrop from "@/assets/closet-backdrop.jpg";
import humanMale from "@/assets/avatar/human_male.png";
import humanFemale from "@/assets/avatar/human_female.png";

// Garments Assets (تأكد من وجودها في المجلدات الصحيحة)
import imgHmTee from "@/assets/garments/hm-tee.png";
import imgHmDenim from "@/assets/garments/hm-denim.png";
import imgHmLinen from "@/assets/garments/hm-linen-blazer.png";
import imgHmKnit from "@/assets/garments/hm-knit.png";
import imgNikeHoodie from "@/assets/garments/nike-hoodie.png";
import imgNikeVest from "@/assets/garments/nike-vest.png";
import imgNikeTee from "@/assets/garments/nike-tee.png";
import imgNikeJoggers from "@/assets/garments/nike-joggers.png";
import imgZaraBlazer from "@/assets/garments/zara-blazer.png";
import imgZaraSlip from "@/assets/garments/zara-slip.png";
import imgZaraTrousers from "@/assets/garments/zara-trousers.png";
import imgZaraLeather from "@/assets/garments/zara-leather.png";
import imgNamshiAbaya from "@/assets/garments/namshi-abaya.png";
import imgNamshiKaftan from "@/assets/garments/namshi-kaftan.png";
import imgNamshiHijab from "@/assets/garments/namshi-hijab.png";
import imgNamshiJalabiya from "@/assets/garments/namshi-jalabiya.png";
import imgAdidasJacket from "@/assets/garments/adidas-jacket.png";
import imgAdidasPants from "@/assets/garments/adidas-pants.png";
import imgAdidasTee from "@/assets/garments/adidas-tee.png";
import imgAdidasHoodie from "@/assets/garments/adidas-hoodie.png";
import imgSephoraLipstick from "@/assets/garments/sephora-lipstick.png";
import imgSephoraHighlighter from "@/assets/garments/sephora-highlighter.png";
import imgSephoraEyeliner from "@/assets/garments/sephora-eyeliner.png";
import imgSephoraBlush from "@/assets/garments/sephora-blush.png";

const AMAZON_TAG = "lumiraai-20";

type Category = "top" | "bottom" | "dress" | "accessory" | "lips" | "cheeks" | "eyes";
type Fabric = "Cotton" | "Silk" | "Denim" | "Wool" | "Linen" | "Leather" | "Velvet" | "Satin" | "Tech" | "Knit" | "Beauty";

interface CatalogItem {
  id: string;
  name: string;
  tag: string;
  gradient: string;
  query: string;
  category: Category;
  color: string;
  image?: string;
  fabric?: Fabric;
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
      { id: "hm-2", name: "Relaxed Denim Jacket", tag: "Layering", category: "top", color: "#3a5a82", image: imgHmDenim, query: "h&m relaxed denim jacket", gradient: "linear-gradient(135deg, oklch(0.45 0.08 240 / 0.5), oklch(0.6 0.1 230 / 0.45))" },
      { id: "hm-3", name: "Linen Blazer", tag: "Smart Casual", category: "top", color: "#c2a878", image: imgHmLinen, query: "h&m linen blazer", gradient: "linear-gradient(135deg, oklch(0.7 0.05 70 / 0.5), oklch(0.55 0.06 60 / 0.4))" },
      { id: "hm-4", name: "Knit Mock-Neck Sweater", tag: "Winter", category: "top", color: "#7a3030", image: imgHmKnit, query: "h&m knit mock neck sweater", gradient: "linear-gradient(135deg, oklch(0.5 0.08 25 / 0.5), oklch(0.35 0.1 20 / 0.45))" },
    ],
  },
  {
    id: "nike", name: "NIKE", outfit: "Sporty Tech Fleece",
    tint: "linear-gradient(135deg, oklch(0.5 0.1 230 / 0.55), oklch(0.3 0.05 230 / 0.45))",
    items: [
      { id: "nike-1", name: "Tech Fleece Hoodie", tag: "Training", category: "top", color: "#1a1f2e", image: imgNikeHoodie, query: "nike tech fleece hoodie", gradient: "linear-gradient(135deg, oklch(0.25 0.02 260 / 0.55), oklch(0.4 0.04 260 / 0.45))" },
      { id: "nike-2", name: "Aero Run Vest", tag: "Performance", category: "top", color: "#2ec27e", image: imgNikeVest, query: "nike aero run vest", gradient: "linear-gradient(135deg, oklch(0.7 0.2 150 / 0.5), oklch(0.55 0.18 170 / 0.4))" },
      { id: "nike-3", name: "Dri-FIT Tee", tag: "Sport", category: "top", color: "#c0392b", image: imgNikeTee, query: "nike dri-fit shirt", gradient: "linear-gradient(135deg, oklch(0.5 0.18 25 / 0.5), oklch(0.4 0.16 20 / 0.4))" },
      { id: "nike-4", name: "Tech Pack Joggers", tag: "Lifestyle", category: "bottom", color: "#0f1420", image: imgNikeJoggers, query: "nike tech pack joggers", gradient: "linear-gradient(135deg, oklch(0.2 0.02 260 / 0.55), oklch(0.35 0.04 260 / 0.45))" },
    ],
  },
  {
    id: "zara", name: "ZARA", outfit: "Minimal Tailoring",
    tint: "linear-gradient(135deg, oklch(0.35 0.04 60 / 0.55), oklch(0.2 0.02 60 / 0.45))",
    items: [
      { id: "zara-1", name: "Tailored Wool Blazer", tag: "Smart Casual", category: "top", color: "#2a2f3d", image: imgZaraBlazer, query: "zara tailored wool blazer", gradient: "linear-gradient(135deg, oklch(0.3 0.02 260 / 0.55), oklch(0.5 0.04 260 / 0.45))" },
      { id: "zara-2", name: "Satin Slip Dress", tag: "Evening", category: "dress", color: "#a23864", image: imgZaraSlip, query: "zara satin slip dress", gradient: "linear-gradient(135deg, oklch(0.55 0.12 350 / 0.5), oklch(0.7 0.1 320 / 0.4))" },
      { id: "zara-3", name: "Pleated Wide-Leg Trousers", tag: "Modern", category: "bottom", color: "#5b513e", image: imgZaraTrousers, query: "zara pleated wide leg trousers", gradient: "linear-gradient(135deg, oklch(0.4 0.03 80 / 0.55), oklch(0.25 0.02 80 / 0.45))" },
      { id: "zara-4", name: "Cropped Leather Jacket", tag: "Statement", category: "top", color: "#1a0f0a", image: imgZaraLeather, query: "zara cropped leather jacket", gradient: "linear-gradient(135deg, oklch(0.18 0.02 30 / 0.55), oklch(0.3 0.04 30 / 0.45))" },
    ],
  },
  {
    id: "namshi", name: "NAMSHI", outfit: "Modern Abaya",
    tint: "linear-gradient(135deg, oklch(0.6 0.18 320 / 0.5), oklch(0.4 0.12 280 / 0.4))",
    items: [
      { id: "nam-1", name: "Onyx Embroidered Abaya", tag: "Formal", category: "dress", color: "#0d0a1a", image: imgNamshiAbaya, query: "namshi embroidered abaya", gradient: "linear-gradient(135deg, oklch(0.2 0.02 280 / 0.55), oklch(0.4 0.05 280 / 0.45))" },
      { id: "nam-2", name: "Royal Velvet Kaftan", tag: "Occasion", category: "dress", color: "#5e2a82", image: imgNamshiKaftan, query: "namshi velvet kaftan", gradient: "linear-gradient(135deg, oklch(0.35 0.15 280 / 0.5), oklch(0.55 0.18 300 / 0.4))" },
      { id: "nam-3", name: "Silk Hijab Set", tag: "Daily", category: "accessory", color: "#d8b4d4", image: imgNamshiHijab, query: "namshi silk hijab", gradient: "linear-gradient(135deg, oklch(0.7 0.08 320 / 0.5), oklch(0.55 0.1 300 / 0.4))" },
      { id: "nam-4", name: "Pearl Detail Jalabiya", tag: "Festive", category: "dress", color: "#ece4cf", image: imgNamshiJalabiya, query: "namshi pearl jalabiya", gradient: "linear-gradient(135deg, oklch(0.85 0.04 80 / 0.5), oklch(0.7 0.06 60 / 0.4))" },
    ],
  },
  {
    id: "adidas", name: "ADIDAS", outfit: "Track Suit",
    tint: "linear-gradient(135deg, oklch(0.45 0.08 250 / 0.55), oklch(0.25 0.04 250 / 0.45))",
    items: [
      { id: "adi-1", name: "Originals Track Jacket", tag: "Retro", category: "top", color: "#2c4a82", image: imgAdidasJacket, query: "adidas originals track jacket", gradient: "linear-gradient(135deg, oklch(0.3 0.05 250 / 0.55), oklch(0.5 0.08 250 / 0.45))" },
      { id: "adi-2", name: "Tiro Training Pants", tag: "Sport", category: "bottom", color: "#1a1d28", image: imgAdidasPants, query: "adidas tiro training pants", gradient: "linear-gradient(135deg, oklch(0.2 0.02 260 / 0.55), oklch(0.35 0.04 260 / 0.45))" },
      { id: "adi-3", name: "Ultraboost Tee", tag: "Run", category: "top", color: "#3aa2c4", image: imgAdidasTee, query: "adidas ultraboost shirt", gradient: "linear-gradient(135deg, oklch(0.7 0.15 200 / 0.5), oklch(0.5 0.18 220 / 0.4))" },
      { id: "adi-4", name: "Three-Stripe Hoodie", tag: "Lifestyle", category: "top", color: "#222530", image: imgAdidasHoodie, query: "adidas three stripe hoodie", gradient: "linear-gradient(135deg, oklch(0.25 0.03 260 / 0.55), oklch(0.4 0.05 260 / 0.45))" },
    ],
  },
  {
    id: "sephora", name: "SEPHORA", outfit: "Beauty Glow",
    tint: "linear-gradient(135deg, oklch(0.6 0.2 0 / 0.5), oklch(0.4 0.18 350 / 0.4))",
    items: [
      { id: "sep-1", name: "Velvet Matte Lipstick", tag: "Bestseller", category: "lips", color: "#a8254a", image: imgSephoraLipstick, query: "sephora velvet matte lipstick", gradient: "linear-gradient(135deg, oklch(0.55 0.22 25 / 0.5), oklch(0.4 0.18 15 / 0.4))" },
      { id: "sep-2", name: "Liquid Glow Highlighter", tag: "New", category: "cheeks", color: "#f0d090", image: imgSephoraHighlighter, query: "sephora liquid glow highlighter", gradient: "linear-gradient(135deg, oklch(0.85 0.1 80 / 0.5), oklch(0.7 0.12 60 / 0.4))" },
      { id: "sep-3", name: "Precision Eyeliner", tag: "Pro", category: "eyes", color: "#15161e", image: imgSephoraEyeliner, query: "sephora precision eyeliner", gradient: "linear-gradient(135deg, oklch(0.18 0.02 260 / 0.55), oklch(0.3 0.04 260 / 0.45))" },
      { id: "sep-4", name: "Cloud Blush", tag: "Sheer", category: "cheeks", color: "#e69aa2", image: imgSephoraBlush, query: "sephora cloud blush", gradient: "linear-gradient(135deg, oklch(0.78 0.12 15 / 0.5), oklch(0.65 0.14 10 / 0.4))" },
    ],
  },
];

const FABRIC_BY_ID: Record<string, Fabric> = {
  "hm-1": "Cotton", "hm-2": "Denim", "hm-3": "Linen", "hm-4": "Knit",
  "nike-1": "Tech", "nike-2": "Tech", "nike-3": "Cotton", "nike-4": "Tech",
  "zara-1": "Wool", "zara-2": "Satin", "zara-3": "Wool", "zara-4": "Leather",
  "nam-1": "Silk", "nam-2": "Velvet", "nam-3": "Silk", "nam-4": "Satin",
  "adi-1": "Tech", "adi-2": "Tech", "adi-3": "Cotton", "adi-4": "Knit",
  "sep-1": "Beauty", "sep-2": "Beauty", "sep-3": "Beauty", "sep-4": "Beauty",
};

const fabricOf = (item: { id: string; fabric?: Fabric; category: Category }): Fabric =>
  item.fabric ?? FABRIC_BY_ID[item.id] ?? (["lips", "eyes", "cheeks"].includes(item.category) ? "Beauty" : "Cotton");

const FABRIC_TEXTURES: Record<Fabric, string> = {
  Cotton: "repeating-linear-gradient(45deg, rgba(255,255,255,0.08) 0 1px, transparent 1px 4px), repeating-linear-gradient(-45deg, rgba(0,0,0,0.06) 0 1px, transparent 1px 4px)",
  Silk:   "linear-gradient(115deg, rgba(255,255,255,0.35) 0%, rgba(255,255,255,0.05) 30%, rgba(255,255,255,0.25) 55%, rgba(255,255,255,0.05) 80%)",
  Denim:  "repeating-linear-gradient(90deg, rgba(255,255,255,0.06) 0 1px, transparent 1px 3px), repeating-linear-gradient(0deg, rgba(0,0,0,0.18) 0 1px, transparent 1px 3px)",
  Wool:   "radial-gradient(rgba(0,0,0,0.18) 0.5px, transparent 1px) 0 0/3px 3px",
  Linen:  "repeating-linear-gradient(0deg, rgba(255,255,255,0.06) 0 1px, transparent 1px 5px), repeating-linear-gradient(90deg, rgba(0,0,0,0.05) 0 1px, transparent 1px 5px)",
  Leather:"radial-gradient(circle at 30% 30%, rgba(255,255,255,0.18), transparent 60%), radial-gradient(circle at 70% 70%, rgba(0,0,0,0.35), transparent 70%)",
  Velvet: "radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1.5px) 0 0/4px 4px",
  Satin:  "linear-gradient(110deg, rgba(255,255,255,0.5), rgba(255,255,255,0.05) 40%, rgba(255,255,255,0.4) 70%)",
  Tech:   "repeating-linear-gradient(0deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 6px)",
  Knit:   "radial-gradient(rgba(255,255,255,0.15) 0.5px, transparent 1.5px) 0 0/4px 4px",
  Beauty: "linear-gradient(135deg, rgba(255,255,255,0.4), rgba(255,255,255,0.05) 60%)",
};

type Mode = "live" | "avatar" | "photo";

export function FashionStage() {
  const { lang } = useT();
  const isAr = lang === "ar";
  const { stream, active, error, starting, start, stop } = useCamera();
  const profile = useProfile();
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [capturing, setCapturing] = useState(false);

  const [mode, setMode] = useState<Mode>("avatar");
  const [activeBrandIdx, setActiveBrandIdx] = useState(0);
  const [openMall, setOpenMall] = useState<Brand | null>(null);
  const [overlay, setOverlay] = useState<{ id: string; name: string; brand: string; gradient: string; category: Category; color: string; image?: string; fabric: Fabric } | null>(null);
  const [progress, setProgress] = useState(0);
  const [trying, setTrying] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [rotated, setRotated] = useState(false);
  const [reflection, setReflection] = useState<"light" | "medium" | "strong">("medium");

  const REFLECTION_PRESETS = {
    light:  { bgBrightness: 0.42, bgBlur: 6, bgOpacity: 0.6, veilAlpha: 0.45, videoBlend: "normal" as const, innerGlow: 40, videoBrightness: 1.05 },
    medium: { bgBrightness: 0.18, bgBlur: 14, bgOpacity: 0.35, veilAlpha: 1.0, videoBlend: "screen" as const, innerGlow: 80, videoBrightness: 1.12 },
    strong: { bgBrightness: 0.08, bgBlur: 22, bgOpacity: 0.22, veilAlpha: 1.35, videoBlend: "screen" as const, innerGlow: 120, videoBrightness: 1.18 },
  };
  const refl = REFLECTION_PRESETS[reflection];

  const [advisorTips, setAdvisorTips] = useState<string[]>([]);
  const [advisorLoading, setAdvisorLoading] = useState(false);
  const [isolating, setIsolating] = useState(false);

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
    const fabric = fabricOf(item);
    setOverlay({ id: item.id, name: item.name, brand: b.name, gradient: item.gradient, category: item.category, color: item.color, image: item.image, fabric });
    runProgress();
    fetchAdvisor({ brand: b.name, name: item.name, category: item.category, fabric });
  };

  const tryBrandDefault = () => {
    const item = brand.items[0];
    const fabric = fabricOf(item);
    setOverlay({ id: brand.id, name: brand.outfit, brand: brand.name, gradient: brand.tint, category: item.category, color: item.color, image: item.image, fabric });
    runProgress();
    fetchAdvisor({ brand: brand.name, name: brand.outfit, category: item.category, fabric });
  };

  const captureLook = async () => {
    if (!stageRef.current || capturing) return;
    setCapturing(true);
    try {
      const dataUrl = await toPng(stageRef.current, {
        cacheBust: true,
        pixelRatio: 3,
        backgroundColor: "#0a1220",
        quality: 1,
        filter: (node) => !(node instanceof HTMLElement && node.dataset.captureIgnore === "true"),
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `lumira-mirror-${Date.now()}.png`;
      a.click();
      toast.success(isAr ? "تم حفظ لقطة المرآة بدقة عالية" : "HD mirror snapshot saved");
    } catch (e) {
      toast.error(isAr ? "تعذّر الحفظ" : "Couldn't capture look");
    } finally {
      setCapturing(false);
    }
  };

  const fetchAdvisor = async (outfit: any) => {
    setAdvisorLoading(true);
    try {
      const { data } = await supabase.functions.invoke("style-advisor", {
        body: { outfit, profile: { gender: profile.gender, height: profile.height, weight: profile.weight, skinTone: profile.skinTone }, language: isAr ? "ar" : "en" },
      });
      setAdvisorTips(data?.tips || []);
    } catch (e) {
      setAdvisorTips([]);
    } finally {
      setAdvisorLoading(false);
    }
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      profile.setUploadedPhoto(url);
    };
    reader.readAsDataURL(file);
  };

  // Dynamic Full Body Dimensions
  const heightScale = profile.height / 178;
  const avatarHeightPct = Math.min(92, 85 * heightScale); // Adjusted for Full Body
  const avatarWidthPct = Math.max(30, 45 * (0.6 + (profile.weight - 75) / 250));

  // Anchor Points for Full Body Alignment
  const ANCHORS = {
    head:      { y: 0.05, w: 0.30 },
    shoulders: { y: 0.18, w: 1.05 },
    chest:     { y: 0.28, w: 0.95 },
    waist:     { y: 0.48, w: 0.80 },
    hips:      { y: 0.58, w: 0.90 },
    knees:     { y: 0.75, w: 0.60 },
    ankles:    { y: 0.92, w: 0.50 },
    lips:      { y: 0.10, w: 0.15 },
    eyes:      { y: 0.08, w: 0.25 },
    cheeks:    { y: 0.10, w: 0.30 },
  };

  const garmentFit = (category: Category | undefined) => {
    if (!category) return { top: 20, bottom: 20, width: 80 };
    const zones: Record<Category, { top: number; bottom: number; width: number }> = {
      top:       { top: 20, bottom: 45, width: 75 },
      bottom:    { top: 52, bottom: 5,  width: 65 },
      dress:     { top: 20, bottom: 10, width: 75 },
      accessory: { top: 5,  bottom: 75, width: 45 },
      lips:      { top: 10, bottom: 85, width: 15 },
      cheeks:    { top: 10, bottom: 82, width: 25 },
      eyes:      { top: 8,  bottom: 88, width: 20 },
    };
    return zones[category];
  };

  const fit = garmentFit(overlay?.category);

  return (
    <GlassPanel
      title={isAr ? "مختبر التصميم الشخصي" : "Personal Styling Lab"}
      icon={<Sparkles className="h-3.5 w-3.5" />}
      accent
      className="lg:col-span-1"
    >
      <div className="space-y-4">
        {/* Mode tabs */}
        <div className="grid grid-cols-3 gap-1 rounded-xl border border-primary/25 bg-card/40 p-1 backdrop-blur">
          {[
            { id: "live", label: "المرآة المباشرة", icon: Video },
            { id: "avatar", label: "أفاتار كامل", icon: User2 },
            { id: "photo", label: "صورة", icon: ImageIcon },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setMode(t.id as Mode)}
              className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[10px] font-bold uppercase tracking-wider transition ${
                mode === t.id ? "bg-accent/20 text-accent shadow-[var(--glow-accent)]" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon className="h-3.5 w-3.5" />
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-2 rounded-xl border border-primary/20 bg-card/30 p-2 backdrop-blur">
          <div className="flex gap-1.5">
            {["male", "female"].map((g) => (
              <button
                key={g}
                onClick={() => profile.setGender(g as any)}
                className={`rounded-full px-4 py-1.5 text-[10px] font-bold uppercase transition ${
                  profile.gender === g ? "bg-accent/20 text-accent shadow-[var(--glow-accent)]" : "text-muted-foreground"
                }`}
              >
                {g === "male" ? (isAr ? "ذكر" : "Male") : (isAr ? "أنثى" : "Female")}
              </button>
            ))}
          </div>
          <button
            onClick={() => setRotated(!rotated)}
            className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-[10px] font-bold transition ${
              rotated ? "border-accent text-accent shadow-[var(--glow-accent)]" : "border-primary/30 text-muted-foreground"
            }`}
          >
            <RotateCw className="h-3.5 w-3.5" />
            {isAr ? "تدوير" : "Rotate"}
          </button>
        </div>

        {/* THE STAGE - 9:16 Cinematic Aspect Ratio */}
        <div ref={stageRef} className="relative aspect-[9/16] w-full max-w-[420px] mx-auto overflow-hidden rounded-[2.5rem] border border-accent/30 bg-background/40 shadow-2xl">
          
          {/* Backdrop */}
          <img
            src={closetBackdrop}
            alt=""
            className="absolute inset-0 h-full w-full object-cover transition-all duration-1000"
            style={{
              filter: mode === "live" && active ? `brightness(${refl.bgBrightness}) blur(${refl.bgBlur}px)` : "brightness(0.45)",
              opacity: mode === "live" && active ? refl.bgOpacity : 1,
              transform: mode === "live" && active ? "scale(1.1)" : "scale(1)",
            }}
          />

          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background/80" />
          <div className="absolute inset-0 hud-grid opacity-10" />

          {/* Capture Button (On-Mirror) */}
          <button
            onClick={captureLook}
            data-capture-ignore="true"
            className="absolute start-4 top-4 z-40 flex items-center gap-2 rounded-full border border-accent/60 bg-background/60 px-4 py-2 text-[10px] font-bold text-accent shadow-[var(--glow-accent)] backdrop-blur-xl transition hover:scale-105"
          >
            {capturing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            <span>{isAr ? "حفظ الإطلالة" : "SAVE LOOK"}</span>
          </button>

          {/* Mode Tag */}
          <div className="absolute end-4 top-4 z-40 flex items-center gap-1.5 rounded-full border border-primary/40 bg-background/60 px-3 py-1 text-[9px] font-bold text-primary backdrop-blur">
             <div className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground"}`} />
             {mode.toUpperCase()}
          </div>

          {/* LIVE MIRROR VIDEO */}
          {mode === "live" && (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                className="absolute inset-0 h-full w-full object-cover"
                style={{ transform: "scaleX(-1)", filter: `brightness(${refl.videoBrightness}) contrast(1.1)`, opacity: active ? 1 : 0 }}
              />
              {!active && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-center">
                  <div className="h-20 w-20 rounded-full border border-dashed border-primary/50 animate-spin-slow flex items-center justify-center">
                    <Camera className="h-8 w-8 text-primary" />
                  </div>
                  <button onClick={start} className="rounded-full bg-primary/20 border border-primary px-6 py-2 text-xs font-bold text-primary shadow-[var(--glow-primary)]">
                    {isAr ? "تشغيل المرآة المباشرة" : "START LIVE MIRROR"}
                  </button>
                </div>
              )}
            </>
          )}

          {/* FULL BODY AVATAR / HUMAN MODEL */}
          {mode === "avatar" && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div 
                className="relative transition-all duration-700 ease-out"
                style={{
                  height: `${avatarHeightPct}%`,
                  width: `${avatarWidthPct}%`,
                  transform: `perspective(1000px) rotateY(${rotated ? 45 : 0}deg)`,
                }}
              >
                <img
                  src={profile.gender === "female" ? humanFemale : humanMale}
                  alt="Full Body Model"
                  className="h-full w-full object-contain"
                  style={{ filter: "drop-shadow(0 20px 50px rgba(0,0,0,0.8)) saturate(1.1)" }}
                />
                
                {/* Skin/Hair Tinting Layers (Optional) */}
                <div className="absolute inset-0 opacity-20 mix-blend-multiply pointer-events-none" style={{ backgroundColor: profile.skinTone, WebkitMaskImage: `url(${profile.gender === "female" ? humanFemale : humanMale})`, maskImage: `url(${profile.gender === "female" ? humanFemale : humanMale})`, maskSize: 'contain', maskRepeat: 'no-repeat', maskPosition: 'center' }} />
              </div>

              {/* Scanning Pulse */}
              {scanning && <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/20 to-transparent animate-scan" />}
            </div>
          )}

          {/* AR OVERLAY - GARMENT */}
          {overlay && (
            <div
              className="absolute left-1/2 -translate-x-1/2 pointer-events-none transition-all duration-500 ease-out z-30"
              style={{
                top: `${fit.top}%`,
                height: `${100 - fit.top - fit.bottom}%`,
                width: `${fit.width}%`,
                transform: `translateX(-50%) perspective(1000px) rotateY(${rotated && mode === "avatar" ? 45 : 0}deg)`,
              }}
            >
              <div className="relative h-full w-full">
                {overlay.image ? (
                  <img src={overlay.image} className="h-full w-full object-contain" style={{ filter: "drop-shadow(0 10px 20px rgba(0,0,0,0.5))" }} />
                ) : (
                  <GarmentSVG category={overlay.category} color={overlay.color} brand={overlay.brand} />
                )}
                {/* Fabric Shimmer */}
                <div className="absolute inset-0 opacity-40 mix-blend-overlay" style={{ background: FABRIC_TEXTURES[overlay.fabric] }} />
              </div>

              {/* Label */}
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-background/80 border border-accent/50 px-4 py-1 text-[10px] font-bold text-accent shadow-xl backdrop-blur">
                {overlay.brand} · {overlay.name}
              </div>
            </div>
          )}

          {/* Progress Bar for Fitting */}
          {trying && (
            <div className="absolute bottom-10 left-6 right-6 h-1 rounded-full bg-white/10 overflow-hidden">
               <div className="h-full bg-accent shadow-[0_0_10px_var(--accent)] transition-all" style={{ width: `${progress}%` }} />
            </div>
          )}
        </div>

        {/* Actions Bar */}
        <div className="flex gap-2">
          <button
            onClick={tryBrandDefault}
            disabled={trying}
            className="flex-1 flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-accent py-3 text-xs font-black uppercase tracking-widest text-white shadow-[var(--glow-accent)] active:scale-95 disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" />
            {trying ? (isAr ? "جاري القياس..." : "FITTING...") : (isAr ? "تجربة فورية" : "TRY ON NOW")}
          </button>
          {overlay && (
            <button onClick={() => setOverlay(null)} className="rounded-full bg-destructive/10 border border-destructive/30 p-3 text-destructive hover:bg-destructive/20">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* AI Style Advisor Section */}
        {overlay && (
          <div className="rounded-2xl border border-accent/30 bg-accent/5 p-4 backdrop-blur-md">
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="h-4 w-4 text-accent" />
              <h4 className="text-[10px] font-black uppercase tracking-widest text-accent">{isAr ? "نصيحة المستشار الذكي" : "AI STYLE ADVICE"}</h4>
            </div>
            {advisorLoading ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" /> {isAr ? "جاري التحليل..." : "Analyzing..."}
              </div>
            ) : (
              <ul className="space-y-2">
                {advisorTips.slice(0, 2).map((tip, i) => (
                  <li key={i} className="flex gap-2 text-[11px] text-foreground/90 leading-relaxed">
                    <div className="mt-1.5 h-1 w-1 rounded-full bg-accent shrink-0" />
                    {tip}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Brand Selector */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {BRANDS.map((b, i) => (
            <button
              key={b.id}
              onClick={() => { setActiveBrandIdx(i); setOpenMall(b); }}
              className={`shrink-0 rounded-xl border px-5 py-2.5 text-xs font-bold transition ${
                activeBrandIdx === i ? "border-accent bg-accent/10 text-accent shadow-[var(--glow-accent)]" : "border-primary/20 bg-card/40 text-muted-foreground"
              }`}
            >
              {b.name}
            </button>
          ))}
        </div>
      </div>

      {/* Shopping Mall Modal */}
      {openMall && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-md sm:items-center p-4" onClick={() => setOpenMall(null)}>
          <div className="glass-panel w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6 rounded-[2rem] border border-primary/20 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
               <div className="flex items-center gap-2">
                 <ShoppingBag className="h-5 w-5 text-accent" />
                 <h3 className="font-bold uppercase tracking-widest text-lg">{openMall.name} Collection</h3>
               </div>
               <button onClick={() => setOpenMall(null)} className="p-2 rounded-full bg-white/5 hover:bg-white/10"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {openMall.items.map(item => (
                <div key={item.id} className="group bg-card/30 rounded-2xl border border-white/5 p-3 hover:border-accent/50 transition-all">
                  <div className="aspect-square rounded-xl overflow-hidden mb-3 relative" style={{ background: item.gradient }}>
                     <img src={item.image} className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform" />
                     <div className="absolute top-2 right-2 text-[8px] bg-black/50 px-2 py-0.5 rounded-full backdrop-blur">{fabricOf(item)}</div>
                  </div>
                  <h4 className="text-xs font-bold mb-1 truncate">{item.name}</h4>
                  <button 
                    onClick={() => { tryItem(openMall, item); setOpenMall(null); }}
                    className="w-full mt-2 py-2 rounded-lg bg-primary/10 border border-primary/30 text-[10px] font-bold hover:bg-primary/20 text-primary transition-all"
                  >
                    {isAr ? "تجربة AR" : "AR TRY-ON"}
                  </button>
                  <a 
                    href={`https://www.amazon.com/s?k=${encodeURIComponent(item.query)}&tag=${AMAZON_TAG}`}
                    target="_blank"
                    className="flex items-center justify-center gap-1 w-full mt-2 py-2 rounded-lg bg-white text-black text-[10px] font-bold hover:bg-gray-200"
                  >
                    <img src={amazonLogo} className="h-3" alt="Amazon" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </GlassPanel>
  );
}

// GarmentSVG Component to handle fallback icons
function GarmentSVG({ category, color, brand }: { category: Category; color: string; brand: string }) {
  const filter = "drop-shadow(0 4px 10px rgba(0,0,0,0.3))";
  if (category === "bottom") return (
    <svg viewBox="0 0 100 120" className="h-full w-full" style={{ filter }}>
      <path d="M25,10 L75,10 L72,110 L55,110 L52,50 L48,50 L45,110 L28,110 Z" fill={color} />
    </svg>
  );
  if (category === "dress") return (
    <svg viewBox="0 0 100 120" className="h-full w-full" style={{ filter }}>
      <path d="M35,10 Q50,0 65,10 L75,100 L25,100 Z" fill={color} />
    </svg>
  );
  // Default Top
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" style={{ filter }}>
      <path d="M20,20 L40,10 Q50,15 60,10 L80,20 L75,80 L25,80 Z" fill={color} />
    </svg>
  );
}
