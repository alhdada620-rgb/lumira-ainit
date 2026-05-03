import { GlassPanel } from "./GlassPanel";
import { User } from "lucide-react";
import { useProfile } from "./profile-context";
import { useT } from "./i18n";

const SKIN_TONES = ["#f5d6b8", "#e6b48a", "#d9a37a", "#b8835a", "#8a5a3a", "#5a3820"];

export function ProfileData() {
  const { lang } = useT();
  const isAr = lang === "ar";
  const p = useProfile();

  return (
    <GlassPanel
      title={isAr ? "بيانات الملف" : "Profile Data"}
      icon={<User className="h-3.5 w-3.5" />}
      accent
    >
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
            {isAr ? "الاسم" : "Name"}
          </label>
          <input
            value={p.name}
            onChange={(e) => p.setName(e.target.value)}
            className="w-full rounded-md border border-primary/30 bg-background/40 px-2.5 py-1.5 text-xs text-foreground backdrop-blur focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/40"
          />
        </div>

        <div>
          <label className="mb-1 block text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
            {isAr ? "لون البشرة" : "Skin Tone"}
          </label>
          <div className="flex items-center gap-2">
            {SKIN_TONES.map((c) => (
              <button
                key={c}
                onClick={() => p.setSkinTone(c)}
                aria-label={c}
                className={`h-6 w-6 rounded-full border transition ${
                  p.skinTone === c
                    ? "border-accent shadow-[var(--glow-accent)] scale-110"
                    : "border-primary/30 hover:border-primary/60"
                }`}
                style={{ background: c }}
              />
            ))}
            <input
              type="color"
              value={p.skinTone}
              onChange={(e) => p.setSkinTone(e.target.value)}
              className="ms-1 h-6 w-6 cursor-pointer rounded-full border border-primary/30 bg-transparent"
              aria-label="custom skin tone"
            />
          </div>
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
            <span>{isAr ? "الوزن" : "Weight"}</span>
            <span className="text-primary">{p.weight} kg</span>
          </div>
          <input
            type="range" min={40} max={140} value={p.weight}
            onChange={(e) => p.setWeight(Number(e.target.value))}
            className="w-full accent-[oklch(0.85_0.15_200)]"
          />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
            <span>{isAr ? "الطول" : "Height"}</span>
            <span className="text-primary">{p.height} cm</span>
          </div>
          <input
            type="range" min={140} max={210} value={p.height}
            onChange={(e) => p.setHeight(Number(e.target.value))}
            className="w-full accent-[oklch(0.85_0.15_200)]"
          />
        </div>
      </div>
    </GlassPanel>
  );
}
