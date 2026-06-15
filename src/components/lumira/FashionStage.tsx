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
import CLOSET_BACKDROP from "@/assets/closet-backdrop.jpg";
import HUMAN_MALE from "@/assets/mannequin-male.png";
import HUMAN_FEMALE from "@/assets/mannequin-female.png";
import HM_TEE from "@/assets/garments/hm-tee.png";
import HM_DENIM from "@/assets/garments/hm-denim.png";
import NIKE_HOODIE from "@/assets/garments/nike-hoodie.png";
import ZARA_BLAZER from "@/assets/garments/zara-blazer.png";

const AMAZON_LOGO = "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg";

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
  imageUrl: string;
  fabric?: Fabric;
}

interface Brand {
  id: string;
  name: string;
  outfit: string;
  tint: string;
  items: CatalogItem[];
}

// رجعتلك كل الماركات تانى بس بروابط شغالة 100%
const BRANDS: Brand[] = [
  {
    id: "hm", name: "H&M", outfit: "Casual Crew",
    tint: "linear-gradient(135deg, oklch(0.55 0.2 25 / 0.55), oklch(0.4 0.15 25 / 0.4))",
    items: [
      { id: "hm-1", name: "Oversized Tee", tag: "Everyday", category: "top", color: "#e8d9b8", imageUrl: HM_TEE, query: "h&m oversized tee", gradient: "linear-gradient(135deg, oklch(0.9 0.02 90 / 0.5), oklch(0.78 0.04 80 / 0.4))" },
      { id: "hm-2", name: "Denim Jacket", tag: "Layering", category: "top", color: "#3a5a82", imageUrl: HM_DENIM, query: "h&m denim jacket", gradient: "linear-gradient(135deg, oklch(0.45 0.08 240 / 0.5), oklch(0.6 0.1 230 / 0.45))" },
    ],
  },
  {
    id: "nike", name: "NIKE", outfit: "Sporty Tech",
    tint: "linear-gradient(135deg, oklch(0.5 0.1 230 / 0.55), oklch(0.3 0.05 230 / 0.45))",
    items: [
      { id: "nike-1", name: "Tech Hoodie", tag: "Training", category: "top", color: "#1a1f2e", imageUrl: NIKE_HOODIE, query: "nike tech fleece", gradient: "linear-gradient(135deg, oklch(0.25 0.02 260 / 0.55), oklch(0.4 0.04 260 / 0.45))" },
    ],
  },
  {
    id: "zara", name: "ZARA", outfit: "Minimalist",
    tint: "linear-gradient(135deg, oklch(0.35 0.04 60 / 0.55), oklch(0.2 0.02 60 / 0.45))",
    items: [
      { id: "zara-1", name: "Wool Blazer", tag: "Smart", category: "top", color: "#2a2f3d", imageUrl: ZARA_BLAZER, query: "zara wool blazer", gradient: "linear-gradient(135deg, oklch(0.3 0.02 260 / 0.55), oklch(0.5 0.04 260 / 0.45))" },
    ],
  },
];

export function FashionStage() {
  const { lang } = useT();
  const isAr = lang === "ar";
  const { stream, active, start } = useCamera();
  const profile = useProfile();
  const videoRef = useRef<HTMLVideoElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const [mode, setMode] = useState<"live" | "avatar" | "photo">("avatar");
  const [activeBrandIdx, setActiveBrandIdx] = useState(0);
  const [overlay, setOverlay] = useState<CatalogItem | null>(null);
  const [rotated, setRotated] = useState(false);

  useEffect(() => {
    if (stream && videoRef.current && mode === "live") {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream, mode]);

  const captureLook = async () => {
    if (!stageRef.current) return;
    const dataUrl = await toPng(stageRef.current);
    const link = document.createElement('a');
    link.download = `lumira-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
    toast.success(isAr ? "تم حفظ الإطلالة" : "Look Saved");
  };

  const brand = BRANDS[activeBrandIdx];

  return (
    <GlassPanel title={isAr ? "مختبر التصميم | لوميرا" : "Style Lab | Lumira"} className="lg:col-span-1">
      <div className="space-y-4">
        {/* شريط الأوضاع */}
        <div className="grid grid-cols-3 gap-1 bg-card/40 p-1 rounded-xl border border-primary/20">
          {["live", "avatar", "photo"].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m as any)}
              className={`py-2 text-[9px] font-bold rounded-lg transition ${mode === m ? "bg-accent/20 text-accent shadow-sm" : "text-muted-foreground"}`}
            >
              {m.toUpperCase()}
            </button>
          ))}
        </div>

        {/* مسرح العرض الطولي 9:16 */}
        <div ref={stageRef} className="relative aspect-[9/16] w-full rounded-[2.5rem] overflow-hidden border border-accent/30 bg-background shadow-2xl">
          <img src={CLOSET_BACKDROP} className="absolute inset-0 h-full w-full object-cover opacity-50 blur-sm" />
          
          {mode === "live" && (
            <video ref={videoRef} playsInline muted className="absolute inset-0 h-full w-full object-cover scale-x-[-1]" />
          )}

          {mode === "avatar" && (
            <div className="absolute inset-0 flex items-center justify-center transition-transform duration-500" style={{ transform: rotated ? "rotateY(45deg)" : "none" }}>
              <img 
                src={profile.gender === "female" ? HUMAN_FEMALE : HUMAN_MALE} 
                className="h-[90%] object-contain drop-shadow-2xl" 
              />
            </div>
          )}

          {overlay && (
            <div className="absolute top-[22%] left-1/2 -translate-x-1/2 w-[75%] z-30 animate-in fade-in zoom-in duration-300">
               <img src={overlay.imageUrl} className="w-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]" />
            </div>
          )}

          <button onClick={captureLook} className="absolute top-4 right-4 z-40 p-2 bg-background/60 backdrop-blur-md rounded-full border border-accent/40 text-accent">
            <Download className="h-4 w-4" />
          </button>
        </div>

        {/* التحكم في التدوير والجنس */}
        <div className="flex justify-between items-center bg-card/30 p-2 rounded-xl border border-white/5">
           <button onClick={() => setRotated(!rotated)} className="flex items-center gap-2 text-[10px] font-bold text-primary">
             <RotateCw className="h-3.5 w-3.5" /> {isAr ? "تدوير 3D" : "3D ROTATE"}
           </button>
           <div className="flex gap-2">
              <button onClick={() => profile.setGender("male")} className={`px-3 py-1 rounded-full text-[10px] ${profile.gender === "male" ? "bg-primary text-white" : "bg-white/5"}`}>M</button>
              <button onClick={() => profile.setGender("female")} className={`px-3 py-1 rounded-full text-[10px] ${profile.gender === "female" ? "bg-primary text-white" : "bg-white/5"}`}>F</button>
           </div>
        </div>

        {/* اختيار الماركة والقطع */}
        <div className="space-y-3">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {BRANDS.map((b, i) => (
              <button 
                key={b.id} 
                onClick={() => setActiveBrandIdx(i)}
                className={`shrink-0 px-4 py-2 rounded-xl text-[10px] font-bold border transition ${activeBrandIdx === i ? "border-accent bg-accent/10 text-accent" : "border-white/10 text-muted-foreground"}`}
              >
                {b.name}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2">
            {brand.items.map(item => (
              <button key={item.id} onClick={() => setOverlay(item)} className="p-2 bg-white/5 border border-white/10 rounded-xl hover:border-accent/50 transition-all">
                <img src={item.imageUrl} className="h-20 w-full object-contain mb-2" />
                <p className="text-[9px] font-bold truncate">{item.name}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}
