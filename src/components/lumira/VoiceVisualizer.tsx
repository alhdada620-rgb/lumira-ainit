import { Mic, MicOff } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { GlassPanel } from "./GlassPanel";
import { emitVoiceCommand } from "./voice-events";

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

const TRIGGER_PHRASES = [
  /lumira[, ]+analy[sz]e my skin/i,
  /analy[sz]e my skin/i,
  /lumira[, ]+skin (analysis|check|scan)/i,
];

function matchesTrigger(text: string): boolean {
  return TRIGGER_PHRASES.some((re) => re.test(text));
}

export function VoiceVisualizer() {
  const bars = Array.from({ length: 32 });
  const [supported, setSupported] = useState<boolean>(true);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState<string>("");
  const [feedback, setFeedback] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const wantListeningRef = useRef(false);

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
    rec.lang = "en-US";
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
      if (combined) setTranscript(combined);
      const check = (finalText || interim);
      if (check && matchesTrigger(check)) {
        setFeedback("Analyzing your skin…");
        emitVoiceCommand("analyze-skin");
        // Clear feedback after a moment
        window.setTimeout(() => setFeedback(""), 2500);
      }
    };

    rec.onerror = (e) => {
      if (e.error === "not-allowed" || e.error === "service-not-allowed") {
        setError("Microphone access denied");
        wantListeningRef.current = false;
        setListening(false);
      } else if (e.error === "no-speech" || e.error === "aborted") {
        // benign — onend will restart if we still want to listen
      } else {
        setError(e.error);
      }
    };

    rec.onend = () => {
      // Auto-restart while user wants to keep listening (Chrome stops periodically)
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
  }, []);

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
        // start() can throw if already running
        setListening(true);
      }
    }
  };

  const statusLabel = !supported
    ? "Not supported in this browser"
    : error
      ? error
      : listening
        ? "Listening…"
        : "Tap mic to activate";

  return (
    <GlassPanel title="Voice Assistant" icon={<Mic className="h-3.5 w-3.5" />}>
      <div className="flex flex-col items-center gap-4">
        <button
          type="button"
          onClick={toggle}
          disabled={!supported}
          className="relative outline-none disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={listening ? "Stop listening" : "Start listening"}
          title={listening ? "Stop listening" : "Start listening"}
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

        <div className="flex h-12 w-full items-center justify-center gap-1">
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
              <>Say "Lumira, analyze my skin"</>
            )}
          </div>
        </div>
      </div>
    </GlassPanel>
  );
}
