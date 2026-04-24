import { createContext, useCallback, useContext, useEffect, useRef, useState, ReactNode } from "react";

export type AROverlayKind = "outfit" | "lipstick" | "eyeliner" | "blush";

export interface AROverlay {
  /** Source identifier (e.g. catalog item id) */
  id: string;
  kind: AROverlayKind;
  /** Display label shown on the mirror HUD */
  label: string;
  /** CSS color or gradient string used to render the placeholder filter */
  color: string;
  /** Brand or category sub-label */
  sub?: string;
  ts: number;
}

interface CameraContextValue {
  stream: MediaStream | null;
  active: boolean;
  error: string | null;
  starting: boolean;
  start: () => Promise<void>;
  stop: () => void;
  /** Currently applied AR filter on the mirror feed (null = no overlay) */
  arOverlay: AROverlay | null;
  setAROverlay: (overlay: Omit<AROverlay, "ts"> | null) => void;
  clearAROverlay: () => void;
}

const CameraContext = createContext<CameraContextValue | null>(null);

export function CameraProvider({ children }: { children: ReactNode }) {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [arOverlay, setAROverlayState] = useState<AROverlay | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setStream(null);
  }, []);

  const start = useCallback(async () => {
    if (streamRef.current) return;
    setError(null);
    setStarting(true);
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = s;
      setStream(s);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Camera unavailable";
      setError(msg.includes("Permission") || msg.includes("denied") ? "Camera access denied" : msg);
    } finally {
      setStarting(false);
    }
  }, []);

  const setAROverlay = useCallback((overlay: Omit<AROverlay, "ts"> | null) => {
    setAROverlayState(overlay ? { ...overlay, ts: Date.now() } : null);
  }, []);

  const clearAROverlay = useCallback(() => setAROverlayState(null), []);

  useEffect(() => () => stop(), [stop]);

  return (
    <CameraContext.Provider
      value={{
        stream,
        active: !!stream,
        error,
        starting,
        start,
        stop,
        arOverlay,
        setAROverlay,
        clearAROverlay,
      }}
    >
      {children}
    </CameraContext.Provider>
  );
}

export function useCamera() {
  const ctx = useContext(CameraContext);
  if (!ctx) throw new Error("useCamera must be used within CameraProvider");
  return ctx;
}
