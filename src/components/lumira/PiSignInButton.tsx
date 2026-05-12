import { CheckCircle2, Loader2, LogIn, AlertTriangle } from "lucide-react";
import { usePiAuth } from "./pi-auth-context";
import { useT } from "./i18n";

export function PiSignInButton() {
  const { user, status, error, signIn } = usePiAuth();
  const { lang } = useT();
  const isAr = lang === "ar";

  const busy = status === "initializing" || status === "authenticating" || status === "verifying";

  if (status === "authenticated" && user) {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-emerald-300"
        title={user.uid}
      >
        <CheckCircle2 className="h-3 w-3" />@{user.username}
      </span>
    );
  }

  return (
    <button
      onClick={() => void signIn()}
      disabled={busy}
      title={error ?? undefined}
      className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-card/40 px-3 py-1 text-[10px] uppercase tracking-[0.3em] text-primary backdrop-blur transition hover:shadow-[var(--glow-soft)] disabled:opacity-70"
    >
      {busy ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : status === "error" ? (
        <AlertTriangle className="h-3 w-3 text-destructive" />
      ) : (
        <LogIn className="h-3 w-3" />
      )}
      {busy
        ? isAr ? "جاري الدخول…" : "Signing in…"
        : status === "error"
          ? isAr ? "حاول مجدداً" : "Retry"
          : isAr ? "دخول Pi" : "Sign in with Pi"}
    </button>
  );
}
