import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Loader2, ExternalLink } from "lucide-react";

const EXPECTED_KEY =
  "f51bf3dbe299a0b14c34f9600f4da97c80967509828e08f6cb9358c4e6f2c5dd71917a163a4cb882482fa0afb195abd842775e25c5ed5bcbef3a9bf92bf9c81c";

type Status = "idle" | "checking" | "ok" | "mismatch" | "error";

export function PiVerification() {
  const [status, setStatus] = useState<Status>("idle");
  const [detail, setDetail] = useState<string>("");

  const runCheck = async () => {
    setStatus("checking");
    setDetail("");
    try {
      const res = await fetch("/validation-key.txt", { cache: "no-store" });
      if (!res.ok) {
        setStatus("error");
        setDetail(`HTTP ${res.status}`);
        return;
      }
      const text = (await res.text()).trim();
      if (text === EXPECTED_KEY) {
        setStatus("ok");
        setDetail("Key matches exactly");
      } else {
        setStatus("mismatch");
        setDetail(`Got ${text.slice(0, 12)}… (length ${text.length})`);
      }
    } catch (e) {
      setStatus("error");
      setDetail(e instanceof Error ? e.message : "Network error");
    }
  };

  useEffect(() => {
    runCheck();
  }, []);

  const Icon =
    status === "ok"
      ? CheckCircle2
      : status === "checking"
      ? Loader2
      : status === "idle"
      ? Loader2
      : XCircle;

  const tone =
    status === "ok"
      ? "text-emerald-400 border-emerald-400/30"
      : status === "checking" || status === "idle"
      ? "text-muted-foreground border-primary/20"
      : "text-destructive border-destructive/40";

  return (
    <div
      className={`mt-6 flex flex-col items-center gap-2 rounded-full border ${tone} bg-card/40 px-4 py-2 backdrop-blur sm:flex-row`}
    >
      <div className="flex items-center gap-2">
        <Icon
          className={`h-3.5 w-3.5 ${status === "checking" ? "animate-spin" : ""}`}
        />
        <span className="text-[10px] uppercase tracking-[0.25em]">
          Pi Verification:{" "}
          {status === "ok"
            ? "Verified"
            : status === "checking" || status === "idle"
            ? "Checking…"
            : status === "mismatch"
            ? "Mismatch"
            : "Unreachable"}
        </span>
      </div>
      {detail && (
        <span className="text-[10px] tracking-wider text-muted-foreground/70">
          · {detail}
        </span>
      )}
      <a
        href="/validation-key.txt"
        target="_blank"
        rel="noreferrer"
        className="ml-1 inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.25em] text-primary hover:underline"
      >
        Open file <ExternalLink className="h-3 w-3" />
      </a>
      <button
        onClick={runCheck}
        className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground hover:text-foreground"
      >
        Recheck
      </button>
    </div>
  );
}
