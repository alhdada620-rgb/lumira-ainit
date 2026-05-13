import { useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowLeft, MapPin, Store, Sparkles, Brush, Shirt,
} from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useProfile } from "./profile-context";
import { useT } from "./i18n";
import { AvatarMirror } from "./AvatarMirror";
import { AskLumira } from "./AskLumira";
import { LanguageToggle } from "./LanguageToggle";
import { PiSignInButton } from "./PiSignInButton";
import { HealthSkinAI } from "./HealthSkinAI";
import { FashionStage } from "./FashionStage";

const SKIN_TONES = ["#f5d6b8", "#e6b48a", "#d9a37a", "#b8835a", "#8a5a3a", "#5a3820"];
const HAIR_COLORS = ["#1a0f08", "#2a1a10", "#5a3820", "#8a5a3a", "#c89a5a", "#e8c89a", "#a52a2a", "#222"];

interface Props {
  onBack: () => void;
}

export function MirrorStageLayout({ onBack }: Props) {
  const { lang } = useT();
  const isAr = lang === "ar";
  const p = useProfile();
  const [openPanel, setOpenPanel] = useState<null | "skin" | "makeup" | "style">(null);

  return (
    <main className="relative z-10 mx-auto min-h-screen w-full max-w-7xl px-3 pb-32 pt-4 sm:px-6 sm:pt-6">
      {/* Top bar */}
      <header className="mb-4 flex items-center justify-between gap-3">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground backdrop-blur transition hover:text-foreground"
        >
          <ArrowLeft className={`h-3.5 w-3.5 ${isAr ? "rotate-180" : ""}`} />
          {isAr ? "رجوع" : "Back"}
        </button>
        <h1 className="text-gradient-neon text-sm font-extrabold tracking-[0.3em] sm:text-base"
            style={isAr ? { fontFamily: "'Tajawal',sans-serif" } : { fontFamily: "'Inter',sans-serif" }}>
          {isAr ? "المرآة الذكية" : "SMART MIRROR"}
        </h1>
        <div className="flex items-center gap-2">
          <LanguageToggle />
        </div>
      </header>

      {/* Main 3-column grid: sliders | mirror | category buttons */}
      <div className="grid grid-cols-12 gap-3 sm:gap-5">
        {/* Left — profile sliders */}
        <aside className="order-2 col-span-12 space-y-3 lg:order-1 lg:col-span-3">
          <SidebarPanel title={isAr ? "ملفك الشخصي" : "Personal Profile"}>
            <SliderRow label={isAr ? "الوزن" : "Weight"} value={p.weight} suffix="kg"
              min={40} max={140} onChange={p.setWeight} />
            <SliderRow label={isAr ? "الطول" : "Height"} value={p.height} suffix="cm"
              min={140} max={210} onChange={p.setHeight} />

            <SwatchRow label={isAr ? "لون البشرة" : "Skin Tone"} colors={SKIN_TONES}
              value={p.skinTone} onChange={p.setSkinTone} />
            <SwatchRow label={isAr ? "لون الشعر" : "Hair Color"} colors={HAIR_COLORS}
              value={p.hairColor} onChange={p.setHairColor} />
          </SidebarPanel>
        </aside>

        {/* Center — Mirror */}
        <section className="order-1 col-span-12 lg:order-2 lg:col-span-6">
          <AvatarMirror />
          <div className="mt-4">
            <AskLumira />
          </div>
        </section>

        {/* Right — Category panels */}
        <aside className="order-3 col-span-12 space-y-3 lg:col-span-3">
          <CategoryButton
            icon={<Sparkles className="h-5 w-5" />}
            title={isAr ? "العناية بالبشرة" : "Skin Care"}
            subtitle={isAr ? "تحليل ذكي للبشرة" : "AI skin analysis"}
            tint="from-cyan-400/30 to-blue-500/20"
            onClick={() => setOpenPanel("skin")}
          />
          <CategoryButton
            icon={<Brush className="h-5 w-5" />}
            title={isAr ? "المكياج / الشعر" : "Makeup / Hair"}
            subtitle={isAr ? "كوافير ومكياج" : "Koffier & makeup"}
            tint="from-pink-400/30 to-fuchsia-500/20"
            onClick={() => setOpenPanel("makeup")}
          />
          <CategoryButton
            icon={<Shirt className="h-5 w-5" />}
            title={isAr ? "الستايل" : "Style"}
            subtitle={isAr ? "مولّد إطلالات مخصص" : "Custom outfit generator"}
            tint="from-amber-300/30 to-orange-500/20"
            onClick={() => setOpenPanel("style")}
          />
          <div className="pt-1">
            <PiSignInButton />
          </div>
        </aside>
      </div>

      {/* Bottom tiles */}
      <section className="mt-6 grid grid-cols-2 gap-3 sm:gap-4">
        <BottomTile
          to="/mall"
          icon={<MapPin className="h-5 w-5" />}
          title={isAr ? "المتاجر المجاورة" : "Nearby Stores"}
          subtitle={isAr ? "خريطة تفاعلية مباشرة" : "Live interactive map"}
          tint="from-emerald-400/25 to-teal-500/15"
        />
        <BottomTile
          to="/mall"
          icon={<Store className="h-5 w-5" />}
          title={isAr ? "اشتراك المتاجر" : "Merchant Portal"}
          subtitle={isAr ? "انضم كتاجر إلى لوميرا" : "Join Lumira as a merchant"}
          tint="from-violet-400/25 to-indigo-500/15"
        />
      </section>

      {/* Side panels */}
      <Sheet open={openPanel !== null} onOpenChange={(o) => !o && setOpenPanel(null)}>
        <SheetContent
          side={isAr ? "left" : "right"}
          className="w-full max-w-md overflow-y-auto border-white/10 bg-[oklch(0.06_0.01_260)]/95 backdrop-blur-xl sm:max-w-lg"
        >
          <SheetHeader>
            <SheetTitle className="text-gradient-neon text-sm uppercase tracking-[0.3em]">
              {openPanel === "skin"  && (isAr ? "العناية بالبشرة" : "Skin Care")}
              {openPanel === "makeup" && (isAr ? "المكياج والشعر" : "Makeup & Hair")}
              {openPanel === "style" && (isAr ? "ستوديو الستايل" : "Style Studio")}
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            {openPanel === "skin" && <HealthSkinAI />}
            {openPanel === "makeup" && <FashionStage />}
            {openPanel === "style" && <FashionStage />}
          </div>
        </SheetContent>
      </Sheet>
    </main>
  );
}

