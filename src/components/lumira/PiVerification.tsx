import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Loader2, ExternalLink, RefreshCw } from "lucide-react";

const EXPECTED_KEY =
  "f51bf3dbe299a0b14c34f9600f4da97c80967509828e08f6cb9358c4e6f2c5dd71917a163a4cb882482fa0afb195abd842775e25c5ed5bcbef3a9bf92bf9c81c";

type Status = "idle" | "checking" | "ok" | "mismatch" | "error";

export function PiVerification() {
  const [mounted, setMounted] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [httpCode, setHttpCode] = useState<number | null>(null);
  const [detail, setDetail] = useState<string>("");
  const [lastCheckedAt, setLastCheckedAt] = useState<string>("");

  const runCheck = async () => {
    setStatus("checking");
    setDetail("");
    setHttpCode(null);
    try {
      const res = await fetch("/validation-key.txt", { cache: "no-store" });
      setHttpCode(res.status);
      if (!res.ok) {
        setStatus("error");
        setDetail(`HTTP ${res.status} ${res.statusText || ""}`.trim());
        setLastCheckedAt(new Date().toLocaleTimeString());
        return;
      }
      const text = (await res.text()).trim();
      if (text === EXPECTED_KEY) {
        setStatus("ok");
        setDetail(`HTTP ${res.status} · key matches (${text.length} chars)`);
      } else {
        setStatus("mismatch");
        setDetail(
          `HTTP ${res.status} · got ${text.slice(0, 12)}… (${text.length} chars)`,
        );
      }
      setLastCheckedAt(new Date().toLocaleTimeString());
    } catch (e) {
      setStatus("error");
      setDetail(e instanceof Error ? e.message : "Network error");
      setLastCheckedAt(new Date().toLocaleTimeString());
    }
  };

  useEffect(() => {
    setMounted(true);
    runCheck();
  }, []);

  if (!mounted) {
    // Avoid SSR/CSR hydration mismatch from dynamic time strings
    return null;
  }

  const Icon =
    status === "ok"
      ? CheckCircle2
      : status === "checking" || status === "idle"
      ? Loader2
      : XCircle;

  const tone =
    status === "ok"
      ? "text-emerald-400 border-emerald-400/30"
      : status === "checking" || status === "idle"
      ? "text-muted-foreground border-primary/20"
      : "text-destructive border-destructive/40";

  const label =
    status === "ok"
      ? "Verified"
      : status === "checking" || status === "idle"
      ? "Checking…"
      : status === "mismatch"
      ? "Mismatch"
      : "Unreachable";

  return (
    <div className="mt-6 flex flex-col items-center gap-2">
      <div
        className={`flex flex-wrap items-center justify-center gap-2 rounded-full border ${tone} bg-card/40 px-4 py-2 backdrop-blur`}
      >
        <Icon
          className={`h-3.5 w-3.5 ${status === "checking" ? "animate-spin" : ""}`}
        />
        <span className="text-[10px] uppercase tracking-[0.25em]">
          Pi Verification: {label}
        </span>
        {httpCode !== null && (
          <span className="rounded-full border border-current/40 px-2 py-0.5 text-[9px] font-medium tracking-widest">
            HTTP {httpCode}
          </span>
        )}
        {detail && (
          <span className="text-[10px] tracking-wider text-muted-foreground/70">
            · {detail}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={runCheck}
          disabled={status === "checking"}
          className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-[10px] uppercase tracking-[0.25em] text-primary transition hover:bg-primary/20 disabled:opacity-50"
        >
          <RefreshCw
            className={`h-3 w-3 ${status === "checking" ? "animate-spin" : ""}`}
          />
          Recheck Pi Domain
        </button>
        <a
          href="/validation-key.txt"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.25em] text-muted-foreground hover:text-foreground"
        >
          Open file <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {lastCheckedAt && (
        <span className="text-[9px] tracking-[0.3em] text-muted-foreground/60">
          Last checked {lastCheckedAt}
        </span>
      )}
    </div>
  );
}
