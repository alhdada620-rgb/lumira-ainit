import * as React from "react";

type LogEntry = {
  id: number;
  type: "error" | "warn" | "info";
  message: string;
  time: string;
};

declare global {
  interface Window {
    Pi?: {
      init?: (opts: { version: string; sandbox?: boolean }) => void;
      authenticate?: (...args: unknown[]) => Promise<unknown>;
    };
  }
}

const MAX_LOGS = 30;

export function PiDebugOverlay() {
  const [open, setOpen] = React.useState(false);
  const [logs, setLogs] = React.useState<LogEntry[]>([]);
  const [sdkReady, setSdkReady] = React.useState(false);
  const [initialized, setInitialized] = React.useState(false);
  const idRef = React.useRef(0);

  const push = React.useCallback(
    (type: LogEntry["type"], message: string) => {
      setLogs((prev) => {
        const next: LogEntry = {
          id: ++idRef.current,
          type,
          message,
          time: new Date().toLocaleTimeString(),
        };
        return [next, ...prev].slice(0, MAX_LOGS);
      });
    },
    [],
  );

  // Detect Pi SDK availability and try init
  React.useEffect(() => {
    let cancelled = false;
    const check = () => {
      if (cancelled) return;
      if (typeof window !== "undefined" && window.Pi) {
        setSdkReady(true);
        try {
          window.Pi.init?.({ version: "2.0", sandbox: true });
          setInitialized(true);
          push("info", "Pi.init({ version: '2.0', sandbox: true }) OK");
        } catch (e) {
          push("error", `Pi.init failed: ${(e as Error).message}`);
        }
        return;
      }
      setTimeout(check, 500);
    };
    check();
    return () => {
      cancelled = true;
    };
  }, [push]);

  // Capture runtime errors
  React.useEffect(() => {
    const onError = (e: ErrorEvent) => {
      push("error", `${e.message} @ ${e.filename}:${e.lineno}`);
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      const reason = e.reason;
      const msg = reason instanceof Error ? reason.message : String(reason);
      push("error", `Unhandled rejection: ${msg}`);
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);

    // Patch console.error / warn
    const origErr = console.error;
    const origWarn = console.warn;
    console.error = (...args: unknown[]) => {
      push("error", args.map((a) => (a instanceof Error ? a.message : String(a))).join(" "));
      origErr(...args);
    };
    console.warn = (...args: unknown[]) => {
      push("warn", args.map(String).join(" "));
      origWarn(...args);
    };

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
      console.error = origErr;
      console.warn = origWarn;
    };
  }, [push]);

  const ua = typeof navigator !== "undefined" ? navigator.userAgent : "";
  const isPiBrowser = /PiBrowser/i.test(ua);
  const errorCount = logs.filter((l) => l.type === "error").length;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 12,
        right: 12,
        zIndex: 2147483647,
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: 12,
        color: "#fff",
      }}
    >
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            background: errorCount > 0 ? "#dc2626" : sdkReady ? "#059669" : "#475569",
            color: "#fff",
            border: 0,
            borderRadius: 999,
            padding: "8px 12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            cursor: "pointer",
          }}
        >
          π {sdkReady ? "ready" : "…"} {errorCount > 0 ? `· ${errorCount} err` : ""}
        </button>
      ) : (
        <div
          style={{
            width: 320,
            maxWidth: "92vw",
            maxHeight: "70vh",
            background: "rgba(15,23,42,0.96)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 10,
            display: "flex",
            flexDirection: "column",
            backdropFilter: "blur(8px)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "8px 10px",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <strong>Pi Debug</strong>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                type="button"
                onClick={() => setLogs([])}
                style={{ background: "transparent", color: "#94a3b8", border: 0, cursor: "pointer" }}
              >
                clear
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{ background: "transparent", color: "#94a3b8", border: 0, cursor: "pointer" }}
              >
                ✕
              </button>
            </div>
          </div>
          <div style={{ padding: "8px 10px", borderBottom: "1px solid rgba(255,255,255,0.08)", lineHeight: 1.5 }}>
            <div>SDK loaded: <span style={{ color: sdkReady ? "#34d399" : "#fbbf24" }}>{String(sdkReady)}</span></div>
            <div>Initialized: <span style={{ color: initialized ? "#34d399" : "#fbbf24" }}>{String(initialized)}</span></div>
            <div>Pi Browser: <span style={{ color: isPiBrowser ? "#34d399" : "#94a3b8" }}>{String(isPiBrowser)}</span></div>
            <div style={{ color: "#94a3b8", wordBreak: "break-all" }}>UA: {ua.slice(0, 80)}{ua.length > 80 ? "…" : ""}</div>
          </div>
          <div style={{ overflowY: "auto", padding: "4px 0" }}>
            {logs.length === 0 ? (
              <div style={{ padding: 10, color: "#94a3b8" }}>No logs yet.</div>
            ) : (
              logs.map((l) => (
                <div
                  key={l.id}
                  style={{
                    padding: "4px 10px",
                    borderBottom: "1px solid rgba(255,255,255,0.04)",
                    color:
                      l.type === "error" ? "#fca5a5" : l.type === "warn" ? "#fcd34d" : "#cbd5e1",
                    wordBreak: "break-word",
                  }}
                >
                  <span style={{ color: "#64748b", marginRight: 6 }}>{l.time}</span>
                  [{l.type}] {l.message}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