/* --- subcomponents --- */

function SidebarPanel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass-panel relative space-y-4 overflow-hidden rounded-2xl p-4">
      <div className="flex items-center justify-between border-b border-white/5 pb-2">
        <h3 className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">{title}</h3>
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent shadow-[0_0_8px_var(--accent)]" />
      </div>
      {children}
    </div>
  );
}

function SliderRow({ label, value, suffix, min, max, onChange }: {
  label: string; value: number; suffix: string; min: number; max: number; onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
        <span>{label}</span>
        <span className="text-primary">{value} {suffix}</span>
      </div>
      <input
        type="range" min={min} max={max} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[oklch(0.85_0.15_200)]"
      />
    </div>
  );
}

function SwatchRow({ label, colors, value, onChange }: {
  label: string; colors: string[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <div>
      <div className="mb-1 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{label}</div>
      <div className="flex flex-wrap items-center gap-1.5">
        {colors.map((c) => (
          <button
            key={c}
            onClick={() => onChange(c)}
            aria-label={c}
            className={`h-6 w-6 rounded-full border transition ${
              value === c ? "scale-110 border-accent shadow-[var(--glow-accent)]" : "border-white/15 hover:border-white/40"
            }`}
            style={{ background: c }}
          />
        ))}
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="ms-1 h-6 w-6 cursor-pointer rounded-full border border-white/15 bg-transparent"
        />
      </div>
    </div>
  );
}

function CategoryButton({ icon, title, subtitle, tint, onClick }: {
  icon: React.ReactNode; title: string; subtitle: string; tint: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${tint} p-4 text-start backdrop-blur-xl transition hover:border-accent/40 hover:shadow-[var(--glow-soft)]`}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-background/40 text-accent">
        {icon}
      </span>
      <span className="flex-1">
        <span className="block text-xs font-bold uppercase tracking-[0.2em] text-foreground">{title}</span>
        <span className="block text-[10px] text-muted-foreground">{subtitle}</span>
      </span>
    </button>
  );
}

function BottomTile({ to, icon, title, subtitle, tint }: {
  to: string; icon: React.ReactNode; title: string; subtitle: string; tint: string;
}) {
  return (
    <Link
      to={to}
      className={`group relative flex items-center gap-3 overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${tint} p-4 backdrop-blur-xl transition hover:border-accent/40 hover:shadow-[var(--glow-soft)]`}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-background/40 text-foreground">
        {icon}
      </span>
      <span className="flex-1">
        <span className="block text-xs font-bold uppercase tracking-[0.2em] text-foreground">{title}</span>
        <span className="block text-[10px] text-muted-foreground">{subtitle}</span>
      </span>
    </Link>
  );
}
