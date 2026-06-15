import { useProfile } from "./profile-context";
import { useOutfit } from "./outfit-context";
import HUMAN_MALE from "@/assets/avatar-male.png";
import HUMAN_FEMALE from "@/assets/avatar-female.png";

export function AvatarMirror() {
  const { gender } = useProfile();
  const { color, accent, label } = useOutfit();
  const src = gender === "female" ? HUMAN_FEMALE : HUMAN_MALE;

  return (
    <div
      suppressHydrationWarning
      className="relative mx-auto flex aspect-[9/16] w-full max-w-[420px] items-center justify-center overflow-hidden rounded-[2rem] border border-white/10 bg-[oklch(0.06_0.01_260)] shadow-[0_0_60px_oklch(0.4_0.1_230_/0.4)]"
    >
      {/* ambient glows */}
      <span className="pointer-events-none absolute -top-20 left-1/2 h-60 w-60 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
      <span className="pointer-events-none absolute bottom-0 left-1/2 h-40 w-72 -translate-x-1/2 rounded-full bg-accent/15 blur-3xl" />

      {/* mirror grid */}
      <div className="pointer-events-none absolute inset-0 opacity-30 [background:repeating-linear-gradient(0deg,transparent_0,transparent_22px,oklch(0.6_0.1_230_/0.06)_22px,oklch(0.6_0.1_230_/0.06)_23px)]" />

      {/* avatar — perfectly centered */}
      <img
        suppressHydrationWarning
        src={src}
        alt="Avatar"
        width={768}
        height={1344}
        className="relative z-10 mx-auto h-full w-auto max-h-full object-contain object-bottom drop-shadow-[0_15px_30px_rgba(0,0,0,0.5)] transition-opacity duration-500"
        key={src}
      />

      {/* outfit overlay (torso silhouette) */}
      {label && (
        <div
          className="pointer-events-none absolute left-1/2 top-[30%] z-20 h-[36%] w-[58%] -translate-x-1/2 rounded-[40%_40%_30%_30%/30%_30%_60%_60%] mix-blend-screen opacity-80"
          style={{
            background: `linear-gradient(135deg, ${color}, ${accent})`,
            boxShadow: `0 0 30px ${accent}`,
          }}
          aria-hidden
        />
      )}

      {/* live tag */}
      <span className="absolute left-3 top-3 z-30 inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-background/60 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.25em] text-emerald-300 backdrop-blur">
        <span className="h-1 w-1 animate-pulse rounded-full bg-emerald-400" />
        Live
      </span>

      {/* outfit caption */}
      {label && (
        <div className="absolute inset-x-3 bottom-3 z-30 rounded-xl border border-accent/40 bg-background/70 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-accent backdrop-blur">
          {label}
        </div>
      )}
    </div>
  );
}
