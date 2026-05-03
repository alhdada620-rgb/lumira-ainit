import { Sparkles, Play, RotateCcw, CheckCircle2, Save, History, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { GlassPanel } from "./GlassPanel";
import { useT } from "./i18n";
import { useSkin } from "./skin-context";
import skinScan from "@/assets/skin-scan.jpg";

type ScanRecord = {
  id: string;
  hydration: number;
  smoothness: number;
  tone: number;
  timestamp: number;
};

const SCAN_STORAGE_KEY = "lumira.skinScans.v1";

function loadScans(): ScanRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(SCAN_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveScans(scans: ScanRecord[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SCAN_STORAGE_KEY, JSON.stringify(scans));
  } catch {
    /* ignore quota errors */
  }
}

function jitter(base: number, range = 3, min = 0, max = 100) {
  const v = base + (Math.random() - 0.5) * range * 2;
  return Math.max(min, Math.min(max, v));
}

function Ring({
  value,
  color,
  label,
  active,
}: {
  value: number;
  color: string;
  label: string;
  active: boolean;
}) {
  const radius = 32;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (value / 100) * circ;
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="relative">
        <svg width="78" height="78" viewBox="0 0 78 78">
          <circle
            cx="39"
            cy="39"
            r={radius}
            stroke="oklch(1 0 0 / 0.08)"
            strokeWidth="5"
            fill="none"
          />
          <circle
            cx="39"
            cy="39"
            r={radius}
            stroke={color}
            strokeWidth="5"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            transform="rotate(-90 39 39)"
            style={{
              filter: `drop-shadow(0 0 8px ${color})`,
              transition: "stroke-dashoffset 1s ease",
              opacity: active ? 1 : 0.55,
            }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-light tabular-nums text-foreground text-glow">
            {value}
          </span>
        </div>
      </div>
      <span className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground">
        {label}
      </span>
    </div>
  );
}

export function HealthSkinAI() {
  const { lang } = useT();
  const isAr = lang === "ar";

  const [hydration, setHydration] = useState(87);
  const [smoothness, setSmoothness] = useState(92);
  const [tone, setTone] = useState(78);
  const [scanPct, setScanPct] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [scanComplete, setScanComplete] = useState(false);
  const [scans, setScans] = useState<ScanRecord[]>(() => loadScans());
  const [showHistory, setShowHistory] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { setSkinProfile } = useSkin();

  // Push the latest completed scan into the shared skin profile so other
  // modules (e.g. Virtual Try-On) can react to tone/hydration/smoothness.
  useEffect(() => {
    if (scanComplete) {
      setSkinProfile({ hydration, smoothness, tone });
    }
  }, [scanComplete, hydration, smoothness, tone, setSkinProfile]);

  useEffect(() => {
    saveScans(scans);
  }, [scans]);

  const saveScan = () => {
    const rec: ScanRecord = {
      id: (typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`),
      hydration,
      smoothness,
      tone,
      timestamp: Date.now(),
    };
    setScans((prev) => [rec, ...prev].slice(0, 50));
    setSavedId(rec.id);
    setTimeout(() => setSavedId((id) => (id === rec.id ? null : id)), 1800);
  };

  const deleteScan = (id: string) => {
    setScans((prev) => prev.filter((s) => s.id !== id));
  };

  const clearScans = () => setScans([]);

  const stopScan = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setScanning(false);
  };

  const completeScan = () => {
    stopScan();
    setScanPct(100);
    setScanComplete(true);
  };

  const startScan = () => {
    if (scanning) {
      stopScan();
      return;
    }
    setScanning(true);
    setScanComplete(false);
    setScanPct(0);
    intervalRef.current = setInterval(() => {
      setHydration((v) => Math.round(jitter(v, 2, 78, 95)));
      setSmoothness((v) => Math.round(jitter(v, 2, 82, 97)));
      setTone((v) => Math.round(jitter(v, 2, 70, 88)));
      setScanPct((v) => {
        const next = +Math.min(100, v + Math.random() * 6 + 2).toFixed(1);
        if (next >= 100) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setScanning(false);
          setScanComplete(true);
          return 100;
        }
        return next;
      });
    }, 350);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <GlassPanel
      title={isAr ? "تحليل البشرة بالذكاء" : "AI Skin Analysis"}
      icon={<Sparkles className="h-3.5 w-3.5" />}
    >
      <div className="-mt-1 mb-3 text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
        {isAr ? "فحص جلدي · v3.2" : "Dermal scan · v3.2"}
      </div>

      <div className="grid grid-cols-[1fr_auto] gap-4">
        {/* Scan image */}
        <div className="relative overflow-hidden rounded-2xl border border-primary/30 shadow-[0_0_24px_oklch(0.85_0.15_200/0.25)_inset]">
          <img
            src={skinScan}
            alt={isAr ? "تصوير تحليل البشرة" : "Skin analysis scan"}
            width={768}
            height={1024}
            loading="lazy"
            className="h-56 w-full object-cover opacity-90"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
          {/* scan line — only while scanning */}
          {scanning && (
            <div
              className="pointer-events-none absolute inset-x-0 h-px bg-primary/80"
              style={{
                top: "50%",
                boxShadow: "0 0 14px var(--primary)",
                animation: "scan-line 3.6s linear infinite",
              }}
            />
          )}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[10px] uppercase tracking-widest">
            <span
              className={`text-glow ${
                scanning
                  ? "text-primary"
                  : scanComplete
                  ? "text-accent"
                  : "text-muted-foreground"
              }`}
            >
              {scanning
                ? isAr ? "جارٍ الفحص..." : "Scanning..."
                : scanComplete
                ? isAr ? "اكتمل الفحص" : "Scan complete"
                : isAr ? "في وضع الاستعداد" : "Idle"}
            </span>
            <span className="text-accent tabular-nums">{scanPct.toFixed(1)}%</span>
          </div>
        </div>

        {/* Rings */}
        <div className="flex flex-col items-center justify-between gap-2 py-1">
          <Ring value={hydration} color="oklch(0.82 0.14 195)" label={isAr ? "ترطيب" : "Hydration"} active={scanning || scanComplete} />
          <Ring value={smoothness} color="oklch(0.85 0.15 165)" label={isAr ? "نعومة" : "Smoothness"} active={scanning || scanComplete} />
          <Ring value={tone} color="oklch(0.78 0.12 15)" label={isAr ? "تجانس اللون" : "Tone Evenness"} active={scanning || scanComplete} />
        </div>
      </div>

      {/* Live scanning meters — react in real time while scan is running */}
      <div className="mt-3 space-y-1.5">
        {[
          { label: isAr ? "ترطيب" : "Hydration", value: hydration, color: "oklch(0.82 0.14 195)" },
          { label: isAr ? "نعومة" : "Smoothness", value: smoothness, color: "oklch(0.85 0.15 165)" },
          { label: isAr ? "تجانس اللون" : "Tone", value: tone, color: "oklch(0.78 0.12 15)" },
        ].map((m) => (
          <div key={m.label} className="space-y-0.5">
            <div className="flex items-center justify-between text-[8px] uppercase tracking-[0.25em] text-muted-foreground">
              <span>{m.label}</span>
              <span className="tabular-nums text-foreground/80">{m.value}</span>
            </div>
            <div className="relative h-1 overflow-hidden rounded-full bg-muted/30">
              <div
                className="h-full rounded-full transition-[width] duration-300 ease-out"
                style={{
                  width: `${m.value}%`,
                  background: `linear-gradient(90deg, ${m.color}, oklch(0.95 0.06 200))`,
                  boxShadow: scanning ? `0 0 8px ${m.color}` : undefined,
                }}
              />
              {scanning && (
                <div
                  className="pointer-events-none absolute inset-y-0 w-1/3"
                  style={{
                    background: "linear-gradient(90deg, transparent, oklch(1 0 0 / 0.45), transparent)",
                    animation: "fit-shimmer 1.4s ease-in-out infinite",
                  }}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Start / Stop / Restart scan button */}
      <button
        onClick={scanning ? completeScan : startScan}
        aria-pressed={scanning}
        className={`mt-3 flex w-full items-center justify-center gap-2 rounded-xl border py-2 text-[10px] uppercase tracking-[0.3em] transition-all ${
          scanning
            ? "border-destructive/40 bg-destructive/10 text-destructive hover:bg-destructive/20"
            : scanComplete
            ? "border-accent/40 bg-accent/10 text-accent hover:bg-accent/20"
            : "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 hover:shadow-[var(--glow-soft)]"
        }`}
      >
        {scanning ? (
          <CheckCircle2 className="h-3 w-3" />
        ) : scanComplete ? (
          <RotateCcw className="h-3 w-3" />
        ) : (
          <Play className="h-3 w-3" />
        )}
        {scanning
          ? isAr ? "إنهاء الفحص" : "Finish scan"
          : scanComplete
          ? isAr ? "بدء فحص جديد" : "Start new scan"
          : isAr ? "بدء فحص البشرة" : "Start skin scan"}
      </button>

      {/* Save + History controls */}
      <div className="mt-2 grid grid-cols-2 gap-2">
        <button
          onClick={saveScan}
          disabled={!scanComplete}
          className={`flex items-center justify-center gap-1.5 rounded-xl border py-2 text-[10px] uppercase tracking-[0.3em] transition-all ${
            scanComplete
              ? savedId
                ? "border-accent/50 bg-accent/15 text-accent"
                : "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
              : "cursor-not-allowed border-border/40 bg-muted/10 text-muted-foreground/60"
          }`}
        >
          {savedId ? <CheckCircle2 className="h-3 w-3" /> : <Save className="h-3 w-3" />}
          {savedId
            ? isAr ? "تم الحفظ" : "Saved"
            : isAr ? "حفظ النتيجة" : "Save result"}
        </button>
        <button
          onClick={() => setShowHistory((s) => !s)}
          className="flex items-center justify-center gap-1.5 rounded-xl border border-border/40 bg-card/40 py-2 text-[10px] uppercase tracking-[0.3em] text-muted-foreground transition-all hover:border-primary/40 hover:text-primary"
        >
          <History className="h-3 w-3" />
          {showHistory
            ? isAr ? "إخفاء السجل" : "Hide history"
            : `${isAr ? "السجل" : "History"} (${scans.length})`}
        </button>
      </div>

      {showHistory && (
        <div className="mt-2 rounded-xl border border-primary/20 bg-card/60 p-2">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-[9px] uppercase tracking-[0.3em] text-muted-foreground">
              {isAr ? "نتائج محفوظة" : "Saved scans"}
            </span>
            {scans.length > 0 && (
              <button
                onClick={clearScans}
                className="text-[9px] uppercase tracking-[0.25em] text-destructive/80 hover:text-destructive"
              >
                {isAr ? "مسح الكل" : "Clear all"}
              </button>
            )}
          </div>
          {scans.length === 0 ? (
            <p className="py-3 text-center text-[10px] text-muted-foreground">
              {isAr ? "لا توجد نتائج بعد" : "No saved scans yet"}
            </p>
          ) : (
            <ul className="max-h-40 space-y-1 overflow-y-auto pr-1">
              {scans.map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border/30 bg-background/30 px-2 py-1.5"
                >
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase tracking-widest text-muted-foreground">
                      {new Date(s.timestamp).toLocaleString(isAr ? "ar" : undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <span className="text-[10px] tabular-nums text-foreground/85">
                      {isAr ? "ترطيب" : "Hyd"} {s.hydration} ·{" "}
                      {isAr ? "نعومة" : "Smt"} {s.smoothness} ·{" "}
                      {isAr ? "لون" : "Tone"} {s.tone}
                    </span>
                  </div>
                  <button
                    onClick={() => deleteScan(s.id)}
                    aria-label="Delete scan"
                    className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="mt-3 rounded-xl border border-accent/30 bg-accent/5 p-3">
        <p className="text-xs text-foreground/85">
          <span className="font-semibold text-accent">
            {isAr ? "توصية:" : "Recommendation:"}
          </span>{" "}
          {isAr
            ? "ضع سيروم حمض الهيالورونيك الليلة. التعرض للأشعة منخفض."
            : "Apply hyaluronic serum tonight. UV exposure low."}
        </p>
      </div>
    </GlassPanel>
  );
}
