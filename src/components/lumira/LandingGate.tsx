import { Mars, Venus, ArrowRight } from "lucide-react";
import { useProfile, type Gender } from "./profile-context";
import { useT } from "./i18n";
import { LanguageToggle } from "./LanguageToggle";
import HUMAN_MALE from "@/assets/avatar-male.png";
import HUMAN_FEMALE from "@/assets/avatar-female.png";

interface Props {
  onContinue: () => void;
}

export function LandingGate({ onContinue }: Props) {
  const { lang } = useT();
  const isAr = lang === "ar";
  const { gender, setGender } = useProfile();

  const choose = (g: Gender) => {
    setGender(g);
    // Smooth transition into the mirror after a short beat
    window.setTimeout(() => onContinue(), 280);
  };

  return (
    <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-between px-4 py-8">
      {/* Top bar */}
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative h-9 w-9">
            <div className="absolute inset-0 animate-ring-rotate rounded-full border border-dashed border-primary/60" />
            <div className="absolute inset-1.5 rounded-full bg-gradient-to-br from-primary to-accent shadow-[var(--glow-primary)]" />
            <div className="absolute inset-3 rounded-full bg-background" />
          </div>
          <h1
            className="text-gradient-neon text-base font-extrabold tracking-[0.3em] sm:text-lg"
            style={isAr
              ? { fontFamily: "'Tajawal','Noto Kufi Arabic',sans-serif", letterSpacing: "0.18em" }
              : { fontFamily: "'Inter',sans-serif" }}
          >
            {isAr ? "لوميرا" : "LUMIRA"}
          </h1>
        </div>
        <LanguageToggle />
      </div>

      {/* Title */}
      <div className="mt-6 text-center">
        <p className="text-[10px] uppercase tracking-[0.4em] text-muted-foreground">
          {isAr ? "اختر صورتك الرمزية" : "Choose your avatar"}
        </p>
        <h2 className="mt-2 text-gradient-neon text-2xl font-bold tracking-tight sm:text-3xl">
          {isAr ? "ابدأ تجربة المرآة الذكية" : "Enter the Smart Mirror"}
        </h2>
      </div>

      {/* Gender toggle pill */}
      <div className="mt-6 inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/5 p-1 backdrop-blur-xl">
        <GenderPill
          active={gender === "male"}
          onClick={() => choose("male")}
          icon={<Mars className="h-4 w-4" />}
          label={isAr ? "ذكر" : "Male"}
        />
        <GenderPill
          active={gender === "female"}
          onClick={() => choose("female")}
          icon={<Venus className="h-4 w-4" />}
          label={isAr ? "أنثى" : "Female"}
        />
      </div>

      {/* Avatar showcase — large */}
      <div className="relative mt-8 flex w-full flex-1 items-end justify-center gap-4 sm:gap-12">
        <AvatarFigure
          src={HUMAN_MALE}
          active={gender === "male"}
          label={isAr ? "ذكر" : "Male"}
          onClick={() => choose("male")}
        />
        <AvatarFigure
          src={HUMAN_FEMALE}
          active={gender === "female"}
          label={isAr ? "أنثى" : "Female"}
          onClick={() => choose("female")}
        />
      </div>

      {/* CTAs */}
      <div className="mt-8 flex w-full flex-col items-center gap-4">
        <button
          onClick={onContinue}
          className="pi-glow-cta group inline-flex items-center gap-2 rounded-full px-8 py-3 text-sm font-bold uppercase tracking-[0.3em] text-white"
        >
          <span>{isAr ? "افتح المرآة" : "Open Mirror"}</span>
          <ArrowRight className={`h-4 w-4 transition group-hover:translate-x-1 ${isAr ? "rotate-180" : ""}`} />
        </button>
        
      </div>
    </main>
  );
}

function GenderPill({ active, onClick, icon, label }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-[0.25em] transition ${
        active
          ? "bg-gradient-to-r from-primary to-accent text-white shadow-[var(--glow-primary)]"
          : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

function AvatarFigure({ src, active, label, onClick }: {
  src: string; active: boolean; label: string; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`group relative flex h-[55vh] max-h-[460px] flex-col items-center justify-end transition-all duration-500 ${
        active ? "scale-105" : "scale-90 opacity-50 hover:opacity-80"
      }`}
    >
      <div className={`absolute inset-x-0 bottom-2 mx-auto h-3 w-3/4 rounded-full blur-2xl transition ${
        active ? "bg-accent/60" : "bg-transparent"
      }`} />
      <img src={src} alt={label} className="relative h-full w-auto object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.5)]" />
      {active && (
        <span className="absolute -bottom-2 rounded-full border border-accent/50 bg-background/80 px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.3em] text-accent backdrop-blur">
          {label}
        </span>
      )}
    </button>
  );
}
