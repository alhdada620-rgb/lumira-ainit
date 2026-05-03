import { useEffect, useState } from "react";
import { Ear, Volume2, X } from "lucide-react";

export const CAPTION_EVENT = "lumira:caption";

export type CaptionKind = "heard" | "spoken";

export interface CaptionPayload {
  kind: CaptionKind;
  text: string;
  /** Persist ms; 0 keeps until next heard caption (used for interim) */
  ttl?: number;
}

export function emitCaption(payload: CaptionPayload) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<CaptionPayload>(CAPTION_EVENT, { detail: payload }));
}

interface Caption extends CaptionPayload {
  id: number;
  ts: number;
}

let nextId = 1;

export function CaptionsOverlay() {
  const [heard, setHeard] = useState<Caption | null>(null);
  const [spoken, setSpoken] = useState<Caption | null>(null);

  useEffect(() => {
    const onCaption = (e: Event) => {
      const detail = (e as CustomEvent<CaptionPayload>).detail;
      if (!detail?.text) return;
      const cap: Caption = { ...detail, id: nextId++, ts: Date.now() };
      const ttl = detail.ttl ?? 4500;
      if (detail.kind === "heard") {
        setHeard(cap);
        if (ttl > 0) {
          window.setTimeout(() => {
            setHeard((cur) => (cur?.id === cap.id ? null : cur));
          }, ttl);
        }
      } else {
        setSpoken(cap);
        if (ttl > 0) {
          window.setTimeout(() => {
            setSpoken((cur) => (cur?.id === cap.id ? null : cur));
          }, ttl);
        }
      }
    };
    window.addEventListener(CAPTION_EVENT, onCaption);
    return () => window.removeEventListener(CAPTION_EVENT, onCaption);
  }, []);

  if (!heard && !spoken) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-3 sm:bottom-6"
    >
      {heard && (
        <CaptionCard
          key={`h-${heard.id}`}
          icon={<Ear className="h-3.5 w-3.5" />}
          label="Heard"
          text={heard.text}
          tone="primary"
          onDismiss={() => setHeard(null)}
        />
      )}
      {spoken && (
        <CaptionCard
          key={`s-${spoken.id}`}
          icon={<Volume2 className="h-3.5 w-3.5" />}
          label="Lumira"
          text={spoken.text}
          tone="accent"
          onDismiss={() => setSpoken(null)}
        />
      )}
    </div>
  );
}

function CaptionCard({
  icon, label, text, tone, onDismiss,
}: {
  icon: React.ReactNode;
  label: string;
  text: string;
  tone: "primary" | "accent";
  onDismiss: () => void;
}) {
  const ring = tone === "accent" ? "border-accent/50 shadow-[var(--glow-accent)]" : "border-primary/50 shadow-[var(--glow-soft)]";
  const chip = tone === "accent" ? "bg-accent/15 text-accent" : "bg-primary/15 text-primary";
  return (
    <div
      className={`pointer-events-auto flex max-w-[92vw] items-start gap-2 rounded-xl border ${ring} bg-background/75 p-2 pe-2.5 backdrop-blur-xl animate-fade-in sm:max-w-xl`}
    >
      <span className={`mt-0.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.25em] ${chip}`}>
        {icon}
        {label}
      </span>
      <p className="flex-1 text-[12px] leading-snug text-foreground/95">{text}</p>
      <button
        onClick={onDismiss}
        aria-label="Dismiss caption"
        className="rounded-full p-1 text-muted-foreground transition hover:bg-card/60 hover:text-foreground"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}
