import { Mic, MicOff, Sparkles, Camera, Wallet, Shirt } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { GlassPanel } from "./GlassPanel";
import { emitVoiceCommand, type VoiceCommand } from "./voice-events";
import { emitCaption } from "./CaptionsOverlay";
import { useT } from "./i18n";

// Minimal Web Speech API types (not in lib.dom for all TS configs)
type SpeechRecognitionResult = { transcript: string };
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<ArrayLike<SpeechRecognitionResult> & { isFinal: boolean }>;
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

type Preset = {
  command: VoiceCommand;
  labelKey: string;
  phraseKey: string;
  feedbackKey: string;
  icon: typeof Sparkles;
  patterns: RegExp[];
};

const PRESETS: Preset[] = [
  {
    command: "analyze-skin",
    labelKey: "voice.preset.analyzeSkin",
    phraseKey: "voice.preset.analyzeSkin.phrase",
    feedbackKey: "voice.preset.analyzeSkin.feedback",
    icon: Sparkles,
    patterns: [
      /lumira[, ]+analy[sz]e my skin/i,
      /analy[sz]e my skin/i,
      /lumira[, ]+skin (analysis|check|scan)/i,
      /حلل[يى]?[\s,]+بشرت[يى]/,
    ],
  },
  {
    command: "start-mirror",
    labelKey: "voice.preset.startMirror",
    phraseKey: "voice.preset.startMirror.phrase",
    feedbackKey: "voice.preset.startMirror.feedback",
    icon: Camera,
    patterns: [
      /(start|activate|turn on|open)( the)? mirror/i,
      /(start|open)( the)? camera/i,
      /(شغ[لّ][يى]?|افتح[يى]?)( ال)?(مرآة|كاميرا)/,
    ],
  },
  {
    command: "stop-mirror",
    labelKey: "voice.preset.stopMirror",
    phraseKey: "voice.preset.stopMirror.phrase",
    feedbackKey: "voice.preset.stopMirror.feedback",
    icon: Camera,
    patterns: [
      /(stop|close|turn off|deactivate)( the)? mirror/i,
      /(stop|close)( the)? camera/i,
      /(أوقف[يى]?|اقفل[يى]?)( ال)?(مرآة|كاميرا)/,
    ],
  },
  {
    command: "connect-pi-wallet",
    labelKey: "voice.preset.connectPi",
    phraseKey: "voice.preset.connectPi.phrase",
    feedbackKey: "voice.preset.connectPi.feedback",
    icon: Wallet,
    patterns: [
      /connect( my)? pi( network)?( wallet)?/i,
      /(open|launch) pi( wallet)?/i,
      /اربط[يى]?( ال)?محفظة/,
    ],
  },
  {
    command: "next-outfit",
    labelKey: "voice.preset.nextOutfit",
    phraseKey: "voice.preset.nextOutfit.phrase",
    feedbackKey: "voice.preset.nextOutfit.feedback",
    icon: Shirt,
    patterns: [
      /(next|change|switch)( the)? outfit/i,
      /try (on )?(another|next) (look|outfit)/i,
      /(الإطلالة|إطلالة) التالية/,
    ],
  },
];

function matchPreset(text: string): Preset | null {
  for (const p of PRESETS) {
    if (p.patterns.some((re) => re.test(text))) return p;
  }
  return null;
}

