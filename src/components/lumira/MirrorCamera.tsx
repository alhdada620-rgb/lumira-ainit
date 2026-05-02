import { Camera, CameraOff, Loader2, Sparkles, X, RotateCcw, Undo2, Redo2, Move, Maximize2, Magnet, Crosshair, Wand2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Slider } from "@/components/ui/slider";
import { GlassPanel } from "./GlassPanel";
import { useCamera } from "./camera-context";
import { onVoiceCommand, reportCommandResult } from "./voice-events";
import { useT } from "./i18n";

export function MirrorCamera() {
  const { t } = useT();
  const {
    stream, active, error, starting, start, stop,
    arOverlay, clearAROverlay,
    canUndoAR, canRedoAR, undoAR, redoAR,
    arHistoryLength, arHistoryIndex,
  } = useCamera();
  const videoRef = useRef<HTMLVideoElement>(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  // AR fine-tune: scale (50%-180%), offset X/Y (-40% .. +40% of frame)
  const [arScale, setArScale] = useState(100);
  const [arOffsetX, setArOffsetX] = useState(0);
  const [arOffsetY, setArOffsetY] = useState(0);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // Per-kind alignment presets (scale + offsetX/Y in % of frame)
  type Preset = { id: string; labelKey: string; scale: number; x: number; y: number };
  const presets = useMemo<Record<string, Preset[]>>(() => ({
    outfit: [
      { id: "fit-shoulders", labelKey: "mirror.ar.preset.shoulders", scale: 105, x: 0, y: -4 },
      { id: "fit-torso",     labelKey: "mirror.ar.preset.torso",     scale: 100, x: 0, y: 0 },
      { id: "fit-hips",      labelKey: "mirror.ar.preset.hips",      scale: 110, x: 0, y: 8 },
      { id: "fit-full",      labelKey: "mirror.ar.preset.full",      scale: 120, x: 0, y: 0 },
    ],
    lipstick: [
      { id: "lips-center", labelKey: "mirror.ar.preset.lipsCenter", scale: 100, x: 0,  y: 0 },
      { id: "lips-upper",  labelKey: "mirror.ar.preset.lipsUpper",  scale: 95,  x: 0,  y: -3 },
      { id: "lips-wide",   labelKey: "mirror.ar.preset.lipsWide",   scale: 115, x: 0,  y: 0 },
    ],
    blush: [
      { id: "cheeks-natural", labelKey: "mirror.ar.preset.cheeksNatural", scale: 100, x: 0, y: 0 },
      { id: "cheeks-high",    labelKey: "mirror.ar.preset.cheeksHigh",    scale: 95,  x: 0, y: -4 },
      { id: "cheeks-broad",   labelKey: "mirror.ar.preset.cheeksBroad",   scale: 115, x: 0, y: 2 },
    ],
    eyeliner: [
      { id: "eyes-natural", labelKey: "mirror.ar.preset.eyesNatural", scale: 100, x: 0, y: 0 },
      { id: "eyes-cat",     labelKey: "mirror.ar.preset.eyesCat",     scale: 110, x: 0, y: -2 },
      { id: "eyes-soft",    labelKey: "mirror.ar.preset.eyesSoft",    scale: 95,  x: 0, y: 1 },
    ],
  }), []);

  const currentPresets = arOverlay ? presets[arOverlay.kind] ?? [] : [];

  // Snap configuration: scale to nearest 5%, offsets to nearest 2% with a tight threshold
  const snap = (val: number, step: number, threshold = 1.25) => {
    const nearest = Math.round(val / step) * step;
    return Math.abs(val - nearest) <= threshold ? nearest : val;
  };
  const applyScale = (v: number) => {
    setActivePreset(null);
    setArScale(snapEnabled ? snap(v, 5) : v);
  };
  const applyOffsetX = (v: number) => {
    setActivePreset(null);
    setArOffsetX(snapEnabled ? snap(v, 2) : v);
  };
  const applyOffsetY = (v: number) => {
    setActivePreset(null);
    setArOffsetY(snapEnabled ? snap(v, 2) : v);
  };
  const applyPreset = (p: Preset) => {
    setArScale(p.scale);
    setArOffsetX(p.x);
    setArOffsetY(p.y);
    setActivePreset(p.id);
  };
  const resetTransform = () => {
    setArScale(100);
    setArOffsetX(0);
    setArOffsetY(0);
    setActivePreset(null);
  };

  // ===== Auto-Align: estimate feature position from the live feed =====
  const [autoAligning, setAutoAligning] = useState(false);
  const [autoAlignMsg, setAutoAlignMsg] = useState<string | null>(null);

  // Detect a face box (cx, cy, size) in normalized [0..1] coords. Falls back to
  // a luminance-based centroid (skin/face is usually the brightest cluster).
  const detectFeature = useCallback(async (
    video: HTMLVideoElement,
  ): Promise<{ cx: number; cy: number; size: number; source: "face" | "luma" } | null> => {
    const w = video.videoWidth;
    const h = video.videoHeight;
    if (!w || !h) return null;

    // Try the experimental FaceDetector API first (Chromium on Android, etc.)
    type FaceBox = { boundingBox: { x: number; y: number; width: number; height: number } };
    const FD = (globalThis as unknown as { FaceDetector?: new (opts?: unknown) => { detect: (src: CanvasImageSource) => Promise<FaceBox[]> } }).FaceDetector;
    if (FD) {
      try {
        const detector = new FD({ fastMode: true, maxDetectedFaces: 1 });
        const faces = await detector.detect(video);
        if (faces && faces.length > 0) {
          const b = faces[0].boundingBox;
          return {
            cx: (b.x + b.width / 2) / w,
            cy: (b.y + b.height / 2) / h,
            size: Math.max(b.width / w, b.height / h),
            source: "face",
          };
        }
      } catch {
        // ignore and fall through to luminance heuristic
      }
    }

    // Luminance/skin-tone centroid fallback. Downsample for speed.
    const sw = 80;
    const sh = Math.max(1, Math.round((h / w) * sw));
    const canvas = document.createElement("canvas");
    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    // Mirror the canvas because the video is rendered with scaleX(-1) — we
    // want the centroid to match the on-screen orientation.
    ctx.translate(sw, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, sw, sh);
    let img: ImageData;
    try {
      img = ctx.getImageData(0, 0, sw, sh);
    } catch {
      return null; // tainted canvas (cross-origin) — bail out
    }
    const d = img.data;
    let sx = 0, sy = 0, weight = 0, minX = sw, minY = sh, maxX = 0, maxY = 0;
    for (let y = 0; y < sh; y++) {
      for (let x = 0; x < sw; x++) {
        const i = (y * sw + x) * 4;
        const r = d[i], g = d[i + 1], b = d[i + 2];
        // Cheap skin-tone heuristic + brightness
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        const isSkin = r > 95 && g > 40 && b > 20 && r > g && r > b && (r - Math.min(g, b)) > 15;
        const w2 = isSkin ? lum * 1.5 : lum * 0.4;
        if (w2 > 80) {
          sx += x * w2;
          sy += y * w2;
          weight += w2;
          if (x < minX) minX = x; if (x > maxX) maxX = x;
          if (y < minY) minY = y; if (y > maxY) maxY = y;
        }
      }
    }
    if (weight <= 0) return null;
    const cx = sx / weight / sw;
    const cy = sy / weight / sh;
    const size = Math.max((maxX - minX) / sw, (maxY - minY) / sh);
    return { cx, cy, size, source: "luma" };
  }, []);

  // Pick the best preset given a detected feature center & size.
  const pickBestPreset = useCallback((
    feature: { cx: number; cy: number; size: number },
    list: Preset[],
  ): { preset: Preset; offsetX: number; offsetY: number; scale: number } | null => {
    if (!list.length) return null;
    // Convert detected center (0..1) into our offset space (-50..+50% of frame
    // around center). For an outfit/full-body overlay, anchor the top of the
    // overlay to roughly the shoulders (just below the face center).
    const dx = (feature.cx - 0.5) * 100;
    const dy = (feature.cy - 0.5) * 100;

    // Find the preset whose nominal (x, y) is closest to the detected offset.
    let best = list[0];
    let bestDist = Infinity;
    for (const p of list) {
      const d2 = (p.x - dx) ** 2 + (p.y - dy) ** 2;
      if (d2 < bestDist) { bestDist = d2; best = p; }
    }

    // Suggest a scale: face size hints at distance from camera. Keep within
    // the slider bounds and bias toward the preset's nominal scale.
    const sizeBoost = feature.size > 0 ? Math.min(1.6, Math.max(0.7, 1 / Math.max(0.18, feature.size) * 0.35)) : 1;
    const scale = Math.round(Math.max(50, Math.min(180, best.scale * sizeBoost)));

    // Clamp offsets so the overlay stays inside the slider range.
    const clamp = (n: number) => Math.max(-40, Math.min(40, Math.round(n)));
    return { preset: best, offsetX: clamp(dx), offsetY: clamp(dy), scale };
  }, []);

  const autoAlign = useCallback(async () => {
    const v = videoRef.current;
    if (!v || !active || !arOverlay) return;
    setAutoAligning(true);
    setAutoAlignMsg(null);
    try {
      const feature = await detectFeature(v);
      if (!feature) {
        setAutoAlignMsg(t("mirror.ar.autoAlign.noFace"));
        return;
      }
      const result = pickBestPreset(feature, currentPresets);
      if (!result) {
        setAutoAlignMsg(t("mirror.ar.autoAlign.noPreset"));
        return;
      }
      setArScale(result.scale);
      setArOffsetX(result.offsetX);
      setArOffsetY(result.offsetY);
      setActivePreset(result.preset.id);
      setAutoAlignMsg(
        t("mirror.ar.autoAlign.locked", {
          preset: t(result.preset.labelKey),
          source: feature.source === "face" ? t("mirror.ar.autoAlign.srcFace") : t("mirror.ar.autoAlign.srcLuma"),
        }),
      );
    } catch (e) {
      setAutoAlignMsg(e instanceof Error ? e.message : t("mirror.ar.autoAlign.error"));
    } finally {
      setAutoAligning(false);
    }
  }, [active, arOverlay, currentPresets, detectFeature, pickBestPreset, t]);

  // Clear the transient auto-align message after a few seconds
  useEffect(() => {
    if (!autoAlignMsg) return;
    const id = setTimeout(() => setAutoAlignMsg(null), 3500);
    return () => clearTimeout(id);
  }, [autoAlignMsg]);
  // Reset transform when overlay identity changes
  const overlayKey = arOverlay ? `${arOverlay.kind}:${arOverlay.id}` : null;
  useEffect(() => {
    setArScale(100);
    setArOffsetX(0);
    setArOffsetY(0);
    setActivePreset(null);
  }, [overlayKey]);

  const arTransform = `translate(${arOffsetX}%, ${arOffsetY}%) scale(${arScale / 100})`;

  // Voice / preset command integration
  useEffect(() => {
    return onVoiceCommand(async (cmd, source) => {
      if (cmd === "start-mirror") {
        if (activeRef.current) {
          reportCommandResult({
            command: cmd, source, status: "success", message: t("mirror.cmd.alreadyLive"),
          });
          return;
        }
        try {
          await start();
          if (activeRef.current) {
            reportCommandResult({ command: cmd, source, status: "success", message: t("mirror.cmd.activated") });
          } else {
            reportCommandResult({ command: cmd, source, status: "error", message: t("mirror.cmd.unavailable") });
          }
        } catch (e) {
          reportCommandResult({
            command: cmd, source, status: "error",
            message: e instanceof Error ? e.message : t("mirror.cmd.cameraError"),
          });
        }
      } else if (cmd === "stop-mirror") {
        if (!activeRef.current) {
          reportCommandResult({ command: cmd, source, status: "error", message: t("mirror.cmd.alreadyOff") });
          return;
        }
        stop();
        reportCommandResult({ command: cmd, source, status: "success", message: t("mirror.cmd.stopped") });
      }
    });
  }, [start, stop]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (stream) {
      v.srcObject = stream;
      v.play().catch(() => {});
    } else {
      v.srcObject = null;
    }
  }, [stream]);

  return (
    <GlassPanel title={t("mirror.title")} icon={<Camera className="h-3.5 w-3.5" />} className="lg:col-span-2">
      <div className="space-y-4">
        <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-primary/30 bg-background/40">
          {/* Soft glow ring */}
          <div className="pointer-events-none absolute -inset-px rounded-xl shadow-[var(--glow-primary)]" />
          {/* HUD grid */}
          <div className="absolute inset-0 hud-grid opacity-30" />

          {/* Video feed (mirrored + glow filter) */}
          <video
            ref={videoRef}
            playsInline
            muted
            className="absolute inset-0 h-full w-full object-cover"
            style={{
              transform: "scaleX(-1)",
              filter: "brightness(1.05) contrast(1.05) saturate(1.1) blur(0.3px) drop-shadow(0 0 18px var(--primary))",
              opacity: active ? 1 : 0,
              transition: "opacity 0.6s ease",
            }}
          />

          {/* Soft glow overlay */}
          {active && (
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse at center, transparent 55%, oklch(0.85 0.15 200 / 0.18) 100%)",
                mixBlendMode: "screen",
              }}
            />
          )}

          {/* Scan line when live */}
          {active && (
            <div className="pointer-events-none absolute inset-x-0 h-16 animate-scan bg-gradient-to-b from-transparent via-primary/25 to-transparent" />
          )}

          {/* Idle state */}
          {!active && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
              <div className="relative h-20 w-20">
                <div className="absolute inset-0 animate-ring-rotate rounded-full border border-dashed border-primary/40" />
                <div className="absolute inset-3 rounded-full bg-gradient-to-br from-primary/40 to-accent/40 shadow-[var(--glow-soft)]" />
                <Camera className="absolute inset-0 m-auto h-8 w-8 text-primary" />
              </div>
              <p className="text-[11px] uppercase tracking-[0.35em] text-muted-foreground">
                {t("mirror.standby")}
              </p>
              {error && <p className="text-xs text-destructive/80">{error}</p>}
            </div>
          )}

          {/* AR overlay (Smart Catalog placeholder filter) */}
          {arOverlay && active && (
            <>
              <div
                className="pointer-events-none absolute inset-0"
                style={{ transform: arTransform, transformOrigin: "center", transition: "transform 0.15s ease-out" }}
              >
                {arOverlay.kind === "outfit" ? (
                  <div
                    className="absolute inset-0 transition-opacity"
                    style={{
                      background: arOverlay.color,
                      opacity: 0.42,
                      mixBlendMode: "overlay",
                    }}
                  />
                ) : arOverlay.kind === "lipstick" ? (
                  <div
                    className="absolute left-1/2 top-[68%] h-[6%] w-[18%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[6px]"
                    style={{ background: arOverlay.color, opacity: 0.7, mixBlendMode: "multiply" }}
                  />
                ) : arOverlay.kind === "blush" ? (
                  <>
                    <div
                      className="absolute left-[28%] top-[58%] h-[14%] w-[18%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[14px]"
                      style={{ background: arOverlay.color, opacity: 0.55, mixBlendMode: "soft-light" }}
                    />
                    <div
                      className="absolute left-[72%] top-[58%] h-[14%] w-[18%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[14px]"
                      style={{ background: arOverlay.color, opacity: 0.55, mixBlendMode: "soft-light" }}
                    />
                  </>
                ) : (
                  <>
                    <div
                      className="absolute left-[35%] top-[44%] h-[1.5%] w-[14%] -translate-y-1/2 rounded-full"
                      style={{ background: arOverlay.color, opacity: 0.85 }}
                    />
                    <div
                      className="absolute right-[35%] top-[44%] h-[1.5%] w-[14%] -translate-y-1/2 rounded-full"
                      style={{ background: arOverlay.color, opacity: 0.85 }}
                    />
                  </>
                )}
              </div>

              {/* Overlay HUD label */}
              <div className="pointer-events-auto absolute bottom-3 left-3 right-3 flex items-end justify-between gap-2">
                <div className="rounded-md border border-accent/40 bg-background/60 px-2 py-1 backdrop-blur">
                  <div className="flex items-center gap-1 text-[9px] uppercase tracking-widest text-accent">
                    <Sparkles className="h-3 w-3" /> AR · {arOverlay.kind}
                  </div>
                  <div className="text-[11px] text-foreground text-glow-accent">{arOverlay.label}</div>
                  {arOverlay.sub && (
                    <div className="text-[9px] text-muted-foreground">{arOverlay.sub}</div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={clearAROverlay}
                  className="inline-flex items-center gap-1 rounded-full border border-destructive/40 bg-background/60 px-2 py-1 text-[9px] uppercase tracking-widest text-destructive backdrop-blur transition hover:bg-destructive/15"
                >
                  <X className="h-3 w-3" /> {t("mirror.ar.clear")}
                </button>
              </div>
            </>
          )}

          {/* Status badge */}
          <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full border border-primary/40 bg-background/50 px-2.5 py-1 text-[9px] uppercase tracking-widest backdrop-blur">
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                active ? "bg-emerald-400 shadow-[0_0_8px_oklch(0.7_0.2_150)]" : "bg-muted-foreground/50"
              }`}
            />
            <span className={active ? "text-primary" : "text-muted-foreground"}>
              {active ? t("mirror.live") : t("mirror.offline")}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            {active ? t("mirror.softGlow") : t("mirror.activate")}
          </p>
          {active ? (
            <button
              onClick={stop}
              className="inline-flex items-center gap-2 rounded-full border border-destructive/40 bg-destructive/10 px-4 py-2 text-xs uppercase tracking-widest text-destructive transition hover:bg-destructive/20"
            >
              <CameraOff className="h-3.5 w-3.5" /> {t("mirror.stopBtn")}
            </button>
          ) : (
            <button
              onClick={start}
              disabled={starting}
              className="inline-flex items-center gap-2 rounded-full border border-primary/50 bg-gradient-to-r from-primary/20 to-accent/20 px-5 py-2 text-xs uppercase tracking-widest text-primary shadow-[var(--glow-soft)] transition hover:shadow-[var(--glow-primary)] disabled:opacity-60"
            >
              {starting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
              {starting ? t("mirror.starting") : t("mirror.startBtn")}
            </button>
          )}
        </div>

        {/* AR fine-tune controls — visible while an overlay is active and camera live */}
        {arOverlay && active && (
          <div className="space-y-2 rounded-lg border border-primary/25 bg-primary/5 px-3 py-2.5 backdrop-blur">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.25em] text-primary">
                <Move className="h-3 w-3" /> {t("mirror.ar.fineTune")}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={autoAlign}
                  disabled={autoAligning}
                  title={t("mirror.ar.autoAlign.title")}
                  className="inline-flex items-center gap-1 rounded-full border border-accent/50 bg-gradient-to-r from-primary/20 to-accent/20 px-2.5 py-1 text-[9px] uppercase tracking-widest text-accent shadow-[var(--glow-soft)] transition hover:shadow-[var(--glow-primary)] disabled:opacity-60"
                >
                  {autoAligning ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                  {autoAligning ? t("mirror.ar.autoAlign.scanning") : t("mirror.ar.autoAlign.btn")}
                </button>
                <button
                  type="button"
                  onClick={() => setSnapEnabled((s) => !s)}
                  aria-pressed={snapEnabled}
                  title={t("mirror.ar.snapTitle")}
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[9px] uppercase tracking-widest transition ${
                    snapEnabled
                      ? "border-accent/50 bg-accent/15 text-accent shadow-[var(--glow-soft)]"
                      : "border-primary/30 bg-card/40 text-muted-foreground hover:bg-primary/10"
                  }`}
                >
                  <Magnet className="h-3 w-3" /> {snapEnabled ? t("mirror.ar.snapOn") : t("mirror.ar.snapOff")}
                </button>
                <button
                  type="button"
                  onClick={resetTransform}
                  className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-card/40 px-2 py-1 text-[9px] uppercase tracking-widest text-primary transition hover:bg-primary/10"
                >
                  <RotateCcw className="h-3 w-3" /> {t("mirror.ar.recenter")}
                </button>
              </div>
            </div>

            {autoAlignMsg && (
              <div className="rounded-md border border-accent/30 bg-accent/5 px-2 py-1 text-[10px] text-accent">
                {autoAlignMsg}
              </div>
            )}

            {/* Alignment presets */}
            {currentPresets.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 text-[9px] uppercase tracking-widest text-muted-foreground">
                  <Crosshair className="h-2.5 w-2.5" /> {t("mirror.ar.presets")}
                </span>
                {currentPresets.map((p) => {
                  const isActive = activePreset === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => applyPreset(p)}
                      className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wider transition ${
                        isActive
                          ? "border-accent/60 bg-accent/20 text-accent shadow-[var(--glow-soft)]"
                          : "border-primary/25 bg-card/40 text-foreground/80 hover:border-primary/50 hover:bg-primary/10"
                      }`}
                    >
                      {t(p.labelKey)}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <label className="space-y-1">
                <div className="flex items-center justify-between text-[9px] uppercase tracking-widest text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><Maximize2 className="h-2.5 w-2.5" /> {t("mirror.ar.scale")}</span>
                  <span className="text-foreground">{arScale}%</span>
                </div>
                <Slider value={[arScale]} min={50} max={180} step={1} onValueChange={(v) => applyScale(v[0] ?? 100)} />
              </label>

              <label className="space-y-1">
                <div className="flex items-center justify-between text-[9px] uppercase tracking-widest text-muted-foreground">
                  <span>{t("mirror.ar.offsetX")}</span>
                  <span className="text-foreground">{arOffsetX > 0 ? `+${arOffsetX}` : arOffsetX}%</span>
                </div>
                <Slider value={[arOffsetX]} min={-40} max={40} step={1} onValueChange={(v) => applyOffsetX(v[0] ?? 0)} />
              </label>

              <label className="space-y-1">
                <div className="flex items-center justify-between text-[9px] uppercase tracking-widest text-muted-foreground">
                  <span>{t("mirror.ar.offsetY")}</span>
                  <span className="text-foreground">{arOffsetY > 0 ? `+${arOffsetY}` : arOffsetY}%</span>
                </div>
                <Slider value={[arOffsetY]} min={-40} max={40} step={1} onValueChange={(v) => applyOffsetY(v[0] ?? 0)} />
              </label>
            </div>
          </div>
        )}

        {/* Persistent AR overlay status + history controls (visible even when camera is off) */}
        {(arOverlay || arHistoryLength > 0) && (
          <div className="flex flex-col gap-2 rounded-lg border border-accent/30 bg-accent/5 px-3 py-2 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-2">
              <span
                className="h-4 w-4 shrink-0 rounded-full border border-accent/40 shadow-[var(--glow-soft)]"
                style={{ background: arOverlay ? arOverlay.color : "transparent" }}
                aria-hidden
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1 text-[9px] uppercase tracking-widest text-accent">
                  <Sparkles className="h-3 w-3" />
                  {arOverlay ? t("mirror.ar.saved", { kind: arOverlay.kind }) : t("mirror.ar.cleared")}
                  {arHistoryLength > 0 && (
                    <span className="text-muted-foreground/70">
                      · {arHistoryIndex + 1}/{arHistoryLength}
                    </span>
                  )}
                </div>
                <div className="truncate text-[11px] text-foreground">
                  {arOverlay ? arOverlay.label : t("mirror.ar.noOverlay")}
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              {/* Undo */}
              <button
                type="button"
                onClick={undoAR}
                disabled={!canUndoAR}
                aria-label={t("mirror.ar.undo")}
                title={t("mirror.ar.undo")}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-primary/30 bg-card/40 text-primary transition hover:bg-primary/10 hover:shadow-[var(--glow-soft)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-card/40 disabled:hover:shadow-none"
              >
                <Undo2 className="h-3.5 w-3.5" />
              </button>

              {/* Redo */}
              <button
                type="button"
                onClick={redoAR}
                disabled={!canRedoAR}
                aria-label={t("mirror.ar.redo")}
                title={t("mirror.ar.redo")}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-primary/30 bg-card/40 text-primary transition hover:bg-primary/10 hover:shadow-[var(--glow-soft)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-card/40 disabled:hover:shadow-none"
              >
                <Redo2 className="h-3.5 w-3.5" />
              </button>

              {/* Reset (only when an overlay is active) */}
              {arOverlay && (
                <button
                  type="button"
                  onClick={clearAROverlay}
                  title={t("mirror.ar.resetTitle")}
                  className="ms-1 inline-flex shrink-0 items-center gap-1.5 rounded-full border border-destructive/40 bg-destructive/5 px-3 py-1.5 text-[10px] uppercase tracking-widest text-destructive transition hover:bg-destructive/15"
                >
                  <RotateCcw className="h-3 w-3" /> {t("mirror.ar.reset")}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </GlassPanel>
  );
}
