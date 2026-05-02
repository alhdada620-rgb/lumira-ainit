import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, XCircle, Loader2, ExternalLink, RefreshCw, AlertTriangle, Wand2 } from "lucide-react";
import { z } from "zod";
import { useT } from "./i18n";

const EXPECTED_KEY =
  "f51bf3dbe299a0b14c34f9600f4da97c80967509828e08f6cb9358c4e6f2c5dd71917a163a4cb882482fa0afb195abd842775e25c5ed5bcbef3a9bf92bf9c81c";

const DOMAIN_STORAGE_KEY = "lumira:pi-verification-domain";

type Status = "idle" | "checking" | "ok" | "mismatch" | "error";

const HOSTNAME_RE =
  /^(?=.{1,253}$)([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i;

const domainSchema = z
  .string()
  .trim()
  .max(2048, { message: "URL is too long (max 2048 characters)" })
  .refine((v) => !/\s/.test(v), { message: "URL cannot contain spaces" })
  .refine(
    (v) => {
      if (!v) return true;
      const stripped = v.replace(/^https?:\/\//i, "").replace(/\/.*$/, "");
      return stripped.length > 0;
    },
    { message: "Missing hostname after protocol" },
  )
  .refine(
    (v) => {
      if (!v) return true;
      let candidate = v;
      if (!/^https?:\/\//i.test(candidate)) candidate = `https://${candidate}`;
      try {
        const u = new URL(candidate);
        if (u.protocol !== "https:" && u.protocol !== "http:") return false;
        if (!u.hostname || u.hostname === "localhost") return false;
        return HOSTNAME_RE.test(u.hostname);
      } catch {
        return false;
      }
    },
    { message: "Enter a valid domain like https://your-site.com" },
  );

function validateDomain(value: string): string | null {
  const result = domainSchema.safeParse(value);
  if (result.success) return null;
  return result.error.issues[0]?.message ?? "Invalid URL";
}

function buildTargetUrl(domain: string): string {
  const trimmed = domain.trim();
  if (!trimmed) return "/validation-key.txt";
  let base = trimmed.replace(/\/+$/, "");
  if (!/^https?:\/\//i.test(base)) {
    base = `https://${base}`;
  }
  base = base.replace(/\/validation-key\.txt$/i, "");
  return `${base}/validation-key.txt`;
}

/**
 * Best-effort normalization for the domain input:
 * - Trims whitespace and strips internal spaces
 * - Drops common copy-paste noise (surrounding quotes, trailing punctuation)
 * - Removes leading "@" and "://" typos
 * - Adds https:// if no protocol
 * - Lowercases the protocol + hostname
 * - Removes trailing slashes and a trailing /validation-key.txt
 */
function normalizeDomain(raw: string): string {
  if (!raw) return "";
  let v = raw.trim();
  if (!v) return "";
  // Strip wrapping quotes/backticks
  v = v.replace(/^["'`]+|["'`]+$/g, "");
  // Remove all internal whitespace
  v = v.replace(/\s+/g, "");
  // Drop trailing punctuation often pasted from sentences
  v = v.replace(/[.,;:!?]+$/g, "");
  // Fix "@host.com" → "host.com"
  v = v.replace(/^@+/, "");
  // Fix accidental "://host" without scheme
  v = v.replace(/^:\/+/, "");
  // Collapse "https:/host" → "https://host"
  v = v.replace(/^(https?):\/(?!\/)/i, "$1://");
  // Add https:// if missing
  if (!/^https?:\/\//i.test(v)) {
    v = `https://${v}`;
  }
  try {
    const u = new URL(v);
    u.protocol = u.protocol.toLowerCase();
    const host = u.hostname.toLowerCase();
    // Rebuild to drop path/search/hash and trailing slashes
    let out = `${u.protocol}//${host}`;
    if (u.port) out += `:${u.port}`;
    return out;
  } catch {
    // Fallback: collapse multiple slashes after scheme, strip trailing /
    return v
      .replace(/^(https?:\/\/)\/+/i, "$1")
      .replace(/\/validation-key\.txt$/i, "")
      .replace(/\/+$/, "");
  }
}


export function PiVerification() {
  const { t } = useT();
  const [mounted, setMounted] = useState(false);
  const [domain, setDomain] = useState<string>("");
  const [touched, setTouched] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [httpCode, setHttpCode] = useState<number | null>(null);
  const [detail, setDetail] = useState<string>("");
  const [lastCheckedAt, setLastCheckedAt] = useState<string>("");
  const [lastUrl, setLastUrl] = useState<string>("");

  const validationError = useMemo(() => validateDomain(domain), [domain]);
  const showError = touched && !!validationError;

  const runCheck = async (overrideDomain?: string) => {
    const useDomain = overrideDomain ?? domain;
    // Block invalid input — empty is allowed (falls back to relative path)
    const err = validateDomain(useDomain);
    if (err) {
      setTouched(true);
      setStatus("error");
      setHttpCode(null);
      setDetail(err);
      setLastUrl("");
      setLastCheckedAt(new Date().toLocaleTimeString());
      return;
    }
    const url = buildTargetUrl(useDomain);
    setLastUrl(url);
    setStatus("checking");
    setDetail("");
    setHttpCode(null);
    try {
      const res = await fetch(url, { cache: "no-store", mode: "cors" });
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
      setDetail(
        e instanceof Error
          ? `${e.message} (CORS or network — try opening the file link)`
          : "Network error",
      );
      setLastCheckedAt(new Date().toLocaleTimeString());
    }
  };

  useEffect(() => {
    setMounted(true);
    let initial = "";
    try {
      initial = localStorage.getItem(DOMAIN_STORAGE_KEY) ?? "";
    } catch {
      // ignore
    }
    setDomain(initial);
    runCheck(initial);
  }, []);

  const handleSaveAndCheck = () => {
    setTouched(true);
    if (validateDomain(domain)) {
      runCheck();
      return;
    }
    try {
      if (domain.trim()) {
        localStorage.setItem(DOMAIN_STORAGE_KEY, domain.trim());
      } else {
        localStorage.removeItem(DOMAIN_STORAGE_KEY);
      }
    } catch {
      // ignore
    }
    runCheck();
  };

  const handleClearDomain = () => {
    setDomain("");
    setTouched(false);
    try {
      localStorage.removeItem(DOMAIN_STORAGE_KEY);
    } catch {
      // ignore
    }
    runCheck("");
  };

  const handleAutoFix = () => {
    const fixed = normalizeDomain(domain);
    setDomain(fixed);
    setTouched(true);
  };

  const normalizedPreview = useMemo(() => normalizeDomain(domain), [domain]);
  const canAutoFix =
    !!domain.trim() &&
    normalizedPreview !== domain &&
    !validateDomain(normalizedPreview);


  if (!mounted) return null;

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
      ? t("piverif.label.verified")
      : status === "checking" || status === "idle"
      ? t("piverif.label.checking")
      : status === "mismatch"
      ? t("piverif.label.mismatch")
      : t("piverif.label.unreachable");

  const fileLink = buildTargetUrl(domain);

  return (
    <div className="mt-6 flex w-full max-w-xl flex-col items-center gap-3">
      <div
        className={`flex flex-wrap items-center justify-center gap-2 rounded-full border ${tone} bg-card/40 px-4 py-2 backdrop-blur`}
      >
        <Icon
          className={`h-3.5 w-3.5 ${status === "checking" ? "animate-spin" : ""}`}
        />
        <span className="text-[10px] uppercase tracking-[0.25em]">
          {t("piverif.title")} {label}
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

      <div className="flex w-full flex-col gap-2 rounded-2xl border border-primary/20 bg-card/40 p-3 backdrop-blur">
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
          <input
            type="url"
            inputMode="url"
            placeholder={t("piverif.placeholder")}
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            onBlur={() => setTouched(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveAndCheck();
            }}
            aria-invalid={showError}
            aria-describedby={showError ? "pi-domain-error" : undefined}
            className={`flex-1 rounded-full border bg-background/40 px-4 py-2 text-xs tracking-wider text-foreground placeholder:text-muted-foreground/50 focus:outline-none ${
              showError
                ? "border-destructive/60 focus:border-destructive"
                : "border-primary/20 focus:border-primary/60"
            }`}
          />
          <button
            type="button"
            onClick={handleSaveAndCheck}
            disabled={status === "checking" || showError}
            className="inline-flex items-center justify-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-[10px] uppercase tracking-[0.25em] text-primary transition hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3 w-3 ${status === "checking" ? "animate-spin" : ""}`}
            />
            {t("piverif.verify")}
          </button>
          {canAutoFix && (
            <button
              type="button"
              onClick={handleAutoFix}
              title={`Normalize to ${normalizedPreview}`}
              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-4 py-2 text-[10px] uppercase tracking-[0.25em] text-accent transition hover:bg-accent/20"
            >
              <Wand2 className="h-3 w-3" />
              {t("piverif.autofix")}
            </button>
          )}
          {domain && (
            <button
              type="button"
              onClick={handleClearDomain}
              className="rounded-full border border-border/40 px-3 py-2 text-[10px] uppercase tracking-[0.25em] text-muted-foreground hover:text-foreground"
            >
              {t("piverif.clear")}
            </button>
          )}
        </div>
        {showError && (
          <p
            id="pi-domain-error"
            role="alert"
            className="flex flex-wrap items-center gap-1.5 text-[10px] tracking-wider text-destructive"
          >
            <AlertTriangle className="h-3 w-3" />
            {validationError}
            {canAutoFix && (
              <span className="text-muted-foreground/80">
                · {t("piverif.autofixHint")} <span className="text-accent">{t("piverif.autofix")}</span> {t("piverif.autofixHint.use")}{" "}
                <span className="font-medium text-foreground">{normalizedPreview}</span>
              </span>
            )}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <a
          href={fileLink}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.25em] text-muted-foreground hover:text-foreground"
        >
          {t("piverif.openFile")} <ExternalLink className="h-3 w-3" />
        </a>
        {lastUrl && (
          <span className="max-w-full truncate text-[9px] tracking-widest text-muted-foreground/60">
            {t("piverif.target")} {lastUrl}
          </span>
        )}
      </div>

      {lastCheckedAt && (
        <span className="text-[9px] tracking-[0.3em] text-muted-foreground/60">
          {t("piverif.lastChecked", { time: lastCheckedAt })}
        </span>
      )}
    </div>
  );
}