export function VoiceVisualizer() {
  const bars = Array.from({ length: 32 });
  const { t, lang } = useT();
  const [supported, setSupported] = useState<boolean>(true);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState<string>("");
  const [feedback, setFeedback] = useState<string>("");
  const [activePreset, setActivePreset] = useState<VoiceCommand | null>(null);
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const wantListeningRef = useRef(false);

  const triggerPreset = (preset: Preset, source: "voice" | "tap" = "tap") => {
    setFeedback(t(preset.feedbackKey));
    setActivePreset(preset.command);
    emitVoiceCommand(preset.command, source);
    window.setTimeout(() => {
      setFeedback("");
      setActivePreset(null);
    }, 2000);
  };

  useEffect(() => {
    if (typeof window === "undefined") return;
    const Ctor =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognitionLike }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognitionLike }).webkitSpeechRecognition;
    if (!Ctor) {
      setSupported(false);
      return;
    }
    const rec = new Ctor();
    rec.lang = lang === "ar" ? "ar-SA" : "en-US";
    rec.continuous = true;
    rec.interimResults = true;

    rec.onresult = (e) => {
      let interim = "";
      let finalText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const text = r[0].transcript;
        if (r.isFinal) finalText += text;
        else interim += text;
      }
      const combined = (finalText || interim).trim();
      if (combined) {
        setTranscript(combined);
        // Live caption: interim updates frequently; keep it sticky until next event
        emitCaption({ kind: "heard", text: combined, ttl: finalText ? 5000 : 0 });
      }
      const check = finalText || interim;
      // Greeting: "Hello" / "Hello Lumira" / "مرحبا" / "مرحبا لوميرا"
      if (check && /\b(hello|hi|hey)\b|مرحب[اًا]?|أهل[اًا]?|السلام عليكم/i.test(check)) {
        const reply = lang === "ar"
          ? "مرحباً بك في مرآتك الذكية، لوميرا. هل أنت مستعد للتصميم؟"
          : "Welcome to your smart mirror, Islam Ali. Ready to style?";
        setFeedback(reply);
        emitCaption({ kind: "spoken", text: reply, ttl: 6000 });
        try {
          const u = new SpeechSynthesisUtterance(reply);
          u.lang = lang === "ar" ? "ar-SA" : "en-US";
          window.speechSynthesis?.cancel();
          window.speechSynthesis?.speak(u);
        } catch { /* ignore */ }
        window.setTimeout(() => setFeedback(""), 4000);
        return;
      }
      const preset = check ? matchPreset(check) : null;
      if (preset) triggerPreset(preset, "voice");
    };

    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setError(t("voice.micDenied"));
        wantListeningRef.current = false;
        setListening(false);
      } else if (e.error === "no-speech" || e.error === "aborted") {
        // benign — onend will restart if we still want to listen
      } else {
        setError(e.error);
      }
    };

    rec.onend = () => {
      if (wantListeningRef.current) {
        try {
          rec.start();
        } catch {
          /* already started */
        }
      } else {
        setListening(false);
      }
    };

    recognitionRef.current = rec;
    return () => {
      wantListeningRef.current = false;
      try {
        rec.stop();
      } catch {
        /* noop */
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  const toggle = () => {
    const rec = recognitionRef.current;
    if (!rec) return;
    if (listening) {
      wantListeningRef.current = false;
      rec.stop();
      setListening(false);
    } else {
      setError(null);
      wantListeningRef.current = true;
      try {
        rec.start();
        setListening(true);
      } catch {
        setListening(true);
      }
    }
  };

  const statusLabel = !supported
    ? t("voice.notSupported")
    : error
      ? error
      : listening
        ? t("voice.listening")
        : t("voice.tapHint");

  return (
    <GlassPanel title={t("voice.title")} icon={<Mic className="h-3.5 w-3.5" />}>
      <div className="flex flex-col items-center gap-4">
        <button
          type="button"
          onClick={toggle}
          disabled={!supported}
          className="relative outline-none disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={listening ? t("voice.stopAria") : t("voice.startAria")}
          title={listening ? t("voice.stopAria") : t("voice.startAria")}
        >
          {listening && (
            <>
              <div className="absolute inset-0 animate-ring-rotate rounded-full border border-dashed border-primary/40" />
              <div className="absolute -inset-2 animate-pulse-glow rounded-full bg-primary/20 blur-xl" />
            </>
          )}
          <div
            className={`relative flex h-16 w-16 items-center justify-center rounded-full shadow-[var(--glow-primary)] transition ${
              listening
                ? "bg-gradient-to-br from-primary to-accent"
                : "bg-card/60 ring-1 ring-primary/30 hover:ring-primary/60"
            }`}
          >
            {listening ? (
              <Mic className="h-7 w-7 text-primary-foreground" />
            ) : (
              <MicOff className="h-7 w-7 text-primary/70" />
            )}
          </div>
        </button>

        <button
          type="button"
          onClick={toggle}
          disabled={!supported}
          className={`inline-flex items-center gap-2 rounded-full border px-5 py-2 text-xs uppercase tracking-[0.3em] transition disabled:cursor-not-allowed disabled:opacity-50 ${
            listening
              ? "border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20"
              : "border-primary/50 bg-gradient-to-r from-primary/20 to-accent/20 text-primary shadow-[var(--glow-soft)] hover:shadow-[var(--glow-primary)]"
          }`}
        >
          {listening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
          {listening ? t("voice.stop") : t("voice.listen")}
        </button>

        <div className="flex h-10 w-full items-center justify-center gap-1">
          {bars.map((_, i) => (
            <span
              key={i}
              className="w-1 rounded-full bg-gradient-to-t from-primary to-accent"
              style={{
                height: listening
                  ? `${(30 + Math.sin(i * 0.5) * 30 + 30).toFixed(2)}%`
                  : "12%",
                animation: listening
                  ? `voice-wave ${(0.6 + (i % 4) * 0.15).toFixed(2)}s ease-in-out ${(i * 0.05).toFixed(2)}s infinite`
                  : "none",
                boxShadow: listening ? "0 0 6px var(--primary)" : "none",
                opacity: listening ? 1 : 0.35,
                transition: "height 0.4s ease, opacity 0.4s ease",
              }}
            />
          ))}
        </div>

        <div className="text-center">
          <div
            className={`text-[10px] uppercase tracking-[0.3em] ${
              error ? "text-destructive/80" : "text-primary text-glow"
            }`}
          >
            {statusLabel}
          </div>
          <div className="mt-1 min-h-[16px] text-xs text-muted-foreground line-clamp-1">
            {feedback ? (
              <span className="text-accent">{feedback}</span>
            ) : transcript ? (
              <span className="italic">"{transcript}"</span>
            ) : (
              <>{t("voice.placeholder")}</>
            )}
          </div>
        </div>

        {/* Preset command chips */}
        <div className="w-full border-t border-primary/10 pt-3">
          <p className="mb-2 text-center text-[9px] uppercase tracking-[0.3em] text-muted-foreground/60">
            {t("voice.quickCommands")}
          </p>
          <div className="flex flex-wrap justify-center gap-1.5">
            {PRESETS.map((p) => {
              const Icon = p.icon;
              const isActive = activePreset === p.command;
              return (
                <button
                  key={p.command}
                  type="button"
                  onClick={() => triggerPreset(p)}
                  title={`"${t(p.phraseKey)}"`}
                  className={`group inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] transition ${
                    isActive
                      ? "border-accent bg-accent/20 text-accent shadow-[var(--glow-accent)]"
                      : "border-primary/20 bg-card/40 text-muted-foreground hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  <span className="tracking-wide">{t(p.labelKey)}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}
