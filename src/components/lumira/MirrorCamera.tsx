import { Camera, CameraOff, Loader2, Sparkles, X, RotateCcw, Undo2, Redo2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { GlassPanel } from "./GlassPanel";
import { useCamera } from "./camera-context";
import { onVoiceCommand, reportCommandResult } from "./voice-events";

export function MirrorCamera() {
  const {
    stream, active, error, starting, start, stop,
    arOverlay, clearAROverlay,
    canUndoAR, canRedoAR, undoAR, redoAR,
    arHistoryLength, arHistoryIndex,
  } = useCamera();
  const videoRef = useRef<HTMLVideoElement>(null);
  const activeRef = useRef(active);
  activeRef.current = active;

  // Voice / preset command integration
  useEffect(() => {
    return onVoiceCommand(async (cmd, source) => {
      if (cmd === "start-mirror") {
        if (activeRef.current) {
          reportCommandResult({
            command: cmd, source, status: "success", message: "Mirror already live",
          });
          return;
        }
        try {
          await start();
          // start() swallows errors into context state; check after
          if (activeRef.current) {
            reportCommandResult({ command: cmd, source, status: "success", message: "Front camera activated" });
          } else {
            reportCommandResult({ command: cmd, source, status: "error", message: "Camera unavailable" });
          }
        } catch (e) {
          reportCommandResult({
            command: cmd, source, status: "error",
            message: e instanceof Error ? e.message : "Camera error",
          });
        }
      } else if (cmd === "stop-mirror") {
        if (!activeRef.current) {
          reportCommandResult({ command: cmd, source, status: "error", message: "Mirror is already off" });
          return;
        }
        stop();
        reportCommandResult({ command: cmd, source, status: "success", message: "Mirror stopped" });
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
    <GlassPanel title="Smart Mirror · Live" icon={<Camera className="h-3.5 w-3.5" />} className="lg:col-span-2">
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
                Mirror standby
              </p>
              {error && <p className="text-xs text-destructive/80">{error}</p>}
            </div>
          )}

          {/* AR overlay (Smart Catalog placeholder filter) */}
          {arOverlay && active && (
            <>
              {arOverlay.kind === "outfit" ? (
                <div
                  className="pointer-events-none absolute inset-0 transition-opacity"
                  style={{
                    background: arOverlay.color,
                    opacity: 0.42,
                    mixBlendMode: "overlay",
                  }}
                />
              ) : arOverlay.kind === "lipstick" ? (
                <div
                  className="pointer-events-none absolute left-1/2 top-[68%] h-[6%] w-[18%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[6px]"
                  style={{ background: arOverlay.color, opacity: 0.7, mixBlendMode: "multiply" }}
                />
              ) : arOverlay.kind === "blush" ? (
                <>
                  <div
                    className="pointer-events-none absolute left-[28%] top-[58%] h-[14%] w-[18%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[14px]"
                    style={{ background: arOverlay.color, opacity: 0.55, mixBlendMode: "soft-light" }}
                  />
                  <div
                    className="pointer-events-none absolute left-[72%] top-[58%] h-[14%] w-[18%] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[14px]"
                    style={{ background: arOverlay.color, opacity: 0.55, mixBlendMode: "soft-light" }}
                  />
                </>
              ) : (
                <>
                  <div
                    className="pointer-events-none absolute left-[35%] top-[44%] h-[1.5%] w-[14%] -translate-y-1/2 rounded-full"
                    style={{ background: arOverlay.color, opacity: 0.85 }}
                  />
                  <div
                    className="pointer-events-none absolute right-[35%] top-[44%] h-[1.5%] w-[14%] -translate-y-1/2 rounded-full"
                    style={{ background: arOverlay.color, opacity: 0.85 }}
                  />
                </>
              )}

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
                  <X className="h-3 w-3" /> Clear
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
              {active ? "Live Feed" : "Offline"}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3">
          <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
            {active ? "Soft glow filter · enhanced" : "Activate the front camera"}
          </p>
          {active ? (
            <button
              onClick={stop}
              className="inline-flex items-center gap-2 rounded-full border border-destructive/40 bg-destructive/10 px-4 py-2 text-xs uppercase tracking-widest text-destructive transition hover:bg-destructive/20"
            >
              <CameraOff className="h-3.5 w-3.5" /> Stop Mirror
            </button>
          ) : (
            <button
              onClick={start}
              disabled={starting}
              className="inline-flex items-center gap-2 rounded-full border border-primary/50 bg-gradient-to-r from-primary/20 to-accent/20 px-5 py-2 text-xs uppercase tracking-widest text-primary shadow-[var(--glow-soft)] transition hover:shadow-[var(--glow-primary)] disabled:opacity-60"
            >
              {starting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
              {starting ? "Starting…" : "Start Mirror"}
            </button>
          )}
        </div>

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
                  {arOverlay ? `AR Saved · ${arOverlay.kind}` : "AR Cleared"}
                  {arHistoryLength > 0 && (
                    <span className="text-muted-foreground/70">
                      · {arHistoryIndex + 1}/{arHistoryLength}
                    </span>
                  )}
                </div>
                <div className="truncate text-[11px] text-foreground">
                  {arOverlay ? arOverlay.label : "No overlay applied"}
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              {/* Undo */}
              <button
                type="button"
                onClick={undoAR}
                disabled={!canUndoAR}
                aria-label="Undo AR overlay change"
                title="Undo AR overlay change"
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-primary/30 bg-card/40 text-primary transition hover:bg-primary/10 hover:shadow-[var(--glow-soft)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-card/40 disabled:hover:shadow-none"
              >
                <Undo2 className="h-3.5 w-3.5" />
              </button>

              {/* Redo */}
              <button
                type="button"
                onClick={redoAR}
                disabled={!canRedoAR}
                aria-label="Redo AR overlay change"
                title="Redo AR overlay change"
                className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-primary/30 bg-card/40 text-primary transition hover:bg-primary/10 hover:shadow-[var(--glow-soft)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-card/40 disabled:hover:shadow-none"
              >
                <Redo2 className="h-3.5 w-3.5" />
              </button>

              {/* Reset (only when an overlay is active) */}
              {arOverlay && (
                <button
                  type="button"
                  onClick={clearAROverlay}
                  title="Reset AR overlay (adds to history — undo to restore)"
                  className="ml-1 inline-flex shrink-0 items-center gap-1.5 rounded-full border border-destructive/40 bg-destructive/5 px-3 py-1.5 text-[10px] uppercase tracking-widest text-destructive transition hover:bg-destructive/15"
                >
                  <RotateCcw className="h-3 w-3" /> Reset
                </button>
              )}
            </div>
          </div>
        )}
        )}
      </div>
    </GlassPanel>
  );
}
